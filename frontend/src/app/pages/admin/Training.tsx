import { useEffect, useState } from 'react';
import AdminManagement from './AdminManagement';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';

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

interface TrainingForm {
  title: string;
  category: string;
  duration: string;
  difficulty: string;
  description: string;
  content: string;
  image: string;
  image_file: File | null;
  current_image_file: string;
  video_url: string;
  video: File | null;
  current_video: string;
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

const emptyForm: TrainingForm = {
  title: '',
  category: '',
  duration: '',
  difficulty: 'Beginner',
  description: '',
  content: '',
  image: '',
  image_file: null,
  current_image_file: '',
  video_url: '',
  video: null,
  current_video: '',
};

export default function Training() {
  const [trainingTopics, setTrainingTopics] = useState<TrainingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [quizDialogOpen, setQuizDialogOpen] = useState(false);
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

    const [quizForm, setQuizForm] = useState({
    training: '',
    title: '',
    });

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

    const [questionForm, setQuestionForm] = useState({
    quiz: '',
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_answer: '0',
    });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<TrainingForm>(emptyForm);

  const getToken = () => {
    return sessionStorage.getItem('access_token');
  };

  const fetchTraining = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        'http://127.0.0.1:8000/api/training/'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch training topics');
      }

      const data = await response.json();
      setTrainingTopics(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load training topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/training/quizzes/'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch quizzes');
    }

    const data = await response.json();
    setQuizzes(data);
  } catch (error) {
    console.error(error);
    toast.error('Failed to load quizzes');
  }
};

const fetchQuestions = async () => {
  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/training/questions/'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }

    const data = await response.json();
    setQuestions(data);
  } catch (error) {
    console.error(error);
    toast.error('Failed to load questions');
  }
};

    useEffect(() => {
    fetchTraining();
    fetchQuizzes();
    fetchQuestions();
    }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditForm = (id: string) => {
    const topic = trainingTopics.find(
      (item) => item.id === Number(id)
    );

    if (!topic) {
      toast.error('Training topic not found');
      return;
    }

    setEditingId(topic.id);

    setForm({
      title: topic.title || '',
      category: topic.category || '',
      duration: topic.duration || '',
      difficulty: topic.difficulty || 'Beginner',
      description: topic.description || '',
      content: topic.content || '',
      image: topic.image || '',
      image_file: null,
      current_image_file: topic.image_file || '',
      video_url: topic.video_url || '',
      video: null,
      current_video: topic.video || '',
    });

    setDialogOpen(true);
  };

  const handleChange = (
    field: keyof TrainingForm,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveTraining = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a training title');
      return;
    }

    if (!form.category.trim()) {
      toast.error('Please enter a category');
      return;
    }

    if (!form.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error('Please login again');
      return;
    }

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `http://127.0.0.1:8000/api/training/${editingId}/`
        : 'http://127.0.0.1:8000/api/training/';

      const formData = new FormData();

      formData.append('title', form.title.trim());
      formData.append('category', form.category.trim());
      formData.append('duration', form.duration.trim());
      formData.append('difficulty', form.difficulty);
      formData.append('description', form.description.trim());
      formData.append('content', form.content);

      if (form.image_file) {
        formData.append('image_file', form.image_file);
      }

      if (form.video) {
        formData.append('video', form.video);
      }

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        console.error('Save training error:', errorData);

        throw new Error(
          errorData?.detail || 'Failed to save training'
        );
      }

      toast.success(
        isEditing
          ? 'Training updated successfully!'
          : 'Training added successfully!'
      );

      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchTraining();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to save training');
    }
  };

  const deleteTraining = async (id: string) => {
    const token = getToken();

    if (!token) {
      toast.error('Please login again');
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/training/${id}/`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete training');
      }

      toast.success('Training deleted successfully!');

      await fetchTraining();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete training');
    }
  };

  const openAddQuiz = () => {
  setEditingQuizId(null);
  setQuizForm({
    training: trainingTopics[0]?.id.toString() || '',
    title: '',
  });
  setQuizDialogOpen(true);
};

const openEditQuiz = (id: number) => {
  const quiz = quizzes.find((item) => item.id === id);

  if (!quiz) {
    toast.error('Quiz not found');
    return;
  }

  setEditingQuizId(quiz.id);

  setQuizForm({
    training: quiz.training.toString(),
    title: quiz.title,
  });

  setQuizDialogOpen(true);
};

const saveQuiz = async () => {
  if (!quizForm.training) {
    toast.error('Please select a training topic');
    return;
  }

  if (!quizForm.title.trim()) {
    toast.error('Please enter a quiz title');
    return;
  }

  const token = getToken();

  if (!token) {
    toast.error('Please login again');
    return;
  }

  try {
    const isEditing = editingQuizId !== null;

    const url = isEditing
      ? `http://127.0.0.1:8000/api/training/quizzes/${editingQuizId}/`
      : 'http://127.0.0.1:8000/api/training/quizzes/';

    const formData = new FormData();

    formData.append('title', form.title.trim());
    formData.append('category', form.category.trim());
    formData.append('duration', form.duration.trim());
    formData.append('difficulty', form.difficulty);
    formData.append('description', form.description.trim());
    formData.append('content', form.content);

    if (form.image_file) {
      formData.append('image_file', form.image_file);
    }

    if (form.video) {
      formData.append('video', form.video);
    }

    const response = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Save quiz error:', errorData);

      throw new Error(
        errorData?.detail || 'Failed to save quiz'
      );
    }

    toast.success(
      isEditing
        ? 'Quiz updated successfully!'
        : 'Quiz added successfully!'
    );

    setQuizDialogOpen(false);
    setEditingQuizId(null);

    await fetchQuizzes();
  } catch (error: any) {
    console.error(error);
    toast.error(error.message || 'Failed to save quiz');
  }
};

const deleteQuiz = async (id: number) => {
  const token = getToken();

  if (!token) {
    toast.error('Please login again');
    return;
  }

  if (!confirm('Are you sure you want to delete this quiz?')) {
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/training/quizzes/${id}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete quiz');
    }

    toast.success('Quiz deleted successfully!');

    await fetchQuizzes();
  } catch (error) {
    console.error(error);
    toast.error('Failed to delete quiz');
  }
};

const openAddQuestion = () => {
  setEditingQuestionId(null);

  setQuestionForm({
    quiz: quizzes[0]?.id.toString() || '',
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_answer: '0',
  });

  setQuestionDialogOpen(true);
};

const openEditQuestion = (id: number) => {
  const item = questions.find(
    (question) => question.id === id
  );

  if (!item) {
    toast.error('Question not found');
    return;
  }

  setEditingQuestionId(item.id);

  setQuestionForm({
    quiz: item.quiz.toString(),
    question: item.question,
    option1: item.options[0] || '',
    option2: item.options[1] || '',
    option3: item.options[2] || '',
    option4: item.options[3] || '',
    correct_answer: item.correct_answer.toString(),
  });

  setQuestionDialogOpen(true);
};

const saveQuestion = async () => {
  if (!questionForm.quiz) {
    toast.error('Please select a quiz');
    return;
  }

  if (!questionForm.question.trim()) {
    toast.error('Please enter a question');
    return;
  }

  const options = [
    questionForm.option1.trim(),
    questionForm.option2.trim(),
    questionForm.option3.trim(),
    questionForm.option4.trim(),
  ];

  if (options.some((option) => !option)) {
    toast.error('Please enter all 4 options');
    return;
  }

  const token = getToken();

  if (!token) {
    toast.error('Please login again');
    return;
  }

  try {
    const isEditing = editingQuestionId !== null;

    const url = isEditing
      ? `http://127.0.0.1:8000/api/training/questions/${editingQuestionId}/`
      : 'http://127.0.0.1:8000/api/training/questions/';

    const formData = new FormData();

formData.append('title', form.title.trim());
formData.append('category', form.category.trim());
formData.append('duration', form.duration.trim());
formData.append('difficulty', form.difficulty);
formData.append('description', form.description.trim());
formData.append('content', form.content);

if (form.image_file) {
  formData.append('image_file', form.image_file);
}

if (form.video) {
  formData.append('video', form.video);
}

const response = await fetch(url, {
  method: isEditing ? 'PATCH' : 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      console.error('Save question error:', errorData);

      throw new Error(
        errorData?.detail || 'Failed to save question'
      );
    }

    toast.success(
      isEditing
        ? 'Question updated successfully!'
        : 'Question added successfully!'
    );

    setQuestionDialogOpen(false);
    setEditingQuestionId(null);

    await fetchQuestions();
    await fetchQuizzes();
  } catch (error: any) {
    console.error(error);
    toast.error(
      error.message || 'Failed to save question'
    );
  }
};

const deleteQuestion = async (id: number) => {
  const token = getToken();

  if (!token) {
    toast.error('Please login again');
    return;
  }

  if (!confirm('Are you sure you want to delete this question?')) {
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/training/questions/${id}/`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete question');
    }

    toast.success('Question deleted successfully!');

    await fetchQuestions();
    await fetchQuizzes();
  } catch (error) {
    console.error(error);
    toast.error('Failed to delete question');
  }
};

  const tableData = trainingTopics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    category: topic.category,
    difficulty: topic.difficulty,
    duration: topic.duration,
  }));

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-300 text-lg">
          Loading training management...
        </p>
      </div>
    );
  }

  return (
    <>
      <AdminManagement
        title="Training"
        description="Manage Pawtopia training topics and educational content."
        columns={[
          'Title',
          'Category',
          'Difficulty',
          'Duration',
        ]}
        data={tableData}
        onAdd={openAddForm}
        onEdit={openEditForm}
        onDelete={deleteTraining}
      />

      <div className="mt-10">
        <AdminManagement
          title="Quizzes"
          description="Manage quizzes for Pawtopia training topics."
          columns={[
            'Title',
            'Training',
            'Questions',
          ]}
          data={quizzes.map((quiz) => ({
            id: quiz.id,
            title: quiz.title,
            training:
              trainingTopics.find(
                (topic) => topic.id === quiz.training
              )?.title || `Training #${quiz.training}`,
            questions: quiz.questions?.length || 0,
          }))}
          onAdd={openAddQuiz}
          onEdit={(id) => openEditQuiz(Number(id))}
          onDelete={(id) => deleteQuiz(Number(id))}
        />
      </div>

      <div className="mt-10">
        <AdminManagement
            title="Questions"
            description="Manage quiz questions and answer choices."
            columns={[
            'Question',
            'Quiz',
            'Correct Answer',
            ]}
            data={questions.map((item) => ({
            id: item.id,
            question: item.question,
            quiz:
                quizzes.find(
                (quiz) => quiz.id === item.quiz
                )?.title || `Quiz #${item.quiz}`,
            correct_answer:
                item.options[item.correct_answer] || '-',
            }))}
            onAdd={openAddQuestion}
            onEdit={(id) =>
            openEditQuestion(Number(id))
            }
            onDelete={(id) =>
            deleteQuestion(Number(id))
            }
        />
        </div>

        <Dialog
            open={questionDialogOpen}
            onOpenChange={setQuestionDialogOpen}
            >
            <DialogContent className="bg-gray-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">

                <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                    {editingQuestionId !== null
                    ? 'Edit Question'
                    : 'Add Question'}
                </DialogTitle>

                <DialogDescription className="text-gray-400">
                    {editingQuestionId !== null
                    ? 'Update this quiz question.'
                    : 'Create a new quiz question.'}
                </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 mt-4">

                <div>
                    <Label className="text-gray-300">
                    Quiz
                    </Label>

                    <select
                    value={questionForm.quiz}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        quiz: e.target.value,
                        })
                    }
                    className="mt-2 w-full rounded-md bg-white/10 border border-white/20 text-white p-2"
                    >
                    <option value="" className="bg-gray-900">
                        Select quiz
                    </option>

                    {quizzes.map((quiz) => (
                        <option
                        key={quiz.id}
                        value={quiz.id}
                        className="bg-gray-900"
                        >
                        {quiz.title}
                        </option>
                    ))}
                    </select>
                </div>

                <div>
                    <Label className="text-gray-300">
                    Question
                    </Label>

                    <Textarea
                    value={questionForm.question}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        question: e.target.value,
                        })
                    }
                    placeholder="Enter the question..."
                    className="mt-2 min-h-[100px] bg-white/10 border-white/20 text-white"
                    />
                </div>

                <div className="space-y-4">
                    <Label className="text-gray-300">
                    Answer Options
                    </Label>

                    <Input
                    value={questionForm.option1}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        option1: e.target.value,
                        })
                    }
                    placeholder="Option 1"
                    className="bg-white/10 border-white/20 text-white"
                    />

                    <Input
                    value={questionForm.option2}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        option2: e.target.value,
                        })
                    }
                    placeholder="Option 2"
                    className="bg-white/10 border-white/20 text-white"
                    />

                    <Input
                    value={questionForm.option3}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        option3: e.target.value,
                        })
                    }
                    placeholder="Option 3"
                    className="bg-white/10 border-white/20 text-white"
                    />

                    <Input
                    value={questionForm.option4}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        option4: e.target.value,
                        })
                    }
                    placeholder="Option 4"
                    className="bg-white/10 border-white/20 text-white"
                    />
                </div>

                <div>
                    <Label className="text-gray-300">
                    Correct Answer
                    </Label>

                    <select
                    value={questionForm.correct_answer}
                    onChange={(e) =>
                        setQuestionForm({
                        ...questionForm,
                        correct_answer: e.target.value,
                        })
                    }
                    className="mt-2 w-full rounded-md bg-white/10 border border-white/20 text-white p-2"
                    >
                    <option value="0" className="bg-gray-900">
                        Option 1
                    </option>
                    <option value="1" className="bg-gray-900">
                        Option 2
                    </option>
                    <option value="2" className="bg-gray-900">
                        Option 3
                    </option>
                    <option value="3" className="bg-gray-900">
                        Option 4
                    </option>
                    </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">

                    <Button
                    variant="outline"
                    onClick={() =>
                        setQuestionDialogOpen(false)
                    }
                    className="border-white/20 text-gray-300"
                    >
                    Cancel
                    </Button>

                    <Button
                    onClick={saveQuestion}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600"
                    >
                    {editingQuestionId !== null
                        ? 'Save Changes'
                        : 'Add Question'}
                    </Button>

                </div>

                </div>
            </DialogContent>
            </Dialog>

            <Dialog
        open={quizDialogOpen}
        onOpenChange={setQuizDialogOpen}
      >
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-2xl">

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingQuizId !== null
                ? 'Edit Quiz'
                : 'Add Quiz'}
            </DialogTitle>

            <DialogDescription className="text-gray-400">
              {editingQuizId !== null
                ? 'Update this quiz.'
                : 'Create a new quiz for a training topic.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-4">

            <div>
              <Label className="text-gray-300">
                Training Topic
              </Label>

              <select
                value={quizForm.training}
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    training: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-md bg-white/10 border border-white/20 text-white p-2"
              >
                <option value="" className="bg-gray-900">
                  Select training topic
                </option>

                {trainingTopics.map((topic) => (
                  <option
                    key={topic.id}
                    value={topic.id}
                    className="bg-gray-900"
                  >
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-gray-300">
                Quiz Title
              </Label>

              <Input
                value={quizForm.title}
                onChange={(e) =>
                  setQuizForm({
                    ...quizForm,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Basic Dog Training Quiz"
                className="mt-2 bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button
                variant="outline"
                onClick={() => setQuizDialogOpen(false)}
                className="border-white/20 text-gray-300"
              >
                Cancel
              </Button>

              <Button
                onClick={saveQuiz}
                className="bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                {editingQuizId !== null
                  ? 'Save Changes'
                  : 'Add Quiz'}
              </Button>

            </div>

          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <DialogContent className="bg-gray-950 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              {editingId !== null
                ? 'Edit Training'
                : 'Add Training'}
            </DialogTitle>

            <DialogDescription className="text-gray-400">
              {editingId !== null
                ? 'Update this training topic.'
                : 'Create a new training topic.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Basic Information
              </h3>

              <div>
                <Label className="text-gray-300">
                  Title
                </Label>

                <Input
                  value={form.title}
                  onChange={(e) =>
                    handleChange('title', e.target.value)
                  }
                  placeholder="e.g. Basic Dog Training"
                  className="mt-2 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <Label className="text-gray-300">
                    Category
                  </Label>

                  <Input
                    value={form.category}
                    onChange={(e) =>
                      handleChange('category', e.target.value)
                    }
                    placeholder="e.g. Dog Training"
                    className="mt-2 bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">
                    Difficulty
                  </Label>

                  <Input
                    value={form.difficulty}
                    onChange={(e) =>
                      handleChange('difficulty', e.target.value)
                    }
                    placeholder="Beginner"
                    className="mt-2 bg-white/10 border-white/20 text-white"
                  />
                </div>

              </div>

              <div>
                <Label className="text-gray-300">
                  Duration
                </Label>

                <Input
                  value={form.duration}
                  onChange={(e) =>
                    handleChange('duration', e.target.value)
                  }
                  placeholder="e.g. 30 minutes"
                  className="mt-2 bg-white/10 border-white/20 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">
                  Description
                </Label>

                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    handleChange('description', e.target.value)
                  }
                  placeholder="Short description of the training..."
                  className="mt-2 min-h-[100px] bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Training Content
              </h3>

              <Textarea
                value={form.content}
                onChange={(e) =>
                  handleChange('content', e.target.value)
                }
                placeholder="Enter the complete training content..."
                className="min-h-[300px] bg-white/10 border-white/20 text-white font-mono"
              />
            </div>

            {/* Media */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">
                Media
              </h3>

              {/* Training Image */}
              <div>
                <Label className="text-gray-300">
                  Training Image
                </Label>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;

                    setForm((previous) => ({
                      ...previous,
                      image_file: file,
                    }));
                  }}
                  className="mt-2 bg-white/10 border-white/20 text-white"
                />

                {form.image_file ? (
                  <img
                    src={URL.createObjectURL(form.image_file)}
                    alt="Selected training preview"
                    className="mt-3 w-full max-h-48 object-cover rounded-lg"
                  />
                ) : form.current_image_file ? (
                  <img
                    src={form.current_image_file}
                    alt="Current training"
                    className="mt-3 w-full max-h-48 object-cover rounded-lg"
                  />
                ) : form.image ? (
                  <img
                    src={form.image}
                    alt="Current training"
                    className="mt-3 w-full max-h-48 object-cover rounded-lg"
                  />
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    No image uploaded.
                  </p>
                )}
              </div>

              {/* Training Video */}
              <div>
                <Label className="text-gray-300">
                  Training Video
                </Label>

                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;

                    setForm((previous) => ({
                      ...previous,
                      video: file,
                    }));
                  }}
                  className="mt-2 bg-white/10 border-white/20 text-white"
                />

                {form.video && (
                  <div className="mt-3">
                    <p className="text-sm text-cyan-300 mb-2">
                      Selected: {form.video.name}
                    </p>

                    <video
                      src={URL.createObjectURL(form.video)}
                      controls
                      className="w-full max-h-64 rounded-lg bg-black"
                    />
                  </div>
                )}

                {!form.video && form.current_video && (
                  <video
                    src={form.current_video}
                    controls
                    className="mt-3 w-full max-h-64 rounded-lg bg-black"
                  />
                )}

                {!form.video &&
                  !form.current_video &&
                  form.video_url && (
                    <p className="mt-2 text-sm text-gray-400">
                      This training currently uses a legacy YouTube video.
                      Upload a video above to replace it.
                    </p>
                  )}

                {!form.video &&
                  !form.current_video &&
                  !form.video_url && (
                    <p className="mt-2 text-sm text-gray-400">
                      No video uploaded.
                    </p>
                  )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4">

              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-white/20 text-gray-300"
              >
                Cancel
              </Button>

              <Button
                onClick={saveTraining}
                className="bg-gradient-to-r from-purple-600 to-cyan-600"
              >
                {editingId !== null
                  ? 'Save Changes'
                  : 'Add Training'}
              </Button>

            </div>

          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}