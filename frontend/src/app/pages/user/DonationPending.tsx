import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';

import {
  Clock,
  CheckCircle2,
  ArrowLeft,
  FileCheck,
  UserCheck,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';
import { toast } from 'sonner';


interface Donation {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  amount: string | number;
  shelter: string;
  payment_method: string;
  receipt?: string;
  transaction_id: string;
  status: string;
  shelter_remark?: string;
  admin_remark?: string;
  created_at: string;
  updated_at?: string;
}


export default function DonationPending() {

  const location = useLocation();
  const navigate = useNavigate();

  const initialDonation =
    location.state?.donation as Donation | undefined;

  const [donation, setDonation] =
    useState<Donation | null>(
      initialDonation ?? null
    );

  const [checking, setChecking] =
    useState(true);


  // =====================================================
  // CHECK LATEST DONATION STATUS
  // =====================================================

  useEffect(() => {

    if (!initialDonation?.id) {
      setChecking(false);
      return;
    }

    let isMounted = true;

    const checkStatus = async () => {

      const token =
        sessionStorage.getItem('access_token');

      if (!token) {
        console.error(
          'No access token found.'
        );

        setChecking(false);
        return;
      }

      try {

        const response = await fetch(
          'http://127.0.0.1:8000/api/donations/my/',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            'Donation status request failed:',
            response.status
          );

          return;
        }

        const donations: Donation[] =
          await response.json();

        console.log(
          'Latest donations:',
          donations
        );

        // Find THE SAME donation
        const latestDonation =
          donations.find(
            item =>
              Number(item.id) ===
              Number(initialDonation.id)
          );

        if (!latestDonation) {
          console.error(
            'Donation not found:',
            initialDonation.id
          );
          return;
        }

        if (!isMounted) {
          return;
        }

        // Update the page immediately
        setDonation(latestDonation);

        console.log(
          'Current donation status:',
          latestDonation.status
        );

        // =================================================
        // ADMIN APPROVED
        // =================================================

        if (
          latestDonation.status ===
          'COMPLETED'
        ) {
          toast.success(
            'Your donation has been approved!'
          );

          navigate(
            '/user/donation-success',
            {
              replace: true,
              state: {
                amount:
                  Number(
                    latestDonation.amount
                  ),

                shelter: {
                  name:
                    latestDonation.shelter,
                },

                paymentMethod:
                  latestDonation.payment_method,

                reference:
                  latestDonation.transaction_id,

                donation:
                  latestDonation,

                showFireworks: true,
              },
            }
          );

          return;
        }

        // =================================================
        // SHELTER REJECTED
        // =================================================

        if (
          latestDonation.status ===
          'SHELTER_REJECTED'
        ) {

          toast.error(
            'Your donation receipt was rejected by the Shelter.'
          );

          return;
        }


        // =================================================
        // ADMIN REJECTED
        // =================================================

        if (
          latestDonation.status ===
          'ADMIN_REJECTED'
        ) {

          toast.error(
            'Your donation was rejected by the Admin.'
          );

          return;
        }

      } catch (error) {

        console.error(
          'Failed to check donation status:',
          error
        );

      } finally {

        if (isMounted) {
          setChecking(false);
        }

      }

    };


    // Check immediately
    checkStatus();


    // Check every 3 seconds
    const interval =
      window.setInterval(
        checkStatus,
        3000
      );


    return () => {

      isMounted = false;

      window.clearInterval(
        interval
      );

    };

  }, [
    initialDonation?.id,
    navigate,
  ]);


  // =====================================================
  // NO DONATION
  // =====================================================

  if (!donation) {

    return (
      <div className="min-h-screen flex items-center justify-center p-4">

        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">

          <p className="text-white text-center mb-4">
            No donation information found.
          </p>

          <Button
            className="w-full"
            onClick={() =>
              navigate('/user/donation')
            }
          >
            Return to Donation
          </Button>

        </Card>

      </div>
    );
  }


  // =====================================================
  // STATUS
  // =====================================================

  const isShelterPending =
    donation.status === 'PENDING_SHELTER';

  const isAdminPending =
    donation.status === 'PENDING_ADMIN';

  const isShelterRejected =
    donation.status === 'SHELTER_REJECTED';

  const isAdminRejected =
    donation.status === 'ADMIN_REJECTED';


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="min-h-screen">

      {/* Header */}

      <section className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 backdrop-blur-xl border-b border-white/10 py-10">

        <div className="max-w-5xl mx-auto px-4">

          <Link to="/user/donation">

            <Button
              variant="ghost"
              className="bg-black/40 backdrop-blur-md text-white hover:bg-black/60 mb-6"
            >

              <ArrowLeft className="w-4 h-4 mr-2" />

              Back to Donation

            </Button>

          </Link>


          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">

              {isShelterRejected ||
              isAdminRejected ? (

                <XCircle className="w-8 h-8 text-red-400" />

              ) : (

                <Clock className="w-8 h-8 text-amber-400" />

              )}

            </div>


            <div>

              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">

                Donation Submitted

              </h1>


              <p className="text-lg text-gray-300 mt-2">

                {isShelterPending
                  ? 'Your donation is waiting for Shelter verification.'
                  : isAdminPending
                    ? 'Your donation is waiting for Admin verification.'
                    : isShelterRejected
                      ? 'Your receipt was rejected by the Shelter.'
                      : isAdminRejected
                        ? 'Your donation was rejected by the Admin.'
                        : 'Your donation status has been updated.'}

              </p>

            </div>

          </div>

        </div>

      </section>


      <div className="max-w-5xl mx-auto px-4 py-12">


        {/* STATUS CARD */}

        <Card className="bg-black/40 backdrop-blur-xl border-white/10 mb-8">

          <CardHeader className="text-center">

            <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-4">

              {isShelterRejected ||
              isAdminRejected ? (

                <XCircle className="w-10 h-10 text-red-400" />

              ) : (

                <Clock className="w-10 h-10 text-amber-400" />

              )}

            </div>


            <CardTitle className="text-3xl text-white">

              {isShelterPending
                ? 'Pending Shelter Verification'
                : isAdminPending
                  ? 'Pending Admin Verification'
                  : isShelterRejected
                    ? 'Receipt Rejected by Shelter'
                    : isAdminRejected
                      ? 'Donation Rejected by Admin'
                      : 'Donation Status'}

            </CardTitle>


            <p className="text-gray-400 mt-2">

              {isShelterPending
                ? 'Your donation receipt is being reviewed by the selected shelter.'
                : isAdminPending
                  ? 'Shelter has approved your receipt. Your donation is now waiting for Admin verification.'
                  : isShelterRejected
                    ? 'Please review your receipt.'
                    : isAdminRejected
                      ? 'Please review your donation information.'
                      : 'Your donation status has been updated.'}

            </p>

          </CardHeader>


          <CardContent>


            {/* PROGRESS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">


              {/* SUBMITTED */}

              <div className="flex flex-col items-center text-center">

                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-3">

                  <CheckCircle2 className="w-6 h-6 text-green-400" />

                </div>

                <h3 className="text-white font-semibold">
                  Donation Submitted
                </h3>

                <p className="text-sm text-green-400 mt-1">
                  Receipt received
                </p>

              </div>


              {/* SHELTER */}

              <div className="flex flex-col items-center text-center">

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isShelterPending
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : isShelterRejected
                        ? 'bg-red-500/20 border border-red-500/40'
                        : 'bg-green-500/20 border border-green-500/40'
                  }`}
                >

                  {isShelterRejected ? (

                    <XCircle className="w-6 h-6 text-red-400" />

                  ) : isShelterPending ? (

                    <UserCheck className="w-6 h-6 text-amber-400" />

                  ) : (

                    <CheckCircle2 className="w-6 h-6 text-green-400" />

                  )}

                </div>


                <h3 className="text-white font-semibold">
                  Shelter Verification
                </h3>


                <p
                  className={`text-sm mt-1 ${
                    isShelterPending
                      ? 'text-amber-400'
                      : isShelterRejected
                        ? 'text-red-400'
                        : 'text-green-400'
                  }`}
                >

                  {isShelterPending
                    ? 'Currently reviewing'
                    : isShelterRejected
                      ? 'Receipt rejected'
                      : 'Approved'}

                </p>

              </div>


              {/* ADMIN */}

              <div className="flex flex-col items-center text-center">

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    isAdminPending
                      ? 'bg-amber-500/20 border border-amber-500/40'
                      : donation.status === 'COMPLETED'
                        ? 'bg-green-500/20 border border-green-500/40'
                        : 'bg-white/5 border border-white/10'
                  }`}
                >

                  {donation.status === 'COMPLETED' ? (

                    <CheckCircle2 className="w-6 h-6 text-green-400" />

                  ) : isAdminPending ? (

                    <ShieldCheck className="w-6 h-6 text-amber-400" />

                  ) : (

                    <ShieldCheck className="w-6 h-6 text-gray-500" />

                  )}

                </div>


                <h3
                  className={
                    isAdminPending ||
                    donation.status === 'COMPLETED'
                      ? 'text-white font-semibold'
                      : 'text-gray-400 font-semibold'
                  }
                >
                  Admin Verification
                </h3>


                <p
                  className={`text-sm mt-1 ${
                    isAdminPending
                      ? 'text-amber-400'
                      : donation.status === 'COMPLETED'
                        ? 'text-green-400'
                        : 'text-gray-500'
                  }`}
                >

                  {isAdminPending
                    ? 'Currently reviewing'
                    : donation.status === 'COMPLETED'
                      ? 'Approved'
                      : 'Waiting for Shelter approval'}

                </p>

              </div>

            </div>


            {/* CHECKING */}

            {!isShelterRejected &&
              !isAdminRejected && (
                <div className="flex justify-center items-center gap-2 mb-6 text-gray-400 text-sm">

                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />

                  {checking
                    ? 'Checking donation status...'
                    : 'Waiting for verification...'}

                </div>
              )}


            {/* DONATION DETAILS */}

            <div className="bg-white/5 rounded-xl border border-white/10 p-6">

              <h2 className="text-xl font-semibold text-white mb-5">
                Donation Details
              </h2>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <p className="text-sm text-gray-400">
                    Donor Name
                  </p>

                  <p className="text-white font-medium mt-1">
                    {donation.full_name}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-400">
                    Email
                  </p>

                  <p className="text-white font-medium mt-1">
                    {donation.email}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-400">
                    Shelter
                  </p>

                  <p className="text-white font-medium mt-1">
                    {donation.shelter}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-400">
                    Payment Method
                  </p>

                  <p className="text-white font-medium mt-1">
                    {donation.payment_method}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-400">
                    Amount
                  </p>

                  <p className="text-2xl text-amber-400 font-bold mt-1">
                    RM {Number(
                      donation.amount
                    ).toFixed(2)}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-gray-400">
                    Transaction ID
                  </p>

                  <p className="text-white font-medium mt-1 break-all">
                    {donation.transaction_id}
                  </p>
                </div>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* INFORMATION */}

        <Card className="bg-blue-600/10 backdrop-blur-xl border-blue-500/20">

          <CardContent className="p-6">

            <div className="flex gap-4">

              <FileCheck className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />


              <div>

                <h3 className="text-white font-semibold mb-2">
                  What happens next?
                </h3>


                <p className="text-gray-300 text-sm leading-relaxed">

                  {isShelterPending
                    ? 'Your donation receipt has been submitted successfully and is awaiting review by the selected animal shelter.'
                    : isAdminPending
                      ? 'Your donation has been reviewed and approved by the animal shelter. An administrator will now perform the final verification.'
                      : isShelterRejected
                        ? 'Your donation receipt was rejected by the selected shelter.'
                        : isAdminRejected
                          ? 'Your donation was rejected by the administrator.'
                          : 'Your donation status has been updated.'}

                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* BACK */}

        <div className="flex justify-center mt-8">

          <Link to="/user/donation">

            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Return to Donation Page
            </Button>

          </Link>

        </div>

      </div>

    </div>
  );
}