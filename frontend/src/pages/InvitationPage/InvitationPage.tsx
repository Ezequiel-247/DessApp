import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/app/AuthContext';
import { getInvitationByToken, respondInvitation } from '@/entities/Connection';
import { PageHeader } from '@/widgets/ui/PageHeader';
import { Button } from '@/widgets/ui/Button';

interface InvitationData {
  id: string;
  status: string;
  target_email: string;
  inviter: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    avatar?: string | null;
  };
}

export function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isFetchingInvitation, setIsFetchingInvitation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    let mounted = true;

    const loadInvitation = async () => {
      setIsFetchingInvitation(true);
      setError(null);

      try {
        const response = await getInvitationByToken(token);
        if (!mounted) {
          return;
        }

        setInvitation(response.data);
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'No se pudo cargar la invitacion');
      } finally {
        if (mounted) {
          setIsFetchingInvitation(false);
        }
      }
    };

    loadInvitation();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="text-on-surface-variant">Cargando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleResponse = async (action: 'accept' | 'reject') => {
    if (!token) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await respondInvitation(token, action);
      navigate('/student/connections', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'No se pudo responder la invitacion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-sm md:p-margin">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          className="mb-lg"
          title="Invitacion de conexion"
          description="Responde la invitacion para agregar este contacto a tu red."
          titleClassName="font-headline-md text-headline-md text-on-background"
          descriptionClassName="mt-2 font-body-md text-body-md text-on-surface-variant"
        />

        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-5 md:p-6">
          {isFetchingInvitation ? (
            <p className="text-on-surface-variant">Cargando invitacion...</p>
          ) : error ? (
            <p className="text-error">{error}</p>
          ) : !invitation ? (
            <p className="text-on-surface-variant">No se encontro la invitacion.</p>
          ) : (
            <>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-title-sm">
                  {(invitation.inviter.name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <h2 className="font-title-sm text-title-sm text-on-surface">
                    {invitation.inviter.name} {invitation.inviter.lastname}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {invitation.inviter.email}
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Estado actual: {invitation.status}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  disabled={isSubmitting || invitation.status !== 'pending'}
                  className="flex-1"
                  onClick={() => handleResponse('accept')}
                >
                  {isSubmitting ? 'Procesando...' : 'Aceptar invitacion'}
                </Button>
                <Button
                  variant="secondary"
                  disabled={isSubmitting || invitation.status !== 'pending'}
                  className="flex-1"
                  onClick={() => handleResponse('reject')}
                >
                  Rechazar invitacion
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
