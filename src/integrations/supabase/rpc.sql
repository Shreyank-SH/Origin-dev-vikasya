-- Function to increment likes
create or replace function increment_likes(post_id uuid)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  update posts
  set likes_count = COALESCE(likes_count, 0) + 1
  where id = post_id
  returning likes_count into new_count;
  
  return new_count;
end;
$$;

-- Function to decrement likes
create or replace function decrement_likes(post_id uuid)
returns integer
language plpgsql
as $$
declare
  new_count integer;
begin
  update posts
  set likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  where id = post_id
  returning likes_count into new_count;
  
  return new_count;
end;
$$;