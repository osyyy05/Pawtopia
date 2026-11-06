from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes

from .models import CommunityPost, CommunityLike, CommunityComment
from donations.models import Notification



# =========================================================
# COMMUNITY - VIEW POSTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def community_posts(request):

    posts = CommunityPost.objects.select_related(
        'user'
    ).prefetch_related(
        'likes',
        'comments__user'
    ).order_by('-created_at')

    data = []

    for post in posts:
        data.append({
            'id': str(post.id),
            'userId': str(post.user.id),
            'username': post.user.username,
            'userAvatar': (
                request.build_absolute_uri(
                    post.user.profile.profile_photo.url
                )
                if hasattr(post.user, 'profile')
                and post.user.profile.profile_photo
                else ''
            ),
            'content': post.content,
            'image': (
                request.build_absolute_uri(post.image_file.url)
                if post.image_file
                else post.image
            ),
            'likes': post.initial_likes + post.likes.count(),
            'likedByCurrentUser': post.likes.filter(
                user=request.user
            ).exists(),
            'comments': [
                {
                    'id': str(comment.id),
                    'userId': str(comment.user.id),
                    'username': comment.user.username,
                    'userAvatar': (
                        request.build_absolute_uri(
                            comment.user.profile.profile_photo.url
                        )
                        if hasattr(comment.user, 'profile')
                        and comment.user.profile.profile_photo
                        else ''
                    ),
                    'content': comment.content,
                    'timestamp': comment.created_at,
                }
                for comment in post.comments.all()
            ],
            'timestamp': post.created_at,
            'category': post.category,
        })

    return Response(data)


# =========================================================
# COMMUNITY - CREATE POST
# =========================================================


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_community_post(request):
    content = str(request.data.get('content', '')).strip()
    category = request.data.get('category', 'general')
    image_file = request.FILES.get('image')

    valid_categories = [
        'general', 'adoption', 'training', 'community'
    ]

    if not content:
        return Response(
            {'error': 'Post content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if category not in valid_categories:
        return Response(
            {'error': 'Invalid category'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if image_file:
        if image_file.content_type not in [
            'image/jpeg', 'image/png', 'image/webp'
        ]:
            return Response(
                {'error': 'Only JPG, PNG and WebP are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if image_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'Image must be smaller than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

    post = CommunityPost.objects.create(
        user=request.user,
        content=content,
        category=category,
        image_file=image_file
    )

    return Response({
        'id': str(post.id),
        'message': 'Post created successfully'
    }, status=status.HTTP_201_CREATED)


# =========================================================
# COMMUNITY - LIKE / UNLIKE POST
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_community_post(request, post_id):

    try:
        post = CommunityPost.objects.select_related(
            'user'
        ).get(id=post_id)
    except CommunityPost.DoesNotExist:
        return Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    like = CommunityLike.objects.filter(
        post=post,
        user=request.user
    ).first()

    if like:
        like.delete()
        return Response({
            'liked': False,
            'likes': post.initial_likes + post.likes.count()
        })

    CommunityLike.objects.create(
        post=post,
        user=request.user
    )

    if post.user != request.user:
        Notification.objects.create(
            recipient=post.user,
            title='New Like',
            message=f'{request.user.username} liked your post.',
            notification_type='community_like',
            post_id=str(post.id)
        )

    return Response({
        'liked': True,
        'likes': post.initial_likes + post.likes.count()
    })


# =========================================================
# COMMUNITY - ADD COMMENT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_community_comment(request, post_id):

    try:
        post = CommunityPost.objects.select_related(
            'user'
        ).get(id=post_id)
    except CommunityPost.DoesNotExist:
        return Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get('content', '').strip()

    if not content:
        return Response(
            {'error': 'Comment cannot be empty'},
            status=status.HTTP_400_BAD_REQUEST
        )

    comment = CommunityComment.objects.create(
        post=post,
        user=request.user,
        content=content
    )

    # Don't notify yourself
    if post.user != request.user:
        Notification.objects.create(
            recipient=post.user,
            title='New Comment',
            message=(
                f'{request.user.username} commented on your post.'
            ),
            notification_type='community_comment',
            post_id=str(post.id)
        )

    return Response({
        'id': str(comment.id),
        'userId': str(request.user.id),
        'username': request.user.username,
        'content': comment.content,
        'timestamp': comment.created_at,
    }, status=status.HTTP_201_CREATED)


# =========================================================
# ADMIN - DELETE COMMUNITY POST
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_community_post(request, post_id):
    try:
        post = CommunityPost.objects.get(id=post_id)
    except CommunityPost.DoesNotExist:
        return Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    post.delete()

    return Response(
        {'message': 'Post deleted successfully'},
        status=status.HTTP_200_OK
    )


# =========================================================
# ADMIN - DELETE COMMUNITY COMMENT
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_delete_community_comment(request, comment_id):
    try:
        comment = CommunityComment.objects.get(id=comment_id)
    except CommunityComment.DoesNotExist:
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    comment.delete()

    return Response(
        {'message': 'Comment deleted successfully'},
        status=status.HTTP_200_OK
    )


# =========================================================
# USER - EDIT OWN POST
# =========================================================

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def edit_community_post(request, post_id):
    try:
        post = CommunityPost.objects.get(
            id=post_id,
            user=request.user
        )
    except CommunityPost.DoesNotExist:
        return Response(
            {'error': 'Post not found or permission denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    content = str(
        request.data.get('content', post.content)
    ).strip()

    category = request.data.get('category', post.category)

    valid_categories = [
        'general', 'adoption', 'training', 'community'
    ]

    if not content:
        return Response(
            {'error': 'Post content is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if category not in valid_categories:
        return Response(
            {'error': 'Invalid category'},
            status=status.HTTP_400_BAD_REQUEST
        )

    image_file = request.FILES.get('image')

    if image_file:
        if image_file.content_type not in [
            'image/jpeg', 'image/png', 'image/webp'
        ]:
            return Response(
                {'error': 'Only JPG, PNG and WebP are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image must be smaller than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

    post.content = content
    post.category = category

    if image_file:
        post.image_file = image_file
        post.image = ''

    if request.data.get('remove_image') == 'true':
        post.image_file = None
        post.image = ''

    post.save()

    return Response({
        'message': 'Post updated successfully'
    })


# =========================================================
# USER - DELETE OWN POST
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_own_community_post(request, post_id):
    try:
        post = CommunityPost.objects.get(
            id=post_id,
            user=request.user
        )
    except CommunityPost.DoesNotExist:
        return Response(
            {'error': 'Post not found or permission denied'},
            status=status.HTTP_404_NOT_FOUND
        )

    post.delete()

    return Response({
        'message': 'Post deleted successfully'
    })
