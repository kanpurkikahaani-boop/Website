/** Minimal brand glyphs (lucide-react no longer ships brand logos). */
type P = { size?: number; className?: string };

const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const });

export function InstagramIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3Z" />
    </svg>
  );
}

export function YouTubeIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export function XIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

export function MediumIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M13.5 12a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Zm7.4 0c0 3.54-1.51 6.4-3.38 6.4-1.86 0-3.37-2.86-3.37-6.4 0-3.54 1.51-6.4 3.37-6.4 1.87 0 3.38 2.86 3.38 6.4ZM24 12c0 3.17-.53 5.74-1.19 5.74-.65 0-1.18-2.57-1.18-5.74s.53-5.74 1.18-5.74c.66 0 1.19 2.57 1.19 5.74Z" />
    </svg>
  );
}

export function RedditIcon({ size = 18, className }: P) {
  return (
    <svg {...base(size)} className={className} fill="currentColor">
      <path d="M22 12.1a2.2 2.2 0 0 0-3.73-1.58 10.8 10.8 0 0 0-5.79-1.83l.98-4.62 3.21.68a1.57 1.57 0 1 0 .16-.77l-3.58-.76a.39.39 0 0 0-.46.3l-1.1 5.17a10.86 10.86 0 0 0-5.87 1.83 2.2 2.2 0 1 0-2.42 3.6 4.3 4.3 0 0 0-.05.66c0 3.36 3.9 6.08 8.72 6.08s8.72-2.72 8.72-6.08c0-.22-.02-.44-.05-.66A2.2 2.2 0 0 0 22 12.1ZM7 13.67a1.57 1.57 0 1 1 3.14 0 1.57 1.57 0 0 1-3.14 0Zm8.77 4.15c-1.07 1.07-3.12 1.15-3.73 1.15-.6 0-2.66-.08-3.72-1.15a.4.4 0 1 1 .57-.57c.67.68 2.12.92 3.15.92 1.04 0 2.48-.24 3.16-.92a.4.4 0 0 1 .57.57Zm-.19-2.58a1.57 1.57 0 1 1 0-3.14 1.57 1.57 0 0 1 0 3.14Z" />
    </svg>
  );
}
