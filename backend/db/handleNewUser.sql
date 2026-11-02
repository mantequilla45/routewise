-- Copies each new Supabase Auth user into public.users (trigger on_auth_user_created, AFTER INSERT
-- OR UPDATE ON auth.users). The backend finds a user's profile by email (services/users.ts), so a
-- profile may already exist for this email under a different id, e.g. one made before Supabase
-- Auth or by an earlier sign-up. That must not fail: Supabase reports any error here as "Database
-- error saving new user" and the sign-in is lost. So an existing row (same id or same email) is
-- updated instead, and a unique violation is swallowed rather than blocking sign-in.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    now(), now(), false
  )
  ON CONFLICT DO NOTHING;

  IF NOT FOUND THEN
    UPDATE public.users
    SET full_name = COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', full_name),
        avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', avatar_url),
        updated_at = now()
    WHERE id = new.id OR lower(email) = lower(new.email);
  END IF;

  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    RETURN new;
END;
$function$;
