from django.db import models
from django.contrib.auth.models import User


class AdoptionAnimal(models.Model):

    SPECIES_CHOICES = [
        ('Dog', 'Dog'),
        ('Cat', 'Cat'),
        ('Rabbit', 'Rabbit'),
        ('Other', 'Other'),
    ]

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]

    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('PENDING', 'Pending Adoption'),
        ('ADOPTED', 'Adopted'),
        ('INACTIVE', 'Inactive'),
    ]

    # Shelter that owns/posts this animal
    shelter = models.ForeignKey(
        'accounts.Shelter',
        on_delete=models.CASCADE,
        related_name='adoption_animals'
    )

    name = models.CharField(max_length=200)

    species = models.CharField(
        max_length=50,
        choices=SPECIES_CHOICES
    )

    breed = models.CharField(
        max_length=200,
        blank=True
    )

    age = models.CharField(
        max_length=100
    )

    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES
    )

    fee = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0
    )

    image = models.URLField(
        max_length=500,
        blank=True
    )

    description = models.TextField(
        blank=True
    )

    requirements = models.JSONField(
        default=list,
        blank=True
    )

    active = models.BooleanField(
        default=True
    )

    posted_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='AVAILABLE'
    )

    def __str__(self):
        return f'{self.name} - {self.species}'


class AdoptionApplication(models.Model):

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]

    animal = models.ForeignKey(
        AdoptionAnimal,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='adoption_applications'
    )

    full_name = models.CharField(
        max_length=255
    )

    phone = models.CharField(
        max_length=30
    )

    email = models.EmailField()

    address = models.TextField(
        blank=True
    )

    reason = models.TextField(
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    shelter_remark = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return (
            f'{self.full_name} - '
            f'{self.animal.name} - '
            f'{self.status}'
        )