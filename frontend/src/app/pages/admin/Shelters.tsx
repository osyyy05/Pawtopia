
import { useEffect, useState } from 'react';
import AdminManagement from './AdminManagement';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

interface Shelter {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

export default function Shelters() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  const API = 'http://127.0.0.1:8000/api/admin/shelters/';

  const getHeaders = () => ({
    Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  });

  const fetchShelters = async () => {
    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API, {
        method: 'GET',
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to load shelters.'
        );
      }

      setShelters(
        Array.isArray(data)
          ? data.map((shelter: any) => ({
              id: String(shelter.id),
              username: shelter.username || '-',
              email: shelter.email || '-',
              role: shelter.role || 'Shelter',
              status: shelter.is_active ? 'Active' : 'Inactive',
              joined: shelter.date_joined
                ? new Date(shelter.date_joined).toLocaleDateString()
                : '-',
            }))
          : []
      );
    } catch (error) {
      console.error('Failed to load shelters:', error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load shelters.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  const handleEdit = (id: string) => {
    const shelter = shelters.find((item) => item.id === String(id));

    if (!shelter) return;

    setSelectedShelter(shelter);
    setUsername(shelter.username);
    setEmail(shelter.email);
    setIsActive(shelter.status === 'Active');
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!selectedShelter || saving) return;

    if (!username.trim() || !email.trim()) {
      toast.error('Username and email are required.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API}${selectedShelter.id}/`,
        {
          method: 'PATCH',
          headers: getHeaders(),
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            is_active: isActive,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update shelter.'
        );
      }

      toast.success('Shelter updated successfully!');
      setEditOpen(false);
      setSelectedShelter(null);
      await fetchShelters();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update shelter.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const shelter = shelters.find((item) => item.id === String(id));

    if (!shelter) return;

    if (shelter.status === 'Inactive') {
      toast.info('This shelter is already inactive.');
      return;
    }

    try {
      const response = await fetch(`${API}${id}/`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to deactivate shelter.'
        );
      }

      toast.success('Shelter account deactivated successfully!');
      await fetchShelters();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to deactivate shelter.'
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">Loading shelters...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminManagement
        title="Shelter Management"
        description="Manage shelter accounts and permissions"
        columns={[
          'Username',
          'Email',
          'Role',
          'Status',
          'Joined',
        ]}
        data={shelters}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-gray-950 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Edit Shelter</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full rounded-md bg-gray-900 border border-white/20 px-3 py-2 text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
