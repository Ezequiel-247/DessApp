import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNovelties } from '@/features/novelties';

const getNoveltiesMock = vi.fn();
const createPostMock = vi.fn();
const updatePostMock = vi.fn();
const deletePostMock = vi.fn();

vi.mock('@/entities/Novelty', () => ({
  getNovelties: (...args: unknown[]) => getNoveltiesMock(...args),
}));

vi.mock('@/entities/Post', () => ({
  createPost: (...args: unknown[]) => createPostMock(...args),
  updatePost: (...args: unknown[]) => updatePostMock(...args),
  deletePost: (...args: unknown[]) => deletePostMock(...args),
}));

describe('useNovelties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga novedades al montar', async () => {
    getNoveltiesMock.mockResolvedValue({
      data: [{ id: 'post-1', type: 'post', title: 'Hola', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' }],
      pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
    });

    const { result } = renderHook(() => useNovelties());

    await waitFor(() => expect(result.current.novelties).toHaveLength(1));
    expect(getNoveltiesMock).toHaveBeenCalledWith({ limit: 30, offset: 0 });
  });

  it('loadMore agrega resultados cuando hay más páginas', async () => {
    getNoveltiesMock
      .mockResolvedValueOnce({
        data: [{ id: 'post-1', type: 'post', title: 'Uno', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' }],
        pagination: { total: 2, limit: 30, offset: 0, hasMore: true },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'post-2', type: 'post', title: 'Dos', author: { id: 2, name: 'Juan', avatar: null }, date: '2026-01-02T00:00:00.000Z' }],
        pagination: { total: 2, limit: 30, offset: 30, hasMore: false },
      });

    const { result } = renderHook(() => useNovelties());

    await waitFor(() => expect(result.current.novelties).toHaveLength(1));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(getNoveltiesMock).toHaveBeenNthCalledWith(2, { limit: 30, offset: 30 });
    expect(result.current.novelties).toHaveLength(2);
  });

  it('publishPost publica y refresca feed', async () => {
    getNoveltiesMock
      .mockResolvedValueOnce({
        data: [],
        pagination: { total: 0, limit: 30, offset: 0, hasMore: false },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'post-3', type: 'post', title: 'Nuevo', content: 'Contenido', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-03T00:00:00.000Z' }],
        pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      });

    createPostMock.mockResolvedValue({ id: 3 });

    const { result } = renderHook(() => useNovelties());

    await waitFor(() => expect(getNoveltiesMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.publishPost('Titulo', 'Contenido del post');
    });

    expect(createPostMock).toHaveBeenCalledWith({ title: 'Titulo', content: 'Contenido del post' });
    expect(getNoveltiesMock).toHaveBeenCalledTimes(2);
    expect(result.current.novelties).toHaveLength(1);
  });

  it('editPost actualiza y refresca feed', async () => {
    getNoveltiesMock
      .mockResolvedValueOnce({
        data: [{ id: 'post-1', postId: 1, type: 'post', title: 'Viejo', content: 'Texto', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' }],
        pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      })
      .mockResolvedValueOnce({
        data: [{ id: 'post-1', postId: 1, type: 'post', title: 'Nuevo', content: 'Texto editado', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' }],
        pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      });

    updatePostMock.mockResolvedValue({ id: 1 });

    const { result } = renderHook(() => useNovelties());
    await waitFor(() => expect(result.current.novelties).toHaveLength(1));

    await act(async () => {
      await result.current.editPost(1, 'Nuevo', 'Texto editado');
    });

    expect(updatePostMock).toHaveBeenCalledWith(1, { title: 'Nuevo', content: 'Texto editado' });
    expect(result.current.novelties[0].title).toBe('Nuevo');
  });

  it('removePost elimina y refresca feed', async () => {
    getNoveltiesMock
      .mockResolvedValueOnce({
        data: [{ id: 'post-1', postId: 1, type: 'post', title: 'Post', content: 'Texto', author: { id: 1, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' }],
        pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      })
      .mockResolvedValueOnce({
        data: [],
        pagination: { total: 0, limit: 30, offset: 0, hasMore: false },
      });

    deletePostMock.mockResolvedValue({});

    const { result } = renderHook(() => useNovelties());
    await waitFor(() => expect(result.current.novelties).toHaveLength(1));

    await act(async () => {
      await result.current.removePost(1);
    });

    expect(deletePostMock).toHaveBeenCalledWith(1);
    expect(result.current.novelties).toHaveLength(0);
  });
});
