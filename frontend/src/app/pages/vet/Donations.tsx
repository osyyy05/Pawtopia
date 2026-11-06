import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  FileText,
} from 'lucide-react';

import { Button } from '../../components/ui/button';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { toast } from 'sonner';

interface Donation {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  amount: string;
  shelter: string;
  payment_method: string;
  receipt: string;
  receipt_url?: string;
  transaction_id: string;
  status: string;
  vet_remark?: string;
  created_at: string;
}

export default function VetDonations() {

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const accessToken = sessionStorage.getItem('access_token');

  const fetchDonations = async () => {

    if (!accessToken) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        'http://127.0.0.1:8000/api/donations/vet/',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to load donations'
        );
      }

      setDonations(data);

    } catch (error) {

      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load donations'
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchDonations();
  }, []);


  const reviewDonation = async (
    donationId: number,
    action: 'approve' | 'reject'
  ) => {

    if (!accessToken) {
      toast.error('Please login first');
      return;
    }

    const remark =
      action === 'approve'
        ? 'Receipt approved by veterinary team.'
        : 'Receipt rejected by veterinary team.';

    setProcessingId(donationId);

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/donations/vet/${donationId}/${action}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            remark,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update donation'
        );
      }

      if (action === 'approve') {

        toast.success(
          'Donation approved and sent to Admin.'
        );

      } else {

        toast.success(
          'Donation rejected.'
        );

      }

      // Remove it from the pending list
      setDonations(
        donations.filter(
          donation => donation.id !== donationId
        )
      );

    } catch (error) {

      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update donation'
      );

    } finally {

      setProcessingId(null);

    }
  };


  return (
    <div className="min-h-screen">

      {/* Header */}
      <section className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur-xl border-b border-white/10 py-10">

        <div className="max-w-7xl mx-auto px-4">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Donation Verification
              </h1>

              <p className="text-gray-300 mt-2">
                Review donation receipts submitted by users.
              </p>

            </div>

            <Button
              onClick={fetchDonations}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

          </div>

        </div>

      </section>


      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Status */}
        <div className="mb-8">

          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">

            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />

            <span className="text-amber-300 text-sm">
              {donations.length} donation
              {donations.length !== 1 ? 's' : ''}
              {' '}pending verification
            </span>

          </div>

        </div>


        {/* Loading */}
        {loading && (

          <div className="flex justify-center py-20">

            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />

          </div>

        )}


        {/* Empty */}
        {!loading && donations.length === 0 && (

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardContent className="py-20 text-center">

              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />

              <h2 className="text-2xl text-white font-semibold">
                No Pending Donations
              </h2>

              <p className="text-gray-400 mt-2">
                There are currently no donations waiting for verification.
              </p>

            </CardContent>

          </Card>

        )}


        {/* Donation Cards */}
        {!loading && donations.length > 0 && (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {donations.map((donation) => (

              <Card
                key={donation.id}
                className="bg-black/40 backdrop-blur-xl border-white/10"
              >

                <CardHeader>

                  <div className="flex items-start justify-between">

                    <div>

                      <CardTitle className="text-xl text-white">
                        Donation #{donation.id}
                      </CardTitle>

                      <p className="text-sm text-gray-400 mt-1">
                        {donation.transaction_id}
                      </p>

                    </div>

                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      Pending Vet Review
                    </span>

                  </div>

                </CardHeader>


                <CardContent className="space-y-6">

                  {/* Donor */}
                  <div className="bg-white/5 rounded-lg p-4">

                    <h3 className="text-white font-semibold mb-3">
                      Donor Information
                    </h3>

                    <div className="space-y-2">

                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">
                          Full Name
                        </span>

                        <span className="text-white font-medium text-right">
                          {donation.full_name}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">
                          Email
                        </span>

                        <span className="text-white text-right break-all">
                          {donation.email}
                        </span>
                      </div>

                      {donation.phone && (

                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">
                            Phone
                          </span>

                          <span className="text-white">
                            {donation.phone}
                          </span>
                        </div>

                      )}

                    </div>

                  </div>


                  {/* Donation Details */}
                  <div className="bg-white/5 rounded-lg p-4">

                    <h3 className="text-white font-semibold mb-3">
                      Donation Details
                    </h3>

                    <div className="space-y-2">

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Amount
                        </span>

                        <span className="text-2xl text-amber-400 font-bold">
                          RM {Number(donation.amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Shelter
                        </span>

                        <span className="text-white">
                          {donation.shelter}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Payment Method
                        </span>

                        <span className="text-white">
                          {donation.payment_method}
                        </span>
                      </div>

                    </div>

                  </div>


                  {/* Receipt */}
                  <div>

                    <h3 className="text-white font-semibold mb-3">
                      Payment Receipt
                    </h3>

                    {donation.receipt_url ? (

                      <a
                        href={donation.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >

                        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5">

                          <img
                            src={donation.receipt_url}
                            alt="Donation receipt"
                            className="w-full max-h-72 object-contain"
                          />

                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 flex items-center justify-center text-white">

                            <Eye className="w-4 h-4 mr-2" />

                            View Full Receipt

                          </div>

                        </div>

                      </a>

                    ) : (

                      <div className="bg-white/5 border border-white/10 rounded-lg p-5 text-center">

                        <FileText className="w-10 h-10 text-gray-500 mx-auto mb-2" />

                        <p className="text-gray-400">
                          Receipt unavailable
                        </p>

                      </div>

                    )}

                  </div>


                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-4 pt-2">

                    <Button
                      onClick={() =>
                        reviewDonation(
                          donation.id,
                          'reject'
                        )
                      }
                      disabled={processingId === donation.id}
                      className="bg-red-600/80 hover:bg-red-700 text-white"
                    >

                      <XCircle className="w-5 h-5 mr-2" />

                      Reject

                    </Button>


                    <Button
                      onClick={() =>
                        reviewDonation(
                          donation.id,
                          'approve'
                        )
                      }
                      disabled={processingId === donation.id}
                      className="bg-green-600/80 hover:bg-green-700 text-white"
                    >

                      <CheckCircle className="w-5 h-5 mr-2" />

                      {processingId === donation.id
                        ? 'Processing...'
                        : 'Approve'}

                    </Button>

                  </div>

                </CardContent>

              </Card>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}