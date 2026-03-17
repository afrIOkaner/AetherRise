import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
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
      .select("github_token")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.github_token) {
      return NextResponse.json({ error: "GitHub not connected." }, { status: 400 });
    }

    const reposRes = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${profile.github_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    const reposData = await reposRes.json();

    if (!reposRes.ok) {
      return NextResponse.json(
        { error: reposData?.message || "Failed to fetch repos." },
        { status: 500 }
      );
    }

    const repos = reposData.map((repo: { full_name: string; private: boolean }) => ({
      full_name: repo.full_name,
      private: repo.private,
    }));

    return NextResponse.json({ repos });
  } catch {
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}