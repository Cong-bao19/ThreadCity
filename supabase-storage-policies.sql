-- Đảm bảo bucket "posts" đã được tạo
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Kích hoạt RLS cho bucket "posts"
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Xóa các policy cũ nếu có
DROP POLICY IF EXISTS "Public Read Access for Posts Images" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Upload to Their Own Folder" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Update Their Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Their Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Public View Buckets" ON storage.buckets;

-- Policy cho phép đọc ảnh công khai cho tất cả người dùng (đã authenticated hoặc anonymous)
CREATE POLICY "Public Read Access for Posts Images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'posts');

-- Policy cho phép người dùng đã xác thực tải lên ảnh vào bucket posts
CREATE POLICY "Authenticated Users Can Upload Posts Images" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'posts');

-- Policy cho phép người dùng cập nhật file trong bucket posts
CREATE POLICY "Authenticated Users Can Update Posts Images" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (bucket_id = 'posts');

-- Policy cho phép người dùng xóa file của bucket posts
CREATE POLICY "Authenticated Users Can Delete Posts Images" 
ON storage.objects FOR DELETE 
TO authenticated
USING (bucket_id = 'posts');

-- Đảm bảo tất cả người dùng có thể xem danh sách bucket
CREATE POLICY "Public View Buckets" 
ON storage.buckets FOR SELECT 
USING (true);