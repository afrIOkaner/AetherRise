import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function toBase64(value: string) {
  return Buffer.from(value, "utf-8").toString("base64");
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const body = await req.json();
    const title = body?.title?.trim() || "Untitled Note";
    const content = body?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("github_token, github_repo")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_token || !profile?.github_repo) {
      return NextResponse.json(
        { error: "GitHub not connected or repository not selected." },
        { status: 400 }
      );
    }

    const safeTitle = title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-");
    const fileName = `notes/${safeTitle}-${Date.now()}.md`;

    const githubRes = await fetch(
      `https://api.github.com/repos/${profile.github_repo}/contents/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${profile.github_token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Add Aether note: ${title}`,
          content: toBase64(content),
        }),
      }
    );

    const githubData = await githubRes.json();

    if (!githubRes.ok) {
      return NextResponse.json(
        { error: githubData?.message || "Failed to push note." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: githubData?.content?.html_url || null,
    });
  } catch {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}