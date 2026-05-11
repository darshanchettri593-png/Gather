import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { EventVibe } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function meetsEventCriteria(
  event: { min_age?: number; max_age?: number; gender_filter?: string },
  userProfile: { date_of_birth?: string; gender?: string } | null
): boolean {
  if (!userProfile) return true;

  if (userProfile.date_of_birth && (event.min_age || event.max_age)) {
    const today = new Date();
    const dob = new Date(userProfile.date_of_birth);
    const age = Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const minAge = event.min_age || 18;
    const maxAge = event.max_age || 99;
    if (age < minAge || age > maxAge) return false;
  }

  if (event.gender_filter && event.gender_filter !== 'All' && userProfile.gender) {
    if (event.gender_filter !== userProfile.gender) return false;
  }

  return true;
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
