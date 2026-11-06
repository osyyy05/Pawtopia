from rest_framework import serializers
from .models import NewsArticle


class NewsArticleSerializer(serializers.ModelSerializer):

    class Meta:
        model = NewsArticle

        fields = [
            'id',
            'title',
            'summary',
            'content',
            'image',
            'date',
            'category',
            'url',
            'is_published',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
        ]