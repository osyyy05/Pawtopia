
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
} from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Search, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

interface Animal {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  status: string;
  description: string;
  posted_at: string;
  image?: string;
}

type EditForm = Pick<
  Animal,
  | 'name'
  | 'species'
  | 'breed'
  | 'age'
  | 'gender'
  | 'status'
  | 'description'
>;

const API =
  'http://127.0.0.1:8000/api/adoptions/shelter/animals/';

const statusColor = (status: string) => {
  if (status === 'AVAILABLE') {
    return 'bg-green-600/20 text-green-400';
  }

  if (status === 'ADOPTED') {
    return 'bg-blue-600/20 text-blue-400';
  }

  return 'bg-amber-600/20 text-amber-400';
};

const speciesIcon = (species: string) => {
  const value = species.toLowerCase();

  if (value === 'dog') return '🐕';
  if (value === 'cat') return '🐈';
  if (value === 'bird') return '🐦';
  if (value === 'rabbit') return '🐇';

  return '🐾';
};

export default function ShelterAnimals() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] =
    useState<Animal | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    species: '',
    breed: '',
    age: '',
    gender: '',
    status: '',
    description: '',
  });

  // =====================================================
  // FETCH SHELTER ANIMALS
  // =====================================================

  useEffect(() => {
    const fetchAnimals = async () => {
      const token = sessionStorage.getItem('access_token');

      if (!token) {
        toast.error('Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.detail ||
              'Failed to load animals.'
          );
        }

        setAnimals(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          'Failed to load shelter animals:',
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load animals.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  // =====================================================
  // EDIT ANIMAL
  // =====================================================

  const handleEdit = (animal: Animal) => {
    setSelectedAnimal(animal);

    setEditForm({
      name: animal.name || '',
      species: animal.species || '',
      breed: animal.breed || '',
      age: animal.age || '',
      gender: animal.gender || '',
      status: animal.status || '',
      description: animal.description || '',
    });

    setEditOpen(true);
  };

  // =====================================================
  // SAVE ANIMAL
  // =====================================================

  const handleSave = async () => {
    if (!selectedAnimal || saving) return;

    if (!editForm.name.trim()) {
      toast.error('Animal name is required.');
      return;
    }

    const token = sessionStorage.getItem('access_token');

    if (!token) {
      toast.error('Please login again.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}${selectedAnimal.id}/`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            JSON.stringify(data) ||
            'Failed to update animal.'
        );
      }

      setAnimals((previous) =>
        previous.map((animal) =>
          animal.id === selectedAnimal.id
            ? { ...animal, ...data }
            : animal
        )
      );

      toast.success('Animal updated successfully!');
      setEditOpen(false);
      setSelectedAnimal(null);
    } catch (error) {
      console.error('Failed to update animal:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update animal.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filtered = animals.filter((animal) => {
    const query = search.toLowerCase();

    return (
      (animal.name || '').toLowerCase().includes(query) ||
      (animal.breed || '').toLowerCase().includes(query) ||
      (animal.species || '').toLowerCase().includes(query)
    );
  });

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <p className="text-white text-lg">
            Loading shelter animals...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Shelter Animals
          </h1>

          <p className="text-gray-300">
            View and manage animals currently registered
            under your shelter.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, breed, or species..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Animals Grid */}
        {filtered.length === 0 ? (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-12 text-center">
              <p className="text-5xl mb-4">🐾</p>

              <p className="text-gray-400 text-lg">
                {animals.length === 0
                  ? 'No animals registered in your shelter yet.'
                  : 'No animals found matching your search.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((animal) => (
              <Card
                key={animal.id}
                className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden"
              >
                {/* Animal Image / Icon */}
                <div className="h-48 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 flex items-center justify-center">
                  {animal.image ? (
                    <img
                      src={animal.image}
                      alt={animal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-8xl">
                      {speciesIcon(animal.species)}
                    </span>
                  )}
                </div>

                <CardContent className="p-5">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">
                        {animal.name}
                      </h3>

                      <p className="text-gray-400 text-sm">
                        {animal.breed} · {animal.gender}
                      </p>
                    </div>

                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusColor(
                        animal.status
                      )}`}
                    >
                      {animal.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">
                      Species:{' '}
                      <span className="text-white">
                        {animal.species}
                      </span>
                    </p>

                    <p className="text-gray-400 text-sm">
                      Age:{' '}
                      <span className="text-white">
                        {animal.age}
                      </span>
                    </p>

                    <p className="text-gray-400 text-sm">
                      Added:{' '}
                      <span className="text-white">
                        {animal.posted_at
                          ? new Date(
                              animal.posted_at
                            ).toLocaleDateString()
                          : '-'}
                      </span>
                    </p>
                  </div>

                  {/* Description */}
                  {animal.description && (
                    <p className="text-gray-300 text-sm mt-3 line-clamp-3">
                      {animal.description}
                    </p>
                  )}

                  {/* Edit Button */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <Button
                      onClick={() => handleEdit(animal)}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Animal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* =================================================
          EDIT ANIMAL DIALOG
      ================================================= */}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-gray-950 border-white/20 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Animal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">

            {/* Name */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    name: e.target.value,
                  })
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label>Species</Label>
              <select
                value={editForm.species}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    species: e.target.value,
                  })
                }
                className="w-full rounded-md bg-gray-900 border border-white/20 p-2 text-white"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label>Breed</Label>
              <Input
                value={editForm.breed}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    breed: e.target.value,
                  })
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label>Age</Label>
              <Input
                value={editForm.age}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    age: e.target.value,
                  })
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    gender: e.target.value,
                  })
                }
                className="w-full rounded-md bg-gray-900 border border-white/20 p-2 text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    status: e.target.value,
                  })
                }
                className="w-full rounded-md bg-gray-900 border border-white/20 p-2 text-white"
              >
                <option value="AVAILABLE">Available</option>
                <option value="PENDING">Pending</option>
                <option value="ADOPTED">Adopted</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full rounded-md bg-white/10 border border-white/20 p-3 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
