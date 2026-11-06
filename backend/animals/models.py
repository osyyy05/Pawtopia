from django.db import models


class Animal(models.Model):
    # ==========================================
    # BASIC INFORMATION
    # ==========================================

    name = models.CharField(max_length=200)

    scientific_name = models.CharField(max_length=200)

    category = models.CharField(max_length=100)

    habitat = models.TextField()

    diet = models.TextField()

    lifespan = models.TextField(
        blank=True,
        default=''
    )

    conservation_status = models.CharField(max_length=100)

    description = models.TextField()


    # ==========================================
    # MAIN IMAGE
    # ==========================================

    # Existing image URL support
    image = models.URLField(
        max_length=500,
        blank=True,
        default=''
    )

    # New uploaded main image
    image_file = models.ImageField(
        upload_to='animals/images/',
        blank=True,
        null=True
    )


    # ==========================================
    # GALLERY
    # ==========================================

    # Existing gallery URL support
    gallery = models.JSONField(
        default=list
    )

    # New uploaded gallery images
    # Stores the uploaded image URLs/paths
    gallery_files = models.JSONField(
        default=list,
        blank=True
    )


    # ==========================================
    # INTERESTING FACTS
    # ==========================================

    facts = models.JSONField(
        default=list
    )


    # ==========================================
    # MORE INFORMATION
    # ==========================================

    physical_characteristics = models.TextField(
        blank=True,
        default=''
    )

    behaviour = models.TextField(
        blank=True,
        default=''
    )

    reproduction = models.TextField(
        blank=True,
        default=''
    )

    geographic_range = models.TextField(
        blank=True,
        default=''
    )

    conservation_threats = models.TextField(
        blank=True,
        default=''
    )

    ecosystem_role = models.TextField(
        blank=True,
        default=''
    )


    # ==========================================
    # ANIMAL VIDEO
    # ==========================================

    video = models.FileField(
        upload_to='animals/videos/',
        blank=True,
        null=True
    )


    # ==========================================
    # DISPLAY
    # ==========================================

    def __str__(self):
        return self.name