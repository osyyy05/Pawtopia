from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import (
    TrainingTopic,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    TrainingBadge,
    TrainingReward,
)
from .serializers import (
    TrainingTopicSerializer,
    QuizSerializer,
    QuizQuestionSerializer,
)


class TrainingListView(generics.ListCreateAPIView):
    queryset = TrainingTopic.objects.all().order_by('id')
    serializer_class = TrainingTopicSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return []


class TrainingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TrainingTopic.objects.all()
    serializer_class = TrainingTopicSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminUser()]
        return []


class QuizListView(generics.ListCreateAPIView):
    queryset = Quiz.objects.all().order_by('id')
    serializer_class = QuizSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return []


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminUser()]
        return []


class QuizQuestionListView(generics.ListCreateAPIView):
    queryset = QuizQuestion.objects.all().order_by('id')
    serializer_class = QuizQuestionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdminUser()]
        return []


class QuizQuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = QuizQuestion.objects.all().order_by('id')
    serializer_class = QuizQuestionSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminUser()]
        return []


class QuizSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk)
        except Quiz.DoesNotExist:
            return Response(
                {'detail': 'Quiz not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get questions in a fixed order
        questions = list(
            quiz.questions.all().order_by('id')
        )

        total_questions = len(questions)

        if total_questions == 0:
            return Response(
                {'detail': 'This quiz has no questions.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Maximum 2 attempts
        previous_attempts = QuizAttempt.objects.filter(
            user=request.user,
            quiz=quiz
        ).count()

        if previous_attempts >= 2:
            return Response(
                {
                    'detail': 'You have already used all 2 attempts for this quiz.',
                    'attempts_remaining': 0,
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Frontend sends:
        # {
        #     "answers": [0, 1, 2, 3, ...]
        # }
        answers = request.data.get('answers')

        if not isinstance(answers, list):
            return Response(
                {'detail': 'Answers must be provided as a list.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(answers) != total_questions:
            return Response(
                {
                    'detail': f'Please answer all {total_questions} questions.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check answers against the database
        correct_answers = 0

        for question, answer in zip(questions, answers):
            try:
                answer_index = int(answer)
            except (TypeError, ValueError):
                answer_index = -1

            if answer_index == question.correct_answer:
                correct_answers += 1

        # Calculate percentage score
        score = round(
            (correct_answers / total_questions) * 100
        )

        # 80% = pass
        passed = score >= 80

        attempt_number = previous_attempts + 1

        # Save the attempt
        attempt = QuizAttempt.objects.create(
            user=request.user,
            quiz=quiz,
            attempt_number=attempt_number,
            score=score,
            correct_answers=correct_answers,
            total_questions=total_questions,
            passed=passed,
            answers=answers,
        )

        badge_earned = False
        reward_unlocked = False
        reward_status = None

        # Award badge if passed
        if passed:
            _, badge_created = TrainingBadge.objects.get_or_create(
                user=request.user,
                training=quiz.training
            )

            badge_earned = badge_created

                # Unlock the one-time veterinary reward
            # after the user earns all 10 training badges.
            badge_count = TrainingBadge.objects.filter(
                user=request.user
            ).count()

            if badge_count >= 10:
                reward, _ = TrainingReward.objects.get_or_create(
                    user=request.user,
                    defaults={
                        'reward_type': 'FREE_VETERINARY_APPOINTMENT',
                        'status': 'AVAILABLE',
                    }
                )

                # Only unlock rewards that have not already been redeemed.
                if reward.status == 'LOCKED':
                    reward.status = 'AVAILABLE'
                    reward.save(update_fields=['status'])

            # Count all unique training badges earned by the user
            badge_count = TrainingBadge.objects.filter(
                user=request.user
            ).count()

            # Unlock the one-time training completion reward
            # after all 10 badges have been earned.
            if badge_count >= 10:
                reward, reward_created = TrainingReward.objects.get_or_create(
                    user=request.user,
                    defaults={
                        'reward_type': 'FREE_VETERINARY_APPOINTMENT',
                        'status': 'AVAILABLE',
                    }
                )

                reward_unlocked = reward_created
                reward_status = reward.status

        attempts_remaining = max(0, 2 - attempt_number)

        return Response(
            {
                'message': 'Quiz submitted successfully.',
                'attempt_id': attempt.id,
                'attempt_number': attempt_number,
                'score': score,
                'correct_answers': correct_answers,
                'total_questions': total_questions,
                'passed': passed,
                'attempts_remaining': attempts_remaining,
                'badge_earned': badge_earned,
                'badge': (
                    {
                        'id': quiz.training.id,
                        'title': quiz.training.title,
                    }
                    if passed
                    else None
                ),

                'reward_unlocked': reward_unlocked,
                'reward': (
                    {
                        'type': 'FREE_VETERINARY_APPOINTMENT',
                        'name': 'Free Basic Veterinary Health Check',
                        'status': reward_status,
                        'uses_available': 1 if reward_status == 'AVAILABLE' else 0,
                    }
                    if reward_status
                    else None
                ),
            },
            status=status.HTTP_200_OK
        )


class TrainingBadgeListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        badges = TrainingBadge.objects.filter(
            user=request.user
        ).select_related('training')

        return Response([
            {
                'id': badge.id,
                'training_id': badge.training.id,
                'training_title': badge.training.title,
                'earned_at': badge.earned_at,
            }
            for badge in badges
        ])

class TrainingRewardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        badge_count = TrainingBadge.objects.filter(
            user=request.user
        ).count()

        total_required = 10

        # Safety:
        # If an existing user already has all 10 badges but the reward
        # was never created, create it automatically.
        reward = None

        if badge_count >= total_required:
            reward, _ = TrainingReward.objects.get_or_create(
                user=request.user,
                defaults={
                    'reward_type': 'FREE_VETERINARY_APPOINTMENT',
                    'status': 'AVAILABLE',
                }
            )

        # Reward still locked
        if reward is None:
            return Response({
                'unlocked': False,
                'badge_count': badge_count,
                'badges_required': total_required,
                'remaining_badges': max(
                    0,
                    total_required - badge_count
                ),
                'reward': {
                    'type': 'FREE_VETERINARY_APPOINTMENT',
                    'name': 'Free Basic Veterinary Health Check',
                    'status': 'LOCKED',
                    'uses_available': 0,
                },
            })

        # Reward unlocked
        return Response({
            'unlocked': True,
            'badge_count': badge_count,
            'badges_required': total_required,
            'remaining_badges': 0,

            'reward': {
                'type': reward.reward_type,
                'name': 'Free Basic Veterinary Health Check',
                'status': reward.status,

                'uses_available': (
                    1
                    if reward.status == 'AVAILABLE'
                    else 0
                ),

                'unlocked_at': reward.unlocked_at,

                'redeemed_at': reward.redeemed_at,

                'appointment_id': (
                    reward.appointment_id
                    if reward.appointment
                    else None
                ),
            },
        })

class TrainingAttemptListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(
            user=request.user
        ).select_related('quiz', 'quiz__training').order_by('-completed_at')

        return Response([
            {
                'id': attempt.id,
                'quiz_id': attempt.quiz.id,
                'quiz_title': attempt.quiz.title,
                'training_id': attempt.quiz.training.id,
                'training_title': attempt.quiz.training.title,
                'attempt_number': attempt.attempt_number,
                'score': attempt.score,
                'correct_answers': attempt.correct_answers,
                'total_questions': attempt.total_questions,
                'passed': attempt.passed,
                'completed_at': attempt.completed_at,
            }
            for attempt in attempts
        ])

class TrainingAttemptReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            attempt = QuizAttempt.objects.select_related(
                'quiz',
                'quiz__training'
            ).get(
                pk=pk,
                user=request.user
            )
        except QuizAttempt.DoesNotExist:
            return Response(
                {'detail': 'Training attempt not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        questions = list(
            attempt.quiz.questions.all().order_by('id')
        )

        answers = attempt.answers or []

        review = []

        for index, question in enumerate(questions):

            user_answer = (
                answers[index]
                if index < len(answers)
                else None
            )

            review.append({
                'question_number': index + 1,
                'question': question.question,
                'options': question.options,
                'correct_answer': question.correct_answer,
                'user_answer': user_answer,
                'is_correct': (
                    user_answer == question.correct_answer
                    if user_answer is not None
                    else False
                ),
            })

        return Response({
            'attempt_id': attempt.id,
            'quiz_title': attempt.quiz.title,
            'training_title': attempt.quiz.training.title,
            'score': attempt.score,
            'correct_answers': attempt.correct_answers,
            'total_questions': attempt.total_questions,
            'attempt_number': attempt.attempt_number,
            'passed': attempt.passed,
            'completed_at': attempt.completed_at,
            'questions': review,
        })