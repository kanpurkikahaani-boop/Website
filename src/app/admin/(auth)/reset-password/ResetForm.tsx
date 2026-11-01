"use client";

import { useActionState } from "react";
import { setNewPassword } from "./actions";

const input = "mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-ink focus:border-primary focus:outline-none";

export function ResetForm() {
  const [state, action, pending] = useActionState(setNewPassword, {});
  return (
    <form action={action} className="mt-6 space-y-4 text-left">
      <label className="block text-sm font-semibold text-ink">
        New password
        <input name="password" type="password" required minLength={12} autoComplete="new-password" className={input} />
      </label>
      <label className="block text-sm font-semibold text-ink">
        Type it again
        <input name="confirm" type="password" required minLength={12} autoComplete="new-password" className={input} />
      </label>
      {state.error && <p role="alert" className="text-sm text-primary">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
