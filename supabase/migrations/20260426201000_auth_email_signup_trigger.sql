-- Create KiranaPulse org/profile/inventory rows from Supabase email signup metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role organization_role;
  selected_org_name text;
  new_org_id uuid;
begin
  selected_role := case new.raw_user_meta_data ->> 'role'
    when 'Distributor' then 'Distributor'::organization_role
    when 'Manufacturer' then 'Manufacturer'::organization_role
    else 'Retailer'::organization_role
  end;

  selected_org_name := nullif(trim(new.raw_user_meta_data ->> 'org_name'), '');

  insert into public.organizations (name, role)
  values (coalesce(selected_org_name, selected_role::text || ' Org'), selected_role)
  returning id into new_org_id;

  insert into public.profiles (id, org_id, display_name)
  values (new.id, new_org_id, coalesce(new.email, 'KiranaPulse Operator'));

  insert into public.inventory (org_id, item_id, current_stock)
  select new_org_id, item.id,
    case when selected_role = 'Manufacturer' then 50 else 10 end
  from public.inventory_items item
  on conflict (org_id, item_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
