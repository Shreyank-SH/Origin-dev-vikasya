CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role),
    true  -- Auto-approve all users
  );
  RETURN NEW;
END;
$function$;