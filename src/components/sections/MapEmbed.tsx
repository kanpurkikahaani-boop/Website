/** Lazy-loaded Google Maps embed (no API key). */
export function MapEmbed({ query, title, height = 300 }: { query: string; title: string; height?: number }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg-alt" style={{ height }}>
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
        allowFullScreen
      />
    </div>
  );
}
