-- Supabase schema and RLS policies for Gather

-- Create specific tables

-- Users are managed automatically by auth.users. We clone necessary auth fields
-- to a public `users` table via a trigger so they're queryable from the client.
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users are viewable by everyone."
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile."
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a user row automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create storage bucket for event covers if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-covers', 'event-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-covers' );

CREATE POLICY "Authenticated users can upload covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-covers' AND
  auth.role() = 'authenticated'
);

CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  vibe TEXT NOT NULL CHECK (vibe IN ('move', 'create', 'hang', 'learn', 'explore')),
  event_datetime TIMESTAMPTZ NOT NULL,
  location_text TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can read events
CREATE POLICY "Events are viewable by everyone."
  ON public.events FOR SELECT USING (true);

-- Authenticated users can insert events
CREATE POLICY "Authenticated users can create events."
  ON public.events FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Hosts can update their own events (though MVP says out of scope, good to have)
CREATE POLICY "Hosts can update their own events."
  ON public.events FOR UPDATE USING (auth.uid() = host_id);


-- Create attendees table
CREATE TABLE public.attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Everyone can read attendees
CREATE POLICY "Attendees are viewable by everyone."
  ON public.attendees FOR SELECT USING (true);

-- Authenticated users can join/unjoin
CREATE POLICY "Users can join events."
  ON public.attendees FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events."
  ON public.attendees FOR DELETE USING (auth.uid() = user_id);


-- Create event_ratings table
CREATE TABLE public.event_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rater_type TEXT NOT NULL CHECK (rater_type IN ('attendee', 'host')),
  rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, rater_id)
);

ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings are viewable by everyone."
  ON public.event_ratings FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit ratings."
  ON public.event_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their own ratings."
  ON public.event_ratings FOR UPDATE USING (auth.uid() = rater_id);
