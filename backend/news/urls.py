from django.urls import path

from .views import (
    published_news,
    admin_news,
    admin_create_news,
    admin_update_news,
    admin_delete_news,
    admin_toggle_publish,
)


urlpatterns = [

    # Public
    path(
        '',
        published_news,
        name='published-news'
    ),

    # Admin
    path(
        'admin/',
        admin_news,
        name='admin-news'
    ),

    path(
        'admin/create/',
        admin_create_news,
        name='admin-create-news'
    ),

    path(
        'admin/<int:article_id>/',
        admin_update_news,
        name='admin-update-news'
    ),

    path(
        'admin/<int:article_id>/delete/',
        admin_delete_news,
        name='admin-delete-news'
    ),

    path(
        'admin/<int:article_id>/publish/', 
        admin_toggle_publish,
        name='admin-toggle-publish'
    ),
]