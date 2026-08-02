import { Suspense } from "react";
import VerifyClient from "./VerifyClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Verify Email",
  description: "Verify your email address",
};

export default function VerifyPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
