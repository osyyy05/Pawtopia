import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { authFetch } from '../../utils/authFetch';

import {
  Search,
  MapPin,
  PawPrint,
  Building2,
  Users,
  Heart,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

// =========================================================
// TYPES
// =========================================================

interface AdoptionListing {
  id: number;
  name?: string;
  breed?: string;
  species?: string;
  gender?: string;
  age?: string;
  image?: string;
  shelter?: number | string;
  shelter_name?: string;
  shelterId: string;
  shelterName?: string;
  status?: string;
  adoptionStatus?: string;
  requirements?: string[];
  traits: string[];
  vaccination_status?: string;
  vaccinationStatus?: string;
}

interface Shelter {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  capacity: number;
  currentAnimals: number;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Adoption() {
  const [searchQuery, setSearchQuery] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [shelterFilter, setShelterFilter] = useState('all');

  const [adoptionListings, setAdoptionListings] = useState<
    AdoptionListing[]
  >([]);

  const [shelters, setShelters] = useState<Shelter[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // =========================================================
  // LOAD ADOPTION LISTINGS + SHELTERS
  // =========================================================

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchData = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        setError(
          'Please login to view adoption listings.'
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const [
          animalsResponse,
          sheltersResponse,
        ] = await Promise.all([
          authFetch(
            'http://127.0.0.1:8000/api/adoptions/',
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }
          ),

          authFetch(
            'http://127.0.0.1:8000/api/shelters/',
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            }
          ),
        ]);


        const animalsData =
          await animalsResponse.json();

        const sheltersData =
          await sheltersResponse.json();

        if (!animalsResponse.ok) {
          throw new Error(
            animalsData?.error ||
              animalsData?.detail ||
              'Failed to load adoption listings'
          );
        }

        if (!sheltersResponse.ok) {
          throw new Error(
            sheltersData?.error ||
              sheltersData?.detail ||
              'Failed to load shelters'
          );
        }

        // -----------------------------------------
        // ADOPTION LISTINGS
        // -----------------------------------------

        const realListings: AdoptionListing[] =
          Array.isArray(animalsData)
            ? animalsData.map((pet: any) => ({
                ...pet,

                shelterId: String(pet.shelter),

                shelterName:
                  pet.shelter_name,

                adoptionStatus:
                  pet.status === 'AVAILABLE'
                    ? 'Available'
                    : pet.status,

                traits:
                  Array.isArray(
                    pet.requirements
                  )
                    ? pet.requirements
                    : [],

                vaccinationStatus:
                  pet.vaccination_status ||
                  'Not specified',
              }))
            : [];

        setAdoptionListings(realListings);

        // -----------------------------------------
        // SHELTERS
        // -----------------------------------------

        const realShelters: Shelter[] =
          Array.isArray(sheltersData)
            ? sheltersData.map(
                (shelter: any) => ({
                  id: String(shelter.id),

                  name: shelter.name,

                  address:
                    shelter.address ||
                    'Address unavailable',

                  description:
                    shelter.description ||
                    'Partner shelter',

                  image:
                    shelter.image || '',

                  capacity:
                    shelter.capacity ?? 0,

                  currentAnimals:
                    shelter.current_animals ??
                    0,
                })
              )
            : [];

        setShelters(realShelters);
      } catch (error) {
        console.error(
          'Adoption loading error:',
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load adoption data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredListings = useMemo(() => {
    return adoptionListings.filter((pet) => {
      const query =
        searchQuery.trim().toLowerCase();

      const petName = String(
        pet.name || ''
      ).toLowerCase();

      const breed = String(
        pet.breed || ''
      ).toLowerCase();

      const matchesSearch =
        petName.includes(query) ||
        breed.includes(query);

      const matchesSpecies =
        speciesFilter === 'all' ||
        pet.species === speciesFilter;

      const matchesShelter =
        shelterFilter === 'all' ||
        pet.shelterId === shelterFilter;
      return (
        matchesSearch &&
        matchesSpecies &&
        matchesShelter
      );
    });
  }, [
    adoptionListings,
    searchQuery,
    speciesFilter,
    shelterFilter,
  ]);

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070914] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0d1020] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10">
            <PawPrint className="h-7 w-7 text-red-300" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Unable to load adoption listings
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070914] pb-20 text-white">
      {/* Background glow */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="absolute -right-40 top-[650px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[150px]" />

        <div className="absolute left-1/3 top-[1450px] h-[400px] w-[400px] rounded-full bg-violet-500/[0.05] blur-[140px]" />
      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-12 lg:pt-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/[0.07] px-3.5 py-2">
              <Heart className="h-3.5 w-3.5 text-violet-300" />

              <span className="text-xs font-medium text-violet-200">
                Find a new best friend
              </span>
            </div>

            <h1 className="mt-5 bg-gradient-to-r from-violet-300 via-purple-300 to-cyan-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Pet Adoption
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Meet animals waiting for a loving home
              and discover trusted partner shelters
              across Penang.
            </p>
          </div>

          {/* Filters */}

          <div className="mt-9 rounded-[24px] border border-white/[0.08] bg-[#0d1020]/70 p-4 backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-300" />

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Find your companion
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_0.8fr_1fr]">
              {/* Search */}

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />

                <input
                  type="text"
                  placeholder="Search by pet name or breed..."
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/30 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet-400/10"
                />
              </div>

              {/* Species */}

              <Select
                value={speciesFilter}
                onValueChange={setSpeciesFilter}
              >
                <SelectTrigger className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white hover:bg-white/[0.05] focus:ring-violet-400/20">
                  <SelectValue placeholder="All Species" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={6}
                  className="z-[100] border border-white/10 bg-[#111525] text-white shadow-2xl shadow-black/50"
                >
                  <SelectItem value="all">
                    All Species
                  </SelectItem>

                  <SelectItem value="Dog">
                    Dogs
                  </SelectItem>

                  <SelectItem value="Cat">
                    Cats
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Shelter */}

              <Select
                value={shelterFilter}
                onValueChange={setShelterFilter}
              >
                <SelectTrigger className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white hover:bg-white/[0.05] focus:ring-violet-400/20">
                  <SelectValue placeholder="All Shelters" />
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={6}
                  className="z-[100] border border-white/10 bg-[#111525] text-white shadow-2xl shadow-black/50"
                >
                  <SelectItem value="all">
                    All Shelters
                  </SelectItem>

                  {shelters.map((shelter) => (
                    <SelectItem
                      key={shelter.id}
                      value={shelter.id}
                    >
                      {shelter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* =====================================================
            PARTNER SHELTERS
        ===================================================== */}

        <section>
          <SectionHeading
            eyebrow="Trusted partners"
            title="Our Partner Shelters"
            description="Explore shelters working to give animals a safe place while they wait for their forever homes."
            icon={Building2}
          />

          {!loading && shelters.length === 0 ? (
            <EmptyState
              title="No shelters available"
              description="Partner shelter information is not available at the moment."
            />
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {shelters.map((shelter) => (
                <Link
                  key={shelter.id}
                  to={`/user/adoption/shelter/${shelter.id}`}
                  className="group block"
                >
                  <article className="h-full overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0d1020]/75 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-[#101326] hover:shadow-2xl hover:shadow-black/20">
                    {/* Shelter image */}

                    <div className="relative h-[240px] overflow-hidden bg-[#080b16] sm:h-[270px]">
                      {shelter.image ? (
                        <>
                          <img
                            src={shelter.image}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-2xl"
                          />

                          <img
                            src={shelter.image}
                            alt={shelter.name}
                            className="relative z-[1] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                          />
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Building2 className="h-12 w-12 text-slate-700" />
                        </div>
                      )}

                      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#080b16]/60 via-transparent to-transparent" />

                      <div className="absolute bottom-4 right-4 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-xl transition group-hover:bg-violet-500/30">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Shelter information */}

                    <div className="p-6 sm:p-7">
                      <h3 className="text-xl font-semibold text-white">
                        {shelter.name}
                      </h3>

                      <div className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-400">
                        <MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />

                        <span>
                          {shelter.address}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-400">
                        {shelter.description}
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <StatBox
                          icon={PawPrint}
                          label="Capacity"
                          value={`${shelter.capacity} animals`}
                        />

                        <StatBox
                          icon={Users}
                          label="Current"
                          value={`${shelter.currentAnimals} animals`}
                        />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            AVAILABLE PETS
        ===================================================== */}

        <section>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Waiting for a home"
              title="Available for Adoption"
              description="Meet the pets currently looking for their new family."
              icon={Heart}
            />

            <div className="w-fit rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm text-slate-400">
              <span className="font-semibold text-white">
                {filteredListings.length}
              </span>{' '}
              {filteredListings.length === 1
                ? 'pet'
                : 'pets'}
            </div>
          </div>

          {/* No result */}

          {!loading && filteredListings.length === 0 ? (
            <EmptyState
              title="No pets found"
              description="Try changing your search or filter options to discover more pets."
            />
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((pet) => (
                <Link
                  key={pet.id}
                  to={`/user/adoption/${pet.id}`}
                  className="group block h-full"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#0d1020]/75 transition duration-300 hover:-translate-y-1 hover:border-violet-400/20 hover:bg-[#101326] hover:shadow-2xl hover:shadow-black/20">
                    {/* Pet image */}

                    <div className="relative flex h-[300px] items-center justify-center overflow-hidden bg-[#080b16]">
                      {pet.image ? (
                          <img
                            src={pet.image}
                            alt={pet.name || 'Adoption pet'}
                            className="relative z-[1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                      ) : (
                        <div className="text-center">
                          <PawPrint className="mx-auto h-12 w-12 text-slate-700" />

                          <p className="mt-3 text-xs text-slate-600">
                            No image
                          </p>
                        </div>
                      )}

                      {/* Status */}

                      <div className="absolute right-4 top-4 z-[3]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-xl">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

                          {pet.adoptionStatus ||
                            'Available'}
                        </span>
                      </div>
                    </div>

                    {/* Pet content */}

                    <div className="flex flex-1 flex-col p-6">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate text-2xl font-semibold tracking-tight text-white">
                              {pet.name ||
                                'Unnamed Pet'}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {pet.breed ||
                                'Unknown breed'}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.08] text-violet-300 transition group-hover:bg-violet-400/[0.13]">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Basic information */}

                        <div className="mt-5 flex flex-wrap gap-2">
                          {pet.species && (
                            <PetTag>
                              {pet.species}
                            </PetTag>
                          )}

                          <PetTag>
                            {pet.gender ||
                              'Unknown gender'}
                          </PetTag>

                          <PetTag>
                            {pet.age ||
                              'Unknown age'}
                          </PetTag>
                        </div>

                        {/* Traits */}

                        {pet.traits &&
                          pet.traits.length > 0 && (
                            <div className="mt-5">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Requirements
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {pet.traits.map(
                                  (trait) => (
                                    <span
                                      key={trait}
                                      className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-xs text-cyan-300"
                                    >
                                      {trait}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Bottom */}

                      <div className="mt-auto pt-6">
                        <div className="border-t border-white/[0.07] pt-5">
                          <div className="flex items-start gap-2 text-sm text-slate-400">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />

                            <span className="line-clamp-2">
                              {pet.shelterName ||
                                'Shelter unavailable'}
                            </span>
                          </div>

                          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet-400/15 bg-violet-400/[0.06] px-3 py-1.5 text-xs text-violet-300">
                            <ShieldCheck className="h-3.5 w-3.5" />

                            {pet.vaccinationStatus ||
                              'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// =========================================================
// SECTION HEADING
// =========================================================

function SectionHeading({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: any;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-300" />

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
          {eyebrow}
        </p>
      </div>

      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

// =========================================================
// SHELTER STAT
// =========================================================

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-3.5 w-3.5" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

// =========================================================
// PET TAG
// =========================================================

function PetTag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-slate-400">
      {children}
    </span>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-7 rounded-[24px] border border-dashed border-white/[0.1] bg-white/[0.015] px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/10 bg-violet-400/[0.06]">
        <PawPrint className="h-5 w-5 text-violet-300" />
      </div>

      <h3 className="mt-4 font-semibold text-white">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}