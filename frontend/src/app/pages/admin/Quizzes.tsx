
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TrainingTopic {
  id: number;
  title: string;
}

interface QuizQuestion {
  id: number;
  quiz: number;
  question: string;
  options: string[];
  correct_answer: number;
}

interface Quiz {
  id: number;
  training: number;
  title: string;
  questions: QuizQuestion[];
}

const API = "http://127.0.0.1:8000/api/training";

const emptyQuestion = {
  question: "",
  options: ["", "", "", ""],
  correct_answer: 0,
};

async function apiRequest(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("access_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : JSON.stringify(error)
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

export default function AdminQuizzes() {
  const [topics, setTopics] = useState<TrainingTopic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [quizFormOpen, setQuizFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [trainingId, setTrainingId] = useState("");

  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({
    ...emptyQuestion,
    options: [...emptyQuestion.options],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicData, quizData] = await Promise.all([
        apiRequest("/"),
        apiRequest("/quizzes/"),
      ]);

      const topicList = Array.isArray(topicData)
        ? topicData
        : topicData.results || [];

      const quizList = Array.isArray(quizData)
        ? quizData
        : quizData.results || [];

      setTopics(topicList);
      setQuizzes(quizList);

      setSelectedQuiz((previous) =>
        quizList.some((q: Quiz) => q.id === previous)
          ? previous
          : quizList[0]?.id ?? null
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load quizzes"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeQuiz = quizzes.find((q) => q.id === selectedQuiz);

  const topicName = (id: number) =>
    topics.find((t) => t.id === id)?.title || `Training #${id}`;

  const openCreateQuiz = () => {
    setEditingQuiz(null);
    setQuizTitle("");
    setTrainingId(topics[0]?.id?.toString() || "");
    setQuizFormOpen(true);
  };

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz.id);
    setQuizTitle(quiz.title);
    setTrainingId(String(quiz.training));
    setQuizFormOpen(true);
  };

  const saveQuiz = async () => {
    if (!quizTitle.trim() || !trainingId) {
      toast.error("Please enter a title and select a training topic.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: quizTitle.trim(),
        training: Number(trainingId),
      };

      const result = await apiRequest(
        editingQuiz ? `/quizzes/${editingQuiz}/` : "/quizzes/",
        {
          method: editingQuiz ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      toast.success(editingQuiz ? "Quiz updated" : "Quiz created");
      setQuizFormOpen(false);
      await loadData();

      if (!editingQuiz && result?.id) {
        setSelectedQuiz(result.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save quiz"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteQuiz = async (quiz: Quiz) => {
    if (
      !window.confirm(
        `Delete "${quiz.title}" and all its questions? Existing attempts may also be deleted.`
      )
    ) return;

    try {
      await apiRequest(`/quizzes/${quiz.id}/`, { method: "DELETE" });
      toast.success("Quiz deleted");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete quiz"
      );
    }
  };

  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      ...emptyQuestion,
      options: [...emptyQuestion.options],
    });
    setQuestionFormOpen(true);
  };

  const openEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question.id);
    setQuestionForm({
      question: question.question,
      options: [...question.options],
      correct_answer: question.correct_answer,
    });
    setQuestionFormOpen(true);
  };

  const saveQuestion = async () => {
    if (!selectedQuiz) return;

    if (
      !questionForm.question.trim() ||
      questionForm.options.length !== 4 ||
      questionForm.options.some((option) => !option.trim())
    ) {
      toast.error("Please enter a question and all four options.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        quiz: selectedQuiz,
        question: questionForm.question.trim(),
        options: questionForm.options.map((option) => option.trim()),
        correct_answer: questionForm.correct_answer,
      };

      await apiRequest(
        editingQuestion
          ? `/questions/${editingQuestion}/`
          : "/questions/",
        {
          method: editingQuestion ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      toast.success(
        editingQuestion ? "Question updated" : "Question added"
      );
      setQuestionFormOpen(false);
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save question"
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (question: QuizQuestion) => {
    if (!window.confirm("Delete this question permanently?")) return;

    try {
      await apiRequest(`/questions/${question.id}/`, {
        method: "DELETE",
      });
      toast.success("Question deleted");
      await loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete question"
      );
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quiz Management</h1>
            <p className="text-gray-300 mt-2">
              Manage training quizzes and questions.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void loadData()}
              className="rounded-lg border border-white/20 px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-300">Loading quizzes...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
              <h2 className="font-semibold text-xl">
                Quizzes ({quizzes.length})
              </h2>

              {quizzes.length === 0 && (
                <p className="text-gray-400">No quizzes found.</p>
              )}

              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className={`rounded-lg border p-3 ${
                    selectedQuiz === quiz.id
                      ? "border-purple-400 bg-purple-500/20"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() => setSelectedQuiz(quiz.id)}
                  >
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {topicName(quiz.training)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {quiz.questions.length} questions
                    </p>
                  </button>

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => openEditQuiz(quiz)}
                      className="text-cyan-300 flex items-center gap-1 text-sm"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-5 space-y-5">
              {activeQuiz ? (
                <>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {activeQuiz.title}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {topicName(activeQuiz.training)}
                      </p>
                    </div>

                    <button
                      onClick={openCreateQuestion}
                      className="bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 flex gap-2 items-center"
                    >
                      <Plus size={16} />
                      Add Question
                    </button>
                  </div>

                  {activeQuiz.questions.length === 0 && (
                    <p className="text-gray-400">
                      No questions yet. Add your first question.
                    </p>
                  )}

                  {activeQuiz.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-white/10 bg-black/20 rounded-xl p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <h3 className="font-medium">
                          {index + 1}. {question.question}
                        </h3>
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => openEditQuestion(question)}
                            aria-label="Edit question"
                            className="text-cyan-300"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => void deleteQuestion(question)}
                            aria-label="Delete question"
                            className="text-red-400"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {question.options.map((option, i) => (
                          <div
                            key={i}
                            className={`rounded-lg px-3 py-2 text-sm ${
                              i === question.correct_answer
                                ? "bg-green-500/15 text-green-300 border border-green-500/30"
                                : "bg-white/5 text-gray-300"
                            }`}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                            {i === question.correct_answer && (
                              <span className="ml-2 text-xs">
                                (Correct)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-gray-400">
                  Select a quiz to manage its questions.
                </p>
              )}
            </div>
          </div>
        )}

        {quizFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-lg space-y-4">
              <h2 className="text-xl font-semibold">
                {editingQuiz ? "Edit Quiz" : "Create Quiz"}
              </h2>

              <div>
                <label className="block mb-2">Quiz Title</label>
                <input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-white/20 rounded-lg p-3"
                />
              </div>

              <div>
                <label className="block mb-2">Training Topic</label>
                <select
                    value={trainingId}
                    disabled
                    className="w-full bg-gray-800 border border-white/20 rounded-lg p-3 disabled:opacity-60"
                    >
                  <option value="">Select training topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setQuizFormOpen(false)}
                  className="px-4 py-2 border border-white/20 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={() => void saveQuiz()}
                  className="px-4 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Quiz"}
                </button>
              </div>
            </div>
          </div>
        )}

        {questionFormOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-white/20 rounded-xl p-6 w-full max-w-xl space-y-4">
              <h2 className="text-xl font-semibold">
                {editingQuestion ? "Edit Question" : "Add Question"}
              </h2>

              <div>
                <label className="block mb-2">Question</label>
                <textarea
                  value={questionForm.question}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      question: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full bg-gray-800 border border-white/20 rounded-lg p-3"
                />
              </div>

              {questionForm.options.map((option, index) => (
                <div key={index}>
                  <label className="block mb-2">
                    Option {String.fromCharCode(65 + index)}
                  </label>
                  <input
                    value={option}
                    onChange={(e) => {
                      const options = [...questionForm.options];
                      options[index] = e.target.value;
                      setQuestionForm({ ...questionForm, options });
                    }}
                    className="w-full bg-gray-800 border border-white/20 rounded-lg p-3"
                  />
                </div>
              ))}

              <div>
                <label className="block mb-2">Correct Answer</label>
                <select
                  value={questionForm.correct_answer}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      correct_answer: Number(e.target.value),
                    })
                  }
                  className="w-full bg-gray-800 border border-white/20 rounded-lg p-3"
                >
                  {questionForm.options.map((_, index) => (
                    <option key={index} value={index}>
                      Option {String.fromCharCode(65 + index)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setQuestionFormOpen(false)}
                  className="px-4 py-2 border border-white/20 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  onClick={() => void saveQuestion()}
                  className="px-4 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Question"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
