import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { AETHER_CONFIG } from '@/lib/business-config';
import { ChatMessage } from '@/lib/types';

export const useAether = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!user || !profile) return;

    // 1. Check Usage Limit (Point 1 & 26)
    if (profile.tier === 'free' && profile.daily_usage_count >= AETHER_CONFIG.LIMITS.FREE_NOTES_PER_DAY) {
      alert("Daily limit reached! Please upgrade to Pro.");
      return;
    }

    setIsLoading(true);
    const newUserMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // 2. Call our Chat API (src/app/api/chat/route.ts)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          modelType: profile.tier === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash',
          university: profile.university,
          department: profile.department
        }),
      });

      const data = await response.json();

      if (data.text) {
        const aiMessage: ChatMessage = { role: 'model', content: data.text };
        setMessages((prev) => [...prev, aiMessage]);

        // 3. Auto-Save to Database (Point 9)
        await saveToVault(text, data.text);
      }
    } catch (error) {
      console.error("Aether Engine Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToVault = async (topic: string, content: string) => {
    if (!user) return;

    const wordCount = content.split(/\s+/).length;

    const { error } = await supabase.from('aether_notes').insert([
      {
        user_id: user.id,
        topic: topic.substring(0, 100),
        content: content,
        university: profile?.university || 'BRUR',
        department: profile?.department || 'Statistics',
        word_count: wordCount
      }
    ]);

    if (!error) {
      // Update local usage count
      await supabase.rpc('increment_usage', { user_id: user.id });
    }
  };

  return { messages, sendMessage, isLoading };
};