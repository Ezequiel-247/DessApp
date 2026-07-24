import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePostComments } from '@/features/comments';

const getCommentsMock = vi.fn();
const createCommentMock = vi.fn();
const deleteCommentMock = vi.fn();

vi.mock('@/entities/Comment', () => ({
  getComments: (...args: unknown[]) => getCommentsMock(...args),
  createComment: (...args: unknown[]) => createCommentMock(...args),
  deleteComment: (...args: unknown[]) => deleteCommentMock(...args),
}));

describe('usePostComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga comentarios cuando enabled es true', async () => {
    getCommentsMock.mockResolvedValue([
      { id: 1, targetType: 'post', targetId: 10, content: 'Hola', author: { id: 2, name: 'Ana', avatar: null }, date: '2026-01-01T00:00:00.000Z' },
    ]);

    const { result } = renderHook(() => usePostComments('post', 10, { enabled: true }));

    await waitFor(() => expect(result.current.comments).toHaveLength(1));
    expect(getCommentsMock).toHaveBeenCalledWith({ targetType: 'post', targetId: 10 });
  });

  it('addComment crea y refresca comentarios', async () => {
    getCommentsMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 2, targetType: 'post', targetId: 10, content: 'Nuevo', author: { id: 2, name: 'Ana', avatar: null }, date: '2026-01-01T01:00:00.000Z' },
      ]);
    createCommentMock.mockResolvedValue({ id: 2 });

    const { result } = renderHook(() => usePostComments('post', 10, { enabled: true }));
    await waitFor(() => expect(getCommentsMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.addComment('Nuevo');
    });

    expect(createCommentMock).toHaveBeenCalledWith({ targetType: 'post', targetId: 10, content: 'Nuevo' });
    expect(getCommentsMock).toHaveBeenCalledTimes(2);
    expect(result.current.comments).toHaveLength(1);
  });

  it('removeComment elimina y refresca comentarios', async () => {
    getCommentsMock
      .mockResolvedValueOnce([
        { id: 2, targetType: 'post', targetId: 10, content: 'Nuevo', author: { id: 2, name: 'Ana', avatar: null }, date: '2026-01-01T01:00:00.000Z' },
      ])
      .mockResolvedValueOnce([]);
    deleteCommentMock.mockResolvedValue({});

    const { result } = renderHook(() => usePostComments('post', 10, { enabled: true }));
    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await act(async () => {
      await result.current.removeComment(2);
    });

    expect(deleteCommentMock).toHaveBeenCalledWith(2);
    expect(result.current.comments).toHaveLength(0);
  });
});
