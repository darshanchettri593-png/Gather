export interface UserRecord {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type EventVibe = 'move' | 'create' | 'hang' | 'learn' | 'explore';

export interface Event {
  id: string;
  host_id: string;
  title: string;
  vibe: EventVibe;
  event_datetime: string;
  location_text: string;
  description: string | null;
  cover_image_url: string | null;
  whatsapp_link: string | null;
  created_at: string;

  // Joined properties for front-end
  host?: UserRecord;
  _count?: {
    attendees: number;
  };
}

export interface EventRating {
  id: string;
  event_id: string;
  rater_id: string;
  rater_type: 'attendee' | 'host';
  rating_value: number;
  comment: string | null;
  created_at: string;
  rater?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Attendee {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;

  // Joined properties
  user?: UserRecord;
}
