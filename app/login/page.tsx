import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = {
  title: "Login - Inbox Sentinel",
  description: "Sign in to your Inbox Sentinel account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
