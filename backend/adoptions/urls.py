from django.urls import path

from .views import (
    adoption_list,
    adoption_detail,
    apply_adoption,
    my_applications,
    shelter_animals,
    shelter_create_animal,
    shelter_update_animal,
    shelter_delete_animal,
    shelter_applications,
    approve_application,
    reject_application,
    complete_adoption,
    admin_applications,
    admin_approve_application,
    admin_reject_application,
    shelter_dashboard,
)


urlpatterns = [

    # USER
    path(
        '',
        adoption_list,
        name='adoption-list'
    ),

    path(
        '<int:animal_id>/',
        adoption_detail,
        name='adoption-detail'
    ),

    path(
        '<int:animal_id>/apply/',
        apply_adoption,
        name='apply-adoption'
    ),

    path(
        'my-applications/',
        my_applications,
        name='my-applications'
    ),

    # SHELTER
    path(
        'shelter/animals/',
        shelter_animals,
        name='shelter-animals'
    ),

    path(
        'shelter/animals/create/',
        shelter_create_animal,
        name='shelter-create-animal'
    ),

    path(
        'shelter/animals/<int:animal_id>/',
        shelter_update_animal,
        name='shelter-update-animal'
    ),

    path(
        'shelter/animals/<int:animal_id>/delete/',
        shelter_delete_animal,
        name='shelter-delete-animal'
    ),

    path(
        'shelter/applications/',
        shelter_applications,
        name='shelter-applications'
    ),

    path(
        'shelter/applications/<int:application_id>/approve/',
        approve_application,
        name='approve-application'
    ),

    path(
        'shelter/applications/<int:application_id>/reject/',
        reject_application,
        name='reject-application'
    ),

    path(
        'shelter/applications/<int:application_id>/complete/',
        complete_adoption,
        name='complete-adoption'
    ),

    path(
        'admin/applications/',
        admin_applications,
        name='admin-applications'
    ),

    path(
        'admin/applications/<int:application_id>/approve/',
        admin_approve_application,
        name='admin-approve-application'
    ),

    path(
        'admin/applications/<int:application_id>/reject/',
        admin_reject_application,
        name='admin-reject-application'
    ),

    path(
        'shelter-dashboard/', 
        shelter_dashboard, 
        name='shelter-dashboard'
    ),
]