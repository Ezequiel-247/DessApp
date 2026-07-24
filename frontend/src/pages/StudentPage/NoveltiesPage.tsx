import { useMemo, useState, useRef, useEffect, type FormEvent } from 'react';
import { PageHeader } from '@/widgets/ui/PageHeader';
import { Card } from '@/widgets/ui/Card';
import { EmptyState } from '@/widgets/ui/EmptyState';
import { Button } from '@/widgets/ui/Button';
import { Form } from '@/widgets/ui/Form';
import { Input } from '@/widgets/ui/Input';
import { FormError } from '@/widgets/ui/FormError';
import { Modal } from '@/widgets/ui/Modal';
import { ConfirmDialog } from '@/widgets/ui/ConfirmDialog';
import { Tag } from '@/widgets/ui/Tag';
import { useNovelties } from '@/features/novelties';
import { usePostComments } from '@/features/comments';
import type { Novelty } from '@/entities/Novelty';
import type { CommentTargetType } from '@/entities/Comment';
import { resolveMediaUrl } from '@/shared/lib/resolveMediaUrl';
import { useAuth } from '@/app/AuthContext';
import { useSearchParams } from 'react-router-dom';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha desconocida';

  return date.toLocaleString('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: false,
  });
}

function getEventLabel(eventType?: string): { label: string; variant: 'info' | 'positive' | 'warning' } {
  if (eventType === 'enrollment') {
    return { label: 'Inscripción', variant: 'info' };
  }

  if (eventType === 'regularization') {
    return { label: 'Regularización', variant: 'positive' };
  }

  return { label: 'Aprobación', variant: 'positive' };
}

function getStatusLabel(status?: string): string {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'aprobado' || normalized === 'aprobada' || normalized === 'approved') return 'Aprobada';
  if (normalized === 'regular' || normalized === 'regularizado' || normalized === 'regularizada') return 'Regular';
  if (normalized === 'enrolled' || normalized === 'inscripto' || normalized === 'inscrito' || normalized === 'pendiente' || normalized === 'cursando') return 'Inscripta / En curso';
  return status || 'Sin estado';
}

function getInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (name.slice(0, 2) || 'U').toUpperCase();
}

function resolveTargetFromNovelty(item: Novelty): { targetType: CommentTargetType | null; targetId: number | null } {
  if (item.targetType && item.targetId) {
    return {
      targetType: item.targetType,
      targetId: item.targetId,
    };
  }

  if (item.type === 'post' && item.postId) {
    return { targetType: 'post', targetId: item.postId };
  }

  if (item.type === 'academic_event') {
    const parsedId = Number.parseInt(item.id.replace('academic-', ''), 10);
    if (!Number.isNaN(parsedId)) {
      return { targetType: 'academic_event', targetId: parsedId };
    }
  }

  return { targetType: null, targetId: null };
}

function CommentsSection({ item, currentUserId, noContainerBorder }: { item: Novelty; currentUserId: number | null; noContainerBorder?: boolean }) {
  const [activeSection, setActiveSection] = useState<'comments' | 'form' | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [deleteConfirmCommentId, setDeleteConfirmCommentId] = useState<number | null>(null);

  const target = useMemo(() => resolveTargetFromNovelty(item), [item]);
  const {
    comments,
    isLoading,
    isCreating,
    isDeleting,
    error,
    addComment,
    removeComment,
    voteComment,
  } = usePostComments(target.targetType, target.targetId, { enabled: activeSection === 'comments' });

  const totalComments = Math.max(typeof item.commentCount === 'number' ? item.commentCount : 0, comments.length);
  const visibleComments = showAll ? comments : comments.slice(0, 2);
  const hasHiddenComments = comments.length > 2 && !showAll;

  const toggleComments = () => {
    setActiveSection((prev) => {
      if (prev === 'comments') {
        setShowAll(false);
        setLocalError(null);
        return null;
      }
      return 'comments';
    });
  };

  const toggleForm = () => {
    setActiveSection((prev) => {
      if (prev === 'form') return null;
      setShowAll(false);
      setLocalError(null);
      return 'form';
    });
  };

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    const content = commentInput.trim();
    if (!content) {
      setLocalError('Escribí un comentario antes de publicar.');
      return;
    }

    try {
      await addComment(content);
      setCommentInput('');
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo crear el comentario');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    setLocalError(null);

    try {
      await removeComment(commentId);
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo eliminar el comentario');
    }
  };

  return (
    <div className={noContainerBorder ? '' : 'mt-4 border-t border-outline-variant pt-3'}>
      <div className="flex items-center gap-2">
        <Button type="button" variant="secondary" onClick={toggleComments} disabled={totalComments === 0}>
          <span className="material-symbols-outlined text-[24px]">
            {activeSection === 'comments' ? 'expand_less' : 'expand_more'}
          </span>
          {totalComments === 0 ? 'Sin comentarios' : activeSection === 'comments' ? `Ocultar comentarios (${totalComments})` : `Ver comentarios (${totalComments})`}
        </Button>
        <Button type="button" variant="primary" onClick={toggleForm}>
          <span className="material-symbols-outlined text-[24px]">comment</span>
        </Button>
      </div>

      {activeSection === 'comments' && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <p className="text-body-sm text-on-surface-variant">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">Todavía no hay comentarios.</p>
          ) : (
            <div className="space-y-2">
              {visibleComments.map((comment) => {
                const avatar = resolveMediaUrl(comment.author.avatar);
                const isOwnComment = currentUserId !== null && Number(comment.author.id) === Number(currentUserId);

                return (
                  <div key={comment.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center text-body-sm font-semibold text-on-surface-variant">
                          {avatar ? (
                            <img src={avatar} alt={comment.author.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(comment.author.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-title-sm text-title-sm text-on-surface">{comment.author.name}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(comment.date)}</p>
                        </div>
                      </div>

                      {isOwnComment ? (
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isDeleting}
                          onClick={() => setDeleteConfirmCommentId(comment.id)}
                          className="hover:bg-error hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[24px]">delete</span>
                        </Button>
                      ) : null}
                    </div>

                    <p className="mt-2 text-body-sm text-on-surface-variant whitespace-pre-line">{comment.content}</p>

                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => voteComment(comment.id, 'up')}
                        disabled={isOwnComment}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors text-xs ${
                          comment.myVote === 'up'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-outline hover:text-primary hover:bg-primary/5'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isOwnComment ? 'No puedes votar tu comentario' : (comment.myVote === 'up' ? 'Quitar voto' : 'Votar positivo')}
                      >
                        <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                        <span>{comment.likesCount ?? 0}</span>
                      </button>
                      <button
                        onClick={() => voteComment(comment.id, 'down')}
                        disabled={isOwnComment}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors text-xs ${
                          comment.myVote === 'down'
                            ? 'bg-error/10 text-error font-semibold'
                            : 'text-outline hover:text-error hover:bg-error/5'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isOwnComment ? 'No puedes votar tu comentario' : (comment.myVote === 'down' ? 'Quitar voto' : 'Votar negativo')}
                      >
                        <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                        <span>{comment.dislikesCount ?? 0}</span>
                      </button>
                      {(comment.valoracionRatio !== undefined && comment.valoracionRatio !== null && (comment.likesCount > 0 || comment.dislikesCount > 0)) ? (
                        <>
                          <span className="text-xs text-outline font-medium">
                            {Math.round(comment.valoracionRatio * 100)}% positivo
                          </span>
                          <div className="w-12 h-1 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-secondary transition-all"
                              style={{ width: `${Math.round(comment.valoracionRatio * 100)}%` }}
                            />
                            <div
                              className="h-full bg-error transition-all"
                              style={{ width: `${Math.round((1 - comment.valoracionRatio) * 100)}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-outline-variant font-medium">Sin votos</span>
                          <div className="w-12 h-1 rounded-full bg-outline-variant/50 overflow-hidden" />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {hasHiddenComments ? (
                <button
                  type="button"
                  className="text-body-sm text-primary hover:underline"
                  onClick={() => setShowAll(true)}
                >
                  Ver más comentarios
                </button>
              ) : null}

              {comments.length > 2 && showAll ? (
                <button
                  type="button"
                  className="text-body-sm text-primary hover:underline"
                  onClick={() => setShowAll(false)}
                >
                  Ver menos comentarios
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {activeSection === 'form' && (
        <form onSubmit={handleAddComment} className="mt-3">
          <Form>
            <Form.Field label="Comentario" required>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Escribí un comentario..."
                rows={2}
                className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary resize-y placeholder:text-outline"
              />
            </Form.Field>

            {(localError || error) ? (
              <FormError message={localError || error} />
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={isCreating || commentInput.trim().length === 0}>
                {isCreating ? (
                  'Comentando...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">send</span>
                    Comentar
                  </>
                )}
              </Button>
            </div>
          </Form>
        </form>
      )}

      <ConfirmDialog
        isOpen={deleteConfirmCommentId !== null}
        title="Eliminar comentario"
        description="¿Estás seguro de que querés eliminar este comentario?"
        confirmLabel="Eliminar"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => { if (deleteConfirmCommentId !== null) handleDeleteComment(deleteConfirmCommentId); setDeleteConfirmCommentId(null); }}
        onCancel={() => setDeleteConfirmCommentId(null)}
      />
    </div>
  );
}

export function NoveltiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : null;
  const {
    novelties,
    pagination,
    isLoading,
    isLoadingMore,
    isCreatingPost,
    isUpdatingPost,
    isDeletingPost,
    error,
    publishPost,
    editPost,
    removePost,
    votePost,
    voteAcademicEvent,
    loadMore,
  } = useNovelties();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [editModalData, setEditModalData] = useState<{ postId: number; title: string; content: string } | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [actionMenuPostId, setActionMenuPostId] = useState<number | null>(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<number | null>(null);
  const [highlightedPostId, setHighlightedPostId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenuPostId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const postParam = searchParams.get('post');
    if (!postParam) return;

    const postId = Number.parseInt(postParam, 10);
    if (Number.isNaN(postId) || postId <= 0) return;

    const postElement = document.getElementById(`novelty-post-${postId}`);
    if (!postElement) return;

    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedPostId(postId);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('post');
    setSearchParams(nextParams, { replace: true });

    const timeoutId = window.setTimeout(() => {
      setHighlightedPostId((current) => (current === postId ? null : current));
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [novelties, searchParams, setSearchParams]);

  const canPublish = useMemo(() => {
    return title.trim().length >= 3 && content.trim().length >= 5 && !isCreatingPost;
  }, [title, content, isCreatingPost]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];
    const invalid: string[] = [];
    for (const f of files) {
      if (f.size > 25 * 1024 * 1024) {
        invalid.push(`${f.name} (>25MB)`);
      } else {
        valid.push(f);
      }
    }
    const combined = [...selectedFiles, ...valid].slice(0, 5);
    setSelectedFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
    if (invalid.length > 0) {
      setLocalError(`Imagen(es) omitidas por exceder 25MB: ${invalid.join(', ')}`);
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!canPublish) {
      setLocalError('Completa título y contenido antes de publicar.');
      return;
    }

    try {
      await publishPost(title.trim(), content.trim(), selectedFiles.length > 0 ? selectedFiles : undefined);
      setTitle('');
      setContent('');
      setSelectedFiles([]);
      setPreviews((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return []; });
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo publicar el posteo');
    }
  };

  const startEditing = (postId: number, initialTitle: string, initialContent: string) => {
    setEditModalData({ postId, title: initialTitle, content: initialContent });
    setLocalError(null);
  };

  const cancelEditing = () => {
    setEditModalData(null);
    setLocalError(null);
  };

  const handleEditSubmit = async () => {
    if (!editModalData) return;

    try {
      await editPost(editModalData.postId, editModalData.title.trim(), editModalData.content.trim());
      setEditModalData(null);
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo editar el posteo');
    }
  };

  const handleEditChange = (field: 'title' | 'content', value: string) => {
    setEditModalData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleDelete = async (postId: number) => {
    try {
      await removePost(postId);
    } catch (err: any) {
      setLocalError(err?.message || 'No se pudo eliminar el posteo');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto space-y-gutter">
        <PageHeader
          eyebrow="Feed de actividad"
          title="Novedades"
        />

        <Card header={<h2 className="font-title-sm text-title-sm text-on-surface">Crear posteo</h2>}>
          <form onSubmit={handleSubmit}>
            <Form>
              <Form.Field label="Título" required>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ejemplo: Resumen de Álgebra disponible"
                />
              </Form.Field>

              <Form.Field label="Contenido" required>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Compartí tu novedad con tus contactos..."
                  rows={4}
                  className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary resize-y placeholder:text-outline"
                />
              </Form.Field>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {previews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded overflow-hidden border border-outline-variant group">
                      <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(localError || error) ? (
                <FormError message={localError || error} />
              ) : null}

              <div className="flex justify-between items-center">
                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-sm text-outline hover:text-primary transition-colors cursor-pointer" title="Adjuntar imágenes (máx. 5)">
                    <span className="material-symbols-outlined text-[22px]">attach_file</span>
                    <span className="text-xs">{selectedFiles.length}/5</span>
                  </button>
                </div>
                <Button type="submit" disabled={!canPublish}>
                  {isCreatingPost ? (
                    'Publicando...'
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[24px]">publish</span>
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </form>
        </Card>

          {isLoading ? (
            <p className="text-body-sm text-on-surface-variant">Cargando novedades...</p>
          ) : novelties.length === 0 ? (
            <EmptyState>
              Aún no hay novedades de tus contactos. Cuando publiquen o compartan actividad académica, las vas a ver acá.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {novelties.map((item) => {
                const avatar = resolveMediaUrl(item.author.avatar);
                const event = getEventLabel(item.eventType);
                const isOwnContent = Number(item.author.id) === Number(currentUserId);
                const postContainerId = item.type === 'post' && item.postId ? `novelty-post-${item.postId}` : undefined;
                const isHighlighted = item.type === 'post' && item.postId && highlightedPostId === item.postId;

                return (
                  <div
                    key={item.id}
                    id={postContainerId}
                    className={`rounded-xl transition-all duration-300 ${isHighlighted ? 'ring-2 ring-primary shadow-lg' : ''}`}
                  >
                    <Card
                      footer={
                        <CommentsSection item={item} currentUserId={currentUserId} noContainerBorder />
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container flex items-center justify-center text-body-sm font-semibold text-on-surface-variant">
                          {avatar ? (
                            <img src={avatar} alt={item.author.name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(item.author.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-title-sm text-title-sm text-on-surface">{item.author.name}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">{formatDate(item.date)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {item.type === 'academic_event' ? (
                          <Tag variant={event.variant}>{event.label}</Tag>
                        ) : (
                          <Tag variant="info">Posteo</Tag>
                        )}
                        {isOwnContent && item.postId && item.type === 'post' ? (
                          <div className="relative" ref={actionMenuPostId === item.postId ? menuRef : null}>
                            <Button variant="ghost" className="!px-1" onClick={() => setActionMenuPostId(item.postId!)}>
                              <span className="material-symbols-outlined text-[24px]">more_vert</span>
                            </Button>
                            {actionMenuPostId === item.postId && (
                              <div className="absolute right-0 top-full mt-1 z-30 min-w-[160px] bg-white border border-outline-variant rounded shadow-lg overflow-hidden">
                                <button
                                  onClick={() => { startEditing(item.postId!, item.title, item.content || ''); setActionMenuPostId(null); }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">edit</span>
                                  Editar
                                </button>
                                <button
                                  onClick={() => { setDeleteConfirmPostId(item.postId!); setActionMenuPostId(null); }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[20px]">delete</span>
                                  Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                      <div className="mt-3">
                        <h3 className="font-title-sm text-title-sm text-on-surface">{item.title}</h3>

                        {item.type === 'academic_event' ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-body-sm text-on-surface-variant">
                              Actualizó su estado académico en {item.subjectCode ? `${item.title} (${item.subjectCode})` : item.title}.
                            </p>
                            <p className="text-body-sm text-on-surface">
                              Estado: <span className="font-semibold">{getStatusLabel(item.status)}</span>
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-body-sm text-on-surface-variant whitespace-pre-line">{item.content}</p>
                        )}

                        {item.images && item.images.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {item.images.map((img: string, idx: number) => (
                              <a key={idx} href={resolveMediaUrl(img)} target="_blank" rel="noopener noreferrer" className="block aspect-video rounded overflow-hidden border border-outline-variant bg-surface-bright">
                                <img src={resolveMediaUrl(img)} alt={`post-image-${idx}`} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center gap-0">
                            <button
                              onClick={() => {
                                if (item.type === 'post' && item.postId) votePost(item.postId, 'up');
                                if (item.type === 'academic_event' && item.targetId) voteAcademicEvent(item.targetId, 'up');
                              }}
                              disabled={isOwnContent}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors text-xs ${
                                item.myVote === 'up'
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-outline hover:text-primary hover:bg-primary/5'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={isOwnContent ? 'No puedes votar tu propio contenido' : (item.myVote === 'up' ? 'Quitar voto' : 'Votar positivo')}
                            >
                              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                              <span>{item.likesCount ?? 0}</span>
                            </button>
                            <button
                              onClick={() => {
                                if (item.type === 'post' && item.postId) votePost(item.postId, 'down');
                                if (item.type === 'academic_event' && item.targetId) voteAcademicEvent(item.targetId, 'down');
                              }}
                              disabled={isOwnContent}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-colors text-xs ${
                                item.myVote === 'down'
                                  ? 'bg-error/10 text-error font-semibold'
                                  : 'text-outline hover:text-error hover:bg-error/5'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={isOwnContent ? 'No puedes votar tu propio contenido' : (item.myVote === 'down' ? 'Quitar voto' : 'Votar negativo')}
                            >
                              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                              <span>{item.dislikesCount ?? 0}</span>
                            </button>
                          </div>
                          {item.valoracionRatio !== undefined && item.valoracionRatio !== null && (item.likesCount > 0 || item.dislikesCount > 0) ? (
                            <>
                              <span className="text-xs text-outline font-medium">
                                {Math.round((item.valoracionRatio ?? 0) * 100)}% positivo
                              </span>
                              <div className="w-16 h-1.5 rounded-full overflow-hidden flex">
                                <div
                                  className="h-full bg-secondary transition-all"
                                  style={{ width: `${Math.round((item.valoracionRatio ?? 0) * 100)}%` }}
                                />
                                <div
                                  className="h-full bg-error transition-all"
                                  style={{ width: `${Math.round((1 - (item.valoracionRatio ?? 0)) * 100)}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-outline-variant font-medium">Sin votos</span>
                              <div className="w-16 h-1.5 rounded-full bg-outline-variant/50 overflow-hidden" />
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}

              {pagination.hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button variant="secondary" onClick={loadMore} disabled={isLoadingMore}>
                    {isLoadingMore ? 'Cargando...' : 'Ver más'}
                  </Button>
                </div>
              ) : null}
            </div>
          )}

        <Modal
          isOpen={editModalData !== null}
          onClose={cancelEditing}
          title="Editar posteo"
          size="md"
          footer={
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={cancelEditing}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={!editModalData || editModalData.title.trim().length < 3 || editModalData.content.trim().length < 5}
                onClick={handleEditSubmit}
              >
                {isUpdatingPost ? (
                  'Guardando...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">save</span>
                    Guardar
                  </>
                )}
              </Button>
            </div>
          }
        >
          <Form>
            <Form.Field label="Título" required>
              <Input
                value={editModalData?.title || ''}
                onChange={(e) => handleEditChange('title', e.target.value)}
                placeholder="Ejemplo: Resumen de Álgebra disponible"
              />
            </Form.Field>

            <Form.Field label="Contenido" required>
              <textarea
                value={editModalData?.content || ''}
                onChange={(e) => handleEditChange('content', e.target.value)}
                placeholder="Compartí tu novedad con tus contactos..."
                rows={4}
                className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary resize-y placeholder:text-outline"
              />
            </Form.Field>

            {localError ? (
              <FormError message={localError} />
            ) : null}
          </Form>
        </Modal>

        <ConfirmDialog
          isOpen={deleteConfirmPostId !== null}
          title="Eliminar posteo"
          description="¿Estás seguro de que querés eliminar este posteo? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          variant="danger"
          isLoading={isDeletingPost}
          onConfirm={() => { if (deleteConfirmPostId !== null) handleDelete(deleteConfirmPostId); setDeleteConfirmPostId(null); }}
          onCancel={() => setDeleteConfirmPostId(null)}
        />
      </div>
    </div>
  );
}
