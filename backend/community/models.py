from django.db import models
from django.contrib.auth.models import User


class CommunityPost(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('adoption', 'Adoption'),
        ('training', 'Training'),
        ('community', 'Community'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_posts'
    )

    content = models.TextField()

    image = models.URLField(
        max_length=500,
        blank=True
    )

    image_file = models.ImageField(
        upload_to='community/posts/',
        blank=True,
        null=True
    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        default='general'
    )

    initial_likes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f'{self.user.username} - {self.content[:50]}'


class CommunityLike(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='likes'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_likes'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = ('post', 'user')

    def __str__(self):
        return f'{self.user.username} liked post {self.post.id}'


class CommunityComment(models.Model):
    post = models.ForeignKey(
        CommunityPost,
        on_delete=models.CASCADE,
        related_name='comments'
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='community_comments'
    )

    content = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f'{self.user.username} commented on post {self.post.id}'