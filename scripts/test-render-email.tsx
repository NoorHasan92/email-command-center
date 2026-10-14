import * as React from "react";
import { render } from "@react-email/render";
import { WelcomeEmail } from "../components/emails/WelcomeEmail";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const html = await render(<WelcomeEmail name="Md Noor Hasan Ansari" />, {
    pretty: true,
  });

  const outDir = path.join(__dirname, "..", "scratch");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, "email-preview.html");
  fs.writeFileSync(outPath, html, "utf-8");
  console.log("Rendered HTML preview to:", outPath);
  console.log("HTML length:", html.length);
}

main().catch(console.error);
