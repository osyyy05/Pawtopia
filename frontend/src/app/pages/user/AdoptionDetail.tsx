import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Heart,
  PawPrint,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Images,
  LoaderCircle,
  Home,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

// =========================================================
// MAIN COMPONENT
// =========================================================

export default function AdoptionDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [galleryStart, setGalleryStart] = useState(0);

  const [formData, setFormData] = useState({
    fullName: user?.username || '',
    email: user?.email || '',
    phone: '',
    address: '',
    reason: '',
  });

  // =========================================================
  // LOAD PET
  // =========================================================

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPet = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        setError('Please login again.');
        setLoading(false);
        return;
      }

      if (!id) {
        setError('Pet not found.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `http://127.0.0.1:8000/api/adoptions/${id}/`,
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
          'ADOPTION DETAIL API RESPONSE:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.detail ||
              'Failed to load pet details'
          );
        }

        const realPet = {
          ...data,

          shelterId: String(data.shelter),

          shelterName:
            data.shelter_name || 'Shelter',

          adoptionStatus:
            data.status === 'AVAILABLE'
              ? 'Available'
              : data.status,

          traits: Array.isArray(data.requirements)
            ? data.requirements
            : [],

          vaccinationStatus:
            data.vaccination_status ||
            'Not specified',

          medicalHistory:
            data.medical_history ||
            'No medical history provided.',

          gallery: Array.isArray(data.gallery)
            ? data.gallery
            : data.image
              ? [data.image]
              : [],
        };

        setPet(realPet);
        setGalleryStart(0);
      } catch (error) {
        console.error(
          'Failed to load pet:',
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load pet details'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // =========================================================
  // KEEP USER INFORMATION UPDATED
  // =========================================================

  
  useEffect(() => {
    if (!dialogOpen) return;

    const controller = new AbortController();

    const loadLatestProfile = async () => {
      setProfileLoading(true);
      setFormErrors({});

      try {
        const accessToken =
          sessionStorage.getItem('access_token');

        if (!accessToken) {
          throw new Error('Please login again.');
        }

        const response = await fetch(
          'http://127.0.0.1:8000/api/profile/',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load your latest profile.');
        }

        const profile = await response.json();

        if (controller.signal.aborted) return;

        setFormData({
          fullName: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          reason: '',
        });
      } catch (error) {
        if (controller.signal.aborted) return;

        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load profile.'
        );

        setDialogOpen(false);
      } finally {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      }
    };

    loadLatestProfile();

    return () => controller.abort();
  }, [dialogOpen]);

  // =========================================================
  // SUBMIT ADOPTION APPLICATION
  // =========================================================

  const validateApplication = () => {
    const errors: Record<string, string> = {};

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const address = formData.address.trim();
    const reason = formData.reason.trim();

    if (!fullName) {
      errors.fullName = 'Full name is required.';
    } else if (!/^[A-Za-z ]+$/.test(fullName)) {
      errors.fullName = 'Full name must contain letters only.';
    } else if (fullName.length > 100) {
      errors.fullName = 'Full name must not exceed 100 characters.';
    }

    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');

    if (!cleanPhone) {
      errors.phone = 'Phone number is required.';
    } else if (!/^(?:\+?60|0)1\d{8,9}$/.test(cleanPhone)) {
      errors.phone = 'Please enter a valid Malaysian mobile number.';
    }

    if (!address) {
      errors.address = 'Home address is required.';
    } else if (address.length > 500) {
      errors.address = 'Address must not exceed 500 characters.';
    }

    if (reason.length < 5) {
      errors.reason = 'Please enter at least 5 characters.';
    } else if (reason.length > 1000) {
      errors.reason = 'Reason must not exceed 1000 characters.';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please correct the highlighted fields.');
      return false;
    }

    return true;
  };

  const handleSubmitApplication = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (submitting || profileLoading) return;

    if (!validateApplication()) return;

    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error(
        'Please login again before submitting an application.'
      );
      return;
    }

    if (!id) {
      toast.error(
        'Animal information not found.'
      );
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/adoptions/${id}/apply/`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },

          body: JSON.stringify({
            full_name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            reason: formData.reason,
          }),
        }
      );

      const data = await response.json();

      console.log(
        'ADOPTION APPLICATION RESPONSE:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.detail ||
            'Failed to submit adoption application.'
        );
      }

      toast.success(
        `Adoption application for ${pet.name} submitted successfully!`
      );

      setDialogOpen(false);

      setFormData({
        fullName: user?.username || '',
        email: user?.email || '',
        phone: '',
        address: '',
        reason: '',
      });

      setTimeout(() => {
        navigate('/user/adoption');
      }, 1500);
    } catch (error) {
      console.error(
        'Adoption application failed:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit adoption application.'
      );
    }
    finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070914]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10">
            <LoaderCircle className="h-7 w-7 animate-spin text-violet-300" />
          </div>

          <p className="mt-5 text-sm text-slate-400">
            Loading pet details...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error || !pet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070914] px-4">
        <div className="w-full max-w-md rounded-[28px] border border-white/[0.08] bg-[#0d1020] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10">
            <PawPrint className="h-7 w-7 text-red-300" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Pet unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {error || 'Pet not found'}
          </p>

          <Link
            to="/user/adoption"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm text-white transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Adoption
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================
  // GALLERY
  // =========================================================

  const galleryImages = Array.isArray(
    pet.gallery
  )
    ? pet.gallery.filter(Boolean)
    : [];

  const visibleGalleryImages =
    galleryImages.slice(
      galleryStart,
      galleryStart + 3
    );

  const canGoLeft =
    galleryStart > 0;

  const canGoRight =
    galleryStart + 3 <
    galleryImages.length;

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070914] pb-20 text-white">
      {/* Background Glow */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-10 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="absolute -right-40 top-[700px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[150px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Back Button */}

        <Link
          to="/user/adoption"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Adoption
        </Link>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="mt-7">
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Pet Image */}

            <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d1020] shadow-2xl shadow-black/20">
              <div className="relative h-[430px] overflow-hidden bg-[#080b16] sm:h-[500px] lg:h-[560px]">
                {pet.image ? (
                  <img
                    src={pet.image}
                    alt={pet.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <PawPrint className="mx-auto h-12 w-12 text-slate-700" />

                      <p className="mt-3 text-sm text-slate-600">
                        No image available
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                <div className="absolute left-5 top-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-black/60 px-4 py-2 text-xs font-medium text-emerald-300 backdrop-blur-xl">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />

                    {pet.adoptionStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Pet Information */}

            <div className="space-y-5">
              <div className="rounded-[28px] border border-white/[0.08] bg-[#0d1020]/80 p-6 backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />

                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Meet your new companion
                  </p>
                </div>

                <h1 className="mt-4 break-words text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {pet.name}
                </h1>

                <p className="mt-2 text-lg text-slate-400">
                  {pet.breed ||
                    'Breed not specified'}
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <InfoBox
                    label="Species"
                    value={
                      pet.species ||
                      'Not specified'
                    }
                  />

                  <InfoBox
                    label="Age"
                    value={
                      pet.age ||
                      'Not specified'
                    }
                  />

                  <InfoBox
                    label="Gender"
                    value={
                      pet.gender ||
                      'Not specified'
                    }
                  />

                  <InfoBox
                    label="Vaccination"
                    value={
                      pet.vaccinationStatus ||
                      'Not specified'
                    }
                  />
                </div>
              </div>

              {/* Current Shelter */}

              <div className="rounded-[24px] border border-white/[0.08] bg-[#0d1020]/70 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/[0.07]">
                    <MapPin className="h-5 w-5 text-cyan-300" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Current Shelter
                    </p>

                    <p className="mt-1 font-medium text-slate-200">
                      {pet.shelterName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Available for adoption now
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            CONTENT + ADOPTION SIDEBAR
        ===================================================== */}

        <section className="mt-10 grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT CONTENT */}

          <div className="space-y-7">
            {/* About */}

            <ContentCard>
              <SectionHeading
                eyebrow="About this pet"
                title={`Meet ${pet.name}`}
                description="Learn more about their personality and background."
                icon={PawPrint}
              />

              <p className="mt-7 whitespace-pre-line text-base leading-8 text-slate-300">
                {pet.description ||
                  'No description is available for this pet yet.'}
              </p>
            </ContentCard>

            {/* Personality */}

            <ContentCard>
              <SectionHeading
                eyebrow="Personality"
                title="Personality Traits"
                description={`A few things to know about ${pet.name}.`}
                icon={Heart}
              />

              {pet.traits &&
              pet.traits.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {pet.traits.map(
                    (trait: string) => (
                      <span
                        key={trait}
                        className="rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-3.5 py-2 text-sm text-cyan-300"
                      >
                        {trait}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-500">
                  No personality information is
                  available yet.
                </p>
              )}
            </ContentCard>

            {/* Medical */}

            <ContentCard>
              <SectionHeading
                eyebrow="Health information"
                title="Medical History"
                description="Important health information provided by the shelter."
                icon={Stethoscope}
              />

              <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                  <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
                    {pet.medicalHistory}
                  </p>
                </div>
              </div>
            </ContentCard>

            {/* Gallery */}

            {galleryImages.length > 0 && (
              <ContentCard>
                <SectionHeading
                  eyebrow="More moments"
                  title="More Photos"
                  description={`See more photos of ${pet.name}.`}
                  icon={Images}
                />

                <div className="relative mt-7">
                  {canGoLeft && (
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryStart(
                          (previous) =>
                            previous - 1
                        )
                      }
                      className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                      aria-label="Previous image"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}

                  {canGoRight && (
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryStart(
                          (previous) =>
                            previous + 1
                        )
                      }
                      className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md transition hover:bg-black"
                      aria-label="Next image"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleGalleryImages.map(
                      (
                        image: string,
                        index: number
                      ) => (
                        <div
                          key={`${image}-${galleryStart}-${index}`}
                          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080b16]"
                        >
                          <img
                            src={image}
                            alt={`${pet.name} ${
                              galleryStart +
                              index +
                              1
                            }`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>

                {galleryImages.length > 3 && (
                  <div className="mt-5 flex justify-center">
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-xs text-slate-500">
                      Showing{' '}
                      {galleryStart + 1}–
                      {Math.min(
                        galleryStart + 3,
                        galleryImages.length
                      )}{' '}
                      of {galleryImages.length}
                    </span>
                  </div>
                )}
              </ContentCard>
            )}
          </div>

          {/* ===================================================
              RIGHT - ADOPTION ONLY
          =================================================== */}

          <aside className="space-y-5 lg:sticky lg:top-24">
            {/* Adoption Application Card */}

            <div className="overflow-hidden rounded-[28px] border border-violet-400/15 bg-gradient-to-br from-violet-500/[0.09] via-[#0d1020] to-cyan-400/[0.05] p-6 shadow-2xl shadow-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/[0.08]">
                <Heart className="h-5 w-5 text-violet-300" />
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-white">
                Ready to Adopt?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Give {pet.name} a loving home.
                Submit your application to begin the
                adoption process.
              </p>

              {/* Application Dialog */}

              <Dialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:brightness-110"
                  >
                    <Heart className="h-4 w-4" />
                    Submit Adoption Application
                  </button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/[0.1] bg-[#0d1020] text-white shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-white">
                      Adoption Application for{' '}
                      {pet.name}
                    </DialogTitle>

                    <DialogDescription className="leading-6 text-slate-400">
                      Please fill out this form to
                      apply for adoption. The shelter
                      will review your application
                      and contact you after reviewing
                      it.
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    onSubmit={
                      handleSubmitApplication
                    }
                    className="mt-3 space-y-5"
                  >
                    {/* Name + Email */}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        label="Full Name"
                        htmlFor="name"
                      >
                        <Input
                          id="name"
                          required
                          value={
                            formData.fullName
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName:
                                e.target.value,
                            })
                          }
                          className="h-11 border-white/[0.1] bg-white/[0.045] text-white placeholder:text-slate-600 focus-visible:ring-violet-400/30"
                        />
                      </FormField>

                      <FormField
                        label="Email"
                        htmlFor="email"
                      >
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email:
                                e.target.value,
                            })
                          }
                          className="h-11 border-white/[0.1] bg-white/[0.045] text-white placeholder:text-slate-600 focus-visible:ring-violet-400/30"
                        />
                      </FormField>
                    </div>

                    {/* Phone */}

                    <FormField
                      label="Phone Number"
                      htmlFor="phone"
                    >
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone:
                              e.target.value,
                          })
                        }
                        className="h-11 border-white/[0.1] bg-white/[0.045] text-white placeholder:text-slate-600 focus-visible:ring-violet-400/30"
                      />
                    </FormField>

                    {/* Address */}

                    <FormField
                      label="Address"
                      htmlFor="address"
                    >
                      <Textarea
                        id="address"
                        required
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            address:
                              e.target.value,
                          })
                        }
                        rows={3}
                        className="resize-none border-white/[0.1] bg-white/[0.045] text-white placeholder:text-slate-600 focus-visible:ring-violet-400/30"
                      />
                    </FormField>

                    {/* Reason */}

                    <FormField
                      label={`Why do you want to adopt ${pet.name}?`}
                      htmlFor="reason"
                    >
                      <Textarea
                        id="reason"
                        required
                        value={formData.reason}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            reason:
                              e.target.value,
                          })
                        }
                        rows={4}
                        className="resize-none border-white/[0.1] bg-white/[0.045] text-white placeholder:text-slate-600 focus-visible:ring-violet-400/30"
                      />
                    </FormField>

                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <Heart className="h-4 w-4" />
                      Submit Application
                    </button>
                  </form>
                </DialogContent>
              </Dialog>

              {/* =================================================
                  ADOPTION PROCESS
              ================================================= */}

              <div className="mt-7 border-t border-white/[0.08] pt-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  What happens next?
                </p>

                <div className="mt-5 space-y-5">
                  <AdoptionStep
                    number="01"
                    title="Submit your application"
                    description="Provide your details and tell the shelter why you would like to adopt."
                  />

                  <AdoptionStep
                    number="02"
                    title="Shelter review"
                    description="The shelter reviews your application and decides whether to approve or reject it."
                  />

                  <AdoptionStep
                    number="03"
                    title="Meet & Greet"
                    description="If approved, you can arrange a visit to meet the pet at the shelter."
                    last
                  />
                </div>
              </div>
            </div>

            {/* Shelter Summary */}

            <div className="rounded-[24px] border border-white/[0.08] bg-[#0d1020]/70 p-5">
              <SidebarRow
                icon={Home}
                label="Shelter"
                value={pet.shelterName}
              />

              <div className="my-4 h-px bg-white/[0.07]" />

              <SidebarRow
                icon={Calendar}
                label="Adoption Status"
                value={
                  pet.adoptionStatus ||
                  'Available'
                }
              />
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

// =========================================================
// INFO BOX
// =========================================================

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-200">
        {value}
      </p>
    </div>
  );
}

// =========================================================
// CONTENT CARD
// =========================================================

function ContentCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/[0.08] bg-[#0d1020]/70 p-6 backdrop-blur-xl sm:p-8">
      {children}
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
// FORM FIELD
// =========================================================

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className="text-sm text-slate-300"
      >
        {label}
      </Label>

      {children}
    </div>
  );
}

// =========================================================
// ADOPTION PROCESS STEP
// =========================================================

function AdoptionStep({
  number,
  title,
  description,
  last = false,
}: {
  number: string;
  title: string;
  description: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div className="absolute left-[17px] top-9 h-[calc(100%+4px)] w-px bg-white/[0.08]" />
      )}

      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/[0.08] text-[10px] font-semibold text-violet-300">
        {number}
      </div>

      <div className="min-w-0 pb-1">
        <p className="text-sm font-medium text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// SIDEBAR ROW
// =========================================================

function SidebarRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.07]">
        <Icon className="h-4 w-4 text-cyan-300" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-200">
          {value || 'Not available'}
        </p>
      </div>
    </div>
  );
}