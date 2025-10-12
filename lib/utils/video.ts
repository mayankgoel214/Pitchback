export async function uploadVideo(
  sessionId: string,
  videoBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  // TODO: Implement video upload
  throw new Error('Not implemented');
}

export async function compressVideo(videoBlob: Blob): Promise<Blob> {
  // TODO: Implement video compression
  throw new Error('Not implemented');
}
