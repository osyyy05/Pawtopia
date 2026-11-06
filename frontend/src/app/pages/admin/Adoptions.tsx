import { useEffect, useState } from 'react';
import AdminManagement from './AdminManagement';
import { toast } from 'sonner';

export default function Adoptions() {
  const [adoptions, setAdoptions] = useState<any[]>([]);

  const fetchAdoptions = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/adoptions/admin/applications/',
        {
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
          'Failed to load adoption applications.'
        );
      }

      setAdoptions(
        Array.isArray(data)
          ? data.map((application: any) => ({
              id: String(application.id),
              pet: application.animal_name || '-',
              user:
                application.full_name ||
                application.applicant ||
                '-',
              status: application.status || '-',
              date: application.created_at
                ? new Date(
                    application.created_at
                  ).toLocaleDateString()
                : '-',
            }))
          : []
      );
    } catch (error) {
      console.error(
        'Failed to load adoption applications:',
        error
      );

      setAdoptions([]);
    }
  };

  useEffect(() => {
    fetchAdoptions();
  }, []);

  const approveApplication = async (id: string) => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/adoptions/admin/applications/${id}/approve/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to approve application.'
        );
      }

      toast.success(
        'Adoption application approved.'
      );

      fetchAdoptions();

    } catch (error) {
      console.error(
        'Failed to approve application:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to approve application.'
      );
    }
  };

  const rejectApplication = async (id: string) => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login again.');
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/adoptions/admin/applications/${id}/reject/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to reject application.'
        );
      }

      toast.success(
        'Adoption application rejected.'
      );

      fetchAdoptions();

    } catch (error) {
      console.error(
        'Failed to reject application:',
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to reject application.'
      );
    }
  };

  return (
    <AdminManagement
      title="Adoption Management"
      description="Approve or reject adoption requests"
      columns={['Pet', 'User', 'Status', 'Date']}
      data={adoptions}
      onEdit={approveApplication}
      onDelete={rejectApplication}
    />
  );
}