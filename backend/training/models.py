from django.conf import settings
from django.db import models


class TrainingTopic(models.Model):
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=50)
    description = models.TextField()
    content = models.TextField()
    image = models.URLField(max_length=500, blank=True)
    video_url = models.URLField(max_length=500, blank=True)

    image_file = models.ImageField(
    upload_to='training/images/',
    blank=True,
    null=True
    )

    video = models.FileField(
        upload_to='training/videos/',
        blank=True,
        null=True
    )

    def __str__(self):
        return self.title


class Quiz(models.Model):
    training = models.ForeignKey(
        TrainingTopic,
        on_delete=models.CASCADE,
        related_name='quizzes'
    )
    title = models.CharField(max_length=200)

    def __str__(self):
        return self.title


class QuizQuestion(models.Model):
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    question = models.TextField()
    options = models.JSONField(default=list)
    correct_answer = models.IntegerField()

    def __str__(self):
        return self.question


class QuizAttempt(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_quiz_attempts'
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='attempts'
    )
    attempt_number = models.PositiveIntegerField()
    score = models.PositiveIntegerField()
    correct_answers = models.PositiveIntegerField()
    total_questions = models.PositiveIntegerField()
    passed = models.BooleanField(default=False)
    answers = models.JSONField(default=list)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'quiz', 'attempt_number'],
                name='unique_quiz_attempt'
            )
        ]
        ordering = ['-completed_at']

    def __str__(self):
        return f'{self.user.username} - {self.quiz.title} - Attempt {self.attempt_number}'


class TrainingBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_badges'
    )

    training = models.ForeignKey(
        TrainingTopic,
        on_delete=models.CASCADE,
        related_name='badges'
    )

    earned_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'training'],
                name='unique_training_badge'
            )
        ]
        ordering = ['-earned_at']

    def __str__(self):
        return (
            f'{self.user.username} - '
            f'{self.training.title}'
        )


class TrainingReward(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('REDEEMED', 'Redeemed'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_reward'
    )

    reward_type = models.CharField(
        max_length=50,
        default='FREE_VETERINARY_APPOINTMENT'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='AVAILABLE'
    )

    unlocked_at = models.DateTimeField(
        auto_now_add=True
    )

    redeemed_at = models.DateTimeField(
        null=True,
        blank=True
    )

    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='training_reward'
    )

    def __str__(self):
        return (
            f'{self.user.username} - '
            f'Free Basic Health Check - '
            f'{self.status}'
        )