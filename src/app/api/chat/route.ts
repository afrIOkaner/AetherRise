import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAetherEngine } from "@/lib/ai-engine"; 
import { AETHER_CONFIG } from "@/lib/business-config";

/**
 * @file route.ts
 * @description Enhanced API Route with Sync Status tracking and optimized DB persistence.
 */

export async function POST(req: Request) {
  try {
    const { messages, userId, isPro, university, department } = await req.json();
    const lastMessage = messages[messages.length - 1].content;
    
    // 1. Role Validation
    const validatedRole = isPro ? "student" : "guest"; 

    // 2. Execute Aether Engine (Sync to GitHub enabled)
    const aiResponse = await runAetherEngine({
      prompt: lastMessage,
      userId: userId,
      userRole: validatedRole,
      university: university || AETHER_CONFIG.BRAND.INSTITUTION,
      department: department || AETHER_CONFIG.BRAND.DEPARTMENT,
      syncToGithub: true 
    });

    // 3. Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 4. Persistence Logic
    if (userId && userId !== "anonymous") {
      // Usage increment tracking
      try {
        await supabase.rpc('increment_usage', { user_id_input: userId });
      } catch (e) {
        console.error("[RPC_ERROR]: Usage limit tracking failed.");
      }

      // Check if GitHub Sync was successful
      const isSynced = !!aiResponse.githubUrl;

      // Insert into 'aether_notes' with all metadata
      const { error: insertError } = await supabase.from("aether_notes").insert({
        user_id: userId,
        content: aiResponse.content,
        github_url: aiResponse.githubUrl || null,
        sync_status: isSynced ? 'completed' : 'failed', // Sync status tracking
        university: university || AETHER_CONFIG.BRAND.INSTITUTION,
        department: department || AETHER_CONFIG.BRAND.DEPARTMENT,
        word_count: aiResponse.content.split(/\s+/).length,
        model_provider: aiResponse.provider // Which model was used for generation
      });

      if (insertError) {
        console.error("[VAULT_ERROR]:", insertError.message);
      }
    }

    // 5. Success Response
    return NextResponse.json({ 
      text: aiResponse.content, 
      model: aiResponse.provider,
      githubUrl: aiResponse.githubUrl 
    });

  } catch (error: any) {
    console.error("[ROUTE_CRITICAL_ERROR]:", error);
    return NextResponse.json(
      { error: "Neural Grid Timeout. Please synchronize again in 30s." }, 
      { status: 500 }
    );
  }
}