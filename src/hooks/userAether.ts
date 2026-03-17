import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { AETHER_CONFIG } from "@/lib/business-config";
import { ChatMessage } from "@/lib/types";

export const useAether = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!user || !profile) return;

    if (
      profile.tier === "free" &&
      (profile.daily_usage_count ?? 0) >=
        AETHER_CONFIG.LIMITS.FREE_NOTES_PER_DAY
    ) {
      alert("Daily limit reached! Please upgrade to Pro.");
      return;
    }

    setIsLoading(true);

    const newUserMessage: ChatMessage = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, newUserMessage]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          query: text,
          university: profile.university,
          department: profile.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to get AI response.");
      }

      if (!data?.text) {
        throw new Error("Empty response from AI.");
      }

      const aiMessage: ChatMessage = {
        role: "model",
        content: data.text,
      };

      setMessages((prev) => [...prev, aiMessage]);

      await saveToVault(text, data.text);
    } catch (error) {
      console.error("Aether Engine Error:", error);

      const errorMessage: ChatMessage = {
        role: "model",
        content: "Something went wrong. Please try again.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToVault = async (topic: string, content: string) => {
    if (!user) return;

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const { error } = await supabase.from("aether_notes").insert([
      {
        user_id: user.id,
        topic: topic.substring(0, 100),
        content,
        university: profile?.university || "BRUR",
        department: profile?.department || "Statistics",
        word_count: wordCount,
      },
    ]);

    if (!error) {
      await supabase.rpc("increment_usage", { user_id: user.id });
    }
  };

  return { messages, sendMessage, isLoading };
};