"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAuthor } from "../blogs/actions";

export function NewAuthor() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await createAuthor({ name });
          if (!r.ok) return setError(r.error);
          setName("");
          setError(null);
          router.refresh();
        });
      }}
    >
      <label className="text-xs font-semibold text-muted">
        New writer
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Full name" className="mt-1 block h-10 w-64 rounded-full border border-border bg-white px-4 text-sm text-ink" />
      </label>
      <button disabled={pending} className="h-10 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60">Add author</button>
      {error && <p role="alert" className="w-full text-sm text-primary">{error}</p>}
    </form>
  );
}
