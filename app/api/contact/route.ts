import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema } from "@/features/contact-form/model/schema";

// Initialize Resend lazily to avoid build-time errors when API key is missing
let resend: Resend | null = null;
const getResend = () => {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Simple in-memory rate limiting (for demonstration, resets on redeploy)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_REQUESTS = 3;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();

    // Basic Rate Limiting
    const limit = rateLimitMap.get(ip);
    if (limit) {
      if (now - limit.lastReset < RATE_LIMIT_WINDOW) {
        if (limit.count >= MAX_REQUESTS) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          );
        }
        limit.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }

    const body = await req.json();

    // Server-side validation
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, message, website } = result.data;

    // Honeypot check
    if (website) {
      // Silently reject spam
      return NextResponse.json({ success: true });
    }

    // Send email via Resend
    const { data, error } = await getResend().emails.send({
      from: "Portfolio Contact Form <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || "[PLACEHOLDER: my email address]",
      subject: `New Message from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
