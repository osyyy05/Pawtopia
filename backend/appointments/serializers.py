from rest_framework import serializers
from .models import (
    Appointment,
    HealthRecord,
    VaccinationRecord,
    TreatmentRecord,
)


class AppointmentSerializer(
    serializers.ModelSerializer
):

    status_display = serializers.CharField(
        source='get_status_display',
        read_only=True
    )

    appointment_type_display = serializers.CharField(
        source='get_appointment_type_display',
        read_only=True
    )

    animal_name = serializers.CharField(
        source='animal.name',
        read_only=True,
        allow_null=True
    )

    vet_name = serializers.CharField(
        source='vet.username',
        read_only=True,
        allow_null=True
    )

    shelter_name = serializers.CharField(
        source='shelter.username',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Appointment

        fields = [
            'id',
            'adoption_application',

            'adopter',
            'adopter_name',
            'adopter_email',
            'owner_phone',

            'shelter',
            'shelter_name',
            
            'vet',
            'vet_name',
            'vet_clinic',

            'animal',
            'animal_name',

            'pet_name',
            'species',

            'date',
            'time',

            'appointment_type',
            'appointment_type_display',

            'booking_source',
            'is_free',

            'status',
            'status_display',

            'notes',
            'medical_notes',

            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'adoption_application',
            'adopter',
            'shelter',
            'vet',
            'animal_name',
            'status',
            'status_display',
            'appointment_type_display',
            'created_at',
            'updated_at',
        ]

class HealthRecordSerializer(serializers.ModelSerializer):
    pet_name = serializers.CharField(read_only=True)
    owner_name = serializers.SerializerMethodField()
    vet_name = serializers.SerializerMethodField()
    animal_name = serializers.SerializerMethodField()

    class Meta:
        model = HealthRecord
        fields = [
            'id',
            'animal',
            'animal_name',
            'vet',
            'vet_name',
            'owner',
            'owner_name',
            'pet_name',
            'breed',
            'date_of_birth',
            'visit_date',
            'weight',
            'condition',
            'diagnosis',
            'treatment',
            'prescriptions',
            'next_visit',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'vet',
            'vet_name',
            'owner_name',
            'animal_name',
            'pet_name',
            'created_at',
            'updated_at',
        ]

    def get_owner_name(self, obj):
        if obj.owner:
            return obj.owner.get_full_name() or obj.owner.username
        return ''

    def get_vet_name(self, obj):
        if obj.vet:
            return obj.vet.get_full_name() or obj.vet.username
        return ''

    def get_animal_name(self, obj):
        if obj.animal:
            return obj.animal.name
        return ''

class VaccinationRecordSerializer(serializers.ModelSerializer):
    animal_name = serializers.SerializerMethodField()
    vet_name = serializers.SerializerMethodField()

    class Meta:
        model = VaccinationRecord
        fields = [
            'id',
            'animal',
            'animal_name',
            'vet',
            'vet_name',
            'owner',
            'pet_name',
            'species',
            'owner_name',
            'owner_phone',
            'vaccine',
            'date_given',
            'next_due_date',
            'batch_number',
            'administered_by',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'vet',
            'animal_name',
            'vet_name',
            'created_at',
            'updated_at',
        ]

    def get_animal_name(self, obj):
        if obj.animal:
            return obj.animal.name
        return obj.pet_name or ''

    def get_vet_name(self, obj):
        if obj.vet:
            return obj.vet.get_full_name() or obj.vet.username
        return obj.administered_by or ''

class TreatmentRecordSerializer(serializers.ModelSerializer):
    animal_name = serializers.SerializerMethodField()
    vet_name = serializers.SerializerMethodField()

    class Meta:
        model = TreatmentRecord

        fields = [
            'id',
            'animal',
            'animal_name',
            'vet',
            'vet_name',
            'owner',
            'pet_name',
            'species',
            'owner_name',
            'treatment_type',
            'description',
            'start_date',
            'end_date',
            'medications',
            'progress',
            'status',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'vet',
            'animal_name',
            'vet_name',
            'created_at',
            'updated_at',
        ]

    def get_animal_name(self, obj):
        if obj.animal:
            return obj.animal.name
        return obj.pet_name or ''

    def get_vet_name(self, obj):
        if obj.vet:
            return (
                obj.vet.get_full_name()
                or obj.vet.username
            )
        return ''