/**
 * LoginPage - Página de inicio de sesión
 * Nexo - Stitch Design System
 */
import { useState, useEffect } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Link } from "react-router-dom";

export function LoginPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "https://media.istockphoto.com/id/2105100634/es/foto/estudiantes-universitarios-felices-de-aprendizaje-electr%C3%B3nico-mientras-usan-una-computadora.jpg?s=612x612&w=0&k=20&c=yszsL6HFGYxIErDiEyzlJNQ6ZjkHLt7FfiHSn6nHZZg=",
    "https://media.istockphoto.com/id/1588289974/es/foto/grupo-multirracial-de-estudiantes-felices-en-la-sala-de-conferencias-mirando-a-la-c%C3%A1mara.jpg?s=612x612&w=0&k=20&c=yz0SNJdg-mLFSLYPbHt3hhaYsYZy4DIobnGdz0tPoiw=",
    "https://media.istockphoto.com/id/2177186209/es/foto/estudiante-universitario-masculino-escribiendo-un-examen-en-la-sala-de-conferencias.jpg?s=612x612&w=0&k=20&c=O_SlQ8MKokTdwNb9QCv3i4_TEfBxSkuhhKQ7nAHxaO0=",
    "https://media.istockphoto.com/id/1500285927/es/foto/mujer-joven-estudiante-universitaria-estudiando-en-l%C3%ADnea.jpg?s=612x612&w=0&k=20&c=H7w2VYX9Ao0842W5B5Mw-ChlKmSqlGUjNu0XJIG9SLk=",
    "https://media.istockphoto.com/id/1988188005/es/foto/estudiante-universitaria-mujer-y-al-aire-libre-para-la-graduaci%C3%B3n-con-memoria-sonrisa-o.jpg?s=612x612&w=0&k=20&c=kRRshflTnEaVM77TrYBCKq7U00kbuukV-ZyCd-W62Gs=",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }, 6000);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col md:flex-row">
      {/* Left Column: Login Form Canvas */}
      <main className="flex-1 flex flex-col justify-center px-lg py-xl md:px-margin md:py-margin bg-surface-container-lowest md:max-w-xl z-10 shadow-xl shadow-primary/5">
        <div className="w-full max-w-sm mx-auto">
          {/* Brand Anchor */}
          <header className="mb-xl flex items-center gap-xs">
            <span
              className="material-symbols-outlined text-primary text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Nexo</h1>
          </header>

          {/* Greeting */}
          <div className="mb-lg">
            <h2 className="font-display-lg text-display-lg text-on-surface mb-base">Bienvenido.</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Ingresá a tu portal de acompañamiento académico.</p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Registration Link */}
          <div className="mt-lg pt-lg border-t border-surface-variant text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              ¿Nuevo en la plataforma?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Right Column: Institutional Atmosphere Image (Hidden on Mobile) */}
      <aside className="hidden md:block flex-1 relative bg-surface-variant overflow-hidden">
        {/* Soft background image overlaying brand color */}
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply z-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary/50 to-transparent z-10 pointer-events-none opacity-90"></div>
        {images.map((src, i) => (
          <img
            key={i}
            alt={i === 0 ? "Estudiantes universitarios" : undefined}
            className={`absolute inset-0 w-full h-full object-cover grayscale-[20%] transition-opacity duration-1000 ${i === currentIndex ? "opacity-100" : "opacity-0"}`}
            src={src}
          />
        ))}

        {/* Optional Decorative/Brand Element over Image */}
        <div className="relative z-20 h-full p-margin flex flex-col justify-end text-on-primary max-w-lg">
          <div className="bg-surface-container-lowest/10 backdrop-blur-md p-lg rounded-xl border border-white/10">
            <span
              className="material-symbols-outlined text-[48px] mb-sm opacity-80"
              style={{ fontVariationSettings: "'wght' 300" }}
            >
              auto_graph
            </span>
            <blockquote className="font-title-sm text-title-sm text-inverse-on-surface leading-relaxed mb-sm">
              "El éxito académico no es un destino, es un proceso continuo de acompañamiento y dedicación."
            </blockquote>
            <p className="font-body-sm text-body-sm text-inverse-on-surface/70 uppercase tracking-widest">
              Dirección Académica
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
