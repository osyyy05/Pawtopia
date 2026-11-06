from django.urls import path

from .views import (
    TrainingListView,
    TrainingDetailView,
    QuizListView,
    QuizDetailView,
    QuizQuestionListView,
    QuizQuestionDetailView,
    QuizSubmitView,
    TrainingBadgeListView,
    TrainingRewardView,
    TrainingAttemptListView,
    TrainingAttemptReviewView,
)

urlpatterns = [
    path('', TrainingListView.as_view(), name='training-list'),

    path(
        'attempts/',
        TrainingAttemptListView.as_view(),
        name='training-attempts'
    ),
    path(
        'attempts/<int:pk>/review/',
        TrainingAttemptReviewView.as_view(),
        name='training-attempt-review'
    ),
    path('<int:pk>/', TrainingDetailView.as_view(), name='training-detail'),

    path('quizzes/', QuizListView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),

    path(
        'quizzes/<int:pk>/submit/',
        QuizSubmitView.as_view(),
        name='quiz-submit'
    ),

    path(
        'questions/',
        QuizQuestionListView.as_view(),
        name='question-list'
    ),
    path(
        'questions/<int:pk>/',
        QuizQuestionDetailView.as_view(),
        name='question-detail'
    ),

    path(
        'badges/',
        TrainingBadgeListView.as_view(),
        name='training-badges'
    ),

    path(
        'reward/',
        TrainingRewardView.as_view(),
        name='training-reward'
    ),
]