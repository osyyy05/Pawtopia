import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { PawPrint, Heart, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const monthlyData = [
  { month: 'Jan', rescued: 8, adopted: 5, returned: 1 },
  { month: 'Feb', rescued: 12, adopted: 9, returned: 0 },
  { month: 'Mar', rescued: 10, adopted: 8, returned: 2 },
  { month: 'Apr', rescued: 15, adopted: 11, returned: 1 },
  { month: 'May', rescued: 18, adopted: 14, returned: 0 },
  { month: 'Jun', rescued: 9, adopted: 7, returned: 0 },
];

const speciesData = [
  { name: 'Dogs', value: 28 },
  { name: 'Cats', value: 15 },
  { name: 'Birds', value: 3 },
  { name: 'Rabbits', value: 2 },
];

const applicationTrend = [
  { month: 'Jan', rate: 62 },
  { month: 'Feb', rate: 75 },
  { month: 'Mar', rate: 80 },
  { month: 'Apr', rate: 73 },
  { month: 'May', rate: 78 },
  { month: 'Jun', rate: 88 },
];

const COLORS = ['#8B5CF6', '#06B6D4', '#EC4899', '#F59E0B'];

const summaryStats = [
  { label: 'Total Animals Rescued (YTD)', value: '72', icon: PawPrint, color: 'from-blue-600 to-cyan-600', change: '+18%', up: true },
  { label: 'Total Adoptions (YTD)', value: '54', icon: Heart, color: 'from-pink-600 to-rose-600', change: '+22%', up: true },
  { label: 'Approval Rate', value: '79%', icon: CheckCircle, color: 'from-green-600 to-emerald-600', change: '+5%', up: true },
  { label: 'Rejection Rate', value: '21%', icon: XCircle, color: 'from-red-600 to-rose-600', change: '-3%', up: false },
];

export default function Statistics() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">Statistics</h1>
          <p className="text-gray-300">Shelter performance metrics and adoption analytics.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryStats.map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={`text-sm font-medium flex items-center gap-1 ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Rescue vs Adoption */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Monthly Rescue vs Adoption</CardTitle>
              <CardDescription className="text-gray-400">Animals rescued and adopted each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#F3F4F6' }} />
                  <Legend />
                  <Bar dataKey="rescued" fill="#8B5CF6" name="Rescued" />
                  <Bar dataKey="adopted" fill="#06B6D4" name="Adopted" />
                  <Bar dataKey="returned" fill="#EF4444" name="Returned" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Species Distribution */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Animals by Species</CardTitle>
              <CardDescription className="text-gray-400">Current shelter population breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={speciesData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {speciesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Approval Rate Trend */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Adoption Approval Rate Trend</CardTitle>
            <CardDescription className="text-gray-400">Monthly approval rate percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={applicationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[50, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} labelStyle={{ color: '#F3F4F6' }} formatter={(v) => [`${v}%`, 'Approval Rate']} />
                <Line type="monotone" dataKey="rate" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 5 }} name="Approval Rate" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
