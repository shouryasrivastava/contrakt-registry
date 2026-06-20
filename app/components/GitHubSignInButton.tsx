"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

export default function GitHubSignInButton({ nextPath }: { nextPath: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signIn("github", { redirectTo: nextPath });
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#202020] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#3a3a3a] disabled:cursor-wait disabled:opacity-70"
    >
      <LogIn className="h-4 w-4" />
      {pending ? "Opening GitHub..." : "Continue with GitHub"}
    </button>
  );
}
