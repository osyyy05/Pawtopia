import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Search,
  Sparkles,
  ArrowRight,
  MapPin,
  Clock3,
  PawPrint,
} from 'lucide-react';

interface Animal {
  id: number;
  name: string;
  scientificName: string;
  category: string;
  habitat: string;
  diet: string;
  lifespan: string;
  conservationStatus: string;
  description: string;
  image: string;
  gallery: string[];
  facts: string[];
}

const animalCategoryIcons: Record<string, string> = {
  mammals: '🐾',
  birds: '🐦',
  reptiles: '🦎',
  amphibians: '🐸',
  fish: '🐟',
  insects: '🦋',
};

export default function Encyclopedia() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/animals/')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load animals');
        }

        return response.json();
      })
      .then((data) => {
        const convertedAnimals: Animal[] = data.map((animal: any) => ({
          id: animal.id,
          name: animal.name,
          scientificName: animal.scientific_name,
          category: animal.category,
          habitat: animal.habitat,
          diet: animal.diet,
          lifespan: animal.lifespan,
          conservationStatus: animal.conservation_status,
          description: animal.description,
          image: animal.image,
          gallery: animal.gallery,
          facts: animal.facts,
        }));

        setAnimals(convertedAnimals);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load animals from the server.');
      });
  }, []);

  const animalCategories = Array.from(
    new Set(animals.map((animal) => animal.category))
  ).map((category) => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    icon: animalCategoryIcons[category] || '🐾',
  }));

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch =
      animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.scientificName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || animal.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStatusStyle = (status: string) => {
    if (status.includes('Critically')) {
      return 'border-red-400/20 bg-red-400/10 text-red-300';
    }

    if (status.includes('Endangered')) {
      return 'border-orange-400/20 bg-orange-400/10 text-orange-300';
    }

    if (status.includes('Vulnerable')) {
      return 'border-yellow-400/20 bg-yellow-400/10 text-yellow-200';
    }

    return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070914] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute -right-32 top-[420px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Hero */}
      <section className="relative border-b border-white/[0.07]">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.08] px-4 py-2 text-sm text-violet-200">
              <Sparkles className="h-4 w-4" />
              Discover the animal kingdom
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Animal{' '}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Encyclopedia
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Explore Malaysia&apos;s diverse wildlife, discover fascinating
              animal facts, and learn more about their habitats and
              conservation.
            </p>
          </div>

          {/* Search */}
          <div className="mt-9 max-w-3xl">
            <div className="group relative">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-500/40 to-cyan-400/30 opacity-60 blur-[1px] transition group-focus-within:opacity-100" />

              <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#0d1020]/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
                <Search className="ml-5 h-5 w-5 shrink-0 text-slate-500" />

                <input
                  type="text"
                  placeholder="Search animals by name or scientific name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-slate-500 sm:text-base"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mr-4 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-8 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {!error && (
          <>
            {/* Categories */}
            <section>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                    Browse
                  </p>

                  <h2 className="text-2xl font-semibold tracking-tight">
                    Explore by category
                  </h2>
                </div>

                <p className="hidden text-sm text-slate-500 sm:block">
                  {animals.length} animals in the encyclopedia
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                    selectedCategory === 'all'
                      ? 'border-violet-400/40 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 shadow-lg shadow-violet-950/20'
                      : 'border-white/[0.08] bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]'
                  }`}
                >
                  <div className="text-2xl">🌍</div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <span className="text-sm font-medium text-white">All</span>

                    <span className="text-xs text-slate-500">
                      {animals.length}
                    </span>
                  </div>
                </button>

                {animalCategories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'border-violet-400/40 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 shadow-lg shadow-violet-950/20'
                        : 'border-white/[0.08] bg-white/[0.035] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]'
                    }`}
                  >
                    <div className="text-2xl">{category.icon}</div>

                    <div className="mt-4 flex items-end justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {category.name}
                      </span>

                      <span className="text-xs text-slate-500">
                        {
                          animals.filter(
                            (animal) => animal.category === category.id
                          ).length
                        }
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Results */}
            <section className="mt-14">
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Discover
                  </p>

                  <h2 className="text-2xl font-semibold tracking-tight">
                    {selectedCategory === 'all'
                      ? 'All Animals'
                      : animalCategories.find(
                          (category) => category.id === selectedCategory
                        )?.name}
                  </h2>
                </div>

                <div className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs text-slate-400">
                  {filteredAnimals.length}{' '}
                  {filteredAnimals.length === 1 ? 'result' : 'results'}
                </div>
              </div>

              {/* Animal Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAnimals.map((animal) => (
                  <Link
                    key={animal.id}
                    to={`/user/encyclopedia/${animal.id}`}
                    className="group"
                  >
                    <article className="h-full overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0d1020]/80 transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/30 hover:shadow-2xl hover:shadow-violet-950/20">
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                        <img
                          src={animal.image}
                          alt={animal.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1020] via-transparent to-transparent opacity-80" />

                        <div className="absolute left-4 top-4">
                          <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium capitalize text-white backdrop-blur-md">
                            {animalCategoryIcons[animal.category] || '🐾'}{' '}
                            {animal.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-semibold text-white transition group-hover:text-violet-200">
                              {animal.name}
                            </h3>

                            <p className="mt-1 truncate text-sm italic text-slate-500">
                              {animal.scientificName}
                            </p>
                          </div>

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] transition group-hover:border-violet-400/30 group-hover:bg-violet-400/10">
                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-300" />
                          </div>
                        </div>

                        <div className="mt-5">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-medium ${getStatusStyle(
                              animal.conservationStatus
                            )}`}
                          >
                            {animal.conservationStatus}
                          </span>
                        </div>

                        <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-6 text-slate-400">
                          {animal.description}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-5">
                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/[0.08]">
                              <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                Habitat
                              </p>

                              <p className="truncate text-xs text-slate-300">
                                {animal.habitat.split(',')[0]}
                              </p>
                            </div>
                          </div>

                          <div className="flex min-w-0 items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-400/[0.08]">
                              <Clock3 className="h-3.5 w-3.5 text-violet-300" />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-wider text-slate-600">
                                Lifespan
                              </p>

                              <p className="truncate text-xs text-slate-300">
                                {animal.lifespan}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Empty state */}
              {filteredAnimals.length === 0 && (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10">
                    <PawPrint className="h-6 w-6 text-violet-300" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    No animals found
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Try another animal name or select a different category.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}