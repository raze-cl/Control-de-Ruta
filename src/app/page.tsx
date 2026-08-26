"use client";

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
  Lock,
  Unlock,
  FileText,
  LogOut,
  User,
  LayoutDashboard,
  CheckCircle,
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
  Map
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
  created_at?: string;
}

interface FaenaPoint {
  id: string;
  faena_id: string;
  codigo: string;
  latitude: number;
  longitude: number;
  ultimo_registro_servicio?: string;
  created_at?: string;
}

const MANDATORY_DOCS = [
  "Cédula Identidad",
  "Licencia Municipal",
  "Examen Ocupacional",
  "Certificado 1",
  "Certificado 2"
];

const FAENAS_DEFAULT = [
  "SG",
  "DMH",
  "Subterranea",
  "Escondida",
  "Centinela",
  "Spence"
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

  // App Layout State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

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
  const [selectedDocTargetId, setSelectedDocTargetId] = useState(""); // user_id or vehicle_id
  const [editDocDate, setEditDocDate] = useState("");
  const [simulatedFileName, setSimulatedFileName] = useState("");
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
    tipo_usuario: "operador",
    username: "",
    password: "",
    documento_url: "",
    habilitado: true,
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

  // Load faenas from Supabase
  const fetchFaenas = async () => {
    setLoadingFaenas(true);
    try {
      const { data, error } = await supabase
        .from("faenas")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setFaenas(data || []);
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
      fetchVehicles();
      fetchFaenas();
      fetchChecklistQuestions();
      fetchChecklistSubmissions();
      fetchChecklistSections();
    }
  }, [isLoggedIn]);

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
        .eq("tipo_usuario", "admin")
        .single();

      if (error || !data) {
        setLoginError("Credenciales incorrectas o no tienes permisos de administrador.");
        setLoadingLogin(false);
        return;
      }

      if (!data.habilitado) {
        setLoginError("Tu cuenta de administrador se encuentra deshabilitada.");
        setLoadingLogin(false);
        return;
      }

      setCurrentAdmin(data);
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

  // Toggle User Row Expansion
  const toggleRow = async (userId: string) => {
    const isExpanded = expandedUserIds.includes(userId);
    if (isExpanded) {
      setExpandedUserIds(expandedUserIds.filter((id) => id !== userId));
      return;
    }

    setExpandedUserIds([...expandedUserIds, userId]);

    // Fetch details on demand if not fetched yet
    if (!userDocsMap[userId] || !userPassesMap[userId]) {
      setLoadingDetails((prev) => ({ ...prev, [userId]: true }));
      try {
        await refreshUserDetails(userId);
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [userId]: false }));
      }
    }
  };

  // Toggle Vehicle Row Expansion
  const toggleVehicleRow = async (vehicleId: string) => {
    const isExpanded = expandedVehicleIds.includes(vehicleId);
    if (isExpanded) {
      setExpandedVehicleIds(expandedVehicleIds.filter((id) => id !== vehicleId));
      return;
    }

    setExpandedVehicleIds([...expandedVehicleIds, vehicleId]);

    // Fetch vehicle docs on demand if not fetched yet
    if (!vehicleDocsMap[vehicleId]) {
      setLoadingVehicleDetails((prev) => ({ ...prev, [vehicleId]: true }));
      try {
        await refreshVehicleDetails(vehicleId);
      } finally {
        setLoadingVehicleDetails((prev) => ({ ...prev, [vehicleId]: false }));
      }
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

    if (!faenaPointsMap[faenaId]) {
      setLoadingFaenaPoints((prev) => ({ ...prev, [faenaId]: true }));
      try {
        await refreshFaenaPoints(faenaId);
      } finally {
        setLoadingFaenaPoints((prev) => ({ ...prev, [faenaId]: false }));
      }
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

  // Delete User
  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      const { error } = await supabase.from("app_users").delete().eq("id", id);
      if (error) throw error;

      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      alert("Error al eliminar usuario: " + err.message);
    }
  };

  // Delete Vehicle
  const handleDeleteVehicle = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este vehículo?")) return;

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
    } catch (err: any) {
      alert("Error al eliminar vehículo: " + err.message);
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
      tipo_usuario: "operador",
      username: "",
      password: "",
      documento_url: "",
      habilitado: true,
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
    });
    setPointFormError("");
    setIsPointModalOpen(true);
  };

  // Open Document Upload / Date edit Modal
  const openDocEditModal = (
    type: "user_doc" | "user_pass" | "vehicle_doc",
    docName: string,
    targetId: string,
    currentDate?: string
  ) => {
    setSelectedDocType(type);
    setSelectedDocName(docName);
    setSelectedDocTargetId(targetId);
    setEditDocDate(currentDate || new Date().toISOString().substring(0, 10));
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
      setFaenaFormError("Por favor completa todos los campos.");
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
      setPointFormError("Por favor completa todos los campos.");
      return;
    }

    setSavingPointForm(true);
    try {
      if (selectedPoint) {
        // Edit Mode
        const { error } = await supabase
          .from("faena_points")
          .update({
            codigo: pointFormData.codigo.trim(),
            latitude: Number(pointFormData.latitude),
            longitude: Number(pointFormData.longitude),
          })
          .eq("id", selectedPoint.id);

        if (error) throw error;
      } else {
        // Create Mode
        const { error } = await supabase
          .from("faena_points")
          .insert([
            {
              faena_id: selectedFaenaForPoint.id,
              codigo: pointFormData.codigo.trim(),
              latitude: Number(pointFormData.latitude),
              longitude: Number(pointFormData.longitude),
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

  // Save Document Date and Simulated File Upload
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocEditError("");

    if (!editDocDate) {
      setDocEditError("Debe ingresar una fecha de vencimiento válida.");
      return;
    }

    setSavingDoc(true);
    try {
      if (selectedDocType === "user_doc") {
        const { error } = await supabase
          .from("user_documents")
          .upsert(
            {
              user_id: selectedDocTargetId,
              document_name: selectedDocName,
              fecha_vencimiento: editDocDate,
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
              fecha_vencimiento: editDocDate,
            },
            { onConflict: "user_id,faena_name" }
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
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <Users className="h-9 w-9" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
              Control Panel Administrador
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Inicia sesión para gestionar los accesos de la APK
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Contraseña
                </label>
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
      </div>
    );
  }

  // Dashboard Interface
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
          <Users className="h-7 w-7 text-blue-500 shrink-0" />
          {isSidebarExpanded && (
            <span className="font-bold text-lg tracking-wide text-blue-100">
              ScanQR Admin
            </span>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            {isSidebarExpanded && <span>Usuarios APK</span>}
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
            onClick={() => setActiveTab("dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {isSidebarExpanded && <span>Dashboard (Mock)</span>}
          </button>
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
                <p className="text-xs text-slate-500 truncate">Administrador</p>
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
                          <th className="px-6 py-4">Usuario APK</th>
                          <th className="px-6 py-4">Tipo</th>
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
                                <td className="px-6 py-4 font-mono font-medium text-slate-600">{user.username}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                      user.tipo_usuario === "admin"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {user.tipo_usuario === "admin" ? "Admin" : "Chofer"}
                                  </span>
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
                                    title={user.habilitado ? "Bloquear Usuario" : "Habilitar Usuario"}
                                  >
                                    {user.habilitado ? (
                                      <>
                                        <Unlock className="h-3.5 w-3.5" />
                                        <span>Habilitado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="h-3.5 w-3.5" />
                                        <span>Bloqueado</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end gap-3">
                                    <button
                                      onClick={() => openEditModal(user)}
                                      className="text-slate-400 hover:text-blue-600 transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-slate-400 hover:text-red-600 transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Row Content */}
                              {isExpanded && (
                                <tr className="bg-slate-50/40 border-l-4 border-l-blue-500">
                                  <td colSpan={8} className="px-10 py-6 border-b border-slate-200">
                                    {loadingDetails[user.id] ? (
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></div>
                                        Cargando documentos y pases...
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Worker Documents */}
                                        <div>
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Documentos del Trabajador (Haga clic para editar)
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
                                                  onClick={() => openDocEditModal("user_doc", docName, user.id, record?.fecha_vencimiento)}
                                                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
                                                >
                                                  <span className="text-sm font-semibold text-slate-750 hover:text-blue-600 transition-colors">
                                                    {docName}
                                                  </span>
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

                                        {/* Faena Passes */}
                                        <div>
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                            <ClipboardList className="h-4 w-4 text-purple-500" />
                                            Pases Activos (Haga clic para editar)
                                          </h4>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {FAENAS_DEFAULT.map((faenaName) => {
                                              const record = (userPassesMap[user.id] || []).find(
                                                (p) => p.faena_name === faenaName
                                              );
                                              const expired = isDateExpired(record?.fecha_vencimiento);
                                              return (
                                                <div
                                                  key={faenaName}
                                                  onClick={() => openDocEditModal("user_pass", faenaName, user.id, record?.fecha_vencimiento)}
                                                  className="flex flex-col p-2.5 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
                                                >
                                                  <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
                                                      {faenaName}
                                                    </span>
                                                    {record ? (
                                                      expired ? (
                                                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-700">
                                                          Vencido
                                                        </span>
                                                      ) : (
                                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                                                          Activo
                                                        </span>
                                                      )
                                                    ) : (
                                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                        Inactivo
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className="text-[11px] text-slate-400 font-semibold font-mono flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDateString(record?.fecha_vencimiento)}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
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
                                                onClick={() => openDocEditModal("vehicle_doc", docName, vehicle.id, record?.fecha_vencimiento)}
                                                className="flex flex-col p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
                                              >
                                                <span className="text-xs font-bold text-slate-500 uppercase truncate mb-1 hover:text-blue-600 transition-colors" title={docName}>
                                                  {docName}
                                                </span>
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
                                  <td colSpan={5} className="px-10 py-6 border-b border-slate-200">
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
                                                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                                                      Lat: {point.latitude} • Lng: {point.longitude}
                                                    </span>
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

          {activeTab === "dashboard" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-slate-700">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase">Total Usuarios</h3>
                  <p className="text-2xl font-bold text-slate-800">{users.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase">Total Vehículos</h3>
                  <p className="text-2xl font-bold text-slate-800">{vehicles.length}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase">Preguntas Checklists</h3>
                  <p className="text-2xl font-bold text-slate-800">{checklistQuestions.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nuevo Usuario APK</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-slate-700">
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
                    placeholder="Chofer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Usuario</label>
                  <select
                    value={formData.tipo_usuario}
                    onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="operador">Operador (APK)</option>
                    <option value="admin">Administrador (Web + APK)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Usuario APK *</label>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña APK *</label>
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
              <h3 className="font-bold text-lg">Modificar Usuario APK</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4 text-slate-700">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Usuario</label>
                  <select
                    value={formData.tipo_usuario}
                    onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="operador">Operador (APK)</option>
                    <option value="admin">Administrador (Web + APK)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Usuario APK *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña APK *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL de Documento (Opcional)</label>
                <input
                  type="url"
                  value={formData.documento_url}
                  onChange={(e) => setFormData({ ...formData, documento_url: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:border-blue-500 focus:outline-none"
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
                Actualizar {selectedDocName}
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
                  Cargar Archivo de Respaldo (Simulado)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSimulatedFileName(e.target.files[0].name);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  {simulatedFileName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-green-600 truncate">{simulatedFileName}</p>
                      <p className="text-[10px] text-slate-450">¡Archivo listo para cargar!</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-650">Arrastra o selecciona un archivo</p>
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

      {/* VEHICLE QR MODAL */}
      {isQRModalOpen && selectedVehicleForQR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-500" />
                Código QR: {selectedVehicleForQR.codigo}
              </h3>
              <button
                onClick={() => setIsQRModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 shadow-inner flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedVehicleForQR.codigo}`}
                  alt={`Código QR para el vehículo ${selectedVehicleForQR.codigo}`}
                  className="h-44 w-44 select-none"
                />
              </div>

              <div className="space-y-1">
                <div className="text-lg font-bold text-slate-800">{selectedVehicleForQR.codigo}</div>
                <div className="text-xs text-slate-500 font-medium">Patente: {selectedVehicleForQR.patente}</div>
                <div className="text-xs text-slate-400 font-semibold uppercase">{selectedVehicleForQR.tipo_vehiculo}</div>
              </div>

              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Este código QR puede ser escaneado por los choferes desde la APK de ScanQR para inicializar la ruta diaria.
              </p>

              <div className="flex gap-3 w-full pt-4 border-t border-slate-100">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${selectedVehicleForQR.codigo}`}
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
    </div>
  );
}
