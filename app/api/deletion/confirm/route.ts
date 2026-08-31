import { NextResponse } from "next/server";
import { confirmAccountDeletionAction } from "@/server/actions/deletion.actions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/settings?error=MissingConfirmationToken", req.url));
    }

    const result = await confirmAccountDeletionAction(token);

    if (!result.success) {
      return NextResponse.redirect(new URL("/settings?error=InvalidOrExpiredToken", req.url));
    }

    return NextResponse.redirect(new URL("/settings?deletion_confirmed=true", req.url));
  } catch (error: any) {
    console.error("Deletion confirmation error:", error);
    return NextResponse.redirect(new URL("/settings?error=InternalServerError", req.url));
  }
}
