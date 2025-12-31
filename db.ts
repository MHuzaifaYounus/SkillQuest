
import { neon } from '@neondatabase/serverless';
import CryptoJS from 'crypto-js';
import { Skill, User } from './types';

// Using the provided connection string
const connectionString = 'postgresql://neondb_owner:npg_tYXQ8UPTNB7O@ep-lively-cell-a4qbdrbc-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

export const initDb = async () => {
  try {
    // 1. Ensure the users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
    `;

    // 2. Perform manual migrations for existing tables that might be missing new columns
    // Postgres 9.6+ supports ADD COLUMN IF NOT EXISTS
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT;`;
    
    // 3. Ensure the skills table exists
    await sql`
      CREATE TABLE IF NOT EXISTS skills (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        level TEXT NOT NULL,
        icon TEXT,
        notes TEXT,
        checklist JSONB,
        created_at BIGINT
      );
    `;
    
    console.log('Database initialized and migrated successfully');
  } catch (err) {
    console.error('CRITICAL: Database initialization/migration failed:', err);
    throw err;
  }
};

const hashPassword = (password: string) => {
  return CryptoJS.SHA256(password).toString();
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signUp = async (email: string, password: string, fullName: string): Promise<{ user: User; otp: string }> => {
  try {
    const passwordHash = hashPassword(password);
    const otp = generateOtp();
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, verification_code, is_verified)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${fullName}, ${otp}, FALSE)
      RETURNING id, email;
    `;
    return { user: result[0] as User, otp };
  } catch (err: any) {
    console.error('SignUp DB Error:', err);
    throw err;
  }
};

export const verifyEmailCode = async (email: string, code: string): Promise<User | null> => {
  try {
    const result = await sql`
      UPDATE users 
      SET is_verified = TRUE, verification_code = NULL
      WHERE LOWER(email) = ${email.toLowerCase()} AND verification_code = ${code}
      RETURNING id, email;
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (err) {
    console.error('Verify DB Error:', err);
    throw err;
  }
};

export const login = async (email: string, password: string): Promise<User | null> => {
  try {
    const passwordHash = hashPassword(password);
    const result = await sql`
      SELECT id, email FROM users
      WHERE LOWER(email) = ${email.toLowerCase()} AND password_hash = ${passwordHash} AND is_verified = TRUE;
    `;
    return result.length > 0 ? (result[0] as User) : null;
  } catch (err) {
    console.error('Login DB Error:', err);
    throw err;
  }
};

export const fetchUserSkills = async (userId: string): Promise<Skill[]> => {
  const result = await sql`
    SELECT * FROM skills WHERE user_id = ${userId} ORDER BY created_at DESC;
  `;
  return result.map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    level: row.level,
    icon: row.icon,
    notes: row.notes,
    checklist: row.checklist,
    createdAt: Number(row.created_at)
  })) as Skill[];
};

export const upsertSkill = async (userId: string, skill: Skill) => {
  await sql`
    INSERT INTO skills (id, user_id, name, level, icon, notes, checklist, created_at)
    VALUES (${skill.id}, ${userId}, ${skill.name}, ${skill.level}, ${skill.icon}, ${skill.notes}, ${JSON.stringify(skill.checklist)}, ${skill.createdAt})
    ON CONFLICT (id) DO UPDATE SET
      level = EXCLUDED.level,
      icon = EXCLUDED.icon,
      notes = EXCLUDED.notes,
      checklist = EXCLUDED.checklist;
  `;
};

export const removeSkill = async (skillId: string) => {
  await sql`DELETE FROM skills WHERE id = ${skillId};`;
};
