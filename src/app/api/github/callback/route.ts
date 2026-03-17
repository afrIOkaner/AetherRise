import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      return NextResponse.redirect(new URL("/?github=missing-code", req.url));
    }

    if (!state) {
      return NextResponse.redirect(new URL("/?github=missing-state", req.url));
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/?github=token-failed", req.url));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ github_token: accessToken })
      .eq("id", state);

    if (updateError) {
      return NextResponse.redirect(new URL("/?github=save-failed", req.url));
    }

    return NextResponse.redirect(new URL("/?github=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/?github=error", req.url));
  }
}