"use client";

import { Plus, Trash2 } from "lucide-react";

export interface RowField<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  wide?: boolean;
}

/** Small repeatable-rows editor for the article boxes (key facts, sources, glossary, plan-your-visit). */
export function RowsEditor<T extends Record<string, string>>({
  title,
  hint,
  rows,
  fields,
  empty,
  onChange,
}: {
  title: string;
  hint?: string;
  rows: T[];
  fields: RowField<T>[];
  empty: T;
  onChange: (rows: T[]) => void;
}) {
  const set = (i: number, k: keyof T, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <fieldset className="rounded-2xl border border-border bg-surface p-5">
      <legend className="px-1 text-xs font-bold uppercase tracking-[0.14em] text-accent-ink">{title}</legend>
      {hint && <p className="mb-3 text-xs text-muted">{hint}</p>}
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2.5 w-5 shrink-0 text-right text-xs text-muted">{i + 1}.</span>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
                  <span className="sr-only">{f.label}</span>
                  <input
                    value={r[f.key] ?? ""}
                    placeholder={f.placeholder ?? f.label}
                    onChange={(e) => set(i, f.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <button type="button" aria-label={`Remove row ${i + 1}`} onClick={() => onChange(rows.filter((_, j) => j !== i))} className="mt-1.5 rounded-full p-1.5 text-muted hover:bg-primary-soft hover:text-primary">
              <Trash2 size={15} aria-hidden />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => onChange([...rows, { ...empty }])} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-primary hover:text-primary">
        <Plus size={13} aria-hidden /> Add row
      </button>
    </fieldset>
  );
}
