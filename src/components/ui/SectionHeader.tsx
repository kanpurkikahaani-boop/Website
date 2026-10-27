import { cn } from "@/lib/utils";

interface Props {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  id?: string;
  className?: string;
  as?: "h2" | "h1";
}

/** Eyebrow → H2 → one-line intro. Used by every section. */
export function SectionHeader({ eyebrow, title, intro, align = "left", dark, id, className, as: Tag = "h2" }: Props) {
  return (
    <div className={cn("mb-10", align === "center" && "mx-auto text-center", className)}>
      <p className={cn("eyebrow", dark && "text-accent")}>{eyebrow}</p>
      <Tag
        id={id}
        className={cn(
          "mt-2 text-[30px] font-bold leading-tight tracking-tight md:text-[40px]",
          dark ? "text-white" : "text-primary",
        )}
      >
        {title}
      </Tag>
      {intro && (
        <p
          className={cn(
            "mt-3 max-w-[560px] text-[15.5px]",
            align === "center" && "mx-auto",
            dark ? "text-cream/80" : "text-muted",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
