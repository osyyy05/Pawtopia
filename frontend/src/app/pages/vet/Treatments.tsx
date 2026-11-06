import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Plus,
  Search,
  X,
  Stethoscope,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Treatment {
  id: string;
  petName: string;
  species: string;
  ownerName: string;
  type: string;
  description: string;
  startDate: string;
  endDate: string;
  medications: string;
  status: 'Active' | 'Completed' | 'On Hold';
  vet: string;
  progress: string;
}

interface TreatmentApiRecord {
  id: number;
  animal: number | null;
  animal_name: string;
  vet: number | null;
  vet_name: string;
  owner: number | null;
  pet_name: string;
  species: string;
  owner_name: string;
  treatment_type: string;
  description: string;
  start_date: string;
  end_date: string | null;
  medications: string;
  progress: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  created_at: string;
  updated_at: string;
}

const API_BASE = 'http://127.0.0.1:8000';

const statusColor = (status: string) => {
  if (status === 'Completed') {
    return 'bg-green-600/20 text-green-400';
  }

  if (status === 'Active') {
    return 'bg-blue-600/20 text-blue-400';
  }

  return 'bg-amber-600/20 text-amber-400';
};

const convertStatus = (
  status: TreatmentApiRecord['status']
): Treatment['status'] => {
  if (status === 'COMPLETED') {
    return 'Completed';
  }

  if (status === 'ON_HOLD') {
    return 'On Hold';
  }

  return 'Active';
};

export default function Treatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'All' | 'Active' | 'Completed' | 'On Hold'
  >('All');

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    petName: '',
    species: 'Dog',
    ownerName: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    medications: '',
    progress: '',
  });

  const getToken = () => {
    return sessionStorage.getItem('access_token');
  };

  const mapTreatment = (
    treatment: TreatmentApiRecord
  ): Treatment => ({
    id: String(treatment.id),

    petName:
      treatment.pet_name ||
      treatment.animal_name ||
      'Unknown Pet',

    species:
      treatment.species ||
      'Unknown',

    ownerName:
      treatment.owner_name ||
      'Unknown Owner',

    type:
      treatment.treatment_type ||
      'Treatment',

    description:
      treatment.description ||
      '',

    startDate:
      treatment.start_date ||
      '',

    endDate:
      treatment.end_date ||
      '',

    medications:
      treatment.medications ||
      '',

    status:
      convertStatus(treatment.status),

    vet:
      treatment.vet_name ||
      'Unknown Vet',

    progress:
      treatment.progress ||
      '',
  });

  const loadTreatments = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/appointments/vet/treatments/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to load treatment records.'
        );
      }

      const converted: Treatment[] =
        Array.isArray(data)
          ? data.map(mapTreatment)
          : [];

      setTreatments(converted);
    } catch (error) {
      console.error(
        'Failed to load treatment records:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load treatment records.'
      );

      setTreatments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, []);

  const filtered = treatments.filter(treatment => {
    const searchText =
      search.toLowerCase();

    const matchSearch =
      treatment.petName
        .toLowerCase()
        .includes(searchText) ||
      treatment.ownerName
        .toLowerCase()
        .includes(searchText) ||
      treatment.type
        .toLowerCase()
        .includes(searchText);

    const matchFilter =
      filter === 'All' ||
      treatment.status === filter;

    return matchSearch && matchFilter;
  });

  const handleSave = async () => {
    if (
      !form.petName ||
      !form.type ||
      !form.startDate
    ) {
      toast.error('Fill in required fields.');
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_BASE}/api/appointments/vet/treatments/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            pet_name: form.petName,
            species: form.species,
            owner_name: form.ownerName,
            treatment_type: form.type,
            description: form.description,
            start_date: form.startDate,
            end_date: form.endDate || null,
            medications: form.medications,
            progress: form.progress,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Treatment save error:',
          data
        );

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to save treatment record.'
        );
      }

      setTreatments(prev => [
        mapTreatment(data),
        ...prev,
      ]);

      toast.success(
        'Treatment record added!'
      );

      setShowForm(false);

      setForm({
        petName: '',
        species: 'Dog',
        ownerName: '',
        type: '',
        description: '',
        startDate: '',
        endDate: '',
        medications: '',
        progress: '',
      });
    } catch (error) {
      console.error(
        'Failed to save treatment record:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save treatment record.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (
    id: string,
    newStatus: Treatment['status']
  ) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    const backendStatus =
      newStatus === 'Active'
        ? 'ACTIVE'
        : newStatus === 'Completed'
        ? 'COMPLETED'
        : 'ON_HOLD';

    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/vet/treatments/${id}/status/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
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
          'Failed to update treatment status.'
        );
      }

      setTreatments(prev =>
        prev.map(treatment =>
          treatment.id === id
            ? mapTreatment(data)
            : treatment
        )
      );

      toast.success(
        `Treatment status updated to ${newStatus}.`
      );
    } catch (error) {
      console.error(
        'Failed to update treatment status:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update treatment status.'
      );
    }
  };

  const deleteTreatment = async (id: string) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    const confirmed = window.confirm(
      'Delete this treatment record?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/vet/treatments/${id}/delete/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(
          () => null
        );

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to delete treatment record.'
        );
      }

      setTreatments(prev =>
        prev.filter(treatment => treatment.id !== id)
      );

      toast.success(
        'Treatment record deleted.'
      );
    } catch (error) {
      console.error(
        'Failed to delete treatment record:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete treatment record.'
      );
    }
  };

  const counts = {
    All: treatments.length,

    Active: treatments.filter(
      treatment =>
        treatment.status === 'Active'
    ).length,

    Completed: treatments.filter(
      treatment =>
        treatment.status === 'Completed'
    ).length,

    'On Hold': treatments.filter(
      treatment =>
        treatment.status === 'On Hold'
    ).length,
  };

  return (
    <div className="min-h-screen p-8">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Treatments
            </h1>

            <p className="text-gray-300">
              Track and update ongoing and completed treatment records.
            </p>
          </div>

          <Button
            onClick={() =>
              setShowForm(!showForm)
            }
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Treatment
          </Button>

        </div>

        {/* ADD TREATMENT FORM */}
        {showForm && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardHeader>

              <div className="flex items-center justify-between">

                <CardTitle className="text-white">
                  New Treatment Record
                </CardTitle>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  <X className="w-5 h-5" />
                </Button>

              </div>

            </CardHeader>

            <CardContent>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label className="text-white">
                    Pet Name *
                  </Label>

                  <Input
                    value={form.petName}
                    onChange={e =>
                      setForm({
                        ...form,
                        petName: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Pet name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Species
                  </Label>

                  <select
                    value={form.species}
                    onChange={e =>
                      setForm({
                        ...form,
                        species: e.target.value,
                      })
                    }
                    className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-md px-3 text-sm"
                  >
                    <option
                      value="Dog"
                      className="bg-gray-800"
                    >
                      Dog
                    </option>

                    <option
                      value="Cat"
                      className="bg-gray-800"
                    >
                      Cat
                    </option>

                    <option
                      value="Bird"
                      className="bg-gray-800"
                    >
                      Bird
                    </option>

                    <option
                      value="Rabbit"
                      className="bg-gray-800"
                    >
                      Rabbit
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Owner Name
                  </Label>

                  <Input
                    value={form.ownerName}
                    onChange={e =>
                      setForm({
                        ...form,
                        ownerName: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Owner name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Treatment Type *
                  </Label>

                  <Input
                    value={form.type}
                    onChange={e =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g. Post-surgery Recovery"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Start Date *
                  </Label>

                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={e =>
                      setForm({
                        ...form,
                        startDate: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    End Date
                  </Label>

                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={e =>
                      setForm({
                        ...form,
                        endDate: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">
                    Description
                  </Label>

                  <Textarea
                    value={form.description}
                    onChange={e =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                    placeholder="Treatment description"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">
                    Medications
                  </Label>

                  <Input
                    value={form.medications}
                    onChange={e =>
                      setForm({
                        ...form,
                        medications: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Medications prescribed"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">
                    Initial Progress Notes
                  </Label>

                  <Input
                    value={form.progress}
                    onChange={e =>
                      setForm({
                        ...form,
                        progress: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Progress notes"
                  />
                </div>

              </div>

              <div className="flex gap-3 mt-6">

                <Button
                  onClick={() =>
                    setShowForm(false)
                  }
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-300"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Treatment'}
                </Button>

              </div>

            </CardContent>
          </Card>
        )}

        {/* FILTERS */}
        <div className="flex gap-2 flex-wrap">

          {(
            [
              'All',
              'Active',
              'Completed',
              'On Hold',
            ] as const
          ).map(f => (
            <Button
              key={f}
              onClick={() =>
                setFilter(f)
              }
              variant={
                filter === f
                  ? 'default'
                  : 'outline'
              }
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
            onChange={e =>
              setSearch(e.target.value)
            }
            placeholder="Search treatments..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />

        </div>

        {/* TREATMENTS */}
        <div className="space-y-4">

          {loading ? (

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">
                  Loading treatment records...
                </p>
              </CardContent>
            </Card>

          ) : (

            <>
              {filtered.map(t => (

                <Card
                  key={t.id}
                  className="bg-black/40 backdrop-blur-xl border-white/10"
                >
                  <CardContent className="p-5">

                    <div className="flex flex-col md:flex-row gap-4">

                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center shrink-0">

                        <Stethoscope className="w-6 h-6 text-white" />

                      </div>

                      <div className="flex-1">

                        <div className="flex items-center gap-2 flex-wrap mb-1">

                          <h3 className="text-white font-semibold">

                            {t.petName}{' '}

                            <span className="text-gray-400 font-normal text-sm">
                              ({t.species})
                            </span>

                          </h3>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${statusColor(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>

                        </div>

                        <p className="text-gray-400 text-sm">
                          Owner:{' '}
                          <span className="text-white">
                            {t.ownerName || 'Not specified'}
                          </span>{' '}
                          · Vet: {t.vet}
                        </p>

                        <p className="text-cyan-400 text-sm font-medium">
                          {t.type}
                        </p>

                        {t.description && (
                          <p className="text-gray-300 text-sm mt-1">
                            {t.description}
                          </p>
                        )}

                        {t.medications && (
                          <p className="text-amber-400 text-xs mt-1">
                            💊 {t.medications}
                          </p>
                        )}

                        <p className="text-gray-500 text-xs mt-1">
                          {t.startDate}{' '}
                          →{' '}
                          {t.endDate || 'Ongoing'}
                        </p>

                        {t.progress && (
                          <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                            <p className="text-white text-sm">
                              {t.progress}
                            </p>
                          </div>
                        )}

                      </div>

                      <div className="flex flex-wrap gap-2 items-start shrink-0">

                        {t.status === 'Active' && (
                          <>
                            <Button
                              onClick={() =>
                                updateStatus(
                                  t.id,
                                  'Completed'
                                )
                              }
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Complete
                            </Button>

                            <Button
                              onClick={() =>
                                updateStatus(
                                  t.id,
                                  'On Hold'
                                )
                              }
                              size="sm"
                              variant="outline"
                              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs"
                            >
                              Hold
                            </Button>
                          </>
                        )}

                        {t.status === 'On Hold' && (
                          <Button
                            onClick={() =>
                              updateStatus(
                                t.id,
                                'Active'
                              )
                            }
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            Resume
                          </Button>
                        )}

                        <Button
                          onClick={() =>
                            deleteTreatment(t.id)
                          }
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          title="Delete treatment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                      </div>

                    </div>

                  </CardContent>
                </Card>

              ))}

              {filtered.length === 0 && (
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardContent className="p-12 text-center">

                    <Stethoscope className="w-10 h-10 mx-auto mb-3 text-gray-500" />

                    <p className="text-gray-400">
                      No treatment records found.
                    </p>

                  </CardContent>

                </Card>
              )}

            </>

          )}

        </div>

      </div>
    </div>
  );
}