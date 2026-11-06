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
import {
  Plus,
  Search,
  X,
  Syringe,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface VaccinationRecord {
  id: string;
  petName: string;
  species: string;
  ownerName: string;
  ownerPhone: string;
  vaccine: string;
  dateGiven: string;
  nextDueDate: string;
  batchNumber: string;
  administeredBy: string;
  status: 'Up to date' | 'Due soon' | 'Overdue';
}

interface VaccinationApiRecord {
  id: number;
  animal: number | null;
  animal_name: string;
  vet: number | null;
  vet_name: string;
  owner: number | null;
  pet_name: string;
  species: string;
  owner_name: string;
  owner_phone: string;
  vaccine: string;
  date_given: string;
  next_due_date: string | null;
  batch_number: string;
  administered_by: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = 'http://127.0.0.1:8000';

const statusColor = (status: string) => {
  if (status === 'Up to date') {
    return 'bg-green-600/20 text-green-400';
  }

  if (status === 'Due soon') {
    return 'bg-amber-600/20 text-amber-400';
  }

  return 'bg-red-600/20 text-red-400';
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'Up to date') {
    return (
      <CheckCircle className="w-4 h-4 text-green-400" />
    );
  }

  if (status === 'Overdue') {
    return (
      <AlertCircle className="w-4 h-4 text-red-400" />
    );
  }

  return (
    <AlertCircle className="w-4 h-4 text-amber-400" />
  );
};

const calculateStatus = (
  nextDueDate: string | null | undefined
): VaccinationRecord['status'] => {
  if (!nextDueDate) {
    return 'Up to date';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${nextDueDate}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  const difference =
    dueDate.getTime() - today.getTime();

  const daysUntilDue =
    difference / (1000 * 60 * 60 * 24);

  if (daysUntilDue < 0) {
    return 'Overdue';
  }

  if (daysUntilDue <= 30) {
    return 'Due soon';
  }

  return 'Up to date';
};

export default function Vaccinations() {
  const [records, setRecords] = useState<VaccinationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<
    'All' | 'Up to date' | 'Due soon' | 'Overdue'
  >('All');

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    petName: '',
    species: 'Dog',
    ownerName: '',
    ownerPhone: '',
    vaccine: '',
    dateGiven: '',
    nextDueDate: '',
    batchNumber: '',
    administeredBy: '',
  });

  const getToken = () => {
    return sessionStorage.getItem('access_token');
  };

  const mapRecord = (
    record: VaccinationApiRecord
  ): VaccinationRecord => ({
    id: String(record.id),
    petName:
      record.pet_name ||
      record.animal_name ||
      'Unknown Pet',
    species: record.species || 'Unknown',
    ownerName: record.owner_name || 'Unknown Owner',
    ownerPhone: record.owner_phone || '',
    vaccine: record.vaccine || '',
    dateGiven: record.date_given || '',
    nextDueDate: record.next_due_date || '',
    batchNumber: record.batch_number || '',
    administeredBy:
      record.administered_by ||
      record.vet_name ||
      'Unknown',
    status: calculateStatus(record.next_due_date),
  });

  const loadRecords = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/appointments/vet/vaccinations/`,
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
          'Failed to load vaccination records.'
        );
      }

      const converted: VaccinationRecord[] =
        Array.isArray(data)
          ? data.map(mapRecord)
          : [];

      setRecords(converted);
    } catch (error) {
      console.error(
        'Failed to load vaccination records:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load vaccination records.'
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleSave = async () => {
    if (
      !form.petName ||
      !form.vaccine ||
      !form.dateGiven
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
        `${API_BASE}/api/appointments/vet/vaccinations/`,
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
            owner_phone: form.ownerPhone,
            vaccine: form.vaccine,
            date_given: form.dateGiven,
            next_due_date:
              form.nextDueDate || null,
            batch_number: form.batchNumber,
            administered_by:
              form.administeredBy || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          'Vaccination save error:',
          data
        );

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to save vaccination record.'
        );
      }

      setRecords(prev => [
        mapRecord(data),
        ...prev,
      ]);

      toast.success(
        'Vaccination record added!'
      );

      setShowForm(false);

      setForm({
        petName: '',
        species: 'Dog',
        ownerName: '',
        ownerPhone: '',
        vaccine: '',
        dateGiven: '',
        nextDueDate: '',
        batchNumber: '',
        administeredBy: '',
      });
    } catch (error) {
      console.error(
        'Failed to save vaccination record:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save vaccination record.'
      );
    } finally {
      setSaving(false);
    }
  };

  const markAdministered = async (id: string) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/vet/vaccinations/${id}/administered/`,
        {
          method: 'POST',
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
          'Failed to mark vaccination as administered.'
        );
      }

      setRecords(prev =>
        prev.map(record =>
          record.id === id
            ? mapRecord(data)
            : record
        )
      );

      toast.success(
        'Vaccination marked as administered.'
      );
    } catch (error) {
      console.error(
        'Failed to mark vaccination administered:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update vaccination.'
      );
    }
  };

  const deleteRecord = async (id: string) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    const confirmed = window.confirm(
      'Delete this vaccination record?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/vet/vaccinations/${id}/delete/`,
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
          'Failed to delete vaccination record.'
        );
      }

      setRecords(prev =>
        prev.filter(record => record.id !== id)
      );

      toast.success(
        'Vaccination record deleted.'
      );
    } catch (error) {
      console.error(
        'Failed to delete vaccination record:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete vaccination record.'
      );
    }
  };

  const filtered = records.filter(record => {
    const searchText =
      search.toLowerCase();

    const matchSearch =
      record.petName
        .toLowerCase()
        .includes(searchText) ||
      record.ownerName
        .toLowerCase()
        .includes(searchText) ||
      record.vaccine
        .toLowerCase()
        .includes(searchText);

    const matchFilter =
      filter === 'All' ||
      record.status === filter;

    return matchSearch && matchFilter;
  });

  const counts = {
    All: records.length,

    'Up to date': records.filter(
      record =>
        record.status === 'Up to date'
    ).length,

    'Due soon': records.filter(
      record =>
        record.status === 'Due soon'
    ).length,

    Overdue: records.filter(
      record =>
        record.status === 'Overdue'
    ).length,
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Vaccinations
            </h1>

            <p className="text-gray-300">
              Manage vaccination records and track upcoming due dates.
            </p>
          </div>

          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vaccination
          </Button>

        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">

          {(
            [
              'Up to date',
              'Due soon',
              'Overdue',
            ] as const
          ).map(status => (
            <Card
              key={status}
              className="bg-black/40 backdrop-blur-xl border-white/10"
            >
              <CardContent className="p-4 flex items-center gap-3">

                <StatusIcon status={status} />

                <div>
                  <p className="text-2xl font-bold text-white">
                    {counts[status]}
                  </p>

                  <p className="text-gray-400 text-xs">
                    {status}
                  </p>
                </div>

              </CardContent>
            </Card>
          ))}

        </div>

        {/* Add Vaccination Form */}
        {showForm && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardHeader>

              <div className="flex items-center justify-between">

                <CardTitle className="text-white">
                  New Vaccination Record
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
                    Owner Phone
                  </Label>

                  <Input
                    value={form.ownerPhone}
                    onChange={e =>
                      setForm({
                        ...form,
                        ownerPhone: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="01X-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Vaccine *
                  </Label>

                  <select
                    value={form.vaccine}
                    onChange={e =>
                      setForm({
                        ...form,
                        vaccine: e.target.value,
                      })
                    }
                    className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-md px-3 text-sm"
                  >
                    <option
                      value=""
                      className="bg-gray-800"
                    >
                      Select vaccine
                    </option>

                    <option
                      value="DHPP"
                      className="bg-gray-800"
                    >
                      DHPP (Distemper, Hepatitis, Parvo)
                    </option>

                    <option
                      value="Rabies"
                      className="bg-gray-800"
                    >
                      Rabies
                    </option>

                    <option
                      value="Bordetella"
                      className="bg-gray-800"
                    >
                      Bordetella
                    </option>

                    <option
                      value="FVRCP"
                      className="bg-gray-800"
                    >
                      FVRCP (Cat combo)
                    </option>

                    <option
                      value="FeLV"
                      className="bg-gray-800"
                    >
                      FeLV (Feline Leukemia)
                    </option>

                    <option
                      value="Leptospirosis"
                      className="bg-gray-800"
                    >
                      Leptospirosis
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Batch Number
                  </Label>

                  <Input
                    value={form.batchNumber}
                    onChange={e =>
                      setForm({
                        ...form,
                        batchNumber: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Batch/lot number"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Date Given *
                  </Label>

                  <Input
                    type="date"
                    value={form.dateGiven}
                    onChange={e =>
                      setForm({
                        ...form,
                        dateGiven: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">
                    Next Due Date
                  </Label>

                  <Input
                    type="date"
                    value={form.nextDueDate}
                    onChange={e =>
                      setForm({
                        ...form,
                        nextDueDate: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">
                    Administered By
                  </Label>

                  <Input
                    value={form.administeredBy}
                    onChange={e =>
                      setForm({
                        ...form,
                        administeredBy: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Leave blank to use your vet account"
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
                    : 'Save Record'}
                </Button>

              </div>

            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">

          {(
            [
              'All',
              'Up to date',
              'Due soon',
              'Overdue',
            ] as const
          ).map(filterName => (
            <Button
              key={filterName}
              onClick={() =>
                setFilter(filterName)
              }
              variant={
                filter === filterName
                  ? 'default'
                  : 'outline'
              }
              className={
                filter === filterName
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                  : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5'
              }
            >
              {filterName}{' '}
              <span className="ml-1 text-xs opacity-70">
                ({counts[filterName]})
              </span>
            </Button>
          ))}

        </div>

        {/* Search */}
        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
            placeholder="Search by pet, owner, or vaccine..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />

        </div>

        {/* Records */}
        <div className="space-y-3">

          {loading ? (

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">
                  Loading vaccination records...
                </p>
              </CardContent>
            </Card>

          ) : (

            <>
              {filtered.map(record => (

                <Card
                  key={record.id}
                  className="bg-black/40 backdrop-blur-xl border-white/10"
                >
                  <CardContent className="p-5">

                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shrink-0">
                        <Syringe className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1">

                        <div className="flex items-center gap-2 flex-wrap mb-1">

                          <h3 className="text-white font-semibold">
                            {record.petName}
                          </h3>

                          <span className="text-gray-400 text-sm">
                            ({record.species})
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${statusColor(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>

                        </div>

                        <p className="text-gray-400 text-sm">
                          Owner:{' '}
                          <span className="text-white">
                            {record.ownerName}
                          </span>
                          {' · '}
                          {record.ownerPhone || 'No phone'}
                        </p>

                        <p className="text-gray-400 text-sm">
                          Vaccine:{' '}
                          <span className="text-cyan-400 font-medium">
                            {record.vaccine}
                          </span>
                          {' · Batch: '}
                          {record.batchNumber || '—'}
                        </p>

                        <p className="text-gray-500 text-xs mt-1">
                          Given: {record.dateGiven || '—'}
                          {' · '}
                          Next due:{' '}
                          <span
                            className={
                              record.status === 'Overdue'
                                ? 'text-red-400'
                                : record.status === 'Due soon'
                                ? 'text-amber-400'
                                : 'text-gray-400'
                            }
                          >
                            {record.nextDueDate || '—'}
                          </span>
                          {' · '}
                          {record.administeredBy || '—'}
                        </p>

                      </div>

                      <div className="flex gap-2 shrink-0">

                        {record.status !== 'Up to date' && (
                          <Button
                            onClick={() =>
                              markAdministered(record.id)
                            }
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Done
                          </Button>
                        )}

                        <Button
                          onClick={() =>
                            deleteRecord(record.id)
                          }
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          title="Delete record"
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

                    <Syringe className="w-10 h-10 mx-auto mb-3 text-gray-500" />

                    <p className="text-gray-400">
                      No vaccination records found.
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