-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('user', 'agent', 'admin');

-- Create ticket status enum
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Create ticket priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Update profiles table to include role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    priority ticket_priority DEFAULT 'medium',
    category_id UUID REFERENCES public.categories(id),
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    assigned_to UUID REFERENCES public.profiles(id),
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON public.categories
    FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for tickets
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (
        created_by = auth.uid() OR 
        assigned_to = auth.uid() OR 
        public.get_user_role(auth.uid()) IN ('agent', 'admin')
    );

CREATE POLICY "Users can create tickets" ON public.tickets
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own tickets" ON public.tickets
    FOR UPDATE USING (
        created_by = auth.uid() OR
        (assigned_to = auth.uid() AND public.get_user_role(auth.uid()) IN ('agent', 'admin')) OR
        public.get_user_role(auth.uid()) = 'admin'
    );

-- RLS Policies for ticket comments
CREATE POLICY "Users can view comments on accessible tickets" ON public.ticket_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets t 
            WHERE t.id = ticket_id AND (
                t.created_by = auth.uid() OR 
                t.assigned_to = auth.uid() OR 
                public.get_user_role(auth.uid()) IN ('agent', 'admin')
            )
        )
    );

CREATE POLICY "Users can add comments to accessible tickets" ON public.ticket_comments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.tickets t 
            WHERE t.id = ticket_id AND (
                t.created_by = auth.uid() OR 
                t.assigned_to = auth.uid() OR 
                public.get_user_role(auth.uid()) IN ('agent', 'admin')
            )
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at BEFORE UPDATE ON public.ticket_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description, color) VALUES
    ('Technical Issue', 'Hardware, software, or system problems', '#EF4444'),
    ('Account Support', 'Login, password, or account-related issues', '#3B82F6'),
    ('Feature Request', 'Suggestions for new features or improvements', '#10B981'),
    ('Billing', 'Payment, subscription, or billing inquiries', '#F59E0B'),
    ('General', 'General questions or other issues', '#6B7280');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();