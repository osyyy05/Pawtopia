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
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: string;
  fee: number;
  requirements: string[];
  description: string;
  active: boolean;
  posted_at: string;
  application_count: number;
  status: string;
}

export default function AdoptionListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    species: 'Dog',
    breed: '',
    age: '',
    gender: 'Male',
    fee: 0,
    requirements: '',
    description: '',
    image: '',
  });

  // =========================================================
  // LOAD SHELTER LISTINGS
  // =========================================================

  const fetchListings = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://127.0.0.1:8000/api/adoptions/shelter/animals/',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'SHELTER ADOPTION LISTINGS:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to load adoption listings'
        );
      }

      setListings(
        Array.isArray(data) ? data : []
      );

    } catch (error) {

      console.error(
        'Failed to load listings:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load adoption listings'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filtered = listings.filter((listing) =>
    listing.name
      .toLowerCase()
      .includes(search.toLowerCase()) ||
    listing.breed
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // =========================================================
  // OPEN ADD
  // =========================================================

  const openAdd = () => {
    setEditingId(null);

    setForm({
      name: '',
      species: 'Dog',
      breed: '',
      age: '',
      gender: 'Male',
      fee: 0,
      requirements: '',
      description: '',
      image: '',
    });

    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const openEdit = (listing: Listing) => {
    setEditingId(listing.id);

    setForm({
      name: listing.name,
      species: listing.species,
      breed: listing.breed,
      age: listing.age,
      gender: listing.gender,
      fee: Number(listing.fee),
      requirements: Array.isArray(listing.requirements)
        ? listing.requirements.join(', ')
        : '',
      description: listing.description,
      image: '',
    });

    setShowForm(true);
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSave = async () => {

    if (!form.name.trim() || !form.breed.trim()) {
      toast.error(
        'Please fill in all required fields.'
      );
      return;
    }

    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error(
        'Please login again.'
      );
      return;
    }

    setSaving(true);

    try {

      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim(),
        age: form.age.trim(),
        gender: form.gender,
        fee: Number(form.fee),
        requirements: form.requirements
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        description: form.description.trim(),
        image: form.image.trim(),
        active: true,
        status: 'AVAILABLE',
      };

      let response;

      if (editingId !== null) {

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        response = await fetch(
          `http://127.0.0.1:8000/api/adoptions/shelter/animals/${editingId}/`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

      } else {

        // -------------------------------------------------
        // CREATE
        // -------------------------------------------------

        response = await fetch(
          'http://127.0.0.1:8000/api/adoptions/shelter/animals/create/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      const data = await response.json();

      console.log(
        'SAVE LISTING RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          JSON.stringify(data) ||
          'Failed to save listing'
        );
      }

      toast.success(
        editingId !== null
          ? 'Listing updated!'
          : 'Adoption listing created!'
      );

      setShowForm(false);
      setEditingId(null);

      await fetchListings();

    } catch (error) {

      console.error(
        'Save listing error:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save listing'
      );

    } finally {

      setSaving(false);

    }
  };

  // =========================================================
  // TOGGLE ACTIVE
  // =========================================================

  const toggleActive = async (listing: Listing) => {

    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error(
        'Please login again.'
      );
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/adoptions/shelter/animals/${listing.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            active: !listing.active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update listing visibility'
        );
      }

      toast.success(
        'Listing visibility updated.'
      );

      await fetchListings();

    } catch (error) {

      console.error(
        'Toggle listing error:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update listing'
      );

    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (id: number) => {

    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error(
        'Please login again.'
      );
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to remove this listing?'
      )
    ) {
      return;
    }

    try {

      const response = await fetch(
      `http://127.0.0.1:8000/api/adoptions/shelter/animals/${id}/delete/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to delete listing'
        );
      }

      toast.success(
        'Listing removed.'
      );

      await fetchListings();

    } catch (error) {

      console.error(
        'Delete listing error:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to delete listing'
      );
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <p className="text-white text-lg">
            Loading adoption listings...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="min-h-screen p-8">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Adoption Listings
            </h1>

            <p className="text-gray-300">
              Create and manage public adoption listings for your animals.
            </p>

          </div>

          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>

        </div>


        {/* FORM */}

        {showForm && (

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardHeader>

              <div className="flex items-center justify-between">

                <CardTitle className="text-white">
                  {editingId !== null
                    ? 'Edit Listing'
                    : 'Create Adoption Listing'}
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

                {/* NAME */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Animal Name *
                  </Label>

                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Animal name"
                  />

                </div>


                {/* SPECIES */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Species
                  </Label>

                  <select
                    value={form.species}
                    onChange={(e) =>
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


                {/* BREED */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Breed *
                  </Label>

                  <Input
                    value={form.breed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        breed: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Breed"
                  />

                </div>


                {/* AGE */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Age
                  </Label>

                  <Input
                    value={form.age}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        age: e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g. 2 years"
                  />

                </div>


                {/* GENDER */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Gender
                  </Label>

                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        gender: e.target.value,
                      })
                    }
                    className="w-full h-10 bg-white/10 border border-white/20 text-white rounded-md px-3 text-sm"
                  >

                    <option
                      value="Male"
                      className="bg-gray-800"
                    >
                      Male
                    </option>

                    <option
                      value="Female"
                      className="bg-gray-800"
                    >
                      Female
                    </option>

                  </select>

                </div>


                {/* FEE */}

                <div className="space-y-2">

                  <Label className="text-white">
                    Adoption Fee (RM)
                  </Label>

                  <Input
                    type="number"
                    value={form.fee}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fee: Number(
                          e.target.value
                        ),
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="0"
                  />

                </div>


                {/* REQUIREMENTS */}

                <div className="space-y-2 md:col-span-2">

                  <Label className="text-white">
                    Requirements
                  </Label>

                  <Input
                    value={form.requirements}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        requirements:
                          e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="e.g. Must have fenced yard"
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="space-y-2 md:col-span-2">

                  <Label className="text-white">
                    Description
                  </Label>

                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                    placeholder="Describe the animal's personality and needs"
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
                  disabled={saving}
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
                    : editingId !== null
                      ? 'Update Listing'
                      : 'Create Listing'}
                </Button>

              </div>

            </CardContent>

          </Card>

        )}


        {/* SEARCH */}

        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search listings..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />

        </div>


        {/* LISTINGS */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {filtered.length === 0 ? (

            <div className="md:col-span-2 text-center py-16">

              <p className="text-gray-400 text-lg">
                No adoption listings found.
              </p>

              <p className="text-gray-500 text-sm mt-2">
                Click "Create Listing" to add your first animal.
              </p>

            </div>

          ) : (

            filtered.map((listing) => (

              <Card
                key={listing.id}
                className={`bg-black/40 backdrop-blur-xl border-white/10 ${
                  !listing.active
                    ? 'opacity-60'
                    : ''
                }`}
              >

                <CardContent className="p-5">

                  <div className="flex items-start justify-between mb-3">

                    <div>

                      <h3 className="text-white font-semibold text-lg">
                        {listing.name}
                      </h3>

                      <p className="text-gray-400 text-sm">
                        {listing.breed} · {listing.age} · {listing.gender}
                      </p>

                    </div>

                    <div className="flex flex-col items-end gap-1">

                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          listing.active
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {listing.active
                          ? 'Active'
                          : 'Hidden'}
                      </span>

                      <span className="text-cyan-400 text-sm font-medium">
                        RM {Number(listing.fee).toFixed(2)}
                      </span>

                    </div>

                  </div>


                  <p className="text-gray-300 text-sm mb-2">
                    {listing.description}
                  </p>


                  <p className="text-gray-400 text-xs mb-4">
                    Requirements:{' '}
                    {Array.isArray(
                      listing.requirements
                    )
                      ? listing.requirements.join(', ')
                      : ''}
                  </p>


                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">

                    <span>
                      Posted:{' '}
                      {new Date(
                        listing.posted_at
                      ).toLocaleDateString()}
                    </span>

                    <span>
                      {listing.application_count}{' '}
                      applications
                    </span>

                  </div>


                  <div className="flex gap-2">

                    <Button
                      onClick={() =>
                        openEdit(listing)
                      }
                      variant="outline"
                      className="flex-1 border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>


                    <Button
                      onClick={() =>
                        toggleActive(listing)
                      }
                      variant="outline"
                      className="border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
                    >
                      {listing.active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>


                    <Button
                      onClick={() =>
                        handleDelete(
                          listing.id
                        )
                      }
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                  </div>

                </CardContent>

              </Card>

            ))

          )}

        </div>

      </div>

    </div>
  );
}