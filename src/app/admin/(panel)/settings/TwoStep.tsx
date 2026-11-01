"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmTotpEnrolment, removeTotp, startTotpEnrolment } from "./actions";

const btn = "rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60";

export function TwoStep({ factorId }: { factorId: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [setup, setSetup] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (factorId) {
    return (
      <div>
        <p className="text-sm"><strong className="text-[#21603a]">On.</strong> Signing in asks for a code from your authenticator app.</p>
        {error && <p role="alert" className="mt-2 text-sm text-primary">{error}</p>}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            window.confirm("Turn off 2-step verification?") &&
            start(async () => {
              const r = await removeTotp(factorId);
              if (!r.ok) setError(r.error);
              else router.refresh();
            })
          }
          className={`${btn} mt-3 border border-border text-ink hover:border-primary`}
        >
          Turn off
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm"><strong className="text-accent-ink">Off.</strong> Recommended: add a 6-digit code from an app such as Google Authenticator, Microsoft Authenticator or 1Password.</p>
      {done && <p role="status" className="mt-2 text-sm text-[#21603a]">{done}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-primary">{error}</p>}
      {!setup ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await startTotpEnrolment();
              if (!r.ok) setError(r.error);
              else setSetup(r);
            })
          }
          className={`${btn} mt-3 bg-primary text-white hover:bg-primary-hover`}
        >
          Enable 2-step verification
        </button>
      ) : (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              setError(null);
              const r = await confirmTotpEnrolment(setup.factorId, code);
              if (!r.ok) return setError(r.error);
              setDone("2-step verification is on.");
              setSetup(null);
              router.refresh();
            });
          }}
        >
          <p className="text-sm">1. Scan this QR code with your authenticator app (or type the key).</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code is an SVG data URL from Supabase */}
          <img src={setup.qr} alt="QR code for your authenticator app" width={180} height={180} className="rounded-lg border border-border bg-white p-2" />
          <p className="break-all font-mono text-xs">Key: {setup.secret}</p>
          <label className="block text-sm font-semibold text-ink">
            2. Enter the 6-digit code it shows
            <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" required className="mt-1.5 block h-11 w-40 rounded-xl border border-border bg-white px-3 text-center tracking-[0.3em]" />
          </label>
          <button disabled={pending} className={`${btn} bg-primary text-white hover:bg-primary-hover`}>{pending ? "Checking…" : "Confirm and turn on"}</button>
        </form>
      )}
    </div>
  );
}
