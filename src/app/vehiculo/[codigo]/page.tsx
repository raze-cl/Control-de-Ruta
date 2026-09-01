"use client";

import React, { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Clock,
  Printer,
  RefreshCw,
} from "lucide-react";

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

interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_name: string;
  fecha_vencimiento: string;
  created_at?: string;
}

const VEHICLE_DOCS = [
  "Padrón",
  "Permiso de circulación",
  "SOAP",
  "Revisión técnica",
  "Certificado de gases",
  "Certificado de mantención",
  "Certificaciones"
];

export default function VehiclePublicDocPage({ params }: { params: Promise<{ codigo: string }> }) {
  const resolvedParams = use(params);
  const rawCode = decodeURIComponent(resolvedParams.codigo || "").trim();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");

  const fetchVehicleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: vehicleData, error: vehicleErr } = await supabase
        .from("vehicles")
        .select("*")
        .or("codigo.ilike." + rawCode + ",patente.ilike." + rawCode)
        .maybeSingle();

      if (vehicleErr) throw vehicleErr;

      if (!vehicleData) {
        setVehicle(null);
        setDocuments([]);
        setError('No se encontró ningún vehículo registrado con el código o patente "' + rawCode + '".');
        setLoading(false);
        return;
      }

      setVehicle(vehicleData);

      const { data: docsData, error: docsErr } = await supabase
        .from("vehicle_documents")
        .select("*")
        .eq("vehicle_id", vehicleData.id);

      if (docsErr) throw docsErr;

      setDocuments(docsData || []);
      setLastCheckTime(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err: any) {
      console.error("Error fetching vehicle public docs:", err);
      setError("Ocurrió un error al consultar los antecedentes del vehículo. Por favor intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleData();
  }, [rawCode]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Sin fecha registrada";
    try {
      const [year, month, day] = dateStr.split("-");
      if (year && month && day) return day + "/" + month + "/" + year;
      const d = new Date(dateStr);
      return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
    } catch {
      return dateStr;
    }
  };

  const getDocStatus = (docName: string) => {
    const doc = documents.find((d) => d.document_name.toLowerCase() === docName.toLowerCase());
    if (!doc || !doc.fecha_vencimiento) {
      return {
        status: "missing",
        label: "NO REGISTRADO",
        colorBadge: "bg-slate-100 text-slate-600 border-slate-200",
        colorDot: "bg-slate-400",
        dateStr: "Pendiente de registro",
        daysLeft: null,
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(doc.fecha_vencimiento + "T00:00:00");
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: "expired",
        label: "VENCIDO",
        colorBadge: "bg-red-50 text-red-700 border-red-200",
        colorDot: "bg-red-500",
        dateStr: formatDate(doc.fecha_vencimiento),
        daysLeft: diffDays,
      };
    } else if (diffDays <= 30) {
      return {
        status: "warning",
        label: "POR VENCER (" + diffDays + "d)",
        colorBadge: "bg-amber-50 text-amber-700 border-amber-200",
        colorDot: "bg-amber-500",
        dateStr: formatDate(doc.fecha_vencimiento),
        daysLeft: diffDays,
      };
    } else {
      return {
        status: "valid",
        label: "AL DÍA / VIGENTE",
        colorBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        colorDot: "bg-emerald-500",
        dateStr: formatDate(doc.fecha_vencimiento),
        daysLeft: diffDays,
      };
    }
  };

  const allDocStatuses = VEHICLE_DOCS.map((docName) => getDocStatus(docName));
  const hasExpired = allDocStatuses.some((s) => s.status === "expired");
  const hasMissing = allDocStatuses.some((s) => s.status === "missing");
  const is100PercentValid = !hasExpired && !hasMissing && vehicle?.habilitado;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-emerald-600 rounded-full blur-[128px]"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Official Header / Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Control de Ruta • Flota Segura</div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Verificación Oficial de Documentación
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchVehicleData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin text-blue-400" : "")} />
              Actualizar
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-12 text-center space-y-4 backdrop-blur-md">
            <div className="h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-medium text-slate-400">Consultando documentación oficial del vehículo...</p>
          </div>
        ) : error || !vehicle ? (
          /* Error State */
          <div className="bg-slate-800/80 rounded-2xl border border-red-500/30 p-8 text-center space-y-4 backdrop-blur-md">
            <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <XCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Vehículo No Encontrado</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-500 font-mono">Código consultado: {rawCode}</span>
            </div>
          </div>
        ) : (
          /* Vehicle Found Content */
          <>
            {/* Global Status Banner */}
            <div
              className={
                "rounded-2xl border p-5 sm:p-6 backdrop-blur-md transition-all shadow-xl " +
                (is100PercentValid
                  ? "bg-emerald-950/40 border-emerald-500/40 shadow-emerald-950/30"
                  : hasExpired
                  ? "bg-red-950/40 border-red-500/40 shadow-red-950/30"
                  : "bg-amber-950/40 border-amber-500/40 shadow-amber-950/30")
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 " +
                      (is100PercentValid
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : hasExpired
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30")
                    }
                  >
                    {is100PercentValid ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : hasExpired ? (
                      <XCircle className="h-7 w-7" />
                    ) : (
                      <AlertTriangle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Estado de Fiscalización</div>
                    <div className="text-base sm:text-lg font-black text-white mt-0.5">
                      {is100PercentValid
                        ? "DOCUMENTACIÓN 100% VIGENTE Y AL DÍA"
                        : hasExpired
                        ? "DOCUMENTACIÓN VENCIDA — NO APTO PARA CIRCULAR"
                        : "DOCUMENTACIÓN INCOMPLETA / POR RENOVAR"}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {is100PercentValid
                        ? "Este vehículo cumple con todas las exigencias legales y técnicas requeridas para faena y tránsito."
                        : hasExpired
                        ? "El vehículo presenta uno o más documentos obligatorios vencidos ante la normativa de tránsito/faena."
                        : "Existen documentos obligatorios pendientes de carga o con fecha próxima a expirar."}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <span
                    className={
                      "inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border " +
                      (vehicle.habilitado
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30")
                    }
                  >
                    <span className={"h-2 w-2 rounded-full " + (vehicle.habilitado ? "bg-emerald-400" : "bg-red-400")}></span>
                    {vehicle.habilitado ? "Vehículo Habilitado" : "Vehículo Inhabilitado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Technical Sheet */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 backdrop-blur-md shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Truck className="h-5 w-5 text-blue-400" />
                  Ficha Técnica del Vehículo
                </div>
                <div className="text-xs font-mono font-bold bg-slate-700 text-blue-300 px-2.5 py-1 rounded-md">
                  CÓDIGO: {vehicle.codigo}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-medium">Patente Oficial</div>
                  <div className="text-sm font-black text-white font-mono tracking-wider mt-0.5">{vehicle.patente}</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-medium">Marca</div>
                  <div className="text-sm font-bold text-white mt-0.5">{vehicle.marca || "N/A"}</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-medium">Modelo</div>
                  <div className="text-sm font-bold text-white mt-0.5">{vehicle.modelo || "N/A"}</div>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 font-medium">Año y Tipo</div>
                  <div className="text-sm font-bold text-white mt-0.5 truncate">
                    {(vehicle.anio ? vehicle.anio + " • " : "") + (vehicle.tipo_vehiculo || "Vehículo")}
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Documents List */}
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-md shadow-lg">
              <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Documentos Obligatorios Registrados ({documents.length} / {VEHICLE_DOCS.length})
                  </h2>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Verificación de Vencimiento Legal
                </span>
              </div>

              <div className="divide-y divide-slate-700/60">
                {VEHICLE_DOCS.map((docName, idx) => {
                  const statusInfo = getDocStatus(docName);
                  return (
                    <div
                      key={idx}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{docName}</div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span>Vencimiento: <strong className="text-slate-200">{statusInfo.dateStr}</strong></span>
                            {statusInfo.daysLeft !== null && (
                              <span
                                className={
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded " +
                                  (statusInfo.daysLeft < 0
                                    ? "bg-red-500/20 text-red-300"
                                    : statusInfo.daysLeft <= 30
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-slate-700 text-slate-300")
                                }
                              >
                                {statusInfo.daysLeft < 0
                                  ? "Expiró hace " + Math.abs(statusInfo.daysLeft) + " días"
                                  : "Quedan " + statusInfo.daysLeft + " días"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto pl-11 sm:pl-0">
                        <span
                          className={
                            "inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider " +
                            (statusInfo.status === "valid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : statusInfo.status === "warning"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : statusInfo.status === "expired"
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-slate-700/60 text-slate-400 border-slate-600")
                          }
                        >
                          <span className={"h-1.5 w-1.5 rounded-full " + statusInfo.colorDot}></span>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Inspection Stamp & Verification Footer */}
            <div className="bg-slate-800/40 rounded-xl border border-slate-800 p-4 text-center text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-400">
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                Consulta en tiempo real: {new Date().toLocaleDateString("es-CL")} • {lastCheckTime || "--:--:--"}
              </div>
              <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
                Esta página constituye una ficha digital certificada por el sistema Control de Ruta para acreditación vehicular y fiscalización en terreno.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
