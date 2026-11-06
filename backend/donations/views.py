import uuid

from django.contrib.auth.models import User

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Donation, Notification
from .serializers import DonationSerializer
from accounts.models import Shelter


# =========================================================
# CREATE DONATION
# USER
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_donation(request):
    serializer = DonationSerializer(
        data=request.data,
        context={'request': request}
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    shelter_name = serializer.validated_data['shelter']

    # Match the selected shelter with its account.
    # Do not guess if multiple shelters share the same name.
    matching_shelters = Shelter.objects.filter(
        name__iexact=shelter_name.strip()
    )

    if matching_shelters.count() != 1:
        return Response(
            {'error': 'Selected shelter could not be uniquely identified.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    shelter = matching_shelters.first()

    if shelter.user_id is None or not shelter.user.is_active:
        return Response(
            {'error': 'This shelter does not have an active account.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    donation = serializer.save(
        donor=request.user,
        shelter_account=shelter,
        transaction_id=f'TXN{uuid.uuid4().hex[:10].upper()}',
        status='PENDING_SHELTER'
    )

    Notification.objects.create(
        recipient=shelter.user,
        title='New Donation for Review',
        message=(
            f'A donation of RM {donation.amount} '
            f'to {shelter.name} is waiting for your review.'
        ),
        notification_type='donation',
        donation=donation
    )

    return Response(
        DonationSerializer(
            donation,
            context={'request': request}
        ).data,
        status=status.HTTP_201_CREATED
    )


# =========================================================
# USER - VIEW OWN DONATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_donations(request):

    donations = Donation.objects.filter(
        donor=request.user
    ).order_by('-created_at')


    serializer = DonationSerializer(
        donations,
        many=True,
        context={'request': request}
    )


    return Response(
        serializer.data
    )

# =========================================================
# SHELTER - VIEW OWN PENDING DONATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_donations(request):
    try:
        shelter = Shelter.objects.get(user=request.user)
    except Shelter.DoesNotExist:
        return Response(
            {'error': 'Shelter account required'},
            status=status.HTTP_403_FORBIDDEN
        )

    donations = Donation.objects.filter(
        shelter_account=shelter,
        status='PENDING_SHELTER'
    ).order_by('-created_at')

    serializer = DonationSerializer(
        donations,
        many=True,
        context={'request': request}
    )

    return Response(serializer.data)


# =========================================================
# SHELTER - APPROVE DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shelter_approve_donation(request, donation_id):
    try:
        shelter = Shelter.objects.get(user=request.user)
    except Shelter.DoesNotExist:
        return Response(
            {'error': 'Shelter account required'},
            status=status.HTTP_403_FORBIDDEN
        )

    updated = Donation.objects.filter(
        id=donation_id,
        shelter_account=shelter,
        status='PENDING_SHELTER'
    ).update(
        status='PENDING_ADMIN',
        shelter_remark=request.data.get('remark') or
        'Donation reviewed and approved by shelter.'
    )

    if not updated:
        return Response(
            {'error': 'Donation not found or already reviewed'},
            status=status.HTTP_404_NOT_FOUND
        )

    donation = Donation.objects.get(id=donation_id)

    Notification.objects.create(
        recipient=donation.donor,
        title='Donation Approved by Shelter',
        message=(
            f'Your donation of RM {donation.amount} '
            f'has been approved by {shelter.name} '
            f'and is awaiting Admin verification.'
        ),
        notification_type='donation',
        donation=donation
    )

    admin_users = User.objects.filter(
        groups__name='Admin',
        is_active=True
    ).distinct()

    for admin_user in admin_users:
        Notification.objects.create(
            recipient=admin_user,
            title='Donation Waiting for Admin Verification',
            message=(
                f'Donation of RM {donation.amount} '
                f'to {shelter.name} has been reviewed by Shelter.'
            ),
            notification_type='donation',
            donation=donation
        )

    return Response({
        'message': 'Donation approved by Shelter',
        'status': donation.status,
        'donation_id': donation.id
    })


# =========================================================
# SHELTER - REJECT DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def shelter_reject_donation(request, donation_id):
    try:
        shelter = Shelter.objects.get(user=request.user)
    except Shelter.DoesNotExist:
        return Response(
            {'error': 'Shelter account required'},
            status=status.HTTP_403_FORBIDDEN
        )

    updated = Donation.objects.filter(
        id=donation_id,
        shelter_account=shelter,
        status='PENDING_SHELTER'
    ).update(
        status='SHELTER_REJECTED',
        shelter_remark=request.data.get('remark') or
        'Donation rejected by shelter.'
    )

    if not updated:
        return Response(
            {'error': 'Donation not found or already reviewed'},
            status=status.HTTP_404_NOT_FOUND
        )

    donation = Donation.objects.get(id=donation_id)

    Notification.objects.create(
        recipient=donation.donor,
        title='Donation Rejected by Shelter',
        message=(
            f'Your donation of RM {donation.amount} '
            f'to {shelter.name} was rejected during shelter review.'
        ),
        notification_type='donation',
        donation=donation
    )

    return Response({
        'message': 'Donation rejected by Shelter',
        'status': donation.status,
        'donation_id': donation.id
    })


# =========================================================
# VET - VIEW DONATIONS WAITING FOR VET REVIEW
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def vet_donations(request):

    # -----------------------------------------------------
    # ONLY VET USERS
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Vet'
    ).exists():

        return Response(
            {
                'error': 'Vet access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # GET PENDING VET DONATIONS
    # -----------------------------------------------------

    donations = Donation.objects.filter(
        status='PENDING_VET'
    ).order_by('-created_at')


    serializer = DonationSerializer(
        donations,
        many=True,
        context={'request': request}
    )


    return Response(
        serializer.data
    )


# =========================================================
# VET - APPROVE DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_approve_donation(
    request,
    donation_id
):

    # -----------------------------------------------------
    # CHECK VET ROLE
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Vet'
    ).exists():

        return Response(
            {
                'error': 'Vet access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    try:

        donation = Donation.objects.get(
            id=donation_id,
            status='PENDING_VET'
        )

    except Donation.DoesNotExist:

        return Response(
            {
                'error':
                    'Donation not found or already reviewed'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # -----------------------------------------------------
    # UPDATE DONATION
    # -----------------------------------------------------

    donation.status = 'PENDING_ADMIN'

    donation.vet_remark = request.data.get(
        'remark',
        'Receipt approved by veterinary team.'
    )

    donation.save()


    # =====================================================
    # NOTIFY DONOR
    # =====================================================

    Notification.objects.create(
        recipient=donation.donor,

        title='Donation Receipt Approved by Vet',

        message=(
            f'Your donation of RM '
            f'{donation.amount} '
            f'has been approved by the veterinary team '
            f'and is now waiting for Admin verification.'
        ),

        notification_type='donation',

        donation=donation
    )


    # =====================================================
    # NOTIFY ALL ACTIVE ADMINS
    # =====================================================

    admin_users = User.objects.filter(
        groups__name='Admin',
        is_active=True
    ).distinct()


    for admin_user in admin_users:

        Notification.objects.create(
            recipient=admin_user,

            title='Donation Waiting for Admin Verification',

            message=(
                f'Donation of RM '
                f'{donation.amount} '
                f'to {donation.shelter} '
                f'has been approved by Vet '
                f'and is waiting for Admin verification.'
            ),

            notification_type='donation',

            donation=donation
        )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return Response({

        'message':
            'Donation approved by Vet',

        'status':
            donation.status,

        'donation_id':
            donation.id

    })


# =========================================================
# VET - REJECT DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vet_reject_donation(
    request,
    donation_id
):

    # -----------------------------------------------------
    # CHECK VET ROLE
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Vet'
    ).exists():

        return Response(
            {
                'error': 'Vet access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    try:

        donation = Donation.objects.get(
            id=donation_id,
            status='PENDING_VET'
        )

    except Donation.DoesNotExist:

        return Response(
            {
                'error':
                    'Donation not found or already reviewed'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # -----------------------------------------------------
    # UPDATE DONATION
    # -----------------------------------------------------

    donation.status = 'VET_REJECTED'

    donation.vet_remark = request.data.get(
        'remark',
        'Receipt rejected by veterinary team.'
    )

    donation.save()


    # =====================================================
    # NOTIFY DONOR
    # =====================================================

    Notification.objects.create(
        recipient=donation.donor,

        title='Donation Receipt Rejected',

        message=(
            f'Your donation receipt for RM '
            f'{donation.amount} '
            f'was rejected by the veterinary team. '
            f'Please review the receipt and submit again.'
        ),

        notification_type='donation',

        donation=donation
    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return Response({

        'message':
            'Donation rejected by Vet',

        'status':
            donation.status,

        'donation_id':
            donation.id

    })


# =========================================================
# ADMIN - VIEW DONATIONS WAITING FOR ADMIN REVIEW
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_donations(request):

    # -----------------------------------------------------
    # CHECK ADMIN ROLE
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Admin'
    ).exists():

        return Response(
            {
                'error':
                    'Admin access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # GET PENDING ADMIN DONATIONS
    # -----------------------------------------------------

    donations = Donation.objects.filter(
        status='PENDING_ADMIN'
    ).order_by('-created_at')


    serializer = DonationSerializer(
        donations,
        many=True,
        context={'request': request}
    )


    return Response(
        serializer.data
    )


# =========================================================
# ADMIN - APPROVE DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_donation(
    request,
    donation_id
):

    # -----------------------------------------------------
    # CHECK ADMIN ROLE
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Admin'
    ).exists():

        return Response(
            {
                'error':
                    'Admin access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    try:

        donation = Donation.objects.get(
            id=donation_id,
            status='PENDING_ADMIN'
        )

    except Donation.DoesNotExist:

        return Response(
            {
                'error':
                    'Donation not found or already reviewed'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # -----------------------------------------------------
    # UPDATE DONATION
    # -----------------------------------------------------

    donation.status = 'COMPLETED'

    donation.admin_remark = request.data.get(
        'remark',
        'Donation approved by administrator.'
    )

    donation.save()


    # =====================================================
    # NOTIFY DONOR
    # =====================================================

    Notification.objects.create(
        recipient=donation.donor,

        title='Donation Approved',

        message=(
            f'Your donation of RM '
            f'{donation.amount} '
            f'to {donation.shelter} '
            f'has been approved by the administrator. '
            f'Your donation is now completed.'
        ),

        notification_type='donation',

        donation=donation
    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return Response({

        'message':
            'Donation approved successfully',

        'status':
            donation.status,

        'donation_id':
            donation.id

    })


# =========================================================
# ADMIN - REJECT DONATION
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_donation(
    request,
    donation_id
):

    # -----------------------------------------------------
    # CHECK ADMIN ROLE
    # -----------------------------------------------------

    if not request.user.groups.filter(
        name='Admin'
    ).exists():

        return Response(
            {
                'error':
                    'Admin access required'
            },
            status=status.HTTP_403_FORBIDDEN
        )


    # -----------------------------------------------------
    # FIND DONATION
    # -----------------------------------------------------

    try:

        donation = Donation.objects.get(
            id=donation_id,
            status='PENDING_ADMIN'
        )

    except Donation.DoesNotExist:

        return Response(
            {
                'error':
                    'Donation not found or already reviewed'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    # -----------------------------------------------------
    # UPDATE DONATION
    # -----------------------------------------------------

    donation.status = 'ADMIN_REJECTED'

    donation.admin_remark = request.data.get(
        'remark',
        'Donation rejected by administrator.'
    )

    donation.save()


    # =====================================================
    # NOTIFY DONOR
    # =====================================================

    Notification.objects.create(
        recipient=donation.donor,

        title='Donation Rejected',

        message=(
            f'Your donation of RM '
            f'{donation.amount} '
            f'to {donation.shelter} '
            f'was rejected by the administrator.'
        ),

        notification_type='donation',

        donation=donation
    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return Response({

        'message':
            'Donation rejected by administrator',

        'status':
            donation.status,

        'donation_id':
            donation.id

    })


# =========================================================
# USER - VIEW NOTIFICATIONS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications(request):

    notifications = Notification.objects.filter(
        recipient=request.user
    ).order_by('-created_at')


    return Response([

        {
            'id':
                notification.id,

            'title':
                notification.title,

            'message':
                notification.message,

            'notification_type':
                notification.notification_type,

            'is_read':
                notification.is_read,

            'donation_id': (
                notification.donation.id
                if notification.donation
                else None
            ),

            'post_id':
                notification.post_id,

            'created_at':
                notification.created_at,
        }

        for notification
        in notifications

    ])


# =========================================================
# USER - MARK NOTIFICATION AS READ
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(
    request,
    notification_id
):

    try:

        notification = Notification.objects.get(
            id=notification_id,
            recipient=request.user
        )

    except Notification.DoesNotExist:

        return Response(
            {
                'error':
                    'Notification not found'
            },
            status=status.HTTP_404_NOT_FOUND
        )


    notification.is_read = True

    notification.save()


    return Response({

        'message':
            'Notification marked as read'

    })