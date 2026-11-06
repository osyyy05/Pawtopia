
import { useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { MapPin, Phone, Mail, Clock, Star, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { authFetch } from '../../utils/authFetch';

type VeterinaryClinic = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  services: string[];
  hours: string;
  image: string;
  rating: number;
  google_maps_url: string;
  recommendation_reason?: string;
};

type AIClinicRecommendation = {
  id: number;
  name: string;
  address: string;
  google_maps_url: string;
  supported_pet_types: string[];
  services: string[];
  matched_service: string;
  semantic_similarity: number;
  recommendation_score: number;
  recommendation_reason: string;
};

type NearestClinicRecommendation = {
  id: number;
  name: string;
  address: string;
  distance_km: number;
  distance_type: string;
  google_maps_url: string;
  recommendation_reason?: string;
};

const openWaze = (address: string) => {
  const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;

  window.open(wazeUrl, '_blank', 'noopener,noreferrer');
};

export default function VetClinic() {
  const { user } = useAuth();
  const location = useLocation();

  const isTrainingReward =
    new URLSearchParams(location.search).get('reward') === 'training';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [otherBookingPetType, setOtherBookingPetType] = useState('');
  const [vetClinics, setVetClinics] = useState<VeterinaryClinic[]>([]);
  const [userAddress, setUserAddress] = useState('');
  const [recommendationOpen, setRecommendationOpen] = useState(false);

  const [aiPetType, setAiPetType] = useState('');
  const [aiOtherPetType, setAiOtherPetType] = useState('');
  const [aiPetNeeds, setAiPetNeeds] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] =
    useState<AIClinicRecommendation[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [aiSearched, setAiSearched] = useState(false);

  const [nearestClinic, setNearestClinic] =
    useState<NearestClinicRecommendation | null>(null);
  const [selectedClinic, setSelectedClinic] =
    useState<VeterinaryClinic | null>(null);
  const [loadingClinics, setLoadingClinics] = useState(true);

  const [appointmentData, setAppointmentData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    petName: '',
    petType: '',
    date: '',
    time: '',
    appointmentType: isTrainingReward
      ? 'VETERINARY_APPOINTMENT'
      : '',
    notes: '',
  });

  useEffect(() => {
    const fetchVetClinics = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        toast.error('Please login again.');
        setLoadingClinics(false);
        return;
      }

      try {
        const response = await authFetch(
          'http://127.0.0.1:8000/api/appointments/clinics/',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.error ||
            data?.detail ||
            'Failed to load veterinary clinics.'
          );
        }
        setVetClinics(
          Array.isArray(data) ? data : []
        );

      } catch (error) {
        console.error(
          'Failed to load veterinary clinics:',
          error
        );

        toast.error(
          'Failed to load veterinary clinics.'
        );

        setVetClinics([]);

      } finally {
        setLoadingClinics(false);
      }
    };

    fetchVetClinics();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      if (!accessToken) {
        return;
      }

      try {
        const response = await authFetch(
          'http://127.0.0.1:8000/api/profile/',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return;
        }

        setUserAddress(data.address || '');

        setAppointmentData((previous) => ({
          ...previous,
          name: data.full_name || previous.name,
          email: data.email || user?.email || previous.email,
          contactNumber: data.phone || previous.contactNumber,
        }));
      } catch (error) {
        console.error('Failed to load user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Automatically recommend the nearest veterinary clinic
  useEffect(() => {
    if (!userAddress.trim() || loadingClinics) return;

    let cancelled = false;

    const fetchNearestClinic = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      if (!accessToken) return;

      try {
        const response = await authFetch(
          'http://127.0.0.1:8000/api/appointments/nearest-clinic/',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get clinic recommendation.');
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.nearest_clinic) {
          setNearestClinic(data.nearest_clinic);
          setRecommendationOpen(true);
        }
      } catch (error) {
        console.error('Nearest clinic recommendation error:', error);
      }
    };

    fetchNearestClinic();

    return () => {
      cancelled = true;
    };
  }, [userAddress, loadingClinics]);

  const handleAIRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();

    const petType =
      aiPetType === 'Other'
        ? aiOtherPetType.trim()
        : aiPetType;

    if (!petType) {
      toast.error('Please select or specify your pet type.');
      return;
    }

    if (!aiPetNeeds.trim()) {
      toast.error("Please describe your pet's needs.");
      return;
    }

    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      return;
    }

    setAiLoading(true);

    try {
      const response = await authFetch(
        'http://127.0.0.1:8000/api/appointments/ai-clinic-recommendation/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pet_type: petType,
            pet_needs: aiPetNeeds.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to generate AI recommendations.'
        );
      }

      setAiRecommendations(
        Array.isArray(data.recommendations)
          ? data.recommendations
          : []
      );

      setAiMessage(data.message || '');
      setAiSearched(true);
    } catch (error) {
      console.error('AI recommendation error:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'AI recommendation is currently unavailable.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      return;
    }

    try {
      const response = await authFetch(
        'http://127.0.0.1:8000/api/appointments/vet/create/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pet_name: appointmentData.petName,
            species:
              appointmentData.petType === 'Other'
                ? otherBookingPetType.trim()
                : appointmentData.petType,
            date: appointmentData.date,
            time: appointmentData.time,
            appointment_type: isTrainingReward
              ? 'VETERINARY_APPOINTMENT'
              : appointmentData.appointmentType,
            booking_source: isTrainingReward
              ? 'TRAINING_REWARD'
              : 'STANDARD',
            notes: appointmentData.notes,
            vet_clinic: selectedClinic?.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.log('VET BOOKING RESPONSE:', data);

        const errorMessage =
          data?.error ||
          data?.detail ||
          Object.entries(data)
            .map(([field, messages]) => {
              const message = Array.isArray(messages)
                ? messages.join(', ')
                : String(messages);

              return `${field}: ${message}`;
            })
            .join('\n') ||
          'Failed to book veterinary appointment.';

        toast.error(errorMessage);

        return;
      }

      toast.success(
        isTrainingReward
          ? `Free Veterinary Appointment booked at ${selectedClinic?.name}!`
          : `Appointment booked at ${selectedClinic?.name}!`
      );

      setDialogOpen(false);
      setOtherBookingPetType('');

      setAppointmentData({
        name: appointmentData.name,
        email: appointmentData.email,
        contactNumber: appointmentData.contactNumber,
        petName: '',
        petType: '',
        date: '',
        time: '',
        appointmentType: isTrainingReward
          ? 'VETERINARY_APPOINTMENT'
          : '',
        notes: '',
      });

    } catch (error) {
      console.error('VET APPOINTMENT ERROR:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to book appointment.'
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Nearest Veterinary Clinic Recommendation */}
      <Dialog
        open={recommendationOpen}
        onOpenChange={setRecommendationOpen}
      >
        <DialogContent className="max-w-lg bg-[#15112b] border-violet-500/25 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-violet-300">
              Nearest Clinic Based on Your Location
            </DialogTitle>

            <DialogDescription className="text-gray-400">
                We found the nearest veterinary clinic based on your saved
                profile address. This recommendation focuses on location
                and convenience.
            </DialogDescription>
          </DialogHeader>

          {nearestClinic && (
            <div className="space-y-5">
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/25 p-5 space-y-3">
                <h3 className="text-xl font-semibold text-white">
                  {nearestClinic.name}
                </h3>

                <div className="flex items-start gap-2 text-gray-300 text-sm">
                  <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />

                  <button
                    type="button"
                    onClick={() => openWaze(nearestClinic.address)}
                    className="text-left text-cyan-300 hover:text-cyan-200 hover:underline transition-colors break-words"
                    title="Navigate with Waze"
                  >
                    {nearestClinic.address}
                  </button>
                </div>

                <div className="text-violet-300 font-semibold">
                  Approximately {nearestClinic.distance_km} km away
                </div>

                {nearestClinic.recommendation_reason && (
                  <div className="mt-4 rounded-lg border border-cyan-500/20 bg-teal-500/10 p-4">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-2">
                      Why This Clinic Is Recommended
                    </h4>

                    <p className="text-sm text-gray-300 leading-relaxed">
                      {nearestClinic.recommendation_reason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600"
                  onClick={() => {
                    const clinic = vetClinics.find(
                      (item) => item.id === nearestClinic.id
                    );

                    if (!clinic) {
                      toast.error('Clinic is currently unavailable.');
                      return;
                    }

                    setSelectedClinic(clinic);
                    setRecommendationOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                  onClick={() => {
                    if (nearestClinic.google_maps_url) {
                      window.open(
                        nearestClinic.google_maps_url,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Google Maps
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-400"
                onClick={() => setRecommendationOpen(false)}
              >
                View All Veterinary Clinics
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <section className="bg-gradient-to-r from-violet-900/50 to-cyan-900/40 backdrop-blur-xl border-b border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.3] pb-2 mb-4 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent break-words">
            Veterinary Clinics
          </h1>
          <p className="text-xl text-gray-300">
            Book appointments with trusted veterinary professionals in Penang
          </p>
        </div>
      </section>

      {isTrainingReward && (
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300/70">
                  Training Completion Reward
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-emerald-200">
                  Free Veterinary Appointment
                </h2>

                <p className="mt-2 text-sm text-gray-300 max-w-2xl">
                  You completed all 10 training badges and unlocked one
                  complimentary veterinary appointment. Choose a
                  veterinary clinic below to redeem your one-time reward.
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-emerald-500/20 bg-black/20 px-5 py-3">
                <p className="text-xs text-gray-400">
                  Reward Cost
                </p>
                <p className="text-xl font-bold text-emerald-300">
                  RM 0.00
                </p>
                <p className="text-xs text-gray-500">
                  One-time use
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* AI-Powered Veterinary Clinic Recommendation */}
      <section className="max-w-7xl mx-auto px-4 pt-10">
        <Card className="bg-[#15112b]/80 backdrop-blur-xl border-violet-500/25 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/25">
                AI-Powered
              </Badge>
              <Badge variant="outline" className="border-white/20 text-gray-300">
                Smart Clinic Matching
              </Badge>
            </div>

            <CardTitle className="text-2xl md:text-3xl text-white">
              AI-Powered Veterinary Service Matching
            </CardTitle>

            <CardDescription className="text-gray-400 leading-relaxed">
                Describe your pet's needs to discover suitable veterinary
                clinics using AI-powered service matching.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleAIRecommendation} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-gray-200">Pet Type</Label>

                  <Select
                    value={aiPetType}
                    onValueChange={(value) => {
                      setAiPetType(value);
                      setAiSearched(false);
                      setAiRecommendations([]);
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select your pet type" />
                    </SelectTrigger>

                    <SelectContent className="bg-[#1d1738] border-white/20 text-white">
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Rabbit">Rabbit</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {aiPetType === 'Other' && (
                <div className="space-y-2">
                  <Label className="text-gray-200">
                    Specify Your Pet Type
                  </Label>

                  <Input
                    value={aiOtherPetType}
                    onChange={(e) => {
                      setAiOtherPetType(e.target.value);
                      setAiSearched(false);
                      setAiRecommendations([]);
                    }}
                    placeholder="e.g. Hamster, Guinea Pig, Bird"
                    maxLength={100}
                    required
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-gray-200">
                  Describe Your Pet's Needs
                </Label>

                <textarea
                  value={aiPetNeeds}
                  onChange={(e) => {
                    setAiPetNeeds(e.target.value);
                    setAiSearched(false);
                    setAiRecommendations([]);
                  }}
                  placeholder="e.g. My dog needs a vaccination and general health checkup."
                  maxLength={1000}
                  required
                  rows={4}
                  className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-y"
                />
              </div>

              <Button
                type="submit"
                disabled={aiLoading}
                className="w-full sm:w-auto min-w-[260px] h-10 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700 disabled:opacity-100 disabled:cursor-wait text-white"
              >
                Find AI Recommended Clinics
              </Button>

              <p className="text-xs text-gray-500">
                  AI recommendations are based on semantic matching between
                  your pet's needs and the veterinary services listed by clinics.
                  They are not a veterinary diagnosis or confirmation of
                  appointment availability.
              </p>
            </form>

            {(aiSearched || aiLoading) && (
              <div className="border-t border-white/10 pt-6 space-y-5">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Your AI Clinic Recommendations
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    {aiRecommendations.length > 0
                      ? `${aiRecommendations.length} matching clinic(s) found`
                      : aiMessage || 'No matching clinics found.'}
                  </p>
                </div>

                {aiRecommendations.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {aiRecommendations.map((clinic, index) => (
                      <div
                        key={clinic.id}
                        className="rounded-xl border border-violet-500/25 bg-white/[0.04] p-5 flex flex-col gap-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                              Rank #{index + 1}
                            </Badge>

                            <h4 className="text-lg font-semibold text-white">
                              {clinic.name}
                            </h4>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2 text-gray-300 min-h-[48px]">
                            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />

                            <button
                              type="button"
                              onClick={() => openWaze(clinic.address)}
                              className="text-left text-cyan-300 hover:text-cyan-200 hover:underline transition-colors break-words"
                              title="Navigate with Waze"
                            >
                              {clinic.address}
                            </button>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400 mb-1">
                              AI Matched Service
                            </p>

                            <Badge
                              variant="outline"
                              className="border-violet-500/30 text-violet-300"
                            >
                              {clinic.matched_service}
                            </Badge>
                          </div>

                          <div className="rounded-lg border border-teal-500/15 bg-teal-500/[0.06] p-3">
                            <p className="text-xs font-semibold text-cyan-300 mb-2">
                              Why This Clinic?
                            </p>

                            <p className="text-xs leading-relaxed text-gray-300">
                              {clinic.recommendation_reason}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto space-y-2">
                          <Button
                            type="button"
                            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600"
                            onClick={() => {
                              const fullClinic = vetClinics.find(
                                (item) => item.id === clinic.id
                              );

                              if (!fullClinic) {
                                toast.error('Clinic is currently unavailable.');
                                return;
                              }

                              setAppointmentData((previous) => ({
                                ...previous,
                                petType: aiPetType,
                              }));

                              setOtherBookingPetType(
                                aiPetType === 'Other'
                                  ? aiOtherPetType.trim()
                                  : ''
                              );

                              setSelectedClinic(fullClinic);
                              setDialogOpen(true);
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            {isTrainingReward
                              ? 'Redeem at This Clinic'
                              : 'Book Appointment'}
                          </Button>

                          {clinic.google_maps_url && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-white/20 text-white"
                              onClick={() =>
                                window.open(
                                  clinic.google_maps_url,
                                  '_blank',
                                  'noopener,noreferrer'
                                )
                              }
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              Google Maps
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {vetClinics.map((clinic) => (
            <Card
              key={clinic.id}
              className="bg-[#15112b]/80 backdrop-blur-xl border-white/10 overflow-hidden hover:border-white/30 transition-all flex flex-col h-full"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={clinic.image}
                  alt={clinic.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-2xl text-white">{clinic.name}</CardTitle>
                  <a
                    href={clinic.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-600/30 hover:border-yellow-400/50 transition-all cursor-pointer"
                    title="View Google reviews"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span>{clinic.rating}</span>
                    <span className="text-xs text-gray-300 ml-1">View Reviews</span>
                  </a>
                </div>
                <CardDescription className="text-gray-400">
                  {clinic.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex flex-col flex-1">
                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />

                    <button
                      type="button"
                      onClick={() => openWaze(clinic.address)}
                      className="text-sm text-left text-cyan-300 hover:text-cyan-200 hover:underline transition-colors break-words"
                      title="Navigate with Waze"
                    >
                      {clinic.address}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Phone className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm">{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm">{clinic.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-300">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm">{clinic.hours}</span>
                  </div>
                </div>

                {/* Services */}
                <div className="mt-auto min-h-[100px]">
                  <h4 className="text-white font-medium mb-3">Services Offered</h4>
                  <div className="flex flex-wrap gap-2 content-start">
                    {clinic.services.map((service) => (
                      <Badge
                        key={service}
                        variant="outline"
                        className="border-violet-500/30 text-cyan-400"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Book Button */}
                <Dialog
                  open={dialogOpen && selectedClinic?.id === clinic.id}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) setSelectedClinic(clinic);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full mt-auto bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700">
                      <Calendar className="w-5 h-5 mr-2" />
                      {isTrainingReward
                        ? 'Redeem at This Clinic'
                        : 'Book Appointment'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#15112b] border-white/10 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">
                        {isTrainingReward
                          ? 'Redeem Free Veterinary Appointment'
                          : 'Book Appointment'}
                      </DialogTitle>

                      <DialogDescription className="text-gray-400">
                        {isTrainingReward
                          ? `Redeem your Training Completion Reward at ${clinic.name}`
                          : `Schedule a visit at ${clinic.name}`}
                      </DialogDescription>
                    </DialogHeader>

                    {isTrainingReward && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-emerald-300/70">
                              Training Reward
                            </p>

                            <p className="mt-1 font-semibold text-emerald-200">
                              Free Veterinary Appointment
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Complimentary one-time service
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-400">
                              Total
                            </p>

                            <p className="text-xl font-bold text-emerald-300">
                              RM 0.00
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleBookAppointment} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input
                            id="name"
                            required
                            value={appointmentData.name}
                            onChange={(e) => setAppointmentData({...appointmentData, name: e.target.value})}
                            className="bg-white/10 border-white/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={appointmentData.email}
                            onChange={(e) => setAppointmentData({...appointmentData, email: e.target.value})}
                            className="bg-white/10 border-white/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          id="contactNumber"
                          type="tel"
                          required
                          value={appointmentData.contactNumber}
                          onChange={(e) => setAppointmentData({...appointmentData, contactNumber: e.target.value})}
                          className="bg-white/10 border-white/20"
                          placeholder="+60 12-345 6789"
                        />
                      </div>
                      
                        <div className="space-y-2">
                          <Label htmlFor="petName">Pet Name</Label>
                          <Input
                            id="petName"
                            required
                            value={appointmentData.petName}
                            onChange={(e) => setAppointmentData({...appointmentData, petName: e.target.value})}
                            className="bg-white/10 border-white/20"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="petType">Pet Type</Label>

                          <Select
                            value={appointmentData.petType}
                            onValueChange={(value) => {
                              setAppointmentData({
                                ...appointmentData,
                                petType: value
                              });

                              if (value !== 'Other') {
                                setOtherBookingPetType('');
                              }
                            }}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20">
                              <SelectValue placeholder="Select pet type" />
                            </SelectTrigger>

                            <SelectContent className="bg-[#1d1738] border-white/20 text-white">
                              <SelectItem value="Dog">Dog</SelectItem>
                              <SelectItem value="Cat">Cat</SelectItem>
                              <SelectItem value="Rabbit">Rabbit</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          {appointmentData.petType === 'Other' && (
                            <div className="mt-3 space-y-2">
                              <Label htmlFor="otherBookingPetType">
                                Specify Pet Type
                              </Label>

                              <Input
                                id="otherBookingPetType"
                                value={otherBookingPetType}
                                onChange={(e) =>
                                  setOtherBookingPetType(e.target.value)
                                }
                                placeholder="e.g. Hamster, Guinea Pig, Bird"
                                maxLength={100}
                                required
                                className="bg-white/10 border-white/20"
                              />
                            </div>
                          )}
                        </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Preferred Date</Label>
                          <Input
                            id="date"
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={appointmentData.date}
                            onChange={(e) =>
                              setAppointmentData({
                                ...appointmentData,
                                date: e.target.value
                              })
                            }
                            className="bg-white/10 border-white/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Preferred Time</Label>
                          <Select
                            value={appointmentData.time}
                            onValueChange={(value) => setAppointmentData({...appointmentData, time: value})}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20">
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1d1738] border-white/20 text-white">
                              <SelectItem value="09:00">09:00 AM</SelectItem>
                              <SelectItem value="10:00">10:00 AM</SelectItem>
                              <SelectItem value="11:00">11:00 AM</SelectItem>
                              <SelectItem value="14:00">02:00 PM</SelectItem>
                              <SelectItem value="15:00">03:00 PM</SelectItem>
                              <SelectItem value="16:00">04:00 PM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointmentType">
                          Veterinary Service
                        </Label>
                        <div className="space-y-2">
                        <Label htmlFor="notes">
                          Additional Notes
                        </Label>

                        <Input
                          id="notes"
                          value={appointmentData.notes}
                          onChange={(e) =>
                            setAppointmentData({
                              ...appointmentData,
                              notes: e.target.value
                            })
                          }
                          className="bg-white/10 border-white/20"
                          placeholder="Describe any symptoms or concerns..."
                        />
                      </div>

                      {isTrainingReward ? (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-emerald-200">
                                Veterinary Appointment
                              </p>

                              <p className="mt-1 text-xs text-gray-400">
                                Fixed service for Training Completion Reward
                              </p>
                            </div>

                            <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                              FREE
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={appointmentData.appointmentType}
                          onValueChange={(value) =>
                            setAppointmentData({
                              ...appointmentData,
                              appointmentType: value
                            })
                          }
                        >
                          <SelectTrigger className="bg-white/10 border-white/20">
                            <SelectValue placeholder="Select veterinary service" />
                          </SelectTrigger>

                          <SelectContent className="bg-[#1d1738] border-white/20 text-white">
                            <SelectItem value="GENERAL_CONSULTATION">
                              General Consultation
                            </SelectItem>

                            <SelectItem value="VACCINATION">
                              Vaccination
                            </SelectItem>

                            <SelectItem value="FOLLOW_UP">
                              Follow-up
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      </div>
                      <Button
                        type="submit"
                        className={
                          isTrainingReward
                            ? 'w-full bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-700 hover:to-cyan-700'
                        }
                      >
                        {isTrainingReward
                          ? 'Redeem & Book Free Appointment'
                          : 'Confirm Appointment'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
