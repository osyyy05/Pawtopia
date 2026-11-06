from django.urls import path

from .views import (
    community_posts,
    create_community_post,
    like_community_post,
    add_community_comment,
    admin_delete_community_post,
    admin_delete_community_comment,
    edit_community_post,
    delete_own_community_post,
)


urlpatterns = [
    path('', community_posts, name='community-posts'),
    path('create/', create_community_post, name='create-community-post'),
    path(
        '<int:post_id>/like/',
        like_community_post,
        name='like-community-post'
    ),
    path(
        '<int:post_id>/comment/',
        add_community_comment,
        name='add-community-comment'
    ),
    path(
        'admin/posts/<int:post_id>/',
        admin_delete_community_post,
        name='admin-delete-community-post'
    ),
    path(
        'admin/comments/<int:comment_id>/',
        admin_delete_community_comment,
        name='admin-delete-community-comment'
    ),
    path(
        '<int:post_id>/edit/',
        edit_community_post,
        name='edit-community-post'
    ),
    path(
        '<int:post_id>/delete/',
        delete_own_community_post,
        name='delete-own-community-post'
    ),
]