import { createClient } from "./client";

export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient();

  // Generate unique filename if path not provided
  const fileName = path || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

export async function getFileUrl(bucket: string, path: string): Promise<string> {
  const supabase = createClient();

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}
