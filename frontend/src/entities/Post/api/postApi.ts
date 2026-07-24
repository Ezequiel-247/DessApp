import { apiClient } from '@/shared/api/apiClient';

export interface CreatePostInput {
  title: string;
  content: string;
  images?: string[];
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}

export async function createPost(input: CreatePostInput) {
  const raw = await apiClient.post('/api/posts', {
    title: input.title,
    content: input.content,
    images: input.images || [],
  });

  return raw?.data ?? raw;
}

export async function updatePost(postId: number | string, input: UpdatePostInput) {
  const raw = await apiClient.patch(`/api/posts/${postId}`, {
    title: input.title,
    content: input.content,
  });

  return raw?.data ?? raw;
}

export async function deletePost(postId: number | string) {
  return apiClient.delete(`/api/posts/${postId}`);
}

export async function uploadPostImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }
  const raw = await apiClient.post('/api/upload/post-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return raw?.data ?? [];
}
