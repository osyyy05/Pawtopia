from django.urls import path

from .views import (
    shelter_appointments,
    shelter_create_appointment,
    veterinary_clinics,
    nearest_veterinary_clinic,
    ai_veterinary_clinic_recommendation,
    create_vet_appointment,
    vet_appointments,
    vet_profile_appointments,
    vet_available_appointments,
    vet_health_records,
    vet_health_record_detail,
    vet_claim_appointment,
    vet_update_status,
    vet_save_notes,
    vet_dashboard,
    vet_vaccination_records,
    vet_mark_vaccination_administered,
    vet_delete_vaccination_record,
    vet_treatment_records,
    vet_update_treatment_status,
    vet_delete_treatment_record,
    my_appointments,
    book_appointment,
    available_appointments,
    admin_vet_appointments,
    admin_update_appointment_status,
    shelter_update_appointment_status,
    schedule_meet_and_greet,
)


urlpatterns = [

    # Shelter
    path(
        'shelter/',
        shelter_appointments,
        name='shelter-appointments'
    ),

    path(
        'shelter/create/',
        shelter_create_appointment,
        name='shelter-create-appointment'
    ),

    path(
        'available/',
        available_appointments,
        name='available-appointments'
    ),

    path(
        'shelter/meet-and-greet/',
        schedule_meet_and_greet,
        name='schedule-meet-and-greet',
    ),

    # Vet
    path(
        'vet/',
        vet_appointments,
        name='vet-appointments'
    ),

    path(
        'vet-profile/', 
        vet_profile_appointments, 
        name='vet-profile-appointments'
    ),

    path(
        'vet/available/',
        vet_available_appointments,
        name='vet-available-appointments'
    ),

    path(
        'vet/health-records/', 
        vet_health_records, 
        name='vet-health-records'
    ),

    path(
        'vet/health-records/<int:record_id>/', 
        vet_health_record_detail, 
        name='vet-health-record-detail'
    ),

    path(
        'vet/<int:appointment_id>/claim/',
        vet_claim_appointment,
        name='vet-claim-appointment'
    ),

    path(
        'vet/<int:appointment_id>/status/',
        vet_update_status,
        name='vet-update-status'
    ),

    path(
        'vet/<int:appointment_id>/notes/',
        vet_save_notes,
        name='vet-save-notes'
    ),


    path(
        'vet/', 
        vet_appointments, 
        name='vet-appointments'
    ),
    
    path(
        'vet/available/', 
        vet_available_appointments, 
        name='vet-available-appointments'
    ),

    path(
        'vet/<int:appointment_id>/claim/', 
        vet_claim_appointment, 
        name='vet-claim-appointment'
    ),

    path(
        'vet/<int:appointment_id>/status/', 
        vet_update_status, 
        name='vet-update-status'
    ),

    path(
        'vet/<int:appointment_id>/notes/', 
        vet_save_notes, 
        name='vet-save-notes'
    ),

    path(
        'vet-dashboard/',
        vet_dashboard,
        name='vet-dashboard'
    ),

    path(
        'vet/vaccinations/',
        vet_vaccination_records,
        name='vet-vaccination-records'
    ),

    path(
        'vet/vaccinations/<int:record_id>/administered/',
        vet_mark_vaccination_administered,
        name='vet-mark-vaccination-administered'
    ),

    path(
        'vet/vaccinations/<int:record_id>/delete/',
        vet_delete_vaccination_record,
        name='vet-delete-vaccination-record'
    ),

    path(
        'vet/treatments/',
        vet_treatment_records,
        name='vet-treatment-records'
    ),

    path(
        'vet/treatments/<int:record_id>/status/',
        vet_update_treatment_status,
        name='vet-update-treatment-status'
    ),

    path(
        'vet/treatments/<int:record_id>/delete/',
        vet_delete_treatment_record,
        name='vet-delete-treatment-record'
    ),

    # User
    path(
        'my/',
        my_appointments,
        name='my-appointments'
    ),

    path(
        '<int:appointment_id>/book/',
        book_appointment,
        name='book-appointment'
    ),

    path(
        'vet/create/',
        create_vet_appointment,
        name='create-vet-appointment'
    ),

    path(
        'clinics/',
        veterinary_clinics,
        name='veterinary-clinics'
    ),

    path(
    'nearest-clinic/',
        nearest_veterinary_clinic,
        name='nearest-veterinary-clinic'
    ),

    path(
    'ai-clinic-recommendation/',
        ai_veterinary_clinic_recommendation,
        name='ai-veterinary-clinic-recommendation'
    ),

    path(
        'admin/',
        admin_vet_appointments,
        name='admin-vet-appointments'
    ),
    path(
        'admin/<int:appointment_id>/status/',
        admin_update_appointment_status,
        name='admin-update-appointment-status'
    ),


#SHELTER
    path(
        'shelter/<int:appointment_id>/status/',
        shelter_update_appointment_status,
        name='shelter-update-appointment-status'
    ),
    ]