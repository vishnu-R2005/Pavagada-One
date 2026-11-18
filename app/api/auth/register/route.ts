import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, setSession } from "@/lib/auth";
import { query } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(10).max(128),
});

export async function POST(req: Request) {
  try {
    const p = schema.safeParse(await req.json());
    if (!p.success) {
      return NextResponse.json(
        { error: "Check your details. Password must be at least 10 characters." },
        { status: 400 }
      );
    }
    const email = p.data.email.toLowerCase();
    const existing = await query("select id from users where email = ?", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    await query(
      "insert into users(id,email,full_name,phone,password_hash,role) values(?,?,?,?,?,?)",
      [id, email, p.data.name, p.data.phone, hashPassword(p.data.password), "customer"]
    );
    const user = {
      id,
      email,
      fullName: p.data.name,
      role: "customer" as const,
      isActive: true,
    };
    const sessionToken = await setSession(user);
    return NextResponse.json({ user, sessionToken }, { status: 201 });
  } catch (err) {
    console.error("Registration failed", err);
    return NextResponse.json(
      { error: "Account creation failed. Please try again." },
      { status: 500 }
    );
  }
}