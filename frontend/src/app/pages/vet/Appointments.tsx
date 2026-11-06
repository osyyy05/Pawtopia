import { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  pet: string;
  species: string;
  owner: string;
  ownerPhone: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  notes: string;
  medicalNotes: string;
  vetId?: number;
}

const statusColor = (status: string) => {
  if (status === 'Completed') return 'bg-green-600/20 text-green-400';
  if (status === 'In Progress') return 'bg-blue-600/20 text-blue-400';
  if (status === 'Cancelled') return 'bg-red-600/20 text-red-400';
  return 'bg-yellow-600/20 text-yellow-400';
};

export default function VetAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'All' | 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  >('All');

  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  const fetchAppointments = async () => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please log in again.');
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      };

      const [availableResponse, myResponse] = await Promise.all([
        fetch(
          'http://127.0.0.1:8000/api/appointments/vet/available/',
          {
            method: 'GET',
            headers,
          }
        ),

        fetch(
          'http://127.0.0.1:8000/api/appointments/vet/',
          {
            method: 'GET',
            headers,
          }
        ),
      ]);

      const availableData = await availableResponse.json();
      const myData = await myResponse.json();

      if (!availableResponse.ok) {
        throw new Error(
          availableData?.error ||
          availableData?.detail ||
          'Failed to load available appointments.'
        );
      }

      if (!myResponse.ok) {
        throw new Error(
          myData?.error ||
          myData?.detail ||
          'Failed to load assigned appointments.'
        );
      }

      const allAppointments = [
        ...(Array.isArray(availableData) ? availableData : []),
        ...(Array.isArray(myData) ? myData : []),
      ];

      const uniqueAppointments = Array.from(
        new Map(
          allAppointments.map((appointment: any) => [
            appointment.id,
            appointment,
          ])
        ).values()
      );

      const convertedAppointments: Appointment[] =
        uniqueAppointments.map((appointment: any) => ({
          id: String(appointment.id),

          pet:
            appointment.animal_name ||
            appointment.pet_name ||
            'Unknown Pet',

          species:
            appointment.species ||
            appointment.animal_species ||
            'Unknown',

          owner:
            appointment.adopter_name ||
            appointment.owner_name ||
            appointment.full_name ||
            'Unknown Owner',

          ownerPhone:
            appointment.owner_phone ||
            appointment.phone ||
            appointment.adopter_phone ||
            '',

          date: appointment.date || '',

          time: appointment.time || '',

          type:
            appointment.appointment_type_display ||
            appointment.appointment_type ||
            appointment.type ||
            'Appointment',

          status:
            appointment.status === 'IN_PROGRESS'
              ? 'In Progress'
              : appointment.status === 'COMPLETED'
              ? 'Completed'
              : appointment.status === 'CANCELLED'
              ? 'Cancelled'
              : 'Scheduled',

          notes: appointment.notes || '',

          medicalNotes: appointment.medical_notes || '',

          vetId: appointment.vet ?? undefined,
        }));

      setAppointments(convertedAppointments);
    } catch (error) {
      console.error('Failed to load vet appointments:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load appointments.'
      );

      setAppointments([]);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // CLAIM APPOINTMENT
  const claimAppointment = async (id: string) => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/vet/${id}/claim/`,
        {
          method: 'POST',
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
          'Failed to claim appointment.'
        );
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id
            ? {
                ...appt,
                status:
                  data.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : 'Scheduled',
                vetId: data.vet,
              }
            : appt
        )
      );

      toast.success('Appointment claimed successfully.');
    } catch (error) {
      console.error('Failed to claim appointment:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to claim appointment.'
      );
    }
  };

  const filtered = appointments.filter((appointment) => {
    const searchText = search.toLowerCase();

    const matchSearch =
      appointment.pet.toLowerCase().includes(searchText) ||
      appointment.owner.toLowerCase().includes(searchText);

    const matchFilter =
      filter === 'All' || appointment.status === filter;

    return matchSearch && matchFilter;
  });

  // UPDATE APPOINTMENT STATUS
  const updateStatus = async (
    id: string,
    status: Appointment['status']
  ) => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please log in again.');
      return;
    }

    const backendStatus =
      status === 'In Progress'
        ? 'IN_PROGRESS'
        : status === 'Completed'
        ? 'COMPLETED'
        : status === 'Cancelled'
        ? 'CANCELLED'
        : 'SCHEDULED';

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/vet/${id}/status/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            status: backendStatus,
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

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id
            ? {
                ...appt,
                status:
                  data.status === 'IN_PROGRESS'
                    ? 'In Progress'
                    : data.status === 'COMPLETED'
                    ? 'Completed'
                    : data.status === 'CANCELLED'
                    ? 'Cancelled'
                    : 'Scheduled',
              }
            : appt
        )
      );

      toast.success(`Status updated to ${status}.`);
    } catch (error) {
      console.error('Failed to update appointment status:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update appointment status.'
      );
    }
  };

  // SAVE MEDICAL NOTES
  const saveMedicalNotes = async (id: string) => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/appointments/vet/${id}/notes/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            medical_notes: notesText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to save medical notes.'
        );
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id
            ? {
                ...appt,
                medicalNotes:
                  data.medical_notes || notesText,
              }
            : appt
        )
      );

      setEditingNotes(null);
      setNotesText('');

      toast.success('Medical notes saved.');
    } catch (error) {
      console.error('Failed to save medical notes:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save medical notes.'
      );
    }
  };

  const counts = {
    All: appointments.length,
    Scheduled: appointments.filter(
      (a) => a.status === 'Scheduled'
    ).length,
    'In Progress': appointments.filter(
      (a) => a.status === 'In Progress'
    ).length,
    Completed: appointments.filter(
      (a) => a.status === 'Completed'
    ).length,
    Cancelled: appointments.filter(
      (a) => a.status === 'Cancelled'
    ).length,
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Appointments
            </h1>

            <p className="text-gray-300">
              Manage and update all veterinary appointments.
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap">
          {(
            [
              'All',
              'Scheduled',
              'In Progress',
              'Completed',
              'Cancelled',
            ] as const
          ).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              className={
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                  : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5'
              }
            >
              {f}{' '}
              <span className="ml-1 text-xs opacity-70">
                ({counts[f]})
              </span>
            </Button>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pet or owner name..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* APPOINTMENTS */}
        <div className="space-y-4">
          {filtered.map((appt) => (
            <Card
              key={appt.id}
              className="bg-black/40 backdrop-blur-xl border-white/10"
            >
              <CardContent className="p-5">

                <div className="flex flex-col md:flex-row gap-4">

                  <div className="flex-1">

                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">
                        {appt.pet}{' '}
                        <span className="text-gray-400 font-normal text-sm">
                          ({appt.species})
                        </span>
                      </h3>

                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${statusColor(
                          appt.status
                        )}`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm">
                      Owner:{' '}
                      <span className="text-white">
                        {appt.owner}
                      </span>{' '}
                      · {appt.ownerPhone}
                    </p>

                    <p className="text-gray-400 text-sm">
                      Type:{' '}
                      <span className="text-cyan-400">
                        {appt.type}
                      </span>{' '}
                      · {appt.date} at {appt.time}
                    </p>

                    {appt.notes && (
                      <p className="text-gray-500 text-xs mt-1">
                        {appt.notes}
                      </p>
                    )}

                    {appt.medicalNotes && (
                      <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                        <p className="text-xs text-gray-400">
                          Medical Notes:
                        </p>

                        <p className="text-white text-sm">
                          {appt.medicalNotes}
                        </p>
                      </div>
                    )}

                    {editingNotes === appt.id && (
                      <div className="mt-3 space-y-2">

                        <Input
                          value={notesText}
                          onChange={(e) =>
                            setNotesText(e.target.value)
                          }
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter medical notes..."
                        />

                        <div className="flex gap-2">

                          <Button
                            onClick={() =>
                              saveMedicalNotes(appt.id)
                            }
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-indigo-600"
                          >
                            Save Notes
                          </Button>

                          <Button
                            onClick={() =>
                              setEditingNotes(null)
                            }
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-gray-300"
                          >
                            Cancel
                          </Button>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2 items-start">

                    {appt.status === 'Scheduled' &&
                      !appt.vetId && (
                        <Button
                          onClick={() =>
                            claimAppointment(appt.id)
                          }
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-xs"
                        >
                          Claim
                        </Button>
                      )}

                    {appt.vetId != null && (
                      <Button
                        onClick={() => {
                          setEditingNotes(appt.id);
                          setNotesText(appt.medicalNotes);
                        }}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:text-white text-xs"
                      >
                        Add Notes
                      </Button>
                    )}

                    {appt.status === 'Scheduled' &&
                      appt.vetId && (
                        <Button
                          onClick={() =>
                            updateStatus(
                              appt.id,
                              'In Progress'
                            )
                          }
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}

                    {appt.status === 'In Progress' && (
                      <Button
                        onClick={() =>
                          updateStatus(
                            appt.id,
                            'Completed'
                          )
                        }
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}

                    {(appt.status === 'Scheduled' ||
                      appt.status === 'In Progress') && (
                      <Button
                        onClick={() =>
                          updateStatus(
                            appt.id,
                            'Cancelled'
                          )
                        }
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}

                  </div>
                </div>

              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">
                  No appointments found.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}