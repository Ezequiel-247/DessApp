/**
 * MaterialsPage - Repositorio de Materiales
 * Nexo - Stitch Design System
 */
import { useEffect, useState, useRef, useMemo, useCallback } from "react"; 
import { useAuth } from "@/app/AuthContext";
import { getMaterials, reportMaterial } from "@/entities/Material";
import { getSubjects } from "@/entities/Subject";
import { getStudentPlanSubjects } from "@/entities/Student/api/studentApi";
import { getEnrollments } from "@/entities/StudentCareerEnrollment/api/studentCareerEnrollmentApi";
import { getAcademicRecords } from "@/entities/AcademicRecord";
import { useMaterialVotes } from "@/features/materials/hooks/useMaterialVotes";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Modal } from "@/widgets/ui/Modal";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { Toggle } from "@/widgets/ui/Toggle";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { InputToggle } from "@/widgets/ui/InputToggle";
import { Form } from "@/widgets/ui/Form";
import { Tag } from "@/widgets/ui/Tag";
import { FormError } from "@/widgets/ui/FormError";

// Definición de interfaces para tipado seguro
interface Material {
  id: string | number;
  type: 'pdf' | 'video' | 'link' | 'discord';
  subjectId: string;
  title: string;
  description: string;
  subjectName: string;
  tags: string[];
  author: string;
  authorId: string;
  linkCategory?: 'youtube' | 'drive' | 'discord' | 'github' | 'web';
  likesCount: number;
  dislikesCount: number;
  valoracionRatio: number | null;
  myVote?: 'up' | 'down' | null;
  reports: { pending: number; verified: number; list?: { motive: string; details: string }[] };
  url: string;
}

interface UserNotification {
  id: string;
  materialId: string | number;
  materialTitle: string;
  message: string;
  timestamp: number;
}

const cardConfigMap: Record<string, { icon: string; gradient: string }> = {
  pdf: { icon: "picture_as_pdf", gradient: "from-red-500 to-orange-500" },
  video: { icon: "play_circle", gradient: "from-blue-500 to-indigo-500" },
  link: { icon: "link", gradient: "from-green-500 to-teal-500" },
  discord: { icon: "forum", gradient: "from-indigo-600 to-blue-700" },
};

export function MaterialsPage() {
  const { user, isLoading } = useAuth();

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("Todos");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
  const [showSuspended, setShowSuspended] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [isUnahur, setIsUnahur] = useState(false);
  const [academicRecords, setAcademicRecords] = useState<any[]>([]);
  const unahurSubjects = useMemo(() => {
    return allSubjects.filter((s: any) => s.is_unahur);
  }, [allSubjects]);
  const filteredSubjects = useMemo(() => {
    if (!isUnahur) return subjects;
    return unahurSubjects;
  }, [subjects, isUnahur, unahurSubjects]);

  // Materias del alumno: construidas desde registros academicos + lookup de nombres
  const { enCursoSubjects, cursadasSubjects } = useMemo(() => {
    const nameById = new Map<string, string>();
    for (const s of [...subjects, ...unahurSubjects, ...allSubjects]) {
      if (s.id && s.name) nameById.set(String(s.id), s.name);
    }

    const enrolled: { id: string; name: string }[] = [];
    const cursadas: { id: string; name: string }[] = [];
    const seenEnrolled = new Set<string>();
    const seenCursadas = new Set<string>();

    for (const r of academicRecords) {
      const id = r.subjectId;
      if (!id) continue;
      const name = nameById.get(id) || `Materia #${id}`;
      if (r.status === 'enrolled' && !seenEnrolled.has(id)) {
        seenEnrolled.add(id);
        enrolled.push({ id, name });
      } else if (r.status !== 'enrolled' && !seenCursadas.has(id)) {
        seenCursadas.add(id);
        cursadas.push({ id, name });
      }
    }

    return { enCursoSubjects: enrolled, cursadasSubjects: cursadas };
  }, [academicRecords, subjects, unahurSubjects, allSubjects]);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [reportMotives, setReportMotives] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState({ pendingReportsLimit: 10, verifiedReportsLimit: 3 });

  // Estados de denuncias
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [targetMaterial, setTargetMaterial] = useState<Material | null>(null);
  const [reportMotive, setReportMotive] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportFormError, setReportFormError] = useState<string>("");
  const [reportNotice, setReportNotice] = useState<string>("");

  // Estados del modal y formulario
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newType, setNewType] = useState<'pdf' | 'video' | 'link'>("pdf");
  const [newSubject, setNewSubject] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newLinkCategory, setNewLinkCategory] = useState<Material['linkCategory']>('web');
  const [newUrl, setNewUrl] = useState<string>("");

  const { vote: callVoteApi } = useMaterialVotes();

  const computeOptimisticVote = (m: Material, voteType: 'up' | 'down', prevVote: string | undefined | null): Material => {
    let { likesCount, dislikesCount } = m;
    // Sacar el voto anterior
    if (prevVote === 'up') likesCount = Math.max(0, likesCount - 1);
    if (prevVote === 'down') dislikesCount = Math.max(0, dislikesCount - 1);
    // Aplicar el nuevo voto (si no es el mismo)
    if (voteType !== prevVote) {
      if (voteType === 'up') likesCount += 1;
      else dislikesCount += 1;
    }
    const total = likesCount + dislikesCount;
    return {
      ...m,
      likesCount,
      dislikesCount,
      valoracionRatio: total > 0 ? likesCount / total : null,
      myVote: voteType === prevVote ? null : voteType,
    };
  };

  const handleVote = useCallback(async (materialId: string | number, voteType: 'up' | 'down') => {
    const id = String(materialId);
    const prevMyVote = materials.find(m => String(m.id) === id)?.myVote;

    // Actualización optimista inmediata
    const prevMaterials = materials;
    const updated = materials.map(m => {
      if (String(m.id) !== id) return m;
      return computeOptimisticVote(m, voteType, prevMyVote);
    });
    setMaterials(updated);
    localStorage.setItem('academic_materials', JSON.stringify(updated));

    // Llamada real a la API — revierte si falla
    const ok = await callVoteApi(id, voteType);
    if (ok === false) {
      setMaterials(prevMaterials);
      localStorage.setItem('academic_materials', JSON.stringify(prevMaterials));
    }
  }, [materials, callVoteApi]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB en bytes
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.png', '.zip'];

  useEffect(() => {
    if (isLoading) return;

    const adminConfig = JSON.parse(localStorage.getItem('admin_report_config') || '{}');
    
    const defaultMotives = [
      "Contenido pornográfico o sexual explícito",
      "Lenguaje ofensivo o insultos",
      "Material protegido por derechos de autor",
      "Spam o publicidad engañosa",
      "Información incorrecta o engañosa",
      "Otro"
    ];

    setReportMotives(adminConfig.motives || defaultMotives);
    setThresholds({
      pendingReportsLimit: adminConfig.nLimit ?? 10,
      verifiedReportsLimit: adminConfig.mLimit ?? 3
    });

    (async () => {
      try {
        const viewerId = user?.id ? String(user.id) : undefined;
        const apiMaterials = await getMaterials({ studentId: viewerId, viewerStudentId: viewerId });
        const mapped = apiMaterials.map((m): Material => ({
          id: m.id,
          type: m.type as Material['type'],
          subjectId: m.subjectId,
          title: m.title,
          description: m.title,
          subjectName: m.subjectName || '',
          tags: m.tags,
          author: m.authorName || 'Usuario',
          authorId: m.authorId,
          likesCount: m.likesCount,
          dislikesCount: m.dislikesCount,
          valoracionRatio: m.valoracionRatio,
          myVote: m.myVote,
          reports: { pending: m.reportCounts?.pending ?? 0, verified: m.reportCounts?.verified ?? 0 },
          url: m.fileUrl || '#',
        }));
        setMaterials(mapped);
        localStorage.setItem('academic_materials', JSON.stringify(mapped));
      } catch {
        setMaterials([]);
      }
    })();

    (async () => {
      try {
        if (!user?.id) { setSubjects([]); return; }
        const enrollments = await getEnrollments(user.id);
        const activeEnrollment = enrollments.find((e: any) => e.isActive && e.studyPlanId) || enrollments.find((e: any) => e.studyPlanId);
        if (!activeEnrollment) { setSubjects([]); return; }
        const planSubjects = await getStudentPlanSubjects(String(user.id), String(activeEnrollment.id));
        const normalized = planSubjects.map((s: any) => ({ id: String(s.id), name: s.name }));
        const seenIds = new Set<string>();
        const deduplicated = normalized.filter((s: any) => {
          if (seenIds.has(s.id)) return false;
          seenIds.add(s.id);
          return true;
        });
        setSubjects(deduplicated);
      } catch {
        setSubjects([]);
      }
    })();

    (async () => {
      try {
        const list = await getSubjects();
        setAllSubjects(Array.isArray(list) ? list : []);
      } catch {
        setAllSubjects([]);
      }
    })();

    (async () => {
      if (!user?.id) return;
      try {
        const records = await getAcademicRecords(user.id);
        setAcademicRecords(Array.isArray(records) ? records : []);
      } catch (e: any) {
        setAcademicRecords([]);
      }
    })();
  }, [user, isLoading]);

  // Auto-seleccionar materias "en curso" al cargar
  const prevEnCursoRef = useRef<string>("");
  useEffect(() => {
    const key = enCursoSubjects.map((s: any) => s.id).sort().join(",");
    if (key && key !== prevEnCursoRef.current) {
      prevEnCursoRef.current = key;
      setSelectedSubjects(prev => {
        const enCursoNames = enCursoSubjects.map((s: any) => s.name);
        const newSet = new Set([...prev, ...enCursoNames]);
        return Array.from(newSet);
      });
    }
  }, [enCursoSubjects]);

  const toggleSubjectFilter = (subjectName: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectName)
        ? prev.filter(name => name !== subjectName)
        : [...prev, subjectName]
    );
  };

  const handleDelete = (id: string | number) => {
    // Solo permitimos la eliminación si el rol es ADMIN (como solicitaste)
    if (user?.role?.toLowerCase() === 'admin') {
      if (!window.confirm("¿Estás seguro de que deseas eliminar este material permanentemente?")) return;
      const updated = materials.filter(m => m.id !== id);
      setMaterials(updated);
      localStorage.setItem('academic_materials', JSON.stringify(updated));

      // Notificar al autor del material eliminado
      const deletedMaterial = materials.find(m => m.id === id);
      if (deletedMaterial && deletedMaterial.authorId !== user?.id) { // No notificar si el admin se elimina su propio material
        const authorId = deletedMaterial.authorId;
        const notification: UserNotification = {
          id: `deleted_material_${Date.now()}`,
          materialId: deletedMaterial.id,
          materialTitle: deletedMaterial.title,
          message: `Tu material "${deletedMaterial.title}" ha sido eliminado por un administrador debido a una denuncia.`,
          timestamp: Date.now(),
        };
        const userNotificationsKey = `user_notifications_${authorId}`;
        const currentAuthorNotifications: UserNotification[] = JSON.parse(localStorage.getItem(userNotificationsKey) || '[]');
        localStorage.setItem(userNotificationsKey, JSON.stringify([...currentAuthorNotifications, notification]));
        
        // Opcional: Si el autor está logueado, actualizar su contexto de notificaciones
        // Esto requeriría una forma de forzar la actualización del AuthContext o un evento global.
      }
    } else {
      alert("Acceso restringido: Solo el personal administrativo puede eliminar contenido del repositorio.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        alert(`Formato no permitido. Los formatos aceptados son: ${ALLOWED_EXTENSIONS.join(', ')}`);
        e.target.value = "";
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("El archivo es demasiado pesado. El tamaño máximo permitido es de 25MB.");
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTags = () => {
    const tags: string[] = [];
    if (newType === 'pdf') tags.push("#pdf", "#resumen");
    else if (newType === 'video') tags.push("#video", "#tutorial");
    else if (newType === 'link') {
      tags.push("#link");
      switch (newLinkCategory) {
        case 'youtube': tags.push("#youtube", "#video"); break;
        case 'discord': tags.push("#discord"); break;
        case 'github': tags.push("#github", "#repositorio"); break;
        case 'drive': tags.push("#drive"); break;
        default: tags.push("#web"); break;
      }
    }
    return tags;
  };

  const previewConfig = () => {
    if (newType === 'pdf') return { bg: 'bg-red-500', icon: 'picture_as_pdf', label: 'PDF' };
    if (newType === 'video') return { bg: 'bg-amber-500', icon: 'movie', label: 'Video' };
    if (newType === 'link') {
      switch (newLinkCategory) {
        case 'youtube': return { bg: 'bg-red-600', logo: 'https://cdn.simpleicons.org/youtube/white', label: 'YouTube' };
        case 'discord': return { bg: 'bg-[#5865F2]', logo: 'https://cdn.simpleicons.org/discord/white', label: 'Discord' };
        case 'github': return { bg: 'bg-[#24292F]', logo: 'https://cdn.simpleicons.org/github/white', label: 'GitHub' };
        case 'drive': return { bg: 'bg-[#4285F4]', logo: 'https://cdn.simpleicons.org/googledrive/white', label: 'Google Drive' };
        default: return { bg: 'bg-blue-500', icon: 'link', label: 'Link' };
      }
    }
    return { bg: 'bg-slate-500', icon: 'draft', label: 'Borrador' };
  };


  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePublish = () => {
    setUploadError(null);

    if (!newTitle || !newSubject || !newUrl) {
      setUploadError("Completá todos los campos obligatorios y cargá un recurso válido.");
      return;
    }

    const material: Material = {
      id: Date.now().toString(),
      title: newTitle,
      type: newType,
      subjectId: "new",
      subjectName: newSubject,
      author: user?.name || "Usuario Pro",
      authorId: user?.id || "1",
      description: newDescription || "Sin descripción corta.",
      url: newUrl,
      linkCategory: newType === 'link' ? newLinkCategory : undefined,
      reports: { pending: 0, verified: 0 },
      likesCount: 0,
      dislikesCount: 0,
      valoracionRatio: null,
      myVote: null,
      tags: generateTags()
    };

    const updated = [material, ...materials];

    try {
      localStorage.setItem('academic_materials', JSON.stringify(updated));
      setMaterials(updated);
      setIsUploadModalOpen(false);
      setNewTitle(""); 
      setNewDescription(""); 
      setNewUrl("");
      setNewSubject("");
      setNewType("pdf");
      setNewLinkCategory("web");
    } catch (error) {
      console.error("Error al guardar en LocalStorage:", error);
      setUploadError("No se pudo publicar: Se ha superado el límite de almacenamiento local. Intentá con un archivo más pequeño o usá 'Link externo'.");
    }
  };

  const handleOpenReport = (material: Material) => {
    setTargetMaterial(material);
    setReportFormError("");
    setReportNotice("");
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!targetMaterial) return;

    if (!reportMotive || (reportMotive === "Otro" && !reportDetails)) {
      setReportFormError("Por favor selecciona un motivo y especifica los detalles.");
      return;
    }

    setReportFormError("");

    try {
      await reportMaterial(String(targetMaterial.id), {
        reporter_id: String(user?.id),
        details: reportDetails,
      });

      setReportNotice("Denuncia recibida. El equipo de moderación la revisará a la brevedad.");
      setIsReportModalOpen(false);
      setReportMotive("");
      setReportDetails("");
      setTargetMaterial(null);

      const viewerId = user?.id ? String(user.id) : undefined;
      const apiMaterials = await getMaterials({ studentId: viewerId, viewerStudentId: viewerId });
      const mapped = apiMaterials.map((m): Material => ({
        id: m.id,
        type: m.type as Material['type'],
        subjectId: m.subjectId,
        title: m.title,
        description: m.title,
        subjectName: m.subjectName || '',
        tags: m.tags,
        author: m.authorName || 'Usuario',
        authorId: m.authorId,
        likesCount: m.likesCount,
        dislikesCount: m.dislikesCount,
        valoracionRatio: m.valoracionRatio,
        myVote: m.myVote,
        reports: { pending: m.reportCounts?.pending ?? 0, verified: m.reportCounts?.verified ?? 0 },
        url: m.fileUrl || '#',
      }));
      setMaterials(mapped);
      localStorage.setItem('academic_materials', JSON.stringify(mapped));
    } catch (err: any) {
      setReportFormError(err?.message || "Error al enviar la denuncia. Intentá de nuevo.");
    }
  };

  const isMaterialSuspended = (material: Material) => (
    (material.reports?.pending ?? 0) > thresholds.pendingReportsLimit ||
    (material.reports?.verified ?? 0) > thresholds.verifiedReportsLimit
  );

  const filteredMaterials = useMemo(() => {
    let result = materials.filter((material: any) => {
      const matchesSearch = 
        (material.title?.toLowerCase() || "").includes(searchTerm?.toLowerCase() || "") ||
        (material.description?.toLowerCase() || "").includes(searchTerm?.toLowerCase() || "");

      const matchesFormat =
        selectedFormat === "Todos" ||
        (selectedFormat === "PDFs" && material.type === "pdf") ||
        (selectedFormat === "Videos" && material.type === "video") ||
        (selectedFormat === "Links" && material.type === "link");

      const matchesSubject =
        selectedSubjects.length === 0 || selectedSubjects.includes(material.subjectName);

      const matchesSuspended = showSuspended || !isMaterialSuspended(material);

      return matchesSearch && matchesFormat && matchesSubject && matchesSuspended;
    });

    if (sortBy === 'top') {
      result = [...result].sort((a, b) => {
        const ratioA = a.valoracionRatio ?? 0;
        const ratioB = b.valoracionRatio ?? 0;
        if (ratioB !== ratioA) return ratioB - ratioA;
        return (b.likesCount + b.dislikesCount) - (a.likesCount + a.dislikesCount);
      });
    }

    return result;
  }, [materials, searchTerm, selectedFormat, selectedSubjects, showSuspended, sortBy, thresholds.pendingReportsLimit, thresholds.verifiedReportsLimit]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          className="mb-lg"
          eyebrow="Material de estudio"
          title="Repositorio de materiales"
          actions={(
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              <span className="material-symbols-outlined text-[24px]">upload</span>
              Subir Material
            </Button>
          )}
        />

        {reportNotice && (
          <div className="mb-md rounded-lg border border-secondary/30 bg-secondary-container/30 px-4 py-3 text-body-sm text-on-secondary-container">
            {reportNotice}
          </div>
        )}

        <div className="grid grid-cols-12 gap-gutter">
          {/* Sidebar de Filtros */}
          <div className="col-span-12 xl:col-span-3 space-y-6">
            {/* Buscador */}
            <Card bodyClassName="overflow-visible !bg-surface-bright py-3">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por título..."
              />
            </Card>

            <Card headerClassName="py-3"
              header={
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">menu_book</span>
                  <h3 className="font-title-sm text-title-sm text-on-surface">Materias</h3>
                </div>
              }
            >
              <ul className="space-y-2">
                <li>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      className="form-checkbox h-4 w-4 text-primary rounded border-outline-variant focus:ring-primary"
                      type="checkbox"
                      checked={selectedSubjects.includes("Variado")}
                      onChange={() => toggleSubjectFilter("Variado")}
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                      Variado / General
                    </span>
                  </label>
                </li>
                {enCursoSubjects.length > 0 && (
                  <li className="pt-2">
                    <p className="font-body-xs text-body-xs text-primary font-semibold uppercase tracking-wider">En curso</p>
                  </li>
                )}
                {enCursoSubjects.map((subject: any) => (
                  <li key={subject.id}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        className="form-checkbox h-4 w-4 text-primary rounded border-outline-variant focus:ring-primary"
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.name)}
                        onChange={() => toggleSubjectFilter(subject.name)}
                      />
                      <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                        {subject.name}
                      </span>
                    </label>
                  </li>
                ))}
                {cursadasSubjects.length > 0 && (
                  <li className="pt-2">
                    <p className="font-body-xs text-body-xs text-outline font-semibold uppercase tracking-wider">Cursadas</p>
                  </li>
                )}
                {cursadasSubjects.map((subject: any) => (
                  <li key={subject.id}>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        className="form-checkbox h-4 w-4 text-primary rounded border-outline-variant focus:ring-primary"
                        type="checkbox"
                        checked={selectedSubjects.includes(subject.name)}
                        onChange={() => toggleSubjectFilter(subject.name)}
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-primary transition-colors">
                        {subject.name}
                      </span>
                    </label>
                  </li>
                ))}

              </ul>
            </Card>

            <Card headerClassName="py-3"
              header={
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">category</span>
                  <h3 className="font-title-sm text-title-sm text-on-surface">Formato</h3>
                </div>
              }
              footer={
                <Form>
                  <Form.Row cols={1}>
                    <InputToggle
                      label="Incluir suspendidos"
                      checked={showSuspended}
                      onChange={setShowSuspended}
                    />
                  </Form.Row>
                  <Form.Row cols={1}>
                    <Form.Field label="Ordenar por">
                      <InputSelect
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'new' | 'top')}
                      >
                        <option value="new">Más recientes</option>
                        <option value="top">Mejor valorados</option>
                      </InputSelect>
                    </Form.Field>
                  </Form.Row>
                </Form>
              }
            >
              <div className="flex flex-wrap gap-2">
                {["Todos", "PDFs", "Videos", "Links"].map(format => (
                  <Button
                    key={format}
                    variant={selectedFormat === format ? "primary" : "secondary"}
                    onClick={() => setSelectedFormat(format)}
                  >
                    {format}
                  </Button>
                ))}
              </div>
            </Card>
          </div>

          {/* Listado de Tarjetas */}
          <div className="col-span-12 xl:col-span-9 space-y-gutter">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`font-body-sm text-body-sm pe-2 text-on-surface-variant ${selectedFormat === "Todos" && !showSuspended && selectedSubjects.length === 0 ? "invisible" : ""}`}>Filtros activos:</span>
              {selectedFormat !== "Todos" && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedFormat("Todos")}>
                  <Tag variant="neutral">{selectedFormat}</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFormat("Todos"); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}
              {showSuspended && (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setShowSuspended(false)}>
                  <Tag variant="danger">Incluir suspendidos</Tag>
                  <button onClick={(e) => { e.stopPropagation(); setShowSuspended(false); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              )}
              {selectedSubjects.map(sub => (
                <div key={sub} className="flex items-center gap-2 group cursor-pointer" onClick={() => toggleSubjectFilter(sub)}>
                  <Tag variant="positive">{sub}</Tag>
                  <button onClick={(e) => { e.stopPropagation(); toggleSubjectFilter(sub); }} className="flex items-center text-on-surface-variant group-hover:text-error">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                  <span className="flex items-center text-outline text-xs leading-none pe-2">•</span>
                </div>
              ))}
              {(selectedSubjects.length > 0 || selectedFormat !== "Todos" || showSuspended) && (
                <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setSelectedSubjects([]); setSelectedFormat("Todos"); setShowSuspended(false); setSortBy('new'); }}>
                  <Tag variant="warning">Limpiar filtros</Tag>
                  <span className="material-symbols-outlined text-[20px] group-hover:text-amber-500">restart_alt</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
              {filteredMaterials.map((material: any) => {
                const cardConfig = cardConfigMap[material.type] || cardConfigMap.pdf;
                return (
                  <MaterialCard 
                    key={material.id} 
                    material={material} 
                    config={cardConfig} 
                    onDelete={handleDelete}
                    onReport={handleOpenReport}
                    onVote={handleVote}
                    thresholds={thresholds}
                    currentUserId={user?.id || "1"}
                    userRole={user?.role?.toLowerCase() || "student"}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Subida */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Subir nuevo material"
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsUploadModalOpen(false)}>
              <span className="material-symbols-outlined">close</span>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1" onClick={handlePublish}>
              <span className="material-symbols-outlined">check</span>
              Publicar
            </Button>
          </div>
        }
      >
        {uploadError && <FormError message={uploadError} className="mb-4" />}

        <Form>
          <Form.Row cols={1}>
            <Form.Field label="Título del recurso" required>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título del recurso" />
            </Form.Field>
          </Form.Row>

          <Form.Row cols={2}>
            <Form.Field label="Tipo de recurso" required>
              <InputSelect value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="pdf">PDF (Resumen, Guía)</option>
                <option value="video">Video (Clase, Tutorial)</option>
                <option value="link">Link externo</option>
              </InputSelect>
            </Form.Field>
            <Form.Field label="Categoría de link" visible={newType === 'link'}>
              <InputSelect value={newLinkCategory} onChange={e => setNewLinkCategory(e.target.value)}>
                <option value="web">Sitio Web Educativo</option>
                <option value="youtube">YouTube (Video explicativo)</option>
                <option value="drive">Google Drive / Dropbox</option>
                <option value="discord">Canal de Discord</option>
                <option value="github">GitHub (Repositorio)</option>
              </InputSelect>
            </Form.Field>
          </Form.Row>

          <Form.Row cols={2} className="grid-cols-1 sm:grid-cols-[1fr_auto]">
            <Form.Field label="Materia" required>
              <InputSelect value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                <option value="">Seleccionar materia</option>
                <option value="Variado">Variado / General</option>
                {filteredSubjects.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </InputSelect>
            </Form.Field>
            <Form.Field label="Filtrar" className="gap-5">
              <InputToggle checked={isUnahur} onChange={setIsUnahur} description="Es materia UNaHUR" disabled={unahurSubjects.length === 0} />
            </Form.Field>
          </Form.Row>

          <Form.Row cols={1}>
            <Form.Field label="Descripción" required>
              <textarea placeholder="Breve descripción..."
                className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary h-24"
                value={newDescription} onChange={e => setNewDescription(e.target.value)} />
            </Form.Field>
          </Form.Row>

          <Form.Row cols={1}>
            <Form.Field label={newType !== 'link' ? "Archivo" : "URL"} required>
              <div className="min-h-[120px]">
                {newType !== 'link' ? (
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:bg-surface-container transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept={ALLOWED_EXTENSIONS.join(',')} />
                    {newUrl ? (
                      <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-outline">cloud_upload</span>
                    )}
                    <p className={`text-body-sm mt-2 ${newUrl ? "text-emerald-600 font-semibold" : "text-outline"}`}>{newUrl ? "Listo para subir" : "Seleccionar archivo"}</p>
                  </div>
                ) : (
                  <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (http://...)" />
                )}
              </div>
            </Form.Field>
          </Form.Row>
        </Form>

        {newUrl && newTitle && (
          <div className="mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <label className="font-label-caps text-[11px] text-outline uppercase tracking-wider block mb-2">
              Recurso preparado para publicar
            </label>
            <div className="border border-dashed border-primary/30 bg-primary-container/10 rounded-xl p-3 flex items-center justify-between gap-3 group transition-all hover:border-primary/50 hover:bg-primary-container/20">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${previewConfig().bg} text-white`}>
                  {previewConfig().logo ? (
                    <img src={previewConfig().logo} alt={previewConfig().label} className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="material-symbols-outlined text-xl">{previewConfig().icon}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-sm text-[13px] font-semibold text-on-surface truncate max-w-[200px] md:max-w-xs">
                    {newTitle}
                  </span>
                  <span className="font-body-sm text-[11px] text-outline flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-medium text-emerald-600">{previewConfig().label}</span>
                    <span className="text-outline/50">•</span>
                    <span className="truncate max-w-[140px]">{newUrl.replace(/^https?:\/\//, '').slice(0, 30)}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setNewTitle(""); setNewUrl(""); setNewDescription(""); }}
                className="text-outline hover:text-error p-1.5 rounded-lg hover:bg-error/10 transition-colors flex-shrink-0"
                title="Quitar recurso"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Denuncia */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Denunciar Material"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsReportModalOpen(false)}>
              <span className="material-symbols-outlined">close</span>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleSubmitReport}>
              <span className="material-symbols-outlined">flag</span>
              Enviar Denuncia
            </Button>
          </div>
        }
      >
        <p className="text-body-sm text-on-surface-variant mb-4">
          Estás denunciando: <span className="font-semibold">{targetMaterial?.title}</span>
        </p>

        {reportFormError && <FormError message={reportFormError} className="mb-4" />}

        <Form>
          <Form.Row cols={1}>
            <Form.Field label="Motivo de la denuncia" required>
              <InputSelect value={reportMotive} onChange={e => setReportMotive(e.target.value)}>
                <option value="">Seleccionar motivo...</option>
                {reportMotives.map(m => <option key={m} value={m}>{m}</option>)}
              </InputSelect>
            </Form.Field>
          </Form.Row>
          <Form.Row cols={1}>
            <Form.Field label={`Detalles adicionales${reportMotive === "Otro" ? " *" : ""}`} required={reportMotive === "Otro"}>
              <textarea
                placeholder="Especifica por qué este contenido es inapropiado..."
                className="w-full bg-surface-bright border border-outline-variant rounded px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary h-24"
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
              />
            </Form.Field>
          </Form.Row>
        </Form>
      </Modal>
    </div>
  );
}

function MaterialCard({ 
  material, 
  config, 
  onDelete, 
  onReport,
  onVote,
  thresholds,
  currentUserId,
  userRole
}: { 
  material: Material; 
  config: any; 
  onDelete: (id: string | number) => void;
  onReport: (material: Material) => void;
  onVote: (id: string | number, voteType: 'up' | 'down') => void;
  thresholds: { pendingReportsLimit: number, verifiedReportsLimit: number };
  currentUserId: string;
  userRole: string;
}) {
  const isOwner = String(material.authorId) === String(currentUserId);
  const isAdmin = userRole === 'admin';
  
  const isSuspended = (material.reports?.pending ?? 0) > thresholds.pendingReportsLimit || 
                      (material.reports?.verified ?? 0) > thresholds.verifiedReportsLimit;

  // Lógica para detectar tipos de links (Por categoría o por URL si falla)
  const isDiscord = material.linkCategory === 'discord' || material.url.toLowerCase().includes('discord');
  const isYouTube = material.linkCategory === 'youtube' || material.url.toLowerCase().includes('youtube.com') || material.url.toLowerCase().includes('youtu.be');
  const isGitHub = material.linkCategory === 'github' || material.url.toLowerCase().includes('github.com');
  const isDrive = material.linkCategory === 'drive' || material.url.toLowerCase().includes('drive.google.com') || material.url.toLowerCase().includes('dropbox.com');
  const isExternalLink = isDiscord || isYouTube || isGitHub || isDrive || material.type === 'link';

  // Selección dinámica de iconos según el enlace
  const getSpecialIcon = () => {
    if (isDiscord) return 'forum';
    if (isYouTube) return 'play_circle';
    if (isGitHub) return 'code';
    if (isDrive) return 'folder_shared';
    return config.icon;
  };

  const getActionButtonLabel = () => {
    if (isDiscord) return 'UNIRSE';
    if (isYouTube) return 'VER VIDEO';
    if (isGitHub) return 'VER REPO';
    if (isDrive) return 'ABRIR CARPETA';
    return '';
  };

  // Helper para obtener los logos/imágenes oficiales de las plataformas
  const getPlatformBannerConfig = () => {
    if (isDiscord) {
      return {
        logoUrl: "https://cdn.simpleicons.org/discord/white",
        bgColor: "bg-[#5865F2]",
        label: "Discord"
      };
    }
    if (isYouTube) {
      return {
        logoUrl: "https://cdn.simpleicons.org/youtube",
        bgColor: "bg-slate-50 border-b border-red-200",
        label: "YouTube"
      };
    }
    if (isGitHub) {
      return {
        logoUrl: "https://cdn.simpleicons.org/github/white",
        bgColor: "bg-[#24292F]",
        label: "GitHub"
      };
    }
    if (isDrive) {
      return {
        logoUrl: "https://cdn.simpleicons.org/googledrive",
        bgColor: "bg-slate-50 border-b border-slate-200",
        label: "Google Drive"
      };
    }
    return null;
  };

  const platformConfig = getPlatformBannerConfig();

  const getSpecialGradient = () => {
    if (isDiscord) return 'from-indigo-600 to-blue-700';
    if (isGitHub) return 'from-slate-800 to-black';
    if (isYouTube) return 'from-red-600 to-red-800';
    return config.gradient;
  };

  return (
    <Card
      className="relative group overflow-hidden flex flex-col hover:shadow-[0_4px_20px_rgba(15,76,92,0.08)] transition-all duration-300"
      bodyClassName="px-0 py-0 flex flex-col flex-1 bg-white"
      footerClassName="px-5 py-3"
      footer={ 
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="flex items-center flex-1 gap-2">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-xs font-bold text-on-tertiary-fixed uppercase">
                {material.author?.[0] || "U"}
              </div>
              <span className="text-[11px] text-on-surface-variant truncate">{material.author}</span>
            </div>
            {isSuspended ? (
              <span className="material-symbols-outlined text-outline cursor-not-allowed text-[24px]" title="Acceso restringido">lock</span>
            ) : isExternalLink ? (
              <span className="text-[11px] text-on-surface-variant font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  {isDiscord ? 'forum' : isYouTube ? 'play_circle' : isGitHub ? 'code' : isDrive ? 'folder_shared' : 'link'}
                </span>
                {isDiscord ? 'Discord' : isYouTube ? 'YouTube' : isGitHub ? 'GitHub' : isDrive ? 'Drive' : 'Enlace'}
              </span>
            ) : (
              <a
                href={material.url}
                download={material.title}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-primary bg-surface-container-highest hover:bg-primary/10 transition-all"
                title="Descargar"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
              </a>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center mt-2 mb-1">
              <button
                onClick={() => onVote(material.id, 'up')}
                disabled={isOwner || isSuspended}
                className={`flex items-center gap-2 px-4 py-1.5 rounded transition-colors text-xs ${
                  material.myVote === 'up'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-outline hover:text-primary hover:bg-primary/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isOwner ? 'No puedes votar tu propio material' : (material.myVote === 'up' ? 'Quitar voto' : 'Votar positivo')}
              >
                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                <span>{material.likesCount}</span>
              </button>
              <button
                onClick={() => onVote(material.id, 'down')}
                disabled={isOwner || isSuspended}
                className={`flex items-center gap-2 px-4 py-1.5 rounded transition-colors text-xs ${
                  material.myVote === 'down'
                    ? 'bg-error/10 text-error font-semibold'
                    : 'text-outline hover:text-error hover:bg-error/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isOwner ? 'No puedes votar tu propio material' : (material.myVote === 'down' ? 'Quitar voto' : 'Votar negativo')}
              >
                <span className="material-symbols-outlined text-[18px]">thumb_down</span>
                <span>{material.dislikesCount}</span>
              </button>
            </div>
            {(material.valoracionRatio !== null || material.likesCount + material.dislikesCount === 0) && (
              <span className="text-xs text-outline font-medium">
                {material.likesCount + material.dislikesCount === 0
                  ? "Sin votos"
                  : `${Math.round(material.valoracionRatio * 100)}% Positivo`}
              </span>
            )}
          </div>

          <div className="w-full h-1.5 rounded-full overflow-hidden flex">
            {material.likesCount + material.dislikesCount > 0 ? (
              <>
                <div className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round(material.valoracionRatio * 100)}%` }} />
                <div className="h-full bg-error/90 transition-all"
                  style={{ width: `${100 - Math.round(material.valoracionRatio * 100)}%` }} />
              </>
            ) : (
              <div className="h-full w-full bg-outline-variant/50 rounded-full" />
            )}
          </div>
        </div>
      }
    >
      {/* Botón de eliminar: Visible ÚNICAMENTE para ADMIN */}
      {isAdmin && (
        <button
          onClick={() => onDelete(material.id)}
          className="absolute top-3 right-3 z-20 p-1.5 bg-error text-on-error rounded-full shadow-lg hover:scale-110 transition-transform"
          title="Eliminar material (Administrador)"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      )}

      {/* Botón de Denunciar (Solo si no es dueño) */}
      {!isOwner && (
        <Button
          variant="ghost"
          onClick={() => onReport(material)}
          className="absolute top-3 left-3 z-20 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100  text-primary-container  hover:text-error"
          title="Denunciar contenidasdo"
        >
          <span className="material-symbols-outlined text-[24px]">report</span>
        </Button>
      )}

      <div className={`h-32 relative flex items-center justify-center overflow-hidden ${platformConfig ? platformConfig.bgColor : (material.type === "link" ? "bg-surface-container border-b border-surface-variant" : "bg-surface-variant")}`}>
        {isSuspended ? (
          <div className="absolute inset-0 bg-error/10 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
             <span className="material-symbols-outlined text-error text-4xl mb-1">block</span>
             <span className="font-label-caps text-[10px] text-error font-bold">CONTENIDO SUSPENDIDO</span>
          </div>
        ) : platformConfig ? (
          <img
            src={platformConfig.logoUrl}
            alt={platformConfig.label}
            className="h-12 w-12 object-contain relative z-10"
          />
        ) : (
          <>
            {material.type !== "link" ? <div className={`absolute inset-0 bg-gradient-to-br ${getSpecialGradient()} opacity-50`} /> : null}
            <span className={`material-symbols-outlined text-4xl ${material.type === "link" ? "text-outline" : "text-primary-container"} relative z-10`}>{getSpecialIcon()}</span>
          </>
        )}
      </div>

      <div className="px-5 py-3 flex flex-col flex-1">
        <div className="flex gap-2 flex-wrap">
          <Tag variant="positive">{material.subjectName}</Tag>
          {material.tags?.map(tag => (
            <Tag key={tag} variant="info">{tag}</Tag>
          ))}
        </div>
        <h4 className="mt-3 font-title-sm text-title-sm text-on-background group-hover:text-primary transition-colors">
          {material.title}
        </h4>

        {isExternalLink && !isSuspended && (
          <a
            href={material.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 mb-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs text-white transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDiscord
                ? "bg-[#5865F2] hover:bg-[#4752C4] shadow shadow-[#5865F2]/40"
                : isYouTube
                ? "bg-[#FF0000] hover:bg-[#CC0000] shadow shadow-[#FF0000]/40"
                : isGitHub
                ? "bg-[#24292F] hover:bg-[#1B1F23] shadow shadow-[#24292F]/40"
                : isDrive
                ? "bg-[#4285F4] hover:bg-[#3367D6] shadow shadow-[#4285F4]/40"
                : "bg-primary hover:bg-primary-fixed-variant shadow shadow-primary/40"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDiscord ? 'group_add' : isYouTube ? 'play_circle' : isGitHub ? 'code' : isDrive ? 'folder_shared' : 'open_in_new'}
            </span>
            {getActionButtonLabel() || 'ABRIR'}
          </a>
        )}

        {(material.reports?.pending > 0 || material.reports?.verified > 0) && (
          <div className={`flex items-center gap-2 mb-2 p-1.5 rounded-lg ${isAdmin ? 'bg-error/5 border border-error/10' : ''}`}>
            {material.reports?.verified > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-error uppercase">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                {material.reports?.verified} Verificadas
              </span>
            )}
            {material.reports?.pending > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-on-surface-variant uppercase">
                <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                {material.reports?.pending} Pendientes
              </span>
            )}
          </div>
        )}

        <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 text-xs line-clamp-2 flex-1">
          {isSuspended ? "Este material ha sido suspendido temporalmente por acumulación de denuncias y no puede ser accedido." : material.description}
        </p>
      </div>
    </Card>
  );
}