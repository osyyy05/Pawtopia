import { useEffect, useState } from 'react';
import AdminManagement from './AdminManagement';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        toast.error('Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/admin/users/',
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
            'Failed to load users.'
          );
        }

        setUsers(
          Array.isArray(data) ? data : []
        );

      } catch (error) {
        console.error(
          'Failed to load users:',
          error
        );

        toast.error(
          'Failed to load users.'
        );

        setUsers([]);

      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-400">
            Loading users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminManagement
      title="User Management"
      description="Manage user accounts and permissions"
      columns={[
        'Username',
        'Email',
        'Role',
        'Status',
        'Joined'
      ]}
      data={users}
      onEdit={(id) => {
        console.log('Edit user:', id);
      }}

      onDelete={(id) => {
        console.log('Delete user:', id);
      }}
    />
  );
}