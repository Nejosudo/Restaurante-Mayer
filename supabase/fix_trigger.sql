-- Fix Trigger Function to include all profile fields

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    cedula, 
    birth_date, 
    address, 
    role
  )
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.raw_user_meta_data->>'cedula',
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'address',
    'client'
  );
  return new;
end;
$$ language plpgsql security definer;
