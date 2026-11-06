from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import NewsArticle
from .serializers import NewsArticleSerializer


# =========================================================
# PUBLIC - VIEW PUBLISHED NEWS
# =========================================================

@api_view(['GET'])
def published_news(request):

    articles = NewsArticle.objects.filter(
        is_published=True
    ).order_by('-date', '-created_at')

    serializer = NewsArticleSerializer(
        articles,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# ADMIN - VIEW ALL NEWS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_news(request):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    articles = NewsArticle.objects.all().order_by(
        '-date',
        '-created_at'
    )

    serializer = NewsArticleSerializer(
        articles,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# ADMIN - CREATE NEWS
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_create_news(request):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = NewsArticleSerializer(
        data=request.data
    )

    if serializer.is_valid():
        article = serializer.save()

        return Response(
            NewsArticleSerializer(article).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# ADMIN - UPDATE NEWS
# =========================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_news(
    request,
    article_id
):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        article = NewsArticle.objects.get(
            id=article_id
        )
    except NewsArticle.DoesNotExist:
        return Response(
            {'error': 'News article not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = NewsArticleSerializer(
        article,
        data=request.data,
        partial=True
    )

    if serializer.is_valid():
        article = serializer.save()

        return Response(
            NewsArticleSerializer(article).data
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# ADMIN - DELETE NEWS
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_news(
    request,
    article_id
):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        article = NewsArticle.objects.get(
            id=article_id
        )
    except NewsArticle.DoesNotExist:
        return Response(
            {'error': 'News article not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    article.delete()

    return Response(
        {'message': 'News article deleted successfully.'},
        status=status.HTTP_200_OK
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_toggle_publish(request, article_id):
    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        article = NewsArticle.objects.get(id=article_id)
    except NewsArticle.DoesNotExist:
        return Response(
            {'error': 'Article not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    article.is_published = not article.is_published
    article.save()

    return Response(NewsArticleSerializer(article).data)