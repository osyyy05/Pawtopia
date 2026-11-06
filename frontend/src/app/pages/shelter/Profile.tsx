import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Save, Building2, PawPrint, Heart, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const shelterStats = [
  { label: 'Animals Managed', value: '48', icon: PawPrint },
  { label: 'Adoptions Facilitated', value: '89', icon: Heart },
  { label: 'Appointments Held', value: '134', icon: Calendar },
  { label: 'Years Active', value: '5', icon: Building2 },
];

const recentAdoptions = [
  { id: '1', petName: 'Luna', adopter: 'John Tan', date: '2026-06-08', status: 'Completed' },
  { id: '2', petName: 'Buddy', adopter: 'Amy Chen', date: '2026-06-05', status: 'Completed' },
  { id: '3', petName: 'Whiskers', adopter: 'Emily Wong', date: '2026-06-01', status: 'In Progress' },
];

const recentListings = [
  { id: '1', name: 'Rocky', breed: 'German Shepherd', postedDate: '2026-06-01', applications: 5 },
  { id: '2', name: 'Nala', breed: 'Siamese Cat', postedDate: '2026-05-20', applications: 3 },
  { id: '3', name: 'Luna', breed: 'Golden Retriever', postedDate: '2026-06-05', applications: 12 },
];

export default function ShelterProfile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    contactNumber: user?.contactNumber || ''
  });

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 backdrop-blur-xl border-b border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="text-xl text-gray-300">Manage your shelter organiser account and view activity.</p>
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
                    <AvatarImage src={user?.profilePicture} />
                    <AvatarFallback className="text-4xl">{user?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  {!isEditing ? (
                    <>
                      <CardTitle className="text-2xl text-white text-center">{user?.username}</CardTitle>
                      <CardDescription className="text-gray-400 text-center">{user?.email}</CardDescription>
                      <span className="mt-2 px-3 py-1 rounded-full text-xs bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">Shelter Organiser</span>
                    </>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Username</Label>
                        <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Contact Number</Label>
                        <Input type="tel" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <>
                    <div className="mb-4">
                      <Label className="text-gray-400">Contact Number</Label>
                      <p className="text-white mt-2">{user?.contactNumber || 'Not provided'}</p>
                    </div>
                    <div className="mb-4">
                      <Label className="text-gray-400">Bio</Label>
                      <p className="text-white mt-2">{user?.bio || 'No bio yet'}</p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 space-y-2">
                      <Label className="text-white">Bio</Label>
                      <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="bg-white/10 border-white/20 text-white" rows={4} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1 border-white/20">Cancel</Button>
                      <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                        <Save className="w-4 h-4 mr-2" /> Save
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Shelter Stats */}
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">Shelter Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {shelterStats.map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white/5 p-3 rounded-lg text-center border border-white/10">
                        <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                        <p className="text-white font-bold text-lg">{s.value}</p>
                        <p className="text-gray-400 text-xs">{s.label}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="adoptions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
                <TabsTrigger value="adoptions">Recent Adoptions</TabsTrigger>
                <TabsTrigger value="listings">Active Listings</TabsTrigger>
              </TabsList>

              <TabsContent value="adoptions">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Adoptions</CardTitle>
                    <CardDescription className="text-gray-400">Adoptions you've facilitated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentAdoptions.map(a => (
                        <div key={a.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-medium">{a.petName}</h4>
                              <p className="text-sm text-gray-400">Adopter: {a.adopter}</p>
                              <p className="text-xs text-gray-500 mt-1">{a.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs ${a.status === 'Completed' ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'}`}>{a.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings">
                <Card className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Active Listings</CardTitle>
                    <CardDescription className="text-gray-400">Current adoption listings with application counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentListings.map(l => (
                        <div key={l.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white font-medium">{l.name}</h4>
                              <p className="text-sm text-gray-400">{l.breed}</p>
                              <p className="text-xs text-gray-500 mt-1">Posted: {l.postedDate}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-cyan-400">{l.applications}</p>
                              <p className="text-xs text-gray-400">Applications</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
