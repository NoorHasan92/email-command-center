import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/repositories/db";
import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Missing token", { status: 400 });
    }

    const request = await db.accountLinkRequest.findUnique({
      where: { linkToken: token },
      include: { user: true }
    });

    if (!request || request.status !== "PENDING_OAUTH") {
      return new NextResponse("Invalid or expired link", { status: 400 });
    }

    if (new Date() > request.expiresAt) {
      return new NextResponse("This activation link has expired.", { status: 400 });
    }

    // Set the cookie so the callback route knows this OAuth flow belongs to this link request
    const cookieStore = await cookies();
    cookieStore.set("gmail_link_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60, // 10 minutes to complete Google login
      path: "/",
      sameSite: "lax",
    });

    const isPro = request.user.plan === "PRO" || request.user.plan === "ULTRA" || request.user.plan === "ADMIN";

    // Redirect to the normal Google OAuth flow
    // We append a query param just so the connect route knows it's a link flow (optional)
    return NextResponse.redirect(`${getBaseUrl()}/api/integrations/gmail/connect?isLinkFlow=true&proScopes=${isPro}`);
  } catch (error) {
    console.error("Error in gmail link route:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
