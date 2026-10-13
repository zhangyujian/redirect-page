-- Run this once in Supabase SQL Editor.
create table if not exists public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_distro text not null default 'kali',
  completion_map jsonb not null default '{}'::jsonb,
  course_progress_map jsonb not null default '{}'::jsonb,
  study_minutes integer not null default 0,
  daily_goal integer not null default 20,
  updated_at timestamptz not null default now()
);

alter table public.learning_progress enable row level security;

create policy "Users can read their own learning progress"
  on public.learning_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own learning progress"
  on public.learning_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own learning progress"
  on public.learning_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
