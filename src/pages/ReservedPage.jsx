import { useEffect } from "react";
import { BrandLogo } from "../components/landing/BrandLogo.jsx";
import { ReserveButton } from "../components/landing/ReserveButton.jsx";

export function ReservedPage() {
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;

    fetch("/api/founding-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-[520px] text-center">
        <BrandLogo className="mx-auto" />
        <h1 className="mt-10 font-serif text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-[1.08] text-forest-deep">
          You&apos;re reserved.
        </h1>
        <p className="mx-auto mt-5 max-w-[420px] text-[1.02rem] leading-7 text-forest-deep/75">
          Your payment is confirmed and your Founding Transaction is reserved.
          We&apos;ll follow up with next steps.
        </p>
        <ReserveButton href="/" variant="forest" className="mt-8">
          Back to Opsy
        </ReserveButton>
      </div>
    </main>
  );
}
