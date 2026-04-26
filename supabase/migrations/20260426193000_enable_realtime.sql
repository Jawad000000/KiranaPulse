-- Enable realtime payloads for the tables the client watches.

do $$
begin
  begin
    alter publication supabase_realtime add table public.orders;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.alert_recipients;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
