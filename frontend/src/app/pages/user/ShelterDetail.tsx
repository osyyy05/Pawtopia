import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Heart,
  Home,
  ArrowRight,
} from 'lucide-react';

export default function ShelterDetail() {
  const { id } = useParams();

  const [shelter, setShelter] = useState<any>(null);
  const [shelterPets, setShelterPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShelterData = async () => {
      try {
        setLoading(true);

        const token = sessionStorage.getItem('access_token');

        // Get all adoption animals
        const animalsResponse = await fetch(
          'http://127.0.0.1:8000/api/adoptions/',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!animalsResponse.ok) {
          throw new Error('Failed to load adoption animals');
        }

        const animalsData = await animalsResponse.json();

        // Find animals belonging to this shelter
        const animals = Array.isArray(animalsData)
          ? animalsData.map((pet: any) => ({
              ...pet,
              shelterId: String(pet.shelter),
              shelterName: pet.shelter_name,
            }))
          : [];

        const pets = animals.filter(
          (pet: any) => pet.shelterId === String(id)
        );

        setShelterPets(pets);

        // Get shelter information
        const shelterResponse = await fetch(
          `http://127.0.0.1:8000/api/shelters/${id}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!shelterResponse.ok) {
          throw new Error('Failed to load shelter');
        }

        const shelterData = await shelterResponse.json();

        setShelter(shelterData);
      } catch (error) {
        console.error('Error loading shelter:', error);
        setShelter(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShelterData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-lg">Loading shelter...</p>
      </div>
    );
  }

  if (!shelter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/40 backdrop-blur-xl border-white/10 p-8">
          <p className="text-white text-center text-lg">
            Shelter not found
          </p>

          <Link to="/user/adoption">
            <Button className="mt-4 w-full">
              Back to Adoption
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">

      {/* BACK BUTTON */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link to="/user/adoption">
          <Button
            variant="ghost"
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Adoption
          </Button>
        </Link>
      </div>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden">

          {/* IMAGE */}
          <div className="relative h-[350px] md:h-[450px] overflow-hidden">
            {shelter.image ? (
              <img
                src={shelter.image}
                alt={shelter.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/30">
                <Home className="w-20 h-20 text-gray-500" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <Badge className="mb-3 bg-purple-600/30 text-purple-300 border-purple-400/30">
                Partner Shelter
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {shelter.name}
              </h1>

              <div className="flex items-center gap-2 mt-3 text-gray-300">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <span>{shelter.address || 'Address unavailable'}</span>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <CardContent className="p-6 md:p-10">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ABOUT */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-white mb-4">
                  About the Shelter
                </h2>

                <p className="text-gray-300 leading-relaxed text-lg">
                  {shelter.description || 'No description available.'}
                </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-2 gap-4">

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <Home className="w-6 h-6 text-cyan-400 mb-3" />

                  <p className="text-gray-400 text-sm">
                    Capacity
                  </p>

                  <p className="text-2xl font-bold text-white">
                    {shelter.capacity ?? 0}
                  </p>

                  <p className="text-gray-400 text-sm">
                    animals
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <Heart className="w-6 h-6 text-pink-400 mb-3" />

                  <p className="text-gray-400 text-sm">
                    Currently Caring
                  </p>

                  <p className="text-2xl font-bold text-white">
                    {shelter.current_animals ?? 0}
                  </p>

                  <p className="text-gray-400 text-sm">
                    animals
                  </p>
                </div>

              </div>

            </div>

            {/* CONTACT */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-white mb-6">
                Contact Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">
                      Address
                    </p>

                    <p className="text-white">
                      {shelter.address || 'Address unavailable'}
                    </p>
                  </div>
                </div>

                <a
                  href={shelter.phone ? `tel:${shelter.phone}` : '#'}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">
                      Contact
                    </p>

                    <p className="text-white">
                      {shelter.phone || 'Phone number unavailable'}
                    </p>

                    {shelter.phone && (
                      <p className="text-gray-400 text-xs mt-1">
                        Click to call shelter
                      </p>
                    )}
                  </div>
                </a>

              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* AVAILABLE ANIMALS */}
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Animals Available Here
            </h2>

            <p className="text-gray-400 mt-1">
              Meet animals currently looking for a loving home.
            </p>
          </div>

          <Badge className="bg-cyan-600/20 text-cyan-400 border-cyan-500/30">
            {shelterPets.length} Available
          </Badge>
        </div>

        {shelterPets.length === 0 ? (
          <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">
            <p className="text-gray-400 text-center">
              There are currently no animals listed for adoption from this shelter.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {shelterPets.map((pet) => (
              <Link
                key={pet.id}
                to={`/user/adoption/${pet.id}`}
              >
                <Card className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden hover:border-white/30 transition-all group h-full">

                  <div className="aspect-video overflow-hidden">
                    {pet.image ? (
                      <img
                        src={pet.image}
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/30">
                        <Home className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-white">
                        {pet.name}
                      </CardTitle>

                      <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                    </div>

                    <p className="text-gray-400 italic">
                      {pet.breed}
                    </p>
                  </CardHeader>

                  <CardContent>
                    <div className="flex justify-between text-sm">

                      <div>
                        <p className="text-gray-400">
                          Species
                        </p>

                        <p className="text-white">
                          {pet.species}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-400">
                          Age
                        </p>

                        <p className="text-white">
                          {pet.age}
                        </p>
                      </div>

                    </div>
                  </CardContent>

                </Card>
              </Link>
            ))}

          </div>
        )}

      </div>

      {/* ACTIONS */}
      <div className="max-w-7xl mx-auto px-4 mt-10">
        <Card className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 backdrop-blur-xl border-white/10">
          <CardContent className="p-8">

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Support {shelter.name}
                </h2>

                <p className="text-gray-300 mt-2">
                  Help provide food, medical care and a safe home
                  for animals in need.
                </p>
              </div>

              <Link to="/user/donation">
                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-8">
                  <Heart className="w-4 h-4 mr-2" />
                  Donate to Shelter
                </Button>
              </Link>

            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  );
}