import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { getCareers } from "@/entities/Career";
import { getPlans } from "@/entities/Plan";
import type { Career } from "@/entities/Career";
import type { Plan } from "@/entities/Plan";

type ValidationErrors = { [key: string]: string | undefined };

interface EnrollmentRow {
  careerId: number | null;
  studyPlanId: number | null;
  enrolledAt: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [studentData, setStudentData] = useState({
    legajo: "",
    enrollments: [{ careerId: null, studyPlanId: null, enrolledAt: "" }] as EnrollmentRow[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [careers, setCareers] = useState<Career[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    getCareers().then(setCareers).catch(() => {});
    getPlans().then(setPlans).catch(() => {});
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name in validationErrors) {
      setValidationErrors((current) => {
        const next = { ...current };
        delete next[name as keyof ValidationErrors];
        return next;
      });
    }
  };

  const handleEnrollmentChange = (index: number, field: keyof EnrollmentRow, value: any) => {
    setStudentData(prev => {
      const rows = [...prev.enrollments];
      rows[index] = { ...rows[index], [field]: value };
      if (field === "careerId") {
        rows[index].studyPlanId = null;
      }
      return { ...prev, enrollments: rows };
    });
  };

  const addEnrollmentRow = () => {
    setStudentData(prev => ({
      ...prev,
      enrollments: [...prev.enrollments, { careerId: null, studyPlanId: null, enrolledAt: "" }],
    }));
  };

  const removeEnrollmentRow = (index: number) => {
    setStudentData(prev => ({
      ...prev,
      enrollments: prev.enrollments.filter((_, i) => i !== index),
    }));
  };

  const validateStep1 = (): boolean => {
    const nextErrors: ValidationErrors = {};

    if (!formData.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!formData.lastname.trim()) nextErrors.lastname = "El apellido es obligatorio.";

    const emailValue = formData.email.trim();
    if (!emailValue) nextErrors.email = "El correo institucional es obligatorio.";
    else if (!emailPattern.test(emailValue)) nextErrors.email = "Ingresá un correo institucional válido.";

    if (!formData.password.trim()) nextErrors.password = "La contraseña es obligatoria.";
    else if (formData.password.length < 6) nextErrors.password = "La contraseña debe tener al menos 6 caracteres.";

    if (!formData.confirmPassword.trim()) nextErrors.confirmPassword = "Repetí la contraseña.";
    else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = "Las contraseñas no coinciden.";

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const nextErrors: ValidationErrors = {};

    if (formData.role === "student") {
      if (!studentData.legajo.trim()) {
        nextErrors.legajo = "El legajo es obligatorio.";
      }
      studentData.enrollments.forEach((row, i) => {
        if (!row.careerId) nextErrors[`career_${i}`] = "Seleccioná una carrera.";
        if (!row.studyPlanId) nextErrors[`plan_${i}`] = "Seleccioná un plan.";
        if (!row.enrolledAt) nextErrors[`date_${i}`] = "Seleccioná una fecha.";
      });
      const selectedCareerIds = studentData.enrollments
        .map(r => r.careerId)
        .filter((id): id is number => id !== null);
      if (new Set(selectedCareerIds).size !== selectedCareerIds.length) {
        nextErrors.duplicateCareer = "No podés seleccionar la misma carrera más de una vez.";
      }
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const payload: Record<string, any> = {
        name: formData.name,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "student") {
        payload.legajo = studentData.legajo;
        payload.enrollments = studentData.enrollments
          .filter(r => r.careerId && r.studyPlanId && r.enrolledAt)
          .map(r => ({
            career_id: r.careerId,
            study_plan_id: r.studyPlanId,
            enrolled_at: r.enrolledAt,
          }));
      }

      await register(payload);
      const destination = '/student/dashboard';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || "Error al registrar usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCareerIds = studentData.enrollments.map(r => r.careerId).filter((id): id is number => id !== null);

  return (
    <form noValidate onSubmit={step === 1 ? handleNext : handleSubmit} className="flex flex-col flex-grow">
      {step === 1 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="name">Nombres</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">person</span>
                <input
                  className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.name ? "border-error focus:border-error focus:ring-1 focus:ring-error/15" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  id="name" name="name" placeholder="Ej. Juan Carlos" type="text"
                  value={formData.name} onChange={handleChange}
                />
              </div>
              {validationErrors.name && <p className="text-xs text-error">{validationErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="lastname">Apellidos</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">badge</span>
                <input
                  className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.lastname ? "border-error focus:border-error focus:ring-1 focus:ring-error/15" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  id="lastname" name="lastname" placeholder="Ej. Pérez Gómez" type="text"
                  value={formData.lastname} onChange={handleChange}
                />
              </div>
              {validationErrors.lastname && <p className="text-xs text-error">{validationErrors.lastname}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="email">Correo Institucional</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">mail</span>
                <input
                  className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.email ? "border-error focus:border-error focus:ring-1 focus:ring-error/15" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  id="email" name="email" placeholder="usuario@universidad.edu" type="email"
                  value={formData.email} onChange={handleChange} autoComplete="email"
                />
              </div>
              {validationErrors.email && <p className="text-xs text-error">{validationErrors.email}</p>}
              <p className="font-body-sm text-body-sm text-outline mt-base">Recomendamos usar tu correo de la universidad.</p>
            </div>


          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-xl">
            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="password">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
                <input
                  className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.password ? "border-error focus:border-error focus:ring-1 focus:ring-error/15" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  id="password" name="password" placeholder="••••••••" type="password"
                  value={formData.password} onChange={handleChange} autoComplete="new-password"
                />
              </div>
              {validationErrors.password && <p className="text-xs text-error">{validationErrors.password}</p>}
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="confirmPassword">Repetir Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">lock</span>
                <input
                  className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.confirmPassword ? "border-error focus:border-error focus:ring-1 focus:ring-error/15" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  id="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password"
                  value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password"
                />
              </div>
              {validationErrors.confirmPassword && <p className="text-xs text-error">{validationErrors.confirmPassword}</p>}
            </div>
          </div>
        </>
      )}

      {step === 2 && formData.role === "student" && (
        <div className="flex flex-col gap-md">
          <h3 className="font-title-sm text-title-sm text-on-surface">Datos del estudiante</h3>

          <div className="flex flex-col gap-xs">
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="legajo">Legajo</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">badge</span>
              <input
                className={`w-full h-12 pl-10 pr-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors placeholder:text-outline-variant/70 ${validationErrors.legajo ? "border-error" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                id="legajo" name="legajo" placeholder="Ej. A12345" type="text"
                value={studentData.legajo}
                onChange={(e) => setStudentData(prev => ({ ...prev, legajo: e.target.value }))}
              />
            </div>
            {validationErrors.legajo && <p className="text-xs text-error">{validationErrors.legajo}</p>}
          </div>

          <div className="flex items-center justify-between">
            <h4 className="font-title-sm text-title-sm text-on-surface">Inscripciones a carreras</h4>
            <button
              type="button"
              onClick={addEnrollmentRow}
              className="flex items-center gap-xs text-primary font-label-caps text-label-caps hover:text-inverse-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agregar carrera
            </button>
          </div>

          {validationErrors.duplicateCareer && (
            <p className="text-xs text-error">{validationErrors.duplicateCareer}</p>
          )}

          {studentData.enrollments.map((row, index) => (
            <div key={index} className="p-md rounded-DEFAULT border border-outline-variant bg-surface-container-lowest flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant">Carrera {index + 1}</span>
                {studentData.enrollments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEnrollmentRow(index)}
                    className="text-error font-label-caps text-label-caps hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Carrera</label>
                  <select
                    className={`w-full h-12 px-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors appearance-none ${validationErrors[`career_${index}`] ? "border-error" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                    value={row.careerId ?? ""}
                    onChange={(e) => handleEnrollmentChange(index, "careerId", e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Seleccionar carrera</option>
                    {careers
                      .filter(c => !selectedCareerIds.includes(Number(c.id)) || Number(c.id) === row.careerId)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  {validationErrors[`career_${index}`] && <p className="text-xs text-error">{validationErrors[`career_${index}`]}</p>}
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Plan de estudio</label>
                  <select
                    className={`w-full h-12 px-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors appearance-none ${validationErrors[`plan_${index}`] ? "border-error" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                    value={row.studyPlanId ?? ""}
                    onChange={(e) => handleEnrollmentChange(index, "studyPlanId", e.target.value ? Number(e.target.value) : null)}
                    disabled={!row.careerId}
                  >
                    <option value="">Seleccionar plan</option>
                    {plans
                      .filter(p => Number(p.careerId) === Number(row.careerId))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.status})</option>
                      ))}
                  </select>
                  {validationErrors[`plan_${index}`] && <p className="text-xs text-error">{validationErrors[`plan_${index}`]}</p>}
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Fecha de inicio</label>
                  <input
                    type="date"
                    className={`w-full h-12 px-sm rounded-DEFAULT border bg-surface text-on-surface font-body-md text-body-md outline-none transition-colors ${validationErrors[`date_${index}`] ? "border-error" : "border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"}`}
                    value={row.enrolledAt}
                    onChange={(e) => handleEnrollmentChange(index, "enrolledAt", e.target.value)}
                  />
                  {validationErrors[`date_${index}`] && <p className="text-xs text-error">{validationErrors[`date_${index}`]}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {error && (
        <div className="mt-md p-3 bg-error-container text-on-error-container rounded-DEFAULT text-body-sm flex items-start gap-xs">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex-grow"></div>

      <div className="flex flex-col gap-sm pt-md border-t border-surface-container-high mt-md">
        {step === 1 && (
          <button
            className="w-full flex items-center justify-center gap-xs bg-primary text-on-primary h-12 px-lg rounded-DEFAULT font-title-sm text-title-sm hover:bg-inverse-surface transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
          >
            Siguiente
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        )}

        {step === 2 && (
          <div className="flex gap-sm">
            <button
              type="button"
              onClick={() => { setStep(1); setError(""); }}
              className="flex items-center justify-center gap-xs border border-outline-variant text-on-surface h-12 px-lg rounded-DEFAULT font-title-sm text-title-sm hover:bg-surface-container-high transition-colors flex-1"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Volver
            </button>
            <button
              className="flex items-center justify-center gap-xs bg-primary text-on-primary h-12 px-lg rounded-DEFAULT font-title-sm text-title-sm hover:bg-inverse-surface transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed flex-[2]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Creando Cuenta..." : "Crear Cuenta"}
              {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
            </button>
          </div>
        )}

        <div className="text-center mt-sm">
          <span className="font-body-sm text-body-sm text-on-surface-variant">¿Ya tienes una cuenta?</span>
          <Link className="font-label-caps text-label-caps text-primary hover:text-inverse-surface ml-base transition-colors underline-offset-4 hover:underline" to="/login">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </form>
  );
}