import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
  rel?: string;
  onClick?: () => void;
}

/** Maroon text link with an arrow — "Read the city's story →" / "Details ↗". */
export function InlineLink({ href, children, external, className, rel, onClick }: Props) {
  const cls = cn(
    "group inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel={rel ?? "noopener noreferrer"} className={cls} onClick={onClick}>
        {children}
        <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls} onClick={onClick}>
      {children}
      <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
