import { NextResponse } from 'next/server';
import { runAetherEngine } from '@/lib/ai-engine';
import { supabase } from '@/lib/supabase';

/**
 * @file route.ts
 * @description Master Intelligence Orchestrator for AetherRise.
 * Finalized for Goal 1-13: Multimodal, Quota Enforcement, and Thesis Precision.
 * FIXED: Parameter mismatch for RPC and UUID handling.
 */

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      prompt, 
      image, 
      userRole = "Senior Statistician", 
      studentLevel = "Graduate", 
      userId, // Expected as UUID string
      sessionID, 
      syncToGithub = true,
      preferredLanguage = "Bengali", 
      university = "Begum Rokeya University, Rangpur", 
      department = "Statistics"
    } = body;

    // 1. Structural Validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { status: "Error", message: "Analytical prompt is required for engine execution." }, 
        { status: 400 }
      );
    }

    /**
     * 2. Goal 12: Advanced Usage & Quota Policy
     * Validates user limits before firing the AI engine to save resources.
     */
    const isRegisteredUser = userId && userId.length > 20 && userId !== "guest-user";

    if (isRegisteredUser) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('daily_usage_count')
        .eq('id', userId)
        .maybeSingle();

      if (!profileError && profile && profile.daily_usage_count >= 15) {
        return NextResponse.json(
          { 
            status: "Quota Exceeded", 
            message: "Academic daily limit reached (15/15). Capacity resets at 00:00 UTC." 
          }, 
          { status: 429 }
        );
      }
    }

    /**
     * 3. Goal 7: High-Fidelity Intelligence Context
     * Explicitly injects academic identity into the AI's "brain".
     */
    const systemContext = `
      PRIMARY ROLE: Senior Data Scientist & Statistical Consultant.
      INSTITUTIONAL CONTEXT: ${university}, Dept of ${department}.
      STUDENT LEVEL: ${studentLevel}.
      
      CORE INSTRUCTIONS:
      1. Use Advanced LaTeX for all statistical models (Regression, Time Series, Panel Data).
      2. If the prompt is research-related, provide deep methodology insights.
      3. Language: Always explain in ${preferredLanguage} as per user preference.
      4. Ensure English technical terms are kept in brackets where necessary.
      
      USER PROMPT: ${prompt}
    `;
    
    // 4. Goal 10: Multimodal Execution (Gemini/Groq Failover)
    const aiResponse = await runAetherEngine({
      prompt: systemContext,
      image: image || null,
      userRole,
      studentLevel,
      userId: userId || "guest-user",
      sessionID: sessionID || `sess_${Date.now()}`,
      syncToGithub,
      preferredLanguage
    });

    // 5. Analytics Metadata
    const wordCount = aiResponse.content?.trim().split(/\s+/).length || 0;

    const dbEntry = {
      user_id: isRegisteredUser ? userId : null, // Ensured UUID or null
      content: aiResponse.content,
      topic: prompt.substring(0, 150).replace(/[#*`]/g, '').trim(), 
      provider: aiResponse.provider,
      github_url: aiResponse.githubUrl || null,
      university,
      department,
      language: preferredLanguage,
      student_level: studentLevel,
      session_id: sessionID || `sess_${Date.now()}`,
      word_count: wordCount,
      is_favorite: false,
      tags: ["Thesis-Grade", department, "Verified-Analysis"]
    };

    /**
     * 6. Goal 5: Permanent Persistence
     * Saves to 'aether_notes' and triggers usage increment.
     */
    const { error: dbError } = await supabase
      .from('aether_notes')
      .insert([dbEntry]);

    if (!dbError && isRegisteredUser) {
      // FIXED: Parameter name changed from 'user_id' to 'target_user_id' to match updated SQL function
      await supabase.rpc('increment_usage', { target_user_id: userId });
    }

    // 7. Final Clean Response
    return NextResponse.json({
      status: "Success",
      payload: {
        content: aiResponse.content,
        provider: aiResponse.provider,
        github_url: aiResponse.githubUrl || null,
        wordCount,
        timestamp: new Date().toISOString(),
        noteId: dbEntry.session_id // Passing session_id as a reference for feedback
      }
    });

  } catch (error: unknown) {
    console.error("[AETHER_ENGINE_CRITICAL]:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { 
        status: "Critical Failure", 
        message: "Aether Engine encountered an internal orchestration error.",
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }, 
      { status: 500 }
    );
  }
}