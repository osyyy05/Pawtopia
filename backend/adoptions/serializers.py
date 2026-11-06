from rest_framework import serializers
from .models import AdoptionAnimal, AdoptionApplication


class AdoptionAnimalSerializer(serializers.ModelSerializer):

    shelter_name = serializers.CharField(
        source='shelter.name',
        read_only=True
    )

    application_count = serializers.IntegerField(
        source='applications.count',
        read_only=True
    )

    class Meta:
        model = AdoptionAnimal

        fields = [
            'id',
            'shelter',
            'shelter_name',
            'name',
            'species',
            'breed',
            'age',
            'gender',
            'fee',
            'image',
            'description',
            'requirements',
            'active',
            'status',
            'posted_at',
            'updated_at',
            'application_count',
        ]

        read_only_fields = [
            'id',
            'shelter',
            'shelter_name',
            'posted_at',
            'updated_at',
            'application_count',
        ]


class AdoptionApplicationSerializer(serializers.ModelSerializer):

    animal_name = serializers.CharField(
        source='animal.name',
        read_only=True
    )

    animal_image = serializers.URLField(
        source='animal.image',
        read_only=True
    )

    shelter_name = serializers.CharField(
        source='animal.shelter.name',
        read_only=True
    )

    class Meta:
        model = AdoptionApplication

        fields = [
            'id',
            'animal',
            'animal_name',
            'animal_image',
            'shelter_name',
            'applicant',
            'full_name',
            'phone',
            'email',
            'address',
            'reason',
            'status',
            'shelter_remark',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'applicant',
            'animal_name',
            'animal_image',
            'shelter_name',
            'status',
            'shelter_remark',
            'created_at',
            'updated_at',
        ]