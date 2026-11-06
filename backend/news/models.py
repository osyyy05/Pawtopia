from django.db import models


class NewsArticle(models.Model):

    CATEGORY_CHOICES = [
        ('Conservation', 'Conservation'),
        ('Adoption', 'Adoption'),
        ('Wildlife', 'Wildlife'),
        ('Community', 'Community'),
        ('Marine Life', 'Marine Life'),
    ]

    title = models.CharField(max_length=255)

    summary = models.TextField()

    content = models.TextField()

    image = models.URLField(
        max_length=500,
        blank=True
    )

    date = models.DateField()

    category = models.CharField(
        max_length=100
    )

    url = models.URLField(
        max_length=500,
        blank=True
    )

    is_published = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.title