import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return (
    <div className="flex h-screen items-center justify-center min-h-dvh">
      <SignUp />
    </div>
  );
}
