from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.db.models.functions import TruncMonth
from django.db.models import Count, Sum
import random

from rest_framework import generics, serializers,status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP, UserProfile, Shelter
from training.models import TrainingBadge

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_detail(request, shelter_id):
    try:
        shelter = Shelter.objects.get(id=shelter_id)
    except Shelter.DoesNotExist:
        return Response(
            {'detail': 'Shelter not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response({
        'id': shelter.id,
        'name': shelter.name,
        'address': shelter.address,
        'phone': shelter.phone,
        'email': shelter.email,
        'description': shelter.description,
        'capacity': shelter.capacity,
        'current_animals': shelter.current_animals,
        'image': shelter.image,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_list(request):
    shelters = Shelter.objects.all().order_by('id')

    return Response([
        {
            'id': shelter.id,
            'name': shelter.name,
            'address': shelter.address,
            'phone': shelter.phone,
            'email': shelter.email,
            'description': shelter.description,
            'capacity': shelter.capacity,
            'current_animals': shelter.current_animals,
            'image': shelter.image,
        }
        for shelter in shelters
    ])

# =========================================================
# REGISTER SERIALIZER
# =========================================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )

        # New registered accounts are normal users
        user_group, _ = Group.objects.get_or_create(name='User')
        user.groups.add(user_group)

        # Create user profile
        UserProfile.objects.get_or_create(user=user)

        return user


# =========================================================
# ORIGINAL REGISTER VIEW
# =========================================================

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


# =========================================================
# SEND OTP
# =========================================================

@api_view(['POST'])
def send_otp(request):

    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {'error': 'Username, email and password are required'},
            status=400
        )

    # Check whether username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=400
        )

    # Check whether email already exists
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email is already registered'},
            status=400
        )

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Remove old OTP for this email
    EmailOTP.objects.filter(email=email).delete()

    # Save OTP information
    EmailOTP.objects.create(
        email=email,
        username=username,
        password=password,
        otp=otp
    )

    # Send email
    try:
        send_mail(
            subject='Pawtopia Email Verification',
            message=(
                f'Hello {username},\n\n'
                f'Your Pawtopia email verification code is:\n\n'
                f'{otp}\n\n'
                f'This code is valid for 10 minutes.\n\n'
                f'If you did not create a Pawtopia account, '
                f'please ignore this email.\n\n'
                f'Thank you,\n'
                f'Pawtopia Team'
            ),
            from_email=None,
            recipient_list=[email],
            fail_silently=False,
        )

    except Exception as e:
        # If email fails, remove the OTP record
        EmailOTP.objects.filter(email=email).delete()

        return Response(
            {
                'error': 'Unable to send verification email.',
                'details': str(e)
            },
            status=500
        )

    return Response(
        {
            'message': 'OTP sent successfully'
        },
        status=200
    )


# =========================================================
# VERIFY OTP
# =========================================================

@api_view(['POST'])
def verify_otp(request):

    email = request.data.get('email')
    otp = request.data.get('otp')

    if not email or not otp:
        return Response(
            {'error': 'Email and OTP are required'},
            status=400
        )

    try:
        otp_record = EmailOTP.objects.get(email=email)

    except EmailOTP.DoesNotExist:
        return Response(
            {'error': 'OTP not found. Please request a new OTP.'},
            status=400
        )

    # OTP expires after 10 minutes
    if timezone.now() > otp_record.created_at + timedelta(minutes=10):

        otp_record.delete()

        return Response(
            {'error': 'OTP has expired. Please request a new OTP.'},
            status=400
        )

    # Check OTP
    if otp_record.otp != otp:

        return Response(
            {'error': 'Invalid OTP'},
            status=400
        )

    # Make sure the email/username haven't been registered
    if User.objects.filter(email=email).exists():

        otp_record.delete()

        return Response(
            {'error': 'Email is already registered'},
            status=400
        )

    if User.objects.filter(username=otp_record.username).exists():

        otp_record.delete()

        return Response(
            {'error': 'Username already exists'},
            status=400
        )

    # =====================================================
    # CREATE USER AFTER OTP VERIFICATION
    # =====================================================

    user = User.objects.create_user(
        username=otp_record.username,
        email=otp_record.email,
        password=otp_record.password
    )

    # Add normal User group
    user_group, _ = Group.objects.get_or_create(name='User')
    user.groups.add(user_group)

    # Remove OTP after successful verification
    otp_record.delete()

    # =====================================================
    # LOGIN USER AUTOMATICALLY
    # =====================================================

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            'message': 'Account created successfully',

            'access': str(refresh.access_token),

            'refresh': str(refresh),

            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'role': 'user',
            }
        },
        status=201
    )


# =========================================================
# ORIGINAL LOGIN
# =========================================================

@api_view(['POST'])
def login_view(request):

    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=400
        )

    try:
        user = User.objects.get(email=email)

    except User.DoesNotExist:
        return Response(
            {'error': 'This email is not registered'},
            status=400
        )

    authenticated_user = authenticate(
        username=user.username,
        password=password
    )

    if authenticated_user is None:
        return Response(
            {'error': 'Invalid password'},
            status=400
        )

    # Determine role from Django Groups
    if authenticated_user.groups.filter(name='Admin').exists():
        role = 'admin'

    elif authenticated_user.groups.filter(name='Shelter').exists():
        role = 'shelter'

    elif authenticated_user.groups.filter(name='Vet').exists():
        role = 'vet'

    else:
        role = 'user'

    refresh = RefreshToken.for_user(authenticated_user)

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),

        'user': {
            'id': authenticated_user.id,
            'email': authenticated_user.email,
            'username': authenticated_user.username,
            'role': role,
        }
    })

# =========================================================
# USER PROFILE
# =========================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):

    profile, created = UserProfile.objects.get_or_create(
        user=request.user
    )

    if request.method == 'GET':

        badges = TrainingBadge.objects.filter(
            user=request.user
        ).select_related('training')

        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'full_name': profile.full_name,
            'phone': profile.phone,
            'address': profile.address,
            'bio': profile.bio,
            'profile_prompt_seen': profile.profile_prompt_seen,
            'profile_photo': (
                request.build_absolute_uri(
                    profile.profile_photo.url
                )
                if profile.profile_photo
                else None
            ),
            'badges': [
                {
                    'id': badge.id,
                    'training_id': badge.training.id,
                    'training_title': badge.training.title,
                    'earned_at': badge.earned_at,
                }
                for badge in badges
            ],
        })

    # PUT

    
    # Update Django User account information
    username = str(
        request.data.get('username', request.user.username)
    ).strip()

    if not username:
        return Response(
            {'error': 'Username is required', 'field': 'username'},
            status=400
        )

    if len(username) > 150:
        return Response(
            {'error': 'Username must not exceed 150 characters', 'field': 'username'},
            status=400
        )

    if User.objects.filter(
        username__iexact=username
    ).exclude(id=request.user.id).exists():
        return Response(
            {'error': 'Username already exists', 'field': 'username'},
            status=400
        )

    # Email cannot be changed through Edit Profile
    if 'email' in request.data:
        submitted_email = str(request.data.get('email', '')).strip()

        if submitted_email.lower() != request.user.email.lower():
            return Response(
                {'error': 'Email address cannot be changed', 'field': 'email'},
                status=400
            )

    request.user.username = username
    request.user.save(update_fields=['username'])

    # Update UserProfile information
    profile.full_name = request.data.get(
        'full_name',
        profile.full_name
    )

    profile.phone = request.data.get(
        'phone',
        profile.phone
    )

    profile.address = request.data.get(
        'address',
        profile.address
    )

    profile.bio = request.data.get(
        'bio',
        profile.bio
    )

    if 'profile_photo' in request.FILES:
        profile.profile_photo = request.FILES['profile_photo']

    if 'profile_prompt_seen' in request.data:
        value = request.data.get('profile_prompt_seen')
        profile.profile_prompt_seen = str(value).lower() == 'true'

    profile.save()

    return Response({
        'message': 'Profile updated successfully',
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email,
        'full_name': profile.full_name,
        'phone': profile.phone,
        'address': profile.address,
        'bio': profile.bio,
        'profile_prompt_seen': profile.profile_prompt_seen,
        'profile_photo': (
            request.build_absolute_uri(
                profile.profile_photo.url
            )
            if profile.profile_photo
            else None
        ),
    })

# =========================================================
# PROFILE COMPLETION POPUP
# =========================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_profile_prompt(request):

    profile, created = UserProfile.objects.get_or_create(
        user=request.user
    )

    profile.full_name = request.data.get(
        'full_name',
        profile.full_name
    )

    profile.phone = request.data.get(
        'phone',
        profile.phone
    )

    profile.profile_prompt_seen = True

    profile.save()

    return Response({
        'message': 'Profile information saved successfully',
        'full_name': profile.full_name,
        'phone': profile.phone,
        'profile_prompt_seen': True,
    })

# =========================================================
# ADMIN - VIEW USERS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):

    # Only admin accounts can access this endpoint
    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    users = User.objects.all().order_by(
        '-date_joined'
    )

    data = []

    for user in users:

        groups = list(
            user.groups.values_list(
                'name',
                flat=True
            )
        )

        role = groups[0] if groups else 'User'

        data.append({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': role,
            'status': 'Active' if user.is_active else 'Inactive',
            'joined': user.date_joined.strftime(
                '%Y-%m-%d'
            ),
        })

    return Response(data)


# =========================================================
# ADMIN - EDIT / DELETE USER
# =========================================================

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_manage_user(request, user_id):

    # Admin permission
    if not (
        request.user.is_superuser
        or request.user.groups.filter(name='Admin').exists()
    ):
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=404
        )

    # Prevent admins from modifying other admin accounts
    if target_user.is_superuser or target_user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin accounts cannot be modified here.'},
            status=403
        )

    # DELETE USER
    if request.method == 'DELETE':
        target_user.delete()

        return Response({
            'message': 'User deleted successfully.'
        })

    # EDIT USER
    username = request.data.get('username', target_user.username)
    email = request.data.get('email', target_user.email)
    role = request.data.get(
        'role',
        next(
            iter(target_user.groups.values_list('name', flat=True)),
            'User'
        )
    )
    is_active = request.data.get('is_active', target_user.is_active)

    username = str(username).strip()
    email = str(email).strip()
    role = str(role).strip().capitalize()

    if not username or not email:
        return Response(
            {'error': 'Username and email are required.'},
            status=400
        )

    if len(username) > 150 or len(email) > 254:
        return Response(
            {'error': 'Username or email is too long.'},
            status=400
        )

    if User.objects.filter(
        username__iexact=username
    ).exclude(id=target_user.id).exists():
        return Response(
            {'error': 'Username already exists.'},
            status=400
        )

    if User.objects.filter(
        email__iexact=email
    ).exclude(id=target_user.id).exists():
        return Response(
            {'error': 'Email already exists.'},
            status=400
        )

    if role not in ['User', 'Shelter', 'Vet']:
        return Response(
            {'error': 'Invalid role.'},
            status=400
        )

    if not isinstance(is_active, bool):
        return Response(
            {'error': 'is_active must be true or false.'},
            status=400
        )

    target_user.username = username
    target_user.email = email
    target_user.is_active = is_active
    target_user.save()

    group, _ = Group.objects.get_or_create(name=role)
    target_user.groups.set([group])

    return Response({
        'message': 'User updated successfully.',
        'user': {
            'id': str(target_user.id),
            'username': target_user.username,
            'email': target_user.email,
            'role': role,
            'status': (
                'Active' if target_user.is_active else 'Inactive'
            ),
        }
    })


# =========================================================
# ADMIN - VIEW SHELTERS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_shelters(request):

    if not (
        request.user.is_superuser
        or request.user.groups.filter(name='Admin').exists()
    ):
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    shelters = (
        User.objects
        .filter(groups__name='Shelter')
        .distinct()
        .order_by('-date_joined')
    )

    data = []

    for shelter in shelters:

        groups = list(
            shelter.groups.values_list(
                'name',
                flat=True
            )
        )

        role = groups[0] if groups else 'Shelter'

        data.append({
            'id': str(shelter.id),
            'username': shelter.username,
            'email': shelter.email,
            'role': role,
            'is_active': shelter.is_active,
            'date_joined': shelter.date_joined,
        })

    return Response(data)

# =========================================================
# ADMIN - EDIT / DELETE SHELTER
# =========================================================

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_manage_shelter(request, shelter_id):

    if not (
        request.user.is_superuser
        or request.user.groups.filter(name='Admin').exists()
    ):
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    try:
        shelter_user = User.objects.get(
            id=shelter_id,
            groups__name='Shelter'
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'Shelter account not found.'},
            status=404
        )

    if shelter_user.is_superuser or shelter_user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin accounts cannot be modified.'},
            status=403
        )

    if request.method == 'DELETE':
        shelter_user.is_active = False
        shelter_user.save(update_fields=['is_active'])

        return Response({
            'message': 'Shelter account deactivated successfully.'
        })

    username = str(
        request.data.get('username', shelter_user.username)
    ).strip()

    email = str(
        request.data.get('email', shelter_user.email)
    ).strip()

    is_active = request.data.get(
        'is_active',
        shelter_user.is_active
    )

    if not username or not email:
        return Response(
            {'error': 'Username and email are required.'},
            status=400
        )

    if len(username) > 150 or len(email) > 254:
        return Response(
            {'error': 'Username or email is too long.'},
            status=400
        )

    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError

    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {'error': 'Invalid email address.'},
            status=400
        )

    if User.objects.filter(
        username__iexact=username
    ).exclude(id=shelter_user.id).exists():
        return Response(
            {'error': 'Username already exists.'},
            status=400
        )

    if User.objects.filter(
        email__iexact=email
    ).exclude(id=shelter_user.id).exists():
        return Response(
            {'error': 'Email already exists.'},
            status=400
        )

    if not isinstance(is_active, bool):
        return Response(
            {'error': 'is_active must be true or false.'},
            status=400
        )

    shelter_user.username = username
    shelter_user.email = email
    shelter_user.is_active = is_active
    shelter_user.save(
        update_fields=['username', 'email', 'is_active']
    )

    return Response({
        'message': 'Shelter updated successfully.',
        'user': {
            'id': str(shelter_user.id),
            'username': shelter_user.username,
            'email': shelter_user.email,
            'role': 'Shelter',
            'is_active': shelter_user.is_active,
        }
    })


# =========================================================
# ADMIN - DASHBOARD STATISTICS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    from django.contrib.auth.models import User
    from adoptions.models import AdoptionApplication
    from donations.models import Donation
    from appointments.models import Appointment

    total_users = User.objects.filter(
        groups__name='User'
    ).distinct().count()

    adoption_requests = AdoptionApplication.objects.count()

    total_donations = Donation.objects.filter(
        status='COMPLETED'
    ).aggregate(
        total=models.Sum('amount')
    )['total'] or 0

    appointments = Appointment.objects.count()

    return Response({
        'total_users': total_users,
        'adoption_requests': adoption_requests,
        'total_donations': float(total_donations),
        'appointments': appointments,
    })

# =========================================================
# ADMIN - DASHBOARD MONTHLY STATISTICS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_monthly(request):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    from django.contrib.auth.models import User
    from adoptions.models import AdoptionApplication
    from donations.models import Donation

    users = (
        User.objects
        .filter(groups__name='User')
        .annotate(month=TruncMonth('date_joined'))
        .values('month')
        .annotate(total=Count('id', distinct=True))
        .order_by('month')
    )

    adoptions = (
        AdoptionApplication.objects
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(total=Count('id'))
        .order_by('month')
    )

    donations = (
        Donation.objects
        .filter(status='COMPLETED')
        .annotate(month=TruncMonth('created_at'))
        .values('month')
        .annotate(total=Sum('amount'))
        .order_by('month')
    )

    user_data = {
        item['month'].strftime('%Y-%m'): item['total']
        for item in users
    }

    adoption_data = {
        item['month'].strftime('%Y-%m'): item['total']
        for item in adoptions
    }

    donation_data = {
        item['month'].strftime('%Y-%m'): float(item['total'] or 0)
        for item in donations
    }

    months = sorted(
        set(user_data) |
        set(adoption_data) |
        set(donation_data)
    )

    result = []

    for month in months:
        result.append({
            'month': month,
            'users': user_data.get(month, 0),
            'adoptions': adoption_data.get(month, 0),
            'donations': donation_data.get(month, 0),
        })

    return Response(result)

# =========================================================
# ADMIN - DASHBOARD WEEKLY APPOINTMENT ACTIVITY
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_weekly(request):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    from appointments.models import Appointment
    from django.db.models.functions import TruncDate
    from django.db.models import Count
    from datetime import timedelta

    today = timezone.localdate()
    start_date = today - timedelta(days=6)

    appointments = (
        Appointment.objects
        .filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today
        )
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(total=Count('id'))
        .order_by('day')
    )

    appointment_data = {
        item['day']: item['total']
        for item in appointments
    }

    result = []

    for i in range(7):
        current_day = start_date + timedelta(days=i)

        result.append({
            'day': current_day.strftime('%a'),
            'appointments': appointment_data.get(
                current_day,
                0
            ),
        })

    return Response(result)

# =========================================================
# ADMIN - DASHBOARD RECENT ACTIVITIES
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_recent(request):

    if not request.user.groups.filter(
        name='Admin'
    ).exists():
        return Response(
            {'error': 'Admin access required.'},
            status=403
        )

    from django.contrib.auth.models import User
    from adoptions.models import AdoptionApplication
    from donations.models import Donation
    from appointments.models import Appointment

    activities = []

    # Recent user registrations
    for user in User.objects.order_by(
        '-date_joined'
    )[:5]:

        activities.append({
            'id': f'user-{user.id}',
            'type': 'user',
            'user': user.username,
            'action': 'created a new account',
            'timestamp': user.date_joined,
        })

    # Recent adoption applications
    for application in AdoptionApplication.objects.select_related(
        'applicant',
        'animal'
    ).order_by('-created_at')[:5]:

        activities.append({
            'id': f'adoption-{application.id}',
            'type': 'adoption',
            'user': application.applicant.username,
            'action': (
                f'submitted an adoption request for '
                f'{application.animal.name}'
            ),
            'timestamp': application.created_at,
        })

    # Recent donations
    for donation in Donation.objects.select_related(
        'donor'
    ).order_by('-created_at')[:5]:

        activities.append({
            'id': f'donation-{donation.id}',
            'type': 'donation',
            'user': donation.donor.username,
            'action': (
                f'donated RM {donation.amount}'
            ),
            'timestamp': donation.created_at,
        })

    # Recent appointments
    for appointment in Appointment.objects.select_related(
        'adopter'
    ).order_by('-created_at')[:5]:

        username = (
            appointment.adopter.username
            if appointment.adopter
            else appointment.adopter_name
        )

        activities.append({
            'id': f'appointment-{appointment.id}',
            'type': 'appointment',
            'user': username,
            'action': 'booked a veterinary appointment',
            'timestamp': appointment.created_at,
        })

    # Sort everything together
    activities.sort(
        key=lambda item: item['timestamp'],
        reverse=True
    )

    # Keep only the 5 most recent
    activities = activities[:5]

    result = []

    for activity in activities:
        result.append({
            'id': activity['id'],
            'type': activity['type'],
            'user': activity['user'],
            'action': activity['action'],
            'timestamp': activity['timestamp'],
        })

    return Response(result)

# =========================================================
# USER - VIEW ALL PARTNER SHELTERS
# =========================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shelter_list(request):

    shelters = Shelter.objects.all().order_by('name')

    return Response([
        {
            'id': shelter.id,
            'name': shelter.name,
            'address': shelter.address,
            'phone': shelter.phone,
            'email': shelter.email,
            'description': shelter.description,
            'capacity': shelter.capacity,
            'current_animals': shelter.current_animals,
            'image': shelter.image,
        }
        for shelter in shelters
    ])

# ==========================================
# FORGOT PASSWORD / RESET PASSWORD
# ==========================================

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import HttpResponseRedirect
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = str(request.data.get('email', '')).strip()

    if not email:
        return Response(
            {'error': 'Email is required'},
            status=400
        )

    user = User.objects.filter(email__iexact=email, is_active=True).first()

    if not user:
        return Response(
            {'error': 'This email is not registered'},
            status=404
        )

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    frontend_url = getattr(
        settings,
        'FRONTEND_URL',
        'http://localhost:5173'
    ).rstrip('/')

    reset_link = f'{frontend_url}/forgot-password?uid={uid}&token={token}'

    subject = 'Pawtopia - Reset Your Password'
    message = (
        f'Hello {user.username},\n\n'
        'We received a request to reset your Pawtopia password.\n\n'
        f'Click the link below to reset your password:\n{reset_link}\n\n'
        'If you did not request this, please ignore this email.\n\n'
        'Thank you,\n'
        'Pawtopia Team'
    )

    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False
        )
    except Exception:
        return Response(
            {'error': 'Unable to send reset email. Please try again.'},
            status=500
        )

    return Response(
        {'message': 'Password reset email sent successfully'},
        status=200
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    uid = str(request.data.get('uid', ''))
    token = str(request.data.get('token', ''))
    password = str(request.data.get('password', ''))

    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id, is_active=True)
    except (ValueError, TypeError, OverflowError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid password reset link'},
            status=400
        )

    if not default_token_generator.check_token(user, token):
        return Response(
            {'error': 'Password reset link is invalid or expired'},
            status=400
        )

    if (
        len(password) < 8
        or not any(c.isupper() for c in password)
        or not any(c.islower() for c in password)
        or not any(c.isdigit() for c in password)
        or not any(not c.isalnum() for c in password)
    ):
        return Response(
            {
                'error':
                'Password must contain at least 8 characters, '
                'one uppercase letter, one lowercase letter, '
                'one number and one special character'
            },
            status=400
        )

    user.set_password(password)
    user.save(update_fields=['password'])

    return Response(
        {'message': 'Password reset successfully'},
        status=200
    )