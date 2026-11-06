import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../components/ui/avatar';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

import { useAuth } from '../../context/AuthContext';

import {
  Edit2,
  Save,
  Award,
  Camera,
  X,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';

import { toast } from 'sonner';


// =========================================================
// DONATION TYPE
// =========================================================

interface Donation {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  amount: string | number;
  shelter: string;
  payment_method: string;
  receipt?: string;
  receipt_url?: string;
  transaction_id: string;
  status: string;
  shelter_remark?: string;
  admin_remark?: string;
  created_at: string;
  updated_at?: string;
}


// =========================================================
// PROFILE TYPE
// =========================================================

interface TrainingBadge {
  id: number;
  training_id: number;
  training_title: string;
  earned_at: string;
}

interface TrainingRewardResponse {
  unlocked: boolean;
  badge_count: number;
  badges_required: number;
  remaining_badges: number;

  reward: {
    type: string;
    name: string;
    status: 'LOCKED' | 'AVAILABLE' | 'REDEEMED';
    uses_available: number;
    unlocked_at?: string | null;
    redeemed_at?: string | null;
    appointment_id?: number | null;
  };
}

interface ProfileData {
  username: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  bio: string;
  profile_photo: string | null;
  profile_prompt_seen?: boolean;
  badges: TrainingBadge[];
}

interface AdoptionApplication {
  id: number;
  animal_name: string;
  animal_image?: string;
  species?: string;
  shelter_name?: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  reason: string;
  status: string;
  shelter_remark?: string;
  created_at: string;
  updated_at?: string;
}


// =========================================================
// MAIN COMPONENT
// =========================================================

export default function Profile() {

  const { user, updateProfile } = useAuth();
    const navigate = useNavigate();


  // =======================================================
  // EDIT MODE
  // =======================================================

  const [isEditing, setIsEditing] = useState(false);
  
  const [formErrors, setFormErrors] = useState<
    Partial<Record<
      'username' | 'full_name' | 'phone' | 'address' | 'bio' | 'profile_photo',
      string
    >>
  >({});
  const [originalProfile, setOriginalProfile] =
    useState<ProfileData | null>(null);

  const [activeTab, setActiveTab] = useState('adoption');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const profileTabs = [
    'adoption',
    'donations',
    'appointments',
    'training',
    'badges',
  ];

  const activeIndicatorTab = hoveredTab ?? activeTab;
  const activeIndicatorIndex = profileTabs.indexOf(activeIndicatorTab);
  const [trainingAttempts, setTrainingAttempts] = useState<any[]>([]);
  const [reviewAttempt, setReviewAttempt] = useState<any | null>(null);
  const [reviewQuestionIndex, setReviewQuestionIndex] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [trainingTopics, setTrainingTopics] = useState<any[]>([]);
  const [trainingReward, setTrainingReward] =
  useState<TrainingRewardResponse | null>(null);

  const [trainingRewardLoading, setTrainingRewardLoading] =
    useState(true);

  useEffect(() => {
  const fetchTrainingAttempts = async () => {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/training/attempts/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrainingAttempts(data);
      } else {
        console.error(
          'Failed to fetch training attempts:',
          response.status
        );
      }
    } catch (error) {
      console.error(
        'Error fetching training attempts:',
        error
      );
    }
  };

  fetchTrainingAttempts();
}, []);

useEffect(() => {
  const fetchTrainingTopics = async () => {
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/training/'
      );

      if (!response.ok) {
        throw new Error(
          `Training API error: ${response.status}`
        );
      }

      const data = await response.json();

      setTrainingTopics(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        'Failed to fetch training topics:',
        error
      );

      setTrainingTopics([]);
    }
  };

  fetchTrainingTopics();
}, []);

useEffect(() => {
  const fetchTrainingReward = async () => {
    const token = sessionStorage.getItem('access_token');

    if (!token) {
      setTrainingRewardLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/training/reward/',
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
          'Failed to load training reward.'
        );
      }

      setTrainingReward(data);
    } catch (error) {
      console.error(
        'Failed to load training reward:',
        error
      );

      setTrainingReward(null);
    } finally {
      setTrainingRewardLoading(false);
    }
  };

  fetchTrainingReward();
}, []);

const openTrainingReview = async (attemptId: number) => {
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    return;
  }

  setReviewLoading(true);
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/training/attempts/${attemptId}/review/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error(data);
      return;
    }

    if (!data.questions || data.questions.length === 0) {
      alert(
        'This training attempt does not have saved answers to review.'
      );
      return;
    }

    setReviewAttempt(data);
    setReviewQuestionIndex(0);

  } catch (error) {
    console.error('Error loading training review:', error);
  } finally {
    setReviewLoading(false);
  }
};

const currentReviewQuestion =
  reviewAttempt?.questions?.[reviewQuestionIndex];


  // =======================================================
  // PROFILE LOADING
  // =======================================================

  const [, setProfileLoading] = useState(true);


  // =======================================================
  // PROFILE PHOTO
  // =======================================================

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);


  // =======================================================
  // PROFILE FORM
  // =======================================================

  const [formData, setFormData] =
    useState<ProfileData>({
      username: user?.username || '',
      email: user?.email || '',
      full_name: '',
      phone: '',
      address: '',
      bio: user?.bio || '',
      profile_photo: user?.profilePicture || null,
      badges: [],
    });


  // =======================================================
  // DONATION HISTORY
  // =======================================================

  const [donationHistory, setDonationHistory] =
    useState<Donation[]>([]);

  const [donationsLoading, setDonationsLoading] =
    useState(true);

  // =======================================================
  // ADOPTION HISTORY
  // =======================================================

  const [adoptionHistory, setAdoptionHistory] =
    useState<AdoptionApplication[]>([]);

  const [adoptionLoading, setAdoptionLoading] =
    useState(true);

  const [selectedAdoption, setSelectedAdoption] =
    useState<AdoptionApplication | null>(null);

  // =======================================================
  // VETERINARY APPOINTMENT HISTORY
  // Adoption applications and veterinary appointments are
  // intentionally kept as two separate workflows.
  // =======================================================

  const [appointmentHistory, setAppointmentHistory] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const veterinaryAppointments = appointmentHistory.filter(
    (appointment) =>
      [
        'VETERINARY_APPOINTMENT',
        'GENERAL_CONSULTATION',
        'VACCINATION',
        'FOLLOW_UP',
      ].includes(appointment.rawType)
  );

  // =======================================================
  // DONATION MODAL
  // =======================================================

  const [selectedDonation, setSelectedDonation] =
    useState<Donation | null>(null);

    const totalDonationAmount =
      donationHistory
        .filter(
          (donation) =>
            donation.status === 'COMPLETED'
        )
        .reduce(
          (total, donation) =>
            total + Number(donation.amount),
          0
        );


  // =======================================================
  // FETCH PROFILE
  // =======================================================

  useEffect(() => {

    const fetchProfile = async () => {

      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        setProfileLoading(false);
        return;
      }

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/profile/',
          {
            method: 'GET',

            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {

          throw new Error(
            'Failed to load profile'
          );
        }

        const data = await response.json();


        const loadedProfile: ProfileData = {
          username: data.username || user?.username || '',
          email: data.email || user?.email || '',
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || '',
          bio: data.bio || '',
          profile_photo: data.profile_photo || null,
          profile_prompt_seen: data.profile_prompt_seen ?? false,
          badges: Array.isArray(data.badges) ? data.badges : [],
        };

        setFormData(loadedProfile);
        setOriginalProfile(loadedProfile);


      } catch (error) {

        console.error(
          'Profile loading error:',
          error
        );

        toast.error(
          'Failed to load profile information'
        );


      } finally {

        setProfileLoading(false);

      }

    };


    fetchProfile();

  }, []);


  // =======================================================
  // FETCH DONATIONS
  // =======================================================
  
  useEffect(() => {
    const fetchDonations = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        setDonationHistory([]);
        setDonationsLoading(false);
        return;
      }

      try {
        setDonationsLoading(true);

        const response = await fetch(
          'http://127.0.0.1:8000/api/donations/my/',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          }
        );

        if (response.status === 401) {
          console.error('Donation API: Unauthorized');

          setDonationHistory([]);
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Donation API error: ${response.status}`
          );
        }

        const data = await response.json();

        console.log(
          'DONATION HISTORY:',
          data
        );

        setDonationHistory(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          'Donation history error:',
          error
        );

        toast.error(
          'Failed to load donation history'
        );

        setDonationHistory([]);

      } finally {

        setDonationsLoading(false);

      }
    };

    fetchDonations();

  }, []);

  // =======================================================
  // FETCH ADOPTION HISTORY
  // =======================================================

  useEffect(() => {

    const fetchAdoptionHistory = async () => {

      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        setAdoptionHistory([]);
        setAdoptionLoading(false);

        return;
      }

      try {
        setAdoptionLoading(true);

        const response = await fetch(
          'http://127.0.0.1:8000/api/adoptions/my-applications/',
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${accessToken}`,

              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        console.log(
          'ADOPTION HISTORY:',
          data
        );

        if (!response.ok) {

          throw new Error(
            data?.error ||
            data?.detail ||
            `Adoption API error: ${response.status}`
          );

        }

        setAdoptionHistory(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          'Adoption history error:',
          error
        );

        toast.error(
          'Failed to load adoption history'
        );

        setAdoptionHistory([]);

      } finally {

        setAdoptionLoading(false);

      }

    };

    fetchAdoptionHistory();

  }, []);

  // FETCH APPOINTMENT HISTORY 
    useEffect(() => {
    const fetchAppointmentHistory = async () => {
      const accessToken = sessionStorage.getItem('access_token');

      if (!accessToken) {
        return;
      }

      setLoadingAppointments(true);

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/appointments/my/',
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
          'MY APPOINTMENTS:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
            data?.detail ||
            'Failed to load appointments.'
          );
        }

    const convertedAppointments = Array.isArray(data)
      ? data.map((appointment: any) => ({
          id: String(appointment.id),

          clinic:
            appointment.vet_clinic || '',

          pet:
            appointment.pet_name ||
            appointment.animal_name ||
            '-',

          type:
            appointment.appointment_type_display ||
            appointment.appointment_type ||
            '-',

          rawType:
            appointment.appointment_type || '',

          isFree: appointment.is_free === true,
          bookingSource: appointment.booking_source || 'STANDARD',

          date:
            appointment.date ||
            '-',

          time:
            appointment.time ||
            '-',

          status:
            appointment.status_display ||
            appointment.status ||
            'Scheduled',

          vet:
            appointment.vet || null,

          vetName:
            appointment.vet_name || '',
          
          shelterName:
            appointment.shelter_name || '',

          medicalNotes:
            appointment.medical_notes || '',
        }))
      : [];

        setAppointmentHistory(
          convertedAppointments
        );

      } catch (error) {
        console.error(
          'Failed to load appointment history:',
          error
        );

        setAppointmentHistory([]);

      } finally {
        setLoadingAppointments(false);
      }
    };

    fetchAppointmentHistory();
  }, []);

  // =======================================================
  // CHANGE PROFILE PHOTO
  // =======================================================

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];


    if (!file) {
      return;
    }


    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {

      toast.error(
        'Profile photo must be smaller than 5MB.'
      );

      return;

    }


    // Only images
    if (!file.type.startsWith('image/')) {

      toast.error(
        'Please select an image file.'
      );

      return;

    }


    setSelectedPhoto(file);


    const previewUrl =
      URL.createObjectURL(file);


    setPhotoPreview(previewUrl);

  };


  // =======================================================
  // REMOVE SELECTED PHOTO
  // =======================================================

  const cancelPhotoChange = () => {

    setSelectedPhoto(null);

    setPhotoPreview(null);

  };


  // =======================================================
  // SAVE PROFILE
  // =======================================================

  const handleSave = async () => {

    const errors: typeof formErrors = {};

    const username = formData.username.trim();

    if (!username) {
      errors.username = 'Username is required.';
    } else if (username.length > 150) {
      errors.username = 'Username must not exceed 150 characters.';
    }
    
    // Full Name Validation
    const fullName = formData.full_name.trim();

    if (!fullName) {
      errors.full_name = 'Full name is required.';
    } else if (!/^[A-Za-z ]+$/.test(fullName)) {
      errors.full_name = 'Full name must contain letters only.';
    } else if (fullName.length > 100) {
      errors.full_name = 'Full name must not exceed 100 characters.';
    }

    // Malaysian Phone Number Validation
    const phone = formData.phone.trim();

    if (!phone) {
      errors.phone = 'Contact number is required.';
    } else if (!/^01\d-?\d{7,8}$/.test(phone)) {
      errors.phone = 'Enter a valid Malaysian mobile number.';
    }

    // Address Validation
    const address = formData.address.trim();

    if (!address) {
      errors.address = 'Address is required.';
    } else if (address.length > 500) {
      errors.address = 'Address must not exceed 500 characters.';
    }

    // Bio Validation (Optional)
    if (formData.bio.length > 500) {
      errors.bio = 'Bio must not exceed 500 characters.';
    }

    
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error('Please correct the highlighted fields before saving.');
      return;
    }



    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error(
        'You are not logged in.'
      );
      return;
    }

    try {
      const body =
        new FormData();

      body.append(
        'username',
        formData.username
      );

      body.append(
        'full_name',
        formData.full_name
      );

      body.append(
        'phone',
        formData.phone
      );

      body.append(
        'address',
        formData.address
      );

      body.append(
        'bio',
        formData.bio
      );

      if (selectedPhoto) {
        body.append(
          'profile_photo',
          selectedPhoto
        );
      }

      const response = await fetch(
        'http://127.0.0.1:8000/api/profile/',
        {
          method: 'PUT',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          body,
        }
      );


      const data =
        await response.json();


      if (!response.ok) {
        const usernameError =
          data?.field === 'username'
            ? data?.error
            : data?.username;

        if (usernameError) {
          setFormErrors((previous) => ({
            ...previous,
            username: Array.isArray(usernameError)
              ? usernameError.join(' ')
              : String(usernameError),
          }));
          return;
        }

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update profile'
        );
      }


      // ===================================================
      // UPDATE FRONTEND AUTH CONTEXT
      // ===================================================

      updateProfile({
        username:
          data.username ||
          formData.username,

        email:
          data.email ||
          formData.email,

        bio:
          data.bio ||
          formData.bio,

        contactNumber:
          data.phone ||
          formData.phone,

        profilePicture:
          data.profile_photo ||
          formData.profile_photo ||
          undefined,
      });


      // ===================================================
      // UPDATE LOCAL FORM
      // ===================================================

      const updatedProfile: ProfileData = {
        ...formData,
        username: data.username ?? formData.username,
        email: data.email ?? formData.email,
        full_name: data.full_name ?? formData.full_name,
        phone: data.phone ?? formData.phone,
        address: data.address ?? formData.address,
        bio: data.bio ?? formData.bio,
        profile_photo: data.profile_photo ?? formData.profile_photo,
        profile_prompt_seen:
          data.profile_prompt_seen ?? formData.profile_prompt_seen,
      };

      
      setFormData(updatedProfile);
      setOriginalProfile(updatedProfile);
      setFormErrors({});

      // Clear selected profile photo
      cancelPhotoChange();

      // Exit edit mode after successful save
      setIsEditing(false);

      // Show success notification
      toast.success('Profile updated successfully!');



    } catch (error) {

      console.error(
        'Profile update error:',
        error
      );


      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update profile'
      );

    }

  };


  // =======================================================
  // PROFILE PHOTO TO DISPLAY
  // =======================================================

  const displayedPhoto =
    photoPreview ||
    formData.profile_photo ||
    user?.profilePicture ||
    '';


  // =======================================================
  // RETURN
  // =======================================================

  return (

    <div className="min-h-screen">


      {/* ===================================================
          HEADER
          =================================================== */}

      <section className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border-b border-white/10 py-12">

        <div className="max-w-7xl mx-auto px-4">

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">

            My Profile

          </h1>


          <p className="text-xl text-gray-300">

            Manage your account and view your activity

          </p>

        </div>

      </section>


      {/* ===================================================
          MAIN
          =================================================== */}

      <div className="max-w-7xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">


          {/* =================================================
              PROFILE CARD
              ================================================= */}

          <div className="lg:col-span-1">

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">

              <CardHeader>

                <div className="flex flex-col items-center">


                  {/* PROFILE PHOTO */}

                  <div className="relative mb-4">

                    <Avatar className="w-32 h-32 border-2 border-white/10 bg-white/5">

                      {displayedPhoto && (
                        <AvatarImage
                          src={displayedPhoto}
                          alt="Profile"
                          className="object-cover"
                        />
                      )}

                      <AvatarFallback className="bg-white/5">
                        <User className="w-16 h-16 text-gray-500" />
                      </AvatarFallback>

                    </Avatar>


                    {/* CAMERA BUTTON */}

                    {isEditing && (

                      <label
                        htmlFor="profile-photo"
                        className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center cursor-pointer border-2 border-black transition"
                      >

                        <Camera className="w-5 h-5 text-white" />


                        <input
                          id="profile-photo"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoChange}
                        />

                      </label>

                    )}

                  </div>


                  {/* PHOTO CHANGE MESSAGE */}

                  {isEditing && (

                    <div className="text-center mb-5">

                      <p className="text-xs text-gray-400">

                        Click the camera icon to change your profile photo.

                      </p>


                      {selectedPhoto && (

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 mt-1"
                          onClick={cancelPhotoChange}
                        >

                          <X className="w-3 h-3 mr-1" />

                          Cancel Photo Change

                        </Button>

                      )}

                    </div>

                  )}


                  {/* =================================================
                      VIEW MODE
                      ================================================= */}

                  {!isEditing ? (

                    <>

                      <CardTitle className="text-2xl text-white text-center">

                        {formData.username || user?.username}

                      </CardTitle>


                      <CardDescription className="text-gray-400 text-center">

                        {formData.email || user?.email}

                      </CardDescription>


                      {/* FULL NAME */}

                      <div className="w-full mt-6">

                        <Label className="text-gray-400">

                          Full Name

                        </Label>


                        <p className="text-white mt-2">

                          {formData.full_name ||
                            'Not provided'}

                        </p>

                      </div>

                    </>

                  ) : (

                    /* =================================================
                       EDIT MODE
                       ================================================= */

                    <div className="w-full space-y-4">


                      {/* USERNAME */}

                      <div className="space-y-2">

                        <Label
                          htmlFor="username"
                          className="text-white"
                        >
                          Username
                        </Label>
 
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          className={`bg-white/10 text-white placeholder:text-gray-500 ${
                            formErrors.username
                              ? 'border-red-500'
                              : 'border-white/20'
                          }`}
                        />
                        {formErrors.username && (
                          <p className="text-xs text-red-400">
                            {formErrors.username}
                          </p>
                        )}
                      </div>

                      {/* EMAIL */}

                      <div className="space-y-2">

                        <Label
                          htmlFor="email"
                          className="text-white"
                        >
                          Email
                        </Label>
     
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          readOnly
                          className="bg-white/5 border-white/10 text-gray-400 cursor-not-allowed"
                        />
                      </div>

                      
                      {/* FULL NAME */}

                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-white">
                          Full Name
                        </Label>

                        <Input
                          id="full_name"
                          type="text"
                          placeholder="Full name"
                          value={formData.full_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          className={`bg-white/10 text-white placeholder:text-gray-500 ${
                            formErrors.full_name
                              ? 'border-red-500'
                              : 'border-white/20'
                          }`}
                        />

                        {formErrors.full_name && (
                          <p className="text-xs text-red-400">
                            {formErrors.full_name}
                          </p>
                        )}
                      </div>
                      
                      {/* PHONE */}

                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-white">
                          Contact Number
                        </Label>

                        <Input
                          id="contactNumber"
                          type="tel"
                          placeholder="Contact number"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phone: e.target.value,
                            })
                          }
                          className={`bg-white/10 text-white placeholder:text-gray-500 ${
                            formErrors.phone
                              ? 'border-red-500'
                              : 'border-white/20'
                          }`}
                        />

                        {formErrors.phone && (
                          <p className="text-xs text-red-400">
                            {formErrors.phone}
                          </p>
                        )}
                      </div>

                      {/* ADDRESS */}

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-white">
                          Address
                        </Label>

                        <textarea
                          id="address"
                          placeholder="Full address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          rows={3}
                          className={`w-full rounded-md bg-white/10 border px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                            formErrors.address
                              ? 'border-red-500'
                              : 'border-white/20'
                          }`}
                        />

                        {formErrors.address && (
                          <p className="text-xs text-red-400">
                            {formErrors.address}
                          </p>
                        )}
                      </div>

                    </div>

                  )}

                </div>

              </CardHeader>


              {/* =================================================
                  PROFILE CARD CONTENT
                  ================================================= */}

              <CardContent>

                {!isEditing ? (

                  <>

                    {/* PHONE */}

                    <div className="mb-4">

                      <Label className="text-gray-400">

                        Contact Number

                      </Label>


                      <p className="text-white mt-2">

                        {formData.phone ||
                          'Not provided'}

                      </p>

                    </div>

                    {/* ADDRESS */}

                    <div className="mb-4">

                      <Label className="text-gray-400">
                        Address
                      </Label>

                      <p className="text-white mt-2 whitespace-pre-line">
                        {formData.address || 'Not provided'}
                      </p>

                    </div>


                    {/* BIO */}

                    <div className="mb-4">

                      <Label className="text-gray-400">

                        Bio

                      </Label>


                      <p className="text-white mt-2">

                        {formData.bio ||
                          'No bio yet'}

                      </p>

                    </div>


                    {/* EDIT BUTTON */}

                    <Button
                      onClick={() =>
                        setIsEditing(true)
                      }

                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >

                      <Edit2 className="w-4 h-4 mr-2" />

                      Edit Profile

                    </Button>

                  </>

                ) : (

                  <>

                    
                  {/* BIO */}

                  <div className="mb-4 space-y-2">
                    <Label htmlFor="bio" className="text-white">
                      Bio
                    </Label>

                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bio: e.target.value,
                        })
                      }
                      className={`bg-white/10 text-white ${
                        formErrors.bio
                          ? 'border-red-500'
                          : 'border-white/20'
                      }`}
                      rows={4}
                    />

                    {formErrors.bio && (
                      <p className="text-xs text-red-400">
                        {formErrors.bio}
                      </p>
                    )}
                  </div>

                    
                    {/* BUTTONS */}

                    <div className="flex gap-3">

                      {/* CANCEL BUTTON */}
                      <Button
                        type="button"
                        onClick={() => {
                          if (originalProfile) {
                            setFormData({ ...originalProfile });
                          }

                          setFormErrors({});
                          cancelPhotoChange();
                          setIsEditing(false);
                        }}
                        className="flex-1 bg-purple-400/20 border border-purple-400/40 text-purple-200 hover:bg-purple-400/30 hover:text-white transition-all duration-200"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>

                      {/* SAVE BUTTON */}
                      <Button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all duration-200"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>

                    </div>

                  </>

                )}

              </CardContent>

            </Card>

          </div>


          {/* =================================================
              ACTIVITY TABS
              ================================================= */}

          <div className="lg:col-span-2">

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >


              {/* TAB LIST */}

            <TabsList
              onMouseLeave={() => setHoveredTab(null)}
              className="relative grid w-full grid-cols-5 bg-black/40 border border-white/10 rounded-full p-1 overflow-hidden"
            >
              {/* Sliding purple indicator */}
              <div
                className="absolute top-1 bottom-1 left-1 rounded-full bg-purple-500 transition-transform duration-300 ease-out pointer-events-none"
                style={{
                  width: 'calc((100% - 8px) / 5)',
                  transform: `translateX(${activeIndicatorIndex * 100}%)`,
                }}
              />

              <TabsTrigger
                value="adoption"
                onMouseEnter={() => setHoveredTab('adoption')}
                className="relative z-10 text-white rounded-full px-3 py-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Adoptions
              </TabsTrigger>

              <TabsTrigger
                value="donations"
                onMouseEnter={() => setHoveredTab('donations')}
                className="relative z-10 text-white rounded-full px-3 py-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Donations
              </TabsTrigger>

              <TabsTrigger
                value="appointments"
                onMouseEnter={() => setHoveredTab('appointments')}
                className="relative z-10 text-white rounded-full px-3 py-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Appointments
              </TabsTrigger>

              <TabsTrigger
                value="training"
                onMouseEnter={() => setHoveredTab('training')}
                className="relative z-10 text-white rounded-full px-3 py-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Training
              </TabsTrigger>

              <TabsTrigger
                value="badges"
                onMouseEnter={() => setHoveredTab('badges')}
                className="relative z-10 text-white rounded-full px-3 py-1 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white"
              >
                Badges
              </TabsTrigger>
            </TabsList>


              {/* =================================================
                  ADOPTION TAB
                  ================================================= */}

              <TabsContent value="adoption">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardHeader>

                    <CardTitle className="text-white">
                      Adoption History
                    </CardTitle>

                    <CardDescription className="text-gray-400">
                      Your pet adoption applications
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    {adoptionLoading ? (

                      <div className="text-center py-8">

                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

                        <p className="text-gray-400">
                          Loading adoption history...
                        </p>

                      </div>

                    ) : adoptionHistory.length === 0 ? (

                      <div className="text-center py-8">

                        <p className="text-gray-400">
                          No adoption applications yet.
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          Your adoption applications will appear here.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-4">

                        {adoptionHistory.map(
                          (adoption) => {

                            const displayStatus =
                              adoption.status === 'COMPLETED'
                                ? 'Adoption Completed'
                                : adoption.status === 'APPROVED'
                                  ? 'Approved'
                                  : adoption.status === 'REJECTED'
                                    ? 'Unsuccessful'
                                    : 'Under Review';

                            const statusClass =
                              adoption.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : adoption.status === 'APPROVED'
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                  : adoption.status === 'REJECTED'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30';

                            return (

                              <div
                                key={adoption.id}
                                className="bg-white/5 p-4 rounded-lg border border-white/10"
                              >

                                <div className="flex justify-between items-start gap-4">

                                  <div>

                                    <h4 className="text-white font-medium">
                                      {adoption.animal_name}
                                    </h4>

                                    <p className="text-sm text-gray-400">
                                      {new Date(
                                        adoption.created_at
                                      ).toLocaleDateString()}
                                    </p>

                                    {adoption.species && (
                                      <p className="text-sm text-gray-400 mt-1">
                                        {adoption.species}
                                      </p>
                                    )}

                                    {adoption.shelter_name && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Shelter: {adoption.shelter_name}
                                      </p>
                                    )}

                                    {adoption.status === 'COMPLETED' && (
                                      <p className="text-xs text-emerald-300 mt-3">
                                        Adoption completed successfully. {adoption.animal_name} has been adopted.
                                      </p>
                                    )}

                                    {adoption.status === 'APPROVED' && (
                                      <p className="text-xs text-green-300 mt-3">
                                        Your application has been approved. The shelter will contact you to arrange the Meet & Greet.
                                      </p>
                                    )}

                                    {adoption.status === 'REJECTED' && (
                                      <p className="text-xs text-red-300 mt-3">
                                        This application was not approved. Open the details to view the shelter's remark, if provided.
                                      </p>
                                    )}

                                    {adoption.status === 'PENDING' && (
                                      <p className="text-xs text-amber-300 mt-3">
                                        Your application is currently being reviewed by the shelter.
                                      </p>
                                    )}

                                  </div>

                                  <div className="text-right">

                                    <span
                                      className={`px-3 py-1 rounded-full text-xs ${statusClass}`}
                                    >
                                      {displayStatus}
                                    </span>

                                  </div>

                                </div>

                                <div className="flex justify-end items-center mt-4 pt-3 border-t border-white/10">

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-white/20 text-white hover:bg-white/10"
                                    onClick={() =>
                                      setSelectedAdoption(adoption)
                                    }
                                  >
                                    View Details
                                  </Button>

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>

                    )}

                  </CardContent>

                </Card>

              </TabsContent>


              {/* =================================================
                  ADOPTION DETAILS MODAL
                  ================================================= */}

              {selectedAdoption && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                  <div
                    className="absolute inset-0 bg-purple-950/30 backdrop-blur-sm"
                    onClick={() => setSelectedAdoption(null)}
                  />

                  <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black/80 backdrop-blur-xl border-purple-500/20 shadow-2xl">

                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">

                        <div>
                          <CardTitle className="text-2xl text-white">
                            Adoption Application
                          </CardTitle>

                          <CardDescription className="text-gray-400 mt-1">
                            Application details for {selectedAdoption.animal_name}
                          </CardDescription>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                          onClick={() => setSelectedAdoption(null)}
                        >
                          Close
                        </Button>

                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-6">

                        <div className="flex flex-col sm:flex-row gap-5">

                          {selectedAdoption.animal_image && (
                            <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                              <img
                                src={selectedAdoption.animal_image}
                                alt={selectedAdoption.animal_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">

                            <h3 className="text-xl font-semibold text-white">
                              {selectedAdoption.animal_name}
                            </h3>

                            {selectedAdoption.species && (
                              <p className="text-gray-400 mt-1">
                                {selectedAdoption.species}
                              </p>
                            )}

                            {selectedAdoption.shelter_name && (
                              <p className="text-sm text-gray-400 mt-3">
                                Shelter:{' '}
                                <span className="text-white">
                                  {selectedAdoption.shelter_name}
                                </span>
                              </p>
                            )}

                            <div className="mt-4">
                              <span
                                className={`inline-block rounded-full border px-3 py-1 text-xs ${
                                  selectedAdoption.status === 'COMPLETED'
                                    ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                                    : selectedAdoption.status === 'APPROVED'
                                      ? 'border-green-500/30 bg-green-500/20 text-green-300'
                                      : selectedAdoption.status === 'REJECTED'
                                        ? 'border-red-500/30 bg-red-500/20 text-red-300'
                                        : 'border-amber-500/30 bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {selectedAdoption.status === 'COMPLETED'
                                  ? 'Adoption Completed'
                                  : selectedAdoption.status === 'APPROVED'
                                    ? 'Approved'
                                    : selectedAdoption.status === 'REJECTED'
                                      ? 'Unsuccessful'
                                      : 'Under Review'}
                              </span>
                            </div>
                            {selectedAdoption.status === 'COMPLETED' && (
                            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                                <div>
                                  <p className="font-medium text-emerald-200">
                                    Adoption Completed 🎉
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-emerald-100/60">
                                    Your adoption of {selectedAdoption.animal_name} has been
                                    successfully completed. We hope you and{' '}
                                    {selectedAdoption.animal_name} have a wonderful journey
                                    together!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Applicant</p>
                            <p className="text-white mt-1">{selectedAdoption.full_name}</p>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Contact Number</p>
                            <p className="text-white mt-1">{selectedAdoption.phone}</p>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-white mt-1 break-all">{selectedAdoption.email}</p>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-gray-500">Submitted</p>
                            <p className="text-white mt-1">
                              {new Date(selectedAdoption.created_at).toLocaleString()}
                            </p>
                          </div>

                        </div>

                        <div>
                          <p className="text-sm text-gray-400 mb-2">Address</p>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-white text-sm whitespace-pre-line">
                              {selectedAdoption.address}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-400 mb-2">
                            Reason for Adoption
                          </p>
                          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-white text-sm whitespace-pre-line">
                              {selectedAdoption.reason}
                            </p>
                          </div>
                        </div>

                        {selectedAdoption.shelter_remark && (
                          <div>
                            <p className="text-sm text-gray-400 mb-2">
                              Shelter Remark
                            </p>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                              <p className="text-white text-sm whitespace-pre-line">
                                {selectedAdoption.shelter_remark}
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedAdoption.status === 'APPROVED' && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                            <h4 className="text-green-400 font-semibold">
                              Application Approved
                            </h4>
                            <p className="text-gray-300 text-sm mt-2 leading-6">
                              The shelter will contact you to arrange a Meet & Greet with {selectedAdoption.animal_name}.
                              Adoption Meet & Greets are handled by the shelter and are not veterinary appointments.
                            </p>
                          </div>
                        )}

                        {selectedAdoption.status === 'REJECTED' && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                            <h4 className="text-red-400 font-semibold">
                              Application Not Approved
                            </h4>
                            <p className="text-gray-300 text-sm mt-2 leading-6">
                              You can continue browsing other animals that are available for adoption.
                            </p>
                          </div>
                        )}

                        {selectedAdoption.status !== 'APPROVED' &&
                          selectedAdoption.status !== 'REJECTED' && (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                              <h4 className="text-yellow-400 font-semibold">
                                Pending Shelter Review
                              </h4>
                              <p className="text-gray-300 text-sm mt-2 leading-6">
                                The shelter is reviewing your application. You will be able to see the updated status here after a decision is made.
                              </p>
                            </div>
                          )}

                      </div>
                    </CardContent>

                  </Card>
                </div>
              )}


              {/* =================================================
                  DONATION TAB
                  ================================================= */}

              <TabsContent value="donations">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                <CardHeader>
                  <div className="flex items-start justify-between gap-4">

                    {/* LEFT — DONATION HISTORY */}
                    <div>
                      <CardTitle className="text-white">
                        Donation History
                      </CardTitle>

                      <CardDescription className="text-gray-400">
                        Your contributions to shelters
                      </CardDescription>
                    </div>


                    {/* RIGHT — TOTAL DONATION */}
                    <div
                      className="
                        shrink-0
                        text-right
                        px-4
                        py-3
                        rounded-xl
                        bg-purple-500/10
                        border
                        border-purple-500/20
                      "
                    >
                      <p className="text-xs text-gray-400 mb-1">
                        Total Donated
                      </p>

                      <p
                        className="
                          text-xl
                          font-bold
                          text-purple-400
                        "
                      >
                        RM {totalDonationAmount.toFixed(2)}
                      </p>
                    </div>

                  </div>
                </CardHeader>


                  <CardContent>

                    {donationsLoading ? (

                      <div className="text-center py-8">

                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

                        <p className="text-gray-400">
                          Loading donation history...
                        </p>

                      </div>

                    ) : donationHistory.length === 0 ? (

                      <div className="text-center py-8">

                        <p className="text-gray-400">
                          No donation history yet.
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          Your donations will appear here after you submit a receipt.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-4">

                        {donationHistory.map(
                          (donation) => (

                            <div
                              key={donation.id}
                              className="bg-white/5 p-4 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                            >

                              <div className="flex justify-between items-start gap-4">

                                <div>

                                  <h4 className="text-white font-medium">

                                    RM {Number(
                                      donation.amount
                                    ).toFixed(2)}

                                  </h4>


                                  <p className="text-sm text-gray-400">

                                    {donation.shelter}

                                  </p>


                                  <p className="text-xs text-gray-500 mt-1">

                                    {new Date(
                                      donation.created_at
                                    ).toLocaleDateString()}

                                  </p>

                                </div>


                                <div className="text-right">

                                  <span
                                    className={`px-3 py-1 rounded-full text-xs ${
                                      donation.status === 'COMPLETED'
                                        ? 'bg-green-600/20 text-green-400'
                                        : donation.status === 'PENDING_SHELTER'
                                          ? 'bg-yellow-600/20 text-yellow-400'
                                          : donation.status === 'PENDING_ADMIN'
                                            ? 'bg-blue-600/20 text-blue-400'
                                            : donation.status.includes('REJECTED')
                                              ? 'bg-red-600/20 text-red-400'
                                              : 'bg-gray-600/20 text-gray-400'
                                    }`}
                                  >

                                    {donation.status === 'COMPLETED'
                                      ? 'Completed'
                                      : donation.status === 'PENDING_SHELTER'
                                        ? 'Pending Vet'
                                        : donation.status === 'PENDING_ADMIN'
                                          ? 'Pending Admin'
                                          : donation.status === 'SHELTER_REJECTED'
                                            ? 'Rejected by Vet'
                                            : donation.status === 'ADMIN_REJECTED'
                                              ? 'Rejected by Admin'
                                              : donation.status}

                                  </span>

                                </div>

                              </div>


                              <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">

                                <span className="text-xs text-gray-500">

                                  Ref: {donation.transaction_id}

                                </span>


                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-white/20 text-white hover:bg-white/10"

                                  onClick={() =>
                                    setSelectedDonation(
                                      donation
                                    )
                                  }
                                >

                                  View Details

                                </Button>

                              </div>

                            </div>

                          )
                        )}


                        {/* TOTAL */}

                        <div className="pt-4 border-t border-white/10">

                          <div className="flex justify-between items-center">

                            <span className="text-gray-400">
                              Total Donated
                            </span>


                            <span className="text-2xl font-bold text-white">

                              RM {donationHistory
                                .reduce(
                                  (sum, donation) =>
                                    sum +
                                    Number(
                                      donation.amount
                                    ),
                                  0
                                )
                                .toFixed(2)}

                            </span>

                          </div>

                        </div>

                      </div>

                    )}

                  </CardContent>

                </Card>


                {/* =================================================
                    DONATION DETAILS MODAL
                    ================================================= */}

                {selectedDonation && (

                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

                    {/* Overlay */}

                    <div
                      className="absolute inset-0 bg-purple-950/30 backdrop-blur-sm"

                      onClick={() =>
                        setSelectedDonation(null)
                      }
                    />


                    {/* Modal */}

                    <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black/55 backdrop-blur-xl border-purple-500/20 shadow-2xl">

                      <CardHeader>

                        <div className="flex justify-between items-start gap-4">

                          <div>

                            <CardTitle className="text-2xl text-white">
                              Donation Details
                            </CardTitle>

                            <CardDescription className="text-gray-400 mt-1">
                              Transaction information
                            </CardDescription>

                          </div>


                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10"

                            onClick={() =>
                              setSelectedDonation(null)
                            }
                          >

                            Close

                          </Button>

                        </div>

                      </CardHeader>


                      <CardContent>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


                          {/* DONOR NAME */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Donor Name
                            </p>

                            <p className="text-white mt-1 font-medium">
                              {selectedDonation.full_name}
                            </p>

                          </div>


                          {/* EMAIL */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Email
                            </p>

                            <p className="text-white mt-1 font-medium break-all">
                              {selectedDonation.email}
                            </p>

                          </div>


                          {/* SHELTER */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Shelter
                            </p>

                            <p className="text-white mt-1 font-medium">
                              {selectedDonation.shelter}
                            </p>

                          </div>


                          {/* PAYMENT METHOD */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Payment Method
                            </p>

                            <p className="text-white mt-1 font-medium">
                              {selectedDonation.payment_method}
                            </p>

                          </div>


                          {/* AMOUNT */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Amount
                            </p>

                            <p className="text-2xl font-bold text-amber-400 mt-1">

                              RM {Number(
                                selectedDonation.amount
                              ).toFixed(2)}

                            </p>

                          </div>


                          {/* STATUS */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Status
                            </p>


                            <span
                              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs ${
                                selectedDonation.status === 'COMPLETED'
                                  ? 'bg-green-600/20 text-green-400'
                                  : selectedDonation.status === 'PENDING_SHELTER'
                                    ? 'bg-yellow-600/20 text-yellow-400'
                                    : selectedDonation.status === 'PENDING_ADMIN'
                                      ? 'bg-blue-600/20 text-blue-400'
                                      : selectedDonation.status.includes('REJECTED')
                                        ? 'bg-red-600/20 text-red-400'
                                        : 'bg-gray-600/20 text-gray-400'
                              }`}
                            >

                              {selectedDonation.status === 'COMPLETED'
                                ? 'Completed'
                                : selectedDonation.status === 'PENDING_SHELTER'
                                  ? 'Pending Vet Verification'
                                  : selectedDonation.status === 'PENDING_ADMIN'
                                    ? 'Pending Admin Verification'
                                    : selectedDonation.status === 'SHELTER_REJECTED'
                                      ? 'Rejected by Vet'
                                      : selectedDonation.status === 'ADMIN_REJECTED'
                                        ? 'Rejected by Admin'
                                        : selectedDonation.status}

                            </span>

                          </div>


                          {/* TRANSACTION ID */}

                          <div className="md:col-span-2">

                            <p className="text-sm text-gray-400">
                              Transaction ID
                            </p>

                            <p className="text-white mt-1 break-all">
                              {selectedDonation.transaction_id}
                            </p>

                          </div>


                          {/* RECEIPT */}

                          {(selectedDonation.receipt_url ||
                            selectedDonation.receipt) && (

                            <div className="md:col-span-2">

                              <p className="text-sm text-gray-400 mb-2">
                                Payment Receipt
                              </p>


                              <div className="bg-black/30 border border-white/10 rounded-lg p-3">

                                <img
                                  src={
                                    selectedDonation.receipt_url ||
                                    selectedDonation.receipt
                                  }

                                  alt="Donation receipt"

                                  className="w-full max-h-80 object-contain rounded-lg"
                                />

                              </div>


                              <Button
                                variant="outline"

                                className="mt-3 border-white/20 text-white hover:bg-white/10"

                                onClick={() =>
                                  window.open(
                                    selectedDonation.receipt_url ||
                                    selectedDonation.receipt,
                                    '_blank'
                                  )
                                }
                              >

                                Open Full Receipt

                              </Button>

                            </div>

                          )}


                          {/* DATE */}

                          <div>

                            <p className="text-sm text-gray-400">
                              Donation Date
                            </p>

                            <p className="text-white mt-1">

                              {new Date(
                                selectedDonation.created_at
                              ).toLocaleString()}

                            </p>

                          </div>


                          {/* PHONE */}

                          {selectedDonation.phone && (

                            <div>

                              <p className="text-sm text-gray-400">
                                Contact Number
                              </p>

                              <p className="text-white mt-1">
                                {selectedDonation.phone}
                              </p>

                            </div>

                          )}


                          {/* VET REMARK */}

                          {selectedDonation.shelter_remark && (

                            <div className="md:col-span-2">

                              <p className="text-sm text-gray-400">
                                Vet Remark
                              </p>

                              <div className="mt-1 bg-white/5 border border-white/10 rounded-lg p-3">

                                <p className="text-white text-sm">

                                  {selectedDonation.shelter_remark}

                                </p>

                              </div>

                            </div>

                          )}


                          {/* ADMIN REMARK */}

                          {selectedDonation.admin_remark && (

                            <div className="md:col-span-2">

                              <p className="text-sm text-gray-400">
                                Admin Remark
                              </p>

                              <div className="mt-1 bg-white/5 border border-white/10 rounded-lg p-3">

                                <p className="text-white text-sm">

                                  {selectedDonation.admin_remark}

                                </p>

                              </div>

                            </div>

                          )}

                        </div>

                      </CardContent>

                    </Card>

                  </div>

                )}

              </TabsContent>


              {/* =================================================
                  VETERINARY APPOINTMENTS
                  ================================================= */}

              <TabsContent value="appointments">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardHeader>

                    <CardTitle className="text-white">
                      Veterinary Appointments
                    </CardTitle>

                    <CardDescription className="text-gray-400">
                      Your appointments with veterinary clinics
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    {loadingAppointments ? (

                      <div className="text-center py-8">

                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

                        <p className="text-gray-400">
                          Loading veterinary appointments...
                        </p>

                      </div>

                    ) : veterinaryAppointments.length === 0 ? (

                      <div className="text-center py-10">

                        <p className="text-gray-400">
                          No veterinary appointments yet.
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                          Veterinary appointments booked through a clinic will appear here.
                        </p>

                        <Button
                          type="button"
                          className="mt-5 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => navigate('/user/vet-clinic')}
                        >
                          Browse Veterinary Clinics
                        </Button>

                      </div>

                    ) : (

                      <div className="space-y-4">

                        {veterinaryAppointments.map((appointment) => (

                          <div
                            key={appointment.id}
                            className={`p-4 rounded-lg border transition-all ${
                              appointment.isFree &&
                              appointment.bookingSource === 'TRAINING_REWARD'
                                ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-400/30 hover:border-emerald-400/50 hover:from-emerald-500/15 hover:to-cyan-500/15'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">

                              <div className="min-w-0">

                                <h4 className="text-white font-medium">
                                  {appointment.clinic || 'Veterinary Clinic'}
                                </h4>

                                <p className="text-sm text-gray-400 mt-2">
                                  Pet:{' '}
                                  <span className="text-white">
                                    {appointment.pet}
                                  </span>
                                </p>

                                <p className="text-sm text-gray-400">
                                  Service:{' '}
                                  <span className="text-cyan-400">
                                    {appointment.type}
                                  </span>
                                </p>

                                {appointment.isFree &&
                                  appointment.bookingSource === 'TRAINING_REWARD' && (
                                    <div className="flex items-center gap-2 mt-2 mb-1">
                                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                                        FREE
                                      </span>

                                      <span className="text-xs font-medium text-cyan-300">
                                        Training Reward
                                      </span>
                                    </div>
                                  )}

                                {appointment.vetName ? (
                                  <p className="text-sm text-gray-400">
                                    Vet:{' '}
                                    <span className="text-white">
                                      {appointment.vetName}
                                    </span>
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    Vet: Waiting for assignment
                                  </p>
                                )}

                                <p className="text-sm text-gray-400 mt-2">
                                  {appointment.date} at {appointment.time}
                                </p>

                                {appointment.medicalNotes && (
                                  <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                                    <p className="text-sm font-semibold text-cyan-300 mb-2">
                                      Medical Notes from Veterinarian
                                    </p>

                                    <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                                      {appointment.medicalNotes}
                                    </p>
                                  </div>
                                )}

                              </div>

                              <span
                                className={`shrink-0 px-3 py-1 rounded-full text-xs ${
                                  appointment.status === 'Completed'
                                    ? 'bg-green-600/20 text-green-400'
                                    : appointment.status === 'Cancelled'
                                      ? 'bg-red-600/20 text-red-400'
                                      : appointment.status === 'In Progress'
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'bg-yellow-600/20 text-yellow-400'
                                }`}
                              >
                                {appointment.status}
                              </span>

                            </div>

                          </div>

                        ))}

                      </div>

                    )}

                  </CardContent>

                </Card>

              </TabsContent>


              {/* =================================================
                  TRAINING
                  ================================================= */}
              <TabsContent value="training">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardHeader>

                    <CardTitle className="text-white">
                      Training History
                    </CardTitle>

                    <CardDescription className="text-gray-400">
                      Courses you've completed
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    <div className="space-y-4">

                      {trainingAttempts.length > 0 ? (

                        trainingAttempts.map((training) => (

                          <div
                            key={training.id}
                            className="bg-white/5 p-4 rounded-lg border border-white/10"
                          >

                            <div className="flex justify-between items-start mb-2">

                              <div>

                                <h4 className="text-white font-medium">
                                  {training.training_title}
                                </h4>

                                <p className="text-sm text-gray-400">
                                  {training.quiz_title}
                                </p>

                                <p className="text-sm text-gray-400">
                                  Completed:{' '}
                                  {new Date(
                                    training.completed_at
                                  ).toLocaleDateString()}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                  Attempt {training.attempt_number}
                                  {' · '}
                                  {training.correct_answers}/{training.total_questions}
                                  {' correct'}
                                </p>

                              </div>

                              <div className="text-right">

                                <div
                                  className={`text-2xl font-bold ${
                                    training.passed
                                      ? 'text-green-400'
                                      : 'text-yellow-400'
                                  }`}
                                >
                                  {training.score}%
                                </div>

                                <p className="text-xs text-gray-400 mb-2">
                                  {training.passed ? 'Passed' : 'Not Passed'}
                                </p>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openTrainingReview(training.id)}
                                  disabled={reviewLoading}
                                  className="border-white/20 text-white hover:bg-white/10"
                                >
                                  View Review
                                </Button>

                              </div>

                            </div>

                          </div>

                        ))

                      ) : (

                        <p className="text-gray-400">
                          No training completed yet.
                        </p>

                      )}

                    </div>

                  </CardContent>

                </Card>

              </TabsContent>


{/* =================================================
    BADGES
    ================================================= */}

<TabsContent value="badges">

  <Card className="bg-black/40 backdrop-blur-xl border-white/10">

    <CardHeader>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* LEFT - BADGE TITLE */}
        <div>
          <CardTitle className="text-white">
            Achievement Badges
          </CardTitle>

          <CardDescription className="text-gray-400 mt-1">
            Badges earned from training quizzes
          </CardDescription>
        </div>

        {/* RIGHT - TRAINING REWARD STATUS */}
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400">
            Training Reward
          </p>

          <p className="text-sm font-semibold text-white mt-1">
            Free Veterinary Appointment
          </p>

          {trainingRewardLoading ? (
            <p className="text-xs text-gray-500 mt-1">
              Checking reward...
            </p>
          ) : trainingReward?.reward.status === 'AVAILABLE' ? (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
              1 Free Appointment Available
            </span>
          ) : trainingReward?.reward.status === 'REDEEMED' ? (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20">
              Reward Redeemed
            </span>
          ) : (
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10">
              Locked
            </span>
          )}
        </div>

      </div>

    </CardHeader>


    <CardContent>

      {/* BADGE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

        {trainingTopics.map((training) => {

          const earnedBadge = formData.badges?.find(
            (badge) =>
              Number(badge.training_id) ===
              Number(training.id)
          );

          const isEarned = !!earnedBadge;

          return (

            <div
              key={training.id}
              className={`p-5 rounded-lg border text-center transition-all ${
                isEarned
                  ? 'bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-500/30'
                  : 'bg-gray-800/40 border-gray-600/30'
              }`}
            >

              <Award
                className={`w-12 h-12 mx-auto mb-3 ${
                  isEarned
                    ? 'text-amber-400'
                    : 'text-gray-600'
                }`}
              />

              <h4
                className={`font-medium mb-1 ${
                  isEarned
                    ? 'text-white'
                    : 'text-gray-500'
                }`}
              >
                {training.title}
              </h4>

              {isEarned ? (

                <>
                  <p className="text-xs text-amber-400">
                    ✓ Completed
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Earned on{' '}
                    {new Date(
                      earnedBadge.earned_at
                    ).toLocaleDateString()}
                  </p>
                </>

              ) : (

                <p className="text-xs text-gray-500">
                  🔒 Not earned yet
                </p>

              )}

            </div>

          );

        })}

      </div>


      {/* BADGE PROGRESS */}
      <div className="mt-6 pt-5 border-t border-white/10">

        <div className="flex justify-between items-center mb-2">

          <span className="text-gray-400">
            Badge Progress
          </span>

          <span className="text-white font-semibold">
            {Math.min(
              formData.badges?.length || 0,
              trainingTopics.length
            )}{' '}
            /{' '}
            {trainingTopics.length}
          </span>

        </div>


        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
            style={{
              width: `${
                trainingTopics.length > 0
                  ? Math.min(
                      ((formData.badges?.length || 0) /
                        trainingTopics.length) *
                        100,
                      100
                    )
                  : 0
              }%`,
            }}
          />

        </div>

      </div>

      {/* TRAINING COMPLETION REWARD */}
      <div className="mt-6">

        {trainingReward?.reward?.status === 'LOCKED' && (

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">

            <div>
              <p className="text-xs uppercase tracking-wider text-purple-300/70">
                Training Completion Reward
              </p>

              <h4 className="text-purple-200 font-semibold text-xl mt-1">
                Free Veterinary Appointment
              </h4>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-gray-400">
                  🔒 Reward Locked
                </span>
              </div>

              <p className="text-gray-400 text-sm mt-2">
                Complete all training badges to unlock one complimentary
                Veterinary Appointment.
              </p>
            </div>

          </div>

        )}

        {trainingTopics.length > 0 &&
        (formData.badges?.length || 0) >= trainingTopics.length &&
        trainingReward?.reward.status === 'AVAILABLE' && (

          <div className="p-6 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6 text-emerald-300" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-300/70">
                    Training Completion Reward
                  </p>

                  <h4 className="text-emerald-200 font-semibold text-xl mt-1">
                    Free Veterinary Appointment
                  </h4>

                  <p className="text-gray-300 text-sm mt-2 leading-6">
                    Congratulations! You completed all {trainingTopics.length}
                    training badges and earned one complimentary veterinary appointment.
                  </p>

                  <p className="text-gray-400 text-xs mt-3">
                    This reward can be used once and only applies to the
                    Veterinary Appointment.
                  </p>

                </div>

              </div>

              <Button
                type="button"
                onClick={() =>
                  navigate('/user/vet-clinic?reward=training')
                }
                className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6"
              >
                Redeem Free Veterinary Appointment
              </Button>

            </div>

          </div>

        )}


        {trainingReward?.reward.status === 'REDEEMED' && (

          <div className="p-6 rounded-xl bg-purple-500/[0.08] border border-purple-500/20">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-purple-300" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-purple-300/70">
                    Training Completion Reward
                  </p>

                  <h4 className="text-purple-200 font-semibold text-xl mt-1">
                    Reward Redeemed
                  </h4>

                  <p className="text-gray-300 text-sm mt-2">
                    Your complimentary veterinary appointment has
                    already been used.
                  </p>

                  {trainingReward?.reward?.redeemed_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Redeemed on{' '}
                      {new Date(
                        trainingReward?.reward?.redeemed_at
                      ).toLocaleDateString()}
                    </p>
                  )}

                </div>

              </div>

              {trainingReward?.reward?.appointment_id && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActiveTab('appointments');
                  }}
                  className="shrink-0 border-purple-500/30 text-purple-200 hover:bg-purple-500/10"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Appointment
                </Button>
              )}

            </div>

          </div>

        )}

      </div>

    </CardContent>

  </Card>

</TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {reviewAttempt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-black/95 border border-white/10 rounded-2xl shadow-2xl">

          {/* Review Header */}
          <div className="p-6 border-b border-white/10">

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="text-xl font-bold text-white">
                  Quiz Review
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  {reviewAttempt.training_title}
                </p>

              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setReviewAttempt(null);
                  setReviewQuestionIndex(0);
                }}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </Button>

            </div>


            {/* Previous / Question / Next */}
            <div className="flex items-center justify-between gap-4">

              <Button
                variant="outline"
                disabled={reviewQuestionIndex === 0}
                onClick={() =>
                  setReviewQuestionIndex(
                    (current) => current - 1
                  )
                }
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
              >
                ← Previous
              </Button>


              <div className="text-center flex-1">

                <p className="text-white font-semibold">
                  Question {reviewQuestionIndex + 1} of{' '}
                  {reviewAttempt.questions.length}
                </p>

              </div>


              <Button
                variant="outline"
                disabled={
                  reviewQuestionIndex ===
                  reviewAttempt.questions.length - 1
                }
                onClick={() =>
                  setReviewQuestionIndex(
                    (current) => current + 1
                  )
                }
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
              >
                Next →
              </Button>

            </div>

          </div>


          {/* Question Content */}
        {currentReviewQuestion && (
          <div className="p-6">

            {/* Question */}
            <div className="mb-6">

              <h3 className="text-lg font-semibold text-white leading-relaxed">
                {currentReviewQuestion.question}
              </h3>

            </div>

            {/* Answer Options */}
            <div className="space-y-3">

              {Array.isArray(currentReviewQuestion.options) &&
                currentReviewQuestion.options.map(
                  (option: string, optionIndex: number) => {

                    const isCorrect =
                      optionIndex ===
                      Number(currentReviewQuestion.correct_answer);

                    const isUserAnswer =
                      optionIndex ===
                      Number(currentReviewQuestion.user_answer);

                    let optionClass =
                      'border-white/10 bg-white/5';

                    if (isCorrect) {
                      optionClass =
                        'border-green-500/50 bg-green-500/10';
                    } else if (isUserAnswer) {
                      optionClass =
                        'border-red-500/50 bg-red-500/10';
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`p-4 rounded-xl border ${optionClass}`}
                      >

                        <div className="flex items-center justify-between gap-4">

                          <div className="flex items-start gap-3 min-w-0">

                            <span className="text-white font-semibold flex-shrink-0">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>

                            <span className="text-gray-200">
                              {option}
                            </span>

                          </div>

                          <div className="flex-shrink-0">

                            {isCorrect && (
                              <span className="text-green-400 text-sm font-semibold">
                                ✓ Correct
                              </span>
                            )}

                            {!isCorrect && isUserAnswer && (
                              <span className="text-red-400 text-sm font-semibold">
                                ✕ Your Answer
                              </span>
                            )}

                          </div>

                        </div>

                      </div>
                    );
                  }
                )}

            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-5 border-t border-white/10">

              <div className="flex items-center gap-2">

                <span className="w-3 h-3 rounded-full bg-green-500" />

                <span className="text-sm text-gray-400">
                  Correct answer
                </span>

              </div>

              <div className="flex items-center gap-2">

                <span className="w-3 h-3 rounded-full bg-red-500" />

                <span className="text-sm text-gray-400">
                  Your incorrect answer
                </span>

              </div>

            </div>

          </div>
        )}
        </div>

      </div>
    )}
    </div>
  );

}