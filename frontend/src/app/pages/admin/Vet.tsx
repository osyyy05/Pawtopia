import { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';

type ApptStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface VetAppointment {
  id: string;
  petName: string;
  petType: string;
  ownerName: string;
  ownerAvatar: string;
  ownerUserId: string;
  vet: string;
  clinic: string;
  appointmentDate: string;
  reason: string;
  status: ApptStatus;
}

const statusConfig: Record<ApptStatus, { color: string; label: string }> = {
  pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' },
  confirmed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Confirmed' },
  completed: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Completed' },
  cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled' },
};

export function AdminVetManagement() {
  const [appointments, setAppointments] =
    useState<VetAppointment[]>([]);

  const [loading, setLoading] =
    useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApptStatus | 'all'>('all');

useEffect(() => {
  const fetchAppointments = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/appointments/admin/',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to load appointments.'
        );
      }

      const convertedAppointments: VetAppointment[] =
        Array.isArray(data)
          ? data.map((appointment: any): VetAppointment => ({
              id: String(appointment.id),

              petName:
                appointment.pet_name || '-',

              petType:
                appointment.species || '-',

              ownerName:
                appointment.adopter_name || '-',

              ownerAvatar:
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.adopter_name || appointment.adopter_email || 'User'}`,

              ownerUserId:
                String(appointment.adopter || ''),

              vet:
                appointment.vet_name || 'Not assigned',

              clinic:
                appointment.vet_clinic || 'Veterinary Clinic',

              appointmentDate:
                `${appointment.date}T${appointment.time || '00:00'}`,

              reason:
                appointment.notes ||
                appointment.appointment_type_display ||
                '-',

              status:
                appointment.status === 'SCHEDULED'
                  ? 'pending'
                  : appointment.status === 'IN_PROGRESS'
                  ? 'confirmed'
                  : appointment.status === 'COMPLETED'
                  ? 'completed'
                  : appointment.status === 'CANCELLED'
                  ? 'cancelled'
                  : 'pending',
            }))
          : [];

      setAppointments(
        convertedAppointments
      );

    } catch (error) {
      console.error(
        'Failed to load admin vet appointments:',
        error
      );

      setAppointments([]);

    } finally {
      setLoading(false);
    }
  };

  fetchAppointments();
}, []);

  const filtered = appointments.filter(a => {
    const matchSearch =
      a.petName.toLowerCase().includes(search.toLowerCase()) ||
      a.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      a.clinic.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (
    id: string,
    status: ApptStatus
  ) => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      return;
    }

    const djangoStatus =
      status === 'pending'
        ? 'SCHEDULED'
        : status === 'confirmed'
        ? 'IN_PROGRESS'
        : status === 'completed'
        ? 'COMPLETED'
        : 'CANCELLED';

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/admin/${id}/status/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: djangoStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update appointment status.'
        );
      }

      setAppointments(prev =>
        prev.map(a =>
          a.id === id
            ? { ...a, status }
            : a
        )
      );

      toast.success(
        `Appointment status updated to ${status}.`
      );

    } catch (error) {
      console.error(
        'Failed to update appointment status:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update appointment status.'
      );
    }
  };

  const todayCount = appointments.filter(a => {
    const today = new Date().toDateString();
    return new Date(a.appointmentDate).toDateString() === today;
  }).length;

if (loading) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Vet Clinic Management
        </h1>

        <p className="text-slate-400 text-sm mt-0.5">
          Loading veterinary appointments...
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vet Clinic Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage veterinary appointments and clinic operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Appointments', value: appointments.length, color: 'text-white' },
          { label: 'Today', value: todayCount, color: 'text-cyan-400' },
          { label: 'Pending', value: appointments.filter(a => a.status === 'pending').length, color: 'text-amber-400' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-slate-900/60 border border-purple-500/20 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search appointments..." className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-900/60 border border-purple-500/20 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-all" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${filterStatus === s ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-slate-900/60 border border-purple-500/20 text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Pet</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Owner</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Vet / Clinic</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Date & Time</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Reason</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Status</th>
                <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{a.petName}</p>
                    <p className="text-xs text-slate-500">{a.petType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={a.ownerAvatar} alt={a.ownerName} className="w-6 h-6 rounded-full" />
                      <span className="text-sm text-slate-300">{a.ownerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white">{a.vet}</p>
                    <p className="text-xs text-slate-500 truncate max-w-40">{a.clinic}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-300">{new Date(a.appointmentDate).toLocaleDateString('en-MY')}</p>
                    <p className="text-xs text-slate-500">{new Date(a.appointmentDate).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-40">{a.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig[a.status].color}`}>
                      {statusConfig[a.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {a.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(a.id, 'confirmed')} className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-colors" title="Confirm">
                            <CheckCircle className="size-4" />
                          </button>
                          <button onClick={() => updateStatus(a.id, 'cancelled')} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Cancel">
                            <XCircle className="size-4" />
                          </button>
                        </>
                      )}
                      {a.status === 'confirmed' && (
                        <button onClick={() => updateStatus(a.id, 'completed')} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors" title="Mark Completed">
                          <CheckSquare className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
