import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "email-logo.png");
    if (!fs.existsSync(filePath)) {
      const fallbackPath = path.join(process.cwd(), "public", "app-logo.png");
      const fallbackBuf = fs.readFileSync(fallbackPath);
      return new NextResponse(fallbackBuf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const fileBuf = fs.readFileSync(filePath);
    return new NextResponse(fileBuf, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new NextResponse("Not found", { status: 404 });
  }
}
