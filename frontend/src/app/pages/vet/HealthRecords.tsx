import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Search, X, FileHeart, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface HealthRecord {
  id: string;
  petName: string;
  species: string;
  breed: string;
  ownerName: string;
  ownerPhone: string;
  dob: string;
  weight: string;
  condition: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  nextVisit: string;
  visitDate: string;
  vet: string;
}

interface HealthRecordApi {
  id: number;
  animal: number | null;
  animal_name: string;
  vet: number | null;
  vet_name: string;
  owner: number | null;
  owner_name: string;
  pet_name: string;
  breed: string;
  date_of_birth: string | null;
  visit_date: string;
  weight: string;
  condition: string;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  next_visit: string | null;
  created_at: string;
  updated_at: string;
}

const API_BASE = 'http://127.0.0.1:8000';

export default function HealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    petName: '',
    species: 'Dog',
    breed: '',
    ownerName: '',
    ownerPhone: '',
    dob: '',
    weight: '',
    condition: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    nextVisit: '',
  });

  const getToken = () => sessionStorage.getItem('access_token');

  const mapRecord = (record: HealthRecordApi): HealthRecord => ({
    id: String(record.id),
    petName: record.pet_name || record.animal_name || '',
    species: '',
    breed: record.breed || '',
    ownerName: record.owner_name || '',
    ownerPhone: '',
    dob: record.date_of_birth || '',
    weight: record.weight || '',
    condition: record.condition || '',
    diagnosis: record.diagnosis || '',
    treatment: record.treatment || '',
    prescriptions: record.prescriptions || '',
    nextVisit: record.next_visit || '',
    visitDate: record.visit_date || '',
    vet: record.vet_name || '',
  });

  const loadRecords = async () => {
    const token = getToken();

    if (!token) {
      toast.error('Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/appointments/vet/health-records/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (response.status === 403) {
          toast.error('Vet access required.');
        } else {
          toast.error('Failed to load health records.');
        }

        return;
      }

      const data: HealthRecordApi[] = await response.json();
      setRecords(data.map(mapRecord));
    } catch (error) {
      console.error('Failed to load health records:', error);
      toast.error('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filtered = records.filter((record) =>
    record.petName.toLowerCase().includes(search.toLowerCase()) ||
    record.ownerName.toLowerCase().includes(search.toLowerCase()) ||
    record.condition.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.petName || !form.ownerName || !form.diagnosis) {
      toast.error('Please fill required fields.');
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/appointments/vet/health-records/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pet_name: form.petName,
            breed: form.breed,
            date_of_birth: form.dob || null,
            visit_date: new Date().toISOString().split('T')[0],
            weight: form.weight,
            condition: form.condition,
            diagnosis: form.diagnosis,
            treatment: form.treatment,
            prescriptions: form.prescriptions,
            next_visit: form.nextVisit || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Health record error:', data);
        toast.error('Failed to save health record.');
        return;
      }

      setRecords((prev) => [mapRecord(data), ...prev]);

      toast.success('Health record added!');
      setShowForm(false);

      setForm({
        petName: '',
        species: 'Dog',
        breed: '',
        ownerName: '',
        ownerPhone: '',
        dob: '',
        weight: '',
        condition: '',
        diagnosis: '',
        treatment: '',
        prescriptions: '',
        nextVisit: '',
      });
    } catch (error) {
      console.error('Failed to save health record:', error);
      toast.error('Unable to connect to the server.');
    }
  };

  const conditionColor = (condition: string) => {
    if (condition === 'Healthy') return 'bg-green-600/20 text-green-400';
    if (condition === 'Post-surgery') return 'bg-blue-600/20 text-blue-400';
    if (condition === 'Critical') return 'bg-red-600/20 text-red-400';
    return 'bg-amber-600/20 text-amber-400';
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Health Records
            </h1>

            <p className="text-gray-300">
              Maintain comprehensive medical records for all patients.
            </p>
          </div>

          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medical Record
          </Button>
        </div>

        {showForm && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  New Health Record
                </CardTitle>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setShowForm(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label className="text-white">Pet Name *</Label>
                  <Input
                    value={form.petName}
                    onChange={(e) =>
                      setForm({ ...form, petName: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Pet name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Species</Label>

                  <select
                    value={form.species}
                    onChange={(e) =>
                      setForm({ ...form, species: e.target.value })
                    }
                    className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-md px-3 text-sm"
                  >
                    <option value="Dog" className="bg-gray-800">Dog</option>
                    <option value="Cat" className="bg-gray-800">Cat</option>
                    <option value="Bird" className="bg-gray-800">Bird</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Breed</Label>
                  <Input
                    value={form.breed}
                    onChange={(e) =>
                      setForm({ ...form, breed: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Breed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Weight</Label>
                  <Input
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g. 25kg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Owner Name *</Label>
                  <Input
                    value={form.ownerName}
                    onChange={(e) =>
                      setForm({ ...form, ownerName: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Owner name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Owner Phone</Label>
                  <Input
                    value={form.ownerPhone}
                    onChange={(e) =>
                      setForm({ ...form, ownerPhone: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="01X-XXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.dob}
                    onChange={(e) =>
                      setForm({ ...form, dob: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Condition</Label>
                  <Input
                    value={form.condition}
                    onChange={(e) =>
                      setForm({ ...form, condition: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g. Healthy, Recovering"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Diagnosis *</Label>
                  <Textarea
                    value={form.diagnosis}
                    onChange={(e) =>
                      setForm({ ...form, diagnosis: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                    placeholder="Clinical diagnosis"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Treatment</Label>
                  <Textarea
                    value={form.treatment}
                    onChange={(e) =>
                      setForm({ ...form, treatment: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                    placeholder="Treatment plan"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Prescriptions</Label>
                  <Input
                    value={form.prescriptions}
                    onChange={(e) =>
                      setForm({ ...form, prescriptions: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Medications prescribed"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Next Visit Date</Label>
                  <Input
                    type="date"
                    value={form.nextVisit}
                    onChange={(e) =>
                      setForm({ ...form, nextVisit: e.target.value })
                    }
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-gray-300"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  Save Record
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pet, owner, or condition..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-4">

          {loading ? (
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">Loading health records...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filtered.map((record) => (
                <Card
                  key={record.id}
                  className="bg-black/40 backdrop-blur-xl border-white/10"
                >
                  <CardContent className="p-5">

                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() =>
                        setExpanded(
                          expanded === record.id ? null : record.id
                        )
                      }
                    >
                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shrink-0">
                          <FileHeart className="w-6 h-6 text-white" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">
                              {record.petName}
                            </h3>

                            {record.condition && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${conditionColor(
                                  record.condition
                                )}`}
                              >
                                {record.condition}
                              </span>
                            )}
                          </div>

                          <p className="text-gray-400 text-sm">
                            {record.breed || 'Breed not specified'} · Owner:{' '}
                            {record.ownerName || 'Not specified'}
                          </p>

                          <p className="text-gray-500 text-xs">
                            Visit: {record.visitDate} · Vet: {record.vet}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400"
                      >
                        {expanded === record.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </div>

                    {expanded === record.id && (
                      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                          <p className="text-gray-400 text-xs">Weight</p>
                          <p className="text-white">
                            {record.weight || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">
                            Date of Birth
                          </p>
                          <p className="text-white">
                            {record.dob || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">
                            Owner Phone
                          </p>
                          <p className="text-white">
                            {record.ownerPhone || '—'}
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs">
                            Next Visit
                          </p>
                          <p className="text-cyan-400">
                            {record.nextVisit || '—'}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-xs">Diagnosis</p>
                          <p className="text-white">
                            {record.diagnosis}
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <p className="text-gray-400 text-xs">Treatment</p>
                          <p className="text-white">
                            {record.treatment || '—'}
                          </p>
                        </div>

                        {record.prescriptions && (
                          <div className="md:col-span-2">
                            <p className="text-gray-400 text-xs">
                              Prescriptions
                            </p>
                            <p className="text-amber-400">
                              {record.prescriptions}
                            </p>
                          </div>
                        )}

                      </div>
                    )}

                  </CardContent>
                </Card>
              ))}

              {filtered.length === 0 && (
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-400">
                      No health records found.
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