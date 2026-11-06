import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Heart, DollarSign, Calendar, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

useEffect(() => {
  const fetchMonthlyData = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/admin/dashboard/monthly/',
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
          'Failed to load monthly statistics.'
        );
      }

      setMonthlyData(
        Array.isArray(data)
          ? data.map((item: any) => ({
              month: item.month,
              users: item.users,
              adoptions: item.adoptions,
              donations: item.donations,
            }))
          : []
      );

    } catch (error) {
      console.error(
        'Failed to load monthly statistics:',
        error
      );

      setMonthlyData([]);
    }
  };

  fetchMonthlyData();
}, []);


useEffect(() => {
  const fetchWeeklyActivity = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/admin/dashboard/weekly/',
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
          'Failed to load weekly activity.'
        );
      }

      setActivityData(
        Array.isArray(data)
          ? data.map((item: any) => ({
              day: item.day,
              appointments: item.appointments,
            }))
          : []
      );

    } catch (error) {
      console.error(
        'Failed to load weekly activity:',
        error
      );

      setActivityData([]);
    }
  };

  fetchWeeklyActivity();
}, []);

useEffect(() => {
  const fetchRecentActivities = async () => {
    const accessToken =
      sessionStorage.getItem('access_token');

    if (!accessToken) {
      return;
    }

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/admin/dashboard/recent/',
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
          'Failed to load recent activities.'
        );
      }

      setRecentActivities(
        Array.isArray(data)
          ? data.map((item: any) => ({
              ...item,
              time: new Date(
                item.timestamp
              ).toLocaleString(),
            }))
          : []
      );

    } catch (error) {
      console.error(
        'Failed to load recent activities:',
        error
      );

      setRecentActivities([]);
    }
  };

  fetchRecentActivities();
}, []);

    const [stats, setStats] = useState([
    {
      name: 'Total Users',
      value: '0',
      change: '',
      icon: Users,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      name: 'Adoption Requests',
      value: '0',
      change: '',
      icon: Heart,
      color: 'from-pink-600 to-rose-600'
    },
    {
      name: 'Total Donations',
      value: 'RM 0',
      change: '',
      icon: DollarSign,
      color: 'from-amber-600 to-orange-600'
    },
    {
      name: 'Appointments',
      value: '0',
      change: '',
      icon: Calendar,
      color: 'from-green-600 to-emerald-600'
    },
  ]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const accessToken =
        sessionStorage.getItem('access_token');

      if (!accessToken) {
        return;
      }

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/admin/dashboard/',
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
            'Failed to load dashboard statistics.'
          );
        }

        setStats([
          {
            name: 'Total Users',
            value: String(data.total_users),
            change: '',
            icon: Users,
            color: 'from-blue-600 to-cyan-600'
          },
          {
            name: 'Adoption Requests',
            value: String(data.adoption_requests),
            change: '',
            icon: Heart,
            color: 'from-pink-600 to-rose-600'
          },
          {
            name: 'Total Donations',
            value: `RM ${Number(data.total_donations).toFixed(2)}`,
            change: '',
            icon: DollarSign,
            color: 'from-amber-600 to-orange-600'
          },
          {
            name: 'Appointments',
            value: String(data.appointments),
            change: '',
            icon: Calendar,
            color: 'from-green-600 to-emerald-600'
          },
        ]);

      } catch (error) {
        console.error(
          'Failed to load dashboard statistics:',
          error
        );
      }
    };

    fetchDashboardStats();
  }, []);

  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-300">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{stat.name}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Overview */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Monthly Overview</CardTitle>
              <CardDescription className="text-gray-400">User growth and activity trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(
                        Number(year),
                        Number(month) - 1
                      ).toLocaleString('en-US', {
                        month: 'short',
                      });
                    }}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Bar dataKey="users" fill="#3B82F6" name="New Users" />
                  <Bar dataKey="adoptions" fill="#EC4899" name="Adoptions" />
                  <Bar dataKey="donations" fill="#F59E0B" name="Donations (RM)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">
                Weekly Appointment Activity
              </CardTitle>

              <CardDescription className="text-gray-400">
                Appointments created this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    name="Appointments"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activities
            </CardTitle>
            <CardDescription className="text-gray-400">Latest user actions and system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'adoption' ? 'bg-pink-400' :
                    activity.type === 'donation' ? 'bg-amber-400' :
                    activity.type === 'user' ? 'bg-blue-400' :
                    activity.type === 'appointment' ? 'bg-green-400' :
                    'bg-purple-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
