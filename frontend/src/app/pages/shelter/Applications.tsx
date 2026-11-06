import { useEffect, useMemo, useState } from 'react';
import {

  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Search,
  UserRound,
  XCircle,

} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

// =========================================================

// TYPES

// =========================================================

type ApplicationStatus =

  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';


type FilterStatus =

  | 'ALL'
  | ApplicationStatus;


interface AdoptionApplication {

  id: number;
  animal: number;
  animal_name: string;
  animal_image?: string;
  shelter_name?: string;
  applicant: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  reason: string;
  status: ApplicationStatus;
  shelter_remark: string;
  created_at: string;
  updated_at: string;
}

// =========================================================

// MAIN COMPONENT

// =========================================================


export default function Applications() {
  const [applications, setApplications] = useState<
    AdoptionApplication[]
  >([]);


  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');


  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>('ALL');

  const [
    selectedApplication,
    setSelectedApplication,

  ] = useState<AdoptionApplication | null>(

    null

  );



  const [shelterRemark, setShelterRemark] =

    useState('');



  const [processing, setProcessing] =

    useState(false);

  const [meetAndGreetOpen, setMeetAndGreetOpen] = useState(false);
  const [meetAndGreetDate, setMeetAndGreetDate] = useState('');
  const [meetAndGreetTime, setMeetAndGreetTime] = useState('');
  const [meetAndGreetNotes, setMeetAndGreetNotes] = useState('');
  const [schedulingMeetAndGreet, setSchedulingMeetAndGreet] = useState(false);
  const [scheduledApplicationIds, setScheduledApplicationIds] = useState<number[]>([]);



  // =========================================================

  // LOAD APPLICATIONS

  // =========================================================



  const fetchApplications = async () => {

    const accessToken =

      sessionStorage.getItem('access_token');



    if (!accessToken) {

      setError('Please login again.');

      setLoading(false);

      return;

    }



    try {

      setLoading(true);

      setError('');



      const response = await fetch(

        'http\://127.0.0.1:8000/api/adoptions/shelter/applications/',

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

        'SHELTER ADOPTION APPLICATIONS:',

        data

      );



      if (!response.ok) {

        throw new Error(

          data?.error ||

            data?.detail ||

            'Failed to load adoption applications.'

        );

      }



      setApplications(

        Array.isArray(data) ? data : []

      );

    } catch (error) {

      console.error(

        'Failed to load applications:',

        error

      );



      setError(

        error instanceof Error

          ? error.message

          : 'Failed to load adoption applications.'

      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    window.scrollTo(0, 0);

    fetchApplications();

  }, []);



  // =========================================================

  // COUNTS

  // =========================================================



  const counts = useMemo(() => {

    return {

      all: applications.length,



      pending: applications.filter(

        (application) =>

          application.status === 'PENDING'

      ).length,



      approved: applications.filter(

        (application) =>

          application.status === 'APPROVED'

      ).length,



      rejected: applications.filter(

        (application) =>

          application.status === 'REJECTED'

      ).length,

    };

  }, [applications]);



  // =========================================================

  // FILTER

  // =========================================================



  const filteredApplications =

    useMemo(() => {

      const query = searchQuery

        .trim()

        .toLowerCase();



      return applications.filter(

        (application) => {

          const matchesStatus =

            statusFilter === 'ALL' ||

            application.status ===

              statusFilter;



          const matchesSearch =

            !query ||

            application.animal_name

              ?.toLowerCase()

              .includes(query) ||

            application.full_name

              ?.toLowerCase()

              .includes(query) ||

            application.email

              ?.toLowerCase()

              .includes(query) ||

            application.phone

              ?.toLowerCase()

              .includes(query);



          return (

            matchesStatus &&

            matchesSearch

          );

        }

      );

    }, [

      applications,

      searchQuery,

      statusFilter,

    ]);



  // =========================================================

  // OPEN APPLICATION

  // =========================================================



  const openApplication = (

    application: AdoptionApplication

  ) => {

    setSelectedApplication(application);



    setShelterRemark(

      application.shelter_remark || ''

    );

  };



  const closeApplication = () => {

    if (processing) {

      return;

    }



    setSelectedApplication(null);

    setShelterRemark('');

  };



  // =========================================================

  // APPROVE

  // =========================================================



  const approveApplication = async () => {

    if (!selectedApplication) {

      return;

    }



    const accessToken =

      sessionStorage.getItem('access_token');



    if (!accessToken) {

      toast.error(

        'Please login again.'

      );

      return;

    }



    try {

      setProcessing(true);



      const response = await fetch(

        `http\://127.0.0.1:8000/api/adoptions/shelter/applications/${selectedApplication.id}/approve/`,

        {

          method: 'POST',



          headers: {

            Authorization: `Bearer ${accessToken}`,

            Accept: 'application/json',

            'Content-Type':

              'application/json',

          },



          body: JSON.stringify({

            shelter_remark:

              shelterRemark.trim(),

          }),

        }

      );



      const data = await response.json();



      console.log(

        'APPROVE APPLICATION RESPONSE:',

        data

      );



      if (!response.ok) {

        throw new Error(

          data?.error ||

            data?.detail ||

            'Failed to approve application.'

        );

      }



      toast.success(

        `Application for ${selectedApplication.animal_name} approved.`

      );



      setApplications((previous) =>

        previous.map((application) =>

          application.id ===

          selectedApplication.id

            ? {

                ...application,

                status: 'APPROVED',

                shelter_remark:

                  shelterRemark.trim(),

              }

            : application

        )

      );



      setSelectedApplication(

        (previous) =>

          previous

            ? {

                ...previous,

                status: 'APPROVED',

                shelter_remark:

                  shelterRemark.trim(),

              }

            : null

      );

    } catch (error) {

      console.error(

        'Approve application failed:',

        error

      );



      toast.error(

        error instanceof Error

          ? error.message

          : 'Failed to approve application.'

      );

    } finally {

      setProcessing(false);

    }

  };



  // =========================================================

  // REJECT

  // =========================================================



  const rejectApplication = async () => {

    if (!selectedApplication) {

      return;

    }



    const accessToken =

      sessionStorage.getItem('access_token');



    if (!accessToken) {

      toast.error(

        'Please login again.'

      );

      return;

    }



    if (!shelterRemark.trim()) {

      toast.error(

        'Please provide a shelter remark before rejecting the application.'

      );



      return;

    }



    try {

      setProcessing(true);



      const response = await fetch(

        `http\://127.0.0.1:8000/api/adoptions/shelter/applications/${selectedApplication.id}/reject/`,

        {

          method: 'POST',



          headers: {

            Authorization: `Bearer ${accessToken}`,

            Accept: 'application/json',

            'Content-Type':

              'application/json',

          },



          body: JSON.stringify({

            shelter_remark:

              shelterRemark.trim(),

          }),

        }

      );



      const data = await response.json();



      console.log(

        'REJECT APPLICATION RESPONSE:',

        data

      );



      if (!response.ok) {

        throw new Error(

          data?.error ||

            data?.detail ||

            'Failed to reject application.'

        );

      }



      toast.success(

        `Application for ${selectedApplication.animal_name} rejected.`

      );



      setApplications((previous) =>

        previous.map((application) =>

          application.id ===

          selectedApplication.id

            ? {

                ...application,

                status: 'REJECTED',

                shelter_remark:

                  shelterRemark.trim(),

              }

            : application

        )

      );



      setSelectedApplication(

        (previous) =>

          previous

            ? {

                ...previous,

                status: 'REJECTED',

                shelter_remark:

                  shelterRemark.trim(),

              }

            : null

      );

    } catch (error) {

      console.error(

        'Reject application failed:',

        error

      );



      toast.error(

        error instanceof Error

          ? error.message

          : 'Failed to reject application.'

      );

    } finally {

      setProcessing(false);

    }

  };



  // =========================================================

  // MEET & GREET

  const openMeetAndGreet = () => {
    if (!selectedApplication || selectedApplication.status !== 'APPROVED') return;
    setMeetAndGreetDate(''); setMeetAndGreetTime(''); setMeetAndGreetNotes(''); setMeetAndGreetOpen(true);
  };

  const closeMeetAndGreet = () => { if (!schedulingMeetAndGreet) setMeetAndGreetOpen(false); };

  const scheduleMeetAndGreet = async () => {
    if (!selectedApplication) return;
    if (!meetAndGreetDate) { toast.error('Please select a Meet & Greet date.'); return; }
    if (!meetAndGreetTime) { toast.error('Please select a Meet & Greet time.'); return; }
    const accessToken = sessionStorage.getItem('access_token');
    if (!accessToken) { toast.error('Please login again.'); return; }
    try {
      setSchedulingMeetAndGreet(true);
      const response = await fetch('http://127.0.0.1:8000/api/appointments/shelter/meet-and-greet/', {
        method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: selectedApplication.id, date: meetAndGreetDate, time: meetAndGreetTime, notes: meetAndGreetNotes.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || data?.detail || 'Failed to schedule Meet & Greet.');
      setScheduledApplicationIds((previous) => previous.includes(selectedApplication.id) ? previous : [...previous, selectedApplication.id]);
      toast.success('Meet & Greet scheduled successfully.'); setMeetAndGreetOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to schedule Meet & Greet.'); }
    finally { setSchedulingMeetAndGreet(false); }
  };

  // =========================================================

  // LOADING

  // =========================================================



  if (loading) {

    return (

      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="text-center">

          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-violet-400" />



          <p className="mt-4 text-sm text-slate-400">

            Loading adoption

            applications...

          </p>

        </div>

      </div>

    );

  }



  // =========================================================

  // ERROR

  // =========================================================



  if (error) {

    return (

      <div className="flex min-h-[70vh] items-center justify-center px-4">

        <Card className="w-full max-w-md border-red-400/20 bg-black/40">

          <CardContent className="p-8 text-center">

            <XCircle className="mx-auto h-10 w-10 text-red-400" />



            <h2 className="mt-4 text-lg font-semibold text-white">

              Unable to load applications

            </h2>



            <p className="mt-2 text-sm text-slate-400">

              {error}

            </p>



            <Button

              type="button"

              onClick={fetchApplications}

              className="mt-6 bg-violet-600 text-white hover:bg-violet-700"

            >

              Try Again

            </Button>

          </CardContent>

        </Card>

      </div>

    );

  }



  // =========================================================

  // UI

  // =========================================================



  return (

    <div className="min-h-screen w-full px-6 py-8 lg:px-10 xl:px-12">

      <div className="mx-auto w-full max-w-[1500px] space-y-7">

        {/* =====================================================

            HEADER

        ===================================================== */}



        <div>

          <div className="flex items-center gap-2">

            <PawPrint className="h-5 w-5 text-cyan-400" />



            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">

              Adoption Management

            </p>

          </div>



          <h1 className="mt-2 text-3xl font-bold text-white">

            Adoption Applications

          </h1>



          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

            Review adoption applications,

            update their status, and prepare

            approved applicants for the next

            stage of the adoption process.

          </p>

        </div>



        {/* =====================================================

            SUMMARY

        ===================================================== */}



        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard

            label="All Applications"

            value={counts.all}

            icon={FileText}

          />



          <SummaryCard

            label="Pending Review"

            value={counts.pending}

            icon={Clock3}

          />



          <SummaryCard

            label="Approved"

            value={counts.approved}

            icon={CheckCircle2}

          />



          <SummaryCard

            label="Rejected"

            value={counts.rejected}

            icon={XCircle}

          />

        </div>



        {/* =====================================================

            SEARCH + FILTER

        ===================================================== */}



        <Card className="border-white/10 bg-black/30 backdrop-blur-xl">

          <CardContent className="p-5">

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

              {/* Search */}



              <div className="relative w-full xl:max-w-xl">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />



                <Input

                  value={searchQuery}

                  onChange={(event) =>

                    setSearchQuery(

                      event.target.value

                    )

                  }

                  placeholder="Search pet, applicant, email or phone..."

                  className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-slate-600"

                />

              </div>



              {/* Filters */}



              <div className="flex flex-wrap gap-2">

                <FilterButton

                  active={

                    statusFilter === 'ALL'

                  }

                  label="All"

                  count={counts.all}

                  onClick={() =>

                    setStatusFilter('ALL')

                  }

                />



                <FilterButton

                  active={

                    statusFilter ===

                    'PENDING'

                  }

                  label="Pending"

                  count={counts.pending}

                  onClick={() =>

                    setStatusFilter(

                      'PENDING'

                    )

                  }

                />



                <FilterButton

                  active={

                    statusFilter ===

                    'APPROVED'

                  }

                  label="Approved"

                  count={counts.approved}

                  onClick={() =>

                    setStatusFilter(

                      'APPROVED'

                    )

                  }

                />



                <FilterButton

                  active={

                    statusFilter ===

                    'REJECTED'

                  }

                  label="Rejected"

                  count={counts.rejected}

                  onClick={() =>

                    setStatusFilter(

                      'REJECTED'

                    )

                  }

                />

              </div>

            </div>

          </CardContent>

        </Card>



        {/* =====================================================

            APPLICATION LIST

        ===================================================== */}



        {filteredApplications.length ===

        0 ? (

          <Card className="border-white/10 bg-black/30">

            <CardContent className="py-16 text-center">

              <FileText className="mx-auto h-10 w-10 text-slate-600" />



              <h3 className="mt-4 font-medium text-white">

                No applications found

              </h3>



              <p className="mt-2 text-sm text-slate-500">

                Try changing the search or

                status filter.

              </p>

            </CardContent>

          </Card>

        ) : (

          <div className="space-y-4">

            {filteredApplications.map(

              (application) => (

                <ApplicationCard

                  key={application.id}

                  application={

                    application

                  }

                  onView={() =>

                    openApplication(

                      application

                    )

                  }

                />

              )

            )}

          </div>

        )}

      </div>



      {/* =======================================================

          APPLICATION DETAILS MODAL

      ======================================================= */}



      {selectedApplication && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Overlay */}



          <button

            type="button"

            aria-label="Close application"

            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"

            onClick={closeApplication}

          />



          {/* Modal */}



          <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0d1020] shadow-2xl">

            {/* Modal Header */}



            <div className="border-b border-white/[0.08] p-6 sm:p-7">

              <div className="flex items-start justify-between gap-5">

                <div>

                  <div className="flex items-center gap-2">

                    <FileText className="h-4 w-4 text-cyan-400" />



                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">

                      Application Details

                    </p>

                  </div>



                  <h2 className="mt-2 text-2xl font-semibold text-white">

                    {selectedApplication.animal_name}

                  </h2>



                  <p className="mt-1 text-sm text-slate-400">

                    Submitted{' '}

                    {formatDate(

                      selectedApplication.created_at

                    )}

                  </p>

                </div>



                <button

                  type="button"

                  onClick={closeApplication}

                  disabled={processing}

                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"

                >

                  <XCircle className="h-5 w-5" />

                </button>

              </div>

            </div>



            <div className="space-y-7 p-6 sm:p-7">

              {/* =================================================

                  PET + STATUS

              ================================================= */}



              <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:flex-row">

                {selectedApplication.animal_image ? (

                  <div className="h-36 w-full shrink-0 overflow-hidden rounded-xl bg-black sm:w-36">

                    <img

                      src={

                        selectedApplication.animal_image

                      }

                      alt={

                        selectedApplication.animal_name

                      }

                      className="h-full w-full object-cover"

                    />

                  </div>

                ) : (

                  <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-xl bg-white/[0.03] sm:w-36">

                    <PawPrint className="h-9 w-9 text-slate-700" />

                  </div>

                )}



                <div className="flex-1">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">

                    Pet

                  </p>



                  <h3 className="mt-1 text-xl font-semibold text-white">

                    {selectedApplication.animal_name}

                  </h3>



                  <div className="mt-4">

                    <StatusBadge

                      status={

                        selectedApplication.status

                      }

                    />

                  </div>



                  {selectedApplication.status ===

                    'APPROVED' && (

                    <p className="mt-4 text-sm leading-6 text-green-400">

                      Application approved.

                      Next step: arrange a Meet

                      & Greet with the applicant.

                    </p>

                  )}



                  {selectedApplication.status ===

                    'PENDING' && (

                    <p className="mt-4 text-sm leading-6 text-yellow-400">

                      This application is waiting

                      for shelter review.

                    </p>

                  )}



                  {selectedApplication.status ===

                    'REJECTED' && (

                    <p className="mt-4 text-sm leading-6 text-red-400">

                      This application was not

                      approved.

                    </p>

                  )}

                </div>

              </div>



              {/* =================================================

                  APPLICANT INFORMATION

              ================================================= */}



              <section>

                <SectionTitle

                  title="Applicant Information"

                  description="Contact information submitted by the applicant."

                />



                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <DetailBox

                    icon={UserRound}

                    label="Full Name"

                    value={

                      selectedApplication.full_name

                    }

                  />



                  <DetailBox

                    icon={Mail}

                    label="Email"

                    value={

                      selectedApplication.email

                    }

                  />



                  <DetailBox

                    icon={Phone}

                    label="Phone"

                    value={

                      selectedApplication.phone

                    }

                  />



                  <DetailBox

                    icon={Clock3}

                    label="Submitted"

                    value={formatDate(

                      selectedApplication.created_at

                    )}

                  />

                </div>



                <div className="mt-3">

                  <DetailBox

                    icon={MapPin}

                    label="Address"

                    value={

                      selectedApplication.address ||

                      'No address provided'

                    }

                  />

                </div>

              </section>



              {/* =================================================

                  REASON

              ================================================= */}



              <section>

                <SectionTitle

                  title="Reason for Adoption"

                  description="Why the applicant would like to adopt this pet."

                />



                <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

                  <p className="whitespace-pre-line text-sm leading-7 text-slate-300">

                    {selectedApplication.reason ||

                      'No reason provided.'}

                  </p>

                </div>

              </section>



              {/* =================================================

                  SHELTER REMARK

              ================================================= */}



              <section>

                <SectionTitle

                  title="Shelter Remark"

                  description={

                    selectedApplication.status ===

                    'PENDING'

                      ? 'Add an optional note for approval, or explain the reason if rejecting the application.'

                      : 'Remark recorded for this application.'

                  }

                />



                {selectedApplication.status ===

                'PENDING' ? (

                  <Textarea

                    value={shelterRemark}

                    onChange={(event) =>

                      setShelterRemark(

                        event.target.value

                      )

                    }

                    rows={5}

                    placeholder="Enter shelter remark..."

                    className="mt-4 resize-none border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600"

                  />

                ) : (

                  <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">

                    <p className="whitespace-pre-line text-sm leading-7 text-slate-300">

                      {selectedApplication.shelter_remark ||

                        'No shelter remark was provided.'}

                    </p>

                  </div>

                )}

              </section>



              {/* =================================================

                  ACTIONS

              ================================================= */}



              {selectedApplication.status ===

                'PENDING' && (

                <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:justify-end">

                  <Button

                    type="button"

                    variant="outline"

                    disabled={processing}

                    onClick={

                      rejectApplication

                    }

                    className="h-11 border-red-400/30 bg-red-400/[0.05] text-red-300 hover:bg-red-400/[0.1] hover:text-red-200"

                  >

                    {processing ? (

                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    ) : (

                      <XCircle className="mr-2 h-4 w-4" />

                    )}



                    Reject Application

                  </Button>



                  <Button

                    type="button"

                    disabled={processing}

                    onClick={

                      approveApplication

                    }

                    className="h-11 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110"

                  >

                    {processing ? (

                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />

                    ) : (

                      <CheckCircle2 className="mr-2 h-4 w-4" />

                    )}



                    Approve Application

                  </Button>

                </div>

              )}



              {/* Approved Next Step */}

              {selectedApplication.status === 'APPROVED' && (
                <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.06] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                      <div>
                        <h4 className="font-medium text-green-300">{scheduledApplicationIds.includes(selectedApplication.id) ? 'Meet & Greet Scheduled' : 'Approved — Meet & Greet Required'}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{scheduledApplicationIds.includes(selectedApplication.id) ? 'The Meet & Greet has been arranged. You can manage it from Meet & Greet Management.' : 'The application has been approved. Arrange a Meet & Greet between the applicant and the pet.'}</p>
                      </div>
                    </div>
                    {!scheduledApplicationIds.includes(selectedApplication.id) && (
                      <Button type="button" onClick={openMeetAndGreet} className="h-11 shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110">
                        <CalendarDays className="mr-2 h-4 w-4" />Arrange Meet & Greet
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      )}

      {meetAndGreetOpen && selectedApplication && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-sm" onClick={closeMeetAndGreet} />
          <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0d1020] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="border-b border-white/[0.08] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-400" /><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Adoption Next Step</p></div>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Arrange Meet & Greet</h2>
                  <p className="mt-1 text-sm text-slate-400">Schedule a meeting for {selectedApplication.full_name} and {selectedApplication.animal_name}.</p>
                </div>
                <button type="button" onClick={closeMeetAndGreet} disabled={schedulingMeetAndGreet} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"><XCircle className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><DetailBox icon={PawPrint} label="Pet" value={selectedApplication.animal_name} /><DetailBox icon={UserRound} label="Applicant" value={selectedApplication.full_name} /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Date</label><Input type="date" value={meetAndGreetDate} min={new Date().toISOString().split('T')[0]} onChange={(event) => setMeetAndGreetDate(event.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white [color-scheme:dark]" /></div>
                <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Time</label><Input type="time" value={meetAndGreetTime} onChange={(event) => setMeetAndGreetTime(event.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white [color-scheme:dark]" /></div>
              </div>
              <div><label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Notes</label><Textarea value={meetAndGreetNotes} onChange={(event) => setMeetAndGreetNotes(event.target.value)} rows={4} placeholder="Example: Please bring identification and arrive 10 minutes early." className="resize-none border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600" /></div>
              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeMeetAndGreet} disabled={schedulingMeetAndGreet} className="h-11 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">Cancel</Button>
                <Button
                  type="button"
                  onClick={scheduleMeetAndGreet}
                  disabled={schedulingMeetAndGreet}
                  className="relative z-20 h-11 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {schedulingMeetAndGreet ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Schedule Meet & Greet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>

  );

}



// =========================================================

// APPLICATION CARD

// =========================================================



function ApplicationCard({

  application,

  onView,

}: {

  application: AdoptionApplication;

  onView: () => void;

}) {

  return (

    <Card className="overflow-hidden border-white/10 bg-black/30 backdrop-blur-xl transition hover:border-white/[0.16] hover:bg-black/40">

      <CardContent className="p-5 sm:p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">

          {/* Pet Image */}



          {application.animal_image ? (

            <div className="h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-black lg:w-28">

              <img

                src={application.animal_image}

                alt={application.animal_name}

                className="h-full w-full object-cover"

              />

            </div>

          ) : (

            <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-2xl bg-white/[0.03] lg:w-28">

              <PawPrint className="h-8 w-8 text-slate-700" />

            </div>

          )}



          {/* Information */}



          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-3">

              <h3 className="text-lg font-semibold text-white">

                {application.animal_name}

              </h3>



              <StatusBadge

                status={application.status}

              />

            </div>



            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">

              <p className="text-slate-500">

                Applicant:{' '}

                <span className="text-slate-300">

                  {application.full_name}

                </span>

              </p>



              <p className="text-slate-500">

                Email:{' '}

                <span className="text-slate-300">

                  {application.email}

                </span>

              </p>



              <p className="text-slate-500">

                Submitted:{' '}

                <span className="text-slate-300">

                  {formatDate(

                    application.created_at

                  )}

                </span>

              </p>

            </div>



            {application.status ===

              'APPROVED' && (

              <p className="mt-3 text-xs text-green-400">

                Next step: arrange a Meet &

                Greet.

              </p>

            )}



            {application.status ===

              'PENDING' && (

              <p className="mt-3 text-xs text-yellow-400">

                Waiting for shelter review.

              </p>

            )}

          </div>



          {/* Button */}



          <Button

            type="button"

            onClick={onView}

            variant="outline"

            className="shrink-0 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"

          >

            <FileText className="mr-2 h-4 w-4" />

            View Application

          </Button>

        </div>

      </CardContent>

    </Card>

  );

}



// =========================================================

// SUMMARY CARD

// =========================================================



function SummaryCard({

  label,

  value,

  icon: Icon,

}: {

  label: string;

  value: number;

  icon: any;

}) {

  return (

    <Card className="border-white/10 bg-black/30 backdrop-blur-xl">

      <CardContent className="p-5">

        <div className="flex items-start justify-between gap-3">

          <div>

            <p className="text-xs text-slate-500">

              {label}

            </p>



            <p className="mt-2 text-2xl font-semibold text-white">

              {value}

            </p>

          </div>



          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.06]">

            <Icon className="h-4 w-4 text-violet-300" />

          </div>

        </div>

      </CardContent>

    </Card>

  );

}



// =========================================================

// FILTER BUTTON

// =========================================================



function FilterButton({

  active,

  label,

  count,

  onClick,

}: {

  active: boolean;

  label: string;

  count: number;

  onClick: () => void;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className={`rounded-xl border px-4 py-2 text-sm transition ${

        active

          ? 'border-violet-400/30 bg-violet-400/[0.12] text-violet-200'

          : 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-white'

      }`}

    >

      {label}

      <span className="ml-2 text-xs opacity-60">

        {count}

      </span>

    </button>

  );

}



// =========================================================

// STATUS BADGE

// =========================================================



function StatusBadge({

  status,

}: {

  status: ApplicationStatus;

}) {

  if (status === 'APPROVED') {

    return (

      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/20 bg-green-400/[0.08] px-3 py-1 text-xs font-medium text-green-400">

        <CheckCircle2 className="h-3.5 w-3.5" />

        Approved

      </span>

    );

  }



  if (status === 'REJECTED') {

    return (

      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/[0.08] px-3 py-1 text-xs font-medium text-red-400">

        <XCircle className="h-3.5 w-3.5" />

        Rejected

      </span>

    );

  }



  return (

    <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-400/20 bg-yellow-400/[0.08] px-3 py-1 text-xs font-medium text-yellow-400">

      <Clock3 className="h-3.5 w-3.5" />

      Pending Review

    </span>

  );

}



// =========================================================

// DETAIL BOX

// =========================================================



function DetailBox({

  icon: Icon,

  label,

  value,

}: {

  icon: any;

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.06]">

          <Icon className="h-4 w-4 text-cyan-400" />

        </div>



        <div className="min-w-0">

          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">

            {label}

          </p>



          <p className="mt-1 break-words whitespace-pre-line text-sm leading-6 text-slate-200">

            {value || 'Not provided'}

          </p>

        </div>

      </div>

    </div>

  );

}



// =========================================================

// SECTION TITLE

// =========================================================



function SectionTitle({

  title,

  description,

}: {

  title: string;

  description: string;

}) {

  return (

    <div>

      <h3 className="font-semibold text-white">

        {title}

      </h3>



      <p className="mt-1 text-xs leading-5 text-slate-500">

        {description}

      </p>

    </div>

  );

}



// =========================================================

// DATE FORMAT

// =========================================================



function formatDate(value: string) {

  if (!value) {

    return 'Not available';

  }



  const date = new Date(value);



  if (Number.isNaN(date.getTime())) {

    return value;

  }



  return date.toLocaleString('en-MY', {

    day: '2-digit',

    month: 'short',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

  });

}