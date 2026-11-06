import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

interface Appointment {
  id: number;
  pet_name: string;
  species: string;
  adopter_name: string;
  date: string;
  time: string;
  appointment_type: string;
  appointment_type_display: string;
  status: string;
  status_display: string;
}

interface TimeSlot {
  time: string;
  petName: string;
  ownerName: string;
  type: string;
  status: 'Free' | 'Booked' | 'Break';
}

type WeekSchedule = Record<string, TimeSlot[]>;

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const clinicTimes = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

const getMonday = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getDateForDay = (
  monday: Date,
  dayIndex: number
) => {
  const date = new Date(monday);

  date.setDate(monday.getDate() + dayIndex);

  return date;
};

const createEmptySchedule = (
  appointments: Appointment[],
  monday: Date
): WeekSchedule => {
  const schedule: WeekSchedule = {};

  weekDays.forEach((day, dayIndex) => {
    const currentDate = getDateForDay(monday, dayIndex);
    const dateString = formatDate(currentDate);

    schedule[day] = clinicTimes.map(time => {
      // Saturday is half-day
      if (
        day === 'Saturday' &&
        time !== '09:00' &&
        time !== '10:00' &&
        time !== '11:00' &&
        time !== '12:00'
      ) {
        return {
          time,
          petName: '',
          ownerName: '',
          type: '',
          status: 'Break',
        };
      }

      // Lunch break
      if (time === '12:00') {
        return {
          time,
          petName: day === 'Saturday'
            ? 'HALF DAY END'
            : 'LUNCH',
          ownerName: '',
          type: '',
          status: 'Break',
        };
      }

      // Find real appointment from backend
      const appointment = appointments.find(a => {
        const appointmentTime = a.time?.slice(0, 5);

        return (
          a.date === dateString &&
          appointmentTime === time &&
          a.status !== 'CANCELLED'
        );
      });

      if (appointment) {
        return {
          time,
          petName: appointment.pet_name || 'Unknown Pet',
          ownerName:
            appointment.adopter_name || 'Unknown Owner',
          type:
            appointment.appointment_type_display ||
            appointment.appointment_type ||
            'Appointment',
          status: 'Booked',
        };
      }

      return {
        time,
        petName: '',
        ownerName: '',
        type: '',
        status: 'Free',
      };
    });
  });

  return schedule;
};

const slotColor = (status: string) => {
  if (status === 'Booked') {
    return 'bg-purple-600/20 border-purple-500/30 text-purple-300';
  }

  if (status === 'Break') {
    return 'bg-gray-700/40 border-gray-600/30 text-gray-500';
  }

  return 'bg-white/5 border-white/10 text-gray-500';
};

export default function Schedule() {
  const [selectedDay, setSelectedDay] = useState('Monday');

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [loading, setLoading] = useState(true);

  const [monday, setMonday] = useState(() =>
    getMonday(new Date())
  );

  useEffect(() => {
    const loadAppointments = async () => {
      const token = sessionStorage.getItem('access_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/appointments/vet/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            'Failed to load vet appointments'
          );
        }

        const data = await response.json();

        setAppointments(
          Array.isArray(data)
            ? data
            : data.results || []
        );
      } catch (error) {
        console.error(
          'Failed to load schedule:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const schedule = createEmptySchedule(
    appointments,
    monday
  );

  const todaySlots = schedule[selectedDay] || [];

  const booked = todaySlots.filter(
    s => s.status === 'Booked'
  ).length;

  const free = todaySlots.filter(
    s => s.status === 'Free'
  ).length;

  const totalAvailable = booked + free;

  const utilisation =
    totalAvailable > 0
      ? Math.round((booked / totalAvailable) * 100)
      : 0;

  const currentDayIndex =
    weekDays.indexOf(selectedDay);

  const prevDay = () => {
    setSelectedDay(
      weekDays[
        Math.max(0, currentDayIndex - 1)
      ]
    );
  };

  const nextDay = () => {
    setSelectedDay(
      weekDays[
        Math.min(
          weekDays.length - 1,
          currentDayIndex + 1
        )
      ]
    );
  };

  const previousWeek = () => {
    const newMonday = new Date(monday);

    newMonday.setDate(
      newMonday.getDate() - 7
    );

    setMonday(newMonday);
  };

  const nextWeek = () => {
    const newMonday = new Date(monday);

    newMonday.setDate(
      newMonday.getDate() + 7
    );

    setMonday(newMonday);
  };

  const weekStart = formatDate(monday);

  const weekEnd = formatDate(
    getDateForDay(monday, 5)
  );

  return (
    <div className="min-h-screen p-8">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Clinic Schedule
          </h1>

          <p className="text-gray-300">
            View and manage the weekly appointment schedule.
          </p>

        </div>

        {/* Loading */}
        {loading && (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 text-center">
              <p className="text-gray-400">
                Loading schedule...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 text-center">

              <p className="text-2xl font-bold text-purple-400">
                {booked}
              </p>

              <p className="text-gray-400 text-xs">
                Booked Slots
              </p>

            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 text-center">

              <p className="text-2xl font-bold text-green-400">
                {free}
              </p>

              <p className="text-gray-400 text-xs">
                Free Slots
              </p>

            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-4 text-center">

              <p className="text-2xl font-bold text-white">
                {utilisation}%
              </p>

              <p className="text-gray-400 text-xs">
                Utilisation
              </p>

            </CardContent>
          </Card>

        </div>

        {/* Weekly Schedule */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">

          <CardHeader>

            <div className="flex items-center justify-between">

              <CardTitle className="text-white flex items-center gap-2">

                <Clock className="w-5 h-5" />

                Weekly Schedule

              </CardTitle>

              <div className="flex items-center gap-2">

                {/* Previous Week */}
                <Button
                  onClick={previousWeek}
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-gray-300"
                  title="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <span className="text-gray-400 text-xs hidden sm:block">
                  {weekStart} → {weekEnd}
                </span>

                {/* Next Week */}
                <Button
                  onClick={nextWeek}
                  variant="outline"
                  size="icon"
                  className="border-white/20 text-gray-300"
                  title="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

              </div>

            </div>

            {/* Day navigation */}
            <div className="flex items-center justify-between mt-2">

              <Button
                onClick={prevDay}
                variant="outline"
                size="icon"
                disabled={currentDayIndex === 0}
                className="border-white/20 text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-white font-medium">
                {selectedDay}
              </span>

              <Button
                onClick={nextDay}
                variant="outline"
                size="icon"
                disabled={
                  currentDayIndex ===
                  weekDays.length - 1
                }
                className="border-white/20 text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 flex-wrap mt-2">

              {weekDays.map(
                (day, dayIndex) => {

                  const date =
                    getDateForDay(
                      monday,
                      dayIndex
                    );

                  return (
                    <Button
                      key={day}
                      onClick={() =>
                        setSelectedDay(day)
                      }
                      variant={
                        selectedDay === day
                          ? 'default'
                          : 'outline'
                      }
                      className={
                        selectedDay === day
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-xs px-3'
                          : 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5 text-xs px-3'
                      }
                    >
                      {day.slice(0, 3)}
                      {' '}
                      {date.getDate()}
                    </Button>
                  );
                }
              )}

            </div>

          </CardHeader>

          <CardContent>

            <div className="space-y-2">

              {todaySlots.map(
                (slot, i) => (

                  <div
                    key={i}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${slotColor(
                      slot.status
                    )}`}
                  >

                    <span className="text-cyan-400 font-mono text-sm w-14 shrink-0">
                      {slot.time}
                    </span>

                    {slot.status === 'Booked' ? (

                      <div className="flex-1">

                        <p className="text-white font-medium text-sm">
                          {slot.petName}
                        </p>

                        <p className="text-gray-400 text-xs">
                          {slot.ownerName}
                          {' · '}
                          {slot.type}
                        </p>

                      </div>

                    ) : slot.status === 'Break' ? (

                      <p className="text-gray-500 text-sm italic">
                        {slot.petName || 'Break'}
                      </p>

                    ) : (

                      <p className="text-gray-600 text-sm">
                        — Available
                      </p>

                    )}

                  </div>

                )
              )}

            </div>

          </CardContent>

        </Card>

      </div>

    </div>
  );
}