from django.conf import settings
from django.db import models

class VeterinaryClinic(models.Model):

    vet_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_veterinary_clinic',
    )

    name = models.CharField(
        max_length=255
    )

    address = models.TextField(
        blank=True,
        default=''
    )

    phone = models.CharField(
        max_length=50,
        blank=True,
        default=''
    )

    email = models.EmailField(
        blank=True,
        default=''
    )

    description = models.TextField(
        blank=True,
        default=''
    )

    services = models.JSONField(
        default=list,
        blank=True
    )

    # Animal types supported by this clinic.
    # Example: ["Dog", "Cat", "Rabbit", "Hamster"]
    supported_pet_types = models.JSONField(
        default=list,
        blank=True
    )

    hours = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    image = models.URLField(
        max_length=500,
        blank=True,
        default=''
    )

    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0
    )

    google_maps_url = models.URLField(
        max_length=500,
        blank=True,
        default=''
    )

    active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Appointment(models.Model):

    STATUS_CHOICES = [
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    APPOINTMENT_TYPE_CHOICES = [
        ('MEET_AND_GREET', 'Meet & Greet'),
        ('HOME_VISIT', 'Home Visit'),
        ('ADOPTION_FINALISATION', 'Adoption Finalisation'),
        ('FOLLOW_UP', 'Follow-up'),

        # Veterinary appointments
        ('GENERAL_CONSULTATION', 'General Consultation'),
        ('VETERINARY_APPOINTMENT', 'Veterinary Appointment'),
        ('VACCINATION', 'Vaccination'),
    ]

    BOOKING_SOURCE_CHOICES = [
        ('STANDARD', 'Standard Booking'),
        ('TRAINING_REWARD', 'Training Reward'),
    ]

    # User / adopter
    adopter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='adoption_appointments',
    )

    # Shelter staff who created/manages the appointment
    shelter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shelter_appointments',
    )

    # Vet who handles the appointment
    vet = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vet_appointments',
    )

    # Veterinary clinic selected by the user
    vet_clinic = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    adoption_application = models.OneToOneField(
    'adoptions.AdoptionApplication',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='appointment',
    )

    # Animal is optional because your current Shelter UI
    # enters the animal name manually.
    animal = models.ForeignKey(
        'adoptions.AdoptionAnimal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
    )

    # Keep the name so existing UI can still work even
    # if the animal isn't linked yet.
    pet_name = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    species = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    adopter_name = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    owner_phone = models.CharField(
        max_length=50,
        blank=True,
        default=''
    )

    adopter_email = models.EmailField(
        blank=True,
        default=''
    )

    date = models.DateField()

    time = models.CharField(
        max_length=50
    )

    appointment_type = models.CharField(
        max_length=50,
        choices=APPOINTMENT_TYPE_CHOICES
    )

    booking_source = models.CharField(
    max_length=30,
    choices=BOOKING_SOURCE_CHOICES,
    default='STANDARD'
    )

    is_free = models.BooleanField(
        default=False
    )

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='SCHEDULED'
    )

    notes = models.TextField(
        blank=True,
        default=''
    )

    medical_notes = models.TextField(
        blank=True,
        default=''
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

class HealthRecord(models.Model):
    animal = models.ForeignKey(
        'adoptions.AdoptionAnimal',
        on_delete=models.CASCADE,
        related_name='health_records',
        null=True,
        blank=True,
    )

    vet = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='health_records',
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pet_health_records',
    )

    pet_name = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    breed = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    visit_date = models.DateField()

    weight = models.CharField(
        max_length=50,
        blank=True,
        default=''
    )

    condition = models.CharField(
        max_length=255,
        blank=True,
        default=''
    )

    diagnosis = models.TextField(
        blank=True,
        default=''
    )

    treatment = models.TextField(
        blank=True,
        default=''
    )

    prescriptions = models.TextField(
        blank=True,
        default=''
    )

    next_visit = models.DateField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f'{self.pet_name} - {self.visit_date}'

class VaccinationRecord(models.Model):
    animal = models.ForeignKey(
        'adoptions.AdoptionAnimal',
        on_delete=models.SET_NULL,
        related_name='vaccination_records',
        null=True,
        blank=True,
    )

    vet = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='vaccination_records',
        null=True,
        blank=True,
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='pet_vaccination_records',
        null=True,
        blank=True,
    )

    pet_name = models.CharField(max_length=200, blank=True, default='')
    species = models.CharField(max_length=100, blank=True, default='')
    owner_name = models.CharField(max_length=200, blank=True, default='')
    owner_phone = models.CharField(max_length=30, blank=True, default='')

    vaccine = models.CharField(max_length=200)
    date_given = models.DateField()
    next_due_date = models.DateField(null=True, blank=True)
    batch_number = models.CharField(max_length=100, blank=True, default='')

    administered_by = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_given', '-created_at']

    def __str__(self):
        return f'{self.pet_name} - {self.vaccine} - {self.date_given}'

class TreatmentRecord(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('ON_HOLD', 'On Hold'),
    ]

    animal = models.ForeignKey(
        'adoptions.AdoptionAnimal',
        on_delete=models.SET_NULL,
        related_name='treatment_records',
        null=True,
        blank=True,
    )

    vet = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='treatment_records',
        null=True,
        blank=True,
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='pet_treatment_records',
        null=True,
        blank=True,
    )

    pet_name = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    species = models.CharField(
        max_length=100,
        blank=True,
        default=''
    )

    owner_name = models.CharField(
        max_length=200,
        blank=True,
        default=''
    )

    treatment_type = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True,
        default=''
    )

    start_date = models.DateField()

    end_date = models.DateField(
        null=True,
        blank=True
    )

    medications = models.TextField(
        blank=True,
        default=''
    )

    progress = models.TextField(
        blank=True,
        default=''
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-start_date', '-created_at']

    def __str__(self):
        return f'{self.pet_name} - {self.treatment_type}'