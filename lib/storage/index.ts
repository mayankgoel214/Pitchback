// Storage utilities
export async function uploadToStorage(
  file: Blob,
  path: string
): Promise<string> {
  // TODO: Implement file upload to Supabase Storage or S3
  throw new Error('Not implemented');
}

export async function deleteFromStorage(path: string): Promise<void> {
  // TODO: Implement file deletion
  throw new Error('Not implemented');
}

export function getPublicUrl(path: string): string {
  // TODO: Implement
  return '';
}
