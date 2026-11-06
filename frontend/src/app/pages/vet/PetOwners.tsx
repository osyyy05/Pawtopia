import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Search,
  User,
  Phone,
  Mail,
  PawPrint,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:8000';

interface Appointment {
  id: number;
  adopter: number | null;
  adopter_name: string;
  adopter_email: string;
  owner_phone: string;
  animal_name: string | null;
  pet_name: string;
  species: string;
  date: string;
  time: string;
}

interface Pet {
  name: string;
  species: string;
  lastVisit: string;
  nextVisit: string;
}

interface PetOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalVisits: number;
  firstVisit: string;
  pets: Pet[];
}

export default function PetOwners() {
  const [owners, setOwners] = useState<PetOwner[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () =>
    sessionStorage.getItem('access_token');

  useEffect(() => {
    const loadOwners = async () => {
      const token = getToken();

      if (!token) {
        toast.error('Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/appointments/vet/`,
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
            'Failed to load pet owners.'
          );
        }

        const appointments: Appointment[] =
          Array.isArray(data) ? data : [];

        /*
         * Group appointments by adopter.
         * This means one owner with multiple appointments
         * will only appear once.
         */
        const ownerMap = new Map<string, PetOwner>();

        appointments.forEach((appointment) => {
          const ownerId = appointment.adopter
            ? String(appointment.adopter)
            : `${appointment.adopter_name}-${appointment.adopter_email}`;

          if (!ownerMap.has(ownerId)) {
            ownerMap.set(ownerId, {
              id: ownerId,
              name:
                appointment.adopter_name ||
                'Unknown Owner',
              email:
                appointment.adopter_email || '',
              phone:
                appointment.owner_phone || '',
              totalVisits: 0,
              firstVisit: appointment.date || '',
              pets: [],
            });
          }

          const owner = ownerMap.get(ownerId)!;

          owner.totalVisits += 1;

          /*
           * Keep the earliest appointment date
           * as the owner's first recorded visit.
           */
          if (
            appointment.date &&
            (
              !owner.firstVisit ||
              appointment.date < owner.firstVisit
            )
          ) {
            owner.firstVisit = appointment.date;
          }

          const petName =
            appointment.animal_name ||
            appointment.pet_name ||
            'Unknown Pet';

          const existingPet = owner.pets.find(
            (pet) => pet.name === petName
          );

          if (!existingPet) {
            owner.pets.push({
              name: petName,
              species:
                appointment.species ||
                'Unknown',
              lastVisit:
                appointment.date || '',
              nextVisit: '',
            });
          } else if (
            appointment.date >
            existingPet.lastVisit
          ) {
            existingPet.lastVisit =
              appointment.date;
          }
        });

        const convertedOwners =
          Array.from(ownerMap.values())
            .sort((a, b) =>
              a.name.localeCompare(b.name)
            );

        setOwners(convertedOwners);
      } catch (error) {
        console.error(
          'Failed to load pet owners:',
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load pet owners.'
        );

        setOwners([]);
      } finally {
        setLoading(false);
      }
    };

    loadOwners();
  }, []);

  const filtered = owners.filter((owner) => {
    const searchText =
      search.toLowerCase();

    return (
      owner.name
        .toLowerCase()
        .includes(searchText) ||
      owner.email
        .toLowerCase()
        .includes(searchText) ||
      owner.pets.some((pet) =>
        pet.name
          .toLowerCase()
          .includes(searchText)
      )
    );
  });

  const totalPets = owners.reduce(
    (sum, owner) =>
      sum + owner.pets.length,
    0
  );

  const totalVisits = owners.reduce(
    (sum, owner) =>
      sum + owner.totalVisits,
    0
  );

  const averageVisits =
    owners.length > 0
      ? Math.round(
          totalVisits / owners.length
        )
      : 0;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Pet Owners
          </h1>

          <p className="text-gray-300">
            View pet owners who have appointments with you.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center gap-3">

              <User className="w-8 h-8 text-purple-400" />

              <div>
                <p className="text-2xl font-bold text-white">
                  {owners.length}
                </p>

                <p className="text-gray-400 text-xs">
                  Total Owners
                </p>
              </div>

            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center gap-3">

              <PawPrint className="w-8 h-8 text-cyan-400" />

              <div>
                <p className="text-2xl font-bold text-white">
                  {totalPets}
                </p>

                <p className="text-gray-400 text-xs">
                  Registered Pets
                </p>
              </div>

            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {averageVisits}
                </span>
              </div>

              <div>
                <p className="text-2xl font-bold text-white">
                  {totalVisits}
                </p>

                <p className="text-gray-400 text-xs">
                  Total Visits
                </p>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Search */}
        <div className="relative">

          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by owner or pet name..."
            className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-gray-500"
          />

        </div>

        {/* Owners */}
        <div className="space-y-4">

          {loading ? (

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400">
                  Loading pet owners...
                </p>
              </CardContent>
            </Card>

          ) : (

            <>
              {filtered.map((owner) => (

                <Card
                  key={owner.id}
                  className="bg-black/40 backdrop-blur-xl border-white/10"
                >
                  <CardContent className="p-5">

                    {/* Owner Header */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() =>
                        setExpanded(
                          expanded === owner.id
                            ? null
                            : owner.id
                        )
                      }
                    >

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">

                          <span className="text-white font-bold text-lg">
                            {owner.name
                              ? owner.name[0].toUpperCase()
                              : '?'}
                          </span>

                        </div>

                        <div>

                          <h3 className="text-white font-semibold text-lg">
                            {owner.name}
                          </h3>

                          <div className="flex items-center gap-4 mt-1 flex-wrap">

                            {owner.email && (
                              <span className="flex items-center gap-1 text-gray-400 text-sm">
                                <Mail className="w-3 h-3" />
                                {owner.email}
                              </span>
                            )}

                            {owner.phone && (
                              <span className="flex items-center gap-1 text-gray-400 text-sm">
                                <Phone className="w-3 h-3" />
                                {owner.phone}
                              </span>
                            )}

                          </div>

                          <div className="flex items-center gap-3 mt-1">

                            <span className="text-xs text-gray-500">
                              {owner.pets.length} pet(s)
                            </span>

                            <span className="text-xs text-gray-500">
                              {owner.totalVisits} visit(s)
                            </span>

                            {owner.firstVisit && (
                              <span className="text-xs text-gray-500">
                                First visit: {owner.firstVisit}
                              </span>
                            )}

                          </div>

                        </div>

                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 shrink-0"
                      >
                        {expanded === owner.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>

                    </div>

                    {/* Expanded Pets */}
                    {expanded === owner.id && (

                      <div className="mt-4 pt-4 border-t border-white/10">

                        <h4 className="text-white text-sm font-medium mb-3">
                          Registered Pets
                        </h4>

                        {owner.pets.length === 0 ? (

                          <p className="text-gray-500 text-sm">
                            No pet information available.
                          </p>

                        ) : (

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                            {owner.pets.map(
                              (pet, index) => (

                                <div
                                  key={`${pet.name}-${index}`}
                                  className="p-3 bg-white/5 rounded-lg border border-white/10"
                                >

                                  <div className="flex items-center gap-2 mb-2">

                                    <span className="text-lg">
                                      {pet.species === 'Dog'
                                        ? '🐕'
                                        : pet.species === 'Cat'
                                        ? '🐈'
                                        : pet.species === 'Rabbit'
                                        ? '🐇'
                                        : '🐾'}
                                    </span>

                                    <div>

                                      <p className="text-white font-medium">
                                        {pet.name}
                                      </p>

                                      <p className="text-gray-400 text-xs">
                                        {pet.species}
                                      </p>

                                    </div>

                                  </div>

                                  <p className="text-gray-500 text-xs">
                                    Last visit:{' '}
                                    <span className="text-gray-400">
                                      {pet.lastVisit || '—'}
                                    </span>
                                  </p>

                                  {pet.nextVisit ? (
                                    <p className="text-gray-500 text-xs">
                                      Next visit:{' '}
                                      <span className="text-cyan-400">
                                        {pet.nextVisit}
                                      </span>
                                    </p>
                                  ) : (
                                    <p className="text-gray-500 text-xs">
                                      Next visit:{' '}
                                      <span className="text-gray-600">
                                        Not scheduled
                                      </span>
                                    </p>
                                  )}

                                </div>

                              )
                            )}

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
                    <User className="w-10 h-10 mx-auto mb-3 text-gray-500" />

                    <p className="text-gray-400">
                      No pet owners found.
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