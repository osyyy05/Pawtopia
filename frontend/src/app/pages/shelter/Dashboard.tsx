import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  PawPrint,
  Heart,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  Plus,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const statusColor = (status: string) => {
  const normalized = status.toUpperCase();

  if (
    normalized === 'COMPLETED' ||
    normalized === 'ADOPTED'
  ) {
    return 'bg-emerald-600/20 text-emerald-300';
  }

  if (normalized === 'APPROVED') {
    return 'bg-green-600/20 text-green-300';
  }

  if (
    normalized === 'PENDING' ||
    normalized === 'AVAILABLE'
  ) {
    return 'bg-yellow-600/20 text-yellow-300';
  }

  if (normalized === 'REJECTED') {
    return 'bg-red-600/20 text-red-300';
  }

  return 'bg-gray-600/20 text-gray-300';
};

export default function ShelterDashboard() {
  const [dashboard, setDashboard] = useState<any>({
    stats: {
      total_animals: 0,
      available_animals: 0,
      pending_applications: 0,
      completed_adoptions: 0,
      upcoming_appointments: 0,
    },
    adoption_trend: [],
    weekly_activity: [],
    recent_applications: [],
    recent_animals: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = sessionStorage.getItem('access_token');

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/adoptions/shelter-dashboard/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load dashboard: ${response.status}`
          );
        }

        const data = await response.json();

        setDashboard(data);
      } catch (error) {
        console.error('Error loading shelter dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = [
    {
      name: 'Total Animals',
      value: dashboard.stats.total_animals,
      change: '',
      icon: PawPrint,
      color: 'from-blue-600 to-cyan-600',
    },
    {
      name: 'Available for Adoption',
      value: dashboard.stats.available_animals,
      change: '',
      icon: Heart,
      color: 'from-pink-600 to-rose-600',
    },
    {
      name: 'Pending Applications',
      value: dashboard.stats.pending_applications,
      change: '',
      icon: FileText,
      color: 'from-amber-600 to-orange-600',
    },
    {
      name: 'Completed Adoptions',
      value: dashboard.stats.completed_adoptions,
      change: '',
      icon: CheckCircle,
      color: 'from-green-600 to-emerald-600',
    },
    {
      name: 'Upcoming Appointments',
      value: dashboard.stats.upcoming_appointments,
      change: '',
      icon: Calendar,
      color: 'from-purple-600 to-violet-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">
            Loading shelter dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Shelter Dashboard
            </h1>

            <p className="text-gray-300">
              Welcome back! Here's your shelter overview for today.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Link to="/shelter/animals">
                <Plus className="w-4 h-4 mr-2" />
                Add Animal
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Link to="/shelter/listings">
                <Heart className="w-4 h-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

                    {stat.change && (
                      <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {stat.change}
                      </span>
                    )}
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Adoption Activity */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                Adoption Activity
              </CardTitle>

              <CardDescription className="text-gray-400">
                Monthly applications, completed adoptions and rejections
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboard.adoption_trend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                  />

                  <YAxis stroke="#9CA3AF" />

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
                    dataKey="applications"
                    fill="#8B5CF6"
                    name="Applications"
                  />

                  <Bar
                    dataKey="completed"
                    fill="#06B6D4"
                    name="Completed"
                  />

                  <Bar
                    dataKey="rejections"
                    fill="#EF4444"
                    name="Rejections"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                Weekly Activity
              </CardTitle>

              <CardDescription className="text-gray-400">
                Animals added vs adopted this week
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboard.weekly_activity}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                  />

                  <XAxis
                    dataKey="day"
                    stroke="#9CA3AF"
                  />

                  <YAxis stroke="#9CA3AF" />

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

                  <Line
                    type="monotone"
                    dataKey="rescued"
                    stroke="#EC4899"
                    strokeWidth={2}
                    name="Added"
                  />

                  <Line
                    type="monotone"
                    dataKey="adopted"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    name="Adopted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Adoption Requests & Recently Added Animals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Adoption Requests */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Adoption Requests
              </CardTitle>

              <CardDescription className="text-gray-400">
                Latest applications submitted
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {dashboard.recent_applications.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No applications yet.
                  </p>
                ) : (
                  dashboard.recent_applications.map((app: any) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {app.applicant}
                        </p>

                        <p className="text-sm text-gray-400 truncate">
                          {app.pet}
                        </p>

                        <p className="text-xs text-gray-500">
                          {app.date}
                        </p>
                      </div>

                      <span
                        className={`ml-3 px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusColor(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <Link to="/shelter/applications">
                  View All Applications
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recently Added Animals */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recently Added Animals
              </CardTitle>

              <CardDescription className="text-gray-400">
                Animals recently registered in the shelter
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {dashboard.recent_animals.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No animals registered yet.
                  </p>
                ) : (
                  dashboard.recent_animals.map((animal: any) => (
                    <div
                      key={animal.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-sm">
                            {animal.species === 'Dog'
                              ? '🐕'
                              : '🐈'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="text-white font-medium">
                            {animal.name}
                          </p>

                          <p className="text-sm text-gray-400">
                            {animal.breed} · {animal.age}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`ml-3 px-2 py-1 rounded-full text-xs whitespace-nowrap ${statusColor(
                          animal.status
                        )}`}
                      >
                        {animal.status}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full mt-4 border-white/20 text-gray-300 hover:text-white hover:bg-white/5"
              >
                <Link to="/shelter/animals">
                  View All Animals
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}