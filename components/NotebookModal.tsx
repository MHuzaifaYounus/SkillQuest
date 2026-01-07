
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Skill, ChecklistItem, SkillLevel } from '../types';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from "@google/genai";

interface MCQ {
  question: string;
  options: { text: string; id: string; feedback: string }[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
  mcq?: MCQ;
}

interface NotebookModalProps {
  skill: Skill;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Skill>) => void;
}

// --- Audio Utilities ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const getLevelDisplay = (level: SkillLevel) => {
  switch (level) {
    case SkillLevel.DAILY: return "Daily (Beginner)";
    case SkillLevel.WEEKLY: return "Weekly (Intermediate)";
    case SkillLevel.MONTHLY: return "Monthly (Advanced)";
    case SkillLevel.PASSIVE: return "Passive (Master)";
    default: return level;
  }
};

const cleanJsonResponse = (text: string | undefined): string => {
  if (!text) return '{}';
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned.trim() || '{}';
};

const NotebookModal: React.FC<NotebookModalProps> = ({ skill, onClose, onUpdate }) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(Array.isArray(skill.checklist) ? skill.checklist : []);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'checklist' | 'chat'>('checklist');
  const [messages, setMessages] = useState<Message[]>(Array.isArray(skill.chat_history) ? skill.chat_history : []);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice Session State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const voiceSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const [mentorAvatar, setMentorAvatar] = useState(skill.mentor_avatar || '');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync Checklist
  useEffect(() => {
    const timer = setTimeout(() => {
      const checklistChanged = JSON.stringify(checklist) !== JSON.stringify(skill.checklist);
      if (checklistChanged) {
        setIsSaving(true);
        onUpdate(skill.id, { checklist: checklist });
        setTimeout(() => setIsSaving(false), 800);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [checklist, skill.id, skill.checklist, onUpdate]);

  // Sync Chat History
  useEffect(() => {
    const chatChanged = JSON.stringify(messages) !== JSON.stringify(skill.chat_history);
    if (chatChanged && messages.length > 0) {
      onUpdate(skill.id, { chat_history: messages });
    }
  }, [messages, skill.id, skill.chat_history, onUpdate]);

  // Generate Avatar
  useEffect(() => {
    if (!mentorAvatar && !isGeneratingAvatar) {
      (async () => {
        setIsGeneratingAvatar(true);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: `A photorealistic close-up portrait of a wise grandmaster mentor specialized in ${skill.name}. Highly detailed, cinematic lighting.` }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
          });
          
          const candidate = response?.candidates?.[0];
          const parts = candidate?.content?.parts;
          if (parts) {
            const part = parts.find(p => p.inlineData);
            if (part?.inlineData) {
              const base64 = `data:image/png;base64,${part.inlineData.data}`;
              setMentorAvatar(base64);
              onUpdate(skill.id, { mentor_avatar: base64 });
            }
          }
        } catch (e) { 
          console.error("Avatar error:", e); 
        } finally { 
          setIsGeneratingAvatar(false); 
        }
      })();
    }
  }, [skill.name, mentorAvatar, isGeneratingAvatar, skill.id, onUpdate]);

  // Auto-switch to chat for diagnostic
  useEffect(() => {
    if (checklist.length === 0 && viewMode === 'checklist') {
      setViewMode('chat');
    }
  }, [checklist.length, viewMode]);

  // Sequential Diagnostic Effect
  useEffect(() => {
    if (viewMode === 'chat' && messages.length === 0 && checklist.length === 0 && !isChatting) {
      (async () => {
        setIsChatting(true);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Diagnostic start for ${skill.name}. Box level: ${getLevelDisplay(skill.level)}.`,
            config: {
              systemInstruction: `You are the Grandmaster Mentor. Start an assessment.
              1. Greet the user. 
              2. Explain: "I'm your mentor for ${skill.name}. To build your roadmap for the ${getLevelDisplay(skill.level)} tier, I need to identify your level."
              3. Ask the FIRST of exactly 4 diagnostic MCQ questions.
              Return JSON: { "text": "Greeting", "question": "Q1", "options": [{"id":"A","text":"...","feedback":"..."}] }`,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        feedback: { type: Type.STRING }
                      },
                      required: ["id", "text", "feedback"]
                    }
                  }
                },
                required: ["text", "question", "options"]
              }
            }
          });
          
          const responseText = response?.text;
          if (responseText) {
            try {
              const data = JSON.parse(cleanJsonResponse(responseText));
              const introText = `${data.text || ''}\n\n${data.question || ''}`;
              setMessages([{ role: 'model', text: introText, mcq: data as MCQ }]);
            } catch (parseErr) {
              setMessages([{ role: 'model', text: `Welcome. I am your mentor for ${skill.name}. Let's assess your level.` }]);
            }
          }
        } catch (e) {
          console.error("Diagnostic start error:", e);
          setMessages([{ role: 'model', text: `Welcome. I am your mentor for ${skill.name}. Let's assess your level.` }]);
        } finally { setIsChatting(false); }
      })();
    }
  }, [viewMode, messages.length, checklist.length, isChatting, skill.name, skill.level]);

  const handleSendMessage = async (input: string, optionFeedback?: string) => {
    if (!input.trim() || isChatting) return;
    const userMessage = input.trim();
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(updatedMessages);
    setChatInput('');
    setIsChatting(true);

    const userCount = updatedMessages.filter(m => m.role === 'user').length;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // PHASE 1: Diagnostic Questions (1 to 4)
      if (checklist.length === 0 && userCount < 4) {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Skill: ${skill.name}. Question ${userCount + 1} of 4. User Answer: "${userMessage}".`,
          config: {
            systemInstruction: `You are in diagnostic phase. Ask question ${userCount + 1} of 4. 
            Return JSON: { "question": "...", "options": [...] }`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { id: { type: Type.STRING }, text: { type: Type.STRING }, feedback: { type: Type.STRING } }
                  }
                }
              },
              required: ["question", "options"]
            }
          }
        });
        
        const responseText = response?.text;
        if (responseText) {
          try {
            const data = JSON.parse(cleanJsonResponse(responseText));
            setMessages([...updatedMessages, { role: 'model', text: data.question || "Continue.", mcq: data as MCQ }]);
          } catch (e) {
            setMessages([...updatedMessages, { role: 'model', text: "Please continue. Tell me more about your experience." }]);
          }
        }
      } 
      // PHASE 2: Generation after 4 answers
      else if (checklist.length === 0 && userCount >= 4) {
        setIsGenerating(true);
        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Assessment complete for ${skill.name}. Tier: ${getLevelDisplay(skill.level)}. History: ${JSON.stringify(updatedMessages.filter(m => m.role === 'user').map(m => m.text))}`,
          config: {
            systemInstruction: `Create a mastery roadmap. 
            Checklist must be sized for the ${getLevelDisplay(skill.level)} box:
            - Daily: Habit-based repeatable tasks.
            - Weekly: Milestones to hit once a week.
            - Monthly: Major review/project goals.
            - Passive: Maintenance reminders.
            Return JSON: { "mentor_summary": "Analysis of their level", "icon": "emoji", "checklist": [{"title":"...", "description":"..."}] }`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                mentor_summary: { type: Type.STRING },
                icon: { type: Type.STRING },
                checklist: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }
                  }
                }
              },
              required: ["mentor_summary", "icon", "checklist"]
            }
          }
        });
        
        const responseText = analysisResponse?.text;
        if (responseText) {
          try {
            const result = JSON.parse(cleanJsonResponse(responseText));
            if (result && Array.isArray(result.checklist)) {
              const newItems: ChecklistItem[] = result.checklist.map((i: any) => ({
                id: crypto.randomUUID(),
                text: i.title || 'Step',
                description: i.description || '',
                completed: false
              }));
              setChecklist(newItems);
              setMessages([...updatedMessages, { role: 'model', text: `${result.mentor_summary || 'Your path is clear.'}\n\nI have structured your roadmap in the Checklist tab.` }]);
              onUpdate(skill.id, { icon: result.icon || '🎯', checklist: newItems, mentor_context: result.mentor_summary });
            }
          } catch (e) {
            setMessages([...updatedMessages, { role: 'model', text: "I have processed your assessment. Let's start with some foundational steps." }]);
          }
        }
        setIsGenerating(false);
      } 
      // PHASE 3: Normal Chat
      else {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Skill: ${skill.name}. Context: ${skill.mentor_context}. User: "${userMessage}".`,
          config: {
            systemInstruction: "You are the Grandmaster Mentor. Give encouraging, socratic advice.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: { text: { type: Type.STRING } },
              required: ["text"]
            }
          }
        });
        
        const responseText = response?.text;
        if (responseText) {
          try {
            const data = JSON.parse(cleanJsonResponse(responseText));
            setMessages([...updatedMessages, { role: 'model', text: data.text || "Continue your journey." }]);
          } catch (e) {
            setMessages([...updatedMessages, { role: 'model', text: "Wise words. Continue your path with diligence." }]);
          }
        }
      }
    } catch (e) {
      console.error("Message handling error:", e);
      setMessages([...updatedMessages, { role: 'model', text: "The Mastery Nexus is temporarily disconnected. Please try again." }]);
    } finally {
      setIsChatting(false);
    }
  };

  const startVoiceSession = async () => {
    if (isVoiceActive) return;
    setIsVoiceActive(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (m: LiveServerMessage) => {
            const audioData = m?.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              activeSourcesRef.current.add(source);
            }
          },
          onclose: () => stopVoiceSession(),
          onerror: () => stopVoiceSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: `Socratic mentor for ${skill.name}. Short, wise, encouraging.`,
        }
      });
      voiceSessionRef.current = sessionPromise;
    } catch (e) {
      console.error("Voice Error:", e);
      setIsVoiceActive(false);
    }
  };

  const stopVoiceSession = useCallback(() => {
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (outputAudioContextRef.current) outputAudioContextRef.current.close().catch(() => {});
    activeSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    activeSourcesRef.current.clear();
    setIsVoiceActive(false);
  }, []);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const progressPercent = checklist.length > 0 ? Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full md:max-w-4xl bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col h-[95vh] md:h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl bg-blue-500/10 transition-transform ${isGenerating ? 'animate-spin' : ''}`}>
              {skill.icon || '🎯'}
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{skill.name}</h2>
              <span className="text-[10px] uppercase tracking-widest font-black text-blue-400">{getLevelDisplay(skill.level)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950/30 p-2 gap-2 border-b border-slate-800">
          <button 
            disabled={checklist.length === 0}
            onClick={() => setViewMode('checklist')} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${checklist.length === 0 ? 'opacity-20 cursor-not-allowed' : ''} ${viewMode === 'checklist' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Checklist
          </button>
          <button onClick={() => setViewMode('chat')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'chat' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            Mentor Chat {checklist.length === 0 && ' (Assessment)'}
          </button>
          {viewMode === 'chat' && (
            <button onClick={isVoiceActive ? stopVoiceSession : startVoiceSession} className={`ml-auto px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceActive ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {isVoiceActive ? 'Voice Active' : 'Voice Link'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-6 custom-scrollbar relative ${isGenerating ? 'opacity-40 pointer-events-none' : ''}`}>
          {viewMode === 'checklist' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase">Milestones</h3>
                <span className="text-3xl font-black text-blue-500">{progressPercent}%</span>
              </div>
              {checklist.map(item => (
                <div key={item.id} onClick={() => toggleChecklistItem(item.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${item.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'}`}>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${item.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'}`}>
                    {item.completed && <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${item.completed ? 'text-slate-500 line-through' : 'text-white'}`}>{item.text}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 space-y-6 pb-20">
                <div className="flex justify-center mb-8">
                  {mentorAvatar && <img src={mentorAvatar} alt="Master" className="w-24 h-24 rounded-full border-2 border-purple-500/50 object-cover shadow-2xl" />}
                </div>
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700 shadow-xl'}`}>
                      <p className="text-sm font-medium whitespace-pre-wrap">{m.text}</p>
                    </div>
                    {m.mcq && i === messages.length - 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 w-full">
                        {m.mcq.options.map(o => (
                          <button key={o.id} onClick={() => handleSendMessage(o.text, o.feedback)} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group">
                            <span className="text-blue-500 mr-2 group-hover:scale-110 inline-block">{o.id}.</span> {o.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isChatting && <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Consulting the Nexus...</div>}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={e => { e.preventDefault(); handleSendMessage(chatInput); }} className="sticky bottom-0 bg-slate-900 py-4 border-t border-slate-800 flex gap-2">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isChatting} placeholder="Identify yourself..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
                <button type="submit" disabled={isChatting || !chatInput.trim()} className="px-6 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform">Send</button>
              </form>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-black italic uppercase text-white">Architecting Roadmap</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black animate-pulse">Personalizing to your level...</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] flex justify-between items-center">
          <span>{isVoiceActive ? 'Voice Link Established' : viewMode === 'chat' ? 'Diagnostic Phase' : 'Pathway Active'}</span>
          {isSaving && <span className="text-blue-500">Syncing...</span>}
        </div>
      </div>
    </div>
  );
};

export default NotebookModal;
