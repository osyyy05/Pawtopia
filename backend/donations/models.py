from django.db import models
from django.contrib.auth.models import User
from accounts.models import Shelter


class Donation(models.Model):

    STATUS_CHOICES = [
        ('PENDING_SHELTER', 'Pending Shelter Verification'),
        ('SHELTER_APPROVED', 'Shelter Approved'),
        ('SHELTER_REJECTED', 'Shelter Rejected'),
        ('PENDING_ADMIN', 'Pending Admin Verification'),
        ('COMPLETED', 'Completed'),
        ('ADMIN_REJECTED', 'Admin Rejected'),

        # Legacy statuses for existing donation records
        ('PENDING_VET', 'Pending Vet Verification'),
        ('VET_APPROVED', 'Vet Approved'),
        ('VET_REJECTED', 'Vet Rejected'),
    ]

    donor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='donations'
    )

    full_name = models.CharField(max_length=255)

    email = models.EmailField()

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    shelter = models.CharField(
        max_length=255
    )

    shelter_account = models.ForeignKey(
        Shelter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='donations'
    )

    payment_method = models.CharField(
        max_length=100
    )

    receipt = models.ImageField(
        upload_to='donation_receipts/'
    )

    transaction_id = models.CharField(
        max_length=100,
        unique=True
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='PENDING_SHELTER'
    )

    vet_remark = models.TextField(
        blank=True
    )

    shelter_remark = models.TextField(
        blank=True
    )

    admin_remark = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f'{self.full_name} - RM {self.amount} - {self.status}'

class Notification(models.Model):

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    post_id = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    title = models.CharField(
        max_length=255
    )

    message = models.TextField()

    notification_type = models.CharField(
        max_length=50,
        default='general'
    )

    donation = models.ForeignKey(
        Donation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f'{self.recipient.username} - {self.title}'