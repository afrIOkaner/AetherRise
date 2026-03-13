/**
 * @file route.ts
 * @path F:\aether\src\app\api\premium\route.ts
 * @description API route to handle manual payment submissions for AetherRise.
 */

import { createClient } from '@supabase/supabase-js'; // Standard Supabase client
import { NextResponse } from 'next/server';

// Initialize Supabase (Use your Env variables)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { method, trx_id, amount } = await req.json();

    // 1. Get User Authorization Header (Safe way to identify user)
    const authHeader = req.headers.get('Authorization');
    
    // Note: In a production environment, you should verify the JWT token here.
    // For now, we will focus on saving the data to the database.

    // 2. Insert Payment Request into Supabase 'payment_requests' table
    const { data, error: dbError } = await supabase
      .from('payment_requests')
      .insert([
        {
          method: method,
          trx_id: trx_id,
          amount: amount,
          status: 'pending' // Admin will manually approve this later
        }
      ]);

    if (dbError) {
      console.error("Database Error:", dbError.message);
      return NextResponse.json({ error: "Failed to save payment data" }, { status: 400 });
    }

    return NextResponse.json({ message: "Payment request submitted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}