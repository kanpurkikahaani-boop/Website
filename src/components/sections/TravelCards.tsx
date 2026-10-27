import { Plane, Car, TrainFront } from "lucide-react";
import type { TravelMode } from "@/data/types";
import { IconBadge } from "@/components/ui/IconBadge";
import { FadeUp } from "@/components/ui/FadeUp";

const icons = { train: TrainFront, road: Car, air: Plane };

/** By Train / By Road / By Air cards. */
export function TravelCards({ modes }: { modes: TravelMode[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {modes.map((m, i) => (
        <FadeUp as="li" key={m.mode} delay={i * 0.06} className="rounded-2xl border border-border bg-surface p-6">
          <IconBadge icon={icons[m.mode]} size={44} />
          <h3 className="mt-4 text-xl font-semibold">{m.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed">{m.body}</p>
        </FadeUp>
      ))}
    </ul>
  );
}
