from django.contrib import admin

from .models import Donation, Notification


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'full_name',
        'email',
        'amount',
        'shelter',
        'status',
        'transaction_id',
        'created_at',
    )

    list_filter = (
        'status',
        'payment_method',
    )

    search_fields = (
        'full_name',
        'email',
        'transaction_id',
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'recipient',
        'title',
        'notification_type',
        'is_read',
        'created_at',
    )

    list_filter = (
        'notification_type',
        'is_read',
    )

    search_fields = (
        'recipient__username',
        'recipient__email',
        'title',
        'message',
    )