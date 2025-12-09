
-- Create the storage bucket 'face-images' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('face-images', 'face-images', true)
on conflict (id) do nothing;

-- Enable RLS on objects
alter table storage.objects enable row level security;

-- Policy: Allow public access to view/download images (needed for Python API and Frontend display)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'face-images' );

-- Policy: Allow Authenticated users (Admin/Teacher) to upload images
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'face-images' );

-- Policy: Allow Authenticated users to update/delete their uploads (or all for Admin)
-- For simplicity, allowing authenticated users to do everything on this bucket
create policy "Authenticated Update"
on storage.objects for update
to authenticated
using ( bucket_id = 'face-images' );

create policy "Authenticated Delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'face-images' );
