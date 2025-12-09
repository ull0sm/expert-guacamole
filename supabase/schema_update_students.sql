-- Add class_id to profiles for students
alter table public.profiles 
add column class_id uuid references public.classes(id) on delete set null;

-- Helper to see student details with class name
create or replace view public.student_details as
select 
  p.id,
  p.full_name,
  p.usn,
  p.email,
  p.avatar_url,
  p.class_id,
  c.name as class_name,
  c.section as class_section
from public.profiles p
left join public.classes c on p.class_id = c.id
where p.role = 'student';
