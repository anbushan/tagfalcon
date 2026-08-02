"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GoogleStartFreeButton from "@/components/GoogleStartFreeButton";
import Logo from "@/components/Logo";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app/generator";
  const authError = searchParams.get("error");

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo size="text-xl" markSize={32} />
      <h1 className="mt-6 text-2xl font-bold">Log in to TagFalcon</h1>
      <p className="mt-2 text-sm text-gray-600">
        We only support signing in with Google — no separate password to remember.
      </p>

      {authError && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">
          Couldn't sign you in. Try again.
        </p>
      )}

      <div className="mt-8">
        <GoogleStartFreeButton callbackUrl={callbackUrl} label="Continue with Google" />
      </div>

      <p className="mt-8 text-xs text-gray-400">
        By continuing, you agree to our{" "}
        <a className="underline" href="/legal/terms">
          Terms
        </a>{" "}
        and{" "}
        <a className="underline" href="/legal/privacy">
          Privacy policy
        </a>
        .
      </p>
    </main>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
