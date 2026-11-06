from rest_framework import serializers
from .models import TrainingTopic, Quiz, QuizQuestion


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = [
            'id',
            'quiz',
            'question',
            'options',
            'correct_answer',
        ]



class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Quiz
        fields = [
            'id',
            'training',
            'title',
            'questions',
        ]

    def validate_training(self, training):
        existing = Quiz.objects.filter(training=training)

        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)

        if existing.exists():
            raise serializers.ValidationError(
                "This training topic already has a quiz. "
                "Please edit the existing quiz instead."
            )

        return training

class TrainingTopicSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True)

    image_file = serializers.ImageField(
        required=False,
        allow_null=True
    )

    video = serializers.FileField(
        required=False,
        allow_null=True
    )

    class Meta:
        model = TrainingTopic
        fields = [
            'id',
            'title',
            'category',
            'duration',
            'difficulty',
            'description',
            'content',
            'image',
            'image_file',
            'video_url',
            'video',
            'quizzes',
        ]