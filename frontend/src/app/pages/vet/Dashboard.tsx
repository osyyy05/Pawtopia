import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  TrendingUp,
  Plus,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    todays_appointments: number;
    upcoming_appointments: number;
    completed_today: number;
    scheduled_appointments: number;
  };

  weekly_appointments: {
    day: string;
    date: string;
    appointments: number;
    completed: number;
  }[];

  today_schedule: {
    id: number;
    time: string;
    pet: string;
    owner: string;
    species: string;
    type: string;
    status: string;
  }[];

  status_summary: {
    scheduled: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
}

const statusColor = (status: string) => {
  if (status === 'Completed') {
    return 'bg-green-600/20 text-green-400';
  }

  if (status === 'In Progress') {
    return 'bg-blue-600/20 text-blue-400';
  }

  if (status === 'Cancelled') {
    return 'bg-red-600/20 text-red-400';
  }

  return 'bg-yellow-600/20 text-yellow-400';
};

export default function VetDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = sessionStorage.getItem('access_token');

      if (!token) {
        toast.error('Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/appointments/vet-dashboard/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.detail ||
              'Failed to load dashboard'
          );
        }

        setDashboard(data);
      } catch (error) {
        console.error('Failed to load vet dashboard:', error);

        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <p className="text-white text-lg">
            Loading vet dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <p className="text-gray-400 text-lg">
            Unable to load dashboard.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Today's Appointments",
      value: dashboard.stats.todays_appointments,
      icon: Calendar,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Upcoming (7 days)',
      value: dashboard.stats.upcoming_appointments,
      icon: Clock,
      color: 'from-purple-600 to-violet-600',
    },
    {
      name: 'Completed Today',
      value: dashboard.stats.completed_today,
      icon: CheckCircle,
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'Scheduled Appointments',
      value: dashboard.stats.scheduled_appointments,
      icon: Activity,
      color: 'from-pink-600 to-rose-600',
    },
  ];

  const statusItems = [
    {
      name: 'Scheduled',
      value: dashboard.status_summary.scheduled,
      className: 'text-yellow-400',
    },
    {
      name: 'In Progress',
      value: dashboard.status_summary.in_progress,
      className: 'text-blue-400',
    },
    {
      name: 'Completed',
      value: dashboard.status_summary.completed,
      className: 'text-green-400',
    },
    {
      name: 'Cancelled',
      value: dashboard.status_summary.cancelled,
      className: 'text-red-400',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Vet Dashboard
            </h1>

            <p className="text-gray-300">
              Good morning! Here's your appointment overview for today.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Link to="/vet/health-records">
                <Plus className="w-4 h-4 mr-2" />
                Add Medical Record
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Link to="/vet/appointments">
                <Calendar className="w-4 h-4 mr-2" />
                Appointments
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.name}
                className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <TrendingUp className="w-4 h-4 text-gray-500" />
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">
                      {stat.name}
                    </p>

                    <p className="text-2xl font-bold text-white">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Weekly Appointments */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">
              Weekly Appointments
            </CardTitle>

            <CardDescription className="text-gray-400">
              Appointments scheduled and completed this week
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.weekly_appointments}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />

                <XAxis
                  dataKey="day"
                  stroke="#9CA3AF"
                />

                <YAxis
                  stroke="#9CA3AF"
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{
                    color: '#F3F4F6',
                  }}
                />

                <Legend />

                <Bar
                  dataKey="appointments"
                  fill="#8B5CF6"
                  name="Appointments"
                />

                <Bar
                  dataKey="completed"
                  fill="#06B6D4"
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Today's Schedule + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Today's Schedule */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Today's Schedule
              </CardTitle>

              <CardDescription className="text-gray-400">
                {new Date().toLocaleDateString('en-MY', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {dashboard.today_schedule.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-500" />

                  <p className="text-gray-400">
                    No appointments scheduled for today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.today_schedule.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="text-center shrink-0 w-20">
                        <p className="text-cyan-400 text-xs font-medium">
                          {appointment.time}
                        </p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {appointment.pet}
                        </p>

                        <p className="text-gray-400 text-xs">
                          {appointment.owner} · {appointment.type}
                        </p>

                        {appointment.species && (
                          <p className="text-gray-500 text-xs mt-1">
                            {appointment.species}
                          </p>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${statusColor(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <Link to="/vet/schedule">
                  View Full Schedule
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Appointment Status */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Appointment Status
              </CardTitle>

              <CardDescription className="text-gray-400">
                Current status of your assigned appointments
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {statusItems.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-8 rounded-full ${item.className.replace(
                          'text-',
                          'bg-'
                        )}`}
                      />

                      <span className="text-gray-300">
                        {item.name}
                      </span>
                    </div>

                    <span
                      className={`text-xl font-bold ${item.className}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <Link to="/vet/appointments">
                  Manage Appointments
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}