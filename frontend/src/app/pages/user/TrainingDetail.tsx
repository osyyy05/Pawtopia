import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Clock,
  BookOpen,
  Play,
  CheckCircle,
  XCircle,
  Printer,
  Award
} from 'lucide-react';

import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

import { toast } from 'sonner';


interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
}


interface Quiz {
  id: number;
  title: string;
  questions: QuizQuestion[];
}


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
  quizzes: Quiz[];
}


export default function TrainingDetail() {

  const { id } = useParams();
  const navigate = useNavigate();


  const [topic, setTopic] =
    useState<TrainingTopic | null>(null);

  const [loading, setLoading] =
    useState(true);


  // =========================================================
  // QUIZ STATE
  // =========================================================

  const [quizStarted, setQuizStarted] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswers, setSelectedAnswers] =
    useState<number[]>([]);

  const [quizCompleted, setQuizCompleted] =
    useState(false);

  const [, setScore] =
    useState(0);

  const [correctAnswers, setCorrectAnswers] =
    useState(0);

  const [passed, setPassed] =
    useState(false);

  const [attemptsRemaining, setAttemptsRemaining] =
    useState(2);

  const [badgeEarned, setBadgeEarned] =
    useState(false);

  // EXISTING POPUP STATE
  const [showBadgePopup, setShowBadgePopup] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [quizError, setQuizError] =
    useState('');


  // =========================================================
  // FETCH TRAINING DETAIL
  // =========================================================

  useEffect(() => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });

    const fetchTrainingDetail = async () => {

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/training/${id}/`
        );

        if (!response.ok) {
          throw new Error(
            'Training topic not found'
          );
        }

        const data =
          await response.json();
        setTopic(data);
      } catch (error) {

        console.error(
          'Error fetching training detail:',
          error
        );

        toast.error(
          'Failed to load training topic'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingDetail();
  }, [id]);


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          p-8
          flex
          items-center
          justify-center
        "
      >

        <p
          className="
            text-gray-300
            text-lg
          "
        >
          Loading training...
        </p>

      </div>

    );

  }


  // =========================================================
  // NO TOPIC
  // =========================================================

  if (!topic) {

    return (

      <div
        className="
          min-h-screen
          p-8
          flex
          items-center
          justify-center
        "
      >

        <div className="text-center">

          <p
            className="
              text-gray-300
              mb-4
            "
          >
            Training topic not found.
          </p>


          <Button
            onClick={() =>
              navigate('/user/training')
            }
          >
            Back to Training
          </Button>

        </div>

      </div>

    );

  }


  // =========================================================
  // QUIZ DATA
  // =========================================================

  const quiz =
    topic.quizzes?.[0];

  const questions =
    quiz?.questions || [];


  // =========================================================
  // START QUIZ
  // =========================================================

  const handleStartQuiz = () => {

    if (
      !quiz ||
      questions.length === 0
    ) {

      toast.error(
        'This training does not have a quiz yet.'
      );

      return;

    }


    setQuizStarted(true);
    setQuizCompleted(false);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setQuizError('');
    setBadgeEarned(false);
    setShowBadgePopup(false);

  };


  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleAnswer = (
    answerIndex: number
  ) => {

    const updatedAnswers = [
      ...selectedAnswers
    ];


    updatedAnswers[
      currentQuestion
    ] = answerIndex;


    setSelectedAnswers(
      updatedAnswers
    );

  };


  // =========================================================
  // NEXT QUESTION
  // =========================================================

  const handleNext = () => {

    if (
      selectedAnswers[
        currentQuestion
      ] === undefined
    ) {

      toast.error(
        'Please select an answer first.'
      );

      return;

    }


    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );

    } else {

      handleCompleteQuiz();

    }

  };


  // =========================================================
  // PREVIOUS QUESTION
  // =========================================================

  const handlePrevious = () => {

    if (
      currentQuestion > 0
    ) {

      setCurrentQuestion(
        currentQuestion - 1
      );

    }

  };


  // =========================================================
  // COMPLETE QUIZ
  // =========================================================

  const handleCompleteQuiz =
    async () => {

      if (!quiz) {
        return;
      }


      try {

        setSubmitting(true);
        setQuizError('');


        const token =
          sessionStorage.getItem(
            'access_token'
          );


        if (!token) {

          setQuizError(
            'Please log in again to submit the quiz.'
          );

          return;

        }


        // ---------------------------------------------------
        // SUBMIT QUIZ
        // ---------------------------------------------------

        const response =
          await fetch(
            `http://127.0.0.1:8000/api/training/quizzes/${quiz.id}/submit/`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                answers:
                  selectedAnswers,
              }),
            }
          );

        const data =
          await response.json();

        // ---------------------------------------------------
        // ERROR
        // ---------------------------------------------------

        if (!response.ok) {
          setQuizError(
            data.detail ||
              'Failed to submit quiz.'
          );
          return;
        }


        // ---------------------------------------------------
        // SAVE QUIZ RESULT
        // ---------------------------------------------------

        setScore(
          data.score
        );

        setCorrectAnswers(
          data.correct_answers
        );

        setPassed(
          data.passed
        );

        setAttemptsRemaining(
          data.attempts_remaining
        );

        setBadgeEarned(
          data.badge_earned
        );

        setQuizCompleted(
          true
        );


        // ---------------------------------------------------
        // CHECK FOR 10TH BADGE
        // ---------------------------------------------------
        //
        // Only show the BIG congratulations popup when
        // this newly-earned badge brings the user's total
        // training badges to 10.
        //
        // ---------------------------------------------------

        if (
          data.passed &&
          data.badge_earned
        ) {

          try {
            const profileResponse =
              await fetch(
                'http://127.0.0.1:8000/api/profile/',
                {
                  method: 'GET',

                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

            if (
              profileResponse.ok
            ) {

              const profileData =
                await profileResponse.json();

              const totalBadges =
                Array.isArray(
                  profileData.badges
                )
                  ? profileData.badges.length
                  : 0;

              // ONLY 10TH BADGE
              if (
                totalBadges >= 10
              ) {
                setShowBadgePopup(
                  true
                );
              }
            }
          } catch (profileError) {

            console.error(
              'Failed to check total training badges:',
              profileError
            );
          }
        }

        toast.success(
          `Quiz completed! Score: ${data.score}%`
        );
      } catch (error) {

        console.error(
          'Quiz submission error:',
          error
        );

        setQuizError(
          'Unable to submit quiz. Please try again.'
        );

      } finally {
        setSubmitting(false);
      }
    };


  // =========================================================
  // PRINT GUIDE
  // =========================================================

  const handlePrintGuide = () => {

    window.print();

  };


  // =========================================================
  // RENDER TRAINING CONTENT
  // =========================================================

  const renderContent = (
    content: string
  ) => {

    return content
      .trim()
      .split('\n')
      .map(
        (
          line,
          index
        ) => {

          const trimmed =
            line.trim();


          // Empty line
          if (!trimmed) {

            return (
              <div
                key={index}
                className="h-3"
              />
            );

          }


          // H3
          if (
            trimmed.startsWith(
              '### '
            )
          ) {

            return (

              <h3
                key={index}
                className="
                  text-xl
                  font-bold
                  text-white
                  mt-6
                  mb-3
                "
              >
                {
                  trimmed.replace(
                    '### ',
                    ''
                  )
                }
              </h3>

            );

          }


          // H2
          if (
            trimmed.startsWith(
              '## '
            )
          ) {

            return (

              <h2
                key={index}
                className="
                  text-2xl
                  font-bold
                  text-white
                  mt-8
                  mb-4
                "
              >
                {
                  trimmed.replace(
                    '## ',
                    ''
                  )
                }
              </h2>

            );

          }


          // H1
          if (
            trimmed.startsWith(
              '# '
            )
          ) {

            return (

              <h1
                key={index}
                className="
                  text-3xl
                  font-bold
                  text-white
                  mt-4
                  mb-5
                "
              >
                {
                  trimmed.replace(
                    '# ',
                    ''
                  )
                }
              </h1>

            );

          }


          // BULLET
          if (
            trimmed.startsWith(
              '- '
            )
          ) {

            return (

              <li
                key={index}
                className="
                  text-gray-300
                  ml-6
                  mb-2
                  list-disc
                "
              >
                {
                  trimmed.replace(
                    '- ',
                    ''
                  )
                }
              </li>

            );

          }


          // NORMAL TEXT
          return (

            <p
              key={index}
              className="
                text-gray-300
                leading-7
                mb-3
              "
            >
              {trimmed}
            </p>

          );

        }
      );

  };


  // =========================================================
  // QUIZ SCREEN
  // =========================================================

  if (
    quizStarted &&
    !quizCompleted
  ) {

    const question =
      questions[
        currentQuestion
      ];


    return (

      <div
        className="
          min-h-screen
          p-8
        "
      >

        <div
          className="
            max-w-4xl
            mx-auto
            space-y-6
          "
        >

          {/* BACK */}

          <Button
            variant="ghost"
            onClick={() =>
              setQuizStarted(false)
            }
            className="
              text-gray-300
              hover:text-white
            "
          >

            <ArrowLeft
              className="
                w-4
                h-4
                mr-2
              "
            />

            Back to Training

          </Button>


          {/* QUIZ CARD */}

          <Card
            className="
              bg-black/40
              backdrop-blur-xl
              border-white/10
            "
          >

            <CardContent
              className="
                p-8
              "
            >

              {/* HEADER */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  mb-8
                "
              >

                <div>

                  <p
                    className="
                      text-gray-400
                      text-sm
                    "
                  >
                    Question{' '}
                    {currentQuestion + 1}
                    {' '}
                    of{' '}
                    {questions.length}
                  </p>


                  <h1
                    className="
                      text-3xl
                      font-bold
                      text-white
                      mt-2
                    "
                  >
                    {quiz.title}
                  </h1>

                </div>


                <Badge
                  className="
                    bg-purple-600/20
                    text-purple-300
                  "
                >

                  {Math.round(
                    (
                      (
                        currentQuestion +
                        1
                      ) /
                      questions.length
                    ) *
                    100
                  )}
                  %

                </Badge>

              </div>


              {/* PROGRESS */}

              <div
                className="
                  w-full
                  bg-white/10
                  rounded-full
                  h-2
                  mb-8
                "
              >

                <div
                  className="
                    bg-gradient-to-r
                    from-purple-600
                    to-cyan-600
                    h-2
                    rounded-full
                    transition-all
                  "
                  style={{
                    width:
                      `${(
                        (
                          currentQuestion +
                          1
                        ) /
                        questions.length
                      ) * 100}%`,
                  }}
                />

              </div>


              {/* QUESTION */}

              <h2
                className="
                  text-xl
                  font-semibold
                  text-white
                  mb-6
                "
              >
                {question.question}
              </h2>


              {/* ANSWERS */}

              <div
                className="
                  space-y-3
                "
              >

                {question.options.map(
                  (
                    option,
                    index
                  ) => {

                    const selected =
                      selectedAnswers[
                        currentQuestion
                      ] === index;


                    return (

                      <button
                        key={index}
                        type="button"
                        onClick={() =>
                          handleAnswer(
                            index
                          )
                        }
                        className={`
                          w-full
                          text-left
                          p-4
                          rounded-lg
                          border
                          transition-all
                          ${
                            selected
                              ? `
                                border-purple-500
                                bg-purple-600/20
                                text-white
                              `
                              : `
                                border-white/10
                                bg-white/5
                                text-gray-300
                                hover:bg-white/10
                              `
                          }
                        `}
                      >

                        <span
                          className="
                            font-medium
                            mr-3
                          "
                        >
                          {String.fromCharCode(
                            65 + index
                          )}
                          .
                        </span>

                        {option}

                      </button>

                    );

                  }
                )}

              </div>


              {/* NAVIGATION */}

              <div
                className="
                  flex
                  justify-between
                  mt-8
                "
              >

                <Button
                  variant="outline"
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    currentQuestion ===
                    0
                  }
                  className="
                    border-white/20
                    text-gray-300
                  "
                >
                  Previous
                </Button>


                <Button
                  onClick={
                    handleNext
                  }
                  disabled={
                    submitting
                  }
                  className="
                    bg-gradient-to-r
                    from-purple-600
                    to-cyan-600
                  "
                >

                  {currentQuestion ===
                  questions.length - 1
                    ? submitting
                      ? 'Submitting...'
                      : 'Finish Quiz'
                    : 'Next'}

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

    );

  }


  // =========================================================
  // QUIZ RESULT SCREEN
  // =========================================================

  if (quizCompleted) {

    return (

      <div
        className="
          min-h-screen
          p-8
        "
      >

        <div
          className="
            max-w-3xl
            mx-auto
          "
        >

          <Card
            className="
              bg-black/40
              backdrop-blur-xl
              border-white/10
            "
          >

            <CardContent
              className="
                p-10
                text-center
              "
            >

              {/* PASS / FAIL ICON */}

              {passed ? (

                <CheckCircle
                  className="
                    w-20
                    h-20
                    text-green-400
                    mx-auto
                    mb-6
                  "
                />

              ) : (

                <XCircle
                  className="
                    w-20
                    h-20
                    text-red-400
                    mx-auto
                    mb-6
                  "
                />

              )}


              {/* TITLE */}

              <h1
                className="
                  text-4xl
                  font-bold
                  text-white
                  mb-4
                "
              >
                Quiz Completed!
              </h1>


              {/* SCORE */}

              <p
                className="
                  text-gray-300
                  text-lg
                  mb-2
                "
              >
                Your score
              </p>


              <p
                className="
                  text-gray-300
                  text-lg
                  mb-2
                "
              >
                {correctAnswers}
                {' '}
                /
                {' '}
                {questions.length}
                {' '}
                correct
              </p>


              {/* PASS STATUS */}

              <p
                className={`
                  text-lg
                  font-semibold
                  mb-4
                  ${
                    passed
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                `}
              >
                {
                  passed
                    ? 'Quiz Passed!'
                    : 'Quiz Failed'
                }
              </p>


              {/* ATTEMPTS */}

              <p
                className="
                  text-gray-400
                  mb-6
                "
              >
                Attempts remaining:
                {' '}
                {attemptsRemaining}
              </p>


              {/* BADGE EARNED */}

              {passed &&
                badgeEarned && (

                  <div
                    className="
                      mb-6
                      p-4
                      rounded-lg
                      bg-amber-900/30
                      border
                      border-amber-500/30
                    "
                  >

                    <p
                      className="
                        text-amber-400
                        font-semibold
                      "
                    >
                      🏆 Training Badge Earned!
                    </p>


                    <p
                      className="
                        text-gray-300
                        text-sm
                        mt-1
                      "
                    >
                      You successfully completed
                      this training.
                    </p>

                  </div>

                )}


              {/* QUIZ ERROR */}

              {quizError && (

                <div
                  className="
                    mb-6
                    p-4
                    rounded-lg
                    bg-red-900/30
                    border
                    border-red-500/30
                  "
                >

                  <p
                    className="
                      text-red-400
                      text-sm
                    "
                  >
                    {quizError}
                  </p>

                </div>

              )}


              {/* RESULT BUTTONS */}

              <div
                className="
                  flex
                  gap-4
                  justify-center
                "
              >

                <Button
                  onClick={() => {

                    setQuizCompleted(
                      false
                    );

                    setQuizStarted(
                      false
                    );

                    setCurrentQuestion(
                      0
                    );

                    setSelectedAnswers(
                      []
                    );

                    setQuizError('');

                    setShowBadgePopup(
                      false
                    );

                  }}
                  variant="outline"
                  className="
                    border-white/20
                    text-gray-300
                  "
                >
                  Back to Training
                </Button>


                {!passed &&
                  attemptsRemaining >
                    0 && (

                    <Button
                      onClick={() => {

                        setQuizCompleted(
                          false
                        );

                        setQuizStarted(
                          true
                        );

                        setCurrentQuestion(
                          0
                        );

                        setSelectedAnswers(
                          []
                        );

                        setQuizError('');

                        setShowBadgePopup(
                          false
                        );

                      }}
                      className="
                        bg-gradient-to-r
                        from-purple-600
                        to-cyan-600
                      "
                    >
                      Try Again
                    </Button>

                  )}

              </div>


            </CardContent>

          </Card>


          {/* =================================================
              10TH BADGE CONGRATULATIONS POPUP
              ================================================= */}

          {showBadgePopup &&
            badgeEarned && (

              <div
                className="
                  fixed
                  inset-0
                  z-[100]
                  flex
                  items-center
                  justify-center
                  bg-black/80
                  backdrop-blur-sm
                  p-4
                "
              >

                <Card
                  className="
                    w-full
                    max-w-lg
                    bg-gradient-to-br
                    from-slate-900
                    via-purple-950
                    to-indigo-950
                    border-cyan-400/30
                    shadow-2xl
                    shadow-purple-900/40
                  "
                >

                  <CardContent
                    className="
                      p-8
                      text-center
                    "
                  >

                    {/* BADGE ICON */}

                    <div
                      className="
                        flex
                        justify-center
                        mb-5
                      "
                    >

                      <div
                        className="
                          w-20
                          h-20
                          rounded-full
                          flex
                          items-center
                          justify-center
                          bg-emerald-500/10
                          border
                          border-emerald-400/30
                        "
                      >

                        <Award
                          className="
                            w-12
                            h-12
                            text-emerald-400
                          "
                        />

                      </div>

                    </div>


                    {/* CONGRATULATIONS */}

                    <h2
                      className="
                        text-3xl
                        font-bold
                        text-emerald-400
                        mb-3
                      "
                    >
                      Congratulations! 🎉
                    </h2>


                    <p
                      className="
                        text-gray-200
                        text-lg
                        mb-2
                      "
                    >
                      You have completed all
                      {' '}
                      10
                      {' '}
                      training badges.
                    </p>


                    <p
                      className="
                        text-cyan-400
                        text-sm
                        mb-7
                      "
                    >
                      You are now eligible for
                      a veterinary appointment
                      opportunity.
                    </p>


                    {/* APPOINTMENT BUTTON */}

                    <Button
                    onClick={() => navigate('/user/vet-clinic?reward=training')}
                      className="
                        w-full
                        bg-cyan-500
                        hover:bg-cyan-400
                        text-black
                        font-semibold
                        text-base
                        py-6
                      "
                    >
                      Redeem Free Veterinary Appointment
                    </Button>


                    {/* CLOSE */}

                    <button
                      type="button"
                      onClick={() =>
                        setShowBadgePopup(
                          false
                        )
                      }
                      className="
                        mt-4
                        text-sm
                        text-gray-400
                        hover:text-white
                        transition-colors
                      "
                    >
                      Maybe later
                    </button>

                  </CardContent>

                </Card>

              </div>

            )}

        </div>

      </div>

    );

  }


  // =========================================================
  // TRAINING CONTENT SCREEN
  // =========================================================

  return (

    <>

      <style>{`

        @media print {

          body {
            background: white !important;
          }

          nav,
          aside,
          button,
          iframe,
          video,
          .no-print {
            display: none !important;
          }

          * {
            color: black !important;
            background: white !important;
            border-color: #ddd !important;
          }

          .print-guide {
            display: block !important;
          }

        }

      `}</style>


      <div
        className="
          min-h-screen
          p-8
        "
      >

        <div
          className="
            max-w-6xl
            mx-auto
            space-y-8
          "
        >

          {/* BACK */}

          <Button
            variant="ghost"
            onClick={() =>
              navigate('/user/training')
            }
            className="
              text-gray-300
              hover:text-white
            "
          >

            <ArrowLeft
              className="
                w-4
                h-4
                mr-2
              "
            />

            Back to Training

          </Button>


          {/* =================================================
              HERO
              ================================================= */}

          <Card
            className="
              bg-black/40
              backdrop-blur-xl
              border-white/10
              overflow-hidden
            "
          >

            <div
              className="
                h-72
                overflow-hidden
              "
            >

              <img
                src={topic.image_file || topic.image}
                alt={topic.title}
                className="
                  w-full
                  h-full
                  object-cover
                "
              />

            </div>


            <CardContent
              className="
                p-8
              "
            >

              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                  mb-4
                "
              >

                <Badge
                  className="
                    bg-purple-600/20
                    text-purple-300
                  "
                >
                  {topic.category}
                </Badge>


                <Badge
                  className="
                    bg-cyan-600/20
                    text-cyan-300
                  "
                >
                  {topic.difficulty}
                </Badge>


                <Badge
                  className="
                    bg-white/10
                    text-gray-300
                  "
                >

                  <Clock
                    className="
                      w-4
                      h-4
                      mr-1
                    "
                  />

                  {topic.duration}

                </Badge>

              </div>


              <h1
                className="
                  text-4xl
                  font-bold
                  text-white
                  mb-4
                "
              >
                {topic.title}
              </h1>


              <p
                className="
                  text-gray-300
                  text-lg
                "
              >
                {topic.description}
              </p>

            </CardContent>

          </Card>


          {/* =================================================
              VIDEO
              ================================================= */}

          {(topic.video || topic.video_url) && (

            <Card
              className="
                bg-black/40
                backdrop-blur-xl
                border-white/10
              "
            >

              <CardContent
                className="
                  p-6
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                    mb-4
                  "
                >

                  <Play
                    className="
                      w-5
                      h-5
                      text-purple-400
                    "
                  />


                  <h2
                    className="
                      text-2xl
                      font-bold
                      text-white
                    "
                  >
                    Training Video
                  </h2>

                </div>


                <div
                  className="
                    aspect-video
                    rounded-lg
                    overflow-hidden
                  "
                >

                  {topic.video ? (
                    <video
                      src={topic.video}
                      controls
                      className="
                        w-full
                        h-full
                        bg-black
                      "
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    <iframe
                      src={topic.video_url}
                      title={topic.title}
                      className="
                        w-full
                        h-full
                      "
                      allowFullScreen
                    />
                  )}

                </div>

              </CardContent>

            </Card>

          )}


          {/* =================================================
              CONTENT
              ================================================= */}

          <Card
            className="
              print-guide
              bg-black/40
              backdrop-blur-xl
              border-white/10
            "
          >

            <CardContent
              className="
                p-8
              "
            >

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-4
                  mb-6
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >

                  <BookOpen
                    className="
                      w-6
                      h-6
                      text-cyan-400
                    "
                  />


                  <h2
                    className="
                      text-2xl
                      font-bold
                      text-white
                    "
                  >
                    Training Guide
                  </h2>

                </div>


                <Button
                  onClick={
                    handlePrintGuide
                  }
                  variant="outline"
                  className="
                    border-white/20
                    text-gray-300
                    hover:text-white
                  "
                >

                  <Printer
                    className="
                      w-4
                      h-4
                      mr-2
                    "
                  />

                  Print / Save Guide

                </Button>

              </div>


              <div>
                {renderContent(
                  topic.content
                )}
              </div>

            </CardContent>

          </Card>


          {/* =================================================
              QUIZ CTA
              ================================================= */}

          {quiz &&
            questions.length >
              0 && (

              <Card
                className="
                  bg-gradient-to-r
                  from-purple-600/20
                  to-cyan-600/20
                  border-purple-500/20
                "
              >

                <CardContent
                  className="
                    p-8
                  "
                >

                  <div
                    className="
                      text-center
                    "
                  >

                    <BookOpen
                      className="
                        w-12
                        h-12
                        text-purple-400
                        mx-auto
                        mb-4
                      "
                    />


                    <h2
                      className="
                        text-2xl
                        font-bold
                        text-white
                        mb-2
                      "
                    >
                      Ready to Test Your Knowledge?
                    </h2>


                    <p
                      className="
                        text-gray-300
                        mb-6
                      "
                    >
                      Complete the{' '}
                      {quiz.title}{' '}
                      and test what you have learned.
                    </p>

                  </div>


                  {/* QUIZ RULES */}

                  <div
                    className="
                      max-w-2xl
                      mx-auto
                      mb-6
                      p-5
                      rounded-lg
                      bg-black/30
                      border
                      border-white/10
                    "
                  >

                    <h3
                      className="
                        text-lg
                        font-semibold
                        text-white
                        mb-4
                        text-center
                      "
                    >
                      Quiz Rules
                    </h3>


                    <div
                      className="
                        grid
                        grid-cols-1
                        md:grid-cols-2
                        gap-y-4
                        gap-x-8
                        max-w-3xl
                        mx-auto
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >

                        <span
                          className="
                            w-8
                            text-center
                            text-lg
                          "
                        >
                          📝
                        </span>

                        <span
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          10 Questions
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >

                        <span
                          className="
                            w-8
                            text-center
                            text-lg
                          "
                        >
                          🎯
                        </span>

                        <span
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          Pass Mark: 80% (8/10)
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >

                        <span
                          className="
                            w-8
                            text-center
                            text-lg
                          "
                        >
                          ❌
                        </span>

                        <span
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          Maximum 2 Wrong Answers
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >

                        <span
                          className="
                            w-8
                            text-center
                            text-lg
                          "
                        >
                          🔄
                        </span>

                        <span
                          className="
                            font-semibold
                            text-white
                          "
                        >
                          Maximum 2 Attempts
                        </span>

                      </div>


                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          text-gray-300
                          md:col-span-2
                          justify-center
                        "
                      >

                        <span>
                          🏆
                        </span>

                        <span>

                          <strong
                            className="
                              text-amber-400
                            "
                          >
                            Pass the quiz to earn a Training Badge
                          </strong>

                        </span>

                      </div>

                    </div>

                  </div>


                  {/* START QUIZ */}

                  <div
                    className="
                      text-center
                    "
                  >

                    <Button
                      onClick={
                        handleStartQuiz
                      }
                      className="
                        bg-gradient-to-r
                        from-purple-600
                        to-cyan-600
                      "
                    >
                      Start Quiz
                    </Button>

                  </div>

                </CardContent>

              </Card>

            )}

        </div>

      </div>

    </>

  );

}