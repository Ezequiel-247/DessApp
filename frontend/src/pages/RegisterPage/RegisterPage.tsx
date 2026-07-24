/**
 * RegisterPage - Página de registro
 * Nexo - Stitch Design System
 */
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex items-center justify-center p-sm md:p-margin">
      {/* Registration Container - Split Layout */}
      <main className="w-full max-w-6xl flex flex-col md:flex-row bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Left Panel: Branding & Context */}
        <div
          className="relative hidden md:flex flex-col justify-between w-5/12 bg-primary-container text-on-primary p-xl overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(15, 76, 92, 0.9) 0%, rgba(0, 52, 65, 0.95) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCj_Mi2bC9U6Vkp8DHK9x6kccXhD2mPQd5labLfOcsfbxiPpQgnTFsocBBVLGpSxDbiLI-dAHEkiBQH8nMc2tZ2urtugQw9AP7js_O4Pp_Lf5TBkp5tkDorofvUJHwzhfHs3ohkzqoPu09EO9Dd3-VmlymVTMNQY4ncllbMqn5dNnmv-zhVnE8NkuQm3bBOKwxQnm1Is30T6cFr-QGKXRW7A6bqOeNi2MzGxK74I8zX01DVY2KDJYfKANX8IZUYWWQOEG1iPmzz3vI')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="z-10 relative">
            <div className="flex items-center gap-xs mb-lg text-on-primary">
              <span
                className="material-symbols-outlined text-display-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
              <h1 className="font-headline-md text-headline-md uppercase tracking-widest text-on-primary">Nexo</h1>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-primary mt-xl mb-md">
              Eleva tu <br />potencial <br />académico.
            </h2>
            <p className="font-body-md text-body-md text-primary-fixed leading-relaxed max-w-sm">
              Únete a la plataforma líder en gestión y acompañamiento estudiantil. Diseñada para mantenerte enfocado en lo que realmente importa: tu éxito.
            </p>
          </div>
          <div className="z-10 relative mt-xl">
            <div className="flex items-center gap-sm text-primary-fixed-dim">
              <span className="material-symbols-outlined">verified_user</span>
              <span className="font-label-caps text-label-caps">Plataforma Segura e Institucional</span>
            </div>
          </div>
          {/* Decorative Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="w-full md:w-7/12 p-lg md:p-xl flex flex-col bg-surface-container-lowest">
          {/* Mobile Brand Header */}
          <div className="md:hidden flex items-center gap-xs mb-lg text-primary-container">
            <span
              className="material-symbols-outlined text-[28px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
            <span className="font-headline-md text-headline-md uppercase tracking-widest text-primary-container">AcademiaPro</span>
          </div>

          {/* Form Content Header */}
          <div className="mb-lg mt-sm">
            <h2 className="font-headline-md text-headline-md text-on-background">Crear Cuenta</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-base">Ingresá tus datos personales para comenzar el registro.</p>
          </div>

          {/* The Form */}
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}
