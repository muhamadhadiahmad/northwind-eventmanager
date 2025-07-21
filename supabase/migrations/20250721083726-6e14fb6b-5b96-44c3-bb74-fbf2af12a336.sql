-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE public.table_type AS ENUM ('VVIP', 'VIP', 'Regular', 'Staff');

-- Companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_attendees INTEGER DEFAULT 0,
    registration_qr TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tables for seating
CREATE TABLE public.event_tables (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    table_type public.table_type NOT NULL DEFAULT 'Regular',
    capacity INTEGER NOT NULL DEFAULT 8,
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendees table
CREATE TABLE public.attendees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    identification_number TEXT,
    staff_id TEXT,
    table_assignment UUID REFERENCES public.event_tables(id),
    qr_code TEXT,
    checked_in BOOLEAN NOT NULL DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gallery photos
CREATE TABLE public.gallery_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_name TEXT,
    photo_url TEXT NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voting sessions
CREATE TABLE public.voting_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Voting photos
CREATE TABLE public.voting_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voting_session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    vote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Votes
CREATE TABLE public.votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voting_photo_id UUID NOT NULL REFERENCES public.voting_photos(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(voting_photo_id, attendee_id)
);

-- Lucky draw winners
CREATE TABLE public.lucky_draw_winners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    prize_name TEXT,
    drawn_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lucky_draw_winners ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user's company
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create security definer function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (id = public.get_user_company_id());

CREATE POLICY "Admins can insert companies" ON public.companies
    FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins and managers can update their company" ON public.companies
    FOR UPDATE USING (id = public.get_user_company_id() AND public.get_user_role() IN ('admin', 'manager'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their company" ON public.profiles
    FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins and managers can insert profiles in their company" ON public.profiles
    FOR INSERT WITH CHECK (company_id = public.get_user_company_id() AND public.get_user_role() IN ('admin', 'manager'));

-- RLS Policies for events
CREATE POLICY "Users can view events in their company" ON public.events
    FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Admins and managers can manage events in their company" ON public.events
    FOR ALL USING (company_id = public.get_user_company_id() AND public.get_user_role() IN ('admin', 'manager'));

-- RLS Policies for event_tables
CREATE POLICY "Users can view tables for their company events" ON public.event_tables
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Admins and managers can manage tables" ON public.event_tables
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ) AND public.get_user_role() IN ('admin', 'manager'));

-- RLS Policies for attendees
CREATE POLICY "Users can view attendees for their company events" ON public.attendees
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Users can manage attendees for their company events" ON public.attendees
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

-- Public access policies for attendee registration (will be restricted by event QR codes)
CREATE POLICY "Public can insert attendees" ON public.attendees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view attendees for voting/gallery" ON public.attendees
    FOR SELECT USING (true);

-- RLS Policies for gallery_photos
CREATE POLICY "Users can view gallery photos for their company events" ON public.gallery_photos
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Users can manage gallery photos" ON public.gallery_photos
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Public can upload gallery photos" ON public.gallery_photos
    FOR INSERT WITH CHECK (true);

-- RLS Policies for voting_sessions
CREATE POLICY "Users can view voting sessions for their company events" ON public.voting_sessions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Admins and managers can manage voting sessions" ON public.voting_sessions
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ) AND public.get_user_role() IN ('admin', 'manager'));

-- RLS Policies for voting_photos
CREATE POLICY "Public can view voting photos" ON public.voting_photos
    FOR SELECT USING (true);

CREATE POLICY "Users can manage voting photos for their company" ON public.voting_photos
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.voting_sessions vs
        JOIN public.events e ON vs.event_id = e.id
        WHERE vs.id = voting_session_id AND e.company_id = public.get_user_company_id()
    ));

-- RLS Policies for votes
CREATE POLICY "Public can vote" ON public.votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view votes for their company events" ON public.votes
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.voting_photos vp
        JOIN public.voting_sessions vs ON vp.voting_session_id = vs.id
        JOIN public.events e ON vs.event_id = e.id
        WHERE vp.id = voting_photo_id AND e.company_id = public.get_user_company_id()
    ));

-- RLS Policies for lucky_draw_winners
CREATE POLICY "Users can view winners for their company events" ON public.lucky_draw_winners
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

CREATE POLICY "Users can manage winners for their company events" ON public.lucky_draw_winners
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.events WHERE id = event_id AND company_id = public.get_user_company_id()
    ));

-- Create trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_events_company_id ON public.events(company_id);
CREATE INDEX idx_attendees_event_id ON public.attendees(event_id);
CREATE INDEX idx_attendees_checked_in ON public.attendees(checked_in);
CREATE INDEX idx_event_tables_event_id ON public.event_tables(event_id);
CREATE INDEX idx_gallery_photos_event_id ON public.gallery_photos(event_id);
CREATE INDEX idx_voting_sessions_event_id ON public.voting_sessions(event_id);
CREATE INDEX idx_voting_photos_session_id ON public.voting_photos(voting_session_id);
CREATE INDEX idx_votes_photo_attendee ON public.votes(voting_photo_id, attendee_id);