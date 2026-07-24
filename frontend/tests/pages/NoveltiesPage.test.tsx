import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoveltiesPage } from '@/pages/StudentPage/NoveltiesPage';

const useNoveltiesMock = vi.fn();
const usePostCommentsMock = vi.fn();

vi.mock('@/features/novelties', () => ({
  useNovelties: () => useNoveltiesMock(),
}));

vi.mock('@/features/comments', () => ({
  usePostComments: (...args: unknown[]) => usePostCommentsMock(...args),
}));

vi.mock('@/app/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1' } }),
}));

describe('NoveltiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePostCommentsMock.mockReturnValue({
      comments: [],
      isLoading: false,
      isCreating: false,
      isDeleting: false,
      error: null,
      addComment: vi.fn(),
      removeComment: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it('renderiza estado vacío', () => {
    useNoveltiesMock.mockReturnValue({
      novelties: [],
      pagination: { total: 0, limit: 30, offset: 0, hasMore: false },
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      isUpdatingPost: false,
      isDeletingPost: false,
      error: null,
      publishPost: vi.fn(),
      editPost: vi.fn(),
      removePost: vi.fn(),
      loadMore: vi.fn(),
    });

    render(<NoveltiesPage />);

    expect(screen.getByText('Novedades')).toBeInTheDocument();
    expect(screen.getByText(/Aún no hay novedades de tus contactos/i)).toBeInTheDocument();
  });

  it('permite publicar un posteo', async () => {
    const publishPost = vi.fn().mockResolvedValue(undefined);

    useNoveltiesMock.mockReturnValue({
      novelties: [],
      pagination: { total: 0, limit: 30, offset: 0, hasMore: false },
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      isUpdatingPost: false,
      isDeletingPost: false,
      error: null,
      publishPost,
      editPost: vi.fn(),
      removePost: vi.fn(),
      loadMore: vi.fn(),
    });

    render(<NoveltiesPage />);

    fireEvent.change(screen.getByPlaceholderText('Ejemplo: Resumen de Álgebra disponible'), {
      target: { value: 'Resumen de Algebra' },
    });
    fireEvent.change(screen.getByPlaceholderText('Compartí tu novedad con tus contactos...'), {
      target: { value: 'Subi un resumen del primer parcial' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Publicar/i }));

    expect(publishPost).toHaveBeenCalledWith('Resumen de Algebra', 'Subi un resumen del primer parcial');
  });

  it('muestra botón Ver más cuando hay más páginas', () => {
    const loadMore = vi.fn();

    useNoveltiesMock.mockReturnValue({
      novelties: [
        {
          id: 'post-1',
          type: 'post',
          title: 'Hola',
          content: 'Contenido',
          author: { id: 1, name: 'Ana Lopez', avatar: null },
          date: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { total: 2, limit: 30, offset: 0, hasMore: true },
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      isUpdatingPost: false,
      isDeletingPost: false,
      error: null,
      publishPost: vi.fn(),
      editPost: vi.fn(),
      removePost: vi.fn(),
      loadMore,
    });

    render(<NoveltiesPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(loadMore).toHaveBeenCalled();
  });

  it('muestra acciones de editar y eliminar para posteo propio', () => {
    const editPost = vi.fn();
    const removePost = vi.fn();

    useNoveltiesMock.mockReturnValue({
      novelties: [
        {
          id: 'post-1',
          postId: 1,
          type: 'post',
          title: 'Hola',
          content: 'Contenido',
          author: { id: 1, name: 'Ana Lopez', avatar: null },
          date: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      isUpdatingPost: false,
      isDeletingPost: false,
      error: null,
      publishPost: vi.fn(),
      editPost,
      removePost,
      loadMore: vi.fn(),
    });

    render(<NoveltiesPage />);

    fireEvent.click(screen.getByRole('button', { name: /more_vert/i }));

    expect(screen.getByRole('button', { name: /Editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }));
    expect(screen.getByText(/Eliminar posteo/i)).toBeInTheDocument();
    const confirmButton = screen.getAllByRole('button', { name: /Eliminar/i }).at(-1);
    expect(confirmButton).toBeDefined();
    fireEvent.click(confirmButton!);
    expect(removePost).toHaveBeenCalledWith(1);
  });

  it('muestra boton Ver más comentarios cuando hay mas de dos', () => {
    usePostCommentsMock.mockReturnValue({
      comments: [
        { id: 1, content: 'Uno', date: '2026-01-01T00:00:00.000Z', author: { id: 2, name: 'Ana Lopez', avatar: null } },
        { id: 2, content: 'Dos', date: '2026-01-01T00:00:00.000Z', author: { id: 3, name: 'Juan Perez', avatar: null } },
        { id: 3, content: 'Tres', date: '2026-01-01T00:00:00.000Z', author: { id: 4, name: 'Luz Diaz', avatar: null } },
      ],
      isLoading: false,
      isCreating: false,
      isDeleting: false,
      error: null,
      addComment: vi.fn(),
      removeComment: vi.fn(),
      refetch: vi.fn(),
    });

    useNoveltiesMock.mockReturnValue({
      novelties: [
        {
          id: 'post-1',
          postId: 1,
          type: 'post',
          title: 'Hola',
          content: 'Contenido',
          commentCount: 3,
          author: { id: 1, name: 'Ana Lopez', avatar: null },
          date: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { total: 1, limit: 30, offset: 0, hasMore: false },
      isLoading: false,
      isLoadingMore: false,
      isCreatingPost: false,
      isUpdatingPost: false,
      isDeletingPost: false,
      error: null,
      publishPost: vi.fn(),
      editPost: vi.fn(),
      removePost: vi.fn(),
      loadMore: vi.fn(),
    });

    render(<NoveltiesPage />);

    fireEvent.click(screen.getByRole('button', { name: /Ver comentarios \(3\)/i }));

    expect(screen.getByRole('button', { name: 'Ver más comentarios' })).toBeInTheDocument();
  });
});
