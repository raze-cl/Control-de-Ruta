"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
  AlertCircle
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
  
  // Modales State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Form State (for Create/Edit)
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchUsers();
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

  // Open Documents Modal
  const openDocModal = (user: AppUser) => {
    setSelectedUser(user);
    setIsDocModalOpen(true);
  };

  // Filtered Users List
  const filteredUsers = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-800">
            {activeTab === "users" ? "Gestión de Usuarios APK" : "Estadísticas y Monitoreo"}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
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
                    <span className="text-sm text-slate-500 font-medium">Cargando usuarios desde Supabase...</span>
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
                          <th className="px-6 py-4">Nombre / RUT</th>
                          <th className="px-6 py-4">Cargo</th>
                          <th className="px-6 py-4">Usuario APK</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4 text-center">Documentos</th>
                          <th className="px-6 py-4 text-center">Estado</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors">
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
                                {user.tipo_usuario === "admin" ? "Admin" : "Operador"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => openDocModal(user)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                                  user.documento_url
                                    ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                                {user.documento_url ? "Ver Doc" : "Asociar"}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
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
                            <td className="px-6 py-4 text-right">
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase">Habilitados</h3>
                  <p className="text-2xl font-bold text-slate-800">
                    {users.filter((u) => u.habilitado).length}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase">Bloqueados</h3>
                  <p className="text-2xl font-bold text-slate-800">
                    {users.filter((u) => !u.habilitado).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Agregar Nuevo Usuario APK</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
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

      {/* EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">Modificar Usuario APK</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
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

      {/* DOCUMENTS MODAL */}
      {isDocModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden font-sans">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Documentos de {selectedUser.nombre}
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
                    <span>No hay documentos cargados para este usuario. Puedes asociar un enlace en el formulario de edición.</span>
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
    </div>
  );
}
