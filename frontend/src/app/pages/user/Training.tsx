
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '../../components/ui/card';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

interface TrainingTopic {
  id: number;
  title: string;
  category: string;
  duration: string;
  difficulty: string;
  description: string;
  content: string;
  image: string;
  image_file: string;
  video_url: string;
  video: string;
  quizzes: any[];
}

export default function Training() {
  const [trainingTopics, setTrainingTopics] = useState<TrainingTopic[]>([]);

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/training/'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch training topics');
        }

        const data = await response.json();
        setTrainingTopics(data);
      } catch (error) {
        console.error('Error fetching training:', error);
      }
    };

    fetchTraining();
  }, []);

  return (
    <div className="min-h-screen text-white">

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-purple-900/30 via-[#111827]/70 to-cyan-900/20 py-12">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300">
            <GraduationCap className="h-4 w-4" />
            Pet Care Learning
          </div>

          {/* Main Title */}
          <h1 className="mb-4 pb-2 text-4xl md:text-5xl font-bold leading-[1.3] tracking-tight bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Pet Training
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-gray-300">
            Learn how to better understand, care for, and train your pets.
          </p>
        </div>
      </section>

      {/* Training Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">

        {/* Section Heading */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-purple-400">
              <Sparkles className="h-4 w-4" />
              Explore & Learn
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Training Topics
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Explore training guides and improve your pet care knowledge.
            </p>
          </div>

          {/* Topic Counter */}
          <div className="self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            {trainingTopics.length}{' '}
            {trainingTopics.length === 1 ? 'Topic' : 'Topics'}
          </div>
        </div>

        {/* Training Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {trainingTopics.map((topic) => (
            <Card
              key={topic.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827]/80 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/30 hover:shadow-purple-500/5"
            >

              {/* Training Image */}
              <div className="relative h-56 overflow-hidden bg-white/5">
                <img
                  src={topic.image_file || topic.image}
                  alt={topic.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111827]/50 via-transparent to-transparent" />
              </div>

              <CardContent className="flex flex-1 flex-col p-6 space-y-5">

                {/* Category and Difficulty */}
                <div className="flex flex-wrap items-center justify-between gap-3">

                  <Badge className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-purple-300 hover:bg-purple-500/15">
                    {topic.category}
                  </Badge>

                  <Badge className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-cyan-300 hover:bg-cyan-500/15">
                    {topic.difficulty}
                  </Badge>
                </div>

                {/* Topic Title */}
                <h2 className="text-xl md:text-2xl font-bold leading-snug text-white transition-colors group-hover:text-purple-300">
                  {topic.title}
                </h2>

                {/* Description */}
                <p className="text-sm md:text-base leading-relaxed text-gray-300">
                  {topic.description}
                </p>

                {/* Training Details */}
                <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-sm text-gray-400">

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-400" />
                    <span>{topic.duration}</span>
                  </div>

                  {topic.quizzes?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-cyan-400" />
                      <span>Quiz Available</span>
                    </div>
                  )}
                </div>

                {/* Start Learning Button */}
                <div className="mt-auto pt-2">
                  <Link
                    to={`/user/training/${topic.id}`}
                    className="block"
                  >
                    <Button
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 font-semibold text-white shadow-lg shadow-purple-950/20 transition-all hover:from-purple-500 hover:to-cyan-500"
                    >
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
