from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AdoptionAnimal, AdoptionApplication
from .serializers import (
    AdoptionAnimalSerializer,
    AdoptionApplicationSerializer,
)


# =========================================================
# USER - VIEW AVAILABLE ADOPTION ANIMALS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adoption_list(request):

    animals = AdoptionAnimal.objects.filter(
        active=True,
        status='AVAILABLE'
    ).order_by('-posted_at')

    serializer = AdoptionAnimalSerializer(
        animals,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# USER - VIEW ANIMAL DETAILS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def adoption_detail(request, animal_id):

    try:
        animal = AdoptionAnimal.objects.get(
            id=animal_id,
            active=True
        )
    except AdoptionAnimal.DoesNotExist:
        return Response(
            {'error': 'Animal not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = AdoptionAnimalSerializer(animal)

    return Response(serializer.data)


# =========================================================
# USER - APPLY FOR ADOPTION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_adoption(request, animal_id):

    try:
        animal = AdoptionAnimal.objects.get(
            id=animal_id,
            active=True
        )
    except AdoptionAnimal.DoesNotExist:
        return Response(
            {'error': 'Animal not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if animal.status != 'AVAILABLE':
        return Response(
            {'error': 'This animal is no longer available'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent duplicate pending application
    existing = AdoptionApplication.objects.filter(
        animal=animal,
        applicant=request.user,
        status='PENDING'
    ).first()

    if existing:
        return Response(
            {'error': 'You already have a pending application for this animal'},
            status=status.HTTP_400_BAD_REQUEST
        )

    data = request.data.copy()

    # Use the user's account information by default
    data['email'] = data.get(
        'email',
        request.user.email
    )

    application = AdoptionApplication.objects.create(
        animal=animal,
        applicant=request.user,
        full_name=data.get('full_name', ''),
        phone=data.get('phone', ''),
        email=data.get('email', request.user.email),
        address=data.get('address', ''),
        reason=data.get('reason', ''),
        status='PENDING'
    )

    serializer = AdoptionApplicationSerializer(
        application
    )

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED
    )


# =========================================================
# USER - VIEW OWN APPLICATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):

    applications = AdoptionApplication.objects.filter(
        applicant=request.user
    ).order_by('-created_at')

    serializer = AdoptionApplicationSerializer(
        applications,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# SHELTER - VIEW OWN ANIMALS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_animals(request):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    animals = AdoptionAnimal.objects.filter(
        shelter__user=request.user
    ).order_by('-posted_at')

    serializer = AdoptionAnimalSerializer(
        animals,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# SHELTER - CREATE ANIMAL LISTING
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shelter_create_animal(request):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AdoptionAnimalSerializer(
        data=request.data
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    animal = serializer.save(
        shelter=request.user.shelter_record
    )

    return Response(
        AdoptionAnimalSerializer(animal).data,
        status=status.HTTP_201_CREATED
    )


# =========================================================
# SHELTER - VIEW APPLICATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_applications(request):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    applications = AdoptionApplication.objects.filter(
        animal__shelter__user=request.user
    ).order_by('-created_at')

    serializer = AdoptionApplicationSerializer(
        applications,
        many=True
    )

    return Response(serializer.data)


# =========================================================
# SHELTER - APPROVE APPLICATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_application(request, application_id):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        application = AdoptionApplication.objects.get(
            id=application_id,
            animal__shelter__user=request.user,
            status='PENDING'
        )
    except AdoptionApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    application.status = 'APPROVED'

    application.shelter_remark = request.data.get(
        'remark',
        'Adoption application approved by shelter.'
    )

    application.save()

    # Application has been approved, but the adoption
    # process is not completed yet.
    # Keep the animal active and mark it as pending adoption
    # until the Meet & Greet / adoption process is completed.

    animal = application.animal
    animal.status = 'PENDING'
    animal.active = True
    animal.save()

    return Response({
        'message': 'Adoption application approved',
        'status': application.status,
        'application_id': application.id
    })


# =========================================================
# SHELTER - REJECT APPLICATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_application(request, application_id):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        application = AdoptionApplication.objects.get(
            id=application_id,
            animal__shelter__user=request.user,
            status='PENDING'
        )
    except AdoptionApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    application.status = 'REJECTED'

    application.shelter_remark = request.data.get(
        'remark',
        'Adoption application rejected by shelter.'
    )

    application.save()

    return Response({
        'message': 'Adoption application rejected',
        'status': application.status,
        'application_id': application.id
    })

# =========================================================
# SHELTER - COMPLETE ADOPTION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_adoption(request, application_id):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        application = AdoptionApplication.objects.select_related(
            'animal'
        ).get(
            id=application_id,
            animal__shelter__user=request.user,
            status='APPROVED'
        )

    except AdoptionApplication.DoesNotExist:
        return Response(
            {
                'error':
                'Approved adoption application not found.'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # -----------------------------------------------------
    # REQUIRE COMPLETED MEET & GREET
    # -----------------------------------------------------

    from appointments.models import Appointment

    completed_meet_and_greet = Appointment.objects.filter(
        adoption_application=application,
        shelter=request.user,
        appointment_type='MEET_AND_GREET',
        status='COMPLETED'
    ).exists()

    if not completed_meet_and_greet:
        return Response(
            {
                'error':
                'The Meet & Greet must be completed before '
                'the adoption can be finalised.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------------------
    # COMPLETE APPLICATION
    # -----------------------------------------------------

    application.status = 'COMPLETED'
    application.shelter_remark = request.data.get(
        'remark',
        'Adoption successfully completed.'
    )

    application.save()

    # -----------------------------------------------------
    # MARK ANIMAL AS ADOPTED
    # -----------------------------------------------------

    animal = application.animal

    animal.status = 'ADOPTED'
    animal.active = False

    animal.save()

    # -----------------------------------------------------
    # REJECT ANY OTHER PENDING APPLICATIONS FOR THIS ANIMAL
    # -----------------------------------------------------

    AdoptionApplication.objects.filter(
        animal=animal,
        status='PENDING'
    ).exclude(
        id=application.id
    ).update(
        status='REJECTED',
        shelter_remark=(
            'This animal has been adopted by another applicant.'
        )
    )

    return Response(
        {
            'message': 'Adoption completed successfully.',
            'application_id': application.id,
            'application_status': application.status,
            'animal_id': animal.id,
            'animal_status': animal.status
        },
        status=status.HTTP_200_OK
    )

# =========================================================
# SHELTER - UPDATE ANIMAL LISTING
# =========================================================

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def shelter_update_animal(request, animal_id):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        animal = AdoptionAnimal.objects.get(
            id=animal_id,
            shelter__user=request.user
        )
    except AdoptionAnimal.DoesNotExist:
        return Response(
            {'error': 'Animal listing not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = AdoptionAnimalSerializer(
        animal,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer.save()

    return Response(
        AdoptionAnimalSerializer(animal).data
    )


# =========================================================
# SHELTER - DELETE ANIMAL LISTING
# =========================================================

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def shelter_delete_animal(request, animal_id):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        animal = AdoptionAnimal.objects.get(
            id=animal_id,
            shelter__user=request.user
        )
    except AdoptionAnimal.DoesNotExist:
        return Response(
            {'error': 'Animal listing not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    animal.delete()

    return Response(
        {'message': 'Adoption listing deleted successfully'},
        status=status.HTTP_204_NO_CONTENT
    )

# =========================================================
# ADMIN - VIEW ALL ADOPTION APPLICATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_applications(request):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required.'},
            status=status.HTTP_403_FORBIDDEN
        )

    applications = AdoptionApplication.objects.select_related(
        'animal',
        'animal__shelter',
        'applicant'
    ).order_by('-created_at')

    serializer = AdoptionApplicationSerializer(
        applications,
        many=True
    )

    return Response(serializer.data)

# =========================================================
# ADMIN - APPROVE APPLICATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_application(request, application_id):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        application = AdoptionApplication.objects.get(
            id=application_id,
            status='PENDING'
        )
    except AdoptionApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    application.status = 'APPROVED'

    application.shelter_remark = request.data.get(
        'remark',
        'Adoption application approved by administrator.'
    )

    application.save()

    animal = application.animal
    animal.status = 'PENDING'
    animal.active = True
    animal.save()

    return Response({
        'message': 'Adoption application approved',
        'status': application.status,
        'application_id': application.id
    })

# =========================================================
# ADMIN - REJECT APPLICATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_application(request, application_id):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        application = AdoptionApplication.objects.get(
            id=application_id,
            status='PENDING'
        )
    except AdoptionApplication.DoesNotExist:
        return Response(
            {'error': 'Application not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    application.status = 'REJECTED'

    application.shelter_remark = request.data.get(
        'remark',
        'Adoption application rejected by administrator.'
    )

    application.save()

    return Response({
        'message': 'Adoption application rejected',
        'status': application.status,
        'application_id': application.id
    })

# =========================================================
# SHELTER - DASHBOARD
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_dashboard(request):

    if not request.user.groups.filter(
        name='Shelter'
    ).exists():
        return Response(
            {'error': 'Shelter access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    from django.utils import timezone
    from django.db.models.functions import TruncMonth, TruncDate
    from datetime import timedelta
    from appointments.models import Appointment

    shelter = request.user.shelter_record

    animals = AdoptionAnimal.objects.filter(
        shelter=shelter
    )

    applications = AdoptionApplication.objects.filter(
        animal__shelter=shelter
    )

    appointments = Appointment.objects.filter(
        shelter=request.user
    )

    # ---------------------------------------------------------
    # STATS
    # ---------------------------------------------------------

    total_animals = animals.count()

    available_animals = animals.filter(
        status='AVAILABLE'
    ).count()

    pending_applications = applications.filter(
        status='PENDING'
    ).count()

    completed_adoptions = applications.filter(
        status='COMPLETED'
    ).count()

    today = timezone.localdate()

    upcoming_appointments = appointments.filter(
        date__gte=today
    ).count()

    # ---------------------------------------------------------
    # ADOPTION TREND - LAST 6 MONTHS
    # ---------------------------------------------------------

    six_months_ago = today - timedelta(days=180)

    monthly_applications = (
        applications
        .filter(created_at__date__gte=six_months_ago)
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .order_by('month')
    )

    monthly_data = {}

    for item in monthly_applications:
        month = item['month']
        key = month.strftime('%b')

        monthly_data[key] = {
            'month': key,
            'applications': 0,
            'completed': 0,
            'rejections': 0,
        }

    for application in applications.filter(
        created_at__date__gte=six_months_ago
    ):
        key = application.created_at.strftime('%b')

        if key not in monthly_data:
            monthly_data[key] = {
                'month': key,
                'applications': 0,
                'completed': 0,
                'rejections': 0,
            }

        monthly_data[key]['applications'] += 1

        if application.status == 'COMPLETED':
            monthly_data[key]['completed'] += 1

        elif application.status == 'REJECTED':
            monthly_data[key]['rejections'] += 1

    adoption_trend = list(monthly_data.values())

    # ---------------------------------------------------------
    # WEEKLY ACTIVITY - LAST 7 DAYS
    # ---------------------------------------------------------

    week_ago = today - timedelta(days=6)

    weekly_data = []

    for i in range(7):
        current_day = week_ago + timedelta(days=i)

        rescued = animals.filter(
            posted_at__date=current_day
        ).count()

        adopted = applications.filter(
            status='COMPLETED',
            updated_at__date=current_day
        ).count()

        weekly_data.append({
            'day': current_day.strftime('%a'),
            'rescued': rescued,
            'adopted': adopted,
        })

    # ---------------------------------------------------------
    # RECENT APPLICATIONS
    # ---------------------------------------------------------

    recent_applications = applications.select_related(
        'animal'
    ).order_by('-created_at')[:5]

    # ---------------------------------------------------------
    # RECENT ANIMALS
    # ---------------------------------------------------------

    recent_animals = animals.order_by(
        '-posted_at'
    )[:5]

    return Response({

        'stats': {
            'total_animals': total_animals,
            'available_animals': available_animals,
            'pending_applications': pending_applications,
            'completed_adoptions': completed_adoptions,
            'upcoming_appointments': upcoming_appointments,
        },

        'adoption_trend': adoption_trend,

        'weekly_activity': weekly_data,

        'recent_applications': [
            {
                'id': application.id,
                'applicant': application.full_name,
                'pet': (
                    f'{application.animal.name} '
                    f'({application.animal.breed})'
                ),
                'date': application.created_at.strftime('%Y-%m-%d'),
                'status': application.status,
            }
            for application in recent_applications
        ],

        'recent_animals': [
            {
                'id': animal.id,
                'name': animal.name,
                'species': animal.species,
                'breed': animal.breed,
                'age': animal.age,
                'status': animal.status,
                'addedDate': animal.posted_at.strftime('%Y-%m-%d'),
            }
            for animal in recent_animals
        ],
    })