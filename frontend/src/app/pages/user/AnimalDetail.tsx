import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Utensils,
  Clock3,
  Shield,
  Video,
  Sparkles,
  PawPrint,
  LoaderCircle,
  Ruler,
  Heart,
  Baby,
  Globe2,
  TriangleAlert,
  Leaf,
  Images,
} from 'lucide-react';

interface Animal {
  id: number;
  name: string;
  scientific_name: string;
  category: string;
  habitat: string;
  diet: string;
  lifespan: string;
  conservation_status: string;
  description: string;

  // Old URL fields
  image: string;
  gallery: string[];

  // Uploaded file fields
  image_file: string | null;
  gallery_files: string[];

  // Other information
  facts: string[];
  video: string | null;

  physical_characteristics: string;
  behaviour: string;
  reproduction: string;
  geographic_range: string;
  conservation_threats: string;
  ecosystem_role: string;
}

const animalCategoryIcons: Record<string, string> = {
  mammals: '🐾',
  birds: '🐦',
  reptiles: '🦎',
  amphibians: '🐸',
  fish: '🐟',
  insects: '🦋',
};

export default function AnimalDetail() {
  const { id } = useParams();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [galleryStart, setGalleryStart] = useState(0);

    useEffect(() => {
      // Always start from the top when opening another animal
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant',
      });

      const fetchAnimal = async () => {
        try {
          setLoading(true);
          setError('');

        const response = await fetch(
          `http://127.0.0.1:8000/api/animals/${id}/`
        );

        if (!response.ok) {
          throw new Error('Animal not found');
        }

        const data = await response.json();

        setAnimal(data);
        setGalleryStart(0);
      } catch (err) {
        console.error(err);
        setError('Unable to load animal information.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnimal();
    }
  }, [id]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070914]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10">
            <LoaderCircle className="h-7 w-7 animate-spin text-violet-300" />
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Loading animal information...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error || !animal) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070914] px-4">
        <div className="w-full max-w-md rounded-[24px] border border-white/[0.08] bg-[#0d1020] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10">
            <PawPrint className="h-6 w-6 text-red-300" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Animal unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error || 'Animal not found'}
          </p>

          <Link
            to="/user/encyclopedia"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Encyclopedia
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // IMAGE + GALLERY
  // ==========================================

  const mainImage = animal.image_file || animal.image;

  const galleryImages = [
    ...(animal.gallery_files || []),
    ...(animal.gallery || []),
  ].filter(Boolean);

  const visibleGalleryImages = galleryImages.slice(
    galleryStart,
    galleryStart + 3
  );

  const canGoLeft = galleryStart > 0;
  const canGoRight = galleryStart + 3 < galleryImages.length;

  const handleGalleryLeft = () => {
    if (canGoLeft) {
      setGalleryStart((prev) => prev - 1);
    }
  };

  const handleGalleryRight = () => {
    if (canGoRight) {
      setGalleryStart((prev) => prev + 1);
    }
  };

  // ==========================================
  // STATUS STYLE
  // ==========================================

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

  // ==========================================
  // MORE INFORMATION
  // ==========================================

  const informationSections = [
    {
      title: 'Physical Characteristics',
      value: animal.physical_characteristics,
      icon: Ruler,
    },
    {
      title: 'Behaviour',
      value: animal.behaviour,
      icon: Heart,
    },
    {
      title: 'Reproduction',
      value: animal.reproduction,
      icon: Baby,
    },
    {
      title: 'Geographic Range',
      value: animal.geographic_range,
      icon: Globe2,
    },
    {
      title: 'Conservation & Threats',
      value: animal.conservation_threats,
      icon: TriangleAlert,
    },
    {
      title: 'Role in Ecosystem',
      value: animal.ecosystem_role,
      icon: Leaf,
    },
  ].filter((section) => section.value);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070914] pb-20 text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[450px] w-[450px] rounded-full bg-violet-600/10 blur-[130px]" />

        <div className="absolute -right-40 top-[650px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.08] blur-[140px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* ==========================================
            BACK BUTTON
        ========================================== */}

        <Link
          to="/user/encyclopedia"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Encyclopedia
        </Link>

        {/* ==========================================
            MAIN SPLIT LAYOUT
        ========================================== */}

        <section className="mt-7">
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            {/* LEFT - MAIN IMAGE */}
            <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d1020] shadow-2xl shadow-black/20">
              <div className="relative flex h-[430px] items-center justify-center overflow-hidden bg-[#080b16] sm:h-[500px] lg:h-[560px]">
                {/* Blurred background */}
                {mainImage && (
                  <img
                    src={mainImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-3xl"
                  />
                )}

                <div className="absolute inset-0 bg-black/20" />

                {/* Complete animal image */}
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={animal.name}
                    className="relative z-[1] h-full w-full object-contain"
                  />
                ) : (
                  <div className="relative z-[1] text-center">
                    <PawPrint className="mx-auto h-8 w-8 text-slate-600" />

                    <p className="mt-3 text-sm text-slate-500">
                      No image available
                    </p>
                  </div>
                )}

                {/* Category */}
                <div className="absolute left-5 top-5 z-[2]">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium capitalize text-white backdrop-blur-xl">
                    {animalCategoryIcons[animal.category] || '🐾'}

                    <span className="ml-2">
                      {animal.category}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT - INFORMATION */}
            <div className="space-y-5">
              {/* Identity */}
              <div className="rounded-[28px] border border-white/[0.08] bg-[#0d1020]/80 p-6 backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />

                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Pawtopia Encyclopedia
                  </p>
                </div>

                <h1 className="mt-4 break-words text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {animal.name}
                </h1>

                <p className="mt-2 break-words text-lg italic text-slate-400">
                  {animal.scientific_name}
                </p>

                <div className="mt-6">
                  <span
                    className={`inline-flex rounded-full border px-4 py-2 text-xs font-medium ${getStatusStyle(
                      animal.conservation_status
                    )}`}
                  >
                    {animal.conservation_status}
                  </span>
                </div>
              </div>

              {/* Information cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoCard
                  icon={MapPin}
                  label="Habitat"
                  value={animal.habitat}
                  tone="cyan"
                />

                <InfoCard
                  icon={Utensils}
                  label="Diet"
                  value={animal.diet}
                  tone="violet"
                />

                <InfoCard
                  icon={Clock3}
                  label="Lifespan"
                  value={animal.lifespan}
                  tone="violet"
                />

                <InfoCard
                  icon={Shield}
                  label="Conservation"
                  value={animal.conservation_status}
                  tone="cyan"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            DESCRIPTION
        ========================================== */}

        <section className="mt-10 rounded-[28px] border border-white/[0.08] bg-[#0d1020]/70 p-6 backdrop-blur-xl sm:p-8 lg:p-10">
          <SectionHeading
            eyebrow="About this animal"
            title={`Meet the ${animal.name}`}
            description="Learn more about this species and its characteristics."
            icon={PawPrint}
          />

          <p className="mt-7 whitespace-pre-line text-base leading-8 text-slate-300">
            {animal.description}
          </p>
        </section>

        {/* ==========================================
            GALLERY
        ========================================== */}

        {galleryImages.length > 0 && (
          <section className="mt-10 rounded-[28px] border border-white/[0.08] bg-[#0d1020]/70 p-6 backdrop-blur-xl sm:p-8">
            <SectionHeading
              eyebrow="Explore"
              title="Gallery"
              description="A closer look at this species."
              icon={Images}
            />

            <div className="relative mt-7">
              {/* Left */}
              {canGoLeft && (
                <button
                  type="button"
                  onClick={handleGalleryLeft}
                  aria-label="Previous gallery image"
                  className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              {/* Right */}
              {canGoRight && (
                <button
                  type="button"
                  onClick={handleGalleryRight}
                  aria-label="Next gallery image"
                  className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {visibleGalleryImages.map((image, index) => (
                  <div
                    key={`${image}-${galleryStart}-${index}`}
                    className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080b16]"
                  >
                    <img
                      src={image}
                      alt={`${animal.name} ${galleryStart + index + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {galleryImages.length > 3 && (
              <div className="mt-5 flex justify-center">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-xs text-slate-500">
                  Showing {galleryStart + 1}–
                  {Math.min(
                    galleryStart + 3,
                    galleryImages.length
                  )}{' '}
                  of {galleryImages.length}
                </span>
              </div>
            )}
          </section>
        )}

        {/* ==========================================
            VIDEO
        ========================================== */}

        {animal.video && (
          <section className="mt-10 rounded-[28px] border border-white/[0.08] bg-[#0d1020]/70 p-6 backdrop-blur-xl sm:p-8">
            <SectionHeading
              eyebrow="Watch & learn"
              title="Species Video"
              description={`Discover more about the ${animal.name}.`}
              icon={Video}
            />

            <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
              <video
                controls
                preload="metadata"
                className="max-h-[650px] w-full object-contain"
              >
                <source
                  src={animal.video}
                  type={
                    animal.video
                      .toLowerCase()
                      .endsWith('.webm')
                      ? 'video/webm'
                      : 'video/mp4'
                  }
                />

                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}

        {/* ==========================================
            MORE INFORMATION
        ========================================== */}

        {informationSections.length > 0 && (
          <section className="mt-14">
            <SectionHeading
              eyebrow="Learn more"
              title="More About the Species"
              description="Detailed information about its biology, behaviour, distribution and ecological importance."
              icon={Sparkles}
            />

            <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2">
              {informationSections.map((section) => {
                const Icon = section.icon;

                return (
                  <article
                    key={section.title}
                    className="rounded-[24px] border border-white/[0.08] bg-[#0d1020]/70 p-6 transition duration-300 hover:border-violet-400/20 hover:bg-[#101326]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.08]">
                      <Icon className="h-5 w-5 text-violet-300" />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold text-white">
                      {section.title}
                    </h3>

                    <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-400">
                      {section.value}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ==========================================
            INTERESTING FACTS
        ========================================== */}

        <section className="mt-14 overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-violet-500/[0.08] via-[#0d1020] to-cyan-400/[0.06] p-6 sm:p-8 lg:p-10">
          <SectionHeading
            eyebrow="Did you know?"
            title="Interesting Facts"
            description={`Quick facts about the ${animal.name}.`}
            icon={Sparkles}
          />

          {animal.facts && animal.facts.length > 0 ? (
            <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
              {animal.facts.map((fact, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-black/10 p-5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/15 bg-cyan-400/[0.08] text-xs font-semibold text-cyan-300">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <p className="break-words pt-1 text-sm leading-6 text-slate-300">
                    {fact}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
              No interesting facts are available yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ==========================================
// INFORMATION CARD
// ==========================================

function InfoCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: 'cyan' | 'violet';
}) {
  const toneClasses =
    tone === 'cyan'
      ? 'bg-cyan-400/[0.08] text-cyan-300'
      : 'bg-violet-400/[0.08] text-violet-300';

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-[#0d1020]/80 p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm leading-6 text-slate-200">
        {value || 'Not available'}
      </p>
    </div>
  );
}

// ==========================================
// SECTION HEADING
// ==========================================

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