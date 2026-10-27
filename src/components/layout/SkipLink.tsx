export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only z-[100] rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to content
    </a>
  );
}
