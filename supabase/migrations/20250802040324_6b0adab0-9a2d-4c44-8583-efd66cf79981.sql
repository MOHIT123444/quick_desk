-- Add missing RLS policies for existing tables

-- RLS Policies for answers table
CREATE POLICY "Users can view answers for accessible questions" ON public.answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.questions q 
            WHERE q.id = question_id
        )
    );

CREATE POLICY "Users can create answers" ON public.answers
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own answers" ON public.answers
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for comments table  
CREATE POLICY "Users can view comments for accessible answers" ON public.comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.answers a 
            JOIN public.questions q ON q.id = a.question_id
            WHERE a.id = answer_id
        )
    );

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for votes table
CREATE POLICY "Users can view votes" ON public.votes
    FOR SELECT USING (true);

CREATE POLICY "Users can create votes" ON public.votes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own votes" ON public.votes
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for questions table
CREATE POLICY "Anyone can view questions" ON public.questions
    FOR SELECT USING (true);

CREATE POLICY "Users can create questions" ON public.questions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own questions" ON public.questions
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid());

-- RLS Policies for admin_actions table
CREATE POLICY "Only admins can view admin actions" ON public.admin_actions
    FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can create admin actions" ON public.admin_actions
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Fix function security by setting search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Fix handle_new_user function security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
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