from django.contrib import admin
from .models import EmailOTP


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = (
        'email',
        'username',
        'otp',
        'created_at',
    )

    search_fields = (
        'email',
        'username',
    )

    ordering = ('-created_at',)