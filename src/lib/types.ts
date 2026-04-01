/**
 * @file types.ts
 * @description Centralized Type Definitions for AetherRise.
 */

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  university: string;
  department: string;
  tier: 'free' | 'pro';
  daily_usage_count: number;
  last_ip?: string;
  created_at: string;
}

export interface AetherNote {
  id: string;
  user_id: string;
  topic: string;
  content: string;
  raw_response?: Record<string, unknown>;
  university: string;
  department: string;
  word_count: number;
  created_at: string;
  github_url?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}