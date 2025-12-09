-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES ENUM (Optional, can just use text constraints)
-- create type user_role as enum ('admin', 'teacher', 'student');

-- PROFILES (Links to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role text check (role in ('admin', 'teacher', 'student')) not null,
  full_name text,
  usn text unique, -- For students
  avatar_url text, -- For face image reference
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- CLASSES
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g. "10", "CS"
  section text not null, -- e.g. "A", "B"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(name, section)
);
alter table public.classes enable row level security;
create policy "Classes are viewable by everyone" on public.classes for select using (true);
create policy "Admins can manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- SUBJECTS (e.g. Math, Physics)
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique, -- e.g. "MAT101"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.subjects enable row level security;
create policy "Subjects are viewable by everyone" on public.subjects for select using (true);
create policy "Admins can manage subjects" on public.subjects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- TIMETABLE
create table public.timetable (
  id uuid default uuid_generate_v4() primary key,
  class_id uuid references public.classes(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete set null, -- Teacher's profile ID
  day text not null, -- Monday, Tuesday...
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.timetable enable row level security;
create policy "Timetable viewable by everyone" on public.timetable for select using (true);
create policy "Admins can manage timetable" on public.timetable for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ATTENDANCE LOGS
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade, -- Optional, if marking specifically for a subject slot
  timetable_id uuid references public.timetable(id) on delete set null, -- Link to specific slot
  date date default CURRENT_DATE not null,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null,
  status text check (status in ('present', 'absent', 'late')) default 'present',
  method text check (method in ('auto', 'manual')) default 'auto'
);
alter table public.attendance enable row level security;
create policy "Attendance viewable by everyone" on public.attendance for select using (true);
create policy "Admins and Teachers can insert identification logs" on public.attendance for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'teacher'))
  OR 
  -- Allow public insert if we treat Kiosk as an anon service with a specific secret header? 
  -- For now, let's assume Kiosk is logged in as a 'teacher' or 'admin' or we open it up.
  -- Simpler: "Kiosk" user exists.
  true -- TEMPORARY: Allow all to mark attendance for prototype ease, or secure later.
);

-- STORAGE BUCKET
-- Note: Buckets are usually created via UI or Storage API, but policy can be SQL
-- insert into storage.buckets (id, name) values ('face-images', 'face-images');
-- policy for face-images: public read, admin upload.
