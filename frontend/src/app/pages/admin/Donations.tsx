import { useEffect, useState } from 'react';

import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { toast } from 'sonner';


type DonationStatus =
  | 'COMPLETED'
  | 'PENDING_ADMIN'
  | 'SHELTER_REJECTED'
  | 'ADMIN_REJECTED'
  | 'PENDING_SHELTER';


type PaymentMethod =
  | 'TnG'
  | 'DuitNow'
  | 'FPX'
  | 'Cash'
  | 'Online Banking'
  | string;


interface Donation {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  amount: string;
  shelter: string;
  payment_method: PaymentMethod;
  receipt?: string;
  receipt_url?: string;
  transaction_id: string;
  status: DonationStatus;
  shelter_remark?: string;
  admin_remark?: string;
  created_at: string;
  updated_at?: string;
}


/* =========================================================
   STATUS CONFIG
========================================================= */

const statusConfig: Record<
  DonationStatus,
  {
    color: string;
    icon: React.ElementType;
    label: string;
  }
> = {
  COMPLETED: {
    color:
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle,
    label: 'Completed',
  },

  PENDING_ADMIN: {
    color:
      'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Clock,
    label: 'Pending Admin',
  },

  PENDING_SHELTER: {
    color:
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Clock,
    label: 'Pending Shelter',
  },

  SHELTER_REJECTED: {
    color:
      'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    label: 'Shelter Rejected',
  },

  ADMIN_REJECTED: {
    color:
      'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
    label: 'Admin Rejected',
  },
};


/* =========================================================
   METHOD COLORS
========================================================= */

const methodColor: Record<string, string> = {
  TnG: 'bg-purple-500/20 text-purple-400',
  DuitNow: 'bg-cyan-500/20 text-cyan-400',
  FPX: 'bg-emerald-500/20 text-emerald-400',
  Cash: 'bg-amber-500/20 text-amber-400',
  'Online Banking': 'bg-blue-500/20 text-blue-400',
};


/* =========================================================
   TOOLTIP
========================================================= */

const tooltipStyle = {
  backgroundColor: 'rgba(15, 10, 30, 0.95)',
  border: '1px solid rgba(139, 92, 246, 0.3)',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
};


/* =========================================================
   ADMIN DONATION MANAGEMENT
========================================================= */

export function AdminDonationManagement() {

  const [donations, setDonations] =
    useState<Donation[]>([]);

  const [search, setSearch] =
    useState('');

  const [filterStatus, setFilterStatus] =
    useState<DonationStatus | 'all'>('all');

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);


  /* =======================================================
     GET ADMIN DONATIONS
  ======================================================= */

  const fetchDonations = async () => {

    const accessToken =
      sessionStorage.getItem(
        'access_token'
      );

    if (!accessToken) {
      toast.error(
        'Please login first'
      );
      return;
    }

    setLoading(true);

    try {

      const response = await fetch(
        'http://127.0.0.1:8000/api/donations/admin/',
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );


      const data =
        await response.json();


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


  /* =======================================================
     LOAD WHEN PAGE OPENS
  ======================================================= */

  useEffect(() => {

    fetchDonations();

  }, []);


  /* =======================================================
     APPROVE / REJECT
  ======================================================= */

  const reviewDonation = async (
    donationId: number,
    action: 'approve' | 'reject'
  ) => {

    const accessToken =
      sessionStorage.getItem(
        'access_token'
      );

    if (!accessToken) {

      toast.error(
        'Please login first'
      );

      return;
    }


    setProcessingId(
      donationId
    );


    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/donations/admin/${donationId}/${action}/`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${accessToken}`,
          },

          body: JSON.stringify({
            remark:
              action === 'approve'
                ? 'Donation approved by administrator.'
                : 'Donation rejected by administrator.',
          }),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.error ||
          data?.detail ||
          'Failed to update donation'
        );
      }


      if (action === 'approve') {

        toast.success(
          'Donation approved successfully!'
        );

      } else {

        toast.success(
          'Donation rejected.'
        );

      }


      /*
       * Remove it from the Admin pending list.
       */

      setDonations(
        current =>
          current.filter(
            donation =>
              donation.id !==
              donationId
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


  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filtered =
    donations.filter(
      donation => {

        const searchText =
          search.toLowerCase();


        const matchSearch =
          donation.full_name
            .toLowerCase()
            .includes(searchText) ||

          donation.transaction_id
            .toLowerCase()
            .includes(searchText) ||

          donation.shelter
            .toLowerCase()
            .includes(searchText) ||

          donation.email
            .toLowerCase()
            .includes(searchText);

        const matchStatus =
          filterStatus === 'all' ||
          donation.status ===
            filterStatus;

        return (
          matchSearch &&
          matchStatus
        );

      }
    );


  /* =======================================================
     STATS
  ======================================================= */

  const totalCompleted =
    donations
      .filter(
        donation =>
          donation.status ===
          'COMPLETED'
      )
      .reduce(
        (sum, donation) =>
          sum +
          Number(
            donation.amount
          ),
        0
      );


  const totalPending =
    donations
      .filter(
        donation =>
          donation.status ===
          'PENDING_ADMIN'
      )
      .reduce(
        (sum, donation) =>
          sum +
          Number(
            donation.amount
          ),
        0
      );


  const totalAmount =
    donations.reduce(
      (sum, donation) =>
        sum +
        Number(
          donation.amount
        ),
      0
    );


  /* =======================================================
     PAYMENT METHOD CHART
  ======================================================= */

  const paymentMethods = [
    'TnG',
    'DuitNow',
    'FPX',
    'Others',
  ];


  const methodData =
    paymentMethods.map(
      method => {

        let value = 0;


        if (
          method ===
          'Others'
        ) {

          value =
            donations
              .filter(
                donation =>
                  ![
                    'TnG',
                    'DuitNow',
                    'FPX',
                  ].includes(
                    donation.payment_method
                  ) &&
                  donation.status ===
                    'COMPLETED'
              )
              .reduce(
                (
                  sum,
                  donation
                ) =>
                  sum +
                  Number(
                    donation.amount
                  ),
                0
              );

        } else {

          value =
            donations
              .filter(
                donation =>
                  donation.payment_method ===
                    method &&
                  donation.status ===
                    'COMPLETED'
              )
              .reduce(
                (
                  sum,
                  donation
                ) =>
                  sum +
                  Number(
                    donation.amount
                  ),
                0
              );
        }


        return {
          name:
            method ===
            'TnG'
              ? "Touch'n Go"
              : method ===
                'DuitNow'
                ? 'DuitNow QR'
                : method,

          value,

          fill:
            method ===
            'TnG'
              ? '#a855f7'
              : method ===
                'DuitNow'
                ? '#06b6d4'
                : method ===
                  'FPX'
                  ? '#10b981'
                  : '#f59e0b',
        };

      }
    );


  /* =======================================================
     SHELTER CHART
  ======================================================= */

  const shelterNames =
    Array.from(
      new Set(
        donations.map(
          donation =>
            donation.shelter
        )
      )
    );


  const shelterData =
    shelterNames.map(
      name => ({

        name:
          name
            .split(' ')
            .slice(0, 2)
            .join(' '),

        amount:
          donations
            .filter(
              donation =>
                donation.shelter ===
                  name &&
                donation.status ===
                  'COMPLETED'
            )
            .reduce(
              (
                sum,
                donation
              ) =>
                sum +
                Number(
                  donation.amount
                ),
              0
            ),

      })
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (

    <div className="space-y-6">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-bold
              text-white
            "
          >
            Donation Management
          </h1>


          <p
            className="
              text-slate-400
              text-sm
              mt-0.5
            "
          >
            Review donations approved by the
            animal shelter
          </p>

        </div>


        <button
          onClick={fetchDonations}
          className="
            flex
            items-center
            gap-2
            px-4
            py-2

            bg-slate-800
            hover:bg-slate-700

            text-slate-300

            rounded-xl

            text-sm
            font-medium

            border
            border-purple-500/20

            transition-colors
          "
        >

          <RefreshCw
            className="size-4"
          />

          Refresh

        </button>

      </div>


      {/* =====================================================
          STATS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-3
        "
      >

        {[
          {
            label:
              'Total Received (RM)',

            value:
              `RM ${totalCompleted.toLocaleString()}`,

            color:
              'text-emerald-400',
          },

          {
            label:
              'Pending (RM)',

            value:
              `RM ${totalPending.toLocaleString()}`,

            color:
              'text-amber-400',
          },

          {
            label:
              'Total Donations',

            value:
              donations.length,

            color:
              'text-white',
          },

          {
            label:
              'Total Amount (RM)',

            value:
              `RM ${totalAmount.toLocaleString()}`,

            color:
              'text-cyan-400',
          },

        ].map(
          stat => (

            <div
              key={
                stat.label
              }
              className="
                rounded-xl
                bg-slate-900/60
                border
                border-purple-500/20
                p-4
              "
            >

              <p
                className={`text-xl font-bold ${stat.color}`}
              >
                {stat.value}
              </p>


              <p
                className="
                  text-xs
                  text-slate-500
                  mt-1
                "
              >
                {stat.label}
              </p>

            </div>

          )
        )}

      </div>


      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div
        className="
          flex
          flex-wrap
          gap-3
        "
      >


        {/* SEARCH */}

        <div
          className="
            relative
            flex-1
            min-w-48
          "
        >

          <Search
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              size-4
              text-slate-500
            "
          />


          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="
              Search donations...
            "
            className="
              w-full
              h-10
              pl-9
              pr-4
              rounded-xl

              bg-slate-900/60

              border
              border-purple-500/20

              text-white
              text-sm

              placeholder:text-slate-500

              focus:outline-none
              focus:border-purple-400

              transition-all
            "
          />

        </div>


        {/* STATUS */}

        {[
          'all',
          'PENDING_ADMIN',
          'COMPLETED',
          'ADMIN_REJECTED',
        ].map(
          status => (

            <button
              key={status}
              onClick={() =>
                setFilterStatus(
                  status as
                    | DonationStatus
                    | 'all'
                )
              }
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                filterStatus ===
                status
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-900/60 border border-purple-500/20 text-slate-400 hover:text-white'
              }`}
            >

              {status ===
              'all'
                ? 'All'
                : status
                    .replace(
                      '_',
                      ' '
                    )
                    .toLowerCase()}

            </button>

          )
        )}

      </div>


      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (

        <div
          className="
            flex
            justify-center
            py-20
          "
        >

          <div
            className="
              w-10
              h-10

              border-4
              border-purple-400
              border-t-transparent

              rounded-full
              animate-spin
            "
          />

        </div>

      )}


      {/* =====================================================
          EMPTY
      ===================================================== */}

      {!loading &&
        filtered.length ===
          0 && (

          <div
            className="
              rounded-2xl

              bg-slate-900/60

              border
              border-purple-500/20

              p-12

              text-center
            "
          >

            <CheckCircle
              className="
                w-14
                h-14
                text-emerald-400
                mx-auto
                mb-4
              "
            />


            <h2
              className="
                text-xl
                font-semibold
                text-white
              "
            >
              No Donations Found
            </h2>


            <p
              className="
                text-slate-500
                text-sm
                mt-2
              "
            >
              There are currently no donations
              matching your search.
            </p>

          </div>

        )}


      {/* =====================================================
          TABLE
      ===================================================== */}

      {!loading &&
        filtered.length >
          0 && (

          <div
            className="
              rounded-2xl

              bg-slate-900/60

              border
              border-purple-500/20

              overflow-hidden
            "
          >

            <div
              className="
                overflow-x-auto
              "
            >

              <table
                className="
                  w-full
                "
              >

                <thead>

                  <tr
                    className="
                      border-b
                      border-purple-500/20
                    "
                  >

                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Donor
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Amount
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Method
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Shelter
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Status
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Date
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Transaction ID
                    </th>


                    <th
                      className="
                        text-left
                        text-xs
                        text-slate-500
                        font-medium
                        px-4
                        py-3
                      "
                    >
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filtered.map(
                    donation => {

                      const {
                        color,
                        icon: Icon,
                        label,
                      } =
                        statusConfig[
                          donation.status
                        ];


                      return (

                        <tr
                          key={
                            donation.id
                          }
                          className="
                            border-b
                            border-white/5
                            hover:bg-white/3
                            transition-colors
                          "
                        >

                          {/* DONOR */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <p
                              className="
                                text-sm
                                text-white
                              "
                            >
                              {
                                donation.full_name
                              }
                            </p>


                            <p
                              className="
                                text-xs
                                text-slate-500
                              "
                            >
                              {
                                donation.email
                              }
                            </p>

                          </td>


                          {/* AMOUNT */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <p
                              className="
                                text-sm
                                font-bold
                                text-emerald-400
                              "
                            >
                              RM{' '}

                              {Number(
                                donation.amount
                              ).toFixed(
                                2
                              )}

                            </p>

                          </td>


                          {/* METHOD */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                methodColor[
                                  donation
                                    .payment_method
                                ] ||
                                'bg-slate-500/20 text-slate-300'
                              }`}
                            >
                              {
                                donation.payment_method
                              }
                            </span>

                          </td>


                          {/* SHELTER */}

                          <td
                            className="
                              px-4
                              py-3
                              text-xs
                              text-slate-400
                            "
                          >
                            {
                              donation.shelter
                            }
                          </td>


                          {/* STATUS */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${color}`}
                            >

                              <Icon
                                className="
                                  size-3
                                "
                              />

                              {label}

                            </span>

                          </td>


                          {/* DATE */}

                          <td
                            className="
                              px-4
                              py-3
                              text-xs
                              text-slate-500
                            "
                          >

                            {new Date(
                              donation.created_at
                            ).toLocaleDateString()}

                          </td>


                          {/* TRANSACTION */}

                          <td
                            className="
                              px-4
                              py-3
                              text-xs
                              text-slate-500
                              font-mono
                            "
                          >
                            {
                              donation.transaction_id
                            }
                          </td>


                          {/* ACTION */}

                          <td
                            className="
                              px-4
                              py-3
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              {/* RECEIPT */}

                              {donation.receipt_url && (

                                <a
                                  href={
                                    donation.receipt_url
                                  }
                                  target="_blank"
                                  rel="
                                    noopener
                                    noreferrer
                                  "
                                  className="
                                    p-2
                                    rounded-lg
                                    bg-blue-500/10
                                    text-blue-400
                                    hover:bg-blue-500/20
                                  "
                                  title="
                                    View receipt
                                  "
                                >

                                  <Eye
                                    className="
                                      size-4
                                    "
                                  />

                                </a>

                              )}


                              {/* APPROVE */}

                              {donation.status ===
                                'PENDING_ADMIN' && (

                                <button
                                  onClick={() =>
                                    reviewDonation(
                                      donation.id,
                                      'approve'
                                    )
                                  }
                                  disabled={
                                    processingId ===
                                    donation.id
                                  }
                                  className="
                                    p-2
                                    rounded-lg

                                    bg-emerald-500/10
                                    text-emerald-400

                                    hover:bg-emerald-500/20

                                    disabled:opacity-50
                                  "
                                  title="
                                    Approve
                                  "
                                >

                                  <CheckCircle
                                    className="
                                      size-4
                                    "
                                  />

                                </button>

                              )}


                              {/* REJECT */}

                              {donation.status ===
                                'PENDING_ADMIN' && (

                                <button
                                  onClick={() =>
                                    reviewDonation(
                                      donation.id,
                                      'reject'
                                    )
                                  }
                                  disabled={
                                    processingId ===
                                    donation.id
                                  }
                                  className="
                                    p-2
                                    rounded-lg

                                    bg-red-500/10
                                    text-red-400

                                    hover:bg-red-500/20

                                    disabled:opacity-50
                                  "
                                  title="
                                    Reject
                                  "
                                >

                                  <XCircle
                                    className="
                                      size-4
                                    "
                                  />

                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}


      {/* =====================================================
          CHARTS — MOVED BELOW SEARCH / RESULTS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-4
        "
      >


        {/* =================================================
            PAYMENT METHOD
        ================================================= */}

        <div
          className="
            rounded-2xl
            bg-slate-900/60
            border
            border-purple-500/20
            p-5
          "
        >

          <h3
            className="
              text-sm
              font-semibold
              text-white
              mb-4
            "
          >
            Donation by Payment Method (RM)
          </h3>


          <div
            className="
              flex
              items-center
              gap-4
            "
          >

            <ResponsiveContainer
              width="60%"
              height={160}
            >

              <PieChart>

                <Pie
                  data={methodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >

                  {methodData.map(
                    (entry, index) => (

                      <Cell
                        key={index}
                        fill={
                          entry.fill
                        }
                      />

                    )
                  )}

                </Pie>


                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                  formatter={(
                    value: number
                  ) => [
                    `RM ${value}`,
                    '',
                  ]}
                />

              </PieChart>

            </ResponsiveContainer>


            <div
              className="
                space-y-2
                flex-1
              "
            >

              {methodData.map(
                method => (

                  <div
                    key={
                      method.name
                    }
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <div
                      className="
                        w-2.5
                        h-2.5
                        rounded-full
                        shrink-0
                      "
                      style={{
                        backgroundColor:
                          method.fill,
                      }}
                    />


                    <div
                      className="
                        flex-1
                        min-w-0
                      "
                    >

                      <p
                        className="
                          text-xs
                          text-slate-400
                          truncate
                        "
                      >
                        {
                          method.name
                        }
                      </p>


                      <p
                        className="
                          text-xs
                          font-semibold
                          text-white
                        "
                      >
                        RM{' '}

                        {method.value.toLocaleString()}

                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>


        {/* =================================================
            SHELTER
        ================================================= */}

        <div
          className="
            rounded-2xl
            bg-slate-900/60
            border
            border-purple-500/20
            p-5
          "
        >

          <h3
            className="
              text-sm
              font-semibold
              text-white
              mb-4
            "
          >
            Donations by Shelter (RM)
          </h3>


          <ResponsiveContainer
            width="100%"
            height={160}
          >

            <BarChart
              data={shelterData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="
                  rgba(139,92,246,0.1)
                "
              />


              <XAxis
                dataKey="name"
                tick={{
                  fill: '#64748b',
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />


              <YAxis
                tick={{
                  fill: '#64748b',
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />


              <Tooltip
                contentStyle={
                  tooltipStyle
                }
                formatter={(
                  value: number
                ) => [
                  `RM ${value}`,
                  '',
                ]}
              />


              <Bar
                dataKey="amount"
                fill="#a855f7"
                name="Amount (RM)"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>


    </div>

  );
}