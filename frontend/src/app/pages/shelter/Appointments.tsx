import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  PawPrint,
  Phone,
  Search,
  UserRound,
  X,
  XCircle,
  LoaderCircle,
  CalendarCheck2,
  CircleDot,
  FileText,
} from "lucide-react";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
type FilterStatus = "ALL" | AppointmentStatus;

interface Appointment {
  id: number;
  adoption_application: number | null;
  adopter: number | null;
  adopter_name: string;
  adopter_email: string;
  owner_phone: string;
  shelter: number | null;
  shelter_name: string | null;
  vet: number | null;
  vet_name: string | null;
  vet_clinic: number | null;
  animal: number | null;
  animal_name: string | null;
  pet_name: string;
  species: string;
  date: string;
  time: string;
  appointment_type: string;
  appointment_type_display: string;
  status: AppointmentStatus;
  status_display: string;
  notes: string;
  medical_notes: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = "http://127.0.0.1:8000";

function getToken() {
  return sessionStorage.getItem("access_token") || "";
}

function formatDate(value: string) {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string) {
  if (!value) return "Not specified";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  let hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  hour %= 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

function petName(a: Appointment) {
  return a.animal_name || a.pet_name || "Unnamed Pet";
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles =
    status === "COMPLETED"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : status === "CANCELLED"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
        : "border-amber-400/20 bg-amber-400/10 text-amber-300";

  const Icon =
    status === "COMPLETED"
      ? CheckCircle2
      : status === "CANCELLED"
        ? XCircle
        : Clock3;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      <Icon className="h-3.5 w-3.5" />
      {status === "COMPLETED" ? "Completed" : status === "CANCELLED" ? "Cancelled" : "Scheduled"}
    </span>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [updating, setUpdating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"COMPLETED" | "CANCELLED" | null>(null);
  const [confirmAdoption, setConfirmAdoption] = useState(false);
  const [completingAdoption, setCompletingAdoption] = useState(false);
  const [completedAdoptionIds, setCompletedAdoptionIds] = useState<number[]>([]);

  const fetchAppointments = async () => {
    const token = getToken();
    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/api/appointments/shelter/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.detail || "Failed to load Meet & Greets.");
      setAppointments(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Meet & Greets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const counts = useMemo(
    () => ({
      all: appointments.length,
      scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    }),
    [appointments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => {
      const statusOK = filter === "ALL" || a.status === filter;
      const text = [petName(a), a.species, a.adopter_name, a.adopter_email, a.owner_phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return statusOK && (!q || text.includes(q));
    });
  }, [appointments, filter, search]);

  const updateStatus = async (newStatus: "COMPLETED" | "CANCELLED") => {
    if (!selected) return;
    const token = getToken();
    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(
        `${API_BASE}/api/appointments/shelter/${selected.id}/status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.detail || "Failed to update Meet & Greet.");

      setAppointments((old) => old.map((a) => (a.id === data.id ? data : a)));
      setSelected(data);
      setConfirmAction(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update Meet & Greet.");
    } finally {
      setUpdating(false);
    }
  };

  const completeAdoption = async () => {
    if (!selected?.adoption_application) {
      alert("This Meet & Greet is not linked to an adoption application.");
      return;
    }

    const token = getToken();
    if (!token) {
      alert("Please login again.");
      return;
    }

    try {
      setCompletingAdoption(true);
      const response = await fetch(
        `${API_BASE}/api/adoptions/shelter/applications/${selected.adoption_application}/complete/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ remark: "Adoption successfully completed after Meet & Greet." }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.detail || "Failed to complete the adoption.");

      setCompletedAdoptionIds((old) =>
        old.includes(selected.adoption_application as number)
          ? old
          : [...old, selected.adoption_application as number],
      );
      setConfirmAdoption(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to complete the adoption.");
    } finally {
      setCompletingAdoption(false);
    }
  };

  const filters: { value: FilterStatus; label: string }[] = [
    { value: "ALL", label: "All" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const summaries = [
    { label: "All Meet & Greets", value: counts.all, Icon: CalendarDays, iconClass: "bg-violet-500/10 text-violet-300" },
    { label: "Scheduled", value: counts.scheduled, Icon: Clock3, iconClass: "bg-amber-500/10 text-amber-300" },
    { label: "Completed", value: counts.completed, Icon: CheckCircle2, iconClass: "bg-emerald-500/10 text-emerald-300" },
    { label: "Cancelled", value: counts.cancelled, Icon: XCircle, iconClass: "bg-rose-500/10 text-rose-300" },
  ];

  return (
    <div className="min-h-screen w-full px-6 py-8 lg:px-10 xl:px-12">
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-400">
            Adoption Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Meet & Greet Management</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Manage Meet & Greet sessions arranged for approved adoption applications.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaries.map(({ label, value, Icon, iconClass }) => (
            <Card key={label} className="border-violet-400/10 bg-[#0d1224] p-5 shadow-lg shadow-black/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="border-violet-400/10 bg-[#0d1224] p-5 shadow-lg shadow-black/10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-xl">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pet, applicant, email or phone..."
                className="h-11 border-violet-400/10 bg-[#090e1d] pl-10 text-white placeholder:text-slate-600"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    filter === item.value
                      ? "border-violet-400/30 bg-violet-500/15 text-violet-200"
                      : "border-violet-400/10 bg-[#090e1d] text-slate-400 hover:border-violet-400/20 hover:bg-[#12182c] hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading && (
          <Card className="flex min-h-[260px] items-center justify-center border-violet-400/10 bg-[#0d1224]">
            <div className="text-center">
              <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-violet-400" />
              <p className="mt-3 text-sm text-slate-400">Loading Meet & Greets...</p>
            </div>
          </Card>
        )}

        {!loading && error && (
          <Card className="border-rose-400/20 bg-[#130f1d] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-rose-200">Unable to load Meet & Greets</h3>
                <p className="mt-1 text-sm text-rose-200/70">{error}</p>
              </div>
              <Button type="button" onClick={fetchAppointments} className="bg-rose-600 text-white hover:bg-rose-500">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Card className="flex min-h-[300px] items-center justify-center border-violet-400/10 bg-[#0d1224] p-8">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">No Meet & Greets found</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {search || filter !== "ALL"
                  ? "No Meet & Greets match your current search or filter."
                  : "Meet & Greets will appear here after an approved adoption application has been scheduled."}
              </p>
            </div>
          </Card>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((a) => (
              <Card
                key={a.id}
                className="overflow-hidden border-violet-400/10 bg-[#0d1224] shadow-lg shadow-black/10 transition hover:border-violet-400/20 hover:bg-[#10162a]"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                          <PawPrint className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-white">{petName(a)}</h3>
                          <p className="mt-0.5 text-sm text-slate-500">{a.species || "Species not specified"}</p>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-center gap-2.5">
                          <UserRound className="h-4 w-4 shrink-0 text-violet-400/50" />
                          <span className="truncate">{a.adopter_name || "Applicant"}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CalendarDays className="h-4 w-4 shrink-0 text-violet-400/50" />
                          <span>{formatShortDate(a.date)}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock3 className="h-4 w-4 shrink-0 text-violet-400/50" />
                          <span>{formatTime(a.time)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => { setSelected(a); setConfirmAdoption(false); }}
                      className="h-11 shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              if (!updating) {
                setSelected(null);
                setConfirmAction(null);
              }
            }}
          />

          <div
            className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-violet-400/15 bg-[#090e1d] shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-violet-400/10 px-6 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">Meet & Greet</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Meet & Greet Details</h2>
                <p className="mt-1 text-sm text-slate-500">Review the meeting information and update its status.</p>
              </div>
              <button
                type="button"
                disabled={updating}
                onClick={() => {
                  setSelected(null);
                  setConfirmAction(null);
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-[#11182c] text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Current Status</p>
                  <div className="mt-2"><StatusBadge status={selected.status} /></div>
                </div>
                <p className="text-xs text-slate-600">Meet & Greet #{selected.id}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-violet-400/10 bg-[#0d1224] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                      <PawPrint className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Pet</p>
                      <p className="mt-1 font-semibold text-white">{petName(selected)}</p>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-violet-400/10 pt-4">
                    <p className="text-xs text-slate-600">Species</p>
                    <p className="mt-1 text-sm text-slate-300">{selected.species || "Not specified"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-400/10 bg-[#0d1224] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Applicant</p>
                      <p className="mt-1 truncate font-semibold text-white">{selected.adopter_name || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3 border-t border-violet-400/10 pt-4">
                    <div className="flex items-start gap-2.5">
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/50" />
                      <span className="break-all text-sm text-slate-300">{selected.adopter_email || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-violet-400/50" />
                      <span className="text-sm text-slate-300">{selected.owner_phone || "Not specified"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-[#0d1224] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-violet-300" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Schedule</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-600">Date</p>
                    <p className="mt-1 text-sm font-medium text-white">{formatDate(selected.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Time</p>
                    <p className="mt-1 text-sm font-medium text-white">{formatTime(selected.time)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-violet-400/10 bg-[#0d1224] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-400/50" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Notes</p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                  {selected.notes || "No additional notes were provided for this Meet & Greet."}
                </p>
              </div>

              {selected.status === "COMPLETED" && (
                <>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                      <div>
                        <h4 className="font-semibold text-emerald-200">Meet & Greet Completed</h4>
                        <p className="mt-1 text-sm leading-6 text-emerald-100/60">The meeting has been completed successfully.</p>
                      </div>
                    </div>
                  </div>

                  {selected.adoption_application && completedAdoptionIds.includes(selected.adoption_application) ? (
                    <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.06] p-5">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                        <div>
                          <h4 className="font-semibold text-violet-200">Adoption Completed</h4>
                          <p className="mt-1 text-sm leading-6 text-violet-100/60">
                            {petName(selected)} has been successfully adopted by {selected.adopter_name || "the applicant"}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : selected.adoption_application ? (
                    <div className="rounded-2xl border border-violet-400/15 bg-[#0d1224] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-400">Next Step</p>
                      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-xl">
                          <h4 className="font-semibold text-white">Finalise the Adoption</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-400">
                            The Meet & Greet is complete. You can now finalise the adoption for {petName(selected)}.
                          </p>
                        </div>
                        {!confirmAdoption && (
                          <Button type="button" disabled={completingAdoption} onClick={() => setConfirmAdoption(true)} className="h-11 shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110">
                            <PawPrint className="mr-2 h-4 w-4" />Complete Adoption
                          </Button>
                        )}
                      </div>

                      {confirmAdoption && (
                        <div className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] p-5">
                          <h4 className="font-semibold text-white">Complete Adoption?</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            Are you sure you want to complete the adoption of <span className="font-medium text-white">{petName(selected)}</span> for <span className="font-medium text-white">{selected.adopter_name || "this applicant"}</span>?
                          </p>
                          <div className="mt-4 space-y-2 text-sm text-slate-400">
                            <p>• The application will be marked as Completed.</p>
                            <p>• {petName(selected)} will be marked as Adopted.</p>
                            <p>• The pet will be removed from available adoption listings.</p>
                            <p>• Other pending applications for this pet will be rejected.</p>
                          </div>
                          <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <Button type="button" disabled={completingAdoption} onClick={() => setConfirmAdoption(false)} className="border border-violet-400/10 bg-[#11182c] text-white hover:bg-[#171f36]">Go Back</Button>
                            <Button type="button" disabled={completingAdoption} onClick={completeAdoption} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110">
                              {completingAdoption ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                              Complete Adoption
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
                      <p className="text-sm leading-6 text-amber-200/80">This Meet & Greet is not linked to an adoption application, so the adoption cannot be finalised from this record.</p>
                    </div>
                  )}
                </>
              )}

              {selected.status === "CANCELLED" && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-5">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                    <div>
                      <h4 className="font-semibold text-rose-200">Meet & Greet Cancelled</h4>
                      <p className="mt-1 text-sm leading-6 text-rose-100/60">This Meet & Greet is no longer scheduled.</p>
                    </div>
                  </div>
                </div>
              )}

              {confirmAction && selected.status === "SCHEDULED" && (
                <div className={`rounded-2xl border p-5 ${
                  confirmAction === "COMPLETED"
                    ? "border-emerald-400/20 bg-emerald-400/[0.05]"
                    : "border-rose-400/20 bg-rose-400/[0.05]"
                }`}>
                  <div className="flex items-start gap-3">
                    <CircleDot className={`mt-0.5 h-5 w-5 shrink-0 ${
                      confirmAction === "COMPLETED" ? "text-emerald-300" : "text-rose-300"
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {confirmAction === "COMPLETED"
                          ? "Mark this Meet & Greet as completed?"
                          : "Cancel this Meet & Greet?"}
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {confirmAction === "COMPLETED"
                          ? "This confirms that the applicant and pet have completed their Meet & Greet session."
                          : "The meeting will be marked as cancelled."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="button"
                          disabled={updating}
                          onClick={() => setConfirmAction(null)}
                          className="border border-violet-400/10 bg-[#11182c] text-white hover:bg-[#171f36]"
                        >
                          Go Back
                        </Button>
                        <Button
                          type="button"
                          disabled={updating}
                          onClick={() => updateStatus(confirmAction)}
                          className={
                            confirmAction === "COMPLETED"
                              ? "bg-emerald-600 text-white hover:bg-emerald-500"
                              : "bg-rose-600 text-white hover:bg-rose-500"
                          }
                        >
                          {updating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                          {confirmAction === "COMPLETED" ? "Confirm Completed" : "Confirm Cancellation"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selected.status === "SCHEDULED" && !confirmAction && (
                <div className="flex flex-col-reverse gap-3 border-t border-violet-400/10 pt-6 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirmAction("CANCELLED")}
                    className="h-11 border border-rose-400/20 bg-rose-400/[0.05] text-rose-300 hover:bg-rose-400/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Meet & Greet
                  </Button>
                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => setConfirmAction("COMPLETED")}
                    className="h-11 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-110"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
