from django.contrib import admin

from .models import VeterinaryClinic


@admin.register(VeterinaryClinic)
class VeterinaryClinicAdmin(admin.ModelAdmin):

    list_display = [
        'name',
        'phone',
        'email',
        'rating',
        'active',
    ]

    list_filter = [
        'active',
        'rating',
    ]

    search_fields = [
        'name',
        'address',
        'phone',
        'email',
    ]

    ordering = [
        'name',
    ]