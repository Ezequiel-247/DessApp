/**
 * LoginForm - Formulario de inicio de sesión
 * Nexo - Stitch Design System
 *
 * TODO: Mantener simple - el backend determinará el rol
 * - No agregar selección de rol aquí (login es genérico)
 * - El AuthContext debe manejar redirección según rol
 * - Implementar "remember me" y "forgot password"
 */
import { useState, FormEvent, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { FormField } from "@/widgets/ui/FormField";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const clearFieldError = (field: "email" | "password") => {
    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = "El correo electrónico es obligatorio.";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Ingresá un correo electrónico válido.";
    }

    if (!password.trim()) {
      nextErrors.password = "La contraseña es obligatoria.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await login(email, password);
      const role = (userData.role || '').toString().toUpperCase();
      const fallbackDestination = role === 'ADMIN' ? '/admin/careers' : '/student/dashboard';
      const destination = fromPath || fallbackDestination;
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-md">
      {/* Email Input */}
      <FormField label="Correo Electrónico" error={validationErrors.email ?? ""} stackClassName="space-y-base">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline-variant">
            mail
          </span>
          <input
            className={`w-full bg-surface-bright border rounded-DEFAULT py-sm pl-[44px] pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 transition-colors placeholder:text-outline ${validationErrors.email ? "border-error focus:border-error focus:ring-error/15" : "border-outline-variant focus:ring-primary focus:border-primary"}`}
            id="email"
            name="email"
            placeholder="estudiante@universidad.edu"
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
          />
        </div>
      </FormField>
      
      {/* Password Input */}
      <FormField label="Contraseña" error={validationErrors.password ?? ""} stackClassName="space-y-base">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline-variant">
            lock
          </span>
          <input
            className={`w-full bg-surface-bright border rounded-DEFAULT py-sm pl-[44px] pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:ring-1 transition-colors placeholder:text-outline ${validationErrors.password ? "border-error focus:border-error focus:ring-error/15" : "border-outline-variant focus:ring-primary focus:border-primary"}`}
            id="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setPassword(event.target.value);
              clearFieldError("password");
            }}
          />
        </div>
      </FormField>

      {error && (
        <p className="text-body-sm text-error mt-1">{error}</p>
      )}

      {/* Options Row */}
      <div className="flex items-center justify-between mt-base">
        <label className="flex items-center gap-xs cursor-pointer group">
          <input className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface-container-lowest" type="checkbox" />
          <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Recordarme</span>
        </label>
        <a className="font-body-sm text-body-sm text-primary hover:text-primary-container font-medium transition-colors" href="#">
          ¿Olvidé mi contraseña?
        </a>
      </div>
      
      {/* Submit Button */}
      <button 
        className="mt-xs w-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors rounded-DEFAULT py-sm font-title-sm text-title-sm flex justify-center items-center gap-xs shadow-sm shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed" 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Iniciando..." : "Acceder al Portal"}
        {!isLoading && (
          <span className="material-symbols-outlined text-[20px]">
            arrow_forward
          </span>
        )}
      </button>
    </form>
  );
}

