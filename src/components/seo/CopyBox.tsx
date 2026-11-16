"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Read-only snippet with a Copy button (link HTML, citations, badges). */
export function CopyBox({ label, value, mono = true, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/80">{label}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard blocked: the text can still be selected by hand */
            }
          }}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-ink hover:border-primary hover:text-primary"
        >
          {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      <textarea
        readOnly
        aria-label={label}
        value={value}
        rows={value.length > 140 ? 3 : 2}
        onFocus={(e) => e.currentTarget.select()}
        className={cn("w-full resize-none rounded-xl border border-border bg-white px-3 py-2 text-[13px] text-ink focus:border-primary focus:outline-none", mono && "font-mono")}
      />
    </div>
  );
}
