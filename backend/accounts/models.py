from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    full_name = models.CharField(
        max_length=255,
        blank=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    address = models.TextField(
        blank=True,
        default=''
    )

    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        blank=True,
        null=True
    )

    bio = models.TextField(
        blank=True
    )

    profile_prompt_seen = models.BooleanField(
    default=False
    )

    def __str__(self):
        return self.user.username
class Shelter(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        related_name='shelter_record',
        null=True,
        blank=True
    )

    name = models.CharField(
        max_length=255
    )

    address = models.TextField(
        blank=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    description = models.TextField(
        blank=True
    )

    capacity = models.PositiveIntegerField(
        default=0
    )

    current_animals = models.PositiveIntegerField(
        default=0
    )

    image = models.URLField(
        max_length=500,
        blank=True
    )

    def __str__(self):
        return self.name


class EmailOTP(models.Model):
    email = models.EmailField()
    username = models.CharField(max_length=150)
    password = models.CharField(max_length=128)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} - {self.otp}"

