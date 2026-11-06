from django.urls import path

from .views import (
    RegisterView,
    login_view,
    forgot_password,
    send_otp,
    verify_otp,
    user_profile,
    complete_profile_prompt,
    admin_users,
    admin_manage_user,
    admin_manage_shelter,
    admin_dashboard_stats,
    admin_dashboard_monthly,
    admin_dashboard_weekly,
    admin_dashboard_recent,
    admin_shelters,
    shelter_detail,
    shelter_list,
)


urlpatterns = [

    # Original registration
    path(
        'register/',
        RegisterView.as_view(),
        name='register'
    ),

    # Original login
    path(
        'login/',
        login_view,
        name='login'
    ),

    # PASSWORD RESET
    path(
        'forgot-password/',
        forgot_password,
        name='forgot-password'
    ),

    # Email OTP
    path(
        'send-otp/',
        send_otp,
        name='send-otp'
    ),

    path(
        'verify-otp/',
        verify_otp,
        name='verify-otp'
    ),

    path(
        'profile/',
        user_profile,
        name='user-profile'
    ),

    path(
        'profile/complete-prompt/',
        complete_profile_prompt,
        name='complete-profile-prompt'
    ),

    # ADMIN
    path(
        'admin/users/',
        admin_users,
        name='admin-users'
    ),

    path(
        'admin/users/<int:user_id>/',
        admin_manage_user,
        name='admin-manage-user'
    ),

    path(
        'admin/shelters/<int:shelter_id>/',
        admin_manage_shelter,
        name='admin-manage-shelter'
    ),

    path(
        'admin/dashboard/',
        admin_dashboard_stats,
        name='admin-dashboard-stats'
    ),

    path(
        'admin/dashboard/monthly/',
        admin_dashboard_monthly,
        name='admin-dashboard-monthly'
    ),

    path(
        'admin/dashboard/weekly/',
        admin_dashboard_weekly,
        name='admin-dashboard-weekly'
    ),

    path(
        'admin/dashboard/recent/',
        admin_dashboard_recent,
        name='admin-dashboard-recent'
    ),

    path(
        'admin/shelters/',
        admin_shelters,
        name='admin-shelters'
    ),

    path(
        'shelters/<int:shelter_id>/',
        shelter_detail,
        name='shelter-detail'
    ),

    path(
        'shelters/',
        shelter_list,
        name='shelter-list'
    ),
]