import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

/**
 * GitHub Webhook Handler for DSA Solutions Sync
 * 
 * SECURITY: This route is publicly accessible. We MUST verify the HMAC-SHA256 signature
 * sent by GitHub in the 'X-Hub-Signature-256' header against our local 'DSA_WEBHOOK_SECRET'.
 * 
 * REVALIDATION: On a valid push event to the main branch, we trigger a revalidation
 * of the '/dsa' path to ensure the portfolio reflects the latest problems.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const secret = process.env.DSA_WEBHOOK_SECRET;

    if (!secret) {
      console.error("DSA_WEBHOOK_SECRET is not defined in environment variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // 1. VERIFY SIGNATURE
    // GitHub sends the signature in the format 'sha256=xxxx'
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(
      "sha256=" + hmac.update(payload).digest("hex"),
      "utf8"
    );
    const checksum = Buffer.from(signature, "utf8");

    // timingSafeEqual prevents timing attacks by ensuring comparison time is constant
    if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. PROCESS VERIFIED PAYLOAD
    const data = JSON.parse(payload);
    
    // We only care about pushes to the default branch (usually main)
    const isMainPush = data.ref === `refs/heads/${data.repository?.default_branch || 'main'}`;
    
    if (isMainPush) {
      console.log("Verified push to main detected. Revalidating /dsa...");
      revalidatePath("/dsa");
      return NextResponse.json({ 
        success: true, 
        message: "Revalidation triggered for /dsa" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Webhook received, no action required for this branch" 
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
