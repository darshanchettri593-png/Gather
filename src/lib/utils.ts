import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { EventVibe } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVibeLabel(vibe: EventVibe | string): string {
  if (!vibe) return "";
  const v = vibe.toLowerCase();
  switch (v) {
    case 'move': return 'Move';
    case 'create': return 'Create';
    case 'hang': return 'Hang';
    case 'learn': return 'Learn';
    case 'explore': return 'Explore';
    default: return vibe;
  }
}
