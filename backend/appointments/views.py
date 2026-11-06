import math
import requests
from django.core.cache import cache
from accounts.models import UserProfile

from datetime import date, timedelta
from django.contrib.auth.models import User

from django.db import transaction
from django.utils import timezone
from training.models import TrainingReward

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .ai_recommender import rank_veterinary_clinics

from .models import Appointment, VeterinaryClinic, HealthRecord, VaccinationRecord, TreatmentRecord
from .serializers import AppointmentSerializer, HealthRecordSerializer, VaccinationRecordSerializer, TreatmentRecordSerializer

from donations.models import Notification
from adoptions.models import AdoptionAnimal
from adoptions.models import AdoptionApplication
from accounts.models import Shelter


# =========================================================
# USER - VIEW VETERINARY CLINICS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def veterinary_clinics(request):

    clinics = VeterinaryClinic.objects.filter(
        active=True
    ).order_by(
        'name'
    )

    data = []

    for clinic in clinics:
        data.append({
            'id': clinic.id,
            'name': clinic.name,
            'address': clinic.address,
            'phone': clinic.phone,
            'email': clinic.email,
            'description': clinic.description,
            'services': clinic.services,
            'hours': clinic.hours,
            'image': clinic.image,
            'rating': float(clinic.rating),
            'google_maps_url': clinic.google_maps_url,
        })

    return Response(data)

# =========================================================
# USER - NEAREST VETERINARY CLINIC RECOMMENDATION
# =========================================================

def geocode_address(address):
    if not address or not address.strip():
        return None

    cache_key = "geocode_" + __import__("hashlib").sha256(
        address.strip().lower().encode("utf-8")
    ).hexdigest()

    cached = cache.get(cache_key)
    if cached is not None:
        return cached or None

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": address,
                "format": "json",
                "limit": 1,
                "countrycodes": "my",
            },
            headers={
                "User-Agent": "PawtopiaFYP/1.0 (student academic project)"
            },
            timeout=8,
        )
        response.raise_for_status()

        results = response.json()

        if not results:
            cache.set(cache_key, [], 86400)
            return None

        coordinates = (
            float(results[0]["lat"]),
            float(results[0]["lon"]),
        )

        cache.set(cache_key, coordinates, 86400 * 30)
        return coordinates

    except (requests.RequestException, ValueError, KeyError, TypeError):
        return None


def haversine_distance(lat1, lon1, lat2, lon2):
    radius = 6371.0

    lat1, lon1, lat2, lon2 = map(
        math.radians, [lat1, lon1, lat2, lon2]
    )

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(delta_lon / 2) ** 2
    )

    return 2 * radius * math.asin(min(1.0, math.sqrt(a)))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nearest_veterinary_clinic(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user
    )

    if not profile.address.strip():
        return Response({
            "message": "Please add your address in your profile.",
            "nearest_clinic": None,
        })

    user_coordinates = geocode_address(profile.address)

    if not user_coordinates:
        return Response({
            "message": "Unable to locate your profile address.",
            "nearest_clinic": None,
        })

    nearest = None
    shortest_distance = float("inf")

    clinics = VeterinaryClinic.objects.filter(active=True)

    for clinic in clinics:
        if not clinic.address.strip():
            continue

        clinic_coordinates = geocode_address(clinic.address)

        if not clinic_coordinates:
            continue

        distance = haversine_distance(
            user_coordinates[0],
            user_coordinates[1],
            clinic_coordinates[0],
            clinic_coordinates[1],
        )

        # Rule-Based Recommendation: Distance First
        # The nearest clinic receives the highest priority.
        # Veterinary services are used as supporting information.

        clinic_services = clinic.services or []

        recommendation_reason = (
            f"{clinic.name} is recommended because it is approximately "
            f"{distance:.2f} km from your saved profile address "
        )

        if clinic_services:
            recommendation_reason += (
                " Available services include: "
                + ", ".join(clinic_services[:3])
                + "."
            )

        if distance < shortest_distance:
            shortest_distance = distance
            nearest = clinic
            nearest_reason = recommendation_reason

    if nearest is None:
        return Response({
            "message": "Unable to determine the nearest clinic.",
            "nearest_clinic": None,
        })

    return Response({
        "message": "Nearest veterinary clinic found.",
        "nearest_clinic": {
            "id": nearest.id,
            "name": nearest.name,
            "address": nearest.address,
            "distance_km": round(shortest_distance, 2),
            "distance_type": "straight_line",
            "google_maps_url": nearest.google_maps_url,
            "recommendation_reason": nearest_reason,
        },
    })


# =========================================================
# USER - AI VETERINARY CLINIC RECOMMENDATION
# =========================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_veterinary_clinic_recommendation(request):

    pet_type = str(
        request.data.get("pet_type") or ""
    ).strip()

    pet_needs = str(
        request.data.get("pet_needs") or ""
    ).strip()

    if not pet_type:
        return Response(
            {"error": "Please select or specify your pet type."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(pet_type) > 100:
        return Response(
            {"error": "Pet type is too long."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not pet_needs:
        return Response(
            {"error": "Please describe your pet's needs."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(pet_needs) > 1000:
        return Response(
            {"error": "Pet needs description is too long."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # AI recommendation is based on pet type and pet needs only.
    # No profile address, geocoding, or distance calculation required.

    clinics = VeterinaryClinic.objects.filter(active=True)

    candidates = [
        {"clinic": clinic}
        for clinic in clinics
    ]

    if not candidates:
        return Response({
            "message": "No active veterinary clinics are available.",
            "recommendations": []
        })

    try:
        recommendations = rank_veterinary_clinics(
            pet_type=pet_type,
            pet_needs=pet_needs,
            clinic_candidates=candidates,
            max_results=3
        )
    except Exception:
        return Response(
            {"error": "AI recommendation is temporarily unavailable."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    if not recommendations:
        return Response({
            "message": (
                "No suitable veterinary services were found for your description. "
                "Please describe your pet's health concerns or required services "
                "more clearly, such as vaccination, dental care, or a health checkup."
            ),
            "recommendations": []
        })

    return Response({
        "message": "AI veterinary clinic recommendations generated.",
        "pet_type": pet_type,
        "recommendations": recommendations
    })


# =========================================================
# SHELTER - VIEW APPOINTMENTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_appointments(request):

    if not request.user.groups.filter(name='Shelter').exists():
        return Response(
            {'error': 'Shelter access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointments = Appointment.objects.filter(
        shelter=request.user,
        appointment_type='MEET_AND_GREET',
        adoption_application__isnull=False,
    ).select_related(
        'animal',
        'adopter',
        'adoption_application',
    ).order_by('-date', '-time')

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(
        serializer.data
    )


# =========================================================
# SHELTER - CREATE APPOINTMENT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shelter_create_appointment(request):

    if not request.user.groups.filter(name='Shelter').exists():
        return Response(
            {'error': 'Shelter access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    data = request.data.copy()

    data['status'] = 'SCHEDULED'

    serializer = AppointmentSerializer(
        data=data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    appointment = serializer.save(
        shelter=request.user
    )

    return Response(
        AppointmentSerializer(
            appointment
        ).data,
        status=status.HTTP_201_CREATED
    )

# =========================================================
# USER - CREATE VETERINARY APPOINTMENT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def create_vet_appointment(request):

    data = request.data.copy()

    # Only normal users can create veterinary appointments
    if request.user.groups.filter(name='Vet').exists():
        return Response(
            {
                'error':
                'Vet accounts cannot create veterinary appointments.'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # ---------------------------------------------------------
    # DETERMINE BOOKING SOURCE
    # ---------------------------------------------------------

    booking_source = data.get(
        'booking_source',
        'STANDARD'
    )

    if booking_source not in [
        'STANDARD',
        'TRAINING_REWARD',
    ]:
        return Response(
            {'error': 'Invalid booking source.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    is_training_reward = (
        booking_source == 'TRAINING_REWARD'
    )

    # ---------------------------------------------------------
    # TRAINING REWARD VALIDATION
    # ---------------------------------------------------------

    training_reward = None

    if is_training_reward:
        try:
            training_reward = TrainingReward.objects.select_for_update().get(
                user=request.user
            )
        except TrainingReward.DoesNotExist:
            return Response(
                {
                    'error':
                        'Training reward has not been unlocked.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if training_reward.status != 'AVAILABLE':
            return Response(
                {
                    'error':
                        'This training reward has already been redeemed.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Training reward can ONLY be used for this service.
        data['appointment_type'] = 'VETERINARY_APPOINTMENT'

    # ---------------------------------------------------------
    # REQUIRED FIELDS
    # ---------------------------------------------------------

    required_fields = [
        'pet_name',
        'species',
        'date',
        'time',
        'appointment_type',
    ]

    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field} is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # ---------------------------------------------------------
    # DATE VALIDATION
    # ---------------------------------------------------------

    try:
        appointment_date = date.fromisoformat(
            data.get('date')
        )
    except (TypeError, ValueError):
        return Response(
            {'error': 'Invalid appointment date.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if appointment_date < date.today():
        return Response(
            {
                'error':
                    'Appointment date cannot be in the past.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # VETERINARY APPOINTMENT TYPES
    # ---------------------------------------------------------

    veterinary_types = [
        'FOLLOW_UP',
        'GENERAL_CONSULTATION',
        'VETERINARY_APPOINTMENT',
        'VACCINATION',
    ]

    if data.get('appointment_type') not in veterinary_types:
        return Response(
            {
                'error':
                    'Invalid veterinary appointment type.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # VALIDATE SELECTED VETERINARY CLINIC
    # ---------------------------------------------------------

    clinic_name = str(data.get('vet_clinic') or '').strip()

    clinic = VeterinaryClinic.objects.filter(
        name=clinic_name,
        active=True,
    ).first()

    if clinic is None:
        return Response(
            {
                'error': 'Please select a valid veterinary clinic.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ---------------------------------------------------------
    # CREATE APPOINTMENT
    # ---------------------------------------------------------

    appointment = Appointment.objects.create(
        adopter=request.user,

        vet_clinic=clinic.name,

        adopter_name=(
            request.user.profile.full_name
            if hasattr(request.user, 'profile')
            and request.user.profile.full_name
            else request.user.username
        ),

        adopter_email=request.user.email,

        owner_phone=(
            request.user.profile.phone
            if hasattr(request.user, 'profile')
            else ''
        ),

        pet_name=data.get('pet_name'),
        species=data.get('species'),

        date=data.get('date'),
        time=data.get('time'),

        appointment_type=data.get(
            'appointment_type'
        ),

        booking_source=booking_source,

        is_free=is_training_reward,

        notes=data.get(
            'notes',
            ''
        ),

        status='SCHEDULED',
    )

    # ---------------------------------------------------------
    # MARK TRAINING REWARD AS REDEEMED
    # ---------------------------------------------------------

    if (
        is_training_reward
        and training_reward is not None
    ):
        training_reward.status = 'REDEEMED'
        training_reward.appointment = appointment
        training_reward.redeemed_at = timezone.now()

        training_reward.save(
            update_fields=[
                'status',
                'appointment',
                'redeemed_at',
            ]
        )

    # ---------------------------------------------------------
    # NOTIFY ALL VETS ABOUT THE NEW APPOINTMENT
    # ---------------------------------------------------------

    clinic = VeterinaryClinic.objects.filter(
        name=appointment.vet_clinic,
        active=True,
        vet_user__isnull=False,
        vet_user__is_active=True,
        vet_user__groups__name='Vet',
    ).select_related('vet_user').first()

    vets = [clinic.vet_user] if clinic else []

    appointment_type_display = (
        appointment.get_appointment_type_display()
    )

    for vet in vets:

        if is_training_reward:
            notification_title = (
                'New Training Reward Appointment'
            )

            notification_message = (
                f'New complimentary '
                f'{appointment_type_display} appointment '
                f'for {appointment.pet_name} on '
                f'{appointment.date} at '
                f'{appointment.time}.'
            )

        else:
            notification_title = (
                'New Veterinary Appointment'
            )

            notification_message = (
                f'New {appointment_type_display} '
                f'appointment for '
                f'{appointment.pet_name} on '
                f'{appointment.date} at '
                f'{appointment.time}.'
            )

        Notification.objects.create(
            recipient=vet,
            title=notification_title,
            message=notification_message,
            notification_type='appointment',
        )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    response_data = AppointmentSerializer(
        appointment
    ).data

    response_data['training_reward_redeemed'] = (
        is_training_reward
    )

    response_data['is_free'] = (
        appointment.is_free
    )

    response_data['booking_source'] = (
        appointment.booking_source
    )

    return Response(
        response_data,
        status=status.HTTP_201_CREATED
    )

# =========================================================
# VET - VIEW APPOINTMENTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_appointments(request):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointments = Appointment.objects.filter(
        vet=request.user
    ).order_by(
        'date',
        'time'
    )

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(
        serializer.data
    )


# =========================================================
# VET - VIEW ALL UNASSIGNED APPOINTMENTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_available_appointments(request):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        clinic = VeterinaryClinic.objects.get(
            vet_user=request.user,
            active=True
        )
    except VeterinaryClinic.DoesNotExist:
        return Response(
            {'error': 'No active veterinary clinic assigned to this account.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointments = Appointment.objects.filter(
        vet__isnull=True,
        vet_clinic=clinic.name,
        status='SCHEDULED',
        appointment_type__in=[
            'FOLLOW_UP',
            'GENERAL_CONSULTATION',
            'VETERINARY_APPOINTMENT',
            'VACCINATION',
        ]
    ).order_by('date', 'time')

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# VET - CLAIM APPOINTMENT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_claim_appointment(request, appointment_id):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        clinic = VeterinaryClinic.objects.get(
            vet_user=request.user,
            active=True
        )
    except VeterinaryClinic.DoesNotExist:
        return Response(
            {'error': 'No active veterinary clinic assigned.'},
            status=status.HTTP_403_FORBIDDEN
        )

    with transaction.atomic():
        updated = Appointment.objects.filter(
            id=appointment_id,
            vet__isnull=True,
            vet_clinic=clinic.name,
            status='SCHEDULED',
            appointment_type__in=[
                'FOLLOW_UP',
                'GENERAL_CONSULTATION',
                'VETERINARY_APPOINTMENT',
                'VACCINATION',
            ],
        ).update(vet=request.user)

        if updated == 0:
            return Response(
                {
                    'error': (
                        'Appointment not available, already claimed, '
                        'or belongs to another clinic.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        appointment = Appointment.objects.get(id=appointment_id)

    return Response(
        AppointmentSerializer(appointment).data
    )


# =========================================================
# VET - UPDATE STATUS
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_update_status(
    request,
    appointment_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:

        appointment = Appointment.objects.get(
            id=appointment_id
        )

    except Appointment.DoesNotExist:

        return Response(
            {'error': 'Appointment not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if appointment.vet != request.user:
        return Response(
            {'error': 'This appointment is not assigned to you.'},
            status=status.HTTP_403_FORBIDDEN
        )

    new_status = request.data.get(
        'status'
    )

    # Define valid status transitions
    allowed_transitions = {
        'SCHEDULED': [
            'IN_PROGRESS',
            'CANCELLED',
        ],
        'IN_PROGRESS': [
            'COMPLETED',
            'CANCELLED',
        ],
        'COMPLETED': [],
        'CANCELLED': [],
    }

    # Check whether the requested transition is valid
    if new_status not in allowed_transitions.get(
        appointment.status,
        []
    ):
        return Response(
            {
                'error':
                f'Cannot change appointment status from '
                f'{appointment.status} to {new_status}.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    appointment.status = new_status

    appointment.save()

    return Response(
        AppointmentSerializer(
            appointment
        ).data
    )


# =========================================================
# VET - SAVE MEDICAL NOTES
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_save_notes(
    request,
    appointment_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:

        appointment = Appointment.objects.get(
            id=appointment_id
        )

    except Appointment.DoesNotExist:

        return Response(
            {'error': 'Appointment not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if appointment.vet != request.user:
        return Response(
            {'error': 'This appointment is not assigned to you.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointment.medical_notes = request.data.get(
        'medical_notes',
        appointment.medical_notes
    )

    appointment.save()

    return Response(
        AppointmentSerializer(
            appointment
        ).data
    )


# =========================================================
# USER - MY APPOINTMENTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_appointments(request):

    appointments = Appointment.objects.filter(
        adopter=request.user
    ).order_by(
        '-date',
        '-time'
    )

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(
        serializer.data
    )

# =========================================================
# USER - BOOK APPOINTMENT
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def book_appointment(request, appointment_id):

    with transaction.atomic():

        try:
            appointment = Appointment.objects.select_for_update().get(
                id=appointment_id
            )

        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cannot book a cancelled appointment
        if appointment.status == 'CANCELLED':
            return Response(
                {'error': 'This appointment has been cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cannot book an appointment that already belongs to someone
        if appointment.adopter is not None:
            return Response(
                {
                    'error':
                    'This appointment slot has already been booked.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the animal being viewed by the user
        animal_id = request.data.get('animal')

        if not animal_id:
            return Response(
                {'error': 'Animal is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            animal = AdoptionAnimal.objects.get(
                id=animal_id
            )

        except AdoptionAnimal.DoesNotExist:
            return Response(
                {'error': 'Animal not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    # Make sure the appointment belongs to the same shelter
    # that owns the animal.
    #
    # Appointment.shelter stores the Django User.
    # AdoptionAnimal.shelter stores the Shelter profile.
    # Therefore compare the Shelter profile's user.

    if (
        appointment.shelter is None
        or animal.shelter is None
        or animal.shelter.user != appointment.shelter
    ):
        return Response(
            {
                'error':
                'This appointment slot does not belong to '
                'this animal\'s shelter.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

        # Link appointment to logged-in user
        appointment.adopter = request.user

        # Link appointment to the selected animal
        appointment.animal = animal
        appointment.pet_name = animal.name
        appointment.species = animal.species

        # Get user's profile information
        try:
            profile = request.user.profile

            appointment.adopter_name = (
                profile.full_name
                or request.user.username
            )

            appointment.owner_phone = (
                profile.phone
                or ''
            )

        except Exception:
            appointment.adopter_name = request.user.username
            appointment.owner_phone = ''

        appointment.adopter_email = request.user.email

        appointment.save()

    return Response(
        AppointmentSerializer(
            appointment
        ).data,
        status=status.HTTP_200_OK
    )

# =========================================================
# USER - VIEW AVAILABLE APPOINTMENT SLOTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def available_appointments(request):

    appointments = Appointment.objects.filter(
        adopter__isnull=True,
        status='SCHEDULED'
    ).order_by(
        'date',
        'time'
    )

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(
        serializer.data
    )

# =========================================================
# ADMIN - VIEW VETERINARY APPOINTMENTS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_vet_appointments(request):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointments = Appointment.objects.filter(
        appointment_type__in=[
            'FOLLOW_UP',
            'GENERAL_CONSULTATION',
            'VETERINARY_APPOINTMENT',
            'VACCINATION',
        ]
    ).order_by(
        'date',
        'time'
    )

    serializer = AppointmentSerializer(
        appointments,
        many=True
    )

    return Response(
        serializer.data
    )

# =========================================================
# ADMIN - UPDATE VETERINARY APPOINTMENT STATUS
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_update_appointment_status(
    request,
    appointment_id
):

    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        appointment = Appointment.objects.get(
            id=appointment_id
        )

    except Appointment.DoesNotExist:
        return Response(
            {'error': 'Appointment not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')

    allowed_statuses = [
        'SCHEDULED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
    ]

    if new_status not in allowed_statuses:
        return Response(
            {'error': 'Invalid appointment status.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    appointment.status = new_status
    appointment.save()

    return Response(
        AppointmentSerializer(
            appointment
        ).data,
        status=status.HTTP_200_OK
    )

# =========================================================
# SHELTER - UPDATE APPOINTMENT STATUS
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shelter_update_appointment_status(
    request,
    appointment_id
):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        appointment = Appointment.objects.get(
            id=appointment_id,
            shelter=request.user
        )

    except Appointment.DoesNotExist:
        return Response(
            {'error': 'Appointment not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')

    allowed_statuses = [
        'SCHEDULED',
        'COMPLETED',
        'CANCELLED',
    ]

    if new_status not in allowed_statuses:
        return Response(
            {'error': 'Invalid appointment status.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    appointment.status = new_status
    appointment.save()

    return Response(
        AppointmentSerializer(
            appointment
        ).data,
        status=status.HTTP_200_OK
    )

# =========================================================
# VET - DASHBOARD
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_dashboard(request):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    today = date.today()

    # Only appointments assigned to the logged-in vet
    appointments = Appointment.objects.filter(
        vet=request.user
    )

    # -----------------------------------------------------
    # TOP STATISTICS
    # -----------------------------------------------------

    todays_appointments = appointments.filter(
        date=today
    ).count()

    upcoming_appointments = appointments.filter(
        date__gte=today,
        date__lte=today + timedelta(days=7),
    ).exclude(
        status='CANCELLED'
    ).count()

    completed_today = appointments.filter(
        date=today,
        status='COMPLETED'
    ).count()

    scheduled_appointments = appointments.filter(
        status='SCHEDULED'
    ).count()

    # -----------------------------------------------------
    # WEEKLY APPOINTMENTS
    # Monday -> Sunday
    # -----------------------------------------------------

    week_start = today - timedelta(days=today.weekday())

    weekly_appointments = []

    for i in range(7):
        current_day = week_start + timedelta(days=i)

        day_appointments = appointments.filter(
            date=current_day
        )

        weekly_appointments.append({
            'day': current_day.strftime('%a'),
            'date': current_day.isoformat(),
            'appointments': day_appointments.count(),
            'completed': day_appointments.filter(
                status='COMPLETED'
            ).count(),
        })

    # -----------------------------------------------------
    # TODAY'S SCHEDULE
    # -----------------------------------------------------

    today_data = appointments.filter(
        date=today
    ).order_by('time')

    today_schedule = []

    for appointment in today_data:
        today_schedule.append({
            'id': appointment.id,
            'time': appointment.time,
            'pet': appointment.pet_name or 'Unknown Pet',
            'owner': appointment.adopter_name or 'Unknown Owner',
            'species': appointment.species,
            'type': appointment.get_appointment_type_display(),
            'status': appointment.get_status_display(),
        })

    # -----------------------------------------------------
    # APPOINTMENT STATUS SUMMARY
    # -----------------------------------------------------

    status_summary = {
        'scheduled': appointments.filter(
            status='SCHEDULED'
        ).count(),

        'in_progress': appointments.filter(
            status='IN_PROGRESS'
        ).count(),

        'completed': appointments.filter(
            status='COMPLETED'
        ).count(),

        'cancelled': appointments.filter(
            status='CANCELLED'
        ).count(),
    }

    return Response({
        'stats': {
            'todays_appointments': todays_appointments,
            'upcoming_appointments': upcoming_appointments,
            'completed_today': completed_today,
            'scheduled_appointments': scheduled_appointments,
        },

        'weekly_appointments': weekly_appointments,

        'today_schedule': today_schedule,

        'status_summary': status_summary,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_profile_appointments(request):
    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    appointments = Appointment.objects.filter(
        vet=request.user
    ).order_by('date', 'time')

    data = []

    for appointment in appointments:
        data.append({
            'id': appointment.id,
            'date': appointment.date,
            'time': appointment.time,
            'pet_name': appointment.pet_name,
            'adopter_name': appointment.adopter_name,
            'appointment_type': appointment.get_appointment_type_display(),
            'status': appointment.status,
        })

    return Response(data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vet_health_records(request):
    if not request.user.groups.filter(name='Vet').exists():
        return Response({'error': 'Vet access required.'}, status=403)

    if request.method == 'GET':
        records = HealthRecord.objects.filter(vet=request.user).select_related(
            'animal', 'owner', 'vet'
        )
        serializer = HealthRecordSerializer(records, many=True)
        return Response(serializer.data)

    serializer = HealthRecordSerializer(data=request.data)

    if serializer.is_valid():
        record = serializer.save(vet=request.user)

        # Automatically use the animal's owner if an animal was selected
        if record.animal and not record.owner:
            record.owner = getattr(record.animal, 'adopter', None)
            record.save(update_fields=['owner'])

        return Response(
            HealthRecordSerializer(record).data,
            status=201
        )

    return Response(serializer.errors, status=400)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def vet_health_record_detail(request, record_id):
    if not request.user.groups.filter(name='Vet').exists():
        return Response({'error': 'Vet access required.'}, status=403)

    try:
        record = HealthRecord.objects.get(
            id=record_id,
            vet=request.user
        )
    except HealthRecord.DoesNotExist:
        return Response(
            {'error': 'Health record not found.'},
            status=404
        )

    if request.method in ['PUT', 'PATCH']:
        serializer = HealthRecordSerializer(
            record,
            data=request.data,
            partial=(request.method == 'PATCH')
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)

    record.delete()

    return Response(
        {'message': 'Health record deleted successfully.'},
        status=204
    )

# =========================================================
# VET - VACCINATION RECORDS
# =========================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vet_vaccination_records(request):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # GET
    if request.method == 'GET':

        records = VaccinationRecord.objects.filter(
            vet=request.user
        ).select_related(
            'animal',
            'owner',
            'vet'
        )

        serializer = VaccinationRecordSerializer(
            records,
            many=True
        )

        return Response(serializer.data)

    # POST
    serializer = VaccinationRecordSerializer(
        data=request.data
    )

    if serializer.is_valid():

        record = serializer.save(
            vet=request.user
        )

        # Automatically use the logged-in vet's name
        if not record.administered_by:
            record.administered_by = (
                request.user.get_full_name()
                or request.user.username
            )
            record.save(
                update_fields=['administered_by']
            )

        return Response(
            VaccinationRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# VET - MARK VACCINATION ADMINISTERED
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_mark_vaccination_administered(
    request,
    record_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        record = VaccinationRecord.objects.get(
            id=record_id,
            vet=request.user
        )

    except VaccinationRecord.DoesNotExist:
        return Response(
            {'error': 'Vaccination record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    today = timezone.now().date()

    record.date_given = today

    if not record.administered_by:
        record.administered_by = (
            request.user.get_full_name()
            or request.user.username
        )

    record.save()

    return Response(
        VaccinationRecordSerializer(record).data
    )


# =========================================================
# VET - DELETE VACCINATION RECORD
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def vet_delete_vaccination_record(
    request,
    record_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        record = VaccinationRecord.objects.get(
            id=record_id,
            vet=request.user
        )

    except VaccinationRecord.DoesNotExist:
        return Response(
            {'error': 'Vaccination record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    record.delete()

    return Response(
        {'message': 'Vaccination record deleted successfully.'},
        status=status.HTTP_204_NO_CONTENT
    )

# =========================================================
# VET - TREATMENT RECORDS
# =========================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vet_treatment_records(request):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # GET
    if request.method == 'GET':

        records = TreatmentRecord.objects.filter(
            vet=request.user
        ).select_related(
            'animal',
            'owner',
            'vet'
        )

        serializer = TreatmentRecordSerializer(
            records,
            many=True
        )

        return Response(serializer.data)

    # POST
    serializer = TreatmentRecordSerializer(
        data=request.data
    )

    if serializer.is_valid():

        record = serializer.save(
            vet=request.user
        )

        return Response(
            TreatmentRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


# =========================================================
# VET - UPDATE TREATMENT STATUS
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_update_treatment_status(
    request,
    record_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Vet access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        record = TreatmentRecord.objects.get(
            id=record_id,
            vet=request.user
        )

    except TreatmentRecord.DoesNotExist:
        return Response(
            {'error': 'Treatment record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')

    allowed_statuses = [
        'ACTIVE',
        'COMPLETED',
        'ON_HOLD',
    ]

    if new_status not in allowed_statuses:
        return Response(
            {'error': 'Invalid treatment status.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    record.status = new_status
    record.save()

    return Response(
        TreatmentRecordSerializer(record).data
    )


# =========================================================
# VET - DELETE TREATMENT RECORD
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def vet_delete_treatment_record(
    request,
    record_id
):

    if not request.user.groups.filter(name='Vet').exists():
        return Response(
            {'error': 'Treatment record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        record = TreatmentRecord.objects.get(
            id=record_id,
            vet=request.user
        )

    except TreatmentRecord.DoesNotExist:
        return Response(
            {'error': 'Treatment record not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    record.delete()

    return Response(
        {'message': 'Treatment record deleted successfully.'},
        status=status.HTTP_204_NO_CONTENT
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def schedule_meet_and_greet(request):
    """
    Shelter schedules a Meet & Greet for an approved
    adoption application.
    """

    # ---------------------------------------------------------
    # GET SHELTER
    # ---------------------------------------------------------

    try:
        shelter = Shelter.objects.get(user=request.user)
    except Shelter.DoesNotExist:
        return Response(
            {
                'error': 'Only shelter accounts can schedule a Meet & Greet.'
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # ---------------------------------------------------------
    # GET REQUEST DATA
    # ---------------------------------------------------------

    application_id = request.data.get('application_id')
    appointment_date = request.data.get('date')
    appointment_time = request.data.get('time')
    notes = request.data.get('notes', '').strip()

    if not application_id:
        return Response(
            {
                'error': 'Adoption application is required.'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not appointment_date:
        return Response(
            {
                'error': 'Meet & Greet date is required.'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not appointment_time:
        return Response(
            {
                'error': 'Meet & Greet time is required.'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # GET APPLICATION
    # ---------------------------------------------------------

    try:
        application = AdoptionApplication.objects.select_related(
            'animal',
            'applicant',
            'animal__shelter',
        ).get(
            id=application_id,
            animal__shelter=shelter,
        )
    except AdoptionApplication.DoesNotExist:
        return Response(
            {
                'error': 'Adoption application was not found.'
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    # ---------------------------------------------------------
    # CHECK APPLICATION STATUS
    # ---------------------------------------------------------

    if application.status != 'APPROVED':
        return Response(
            {
                'error': (
                    'Only approved adoption applications '
                    'can proceed to a Meet & Greet.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # PREVENT DUPLICATE APPOINTMENT
    # ---------------------------------------------------------

    if Appointment.objects.filter(
        adoption_application=application
    ).exists():
        return Response(
            {
                'error': (
                    'A Meet & Greet has already been '
                    'scheduled for this application.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # CHECK ANIMAL
    # ---------------------------------------------------------

    animal = application.animal

    if not animal.active:
        return Response(
            {
                'error': 'This animal is no longer active.'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if animal.status == 'ADOPTED':
        return Response(
            {
                'error': 'This animal has already been adopted.'
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # CREATE MEET & GREET
    # ---------------------------------------------------------

    appointment = Appointment.objects.create(
        # Link to approved adoption application
        adoption_application=application,

        # Related records
        animal=animal,
        adopter=application.applicant,
        shelter=request.user,

        # Display information
        pet_name=animal.name,
        species=animal.species,
        adopter_name=application.full_name,
        adopter_email=application.email,
        owner_phone=application.phone,

        # Meet & Greet details
        date=appointment_date,
        time=appointment_time,
        appointment_type='MEET_AND_GREET',
        status='SCHEDULED',

        notes=notes,
    )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return Response(
        {
            'message': 'Meet & Greet scheduled successfully.',
            'appointment': AppointmentSerializer(
                appointment
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )