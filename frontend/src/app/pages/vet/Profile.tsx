import { useEffect, useState } from 'react';
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
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'http://127.0.0.1:8000';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  bio: string;
  profile_photo: string | null;
}

interface Appointment {
  id: number;
  pet_name: string;
  species: string;
  adopter_name: string;
  date: string;
  time: string;
  appointment_type: string;
  appointment_type_display: string;
  status: string;
  status_display: string;
}

export default function VetProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    bio: '',
  });

  const token = sessionStorage.getItem('access_token');

  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        toast.error('Please login again.');
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [profileResponse, appointmentsResponse] =
          await Promise.all([
            fetch(`${API_BASE}/api/profile/`, {
              headers,
            }),
            fetch(`${API_BASE}/api/appointments/vet/`, {
              headers,
            }),
          ]);

        if (!profileResponse.ok) {
          throw new Error('Failed to load profile');
        }

        if (!appointmentsResponse.ok) {
          throw new Error('Failed to load appointments');
        }

        const profileData = await profileResponse.json();
        const appointmentData = await appointmentsResponse.json();

        // Save profile data for normal display
        setProfile(profileData);

        // IMPORTANT:
        // Fill the Edit Profile fields with the backend data
        setFormData({
          username: profileData.username || '',
          email: profileData.email || '',
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
        });

        setAppointments(
          Array.isArray(appointmentData)
            ? appointmentData
            : appointmentData.results || []
        );
      } catch (error) {
        console.error('Failed to load vet profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const completedCount = appointments.filter(
    a => a.status === 'COMPLETED'
  ).length;

  const cancelledCount = appointments.filter(
    a => a.status === 'CANCELLED'
  ).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const upcomingCount = appointments.filter(a => {
    const appointmentDate = new Date(`${a.date}T00:00:00`);

    return (
      appointmentDate >= today &&
      appointmentDate <= sevenDaysLater &&
      a.status !== 'CANCELLED'
    );
  }).length;

  const recentAppointments = [...appointments]
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);

      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  const statusCounts = {
    Scheduled: appointments.filter(
      a => a.status === 'SCHEDULED'
    ).length,

    'In Progress': appointments.filter(
      a => a.status === 'IN_PROGRESS'
    ).length,

    Completed: completedCount,

    Cancelled: cancelledCount,
  };

  const handleSave = async () => {
    if (!token) {
      toast.error('Please login again.');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_BASE}/api/profile/`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        console.error('Profile update failed:', errorData);

        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();

      // Update the profile displayed outside Edit mode
      setProfile(prev => ({
        ...(prev as ProfileData),
        ...updatedProfile,
      }));

      // Keep formData synced with saved backend data
      setFormData({
        username: updatedProfile.username || '',
        email: updatedProfile.email || '',
        full_name: updatedProfile.full_name || '',
        phone: updatedProfile.phone || '',
        bio: updatedProfile.bio || '',
      });

      setIsEditing(false);

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Header */}
      <section className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border-b border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            My Profile
          </h1>

          <p className="text-xl text-gray-300">
            Manage your veterinary staff account and view activity.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">

              <CardHeader>

                <div className="flex flex-col items-center">

                  <Avatar className="w-32 h-32 mb-4">

                    <AvatarImage
                      src={
                        profile?.profile_photo ||
                        user?.profilePicture
                      }
                    />

                    <AvatarFallback className="text-4xl">
                      {profile?.username?.[0] ||
                        user?.username?.[0]}
                    </AvatarFallback>

                  </Avatar>

                  {!isEditing ? (
                    <>
                      <CardTitle className="text-2xl text-white text-center">
                        {profile?.full_name ||
                          profile?.username}
                      </CardTitle>

                      <CardDescription className="text-gray-400 text-center">
                        {profile?.email}
                      </CardDescription>

                      <span className="mt-2 px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-400 border border-green-500/30">
                        Vet Staff
                      </span>
                    </>
                  ) : (

                    /* EDIT MODE */
                    <div className="w-full space-y-4">

                      {/* Username */}
                      <div className="space-y-2">
                        <Label className="text-white">
                          Username
                        </Label>

                        <Input
                          value={formData.username}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label className="text-white">
                          Email
                        </Label>

                        <Input
                          type="email"
                          value={formData.email}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label className="text-white">
                          Full Name
                        </Label>

                        <Input
                          value={formData.full_name}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              full_name: e.target.value,
                            })
                          }
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      {/* Contact Number */}
                      <div className="space-y-2">
                        <Label className="text-white">
                          Contact Number
                        </Label>

                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              phone: e.target.value,
                            })
                          }
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                    </div>
                  )}

                </div>

              </CardHeader>

              <CardContent>

                {!isEditing ? (
                  <>

                    {/* Contact Number */}
                    <div className="mb-4">
                      <Label className="text-gray-400">
                        Contact Number
                      </Label>

                      <p className="text-white mt-2">
                        {profile?.phone || 'Not provided'}
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                      <Label className="text-gray-400">
                        Bio
                      </Label>

                      <p className="text-white mt-2">
                        {profile?.bio || 'No bio yet'}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        // Make sure edit fields contain
                        // the latest displayed profile data
                        setFormData({
                          username: profile?.username || '',
                          email: profile?.email || '',
                          full_name: profile?.full_name || '',
                          phone: profile?.phone || '',
                          bio: profile?.bio || '',
                        });

                        setIsEditing(true);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>

                  </>
                ) : (

                  <>

                    {/* Bio */}
                    <div className="mb-4 space-y-2">

                      <Label className="text-white">
                        Bio
                      </Label>

                      <Textarea
                        value={formData.bio}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            bio: e.target.value,
                          })
                        }
                        className="bg-white/10 border-white/20 text-white"
                        rows={4}
                      />

                    </div>

                    <div className="flex gap-2">

                      <Button
                        onClick={() => {
                          // Cancel changes and restore
                          // original backend values
                          setFormData({
                            username: profile?.username || '',
                            email: profile?.email || '',
                            full_name: profile?.full_name || '',
                            phone: profile?.phone || '',
                            bio: profile?.bio || '',
                          });

                          setIsEditing(false);
                        }}
                        variant="outline"
                        className="flex-1 border-white/20"
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>

                    </div>

                  </>
                )}

              </CardContent>

            </Card>

            {/* Real Vet Stats */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">

              <CardHeader>
                <CardTitle className="text-white text-base">
                  Appointment Stats
                </CardTitle>
              </CardHeader>

              <CardContent>

                <div className="grid grid-cols-2 gap-3">

                  {/* Total */}
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-white/10">

                    <Calendar className="w-5 h-5 text-cyan-400 mx-auto mb-1" />

                    <p className="text-white font-bold text-lg">
                      {appointments.length}
                    </p>

                    <p className="text-gray-400 text-xs">
                      Appointments Handled
                    </p>

                  </div>

                  {/* Completed */}
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-white/10">

                    <CheckCircle className="w-5 h-5 text-cyan-400 mx-auto mb-1" />

                    <p className="text-white font-bold text-lg">
                      {completedCount}
                    </p>

                    <p className="text-gray-400 text-xs">
                      Completed
                    </p>

                  </div>

                  {/* Upcoming */}
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-white/10">

                    <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />

                    <p className="text-white font-bold text-lg">
                      {upcomingCount}
                    </p>

                    <p className="text-gray-400 text-xs">
                      Upcoming (7 Days)
                    </p>

                  </div>

                  {/* Cancelled */}
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-white/10">

                    <XCircle className="w-5 h-5 text-cyan-400 mx-auto mb-1" />

                    <p className="text-white font-bold text-lg">
                      {cancelledCount}
                    </p>

                    <p className="text-gray-400 text-xs">
                      Cancelled
                    </p>

                  </div>

                </div>

              </CardContent>

            </Card>

          </div>

          {/* Activity */}
          <div className="lg:col-span-2">

            <Tabs
              defaultValue="appointments"
              className="space-y-6"
            >

              <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">

                <TabsTrigger value="appointments">
                  Recent Appointments
                </TabsTrigger>

                <TabsTrigger value="summary">
                  Appointment Summary
                </TabsTrigger>

              </TabsList>

              {/* Recent Appointments */}
              <TabsContent value="appointments">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardHeader>

                    <CardTitle className="text-white">
                      Recent Appointments
                    </CardTitle>

                    <CardDescription className="text-gray-400">
                      Your latest patient appointments
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    <div className="space-y-4">

                      {recentAppointments.length === 0 ? (

                        <p className="text-gray-400 text-center py-8">
                          No appointments found.
                        </p>

                      ) : (

                        recentAppointments.map(a => (

                          <div
                            key={a.id}
                            className="bg-white/5 p-4 rounded-lg border border-white/10"
                          >

                            <div className="flex justify-between items-start">

                              <div>

                                <h4 className="text-white font-medium">

                                  {a.pet_name || 'Unknown Pet'}

                                  {a.species && (
                                    <span className="text-gray-500 text-sm ml-2">
                                      ({a.species})
                                    </span>
                                  )}

                                </h4>

                                <p className="text-sm text-gray-400">
                                  Owner: {a.adopter_name || 'Unknown Owner'}
                                </p>

                                <p className="text-xs text-gray-500">

                                  {a.appointment_type_display ||
                                    a.appointment_type}

                                  {' · '}

                                  {a.date}

                                  {' · '}

                                  {a.time}

                                </p>

                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-xs ${
                                  a.status === 'COMPLETED'
                                    ? 'bg-green-600/20 text-green-400'
                                    : a.status === 'CANCELLED'
                                      ? 'bg-red-600/20 text-red-400'
                                      : a.status === 'IN_PROGRESS'
                                        ? 'bg-blue-600/20 text-blue-400'
                                        : 'bg-yellow-600/20 text-yellow-400'
                                }`}
                              >
                                {a.status_display || a.status}
                              </span>

                            </div>

                          </div>

                        ))

                      )}

                    </div>

                  </CardContent>

                </Card>

              </TabsContent>

              {/* Appointment Summary */}
              <TabsContent value="summary">

                <Card className="bg-black/40 backdrop-blur-xl border-white/10">

                  <CardHeader>

                    <CardTitle className="text-white">
                      Appointment Summary
                    </CardTitle>

                    <CardDescription className="text-gray-400">
                      Current status of your veterinary appointments
                    </CardDescription>

                  </CardHeader>

                  <CardContent>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      {/* Scheduled */}
                      <div className="bg-white/5 p-5 rounded-lg border border-white/10">

                        <div className="flex items-center gap-3">

                          <Clock className="w-6 h-6 text-cyan-400" />

                          <div>

                            <p className="text-gray-400 text-sm">
                              Scheduled
                            </p>

                            <p className="text-white text-2xl font-bold">
                              {statusCounts.Scheduled}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* In Progress */}
                      <div className="bg-white/5 p-5 rounded-lg border border-white/10">

                        <div className="flex items-center gap-3">

                          <BarChart3 className="w-6 h-6 text-cyan-400" />

                          <div>

                            <p className="text-gray-400 text-sm">
                              In Progress
                            </p>

                            <p className="text-white text-2xl font-bold">
                              {statusCounts['In Progress']}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* Completed */}
                      <div className="bg-white/5 p-5 rounded-lg border border-white/10">

                        <div className="flex items-center gap-3">

                          <CheckCircle className="w-6 h-6 text-cyan-400" />

                          <div>

                            <p className="text-gray-400 text-sm">
                              Completed
                            </p>

                            <p className="text-white text-2xl font-bold">
                              {statusCounts.Completed}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* Cancelled */}
                      <div className="bg-white/5 p-5 rounded-lg border border-white/10">

                        <div className="flex items-center gap-3">

                          <XCircle className="w-6 h-6 text-cyan-400" />

                          <div>

                            <p className="text-gray-400 text-sm">
                              Cancelled
                            </p>

                            <p className="text-white text-2xl font-bold">
                              {statusCounts.Cancelled}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </CardContent>

                </Card>

              </TabsContent>

            </Tabs>

          </div>

        </div>
      </div>

    </div>
  );
}