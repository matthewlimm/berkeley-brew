-- Add service role update policy for cafes
CREATE POLICY "service_role_can_update_cafes" ON public.cafes
    FOR UPDATE TO service_role
    USING (true)
    WITH CHECK (true);
