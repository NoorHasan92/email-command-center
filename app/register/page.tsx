import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export const metadata = {
  title: "Register - Inbox Sentinel",
  description: "Create your Inbox Sentinel account",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <RegisterClient />
    </Suspense>
  );
}
