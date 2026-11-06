import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProfile() {
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <h1 className="text-2xl font-bold text-white">Admin Profile</h1>

      <Card className="bg-black/40 backdrop-blur-xl border-white/10">
        <CardHeader className="flex flex-col items-center text-center">

          <Avatar className="w-28 h-28 mb-4">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="text-2xl">
              {user?.username?.[0]}
            </AvatarFallback>
          </Avatar>

          {!isEditing ? (
            <>
              <CardTitle className="text-white text-xl">
                {user?.username}
              </CardTitle>
              <p className="text-gray-400">{user?.email}</p>
            </>
          ) : (
            <div className="w-full space-y-3 text-left">
              <div>
                <Label className="text-white">Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Email</Label>
                <Input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label className="text-white">Contact Number</Label>
                <Input
                  value={formData.contactNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNumber: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">

          {!isEditing ? (
            <>
              {/* ALWAYS SHOW INFO */}
              <div>
                <p className="text-gray-400 text-sm">Contact Number</p>
                <p className="text-white">
                  {user?.contactNumber || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm">Bio</p>
                <p className="text-white">
                  {user?.bio || 'No bio yet'}
                </p>
              </div>

              {/* ORIGINAL BUTTON STYLE KEPT */}
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label className="text-white">Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="bg-white/10 border-white/20 text-white"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}