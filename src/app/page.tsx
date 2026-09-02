"use client";

import JSZip from "jszip";

import React, { useState, useEffect, Fragment } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[250px] bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 font-semibold animate-pulse">Cargando mapa interactivo...</div>
});

const LocationViewMap = dynamic(() => import("./LocationViewMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[320px] bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-500 font-semibold animate-pulse">Cargando mapa de ubicación...</div>
});
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Paperclip,
  Archive,
  Lock,
  Unlock,
  FileText,
  LogOut,
  User,
  LayoutDashboard,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Calendar,
  Save,
  Check,
  X,
  Truck,
  QrCode,
  Download,
  Printer,
  Upload,
  MapPin,
  Map,
  Bell,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
  Filter,
  Copy,
  ExternalLink,
  Share2,
  RotateCcw,
  RefreshCw
} from "lucide-react";

interface AppUser {
  id: string;
  nombre: string;
  rut: string;
  cargo: string;
  tipo_usuario: string;
  username: string;
  password?: string;
  habilitado: boolean;
  documento_url?: string;
  created_at?: string;
  email?: string;
  recibe_notificaciones?: boolean;
  faena_asignada?: string;
}

interface Vehicle {
  id: string;
  codigo: string;
  patente: string;
  tipo_vehiculo: string;
  marca: string;
  modelo: string;
  anio: number;
  habilitado: boolean;
  created_at?: string;
}

interface ChecklistQuestion {
  id: string;
  checklist_type: string;
  question_text: string;
  expected_answer: string;
}

interface Faena {
  id: string;
  nombre: string;
  fecha_inicio_contrato: string;
  fecha_fin_contrato: string;
  latitud_inicio?: number;
  longitud_inicio?: number;
  direccion_inicio?: string;
  created_at?: string;
}

interface FaenaPoint {
  id: string;
  faena_id: string;
  codigo: string;
  latitude: number;
  longitude: number;
  periodicidad?: "diario" | "semanal" | "dias_especificos";
  dias_semana?: string[];
  frecuencia_semanal?: number;
  ultimo_registro_servicio?: string;
  created_at?: string;
}

interface RoutePointDetail {
  id: string;
  codigo: string;
  nombre?: string;
  latitude: number;
  longitude: number;
  completado: boolean;
  fecha_completado?: string;
  completed_at?: string;
}

interface RouteRecord {
  id: string;
  user_id: string;
  vehicle_code: string;
  faena_id: string;
  fecha_inicio: string;
  hora_inicio: string;
  latitud_inicio?: number;
  longitud_inicio?: number;
  ayudante_id?: string;
  ayudante_nombre?: string;
  created_at: string;
  faena_name?: string;
  driver_name?: string;
  driver_rut?: string;
  hora_fin?: string;
  progreso_puntos?: string;
  progreso_porcentaje?: number;
  estado?: string;
  motivo_termino?: string;
  puntos_detalle?: RoutePointDetail[];
}

interface AppNotification {
  id: string;
  created_at: string;
  tipo: string;
  driver_name: string;
  driver_rut: string;
  driver_cargo?: string;
  vehicle_code?: string;
  faena_name?: string;
  details?: any;
  motivo?: string;
  observaciones?: string;
  evidencia_url?: string;
  leida: boolean;
}

const MANDATORY_DOCS = [
  "Cédula Identidad",
  "Licencia Municipal",
  "Examen Ocupacional",
  "Certificado 1",
  "Certificado 2"
];

const VEHICLE_DOCS = [
  "Padrón",
  "Permiso de circulación",
  "SOAP",
  "Revisión técnica",
  "Certificado de gases",
  "Certificado de mantención",
  "Certificaciones"
];

export default function HomePage() {
  // Login State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AppUser | null>(null);

  // Recovery State
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");
  const [loadingRecovery, setLoadingRecovery] = useState(false);

  // App Layout State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [notificationFilterWorker, setNotificationFilterWorker] = useState("");
  const [notificationFilterDate, setNotificationFilterDate] = useState("");

  // Delete Notification State
  const [isDeleteNotificationModalOpen, setIsDeleteNotificationModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<AppNotification | null>(null);
  const [deleteNotificationPassword, setDeleteNotificationPassword] = useState("");
  const [deleteNotificationError, setDeleteNotificationError] = useState("");
  const [deletingNotification, setDeletingNotification] = useState(false);

  // Route Records State
  const [routeRecords, setRouteRecords] = useState<RouteRecord[]>([]);
  const [loadingRouteRecords, setLoadingRouteRecords] = useState(true);
  const [routeFilterFaena, setRouteFilterFaena] = useState("");
  const [routeFilterDriver, setRouteFilterDriver] = useState("");
  const [routeFilterVehicle, setRouteFilterVehicle] = useState("");
  const [routeFilterStatus, setRouteFilterStatus] = useState("");
  const [routeFilterDate, setRouteFilterDate] = useState("");
  const [selectedRouteForModal, setSelectedRouteForModal] = useState<RouteRecord | null>(null);

  // Dashboard Specific Filters & Evidences Modal State
  const [dashboardDateFrom, setDashboardDateFrom] = useState("");
  const [dashboardDateTo, setDashboardDateTo] = useState("");
  const [dashboardFaenaFilter, setDashboardFaenaFilter] = useState("");
  const [dashboardDatePreset, setDashboardDatePreset] = useState("all");
  const [selectedRouteForEvidenceModal, setSelectedRouteForEvidenceModal] = useState<RouteRecord | null>(null);

  // Faenas Start / End QR Modal State
  const [selectedFaenaForQR, setSelectedFaenaForQR] = useState<Faena | null>(null);
  const [faenaQRType, setFaenaQRType] = useState<"inicio" | "fin">("inicio");
  const [isFaenaQRModalOpen, setIsFaenaQRModalOpen] = useState(false);
  const [copiedVehicleLink, setCopiedVehicleLink] = useState(false);
  const [copiedFaenaQR, setCopiedFaenaQR] = useState(false);

  // Users CRUD State
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // User Row Expansion State
  const [expandedUserIds, setExpandedUserIds] = useState<string[]>([]);
  const [userDocsMap, setUserDocsMap] = useState<Record<string, any[]>>({});
  const [userPassesMap, setUserPassesMap] = useState<Record<string, any[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  // Vehicles State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [searchVehicleQuery, setSearchVehicleQuery] = useState("");
  const [expandedVehicleIds, setExpandedVehicleIds] = useState<string[]>([]);
  const [vehicleDocsMap, setVehicleDocsMap] = useState<Record<string, any[]>>({});
  const [loadingVehicleDetails, setLoadingVehicleDetails] = useState<Record<string, boolean>>({});
  const [selectedVehicleForQR, setSelectedVehicleForQR] = useState<Vehicle | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Vehicles CRUD Modals State
  const [isVehicleCreateModalOpen, setIsVehicleCreateModalOpen] = useState(false);
  const [isVehicleEditModalOpen, setIsVehicleEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFormData, setVehicleFormData] = useState({
    codigo: "",
    patente: "",
    tipo_vehiculo: "Camioneta 4x4",
    marca: "",
    modelo: "",
    anio: new Date().getFullYear(),
    habilitado: true,
  });
  const [vehicleFormError, setVehicleFormError] = useState("");
  const [savingVehicleForm, setSavingVehicleForm] = useState(false);

  // Faenas State
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [loadingFaenas, setLoadingFaenas] = useState(true);
  const [searchFaenaQuery, setSearchFaenaQuery] = useState("");
  const [expandedFaenaIds, setExpandedFaenaIds] = useState<string[]>([]);
  const [faenaPointsMap, setFaenaPointsMap] = useState<Record<string, FaenaPoint[]>>({});
  const [loadingFaenaPoints, setLoadingFaenaPoints] = useState<Record<string, boolean>>({});

  // Faenas CRUD Modals State
  const [isFaenaCreateModalOpen, setIsFaenaCreateModalOpen] = useState(false);
  const [isFaenaEditModalOpen, setIsFaenaEditModalOpen] = useState(false);
  const [selectedFaena, setSelectedFaena] = useState<Faena | null>(null);
  const [faenaFormData, setFaenaFormData] = useState({
    nombre: "",
    fecha_inicio_contrato: new Date().toISOString().substring(0, 10),
    fecha_fin_contrato: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().substring(0, 10),
    latitud_inicio: -22.4542,
    longitud_inicio: -68.9294,
    direccion_inicio: "Acceso / Garita Principal",
  });
  const [faenaFormError, setFaenaFormError] = useState("");
  const [savingFaenaForm, setSavingFaenaForm] = useState(false);

  // Faena Points CRUD Modal State
  const [isPointModalOpen, setIsPointModalOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<FaenaPoint | null>(null);
  const [selectedFaenaForPoint, setSelectedFaenaForPoint] = useState<Faena | null>(null);
  const [pointFormData, setPointFormData] = useState({
    codigo: "",
    latitude: 0,
    longitude: 0,
    periodicidad: "diario" as "diario" | "semanal" | "dias_especificos",
    dias_semana: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"] as string[],
    frecuencia_semanal: 1,
  });
  const [pointFormError, setPointFormError] = useState("");
  const [savingPointForm, setSavingPointForm] = useState(false);
  const [selectedPointForQR, setSelectedPointForQR] = useState<FaenaPoint | null>(null);
  const [isPointQRModalOpen, setIsPointQRModalOpen] = useState(false);
  const [selectedPointForMap, setSelectedPointForMap] = useState<FaenaPoint | null>(null);
  const [isPointMapModalOpen, setIsPointMapModalOpen] = useState(false);

  // Documents/Passes Upload Modal State
  const [isDocEditModalOpen, setIsDocEditModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<"user_doc" | "user_pass" | "vehicle_doc">("user_doc");
  const [selectedDocName, setSelectedDocName] = useState("");
  const [selectedPassType, setSelectedPassType] = useState<string>("Pase de Acceso");
  const [selectedDocTargetId, setSelectedDocTargetId] = useState(""); // user_id or vehicle_id
  const [editDocDate, setEditDocDate] = useState("");
  const [simulatedFileName, setSimulatedFileName] = useState("");
  const [selectedFileToUpload, setSelectedFileToUpload] = useState<File | null>(null);
  const [currentDocFileUrl, setCurrentDocFileUrl] = useState<string | null>(null);
  const [currentDocFileName, setCurrentDocFileName] = useState<string | null>(null);
  const [isBackupProcessing, setIsBackupProcessing] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);
  const [docEditError, setDocEditError] = useState("");

  // Checklists Tab State
  const [checklistQuestions, setChecklistQuestions] = useState<any[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editExpectedAnswer, setEditExpectedAnswer] = useState("si");
  const [editQuestionType, setEditQuestionType] = useState("binaria");
  const [editQuestionIsOptional, setEditQuestionIsOptional] = useState(false);

  // Checklist Sections State
  const [checklistSections, setChecklistSections] = useState<{ id: string; titulo: string }[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  // Add Question Modal State
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [selectedSectionForNewQuestion, setSelectedSectionForNewQuestion] = useState("");
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState("binaria");
  const [newQuestionIsOptional, setNewQuestionIsOptional] = useState(false);
  const [newQuestionExpectedAnswer, setNewQuestionExpectedAnswer] = useState("si");

  // Checklist Submissions State
  const [checklistsSubTab, setChecklistsSubTab] = useState<"preguntas" | "registros">("preguntas");
  const [checklistSubmissions, setChecklistSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [subFilterStartDate, setSubFilterStartDate] = useState("");
  const [subFilterEndDate, setSubFilterEndDate] = useState("");
  const [subFilterUserId, setSubFilterUserId] = useState("");
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState<any | null>(null);
  const [isSubmissionDetailModalOpen, setIsSubmissionDetailModalOpen] = useState(false);

  // Modales State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form State (for Create/Edit User)
  const [formData, setFormData] = useState({
    nombre: "",
    rut: "",
    cargo: "",
    tipo_usuario: "chofer",
    username: "",
    password: "",
    documento_url: "",
    habilitado: true,
    email: "",
    recibe_notificaciones: false,
    faena_asignada: "",
  });
  const [formError, setFormError] = useState("");
  const [savingForm, setSavingForm] = useState(false);

  // Load users from Supabase
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Error fetching users:", err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load vehicles from Supabase
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("codigo", { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err: any) {
      console.error("Error fetching vehicles:", err.message);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Load faenas and their points from Supabase
  const fetchFaenas = async () => {
    setLoadingFaenas(true);
    try {
      const { data, error } = await supabase
        .from("faenas")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setFaenas(data || []);

      const { data: allPoints } = await supabase
        .from("faena_points")
        .select("*")
        .order("codigo", { ascending: true });

      if (allPoints) {
        const pointsMap: Record<string, FaenaPoint[]> = {};
        allPoints.forEach((pt: FaenaPoint) => {
          if (!pointsMap[pt.faena_id]) pointsMap[pt.faena_id] = [];
          pointsMap[pt.faena_id].push(pt);
        });
        setFaenaPointsMap((prev) => ({ ...prev, ...pointsMap }));
      }
    } catch (err: any) {
      console.error("Error fetching faenas:", err.message);
    } finally {
      setLoadingFaenas(false);
    }
  };

  // Load checklist questions from Supabase
  const fetchChecklistQuestions = async () => {
    setLoadingChecklists(true);
    try {
      const { data, error } = await supabase
        .from("checklist_questions")
        .select("*")
        .order("checklist_type", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChecklistQuestions(data || []);
    } catch (err: any) {
      console.error("Error fetching checklists:", err.message);
    } finally {
      setLoadingChecklists(false);
    }
  };

  // Load checklist submissions from Supabase
  const fetchChecklistSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const { data, error } = await supabase
        .from("vehicle_daily_checklists")
        .select(`
          id,
          vehicle_code,
          fecha,
          user_id,
          created_at,
          respuestas,
          app_users (
            nombre,
            rut,
            cargo
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChecklistSubmissions(data || []);
    } catch (err: any) {
      console.error("Error fetching checklist submissions:", err.message);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Load checklist sections from Supabase
  const fetchChecklistSections = async () => {
    setLoadingSections(true);
    try {
      const { data, error } = await supabase
        .from("checklist_sections")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChecklistSections(data || []);
    } catch (err: any) {
      console.error("Error fetching checklist sections:", err.message);
    } finally {
      setLoadingSections(false);
    }
  };

  // Load notifications from Supabase
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from("app_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error("Error fetching notifications:", err.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Load route starts and calculated records
  const fetchRouteRecords = async () => {
    setLoadingRouteRecords(true);
    try {
      const { data: starts, error: startsError } = await supabase
        .from("route_starts")
        .select("*")
        .order("fecha_inicio", { ascending: false })
        .order("hora_inicio", { ascending: false });

      if (startsError) throw startsError;
      if (!starts) {
        setRouteRecords([]);
        return;
      }

      const [
        usersRes,
        faenasRes,
        pointsRes,
        checkinsRes,
        notificationsRes
      ] = await Promise.all([
        supabase.from("app_users").select("id, nombre, rut"),
        supabase.from("faenas").select("id, nombre"),
        supabase.from("faena_points").select("*"),
        supabase.from("point_checkins").select("point_id, route_start_id, created_at"),
        supabase.from("app_notifications").select("tipo, created_at, driver_rut, faena_name, vehicle_code, motivo, details")
      ]);

      if (usersRes.error) console.error("fetchRouteRecords app_users error:", usersRes.error);
      if (faenasRes.error) console.error("fetchRouteRecords faenas error:", faenasRes.error);
      if (pointsRes.error) console.error("fetchRouteRecords faena_points error:", pointsRes.error);
      if (checkinsRes.error) console.error("fetchRouteRecords point_checkins error:", checkinsRes.error);
      if (notificationsRes.error) console.error("fetchRouteRecords app_notifications error:", notificationsRes.error);

      const allUsers = usersRes.data || [];
      const allFaenas = faenasRes.data || [];
      const allPoints = pointsRes.data || [];
      const allCheckins = checkinsRes.data || [];
      const allNotifications = notificationsRes.data || [];

      // Ensure faenaPointsMap is populated with all points including periodicity
      if (allPoints.length > 0) {
        const pMap: Record<string, FaenaPoint[]> = {};
        allPoints.forEach((pt: any) => {
          if (!pMap[pt.faena_id]) pMap[pt.faena_id] = [];
          pMap[pt.faena_id].push(pt);
        });
        setFaenaPointsMap(prev => ({ ...prev, ...pMap }));
      }

      const userMap: Record<string, any> = {};
      allUsers.forEach(u => {
        userMap[u.id] = u;
      });

      const faenaMap: Record<string, string> = {};
      allFaenas?.forEach(f => {
        faenaMap[f.id] = f.nombre;
      });
      
      const faenaPointsCountMap: Record<string, number> = {};
      allPoints?.forEach(p => {
        faenaPointsCountMap[p.faena_id] = (faenaPointsCountMap[p.faena_id] || 0) + 1;
      });

      const checkinsByRouteMap: Record<string, any[]> = {};
      allCheckins?.forEach(c => {
        if (!c.route_start_id) return;
        if (!checkinsByRouteMap[c.route_start_id]) {
          checkinsByRouteMap[c.route_start_id] = [];
        }
        checkinsByRouteMap[c.route_start_id].push(c);
      });

      const earlyTerminationsMap: Record<string, any> = {};
      allNotifications?.forEach(n => {
        if (n.tipo === 'termino_anticipado') {
          // Timezone robust date formatting
          const localDate = new Date(n.created_at);
          const year = localDate.getFullYear();
          const month = String(localDate.getMonth() + 1).padStart(2, '0');
          const day = String(localDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const rut = n.driver_rut || "";
          const faena = n.faena_name || "";
          const vehicle = n.vehicle_code || "";
          
          // Primary key mapping by routeStartId in details if it exists
          if (n.details) {
            try {
              const detailsObj = typeof n.details === 'string' ? JSON.parse(n.details) : n.details;
              const routeStartId = detailsObj?.routeStartId || detailsObj?.route_start_id;
              if (routeStartId) {
                earlyTerminationsMap[routeStartId] = n;
              }
            } catch (_) {}
          }
          
          // Fallback heuristic mapping key
          const key = `${dateStr}_${rut}_${faena}_${vehicle}`;
          earlyTerminationsMap[key] = n;
        }
      });

      const assembled: RouteRecord[] = starts.map(start => {
        const user = userMap[start.user_id];
        const faenaName = faenaMap[start.faena_id] || "Faena Desconocida";
        const totalPoints = faenaPointsCountMap[start.faena_id] || 0;
        const checkins = checkinsByRouteMap[start.id] || [];
        const completedPoints = checkins.length;
        
        const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
        
        let horaFin = "-";
        if (completedPoints === totalPoints && totalPoints > 0 && checkins.length > 0) {
          const sorted = [...checkins].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const lastCheckinTime = new Date(sorted[sorted.length - 1].created_at);
          horaFin = lastCheckinTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        }

        let estado = "En Proceso";
        let motivoTermino = undefined;
        
        const recordDateStr = start.fecha_inicio;
        const driverRut = user?.rut || "";
        const lookupKey = `${recordDateStr}_${driverRut}_${faenaName}_${start.vehicle_code}`;
        
        const earlyTermNotification = earlyTerminationsMap[start.id] || earlyTerminationsMap[lookupKey];
        if (earlyTermNotification) {
          estado = "Término Anticipado";
          motivoTermino = earlyTermNotification.motivo || "No especificado";
          
          if (earlyTermNotification.created_at) {
            const lastCheckinTime = new Date(earlyTermNotification.created_at);
            horaFin = lastCheckinTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
          }
        } else if (completedPoints === totalPoints && totalPoints > 0) {
          estado = "Finalizada";
        }

        // Filter points for this faena
        const faenaPointsList = allPoints?.filter(p => p.faena_id === start.faena_id) || [];
        
        // Map points to RoutePointDetail
        const puntosDetalle: RoutePointDetail[] = faenaPointsList.map(pt => {
          const checkin = checkins.find(c => c.point_id === pt.id);
          return {
            id: pt.id,
            codigo: pt.codigo || "Sin Código",
            nombre: "",
            latitude: pt.latitude || 0,
            longitude: pt.longitude || 0,
            completado: !!checkin,
            fecha_completado: checkin?.created_at
          };
        });

        return {
          id: start.id,
          user_id: start.user_id,
          vehicle_code: start.vehicle_code,
          faena_id: start.faena_id,
          fecha_inicio: start.fecha_inicio,
          hora_inicio: start.hora_inicio?.slice(0, 5) || "-",
          latitud_inicio: start.latitud_inicio,
          longitud_inicio: start.longitud_inicio,
          ayudante_id: start.ayudante_id,
          ayudante_nombre: start.ayudante_nombre,
          created_at: start.created_at,
          faena_name: faenaName,
          driver_name: user?.nombre || "Chofer Desconocido",
          driver_rut: user?.rut || "N/A",
          hora_fin: horaFin,
          progreso_puntos: `${completedPoints}/${totalPoints}`,
          progreso_porcentaje: progressPercent,
          estado: estado,
          motivo_termino: motivoTermino,
          puntos_detalle: puntosDetalle
        };
      });

      setRouteRecords(assembled);
    } catch (err: any) {
      console.error("Error fetching route records:", err.message);
    } finally {
      setLoadingRouteRecords(false);
    }
  };

  // Delete route record and associated point checkins
  const handleDeleteRouteRecord = async (recordId: string) => {
    if (!confirm("¿Está seguro de eliminar este registro de ruta? Se eliminarán también todos los check-ins de puntos asociados a esta jornada.")) {
      return;
    }
    try {
      await supabase.from("point_checkins").delete().eq("route_start_id", recordId);
      const { error } = await supabase.from("route_starts").delete().eq("id", recordId);
      if (error) throw error;

      if (selectedRouteForModal?.id === recordId) {
        setSelectedRouteForModal(null);
      }
      fetchRouteRecords();
    } catch (err: any) {
      alert("Error al eliminar registro: " + err.message);
    }
  };

  // Toggle notification read status in Supabase
  const toggleNotificationRead = async (id: string, currentReadStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("app_notifications")
        .update({ leida: !currentReadStatus })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, leida: !currentReadStatus } : n));
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(prev => prev ? { ...prev, leida: !currentReadStatus } : null);
      }
    } catch (err: any) {
      console.error("Error updating notification status:", err.message);
    }
  };

  // Initiate notification delete
  const handleInitiateDeleteNotification = (notification: AppNotification) => {
    setNotificationToDelete(notification);
    setDeleteNotificationPassword("");
    setDeleteNotificationError("");
    setIsDeleteNotificationModalOpen(true);
  };

  // Perform delete notification in Supabase after password confirmation
  const handleDeleteNotificationConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteNotificationError("");

    if (!currentAdmin) return;

    if (deleteNotificationPassword !== currentAdmin.password) {
      setDeleteNotificationError("Contraseña incorrecta. Inténtelo de nuevo.");
      return;
    }

    if (!notificationToDelete) return;

    setDeletingNotification(true);

    try {
      const { error } = await supabase
        .from("app_notifications")
        .delete()
        .eq("id", notificationToDelete.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
      if (selectedNotification && selectedNotification.id === notificationToDelete.id) {
        setSelectedNotification(null);
      }

      setIsDeleteNotificationModalOpen(false);
      setNotificationToDelete(null);
      setDeleteNotificationPassword("");
    } catch (err: any) {
      console.error("Error deleting notification:", err.message);
      setDeleteNotificationError("Error al eliminar de la base de datos.");
    } finally {
      setDeletingNotification(false);
    }
  };

  // Auto-reload data when active tab changes or on login
  useEffect(() => {
    if (!isLoggedIn) return;

    if (activeTab === "users") {
      fetchUsers();
      fetchFaenas();
    } else if (activeTab === "vehicles") {
      fetchVehicles();
    } else if (activeTab === "faenas") {
      fetchFaenas();
    } else if (activeTab === "checklists") {
      fetchChecklistSections();
      fetchChecklistQuestions();
      fetchChecklistSubmissions();
      fetchFaenas();
    } else if (activeTab === "notifications") {
      fetchNotifications();
    } else if (activeTab === "dashboard") {
      fetchUsers();
      fetchVehicles();
      fetchFaenas();
      fetchNotifications();
      fetchRouteRecords();
      fetchChecklistSubmissions();
    } else if (activeTab === "route_records") {
      fetchRouteRecords();
      fetchFaenas();
    }
  }, [activeTab, isLoggedIn]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoadingLogin(true);

    try {
      const { data, error } = await supabase
        .from("app_users")
        .select("*")
        .eq("username", loginUsername.trim())
        .eq("password", loginPassword)
        .maybeSingle();

      if (error || !data) {
        setLoginError("Usuario o contraseña incorrectos.");
        setLoadingLogin(false);
        return;
      }

      if (!data.habilitado) {
        setLoginError("Tu cuenta se encuentra deshabilitada. Contacta al administrador.");
        setLoadingLogin(false);
        return;
      }

      // Check allowed roles for WebApp: only admin and cliente
      if (data.tipo_usuario !== "admin" && data.tipo_usuario !== "cliente") {
        setLoginError("Los usuarios con rol de Chofer o Ayudante no tienen acceso a la plataforma web.");
        setLoadingLogin(false);
        return;
      }

      setCurrentAdmin(data);
      if (data.tipo_usuario === "cliente") {
        setActiveTab("dashboard");
      }
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError("Error de conexión con el servidor. Verifica las credenciales.");
    } finally {
      setLoadingLogin(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentAdmin(null);
    setLoginUsername("");
    setLoginPassword("");
  };

  // Handle Recover Password
  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");
    setLoadingRecovery(true);

    try {
      const response = await fetch("/api/recover-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: recoveryEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo.");
      }

      setRecoverySuccess(data.message || "Se ha enviado un correo con tus credenciales.");
      setRecoveryEmail("");
    } catch (err: any) {
      setRecoveryError(err.message || "Error al conectar con el servidor.");
    } finally {
      setLoadingRecovery(false);
    }
  };

  // Fetch single user expanded details
  const refreshUserDetails = async (userId: string) => {
    try {
      const { data: docs } = await supabase
        .from("user_documents")
        .select("*")
        .eq("user_id", userId);

      const { data: passes } = await supabase
        .from("user_passes")
        .select("*")
        .eq("user_id", userId);

      setUserDocsMap((prev) => ({ ...prev, [userId]: docs || [] }));
      setUserPassesMap((prev) => ({ ...prev, [userId]: passes || [] }));
    } catch (err: any) {
      console.error("Error refreshing details:", err.message);
    }
  };

  // Fetch single vehicle expanded details
  const refreshVehicleDetails = async (vehicleId: string) => {
    try {
      const { data: docs } = await supabase
        .from("vehicle_documents")
        .select("*")
        .eq("vehicle_id", vehicleId);

      setVehicleDocsMap((prev) => ({ ...prev, [vehicleId]: docs || [] }));
    } catch (err: any) {
      console.error("Error refreshing details:", err.message);
    }
  };

  // Fetch faena points
  const refreshFaenaPoints = async (faenaId: string) => {
    try {
      const { data: points, error } = await supabase
        .from("faena_points")
        .select("*")
        .eq("faena_id", faenaId)
        .order("codigo", { ascending: true });

      if (error) throw error;
      setFaenaPointsMap((prev) => ({ ...prev, [faenaId]: points || [] }));
    } catch (err: any) {
      console.error("Error loading faena points:", err.message);
    }
  };

  // Toggle User Row Expansion (Only one row expanded at a time)
  const toggleRow = async (userId: string) => {
    const isExpanded = expandedUserIds.includes(userId);
    if (isExpanded) {
      setExpandedUserIds([]);
      return;
    }

    // Collapse any previous open row and expand only this one
    setExpandedUserIds([userId]);

    // Always fetch fresh details and ensure faenas list is fresh
    setLoadingDetails((prev) => ({ ...prev, [userId]: true }));
    try {
      await Promise.all([
        refreshUserDetails(userId),
        fetchFaenas(),
      ]);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Toggle Vehicle Row Expansion (Only one row expanded at a time)
  const toggleVehicleRow = async (vehicleId: string) => {
    const isExpanded = expandedVehicleIds.includes(vehicleId);
    if (isExpanded) {
      setExpandedVehicleIds([]);
      return;
    }

    // Collapse any previous open row and expand only this one
    setExpandedVehicleIds([vehicleId]);

    // Always fetch fresh vehicle details on expansion
    setLoadingVehicleDetails((prev) => ({ ...prev, [vehicleId]: true }));
    try {
      await refreshVehicleDetails(vehicleId);
    } finally {
      setLoadingVehicleDetails((prev) => ({ ...prev, [vehicleId]: false }));
    }
  };

  // Toggle Faena Row Expansion
  const toggleFaenaRow = async (faenaId: string) => {
    const isExpanded = expandedFaenaIds.includes(faenaId);
    if (isExpanded) {
      setExpandedFaenaIds(expandedFaenaIds.filter((id) => id !== faenaId));
      return;
    }

    setExpandedFaenaIds([...expandedFaenaIds, faenaId]);

    // Always fetch fresh faena points on expansion
    setLoadingFaenaPoints((prev) => ({ ...prev, [faenaId]: true }));
    try {
      await refreshFaenaPoints(faenaId);
    } finally {
      setLoadingFaenaPoints((prev) => ({ ...prev, [faenaId]: false }));
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user: AppUser) => {
    try {
      const { error } = await supabase
        .from("app_users")
        .update({ habilitado: !user.habilitado })
        .eq("id", user.id);

      if (error) throw error;
      
      // Update local state
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, habilitado: !user.habilitado } : u
        )
      );
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  // Toggle vehicle active status
  const toggleVehicleStatus = async (vehicle: Vehicle) => {
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ habilitado: !vehicle.habilitado })
        .eq("id", vehicle.id);

      if (error) throw error;
      
      // Update local state
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicle.id ? { ...v, habilitado: !vehicle.habilitado } : v
        )
      );
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  // Helper: Extract storage path from Supabase storage public URL
  const extractStoragePathFromUrl = (url: string): string | null => {
    try {
      if (!url) return null;
      const parts = url.split("/storage/v1/object/public/documents/");
      if (parts.length > 1) {
        return decodeURIComponent(parts[1].split('?')[0]);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper: Download and bundle user documents in a ZIP archive
  const downloadUserBackupZip = async (user: AppUser, docs: any[], passes: any[]) => {
    const filesToDownload: { name: string; url: string }[] = [];

    docs.forEach((d, index) => {
      if (d.archivo_url) {
        const ext = d.archivo_nombre ? d.archivo_nombre.split('.').pop() : 'pdf';
        const cleanDocName = d.document_name.replace(/[^a-zA-Z0-9_-]/g, '_');
        filesToDownload.push({
          name: `Documentos_Obligatorios/${index + 1}_${cleanDocName}.${ext}`,
          url: d.archivo_url,
        });
      }
    });

    passes.forEach((p) => {
      if (p.archivo_url) {
        const ext = p.archivo_nombre ? p.archivo_nombre.split('.').pop() : 'pdf';
        const cleanFaena = (p.faena_name || 'Faena').replace(/[^a-zA-Z0-9_-]/g, '_');
        const cleanTipo = (p.tipo_documento || 'Pase').replace(/[^a-zA-Z0-9_-]/g, '_');
        filesToDownload.push({
          name: `Pases_de_Faena/${cleanFaena}_${cleanTipo}.${ext}`,
          url: p.archivo_url,
        });
      }
    });

    if (filesToDownload.length === 0) return false;

    const zip = new JSZip();
    const todayStr = new Date().toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const readmeContent = `===================================================================
COPIA DE SEGURIDAD DE DOCUMENTACIÓN - CONTROL DE RUTA
===================================================================
TRABAJADOR: ${user.nombre}
RUT: ${user.rut}
CARGO: ${user.cargo}
TIPO DE USUARIO: ${user.tipo_usuario}
FECHA DE DESCARGA / BAJA: ${todayStr}
TOTAL DE ARCHIVOS RESPALDADOS: ${filesToDownload.length}

DETALLE DE DOCUMENTOS INCLUIDOS EN ESTE PAQUETE:
${filesToDownload.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}
===================================================================
`;

    zip.file("README_Respaldo_Trabajador.txt", readmeContent);

    for (const item of filesToDownload) {
      try {
        const res = await fetch(item.url);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(item.name, blob);
        }
      } catch (err) {
        console.error("Error fetching file for zip:", item.url, err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const cleanUserName = user.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanRut = user.rut.replace(/[^a-zA-Z0-9_-]/g, '');
    const dateFormatted = new Date().toISOString().substring(0, 10);
    const zipFilename = `Respaldo_Documentos_Usuario_${cleanRut}_${cleanUserName}_${dateFormatted}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  };

  // Helper: Download and bundle vehicle documents in a ZIP archive
  const downloadVehicleBackupZip = async (vehicle: Vehicle, docs: any[]) => {
    const filesToDownload: { name: string; url: string }[] = [];

    docs.forEach((d, index) => {
      if (d.archivo_url) {
        const ext = d.archivo_nombre ? d.archivo_nombre.split('.').pop() : 'pdf';
        const cleanDocName = d.document_name.replace(/[^a-zA-Z0-9_-]/g, '_');
        filesToDownload.push({
          name: `Documentos_Vehiculo/${index + 1}_${cleanDocName}.${ext}`,
          url: d.archivo_url,
        });
      }
    });

    if (filesToDownload.length === 0) return false;

    const zip = new JSZip();
    const todayStr = new Date().toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const readmeContent = `===================================================================
COPIA DE SEGURIDAD DE DOCUMENTACIÓN VEHICULAR - CONTROL DE RUTA
===================================================================
VEHÍCULO (CÓDIGO): ${vehicle.codigo}
PATENTE: ${vehicle.patente}
TIPO: ${vehicle.tipo_vehiculo}
MARCA / MODELO: ${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})
FECHA DE DESCARGA / BAJA: ${todayStr}
TOTAL DE ARCHIVOS RESPALDADOS: ${filesToDownload.length}

DETALLE DE DOCUMENTOS INCLUIDOS EN ESTE PAQUETE:
${filesToDownload.map((f, i) => `${i + 1}. ${f.name}`).join('\n')}
===================================================================
`;

    zip.file("README_Respaldo_Vehiculo.txt", readmeContent);

    for (const item of filesToDownload) {
      try {
        const res = await fetch(item.url);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(item.name, blob);
        }
      } catch (err) {
        console.error("Error fetching file for zip:", item.url, err);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const cleanPlate = (vehicle.patente || vehicle.codigo).replace(/[^a-zA-Z0-9_-]/g, '');
    const dateFormatted = new Date().toISOString().substring(0, 10);
    const zipFilename = `Respaldo_Documentos_Vehiculo_${cleanPlate}_${dateFormatted}.zip`;

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  };

  // Delete User with automatic ZIP backup & cloud storage release
  const handleDeleteUser = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;

    // 1. Fetch user docs and passes to check for attached files
    const { data: userDocs } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", id);

    const { data: userPasses } = await supabase
      .from("user_passes")
      .select("*")
      .eq("user_id", id);

    const allDocs = userDocs || [];
    const allPasses = userPasses || [];
    const filesWithUrl = [
      ...allDocs.filter((d) => d.archivo_url),
      ...allPasses.filter((p) => p.archivo_url),
    ];

    let confirmMsg = `¿Estás seguro de que deseas eliminar al usuario "${user.nombre}" (${user.rut})?`;
    if (filesWithUrl.length > 0) {
      confirmMsg += `\n\n⚠️ Este trabajador cuenta con ${filesWithUrl.length} archivo(s) de respaldo cargados. El sistema descargará automáticamente un archivo ZIP comprimido con todos sus documentos como copia de seguridad y luego eliminará el perfil para liberar espacio de almacenamiento.`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      if (filesWithUrl.length > 0) {
        setBackupStatusMessage("Generando copia de seguridad ZIP de documentos del trabajador...");
        setIsBackupProcessing(true);
        await downloadUserBackupZip(user, allDocs, allPasses);

        // Delete files from Supabase Storage
        const pathsToDelete = filesWithUrl
          .map((f) => extractStoragePathFromUrl(f.archivo_url))
          .filter((p): p is string => p !== null);

        if (pathsToDelete.length > 0) {
          await supabase.storage.from("documents").remove(pathsToDelete);
        }
      }

      // Delete DB records
      await supabase.from("user_documents").delete().eq("user_id", id);
      await supabase.from("user_passes").delete().eq("user_id", id);
      const { error } = await supabase.from("app_users").delete().eq("id", id);
      if (error) throw error;

      setUsers(users.filter((u) => u.id !== id));
      alert(
        filesWithUrl.length > 0
          ? `Usuario "${user.nombre}" eliminado con éxito. El archivo ZIP de respaldo ha sido descargado en tu equipo.`
          : `Usuario "${user.nombre}" eliminado con éxito.`
      );
    } catch (err: any) {
      alert("Error al eliminar usuario: " + err.message);
    } finally {
      setIsBackupProcessing(false);
      setBackupStatusMessage("");
    }
  };

  // Delete Vehicle with automatic ZIP backup & cloud storage release
  const handleDeleteVehicle = async (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;

    const { data: vehicleDocs } = await supabase
      .from("vehicle_documents")
      .select("*")
      .eq("vehicle_id", id);

    const allDocs = vehicleDocs || [];
    const filesWithUrl = allDocs.filter((d) => d.archivo_url);

    let confirmMsg = `¿Estás seguro de que deseas eliminar el vehículo "${vehicle.codigo}" (Patente: ${vehicle.patente})?`;
    if (filesWithUrl.length > 0) {
      confirmMsg += `\n\n⚠️ Este vehículo cuenta con ${filesWithUrl.length} documento(s) de respaldo cargados. El sistema descargará automáticamente un archivo ZIP comprimido con todos sus documentos antes de eliminarlo para liberar espacio de almacenamiento.`;
    }

    if (!confirm(confirmMsg)) return;

    try {
      if (filesWithUrl.length > 0) {
        setBackupStatusMessage("Generando copia de seguridad ZIP de documentos del vehículo...");
        setIsBackupProcessing(true);
        await downloadVehicleBackupZip(vehicle, allDocs);

        const pathsToDelete = filesWithUrl
          .map((f) => extractStoragePathFromUrl(f.archivo_url))
          .filter((p): p is string => p !== null);

        if (pathsToDelete.length > 0) {
          await supabase.storage.from("documents").remove(pathsToDelete);
        }
      }

      await supabase.from("vehicle_documents").delete().eq("vehicle_id", id);
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
      alert(
        filesWithUrl.length > 0
          ? `Vehículo "${vehicle.codigo}" eliminado con éxito. El archivo ZIP de respaldo ha sido descargado en tu equipo.`
          : `Vehículo "${vehicle.codigo}" eliminado con éxito.`
      );
    } catch (err: any) {
      alert("Error al eliminar vehículo: " + err.message);
    } finally {
      setIsBackupProcessing(false);
      setBackupStatusMessage("");
    }
  };

  // Delete Faena
  const handleDeleteFaena = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta faena? Se eliminarán todas sus rutas y puntos de control.")) return;

    try {
      const { error } = await supabase.from("faenas").delete().eq("id", id);
      if (error) throw error;

      setFaenas(faenas.filter((f) => f.id !== id));
    } catch (err: any) {
      alert("Error al eliminar faena: " + err.message);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      nombre: "",
      rut: "",
      cargo: "",
      tipo_usuario: "chofer",
      username: "",
      password: "",
      documento_url: "",
      habilitado: true,
      email: "",
      recibe_notificaciones: false,
      faena_asignada: "",
    });
    setFormError("");
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (user: AppUser) => {
    setSelectedUser(user);
    setFormData({
      nombre: user.nombre,
      rut: user.rut,
      cargo: user.cargo,
      tipo_usuario: user.tipo_usuario,
      username: user.username,
      password: user.password || "",
      documento_url: user.documento_url || "",
      habilitado: user.habilitado,
      email: user.email || "",
      recibe_notificaciones: user.recibe_notificaciones || false,
      faena_asignada: user.faena_asignada || "",
    });
    setFormError("");
    setIsEditModalOpen(true);
  };

  // Open Vehicle Create Modal
  const openVehicleCreateModal = () => {
    setVehicleFormData({
      codigo: "",
      patente: "",
      tipo_vehiculo: "Camioneta 4x4",
      marca: "",
      modelo: "",
      anio: new Date().getFullYear(),
      habilitado: true,
    });
    setVehicleFormError("");
    setIsVehicleCreateModalOpen(true);
  };

  // Open Vehicle Edit Modal
  const openVehicleEditModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleFormData({
      codigo: vehicle.codigo,
      patente: vehicle.patente,
      tipo_vehiculo: vehicle.tipo_vehiculo,
      marca: vehicle.marca || "",
      modelo: vehicle.modelo || "",
      anio: vehicle.anio,
      habilitado: vehicle.habilitado,
    });
    setVehicleFormError("");
    setIsVehicleEditModalOpen(true);
  };

  // Open Faena Create Modal
  const openFaenaCreateModal = () => {
    setFaenaFormData({
      nombre: "",
      fecha_inicio_contrato: new Date().toISOString().substring(0, 10),
      fecha_fin_contrato: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().substring(0, 10),
      latitud_inicio: -22.4542,
      longitud_inicio: -68.9294,
      direccion_inicio: "Acceso / Garita Principal",
    });
    setFaenaFormError("");
    setIsFaenaCreateModalOpen(true);
  };

  // Open Faena Edit Modal
  const openFaenaEditModal = (faena: Faena) => {
    setSelectedFaena(faena);
    setFaenaFormData({
      nombre: faena.nombre,
      fecha_inicio_contrato: faena.fecha_inicio_contrato,
      fecha_fin_contrato: faena.fecha_fin_contrato,
      latitud_inicio: faena.latitud_inicio ?? -22.4542,
      longitud_inicio: faena.longitud_inicio ?? -68.9294,
      direccion_inicio: faena.direccion_inicio || "Acceso / Garita Principal",
    });
    setFaenaFormError("");
    setIsFaenaEditModalOpen(true);
  };

  // Open Point Create Modal
  const openPointCreateModal = (faena: Faena) => {
    setSelectedPoint(null);
    setSelectedFaenaForPoint(faena);
    setPointFormData({
      codigo: "",
      latitude: -22.9036,
      longitude: -68.1998,
      periodicidad: "diario",
      dias_semana: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      frecuencia_semanal: 1,
    });
    setPointFormError("");
    setIsPointModalOpen(true);
  };

  // Open Point Edit Modal
  const openPointEditModal = (faena: Faena, point: FaenaPoint) => {
    setSelectedPoint(point);
    setSelectedFaenaForPoint(faena);
    setPointFormData({
      codigo: point.codigo,
      latitude: point.latitude,
      longitude: point.longitude,
      periodicidad: point.periodicidad || "diario",
      dias_semana: point.dias_semana || ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
      frecuencia_semanal: point.frecuencia_semanal || 1,
    });
    setPointFormError("");
    setIsPointModalOpen(true);
  };

  // Open Document Upload / Date edit Modal
  const openDocEditModal = (
    type: "user_doc" | "user_pass" | "vehicle_doc",
    docName: string,
    targetId: string,
    currentDate?: string,
    passType: string = "Pase de Acceso",
    currentFileUrl?: string | null,
    currentFileName?: string | null
  ) => {
    setSelectedDocType(type);
    setSelectedDocName(docName);
    setSelectedDocTargetId(targetId);
    setSelectedPassType(passType);
    setEditDocDate(currentDate || new Date().toISOString().substring(0, 10));
    setSelectedFileToUpload(null);
    setCurrentDocFileUrl(currentFileUrl || null);
    setCurrentDocFileName(currentFileName || null);
    setSimulatedFileName("");
    setDocEditError("");
    setIsDocEditModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.nombre || !formData.rut || !formData.cargo || !formData.username || !formData.password) {
      setFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    if (formData.tipo_usuario === "cliente" && !formData.faena_asignada) {
      setFormError("Debes seleccionar una faena asignada para el usuario tipo Cliente.");
      return;
    }

    setSavingForm(true);
    try {
      const { error } = await supabase.from("app_users").insert([
        {
          nombre: formData.nombre.trim(),
          rut: formData.rut.trim(),
          cargo: formData.cargo.trim(),
          tipo_usuario: formData.tipo_usuario,
          username: formData.username.trim(),
          password: formData.password,
          documento_url: formData.documento_url.trim() || null,
          habilitado: formData.habilitado,
          email: formData.email.trim() || null,
          recibe_notificaciones: formData.recibe_notificaciones,
          faena_asignada: formData.tipo_usuario === "cliente" ? formData.faena_asignada.trim() : null,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setFormError("El RUT o Nombre de Usuario ya está registrado.");
        } else {
          throw error;
        }
        setSavingForm(false);
        return;
      }

      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingForm(false);
    }
  };

  // Submit Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedUser) return;
    if (!formData.nombre || !formData.rut || !formData.cargo || !formData.username || !formData.password) {
      setFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    if (formData.tipo_usuario === "cliente" && !formData.faena_asignada) {
      setFormError("Debes seleccionar una faena asignada para el usuario tipo Cliente.");
      return;
    }

    setSavingForm(true);
    try {
      const { error } = await supabase
        .from("app_users")
        .update({
          nombre: formData.nombre.trim(),
          rut: formData.rut.trim(),
          cargo: formData.cargo.trim(),
          tipo_usuario: formData.tipo_usuario,
          username: formData.username.trim(),
          password: formData.password,
          documento_url: formData.documento_url.trim() || null,
          habilitado: formData.habilitado,
          email: formData.email.trim() || null,
          recibe_notificaciones: formData.recibe_notificaciones,
          faena_asignada: formData.tipo_usuario === "cliente" ? formData.faena_asignada.trim() : null,
        })
        .eq("id", selectedUser.id);

      if (error) {
        if (error.code === "23505") {
          setFormError("El RUT o Nombre de Usuario ya está registrado.");
        } else {
          throw error;
        }
        setSavingForm(false);
        return;
      }

      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingForm(false);
    }
  };

  // Submit Create Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleFormError("");

    if (!vehicleFormData.codigo || !vehicleFormData.patente || !vehicleFormData.marca || !vehicleFormData.modelo || !vehicleFormData.anio) {
      setVehicleFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setSavingVehicleForm(true);
    try {
      // 1. Insert vehicle record
      const { data, error } = await supabase
        .from("vehicles")
        .insert([
          {
            codigo: vehicleFormData.codigo.trim().toUpperCase(),
            patente: vehicleFormData.patente.trim().toUpperCase(),
            tipo_vehiculo: vehicleFormData.tipo_vehiculo,
            marca: vehicleFormData.marca.trim(),
            modelo: vehicleFormData.modelo.trim(),
            anio: Number(vehicleFormData.anio),
            habilitado: vehicleFormData.habilitado,
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          setVehicleFormError("El Código Interno o la Patente ya están registrados.");
        } else {
          throw error;
        }
        setSavingVehicleForm(false);
        return;
      }

      // 2. Automatically seed empty vehicle document configurations for this vehicle
      const initialDocs = VEHICLE_DOCS.map((docName) => ({
        vehicle_id: data.id,
        document_name: docName,
        fecha_vencimiento: new Date().toISOString().substring(0, 10) // default to today
      }));

      const { error: docsError } = await supabase
        .from("vehicle_documents")
        .insert(initialDocs);

      if (docsError) throw docsError;

      setIsVehicleCreateModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setVehicleFormError(err.message);
    } finally {
      setSavingVehicleForm(false);
    }
  };

  // Submit Edit Vehicle
  const handleEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleFormError("");

    if (!selectedVehicle) return;
    if (!vehicleFormData.codigo || !vehicleFormData.patente || !vehicleFormData.marca || !vehicleFormData.modelo || !vehicleFormData.anio) {
      setVehicleFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setSavingVehicleForm(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({
          codigo: vehicleFormData.codigo.trim().toUpperCase(),
          patente: vehicleFormData.patente.trim().toUpperCase(),
          tipo_vehiculo: vehicleFormData.tipo_vehiculo,
          marca: vehicleFormData.marca.trim(),
          modelo: vehicleFormData.modelo.trim(),
          anio: Number(vehicleFormData.anio),
          habilitado: vehicleFormData.habilitado,
        })
        .eq("id", selectedVehicle.id);

      if (error) {
        if (error.code === "23505") {
          setVehicleFormError("El Código Interno o la Patente ya están registrados.");
        } else {
          throw error;
        }
        setSavingVehicleForm(false);
        return;
      }

      setIsVehicleEditModalOpen(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err: any) {
      setVehicleFormError(err.message);
    } finally {
      setSavingVehicleForm(false);
    }
  };

  // Submit Create Faena
  const handleCreateFaena = async (e: React.FormEvent) => {
    e.preventDefault();
    setFaenaFormError("");

    if (!faenaFormData.nombre || !faenaFormData.fecha_inicio_contrato || !faenaFormData.fecha_fin_contrato) {
      setFaenaFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setSavingFaenaForm(true);
    try {
      const { error } = await supabase
        .from("faenas")
        .insert([
          {
            nombre: faenaFormData.nombre.trim(),
            fecha_inicio_contrato: faenaFormData.fecha_inicio_contrato,
            fecha_fin_contrato: faenaFormData.fecha_fin_contrato,
            latitud_inicio: faenaFormData.latitud_inicio,
            longitud_inicio: faenaFormData.longitud_inicio,
            direccion_inicio: faenaFormData.direccion_inicio.trim() || "Acceso / Garita Principal",
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          setFaenaFormError("El nombre de la faena ya se encuentra registrado.");
        } else {
          throw error;
        }
        setSavingFaenaForm(false);
        return;
      }

      setIsFaenaCreateModalOpen(false);
      fetchFaenas();
    } catch (err: any) {
      setFaenaFormError(err.message);
    } finally {
      setSavingFaenaForm(false);
    }
  };

  // Submit Edit Faena
  const handleEditFaena = async (e: React.FormEvent) => {
    e.preventDefault();
    setFaenaFormError("");

    if (!selectedFaena) return;
    if (!faenaFormData.nombre || !faenaFormData.fecha_inicio_contrato || !faenaFormData.fecha_fin_contrato) {
      setFaenaFormError("Por favor completa todos los campos.");
      return;
    }

    setSavingFaenaForm(true);
    try {
      const { error } = await supabase
        .from("faenas")
        .update({
          nombre: faenaFormData.nombre.trim(),
          fecha_inicio_contrato: faenaFormData.fecha_inicio_contrato,
          fecha_fin_contrato: faenaFormData.fecha_fin_contrato,
          latitud_inicio: faenaFormData.latitud_inicio,
          longitud_inicio: faenaFormData.longitud_inicio,
          direccion_inicio: faenaFormData.direccion_inicio.trim() || "Acceso / Garita Principal",
        })
        .eq("id", selectedFaena.id);

      if (error) {
        if (error.code === "23505") {
          setFaenaFormError("El nombre de la faena ya se encuentra registrado.");
        } else {
          throw error;
        }
        setSavingFaenaForm(false);
        return;
      }

      setIsFaenaEditModalOpen(false);
      setSelectedFaena(null);
      fetchFaenas();
    } catch (err: any) {
      setFaenaFormError(err.message);
    } finally {
      setSavingFaenaForm(false);
    }
  };

  // Submit Create or Edit Route Point
  const handleCreateOrUpdatePoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setPointFormError("");

    if (!selectedFaenaForPoint || !pointFormData.codigo || !pointFormData.latitude || !pointFormData.longitude) {
      setPointFormError("Por favor completa todos los campos obligatorios.");
      return;
    }

    setSavingPointForm(true);
    try {
      const payload = {
        codigo: pointFormData.codigo.trim(),
        latitude: Number(pointFormData.latitude),
        longitude: Number(pointFormData.longitude),
        periodicidad: pointFormData.periodicidad,
        dias_semana: pointFormData.dias_semana,
        frecuencia_semanal: pointFormData.frecuencia_semanal,
      };

      if (selectedPoint) {
        // Edit Mode
        const { error } = await supabase
          .from("faena_points")
          .update(payload)
          .eq("id", selectedPoint.id);

        if (error) throw error;
      } else {
        // Create Mode
        const { error } = await supabase
          .from("faena_points")
          .insert([
            {
              faena_id: selectedFaenaForPoint.id,
              ...payload,
            },
          ]);

        if (error) {
          if (error.code === "23505") {
            setPointFormError("Este código de punto ya existe en la faena.");
            setSavingPointForm(false);
            return;
          } else {
            throw error;
          }
        }
      }

      setIsPointModalOpen(false);
      refreshFaenaPoints(selectedFaenaForPoint.id);
    } catch (err: any) {
      setPointFormError(err.message);
    } finally {
      setSavingPointForm(false);
    }
  };

  // Delete Route Point
  const handleDeletePoint = async (faenaId: string, pointId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este punto de control?")) return;

    try {
      const { error } = await supabase.from("faena_points").delete().eq("id", pointId);
      if (error) throw error;

      refreshFaenaPoints(faenaId);
    } catch (err: any) {
      alert("Error al eliminar punto: " + err.message);
    }
  };

  // Save Document Date and Real File Upload to Supabase Storage
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocEditError("");

    if (!editDocDate) {
      setDocEditError("Debe ingresar una fecha de vencimiento válida.");
      return;
    }

    setSavingDoc(true);
    try {
      let fileUrl = currentDocFileUrl;
      let fileName = currentDocFileName;
      let fileSize = undefined;

      // 1. Upload new file to Supabase Storage if selected
      if (selectedFileToUpload) {
        const file = selectedFileToUpload;
        const fileExt = file.name.split('.').pop() || 'pdf';
        const cleanDocName = selectedDocName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const timestamp = Date.now();

        let storagePath = "";
        if (selectedDocType === "user_doc") {
          storagePath = `users/${selectedDocTargetId}/${cleanDocName}_${timestamp}.${fileExt}`;
        } else if (selectedDocType === "user_pass") {
          const cleanPassType = (selectedPassType || "pase").toLowerCase().replace(/[^a-z0-9]/g, '_');
          storagePath = `users/${selectedDocTargetId}/passes/${cleanDocName}_${cleanPassType}_${timestamp}.${fileExt}`;
        } else if (selectedDocType === "vehicle_doc") {
          storagePath = `vehicles/${selectedDocTargetId}/${cleanDocName}_${timestamp}.${fileExt}`;
        }

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("documents")
          .getPublicUrl(storagePath);

        fileUrl = publicUrlData.publicUrl;
        fileName = file.name;
        fileSize = file.size;
      }

      // 2. Save/Update record in database
      if (selectedDocType === "user_doc") {
        const { error } = await supabase
          .from("user_documents")
          .upsert(
            {
              user_id: selectedDocTargetId,
              document_name: selectedDocName,
              fecha_vencimiento: editDocDate,
              archivo_url: fileUrl,
              archivo_nombre: fileName,
              archivo_tamano: fileSize,
            },
            { onConflict: "user_id,document_name" }
          );

        if (error) throw error;
        await refreshUserDetails(selectedDocTargetId);
      } else if (selectedDocType === "user_pass") {
        const { error } = await supabase
          .from("user_passes")
          .upsert(
            {
              user_id: selectedDocTargetId,
              faena_name: selectedDocName,
              tipo_documento: selectedPassType || "Pase de Acceso",
              fecha_vencimiento: editDocDate,
              archivo_url: fileUrl,
              archivo_nombre: fileName,
              archivo_tamano: fileSize,
            },
            { onConflict: "user_id,faena_name,tipo_documento" }
          );

        if (error) throw error;
        await refreshUserDetails(selectedDocTargetId);
      } else if (selectedDocType === "vehicle_doc") {
        const { error } = await supabase
          .from("vehicle_documents")
          .upsert(
            {
              vehicle_id: selectedDocTargetId,
              document_name: selectedDocName,
              fecha_vencimiento: editDocDate,
              archivo_url: fileUrl,
              archivo_nombre: fileName,
              archivo_tamano: fileSize,
            },
            { onConflict: "vehicle_id,document_name" }
          );

        if (error) throw error;
        await refreshVehicleDetails(selectedDocTargetId);
      }

      setIsDocEditModalOpen(false);
    } catch (err: any) {
      setDocEditError(err.message);
    } finally {
      setSavingDoc(false);
    }
  };

  // Open Documents Modal
  const openDocModalForUser = (user: AppUser) => {
    setSelectedUser(user);
    setIsDocModalOpen(true);
  };

  // Section Title Editing Handlers
  const handleStartEditSection = (sectionId: string, currentTitle: string) => {
    setEditingSectionId(sectionId);
    setEditSectionTitle(currentTitle);
  };

  const handleSaveSectionTitle = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from("checklist_sections")
        .update({ titulo: editSectionTitle.trim() })
        .eq("id", sectionId);

      if (error) throw error;
      setEditingSectionId(null);
      fetchChecklistSections();
    } catch (err: any) {
      alert("Error al guardar el título de la sección: " + err.message);
    }
  };

  // Start Editing Question
  const startEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.question_text);
    setEditExpectedAnswer(q.expected_answer || "si");
    setEditQuestionType(q.tipo_pregunta || "binaria");
    setEditQuestionIsOptional(q.es_opcional || false);
  };

  // Save Checklist Question
  const handleSaveQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from("checklist_questions")
        .update({
          question_text: editQuestionText.trim(),
          expected_answer: editQuestionType === "binaria" ? editExpectedAnswer : null,
          tipo_pregunta: editQuestionType,
          es_opcional: editQuestionIsOptional
        })
        .eq("id", id);

      if (error) throw error;

      setChecklistQuestions(
        checklistQuestions.map((q) =>
          q.id === id
            ? { 
                ...q, 
                question_text: editQuestionText.trim(), 
                expected_answer: editQuestionType === "binaria" ? editExpectedAnswer : null,
                tipo_pregunta: editQuestionType,
                es_opcional: editQuestionIsOptional
              }
            : q
        )
      );
      setEditingQuestionId(null);
    } catch (err: any) {
      alert("Error al guardar pregunta: " + err.message);
    }
  };

  // Delete Checklist Question
  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) return;
    try {
      const { error } = await supabase
        .from("checklist_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setChecklistQuestions(checklistQuestions.filter((q) => q.id !== id));
    } catch (err: any) {
      alert("Error al eliminar la pregunta: " + err.message);
    }
  };

  // Create Checklist Question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    try {
      const { error } = await supabase
        .from("checklist_questions")
        .insert([
          {
            checklist_type: selectedSectionForNewQuestion,
            question_text: newQuestionText.trim(),
            tipo_pregunta: newQuestionType,
            es_opcional: newQuestionIsOptional,
            expected_answer: newQuestionType === "binaria" ? newQuestionExpectedAnswer : null,
          }
        ]);

      if (error) throw error;
      setIsAddQuestionModalOpen(false);
      setNewQuestionText("");
      setNewQuestionType("binaria");
      setNewQuestionIsOptional(false);
      setNewQuestionExpectedAnswer("si");
      fetchChecklistQuestions();
    } catch (err: any) {
      alert("Error al agregar la pregunta: " + err.message);
    }
  };

  // Open QR Code Modal for Vehicle
  const openQRModal = (vehicle: Vehicle) => {
    setSelectedVehicleForQR(vehicle);
    setIsQRModalOpen(true);
  };

  // Open QR Code Modal for Faena Point
  const openPointQRModal = (point: FaenaPoint) => {
    setSelectedPointForQR(point);
    setIsPointQRModalOpen(true);
  };

  // Filtered Users List
  const filteredUsers = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Vehicles List
  const filteredVehicles = vehicles.filter(
    (v) =>
      v.codigo.toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
      v.patente.toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
      v.tipo_vehiculo.toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
      (v.marca && v.marca.toLowerCase().includes(searchVehicleQuery.toLowerCase())) ||
      (v.modelo && v.modelo.toLowerCase().includes(searchVehicleQuery.toLowerCase()))
  );

  // Filtered Faenas List
  const filteredFaenas = faenas.filter(
    (f) =>
      f.nombre.toLowerCase().includes(searchFaenaQuery.toLowerCase())
  );
  // Filtered Checklist Submissions List
  const filteredSubmissions = checklistSubmissions.filter((submission) => {
    // 1. Worker filter
    if (subFilterUserId && submission.user_id !== subFilterUserId) {
      return false;
    }
    // 2. Date filter (Start Date)
    if (subFilterStartDate && submission.fecha < subFilterStartDate) {
      return false;
    }
    // 3. Date filter (End Date)
    if (subFilterEndDate && submission.fecha > subFilterEndDate) {
      return false;
    }
    return true;
  });
  // Helper: check if a date is expired
  const isDateExpired = (dateString?: string) => {
    if (!dateString) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateString);
    return expDate < today;
  };

  // Helper: format date to DD/MM/YYYY
  const formatDateString = (dateString?: string) => {
    if (!dateString) return "No registrado";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };
  // Helper: format Timestamp to readable string
  const formatTimestampString = (timestampString?: string) => {
    if (!timestampString) return "Sin registro de visitas";
    const date = new Date(timestampString);
    return date.toLocaleString();
  };

  // Helper: format Timestamp to time only string (HH:MM:SS)
  const formatTimeString = (timestampString?: string) => {
    if (!timestampString) return "N/A";
    const date = new Date(timestampString);
    return date.toLocaleTimeString();
  };

  // Render Login page if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12 sm:px-6 lg:px-8">
        {showPasswordRecovery ? (
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                <Lock className="h-9 w-9" />
              </div>
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
                Recuperar Contraseña
              </h2>
              <p className="mt-2 text-center text-sm text-slate-500">
                Ingresa tu correo registrado para recibir tus credenciales
              </p>
            </div>

            {recoveryError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-150">
                <Check className="h-5 w-5 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleRecoverPassword}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-850 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loadingRecovery}
                  className="flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
                >
                  {loadingRecovery ? "Enviando..." : "Enviar Contraseña"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordRecovery(false);
                    setRecoveryError("");
                    setRecoverySuccess("");
                  }}
                  className="flex w-full justify-center rounded-lg border border-slate-300 bg-white py-2.5 px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none transition-colors"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
            <div className="flex flex-col items-center">
              <img src="/logo.png" alt="Control de Ruta" className="h-20 w-auto object-contain" />
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
                Control de Ruta
              </h2>
              <p className="mt-2 text-center text-sm text-slate-500">
                Panel de Control Administrador
              </p>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="space-y-4 rounded-md">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="h-5 w-5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      placeholder="Usuario admin"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordRecovery(true);
                        setLoginError("");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-400"
                >
                  {loadingLogin ? "Validando..." : "Ingresar"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Dashboard Interface
  const unreadCount = notifications.filter(n => !n.leida).length;

  const filteredRouteRecords = routeRecords.filter(record => {
    if (routeFilterFaena && record.faena_id !== routeFilterFaena) return false;
    if (routeFilterDriver && !record.driver_name?.toLowerCase().includes(routeFilterDriver.toLowerCase()) && !record.driver_rut?.includes(routeFilterDriver)) return false;
    if (routeFilterVehicle && !record.vehicle_code?.toLowerCase().includes(routeFilterVehicle.toLowerCase())) return false;
    if (routeFilterStatus && record.estado !== routeFilterStatus) return false;
    if (routeFilterDate && record.fecha_inicio !== routeFilterDate) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Component */}
      <aside
        className={`${
          isSidebarExpanded ? "w-64" : "w-20"
        } flex flex-col bg-slate-900 text-white transition-all duration-300 relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 border border-slate-900 z-10"
        >
          {isSidebarExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-800">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain shrink-0" />
          {isSidebarExpanded && (
            <span className="font-bold text-base tracking-wide text-white">
              Control de Ruta
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {currentAdmin?.tipo_usuario === "cliente" ? (
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-5 w-5 shrink-0" />
              {isSidebarExpanded && <span>Dashboard</span>}
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("users")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "users"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Users className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Usuarios</span>}
              </button>

              <button
                onClick={() => setActiveTab("vehicles")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "vehicles"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Truck className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Vehículos</span>}
              </button>

              <button
                onClick={() => setActiveTab("faenas")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "faenas"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Map className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Faenas y Rutas</span>}
              </button>

              <button
                onClick={() => setActiveTab("checklists")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "checklists"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <ClipboardList className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Gestión de Encuestas</span>}
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "notifications"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="relative">
                  <Bell className="h-5 w-5 shrink-0" />
                  {!isSidebarExpanded && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {isSidebarExpanded && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Dashboard</span>}
              </button>

              <button
                onClick={() => setActiveTab("route_records")}
                className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
                  activeTab === "route_records"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Clock className="h-5 w-5 shrink-0" />
                {isSidebarExpanded && <span>Registros de Rutas</span>}
              </button>
            </>
          )}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-blue-400">
              <User className="h-5 w-5" />
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-200">
                  {currentAdmin?.nombre}
                </p>
                <p className="text-xs text-slate-500 truncate capitalize">
                  {currentAdmin?.tipo_usuario === "cliente" ? `Cliente (${currentAdmin?.faena_asignada || "General"})` : "Administrador"}
                </p>
              </div>
            )}
            {isSidebarExpanded && (
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
          {!isSidebarExpanded && (
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full justify-center text-slate-400 hover:text-red-400 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden text-slate-700">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            {activeTab === "users"
              ? "Gestión de Usuarios APK"
              : activeTab === "vehicles"
              ? "Monitoreo y Gestión de Vehículos"
              : activeTab === "faenas"
              ? "Gestión de Faenas y Puntos de Rutas"
              : activeTab === "checklists"
              ? "Configuración de Encuestas / Checklists"
              : "Estadísticas y Monitoreo"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">
              Conectado a: <strong className="text-blue-600">Supabase</strong>
            </span>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Action Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, RUT o usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                {/* Add User Button */}
                <button
                  onClick={openCreateModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition-colors text-sm"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Usuario
                </button>
              </div>

              {/* Table Data Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <span className="text-sm text-slate-500 font-medium">Cargando usuarios...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No se encontraron usuarios</h3>
                    <p className="text-slate-500 mt-1 max-w-sm text-sm">
                      {searchQuery ? "Intenta modificar tu criterio de búsqueda." : "Crea tu primer usuario APK para comenzar a operar."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-6 py-4 w-10"></th>
                          <th className="px-6 py-4">Nombre / RUT</th>
                          <th className="px-6 py-4">Cargo</th>
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Tipo / Rol</th>
                          <th className="px-6 py-4 text-center">Contrato</th>
                          <th className="px-6 py-4 text-center">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => {
                          const isExpanded = expandedUserIds.includes(user.id);
                          return (
                            <Fragment key={user.id}>
                              {/* Row structure */}
                              <tr
                                onClick={() => toggleRow(user.id)}
                                className={`cursor-pointer transition-colors ${
                                  isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="px-6 py-4 text-slate-400">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{user.nombre}</div>
                                  <div className="text-xs text-slate-400 font-medium">RUT: {user.rut}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-700">{user.cargo}</td>
                                <td className="px-6 py-4">
                                  <div className="font-mono font-medium text-slate-600">{user.username}</div>
                                  {user.email && (
                                    <div className="text-[10px] text-slate-400 italic truncate max-w-[150px]" title={user.email}>
                                      {user.email}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1 items-start">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                        user.tipo_usuario === "admin"
                                          ? "bg-purple-100 text-purple-700"
                                          : user.tipo_usuario === "cliente"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : user.tipo_usuario === "ayudante"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {user.tipo_usuario === "admin"
                                        ? "Admin"
                                        : user.tipo_usuario === "cliente"
                                        ? `Cliente${user.faena_asignada ? ` (${user.faena_asignada})` : ""}`
                                        : user.tipo_usuario === "ayudante"
                                        ? "Ayudante"
                                        : "Chofer"}
                                    </span>
                                    {user.tipo_usuario === "admin" && user.recibe_notificaciones && (
                                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                        🔔 Notificar
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => openDocModalForUser(user)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                      user.documento_url
                                        ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    <FileText className="h-4 w-4" />
                                    {user.documento_url ? "Ver Contrato" : "Asociar"}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => toggleUserStatus(user)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                      user.habilitado
                                        ? "border-green-200 bg-green-50 text-green-700 hover:border-green-300"
                                        : "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                                    }`}
                                    title={user.habilitado ? "Desactivar Usuario" : "Activar Usuario"}
                                  >
                                    {user.habilitado ? (
                                      <>
                                        <Unlock className="h-3.5 w-3.5" />
                                        <span>Activo</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>Inactivo</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Editar Usuario"
                                    >
                                      <Edit2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-slate-400 hover:text-red-600 transition-colors"
                                      title="Eliminar Usuario"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row Content */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40 border-l-4 border-l-blue-500">
                                  <td colSpan={8} className="p-6 border-b border-slate-200">
                                    {loadingDetails[user.id] ? (
                                      <div className="flex items-center justify-center py-6 gap-2 text-slate-500 text-xs">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                                        <span>Cargando documentación...</span>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Mandatory Docs */}
                                        <div>
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Documentación Obligatoria (Haga clic para editar)
                                          </h4>
                                          <div className="space-y-2">
                                            {MANDATORY_DOCS.map((docName) => {
                                              const record = (userDocsMap[user.id] || []).find(
                                                (d) => d.document_name === docName
                                              );
                                              const expired = isDateExpired(record?.fecha_vencimiento);
                                              return (
                                                <div
                                                  key={docName}
                                                  onClick={() => openDocEditModal("user_doc", docName, user.id, record?.fecha_vencimiento, "Pase de Acceso", record?.archivo_url, record?.archivo_nombre)}
                                                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                                                      {docName}
                                                    </span>
                                                    {record?.archivo_url && (
                                                      <a
                                                        href={record.archivo_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded font-bold transition-colors shadow-2xs"
                                                        title="Ver archivo de respaldo"
                                                      >
                                                        <Paperclip className="h-2.5 w-2.5" />
                                                        Respaldo
                                                      </a>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                                      <Calendar className="h-3.5 w-3.5" />
                                                      {formatDateString(record?.fecha_vencimiento)}
                                                    </span>
                                                    {record ? (
                                                      expired ? (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                                          <XCircle className="h-3 w-3" />
                                                          Vencido
                                                        </span>
                                                      ) : (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                                                          <CheckCircle className="h-3 w-3" />
                                                          Vigente
                                                        </span>
                                                      )
                                                    ) : (
                                                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 border border-red-200">
                                                        Pendiente
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* Faena Passes & Licencias - Tabla Compacta de 3 Columnas */}
                                        <div>
                                          <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                              <ClipboardList className="h-4 w-4 text-purple-500" />
                                              Pases y Documentos por Faena
                                            </h4>
                                            <span className="text-[10px] text-slate-400 font-medium">
                                              {faenas.length} {faenas.length === 1 ? "faena" : "faenas"} • Clic para editar
                                            </span>
                                          </div>

                                          {faenas.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic py-2">No hay faenas registradas en el sistema.</p>
                                          ) : (
                                            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                              <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                                    <tr>
                                                      <th className="py-2.5 px-3">Faena</th>
                                                      <th className="py-2.5 px-3">Pase de Acceso</th>
                                                      <th className="py-2.5 px-3">Licencia Interna</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                                    {faenas.map((faena) => {
                                                      const faenaName = faena.nombre;
                                                      const userPasses = userPassesMap[user.id] || [];
                                                      const isOperator =
                                                        user.tipo_usuario === "chofer" ||
                                                        user.tipo_usuario === "operador" ||
                                                        user.cargo.toLowerCase().includes("chofer") ||
                                                        user.cargo.toLowerCase().includes("conductor") ||
                                                        user.cargo.toLowerCase().includes("operador");

                                                      // 1. Pase de Acceso
                                                      const paseAcceso = userPasses.find(
                                                        (p) => p.faena_name === faenaName && (p.tipo_documento === "Pase de Acceso" || !p.tipo_documento)
                                                      );
                                                      const paseAccesoExpired = isDateExpired(paseAcceso?.fecha_vencimiento);

                                                      // 2. Licencia Interna (solo choferes/operadores)
                                                      const licenciaInterna = userPasses.find(
                                                        (p) => p.faena_name === faenaName && p.tipo_documento === "Licencia Interna"
                                                      );
                                                      const licenciaExpired = isDateExpired(licenciaInterna?.fecha_vencimiento);

                                                      return (
                                                        <tr key={faena.id || faenaName} className="hover:bg-slate-50/80 transition-colors">
                                                          {/* Columna 1: Faena */}
                                                          <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                                                            <div className="flex items-center gap-1.5">
                                                              <Map className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                              <span>{faenaName}</span>
                                                            </div>
                                                          </td>

                                                          {/* Columna 2: Pase de Acceso */}
                                                          <td className="py-2.5 px-3">
                                                            <button
                                                              type="button"
                                                              onClick={() =>
                                                                openDocEditModal("user_pass", faenaName, user.id, paseAcceso?.fecha_vencimiento, "Pase de Acceso", paseAcceso?.archivo_url, paseAcceso?.archivo_nombre)
                                                              }
                                                              className="flex items-center gap-2 group text-left w-full hover:opacity-80 transition-opacity"
                                                              title="Clic para editar fecha del Pase de Acceso"
                                                            >
                                                              {paseAcceso ? (
                                                                paseAccesoExpired ? (
                                                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 whitespace-nowrap">
                                                                    <XCircle className="h-2.5 w-2.5" /> Vencido
                                                                  </span>
                                                                ) : (
                                                                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700 whitespace-nowrap">
                                                                    <CheckCircle className="h-2.5 w-2.5" /> Activo
                                                                  </span>
                                                                )
                                                              ) : (
                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                                  Inactivo
                                                                </span>
                                                              )}
                                                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                                                                <Calendar className="h-2.5 w-2.5 text-slate-400" />
                                                                {formatDateString(paseAcceso?.fecha_vencimiento)}
                                                              </span>
                                                            </button>
                                                          </td>

                                                          {/* Columna 3: Licencia Interna */}
                                                          <td className="py-2.5 px-3">
                                                            {isOperator ? (
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  openDocEditModal("user_pass", faenaName, user.id, licenciaInterna?.fecha_vencimiento, "Licencia Interna", licenciaInterna?.archivo_url, licenciaInterna?.archivo_nombre)
                                                                }
                                                                className="flex items-center gap-2 group text-left w-full hover:opacity-80 transition-opacity"
                                                                title="Clic para editar fecha de Licencia Interna"
                                                              >
                                                                {licenciaInterna ? (
                                                                  licenciaExpired ? (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700 whitespace-nowrap">
                                                                      <XCircle className="h-2.5 w-2.5" /> Vencido
                                                                    </span>
                                                                  ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700 whitespace-nowrap">
                                                                      <CheckCircle className="h-2.5 w-2.5" /> Activo
                                                                    </span>
                                                                  )
                                                                ) : (
                                                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                                    Inactivo
                                                                  </span>
                                                                )}
                                                                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                                                                  <Calendar className="h-2.5 w-2.5 text-slate-400" />
                                                                  {formatDateString(licenciaInterna?.fecha_vencimiento)}
                                                                </span>
                                                              </button>
                                                            ) : (
                                                              <span className="text-[10px] text-slate-400 italic">No aplica</span>
                                                            )}
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "vehicles" && (
            <div className="space-y-6">
              {/* Action Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por código, patente, marca, modelo o tipo..."
                    value={searchVehicleQuery}
                    onChange={(e) => setSearchVehicleQuery(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                {/* Add Vehicle Button */}
                <button
                  onClick={openVehicleCreateModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition-colors text-sm"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Vehículo
                </button>
              </div>

              {/* Table Data Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loadingVehicles ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <span className="text-sm text-slate-500 font-medium">Cargando vehículos...</span>
                  </div>
                ) : filteredVehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No se encontraron vehículos</h3>
                    <p className="text-slate-500 mt-1 max-w-sm text-sm">
                      Intenta modificar tu criterio de búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-6 py-4 w-10"></th>
                          <th className="px-6 py-4">Código / Patente</th>
                          <th className="px-6 py-4">Vehículo</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4 text-center">Código QR</th>
                          <th className="px-6 py-4 text-center">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVehicles.map((vehicle) => {
                          const isExpanded = expandedVehicleIds.includes(vehicle.id);
                          return (
                            <Fragment key={vehicle.id}>
                              {/* Row structure */}
                              <tr
                                onClick={() => toggleVehicleRow(vehicle.id)}
                                className={`cursor-pointer transition-colors ${
                                  isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="px-6 py-4 text-slate-400">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-bold text-slate-800">{vehicle.codigo}</div>
                                  <div className="text-xs text-slate-400 font-mono font-semibold">Patente: {vehicle.patente}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-700">
                                    {vehicle.marca || "Sin Marca"} {vehicle.modelo || ""}
                                  </div>
                                  <div className="text-xs text-slate-400 font-medium">Año: {vehicle.anio || "N/A"}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600">{vehicle.tipo_vehiculo}</td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => openQRModal(vehicle)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                                  >
                                    <QrCode className="h-4 w-4" />
                                    Generar QR
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => toggleVehicleStatus(vehicle)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                      vehicle.habilitado
                                        ? "border-green-200 bg-green-50 text-green-700 hover:border-green-300"
                                        : "border-red-200 bg-red-50 text-red-700 hover:border-red-300"
                                    }`}
                                    title={vehicle.habilitado ? "Desactivar Vehículo" : "Activar Vehículo"}
                                  >
                                    {vehicle.habilitado ? (
                                      <>
                                        <Unlock className="h-3.5 w-3.5" />
                                        <span>Activo</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>Inactivo</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => openVehicleEditModal(vehicle)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Editar Vehículo"
                                    >
                                      <Edit2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVehicle(vehicle.id)}
                                      className="text-slate-400 hover:text-red-600 transition-colors"
                                      title="Eliminar Vehículo"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row Content */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40 border-l-4 border-l-blue-500">
                                  <td colSpan={7} className="px-10 py-6 border-b border-slate-200">
                                    {loadingVehicleDetails[vehicle.id] ? (
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></div>
                                        Cargando documentos de vehículo...
                                      </div>
                                    ) : (
                                      <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                          <FileText className="h-4 w-4 text-blue-500" />
                                          Vencimiento de Documentación Obligatoria (Haga clic para editar)
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                          {VEHICLE_DOCS.map((docName) => {
                                            const record = (vehicleDocsMap[vehicle.id] || []).find(
                                              (d) => d.document_name === docName
                                            );
                                            const expired = isDateExpired(record?.fecha_vencimiento);
                                            return (
                                              <div
                                                key={docName}
                                                onClick={() => openDocEditModal("vehicle_doc", docName, vehicle.id, record?.fecha_vencimiento, "Pase de Acceso", record?.archivo_url, record?.archivo_nombre)}
                                                className="flex flex-col p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-xs font-bold text-slate-500 uppercase truncate hover:text-blue-600 transition-colors" title={docName}>
                                                    {docName}
                                                  </span>
                                                  {record?.archivo_url && (
                                                    <a
                                                      href={record.archivo_url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="inline-flex items-center gap-1 text-[9px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1 py-0.5 rounded font-bold transition-colors"
                                                      title="Ver archivo de respaldo"
                                                    >
                                                      <Paperclip className="h-2.5 w-2.5" />
                                                      PDF
                                                    </a>
                                                  )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                  <span className="text-xs text-slate-700 font-mono font-medium flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {formatDateString(record?.fecha_vencimiento)}
                                                  </span>
                                                  {record ? (
                                                    expired ? (
                                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                                                        Vencido
                                                      </span>
                                                    ) : (
                                                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                                                        Vigente
                                                      </span>
                                                    )
                                                  ) : (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                      Pendiente
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "faenas" && (
            <div className="space-y-6">
              {/* Action Controls */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre de faena..."
                    value={searchFaenaQuery}
                    onChange={(e) => setSearchFaenaQuery(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                {/* Add Faena Button */}
                <button
                  onClick={openFaenaCreateModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 shadow transition-colors text-sm"
                >
                  <Plus className="h-5 w-5" />
                  Agregar Faena
                </button>
              </div>

              {/* Table Data Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loadingFaenas ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                    <span className="text-sm text-slate-500 font-medium">Cargando faenas...</span>
                  </div>
                ) : filteredFaenas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No se encontraron faenas</h3>
                    <p className="text-slate-500 mt-1 max-w-sm text-sm">
                      Intenta modificar tu criterio de búsqueda.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-6 py-4 w-10"></th>
                          <th className="px-6 py-4">Nombre Faena</th>
                          <th className="px-6 py-4">Punto Inicio / Fin de Ruta</th>
                          <th className="px-6 py-4">Códigos QR de Acceso</th>
                          <th className="px-6 py-4">Inicio Contrato</th>
                          <th className="px-6 py-4">Fin Contrato</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredFaenas.map((faena) => {
                          const isExpanded = expandedFaenaIds.includes(faena.id);
                          return (
                            <Fragment key={faena.id}>
                              {/* Row structure */}
                              <tr
                                onClick={() => toggleFaenaRow(faena.id)}
                                className={`cursor-pointer transition-colors ${
                                  isExpanded ? "bg-slate-50/70" : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="px-6 py-4 text-slate-400">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-800">{faena.nombre}</td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-between gap-3 max-w-[250px]">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        <span className="truncate max-w-[150px]" title={faena.direccion_inicio || "Garita / Acceso Principal"}>
                                          {faena.direccion_inicio || "Garita / Acceso Principal"}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-mono font-medium pl-5">
                                        {(faena.latitud_inicio ?? -22.4542).toFixed(4)}, {(faena.longitud_inicio ?? -68.9294).toFixed(4)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPointForMap({
                                          id: faena.id,
                                          faena_id: faena.id,
                                          codigo: `Inicio/Fin: ${faena.nombre} (${faena.direccion_inicio || "Acceso"})`,
                                          latitude: faena.latitud_inicio ?? -22.4542,
                                          longitude: faena.longitud_inicio ?? -68.9294,
                                        });
                                        setIsPointMapModalOpen(true);
                                      }}
                                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200 transition-all shadow-2xs shrink-0 cursor-pointer"
                                      title="Ver ubicación Inicio/Fin en mapa interactivo"
                                    >
                                      <Map className="h-5 w-5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFaenaForQR(faena);
                                        setFaenaQRType("inicio");
                                        setIsFaenaQRModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors shadow-xs cursor-pointer"
                                      title="Ver QR Inicio de Faena (Entrada)"
                                    >
                                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                                      QR Inicio
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedFaenaForQR(faena);
                                        setFaenaQRType("fin");
                                        setIsFaenaQRModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors shadow-xs cursor-pointer"
                                      title="Ver QR Final de Faena (Salida)"
                                    >
                                      <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                                      QR Final
                                    </button>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700 font-mono">
                                  {formatDateString(faena.fecha_inicio_contrato)}
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700 font-mono">
                                  {formatDateString(faena.fecha_fin_contrato)}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => openFaenaEditModal(faena)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Editar Faena"
                                    >
                                      <Edit2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFaena(faena.id)}
                                      className="text-slate-400 hover:text-red-600 transition-colors"
                                      title="Eliminar Faena"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row Content (Faena Points / Route) */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40 border-l-4 border-l-blue-500">
                                  <td colSpan={7} className="px-10 py-6 border-b border-slate-200">
                                    {loadingFaenaPoints[faena.id] ? (
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></div>
                                        Cargando puntos de ruta...
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4 text-blue-500" />
                                            Puntos de Ruta de la Faena
                                          </h4>
                                          <button
                                            onClick={() => openPointCreateModal(faena)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                            Agregar Punto
                                          </button>
                                        </div>

                                        {(faenaPointsMap[faena.id] || []).length === 0 ? (
                                          <div className="p-6 text-center border border-dashed border-slate-250 bg-white rounded-xl text-xs text-slate-450 font-medium">
                                            No hay puntos de ruta agregados para esta faena. Agrega un punto para habilitar las rutas en la APK.
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {(faenaPointsMap[faena.id] || []).map((point) => (
                                              <div
                                                key={point.id}
                                                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 relative hover:border-blue-300 transition-colors"
                                              >
                                                <div className="flex justify-between items-start gap-4">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-slate-800 truncate" title={point.codigo}>
                                                      {point.codigo}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                      <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                                        Lat: {point.latitude} • Lng: {point.longitude}
                                                      </span>
                                                    </div>
                                                    <div className="mt-1.5">
                                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                                        point.periodicidad === 'diario' || !point.periodicidad
                                                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                          : point.periodicidad === 'semanal'
                                                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                      }`}>
                                                        {(!point.periodicidad || point.periodicidad === 'diario') && '📅 Diario (7/7)'}
                                                        {point.periodicidad === 'semanal' && '📆 Semanal (1x)'}
                                                        {point.periodicidad === 'dias_especificos' && `🗓️ ${(point.dias_semana || []).map((d: string) => d.charAt(0).toUpperCase() + d.slice(1,3)).join(', ')}`}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-1.5 shrink-0">
                                                    <button
                                                      onClick={() => openPointQRModal(point)}
                                                      className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                                      title="Generar QR"
                                                    >
                                                      <QrCode className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setSelectedPointForMap(point);
                                                        setIsPointMapModalOpen(true);
                                                      }}
                                                      className="text-slate-400 hover:text-green-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                                      title="Ver Ubicación en Mapa"
                                                    >
                                                      <MapPin className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => openPointEditModal(faena, point)}
                                                      className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                                      title="Editar Punto"
                                                    >
                                                      <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDeletePoint(faena.id, point.id)}
                                                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                                      title="Eliminar Punto"
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-2 bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-xl">
                                                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                  <div className="truncate">
                                                    <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">Último Servicio:</span>
                                                    <span className="text-slate-700 font-mono text-[11px]">
                                                      {formatTimestampString(point.ultimo_registro_servicio)}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "checklists" && (
            <div className="space-y-6 font-sans">
              {/* Navigation Sub-Tabs */}
              <div className="flex gap-4 border-b border-slate-200">
                <button
                  onClick={() => setChecklistsSubTab("preguntas")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                    checklistsSubTab === "preguntas"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Preguntas de Encuestas
                </button>
                <button
                  onClick={() => {
                    setChecklistsSubTab("registros");
                    fetchChecklistSubmissions(); // reload records
                  }}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                    checklistsSubTab === "registros"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Registros de Encuestas
                </button>
              </div>

              {checklistsSubTab === "preguntas" ? (
                <>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Editar Preguntas de Encuestas</h3>
                    <p className="text-sm text-slate-500">
                      Modifica las preguntas mostradas en la APK y especifica la respuesta esperada ("Sí" o "No") que debe marcar el chofer para aprobar el checklist.
                    </p>
                  </div>

                  {loadingChecklists || loadingSections ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                      <span className="text-sm text-slate-500 font-medium">Cargando preguntas de encuestas...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {checklistSections.map((section) => {
                        const type = section.id;
                        const questions = checklistQuestions.filter((q) => q.checklist_type === type);
                        const isEditingSection = editingSectionId === type;

                        return (
                          <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                              {isEditingSection ? (
                                <div className="flex items-center gap-2 flex-1 mr-4">
                                  <input
                                    type="text"
                                    value={editSectionTitle}
                                    onChange={(e) => setEditSectionTitle(e.target.value)}
                                    className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 flex-1 font-semibold"
                                  />
                                  <button
                                    onClick={() => handleSaveSectionTitle(type)}
                                    className="bg-blue-650 hover:bg-blue-700 px-2.5 py-1 rounded text-xs font-bold transition-colors shrink-0"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={() => setEditingSectionId(null)}
                                    className="bg-slate-700 hover:bg-slate-650 px-2.5 py-1 rounded text-xs font-bold transition-colors shrink-0"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 mr-4 min-w-0">
                                  <h4 className="font-bold text-sm tracking-wide uppercase truncate">
                                    {section.titulo}
                                  </h4>
                                  <button
                                    onClick={() => handleStartEditSection(type, section.titulo)}
                                    className="text-slate-400 hover:text-white p-0.5"
                                    title="Editar Título de Sección"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-slate-850 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                                  {questions.length} Preguntas
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedSectionForNewQuestion(type);
                                    setIsAddQuestionModalOpen(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-755 text-white rounded p-1 hover:scale-105 transition-transform"
                                  title="Agregar Pregunta"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                              {questions.map((q) => {
                                const isEditing = editingQuestionId === q.id;
                                return (
                                  <div key={q.id} className="p-4 flex flex-col gap-3">
                                    {isEditing ? (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            Texto de la Pregunta
                                          </label>
                                          <textarea
                                            value={editQuestionText}
                                            onChange={(e) => setEditQuestionText(e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                                            rows={2}
                                          />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                              Tipo de Pregunta
                                            </label>
                                            <select
                                              value={editQuestionType}
                                              onChange={(e) => setEditQuestionType(e.target.value)}
                                              className="w-full border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 focus:outline-none bg-white font-medium"
                                            >
                                              <option value="binaria">Binaria (Sí/No)</option>
                                              <option value="desarrollo">Desarrollo (Texto)</option>
                                              <option value="foto">Foto (Cámara)</option>
                                            </select>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 pt-4">
                                            <input
                                              type="checkbox"
                                              id={`edit-optional-${q.id}`}
                                              checked={editQuestionIsOptional}
                                              onChange={(e) => setEditQuestionIsOptional(e.target.checked)}
                                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                            />
                                            <label htmlFor={`edit-optional-${q.id}`} className="text-xs font-bold text-slate-500 uppercase cursor-pointer select-none">
                                              ¿Es Opcional?
                                            </label>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                          {editQuestionType === "binaria" ? (
                                            <div className="flex items-center gap-4">
                                              <span className="text-xs font-bold text-slate-500 uppercase">Respuesta Esperada:</span>
                                              <div className="flex gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditExpectedAnswer("si")}
                                                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                                    editExpectedAnswer === "si"
                                                      ? "bg-green-600 border-green-600 text-white"
                                                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                  }`}
                                                >
                                                  Sí
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditExpectedAnswer("no")}
                                                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                                    editExpectedAnswer === "no"
                                                      ? "bg-red-600 border-red-600 text-white"
                                                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                  }`}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div />
                                          )}
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => setEditingQuestionId(null)}
                                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                                              title="Cancelar"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => handleSaveQuestion(q.id)}
                                              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                              title="Guardar"
                                            >
                                              <Save className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="text-sm font-semibold text-slate-800 leading-relaxed break-words">
                                              {q.question_text}
                                            </p>
                                            {q.es_opcional && (
                                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                Opcional
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                                              {q.tipo_pregunta === "desarrollo"
                                                ? "Desarrollo (Texto)"
                                                : q.tipo_pregunta === "foto"
                                                ? "Foto (Cámara)"
                                                : "Binaria (Sí/No)"}
                                            </span>

                                            {(!q.tipo_pregunta || q.tipo_pregunta === "binaria") && q.expected_answer && (
                                              <div className="flex items-center gap-1.5">
                                                <span>Respuesta Esperada:</span>
                                                <span
                                                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                                    q.expected_answer === "si"
                                                      ? "bg-green-100 text-green-700"
                                                      : "bg-red-100 text-red-700"
                                                  }`}
                                                >
                                                  {q.expected_answer === "si" ? "Sí" : "No"}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex gap-1 shrink-0">
                                          <button
                                            onClick={() => startEditQuestion(q)}
                                            className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                            title="Editar Pregunta"
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-50 transition-colors"
                                            title="Eliminar Pregunta"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  {/* Filters Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end text-slate-700">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Trabajador</label>
                      <select
                        value={subFilterUserId}
                        onChange={(e) => setSubFilterUserId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="">Todos los trabajadores</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-44">
                      <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Fecha Desde</label>
                      <input
                        type="date"
                        value={subFilterStartDate}
                        onChange={(e) => setSubFilterStartDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <div className="w-full md:w-44">
                      <label className="block text-xs font-bold text-slate-450 uppercase mb-1">Fecha Hasta</label>
                      <input
                        type="date"
                        value={subFilterEndDate}
                        onChange={(e) => setSubFilterEndDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    {(subFilterUserId || subFilterStartDate || subFilterEndDate) && (
                      <button
                        onClick={() => {
                          setSubFilterUserId("");
                          setSubFilterStartDate("");
                          setSubFilterEndDate("");
                        }}
                        className="border border-slate-300 text-slate-600 rounded-lg p-2 hover:bg-slate-50 text-sm font-semibold transition-colors w-full md:w-auto text-center"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Submissions Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loadingSubmissions ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                        <span className="text-sm text-slate-500 font-medium">Cargando registros...</span>
                      </div>
                    ) : filteredSubmissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                        <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">No se encontraron registros</h3>
                        <p className="text-slate-500 mt-1 max-w-sm text-sm">
                          No hay encuestas realizadas para los filtros seleccionados.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="px-6 py-4">Fecha</th>
                              <th className="px-6 py-4">Hora</th>
                              <th className="px-6 py-4">Trabajador</th>
                              <th className="px-6 py-4">Vehículo</th>
                              <th className="px-6 py-4">Cumplimiento</th>
                              <th className="px-6 py-4 text-right">Respuestas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSubmissions.map((sub) => {
                              const totalQ = Object.keys(sub.respuestas || {}).length;
                              const approvedQ = Object.entries(sub.respuestas || {}).filter(([qId, ans]) => {
                                const qObj = checklistQuestions.find(q => q.id === qId);
                                return qObj && qObj.expected_answer === ans;
                              }).length;

                              const isFullyApproved = totalQ > 0 && approvedQ === totalQ;

                              return (
                                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-slate-700 font-mono">
                                    {formatDateString(sub.fecha)}
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-500 font-mono">
                                    {formatTimeString(sub.created_at)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{sub.app_users?.nombre || "Usuario Eliminado"}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold">{sub.app_users?.cargo}</div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700 font-mono">
                                    {sub.vehicle_code}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      isFullyApproved
                                        ? "bg-green-100 text-green-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}>
                                      {isFullyApproved ? "Aprobado" : "Rechazos detectados"} ({approvedQ}/{totalQ})
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedSubmissionForDetail(sub);
                                        setIsSubmissionDetailModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      Ver Respuestas
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 font-sans text-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-800">Buzón de Notificaciones</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Historial de alertas reportadas por los operadores en terreno.
                  </p>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full text-left">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Buscar por Trabajador (Nombre/RUT)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ingrese nombre o RUT..."
                      value={notificationFilterWorker}
                      onChange={(e) => setNotificationFilterWorker(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="w-full md:w-48 text-left">
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">
                    Filtrar por Fecha
                  </label>
                  <input
                    type="date"
                    value={notificationFilterDate}
                    onChange={(e) => setNotificationFilterDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {(notificationFilterWorker || notificationFilterDate) && (
                  <button
                    onClick={() => {
                      setNotificationFilterWorker("");
                      setNotificationFilterDate("");
                    }}
                    className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Panel dividido */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna Izquierda: Listado */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">Alertas Registradas</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.length} total
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
                        Cargando notificaciones...
                      </div>
                    ) : notifications.filter(n => {
                      const matchesWorker = !notificationFilterWorker ||
                        n.driver_name.toLowerCase().includes(notificationFilterWorker.toLowerCase()) ||
                        n.driver_rut.toLowerCase().includes(notificationFilterWorker.toLowerCase());
                      const matchesDate = !notificationFilterDate ||
                        (n.created_at && n.created_at.startsWith(notificationFilterDate));
                      return matchesWorker && matchesDate;
                    }).length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No se encontraron notificaciones.
                      </div>
                    ) : (
                      notifications
                        .filter(n => {
                          const matchesWorker = !notificationFilterWorker ||
                            n.driver_name.toLowerCase().includes(notificationFilterWorker.toLowerCase()) ||
                            n.driver_rut.toLowerCase().includes(notificationFilterWorker.toLowerCase());
                          const matchesDate = !notificationFilterDate ||
                            (n.created_at && n.created_at.startsWith(notificationFilterDate));
                          return matchesWorker && matchesDate;
                        })
                        .map((n) => {
                          const isSelected = selectedNotification?.id === n.id;
                          const dateObj = new Date(n.created_at);
                          const dateStr = dateObj.toLocaleDateString('es-CL');
                          const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div
                              key={n.id}
                              onClick={() => setSelectedNotification(n)}
                              className={`p-4 cursor-pointer transition-colors text-left relative ${
                                isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                              }`}
                            >
                              {/* Indicador de no leído */}
                              {!n.leida && (
                                <span className="absolute left-2.5 top-[18px] flex h-2 w-2 rounded-full bg-red-500" />
                              )}

                              <div className="pl-3">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    {dateStr} - {timeStr}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    n.tipo === "checklist_fallido"
                                      ? "bg-red-100 text-red-800"
                                      : n.tipo === "termino_anticipado"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {n.tipo === "checklist_fallido"
                                      ? "Checklist Falla"
                                      : n.tipo === "termino_anticipado"
                                      ? "Término Ruta"
                                      : "Doc. Vencido"}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-800 text-sm truncate">{n.driver_name}</h4>
                                <p className="text-xs text-slate-500 truncate">RUT: {n.driver_rut}</p>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Columna Derecha: Detalle */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                  {selectedNotification ? (
                    <div className="space-y-6 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              selectedNotification.tipo === "checklist_fallido"
                                ? "bg-red-100 text-red-800"
                                : selectedNotification.tipo === "termino_anticipado"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {selectedNotification.tipo === "checklist_fallido"
                                ? "Checklist Rechazado"
                                : selectedNotification.tipo === "termino_anticipado"
                                ? "Término Anticipado de Ruta"
                                : "Alerta de Documentos Vencidos"}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {new Date(selectedNotification.created_at).toLocaleString('es-CL')}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">{selectedNotification.driver_name}</h3>
                          <p className="text-sm text-slate-500 font-medium">
                            Cargo: {selectedNotification.driver_cargo || "Chofer"} | RUT: {selectedNotification.driver_rut}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleNotificationRead(selectedNotification.id, selectedNotification.leida)}
                            className={`inline-flex items-center gap-1.5 font-bold py-2 px-4 rounded-lg text-xs transition-colors shadow-sm border ${
                              selectedNotification.leida
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                : "bg-blue-600 hover:bg-blue-700 text-white border-transparent"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {selectedNotification.leida ? "Marcar como no leída" : "Marcar como leída"}
                          </button>

                          <button
                            onClick={() => handleInitiateDeleteNotification(selectedNotification)}
                            className="inline-flex items-center gap-1.5 font-bold py-2 px-4 rounded-lg text-xs bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm border border-transparent"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* Información General */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Vehículo Asociado</span>
                          <span className="text-sm font-semibold text-slate-850">
                            {selectedNotification.vehicle_code || "No especificado"}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Faena de Operación</span>
                          <span className="text-sm font-semibold text-slate-850">
                            {selectedNotification.faena_name || "No especificada"}
                          </span>
                        </div>
                      </div>

                      {/* Detalles específicos */}
                      {selectedNotification.tipo === "checklist_fallido" && (
                        <div className="bg-red-50/50 border border-red-200 rounded-xl p-5 space-y-3 text-left">
                          <h4 className="text-sm font-bold text-red-800">Fallas registradas en inspección diaria:</h4>
                          <ul className="list-disc pl-5 text-sm text-red-700 space-y-1.5">
                            {Array.isArray(selectedNotification.details) ? (
                              selectedNotification.details.map((q: string, idx: number) => <li key={idx}>{q}</li>)
                            ) : typeof selectedNotification.details === "string" ? (
                              <li>{selectedNotification.details}</li>
                            ) : (
                              <li>Fallas en el checklist de control</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {selectedNotification.tipo === "termino_anticipado" && (
                        <div className="border border-orange-250 bg-orange-50/20 rounded-xl p-5 space-y-4 text-left">
                          <div>
                            <span className="text-[10px] font-bold text-orange-800 uppercase block mb-1">Motivo Declarado</span>
                            <span className="text-sm font-bold text-slate-850">{selectedNotification.motivo}</span>
                          </div>

                          {selectedNotification.details && typeof selectedNotification.details === "object" && (
                            <>
                              {(selectedNotification.details as any).fechaReporte && (
                                <div>
                                  <span className="text-[10px] font-bold text-orange-800 uppercase block mb-1">Fecha / Hora del Reporte</span>
                                  <span className="text-sm font-semibold text-slate-850">
                                    {new Date((selectedNotification.details as any).fechaReporte).toLocaleString('es-CL')}
                                  </span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-green-700 uppercase block mb-2">
                                    ✅ Puntos Completados ({(selectedNotification.details as any).puntosCompletados?.length || 0})
                                  </span>
                                  {!((selectedNotification.details as any).puntosCompletados) || ((selectedNotification.details as any).puntosCompletados as any[]).length === 0 ? (
                                    <span className="text-xs text-slate-400">Ningún punto completado</span>
                                  ) : (
                                    <ul className="text-xs text-slate-700 space-y-2 max-h-48 overflow-y-auto">
                                      {((selectedNotification.details as any).puntosCompletados as any[]).map((p: any, idx: number) => {
                                        const timeStr = p.completed_at
                                          ? new Date(p.completed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
                                          : 'N/A';
                                        return (
                                          <li key={idx} className="flex flex-col border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                            <span className="font-semibold text-slate-800">[{p.codigo}] {p.nombre}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Marcado a las {timeStr}</span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-slate-200">
                                  <span className="text-[10px] font-bold text-red-700 uppercase block mb-2">
                                    ❌ Puntos Pendientes ({(selectedNotification.details as any).puntosNoCompletados?.length || 0})
                                  </span>
                                  {!((selectedNotification.details as any).puntosNoCompletados) || ((selectedNotification.details as any).puntosNoCompletados as any[]).length === 0 ? (
                                    <span className="text-xs text-slate-400">Todos los puntos completados</span>
                                  ) : (
                                    <ul className="text-xs text-slate-700 space-y-2 max-h-48 overflow-y-auto">
                                      {((selectedNotification.details as any).puntosNoCompletados as any[]).map((p: any, idx: number) => (
                                        <li key={idx} className="flex flex-col border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                          <span className="font-semibold text-red-650">[{p.codigo}] {p.nombre}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          <div>
                            <span className="text-[10px] font-bold text-orange-800 uppercase block mb-1">Observaciones / Comentarios</span>
                            <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-line leading-relaxed">
                              {selectedNotification.observaciones}
                            </p>
                          </div>
                          {selectedNotification.evidencia_url && (
                            <div>
                              <span className="text-[10px] font-bold text-orange-800 uppercase block mb-2">Evidencia Capturada</span>
                              <a href={selectedNotification.evidencia_url} target="_blank" rel="noopener noreferrer" className="inline-block group border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white hover:border-slate-400 transition-colors">
                                <img
                                  src={selectedNotification.evidencia_url}
                                  alt="Evidencia término anticipado"
                                  className="max-h-64 object-cover"
                                />
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedNotification.tipo !== "checklist_fallido" && selectedNotification.tipo !== "termino_anticipado" && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Detalles Adicionales</span>
                          <p className="text-sm text-slate-700 whitespace-pre-line">
                            {typeof selectedNotification.details === "string"
                              ? selectedNotification.details
                              : JSON.stringify(selectedNotification.details, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-center px-4 text-slate-400">
                      <Bell className="h-16 w-16 text-slate-200 mb-4" />
                      <h3 className="text-sm font-bold text-slate-600">Detalle de Alerta</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                        Selecciona cualquier notificación de la lista izquierda para ver su contenido detallado y gestionarla.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (() => {
            // 1. Helper function to normalize day names (removes accents and casing)
            const normalizeDayName = (day: string): string => {
              return (day || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim();
            };

            const dayNames = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

            // 2. Generate the distinct list of days in the evaluated period
            const getPeriodDays = () => {
              const days: { dateStr: string; dayIndex: number; dayName: string }[] = [];
              const today = new Date();
              let start: Date;
              let end: Date;

              if (dashboardDateFrom && dashboardDateTo) {
                const [sY, sM, sD] = dashboardDateFrom.split("-").map(Number);
                const [eY, eM, eD] = dashboardDateTo.split("-").map(Number);
                start = new Date(sY, sM - 1, sD);
                end = new Date(eY, eM - 1, eD);
              } else if (dashboardDateFrom) {
                const [sY, sM, sD] = dashboardDateFrom.split("-").map(Number);
                start = new Date(sY, sM - 1, sD);
                end = new Date(today);
              } else if (dashboardDatePreset === "today") {
                start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              } else if (dashboardDatePreset === "week") {
                const day = today.getDay();
                const diffToMon = (day === 0 ? -6 : 1) - day;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diffToMon);
                start = monday;
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                end = sunday;
              } else if (dashboardDatePreset === "7days") {
                start = new Date(today);
                start.setDate(today.getDate() - 6);
                end = new Date(today);
              } else if (dashboardDatePreset === "month") {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today);
              } else {
                // "all": Default to current week or earliest route up to today
                if (routeRecords.length > 0) {
                  const sorted = routeRecords.map(r => r.fecha_inicio).filter(Boolean).sort();
                  if (sorted.length > 0) {
                    const [fY, fM, fD] = sorted[0].split("-").map(Number);
                    start = new Date(fY, fM - 1, fD);
                    end = new Date(today);
                  } else {
                    start = new Date(today);
                    start.setDate(today.getDate() - 6);
                    end = new Date(today);
                  }
                } else {
                  start = new Date(today);
                  start.setDate(today.getDate() - 6);
                  end = new Date(today);
                }
              }

              const cur = new Date(start);
              while (cur <= end) {
                const y = cur.getFullYear();
                const m = String(cur.getMonth() + 1).padStart(2, "0");
                const d = String(cur.getDate()).padStart(2, "0");
                const dayIdx = cur.getDay();
                days.push({
                  dateStr: `${y}-${m}-${d}`,
                  dayIndex: dayIdx,
                  dayName: dayNames[dayIdx],
                });
                cur.setDate(cur.getDate() + 1);
              }
              return days;
            };

            const periodDays = getPeriodDays();

            // 3. Filter routes according to active dashboard filters
            const filteredDashboardRoutes = routeRecords.filter(r => {
              if (currentAdmin?.tipo_usuario === "cliente" && currentAdmin.faena_asignada) {
                if (r.faena_name !== currentAdmin.faena_asignada) return false;
              } else if (dashboardFaenaFilter) {
                if (r.faena_name !== dashboardFaenaFilter && r.faena_id !== dashboardFaenaFilter) return false;
              }
              if (dashboardDateFrom && r.fecha_inicio < dashboardDateFrom) return false;
              if (dashboardDateTo && r.fecha_inicio > dashboardDateTo) return false;
              return true;
            });

            // 4. Computed Route Status Totals
            const dashTotalRoutes = filteredDashboardRoutes.length;
            const dashCompletedRoutes = filteredDashboardRoutes.filter(r => r.estado === 'Finalizada').length;
            const dashInProgressRoutes = filteredDashboardRoutes.filter(r => r.estado === 'En Proceso').length;
            const dashEarlyTermRoutes = filteredDashboardRoutes.filter(r => r.estado === 'Término Anticipado').length;

            // 5. Active Faenas to Evaluate
            const activeFaenasList = currentAdmin?.tipo_usuario === "cliente" && currentAdmin.faena_asignada
              ? faenas.filter(f => f.nombre === currentAdmin.faena_asignada)
              : (dashboardFaenaFilter ? faenas.filter(f => f.nombre === dashboardFaenaFilter || f.id === dashboardFaenaFilter) : faenas);

            // 6. Calculate Scheduled Points & Actual Completed Points per Faena according to Periodicity
            const weeksInPeriod = Math.max(1, Math.ceil(periodDays.length / 7));

            const faenaStats = activeFaenasList.map(faena => {
              const fPoints = faenaPointsMap[faena.id] || [];
              let fScheduledPoints = 0;
              let dailyCount = 0;
              let weeklyCount = 0;
              let specificCount = 0;

              fPoints.forEach(pt => {
                const periodicity = pt.periodicidad || "diario";
                if (periodicity === "diario") {
                  dailyCount++;
                  fScheduledPoints += periodDays.length;
                } else if (periodicity === "dias_especificos") {
                  specificCount++;
                  const ptDays = (pt.dias_semana || []).map(normalizeDayName);
                  const matches = periodDays.filter(pd => {
                    const normDay = normalizeDayName(pd.dayName);
                    return ptDays.some(d => d === normDay || normDay.startsWith(d) || d.startsWith(normDay));
                  }).length;
                  fScheduledPoints += matches;
                } else if (periodicity === "semanal") {
                  weeklyCount++;
                  fScheduledPoints += (pt.frecuencia_semanal || 1) * weeksInPeriod;
                }
              });

              // Completed points in actual route executions for this faena
              const fRoutes = filteredDashboardRoutes.filter(r => r.faena_id === faena.id || r.faena_name === faena.nombre);
              let fCompletedPoints = 0;
              fRoutes.forEach(r => {
                const pts = r.puntos_detalle || [];
                fCompletedPoints += pts.filter(p => p.completado).length;
              });

              // Fallback: If no points configured in faenaPointsMap but routes were run, count route points
              if (fScheduledPoints === 0 && fRoutes.length > 0) {
                let sumPts = 0;
                fRoutes.forEach(r => {
                  sumPts += (r.puntos_detalle || []).length;
                });
                fScheduledPoints = sumPts;
              }

              // Compliance rate: (completed / scheduled) * 100
              const fCompliance = fScheduledPoints > 0
                ? Math.min(100, Math.round((fCompletedPoints / fScheduledPoints) * 100))
                : (fCompletedPoints > 0 ? 100 : 0);

              const fIncompletePoints = Math.max(0, fScheduledPoints - fCompletedPoints);

              return {
                faena,
                routesCount: fRoutes.length,
                scheduledPoints: fScheduledPoints,
                completedPoints: fCompletedPoints,
                incompletePoints: fIncompletePoints,
                compliance: fCompliance,
                dailyCount,
                weeklyCount,
                specificCount,
                totalConfigured: fPoints.length,
                routes: fRoutes,
              };
            });

            // 7. Global KPI Totals derived from Schedule
            let dashTotalScheduledPoints = 0;
            let dashCompletedPoints = 0;
            let dashTotalConfiguredPoints = 0;

            faenaStats.forEach(stat => {
              dashTotalScheduledPoints += stat.scheduledPoints;
              dashCompletedPoints += stat.completedPoints;
              dashTotalConfiguredPoints += stat.totalConfigured;
            });

            const dashIncompletePoints = Math.max(0, dashTotalScheduledPoints - dashCompletedPoints);
            const dashComplianceRate = dashTotalScheduledPoints > 0
              ? Math.min(100, Math.round((dashCompletedPoints / dashTotalScheduledPoints) * 100))
              : (dashCompletedPoints > 0 ? 100 : 0);

            // 8. Preset Handlers
            const applyDatePreset = (preset: "today" | "week" | "7days" | "month" | "all") => {
              setDashboardDatePreset(preset);
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              if (preset === "today") {
                setDashboardDateFrom(todayStr);
                setDashboardDateTo(todayStr);
              } else if (preset === "week") {
                const day = today.getDay();
                const diffToMon = (day === 0 ? -6 : 1) - day;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diffToMon);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                const monStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
                const sunStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, "0")}-${String(sunday.getDate()).padStart(2, "0")}`;
                setDashboardDateFrom(monStr);
                setDashboardDateTo(sunStr);
              } else if (preset === "7days") {
                const past7 = new Date();
                past7.setDate(past7.getDate() - 6);
                const past7Str = `${past7.getFullYear()}-${String(past7.getMonth() + 1).padStart(2, "0")}-${String(past7.getDate()).padStart(2, "0")}`;
                setDashboardDateFrom(past7Str);
                setDashboardDateTo(todayStr);
              } else if (preset === "month") {
                const firstDayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
                setDashboardDateFrom(firstDayStr);
                setDashboardDateTo(todayStr);
              } else if (preset === "all") {
                setDashboardDateFrom("");
                setDashboardDateTo("");
              }
            };

            const clearFilters = () => {
              setDashboardDateFrom("");
              setDashboardDateTo("");
              setDashboardDatePreset("all");
              if (currentAdmin?.tipo_usuario !== "cliente") {
                setDashboardFaenaFilter("");
              }
            };

            const isFiltered = !!dashboardDateFrom || !!dashboardDateTo || (!!dashboardFaenaFilter && currentAdmin?.tipo_usuario !== "cliente") || dashboardDatePreset !== "all";

            return (
              <div className="space-y-6 text-slate-700 font-sans">
                {/* Dashboard Header with Welcome & Filter Bar */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-slate-800">
                          {currentAdmin?.tipo_usuario === "cliente" && currentAdmin.faena_asignada
                            ? `Panel de Control — Faena ${currentAdmin.faena_asignada}`
                            : "Dashboard Operativo y Control de Cumplimiento"}
                        </h2>
                        {currentAdmin?.tipo_usuario === "cliente" && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
                            Vista Cliente
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {currentAdmin?.tipo_usuario === "cliente" && currentAdmin.faena_asignada
                          ? `Monitoreo en tiempo real de rutas, puntos completados y evidencias de la faena ${currentAdmin.faena_asignada}.`
                          : "Monitoreo integral de cumplimiento por faena, control de puntos completados y reportes de ruta."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchRouteRecords}
                        disabled={loadingRouteRecords}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        title="Actualizar datos desde la base de datos"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingRouteRecords ? 'animate-spin text-blue-600' : ''}`} />
                        Actualizar
                      </button>
                    </div>
                  </div>

                  {/* Interactive Filters Panel */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-blue-500" />
                        Filtros de Período y Faena
                      </span>
                      {isFiltered && (
                        <button
                          onClick={clearFilters}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Limpiar filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Date Presets Quick Pills */}
                      <div className="lg:col-span-2 flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <button
                          onClick={() => applyDatePreset("today")}
                          className={`flex-1 min-w-[55px] py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            dashboardDatePreset === "today"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Hoy
                        </button>
                        <button
                          onClick={() => applyDatePreset("week")}
                          className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            dashboardDatePreset === "week"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Esta Semana
                        </button>
                        <button
                          onClick={() => applyDatePreset("7days")}
                          className={`flex-1 min-w-[85px] py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            dashboardDatePreset === "7days"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Últimos 7 días
                        </button>
                        <button
                          onClick={() => applyDatePreset("month")}
                          className={`flex-1 min-w-[75px] py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            dashboardDatePreset === "month"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Este Mes
                        </button>
                        <button
                          onClick={() => applyDatePreset("all")}
                          className={`flex-1 min-w-[65px] py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                            dashboardDatePreset === "all"
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Histórico
                        </button>
                      </div>

                      {/* Date Range Inputs */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Desde</label>
                          <input
                            type="date"
                            value={dashboardDateFrom}
                            onChange={(e) => {
                              setDashboardDateFrom(e.target.value);
                              setDashboardDatePreset("custom");
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Hasta</label>
                          <input
                            type="date"
                            value={dashboardDateTo}
                            onChange={(e) => {
                              setDashboardDateTo(e.target.value);
                              setDashboardDatePreset("custom");
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Faena Dropdown Filter */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Filtrar por Faena</label>
                        {currentAdmin?.tipo_usuario === "cliente" && currentAdmin.faena_asignada ? (
                          <div className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 truncate">
                            {currentAdmin.faena_asignada} (Asignada)
                          </div>
                        ) : (
                          <select
                            value={dashboardFaenaFilter}
                            onChange={(e) => setDashboardFaenaFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">Todas las Faenas ({faenas.length})</option>
                            {faenas.map((f) => (
                              <option key={f.id} value={f.nombre}>
                                {f.nombre}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Stat Cards Group (Dynamic & Filtered) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Tasa Cumplimiento General */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumplimiento Global</h3>
                      <p className="text-3xl font-black text-slate-800 mt-2">
                        {dashComplianceRate}%
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 px-2 py-0.5 rounded-lg ${
                        dashComplianceRate >= 90 ? 'bg-emerald-50 text-emerald-700' : dashComplianceRate >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <TrendingUp className="h-3 w-3" />
                        {dashComplianceRate >= 90 ? 'Excelente rendimiento' : dashComplianceRate >= 70 ? 'Rendimiento aceptable' : 'Bajo cumplimiento'}
                      </span>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Activity className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Puntos Completados vs Incompletos según Periodicidad */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puntos Programados</h3>
                      <p className="text-2xl font-black text-slate-800 mt-2">
                        <span className="text-emerald-600">{dashCompletedPoints}</span> / {dashTotalScheduledPoints}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-bold">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {dashCompletedPoints} completados
                        </span>
                        {dashIncompletePoints > 0 ? (
                          <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                            {dashIncompletePoints} pendientes
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            100% al día
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Rutas en el período */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rutas en Período</h3>
                      <p className="text-3xl font-black text-slate-800 mt-2">{dashTotalRoutes}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-slate-500">
                        <span className="text-emerald-600 font-bold">{dashCompletedRoutes} Fin.</span>
                        <span>•</span>
                        <span className="text-blue-600 font-bold">{dashInProgressRoutes} En curso</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Truck className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Términos Anticipados */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Términos Anticipados</h3>
                      <p className="text-3xl font-black text-red-600 mt-2">{dashEarlyTermRoutes}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 mt-2 bg-red-50 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="h-3 w-3" />
                        {dashEarlyTermRoutes === 0 ? 'Sin incidencias' : 'Rutas interrumpidas'}
                      </span>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <XCircle className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Desglose Detallado por Faena: Puntos Completados vs Incompletos */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Desempeño y Control de Puntos por Faena
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Balance detallado de puntos programados, completados y pendientes por faena en el período seleccionado.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                      {faenaStats.length} {faenaStats.length === 1 ? 'Faena evaluada' : 'Faenas evaluadas'}
                    </span>
                  </div>

                  {faenaStats.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No hay faenas registradas con los criterios seleccionados.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {faenaStats.map(({ faena, routesCount, scheduledPoints, completedPoints, incompletePoints, compliance, dailyCount, weeklyCount, specificCount, totalConfigured }) => (
                        <div
                          key={faena.id}
                          className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-blue-300 transition-all shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-800 text-sm truncate" title={faena.nombre}>
                              {faena.nombre}
                            </h4>
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                compliance >= 90
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : compliance >= 70
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {compliance}% Cumplimiento
                            </span>
                          </div>

                          {/* Periodicity Breakdown Badge */}
                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            <span className="font-semibold text-slate-400">Plan ({totalConfigured} pts):</span>
                            {dailyCount > 0 && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                                {dailyCount} Diarios
                              </span>
                            )}
                            {weeklyCount > 0 && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold border border-purple-200">
                                {weeklyCount} Semanal
                              </span>
                            )}
                            {specificCount > 0 && (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                                {specificCount} Días Esp.
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${compliance}%` }}
                              ></div>
                              {incompletePoints > 0 && (
                                <div
                                  className="bg-red-400 h-full transition-all duration-500"
                                  style={{ width: `${100 - compliance}%` }}
                                ></div>
                              )}
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                              <span>Progreso según periodicidad</span>
                              <span>{completedPoints} de {scheduledPoints} programados</span>
                            </div>
                          </div>

                          {/* Stat Grid: 4 columns */}
                          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/60 text-center">
                            <div className="bg-white p-2 rounded-lg border border-slate-150">
                              <div className="text-[9px] uppercase font-bold text-slate-400">Prog.</div>
                              <div className="text-xs font-black text-slate-800 mt-0.5">{scheduledPoints}</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-150">
                              <div className="text-[9px] uppercase font-bold text-emerald-600">Listos</div>
                              <div className="text-xs font-black text-emerald-700 mt-0.5">{completedPoints}</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-150">
                              <div className="text-[9px] uppercase font-bold text-red-500">Pend.</div>
                              <div className="text-xs font-black text-red-600 mt-0.5">{incompletePoints}</div>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-150">
                              <div className="text-[9px] uppercase font-bold text-purple-600">Rutas</div>
                              <div className="text-xs font-black text-purple-700 mt-0.5">{routesCount}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial de Rutas y Acceso Directo a Evidencias / Reportes */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Rutas Ejecutadas y Acceso a Evidencias
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Selecciona cualquier jornada de ruta para abrir su reporte oficial con evidencias fotográficas, checklist y GPS.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                      {filteredDashboardRoutes.length} {filteredDashboardRoutes.length === 1 ? 'Ruta encontrada' : 'Rutas encontradas'}
                    </span>
                  </div>

                  {filteredDashboardRoutes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm font-medium">
                      No hay registros de ruta que coincidan con los filtros aplicados.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Fecha y Hora</th>
                            <th className="px-4 py-3">Faena</th>
                            <th className="px-4 py-3">Operador / Ayudante</th>
                            <th className="px-4 py-3">Vehículo</th>
                            <th className="px-4 py-3">Progreso de Puntos</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Reporte / Evidencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredDashboardRoutes.slice(0, 15).map((route) => {
                            const pts = route.puntos_detalle || [];
                            const completedCount = pts.filter(p => p.completado).length;
                            const totalCount = pts.length;
                            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                            return (
                              <tr key={route.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-700">
                                  <div>{formatDateString(route.fecha_inicio)}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {route.hora_inicio} {route.hora_fin && route.hora_fin !== '-' ? `→ ${route.hora_fin}` : ''}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {route.faena_name}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-700">{route.driver_name || 'Operador'}</div>
                                  {route.ayudante_nombre && (
                                    <div className="text-[10px] text-indigo-600 font-medium">
                                      Ayudante: {route.ayudante_nombre}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono font-bold text-slate-600">
                                  {route.vehicle_code}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                      <div
                                        className="bg-emerald-500 h-full rounded-full"
                                        style={{ width: `${pct}%` }}
                                      ></div>
                                    </div>
                                    <span className="font-bold text-slate-700 font-mono">
                                      {completedCount}/{totalCount} ({pct}%)
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                      route.estado === 'Finalizada'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : route.estado === 'Término Anticipado'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {route.estado || 'En Proceso'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setSelectedRouteForEvidenceModal(route)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-blue-200"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Ver Evidencias
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {activeTab === "route_records" && (
            <div className="space-y-6 text-slate-700 font-sans">
              {/* Header and Refresh Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Registros de Inicio y Término de Ruta</h2>
                  <p className="text-sm text-slate-500 mt-1">Monitoreo histórico y en tiempo real del progreso de jornadas de rutas.</p>
                </div>
                <button
                  onClick={fetchRouteRecords}
                  disabled={loadingRouteRecords}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loadingRouteRecords ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                  Actualizar Registros
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Filtros de Búsqueda</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                  {/* Filter by Faena */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Faena</label>
                    <select
                      value={routeFilterFaena}
                      onChange={(e) => setRouteFilterFaena(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Todas las Faenas</option>
                      {faenas.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Operator */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operador (Nombre o RUT)</label>
                    <input
                      type="text"
                      placeholder="Buscar operador..."
                      value={routeFilterDriver}
                      onChange={(e) => setRouteFilterDriver(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Filter by Vehicle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehículo (Patente/Código)</label>
                    <input
                      type="text"
                      placeholder="Buscar vehículo..."
                      value={routeFilterVehicle}
                      onChange={(e) => setRouteFilterVehicle(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Filter by Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                    <select
                      value={routeFilterStatus}
                      onChange={(e) => setRouteFilterStatus(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Todos los Estados</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Finalizada">Finalizadas</option>
                      <option value="Término Anticipado">Términos Anticipados</option>
                    </select>
                  </div>

                  {/* Filter by Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={routeFilterDate}
                      onChange={(e) => setRouteFilterDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setRouteFilterFaena("");
                      setRouteFilterDriver("");
                      setRouteFilterVehicle("");
                      setRouteFilterStatus("");
                      setRouteFilterDate("");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              </div>

              {/* Records List/Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loadingRouteRecords ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <span className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></span>
                    <p className="text-sm font-semibold">Cargando registros de rutas...</p>
                  </div>
                ) : filteredRouteRecords.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <Clock className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-sm font-bold text-slate-600">Sin Registros</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      No se encontraron registros de rutas que coincidan con los filtros aplicados.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                          <th className="px-6 py-3.5">Faena</th>
                          <th className="px-6 py-3.5">Operador</th>
                          <th className="px-6 py-3.5">Vehículo</th>
                          <th className="px-6 py-3.5">Inicio Ruta</th>
                          <th className="px-6 py-3.5">GPS Inicio</th>
                          <th className="px-6 py-3.5">Fin Ruta</th>
                          <th className="px-6 py-3.5">Cumplimiento / Progreso</th>
                          <th className="px-6 py-3.5">Estado</th>
                          <th className="px-6 py-3.5 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredRouteRecords.map((record) => {
                          const isEnProceso = record.estado === "En Proceso";
                          const isFinalizada = record.estado === "Finalizada";
                          const isEarlyTerm = record.estado === "Término Anticipado";

                          return (
                            <tr 
                              key={record.id} 
                              onClick={() => setSelectedRouteForModal(record)}
                              className="hover:bg-slate-100/50 transition-colors cursor-pointer"
                            >
                              {/* Faena */}
                              <td className="px-6 py-4 font-semibold text-slate-800">
                                {record.faena_name}
                              </td>

                              {/* Operador */}
                              <td className="px-6 py-4">
                                <div className="font-semibold">{record.driver_name}</div>
                                <div className="text-slate-400 text-xs mt-0.5">{record.driver_rut}</div>
                                {record.ayudante_nombre && (
                                  <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-medium">
                                    <span className="font-bold">Ayd:</span> {record.ayudante_nombre}
                                  </div>
                                )}
                              </td>

                              {/* Vehículo */}
                              <td className="px-6 py-4 font-mono font-medium text-slate-600">
                                {record.vehicle_code}
                              </td>

                              {/* Inicio Ruta */}
                              <td className="px-6 py-4">
                                <div className="font-semibold">
                                  {record.fecha_inicio ? new Date(record.fecha_inicio + "T00:00:00").toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                                </div>
                                <div className="text-slate-400 text-xs mt-0.5">{record.hora_inicio}</div>
                              </td>

                              {/* GPS Inicio */}
                              <td className="px-6 py-4">
                                {record.latitud_inicio && record.longitud_inicio ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPointForMap({
                                        id: record.id,
                                        faena_id: record.faena_id,
                                        codigo: `Inicio Ruta: ${record.faena_name} (${record.driver_name})`,
                                        latitude: record.latitud_inicio!,
                                        longitude: record.longitud_inicio!,
                                      });
                                      setIsPointMapModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors group"
                                    title="Ver punto de inicio GPS en mapa"
                                  >
                                    <MapPin className="h-3.5 w-3.5 text-blue-600 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="font-mono text-[11px]">
                                      {record.latitud_inicio.toFixed(4)}, {record.longitud_inicio.toFixed(4)}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs italic">Sin GPS</span>
                                )}
                              </td>

                              {/* Fin Ruta */}
                              <td className="px-6 py-4">
                                {isEnProceso ? (
                                  <span className="text-slate-400 text-xs flex items-center gap-1.5 font-medium">
                                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping"></span>
                                    En proceso...
                                  </span>
                                ) : (
                                  <span className="font-semibold text-slate-700">
                                    {record.hora_fin}
                                  </span>
                                )}
                              </td>

                              {/* Cumplimiento / Progreso */}
                              <td className="px-6 py-4 min-w-[150px]">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-xs shrink-0 text-slate-600">
                                    {record.progreso_puntos} ({record.progreso_porcentaje}%)
                                  </span>
                                  <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shrink-0">
                                    <div 
                                      className={`h-full rounded-full ${
                                        isFinalizada ? 'bg-emerald-500' : isEarlyTerm ? 'bg-red-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${record.progreso_porcentaje}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>

                              {/* Estado */}
                              <td className="px-6 py-4">
                                {isEnProceso && (
                                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-100">
                                    En Proceso
                                  </span>
                                )}
                                {isFinalizada && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                                    Finalizada
                                  </span>
                                )}
                                {isEarlyTerm && (
                                  <span 
                                    className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold border border-red-100 cursor-help"
                                    title={`Motivo: ${record.motivo_termino}`}
                                  >
                                    T. Anticipado
                                  </span>
                                )}
                              </td>

                              {/* Acciones */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRouteForModal(record);
                                    }}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                                    title="Ver detalle de puntos"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteRouteRecord(record.id);
                                    }}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Eliminar registro de ruta"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Selected Route Record Points Detail Modal */}
              {selectedRouteForModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
                    {/* Modal Header */}
                    <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg">Detalle de Puntos de Control</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Faena: {selectedRouteForModal.faena_name}</p>
                      </div>
                      <button
                        onClick={() => setSelectedRouteForModal(null)}
                        className="text-slate-400 hover:text-white text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {/* Modal Content */}
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-slate-700">
                      {/* Route Summary Row */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operador</span>
                          <span className="font-bold text-slate-800">{selectedRouteForModal.driver_name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ayudante</span>
                          <span className="font-bold text-purple-700">{selectedRouteForModal.ayudante_nombre || "Sin Asignar"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehículo</span>
                          <span className="font-bold text-slate-800 font-mono">{selectedRouteForModal.vehicle_code}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha / Hora Inicio</span>
                          <span className="font-semibold text-slate-800">
                            {selectedRouteForModal.fecha_inicio ? new Date(selectedRouteForModal.fecha_inicio + "T00:00:00").toLocaleDateString('es-CL') : "-"} {selectedRouteForModal.hora_inicio}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">GPS Inicio</span>
                          {selectedRouteForModal.latitud_inicio && selectedRouteForModal.longitud_inicio ? (
                            <button
                              onClick={() => {
                                setSelectedPointForMap({
                                  id: selectedRouteForModal.id,
                                  faena_id: selectedRouteForModal.faena_id,
                                  codigo: `Inicio Ruta: ${selectedRouteForModal.faena_name} (${selectedRouteForModal.driver_name})`,
                                  latitude: selectedRouteForModal.latitud_inicio!,
                                  longitude: selectedRouteForModal.longitud_inicio!,
                                });
                                setIsPointMapModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline font-mono text-[11px] font-bold"
                              title="Ver ubicación GPS de inicio"
                            >
                              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                              {selectedRouteForModal.latitud_inicio.toFixed(4)}, {selectedRouteForModal.longitud_inicio.toFixed(4)}
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Sin GPS</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estado de Ruta</span>
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            selectedRouteForModal.estado === "Finalizada" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            selectedRouteForModal.estado === "Término Anticipado" ? "bg-red-50 text-red-700 border border-red-100" :
                            "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {selectedRouteForModal.estado}
                          </span>
                        </div>
                      </div>

                      {selectedRouteForModal.estado === "Término Anticipado" && selectedRouteForModal.motivo_termino && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex flex-col gap-1">
                          <span className="font-bold uppercase text-[9px] tracking-wider">Motivo de Término Anticipado:</span>
                          <span className="italic">"{selectedRouteForModal.motivo_termino}"</span>
                        </div>
                      )}

                      {/* Points List */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-1.5">Puntos de Control Configurados</h4>
                        {!selectedRouteForModal.puntos_detalle || selectedRouteForModal.puntos_detalle.length === 0 ? (
                          <p className="text-center py-6 text-slate-400 text-xs italic">Esta faena no tiene puntos de control configurados.</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedRouteForModal.puntos_detalle.map((pt, idx) => (
                              <div 
                                key={pt.id} 
                                className={`flex items-center justify-between p-3.5 rounded-lg border text-xs transition-colors ${
                                  pt.completado ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-100'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <span className="text-slate-400 font-mono text-xs">{idx + 1}.</span>
                                    {pt.codigo}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedPointForMap({
                                        id: pt.id,
                                        faena_id: selectedRouteForModal.faena_id,
                                        codigo: pt.codigo,
                                        latitude: pt.latitude,
                                        longitude: pt.longitude,
                                      });
                                      setIsPointMapModalOpen(true);
                                    }}
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-mono"
                                    title="Ver punto en mapa"
                                  >
                                    <MapPin className="h-3 w-3 text-blue-500" />
                                    {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                                  </button>
                                </div>

                                <div className="flex flex-col items-end gap-1.5">
                                  {pt.completado ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px]">
                                        <Check className="h-3 w-3" /> Completado
                                      </span>
                                      {pt.fecha_completado && (
                                        <span className="text-[9px] text-slate-400 font-medium">
                                          {new Date(pt.fecha_completado).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold text-[10px]">
                                      <Clock className="h-3 w-3" /> Pendiente
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
                      <button
                        onClick={() => handleDeleteRouteRecord(selectedRouteForModal.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold border border-red-200 transition-colors shadow-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Registro de Ruta
                      </button>
                      <button
                        onClick={() => setSelectedRouteForModal(null)}
                        className="rounded-lg border border-slate-300 bg-white py-2 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nuevo Usuario</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-slate-700 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RUT *</label>
                  <input
                    type="text"
                    required
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="12.345.678-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Chofer / Operador"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Usuario / Rol</label>
                  <select
                    value={formData.tipo_usuario}
                    onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="chofer">Chofer (Acceso APK Móvil)</option>
                    <option value="ayudante">Ayudante (Sin Acceso Digital)</option>
                    <option value="admin">Administrador (Acceso Total)</option>
                    <option value="cliente">Cliente (Solo Dashboard Web)</option>
                  </select>
                </div>
              </div>

              {formData.tipo_usuario === "cliente" && (
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">
                    Faena Asignada al Cliente *
                  </label>
                  <select
                    required
                    value={formData.faena_asignada}
                    onChange={(e) => setFormData({ ...formData, faena_asignada: e.target.value })}
                    className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="">Seleccione faena asignada...</option>
                    {faenas.map((f) => (
                      <option key={f.id || f.nombre} value={f.nombre}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">Este cliente solo podrá visualizar las estadísticas de esta faena.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="jperez"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                
                {formData.tipo_usuario === "admin" && (
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="create-recibe-notificaciones"
                      checked={formData.recibe_notificaciones}
                      onChange={(e) => setFormData({ ...formData, recibe_notificaciones: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="create-recibe-notificaciones" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                      Recibe Notificaciones
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingForm ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Modificar Usuario</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4 text-slate-700 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RUT *</label>
                  <input
                    type="text"
                    required
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Usuario / Rol</label>
                  <select
                    value={formData.tipo_usuario}
                    onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="chofer">Chofer (Acceso APK Móvil)</option>
                    <option value="ayudante">Ayudante (Sin Acceso Digital)</option>
                    <option value="admin">Administrador (Acceso Total)</option>
                    <option value="cliente">Cliente (Solo Dashboard Web)</option>
                  </select>
                </div>
              </div>

              {formData.tipo_usuario === "cliente" && (
                <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                  <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">
                    Faena Asignada al Cliente *
                  </label>
                  <select
                    required
                    value={formData.faena_asignada}
                    onChange={(e) => setFormData({ ...formData, faena_asignada: e.target.value })}
                    className="w-full border border-emerald-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="">Seleccione faena asignada...</option>
                    {faenas.map((f) => (
                      <option key={f.id || f.nombre} value={f.nombre}>
                        {f.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-emerald-700 mt-1">Este cliente solo podrá visualizar las estadísticas de esta faena.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="usuario@empresa.com"
                  />
                </div>
                
                {formData.tipo_usuario === "admin" && (
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="edit-recibe-notificaciones"
                      checked={formData.recibe_notificaciones}
                      onChange={(e) => setFormData({ ...formData, recibe_notificaciones: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <label htmlFor="edit-recibe-notificaciones" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                      Recibe Notificaciones
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL de Documento (Opcional)</label>
                <input
                  type="url"
                  value={formData.documento_url}
                  onChange={(e) => setFormData({ ...formData, documento_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="https://ejemplo.com/documento.pdf"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingForm ? "Guardando..." : "Modificar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE VEHICLE MODAL */}
      {isVehicleCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nuevo Vehículo</h3>
              <button
                onClick={() => setIsVehicleCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="p-6 space-y-4 text-slate-700">
              {vehicleFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{vehicleFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.codigo}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, codigo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none uppercase"
                    placeholder="Ej: V-101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patente *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.patente}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, patente: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none uppercase"
                    placeholder="Ej: ABCD-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Vehículo *</label>
                <select
                  value={vehicleFormData.tipo_vehiculo}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, tipo_vehiculo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="Camioneta 4x4">Camioneta 4x4</option>
                  <option value="Camión Aljibe">Camión Aljibe</option>
                  <option value="Camión Tolva">Camión Tolva</option>
                  <option value="Camión Pluma">Camión Pluma</option>
                  <option value="Bus">Bus</option>
                  <option value="Minibus">Minibus</option>
                  <option value="Furgón">Furgón</option>
                  <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.marca}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, marca: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Toyota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.modelo}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, modelo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Hilux 2.8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Año *</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max="2035"
                    value={vehicleFormData.anio}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, anio: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado</label>
                  <select
                    value={vehicleFormData.habilitado ? "true" : "false"}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, habilitado: e.target.value === "true" })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleCreateModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVehicleForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingVehicleForm ? "Guardando..." : "Crear Vehículo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {isVehicleEditModalOpen && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Modificar Vehículo ({selectedVehicle.codigo})</h3>
              <button
                onClick={() => setIsVehicleEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditVehicle} className="p-6 space-y-4 text-slate-700">
              {vehicleFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{vehicleFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.codigo}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, codigo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patente *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.patente}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, patente: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Vehículo *</label>
                <select
                  value={vehicleFormData.tipo_vehiculo}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, tipo_vehiculo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="Camioneta 4x4">Camioneta 4x4</option>
                  <option value="Camión Aljibe">Camión Aljibe</option>
                  <option value="Camión Tolva">Camión Tolva</option>
                  <option value="Camión Pluma">Camión Pluma</option>
                  <option value="Bus">Bus</option>
                  <option value="Minibus">Minibus</option>
                  <option value="Furgón">Furgón</option>
                  <option value="Maquinaria Pesada">Maquinaria Pesada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.marca}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, marca: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vehicleFormData.modelo}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, modelo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Año *</label>
                  <input
                    type="number"
                    required
                    min="1990"
                    max="2035"
                    value={vehicleFormData.anio}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, anio: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estado</label>
                  <select
                    value={vehicleFormData.habilitado ? "true" : "false"}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, habilitado: e.target.value === "true" })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleEditModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVehicleForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingVehicleForm ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FAENA MODAL */}
      {isFaenaCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nueva Faena</h3>
              <button
                onClick={() => setIsFaenaCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateFaena} className="p-6 space-y-4 text-slate-700">
              {faenaFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{faenaFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Faena *</label>
                <input
                  type="text"
                  required
                  value={faenaFormData.nombre}
                  onChange={(e) => setFaenaFormData({ ...faenaFormData, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Minera Pelambres"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inicio de Contrato *</label>
                  <input
                    type="date"
                    required
                    value={faenaFormData.fecha_inicio_contrato}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, fecha_inicio_contrato: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fin de Contrato *</label>
                  <input
                    type="date"
                    required
                    value={faenaFormData.fecha_fin_contrato}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, fecha_fin_contrato: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Punto Geográfico de Inicio / Término de Ruta */}
              <div className="space-y-3 pt-3 border-t border-slate-150">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Punto Geográfico de Inicio / Final de Ruta</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre o Referencia del Acceso</label>
                  <input
                    type="text"
                    value={faenaFormData.direccion_inicio}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, direccion_inicio: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Garita Principal / Acceso Km 12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Latitud GPS *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={faenaFormData.latitud_inicio}
                      onChange={(e) => setFaenaFormData({ ...faenaFormData, latitud_inicio: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none font-mono"
                      placeholder="-22.4542"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Longitud GPS *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={faenaFormData.longitud_inicio}
                      onChange={(e) => setFaenaFormData({ ...faenaFormData, longitud_inicio: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none font-mono"
                      placeholder="-68.9294"
                    />
                  </div>
                </div>
                <div>
                  <LocationPickerMap
                    latitude={faenaFormData.latitud_inicio}
                    longitude={faenaFormData.longitud_inicio}
                    onChange={(lat, lng) =>
                      setFaenaFormData((prev) => ({
                        ...prev,
                        latitud_inicio: lat,
                        longitud_inicio: lng,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaenaCreateModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFaenaForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingFaenaForm ? "Guardando..." : "Crear Faena"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FAENA MODAL */}
      {isFaenaEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Modificar Faena</h3>
              <button
                onClick={() => setIsFaenaEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditFaena} className="p-6 space-y-4 text-slate-700">
              {faenaFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{faenaFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Faena *</label>
                <input
                  type="text"
                  required
                  value={faenaFormData.nombre}
                  onChange={(e) => setFaenaFormData({ ...faenaFormData, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inicio de Contrato *</label>
                  <input
                    type="date"
                    required
                    value={faenaFormData.fecha_inicio_contrato}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, fecha_inicio_contrato: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fin de Contrato *</label>
                  <input
                    type="date"
                    required
                    value={faenaFormData.fecha_fin_contrato}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, fecha_fin_contrato: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Punto Geográfico de Inicio / Término de Ruta */}
              <div className="space-y-3 pt-3 border-t border-slate-150">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>Punto Geográfico de Inicio / Final de Ruta</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre o Referencia del Acceso</label>
                  <input
                    type="text"
                    value={faenaFormData.direccion_inicio}
                    onChange={(e) => setFaenaFormData({ ...faenaFormData, direccion_inicio: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Ej: Garita Principal / Acceso Km 12"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Latitud GPS *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={faenaFormData.latitud_inicio}
                      onChange={(e) => setFaenaFormData({ ...faenaFormData, latitud_inicio: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none font-mono"
                      placeholder="-22.4542"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Longitud GPS *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={faenaFormData.longitud_inicio}
                      onChange={(e) => setFaenaFormData({ ...faenaFormData, longitud_inicio: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none font-mono"
                      placeholder="-68.9294"
                    />
                  </div>
                </div>
                <div>
                  <LocationPickerMap
                    latitude={faenaFormData.latitud_inicio}
                    longitude={faenaFormData.longitud_inicio}
                    onChange={(lat, lng) =>
                      setFaenaFormData((prev) => ({
                        ...prev,
                        latitud_inicio: lat,
                        longitud_inicio: lng,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFaenaEditModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFaenaForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingFaenaForm ? "Guardando..." : "Modificar Faena"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CHECKLIST QUESTION MODAL */}
      {isAddQuestionModalOpen && selectedSectionForNewQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nueva Pregunta</h3>
              <button
                onClick={() => setIsAddQuestionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4 text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs">
                <span className="font-bold text-slate-450 uppercase block">Sección Destino:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {checklistSections.find(s => s.id === selectedSectionForNewQuestion)?.titulo || selectedSectionForNewQuestion}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Texto de la Pregunta *</label>
                <textarea
                  required
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: ¿Cuenta con extintor vigente en cabina?"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Pregunta *</label>
                  <select
                    value={newQuestionType}
                    onChange={(e) => setNewQuestionType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="binaria">Binaria (Sí/No)</option>
                    <option value="desarrollo">Desarrollo (Texto)</option>
                    <option value="foto">Foto (Cámara)</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="new-question-optional"
                    checked={newQuestionIsOptional}
                    onChange={(e) => setNewQuestionIsOptional(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <label htmlFor="new-question-optional" className="text-xs font-bold text-slate-700 uppercase cursor-pointer select-none">
                    ¿Es Opcional?
                  </label>
                </div>
              </div>

              {newQuestionType === "binaria" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Respuesta Esperada para Aprobar *</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setNewQuestionExpectedAnswer("si")}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        newQuestionExpectedAnswer === "si"
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionExpectedAnswer("no")}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${
                        newQuestionExpectedAnswer === "no"
                          ? "bg-red-600 border-red-600 text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddQuestionModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Agregar Pregunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OR EDIT FAENA POINT MODAL */}
      {isPointModalOpen && selectedFaenaForPoint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {selectedPoint ? "Modificar Punto de Ruta" : "Agregar Punto de Ruta"}
              </h3>
              <button
                onClick={() => setIsPointModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdatePoint} className="p-6 space-y-4 text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs">
                <span className="font-bold text-slate-450 uppercase block">Faena de Destino:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedFaenaForPoint.nombre}</span>
              </div>

              {pointFormError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pointFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre / Código del Punto *</label>
                <input
                  type="text"
                  required
                  value={pointFormData.codigo}
                  onChange={(e) => setPointFormData({ ...pointFormData, codigo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ej: Punto A - Acceso Principal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitud GPS *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={pointFormData.latitude}
                    onChange={(e) => setPointFormData({ ...pointFormData, latitude: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="-22.9036"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitud GPS *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={pointFormData.longitude}
                    onChange={(e) => setPointFormData({ ...pointFormData, longitude: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="-68.1998"
                  />
                </div>
              </div>

              {/* Map Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">Ubicación en el Mapa</label>
                <LocationPickerMap
                  latitude={pointFormData.latitude}
                  longitude={pointFormData.longitude}
                  onChange={(lat, lng) =>
                    setPointFormData((prev) => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng,
                    }))
                  }
                />
              </div>

              {/* Periodicidad de Visita / Servicio */}
              <div className="space-y-3 pt-3 border-t border-slate-150">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Periodicidad de Visita / Servicio *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPointFormData({
                        ...pointFormData,
                        periodicidad: "diario",
                        dias_semana: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                      })
                    }
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      pointFormData.periodicidad === "diario"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    📅 Diario (7/7)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPointFormData({
                        ...pointFormData,
                        periodicidad: "semanal",
                        frecuencia_semanal: 1,
                      })
                    }
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      pointFormData.periodicidad === "semanal"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    📆 Semanal (1x)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPointFormData({
                        ...pointFormData,
                        periodicidad: "dias_especificos",
                        dias_semana: pointFormData.dias_semana.length > 0 ? pointFormData.dias_semana : ["lunes", "miercoles", "viernes"],
                      })
                    }
                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer text-center ${
                      pointFormData.periodicidad === "dias_especificos"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    🗓️ Días Específicos
                  </button>
                </div>

                {/* Sub-selector if Días Específicos */}
                {pointFormData.periodicidad === "dias_especificos" && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase block">
                      Selecciona los días programados:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {[
                        { id: "lunes", label: "Lun" },
                        { id: "martes", label: "Mar" },
                        { id: "miercoles", label: "Mié" },
                        { id: "jueves", label: "Jue" },
                        { id: "viernes", label: "Vie" },
                        { id: "sabado", label: "Sáb" },
                        { id: "domingo", label: "Dom" },
                      ].map((day) => {
                        const isSelected = pointFormData.dias_semana.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              const newDays = isSelected
                                ? pointFormData.dias_semana.filter((d) => d !== day.id)
                                : [...pointFormData.dias_semana, day.id];
                              setPointFormData({ ...pointFormData, dias_semana: newDays });
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                    {pointFormData.dias_semana.length === 0 && (
                      <p className="text-[10px] text-red-500 font-semibold">
                        Debes seleccionar al menos un día de la semana.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPointModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPointForm}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingPointForm ? "Guardando..." : "Guardar Punto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKLIST SUBMISSIONS DETAILS MODAL */}
      {isSubmissionDetailModalOpen && selectedSubmissionForDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl border border-slate-200 overflow-hidden font-sans flex flex-col">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                Respuestas de Checklist: {selectedSubmissionForDetail.app_users?.nombre || "Chofer"}
              </h3>
              <button
                onClick={() => setIsSubmissionDetailModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
              {/* Header Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs">
                <div>
                  <span className="font-bold text-slate-400 block uppercase">Trabajador</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedSubmissionForDetail.app_users?.nombre || "Usuario Eliminado"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase">Vehículo</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">{selectedSubmissionForDetail.vehicle_code}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase">Fecha</span>
                  <span className="font-bold text-slate-800 text-sm">{formatDateString(selectedSubmissionForDetail.fecha)}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase">Hora</span>
                  <span className="font-bold text-slate-800 text-sm font-mono">{formatTimeString(selectedSubmissionForDetail.created_at)}</span>
                </div>
              </div>

              {/* Answers list */}
              <div className="space-y-6">
                {checklistSections.map((section) => {
                  const type = section.id;
                  const typeQuestions = checklistQuestions.filter(q => q.checklist_type === type);
                  if (typeQuestions.length === 0) return null;

                  return (
                    <div key={type} className="space-y-2.5">
                      <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1">
                        {section.titulo}
                      </h4>
                      <div className="space-y-2">
                        {typeQuestions.map((q) => {
                          const answer = selectedSubmissionForDetail.respuestas?.[q.id];
                          const hasAnswer = !!answer;
                          const isOptional = q.es_opcional === true;
                          const tipo = q.tipo_pregunta || "binaria";

                          return (
                            <div key={q.id} className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/30 text-sm">
                              <div className="flex justify-between items-start gap-4">
                                <span className="text-slate-800 font-semibold">{q.question_text}</span>
                                {isOptional && (
                                  <span className="bg-slate-100 text-slate-550 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                    Opcional
                                  </span>
                                )}
                              </div>
                              
                              <div className="w-full mt-1">
                                {hasAnswer ? (
                                  tipo === "foto" ? (
                                    <div className="space-y-1">
                                      <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Evidencia Fotográfica:</span>
                                      {answer.startsWith("http") ? (
                                        <a
                                          href={answer}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-block relative group border border-slate-200 rounded-lg overflow-hidden max-w-[200px] mt-1"
                                        >
                                          <img
                                            src={answer}
                                            alt="Foto Evidencia"
                                            className="max-h-28 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                          />
                                          <span className="absolute inset-0 bg-black/25 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                            Ampliar Foto ↗
                                          </span>
                                        </a>
                                      ) : (
                                        <span className="text-xs text-slate-550 break-all bg-slate-150 p-1.5 rounded font-mono">{answer}</span>
                                      )}
                                    </div>
                                  ) : tipo === "desarrollo" ? (
                                    <div className="w-full">
                                      <span className="text-xs text-slate-450 font-bold block uppercase tracking-wider">Respuesta de desarrollo:</span>
                                      <div className="bg-slate-100 p-2.5 rounded-lg text-slate-800 text-xs font-semibold border border-slate-200 mt-1 leading-relaxed whitespace-pre-wrap">
                                        {answer}
                                      </div>
                                    </div>
                                  ) : (
                                    // Binary (Sí/No)
                                    <div className="flex items-center justify-between w-full">
                                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                                        answer === "si" ? "bg-green-50 text-green-750 border border-green-150" : "bg-red-50 text-red-750 border border-red-150"
                                      }`}>
                                        Marcó: {answer === "si" ? "Sí" : "No"}
                                      </span>
                                      
                                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        answer === q.expected_answer
                                          ? "bg-green-150 text-green-800"
                                          : "bg-red-150 text-red-800"
                                      }`}>
                                        {answer === q.expected_answer ? "Cumple" : "No Cumple"}
                                      </span>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-xs text-slate-400 italic">Sin respuesta</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsSubmissionDetailModalOpen(false)}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAENA POINT MAP MODAL */}
      {isPointMapModalOpen && selectedPointForMap && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Ubicación Punto: {selectedPointForMap.codigo}
              </h3>
              <button
                onClick={() => setIsPointMapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <LocationViewMap
                latitude={selectedPointForMap.latitude}
                longitude={selectedPointForMap.longitude}
                pointCodigo={selectedPointForMap.codigo}
              />

              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Lat: {selectedPointForMap.latitude} • Lng: {selectedPointForMap.longitude}</span>
                <a
                  href={`https://www.google.com/maps?q=${selectedPointForMap.latitude},${selectedPointForMap.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                >
                  Abrir en Google Maps externo ↗
                </a>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPointMapModalOpen(false)}
                  className="bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAENA POINT QR MODAL */}
      {isPointQRModalOpen && selectedPointForQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-500" />
                QR Punto: {selectedPointForQR.codigo}
              </h3>
              <button
                onClick={() => setIsPointQRModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 shadow-inner flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedPointForQR.id}`}
                  alt={`Código QR para el punto ${selectedPointForQR.codigo}`}
                  className="h-44 w-44 select-none"
                />
              </div>

              <div className="space-y-1">
                <div className="text-base font-bold text-slate-800">{selectedPointForQR.codigo}</div>
                <div className="text-[10px] text-slate-400 font-mono">ID: {selectedPointForQR.id}</div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Este código QR puede imprimirse y colocarse en el punto físico de la faena. El chofer lo escaneará desde la APK para certificar su paso.
              </p>

              <div className="flex gap-3 w-full pt-4 border-t border-slate-100">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${selectedPointForQR.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTS USER CONTRACT VIEW MODAL */}
      {isDocModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Contrato de {selectedUser.nombre}
              </h3>
              <button
                onClick={() => setIsDocModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-150">
                <div className="text-xs font-bold text-slate-400 uppercase">Información de Usuario</div>
                <div className="text-sm font-bold text-slate-800 mt-1">{selectedUser.nombre}</div>
                <div className="text-xs text-slate-500 mt-0.5">Cargo: {selectedUser.cargo} • RUT: {selectedUser.rut}</div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-2">Archivo Asociado</h4>
                {selectedUser.documento_url ? (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50 text-green-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="text-xs truncate font-medium">{selectedUser.documento_url}</span>
                    </div>
                    <a
                      href={selectedUser.documento_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2 py-1 transition-colors shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>No hay documentos de contrato cargados para este usuario. Puedes asociar un enlace en el formulario de edición.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="bg-slate-900 text-white rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors text-sm font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT DATE EDIT AND SIMULATED UPLOAD MODAL */}
      {isDocEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Actualizar {selectedDocType === "user_pass" ? `${selectedPassType} (${selectedDocName})` : selectedDocName}
              </h3>
              <button
                onClick={() => setIsDocEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveDoc} className="p-6 space-y-5 text-slate-700">
              {docEditError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{docEditError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Fecha de Vencimiento
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={editDocDate}
                    onChange={(e) => setEditDocDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Cargar Archivo de Respaldo Digital
                </label>

                {currentDocFileUrl && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900 truncate">
                          {currentDocFileName || "Archivo digital adjunto"}
                        </p>
                        <p className="text-[10px] text-blue-700 font-medium">Documento actualmente respaldado</p>
                      </div>
                    </div>
                    <a
                      href={currentDocFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 px-2.5 py-1 rounded-lg shadow-xs hover:bg-blue-50 transition-colors shrink-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver / Descargar
                    </a>
                  </div>
                )}

                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors relative bg-slate-50/50 hover:bg-blue-50/20">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFileToUpload(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  {selectedFileToUpload ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-600 truncate">{selectedFileToUpload.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {(selectedFileToUpload.size / (1024 * 1024)).toFixed(2)} MB • ¡Listo para subir al guardar!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-700">
                        {currentDocFileUrl ? "Arrastra o selecciona un nuevo archivo para reemplazar el actual" : "Arrastra o selecciona un archivo"}
                      </p>
                      <p className="text-[10px] text-slate-400">PDF, PNG o JPG hasta 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDocEditModalOpen(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 hover:bg-slate-50 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors text-sm font-semibold disabled:bg-blue-400"
                >
                  {savingDoc ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BACKUP PROCESSING OVERLAY */}
      {isBackupProcessing && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center space-y-4 font-sans border border-slate-200">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 animate-bounce">
              <Archive className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Generando Copia de Seguridad</h3>
              <p className="text-xs text-slate-500 mt-1">
                {backupStatusMessage || "Descargando y comprimiendo archivos en un paquete ZIP..."}
              </p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full animate-pulse w-3/4 mx-auto"></div>
            </div>
            <p className="text-[10px] text-slate-400">Por favor espere mientras se prepara su archivo.</p>
          </div>
        </div>
      )}

      {/* VEHICLE QR MODAL (WITH FISCALIZATION URL) */}
      {isQRModalOpen && selectedVehicleForQR && (() => {
        const publicInspectionUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/vehiculo/${selectedVehicleForQR.codigo}`
          : `https://controlderuta.cl/vehiculo/${selectedVehicleForQR.codigo}`;

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-400" />
                  QR de Fiscalización: {selectedVehicleForQR.codigo}
                </h3>
                <button
                  onClick={() => setIsQRModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicInspectionUrl)}`}
                    alt={`Código QR para el vehículo ${selectedVehicleForQR.codigo}`}
                    className="h-48 w-48 select-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xl font-extrabold text-slate-800 font-mono">{selectedVehicleForQR.codigo}</div>
                  <div className="text-xs text-slate-500 font-medium">Patente: <strong className="text-slate-700 font-mono">{selectedVehicleForQR.patente}</strong></div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">{selectedVehicleForQR.marca} {selectedVehicleForQR.modelo} • {selectedVehicleForQR.tipo_vehiculo}</div>
                </div>

                {/* Direct Link & Copy */}
                <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-left">
                  <div className="text-[11px] text-slate-600 font-mono truncate flex-1">
                    {publicInspectionUrl}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicInspectionUrl);
                      setCopiedVehicleLink(true);
                      setTimeout(() => setCopiedVehicleLink(false), 2000);
                    }}
                    className="shrink-0 p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    title="Copiar enlace directo"
                  >
                    {copiedVehicleLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Escaneable por la <strong>APK de ScanQR</strong> para iniciar ruta, o con la <strong>cámara de cualquier celular</strong> por fiscalizadores para verificar la documentación del vehículo al día.
                </p>

                <div className="flex gap-2 w-full pt-4 border-t border-slate-100">
                  <a
                    href={publicInspectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver Ficha
                  </a>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(publicInspectionUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Descargar
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FAENA START / END QR MODAL */}
      {isFaenaQRModalOpen && selectedFaenaForQR && (() => {
        const qrCodeValue = faenaQRType === "inicio"
          ? `FAENA-${selectedFaenaForQR.id}-INICIO`
          : `FAENA-${selectedFaenaForQR.id}-FIN`;

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-400" />
                  QR de Faena: {selectedFaenaForQR.nombre}
                </h3>
                <button
                  onClick={() => setIsFaenaQRModalOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 flex flex-col items-center text-center space-y-4">
                {/* Switch Between Inicio (Entrada) and Fin (Salida) */}
                <div className="w-full flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFaenaQRType("inicio")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      faenaQRType === "inicio"
                        ? "bg-white text-emerald-700 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    QR Inicio (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaenaQRType("fin")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      faenaQRType === "fin"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    QR Final (Salida)
                  </button>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCodeValue)}`}
                    alt={`Código QR para la faena ${selectedFaenaForQR.nombre}`}
                    className="h-48 w-48 select-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">{selectedFaenaForQR.nombre}</div>
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md inline-block">
                    {qrCodeValue}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {faenaQRType === "inicio"
                    ? "Ubicado en el punto de acceso / garita de la faena. El operador lo escanea para validar su ingreso oficial."
                    : "Ubicado en la garita de salida de la faena. El operador lo escanea para registrar el cierre formal de la ruta."}
                </p>

                <div className="flex gap-3 w-full pt-4 border-t border-slate-100">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCodeValue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Descargar QR
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ROUTE EVIDENCE & COMPLETE REPORT MODAL */}
      {selectedRouteForEvidenceModal && (() => {
        const route = selectedRouteForEvidenceModal;
        const pts = route.puntos_detalle || [];
        const completedPts = pts.filter(p => p.completado);
        const pendingPts = pts.filter(p => !p.completado);
        const totalPts = pts.length;
        const pct = totalPts > 0 ? Math.round((completedPts.length / totalPts) * 100) : 0;
        const hasStartGPS = route.latitud_inicio && route.longitud_inicio && route.latitud_inicio !== 0 && route.longitud_inicio !== 0;

        return (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans my-8">
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <div>
                    <h3 className="font-bold text-base">Reporte de Jornada de Ruta</h3>
                    <div className="text-xs text-slate-400 font-mono">ID Ruta: {route.id.substring(0, 8)}... • Faena: {route.faena_name}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRouteForEvidenceModal(null)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Route Technical Sheet */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Fecha</span>
                    <strong className="text-slate-800">{formatDateString(route.fecha_inicio)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Horario</span>
                    <strong className="text-slate-800">{route.hora_inicio} {route.hora_fin && route.hora_fin !== '-' ? `→ ${route.hora_fin}` : '(En curso)'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Operador (Chofer)</span>
                    <strong className="text-slate-800">{route.driver_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Ayudante</span>
                    <strong className="text-slate-800">{route.ayudante_nombre || 'Sin ayudante'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Vehículo</span>
                    <strong className="text-slate-800 font-mono">{route.vehicle_code}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Faena</span>
                    <strong className="text-slate-800">{route.faena_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Puntos</span>
                    <strong className="text-emerald-700 font-bold">{completedPts.length} / {totalPts} ({pct}%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Estado Oficial</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      route.estado === 'Finalizada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : route.estado === 'Término Anticipado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {route.estado || 'En Proceso'}
                    </span>
                  </div>
                </div>

                {/* GPS Start Location with Map */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Ubicación GPS de Inicio de Ruta
                    </h4>
                    {hasStartGPS && (
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        Lat: {route.latitud_inicio} • Lng: {route.longitud_inicio}
                      </span>
                    )}
                  </div>

                  {hasStartGPS ? (
                    <div className="h-44 w-full rounded-xl overflow-hidden border border-slate-200">
                      <LocationViewMap
                        latitude={route.latitud_inicio!}
                        longitude={route.longitud_inicio!}
                        pointCodigo={`Inicio: ${route.vehicle_code} (${route.faena_name})`}
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No se registraron coordenadas GPS al iniciar esta ruta.
                    </div>
                  )}
                </div>

                {/* Point by Point Checklist / Progress */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Detalle de Puntos de Control ({completedPts.length} de {totalPts} completados)
                    </h4>
                    <span className="text-xs font-bold text-slate-600">
                      Tasa: {pct}%
                    </span>
                  </div>

                  {pts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No se encontraron puntos de control vinculados a este registro.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {pts.map((pt, idx) => (
                        <div key={idx} className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              pt.completado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{pt.codigo || 'Sin código'}</div>
                              {pt.latitude && pt.longitude && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  GPS: {pt.latitude}, {pt.longitude}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            {pt.completado ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                  <Check className="h-3 w-3" /> Completado
                                </span>
                                {pt.completed_at && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {new Date(pt.completed_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                                <X className="h-3 w-3" /> Pendiente
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Early Termination Alert / Incident Notice */}
                {route.estado === 'Término Anticipado' && (
                  <div className="bg-red-50/50 rounded-xl border border-red-200 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Registro de Término Anticipado
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      El operador interrumpió la ruta antes de completar la totalidad de los puntos programados.
                    </p>
                    <div className="text-xs font-semibold text-red-700">
                      Quedaron pendientes {pendingPts.length} puntos de control sin auditar.
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedRouteForEvidenceModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Reporte
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DELETE NOTIFICATION PASSWORD MODAL */}
      {isDeleteNotificationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-150" />
                Confirmar Eliminación
              </h3>
              <button
                onClick={() => setIsDeleteNotificationModalOpen(false)}
                className="text-slate-200 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleDeleteNotificationConfirm} className="p-6 space-y-5 text-slate-700">
              {deleteNotificationError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 text-xs flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deleteNotificationError}</span>
                </div>
              )}

              <p className="text-sm text-slate-500 leading-relaxed text-left">
                ¿Está seguro de que desea eliminar permanentemente la notificación de <strong>{notificationToDelete?.driver_name}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="text-left">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Contraseña de Confirmación
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={deleteNotificationPassword}
                    onChange={(e) => setDeleteNotificationPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-800 placeholder-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    placeholder="Contraseña del administrador"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeleteNotificationModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deletingNotification}
                  className="bg-red-650 hover:bg-red-750 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:bg-red-400"
                >
                  {deletingNotification ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
