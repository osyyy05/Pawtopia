from django.urls import path

from .views import (
    create_donation,
    my_donations,
    shelter_donations,
    shelter_approve_donation,
    shelter_reject_donation,
    admin_donations,
    admin_approve_donation,
    admin_reject_donation,
    my_notifications,
    mark_notification_read,
)


urlpatterns = [

    # USER
    path(
        '',
        create_donation,
        name='create-donation'
    ),

    path(
        'my/',
        my_donations,
        name='my-donations'
    ),

    # SHELTER
    path(
        'shelter/',
        shelter_donations,
        name='shelter-donations'
    ),

    path(
        'shelter/<int:donation_id>/approve/',
        shelter_approve_donation,
        name='shelter-approve-donation'
    ),

    path(
        'shelter/<int:donation_id>/reject/',
        shelter_reject_donation,
        name='shelter-reject-donation'
    ),

    # VET
    path(
        'notifications/',
        my_notifications,
        name='my-notifications'
    ),

    path(
        'notifications/<int:notification_id>/read/',
        mark_notification_read,
        name='mark-notification-read'
    ),

    # ADMIN
    path(
        'admin/',
        admin_donations,
        name='admin-donations'
    ),

    path(
        'admin/<int:donation_id>/approve/',
        admin_approve_donation,
        name='admin-approve-donation'
    ),

    path(
        'admin/<int:donation_id>/reject/',
        admin_reject_donation,
        name='admin-reject-donation'
    ),
]