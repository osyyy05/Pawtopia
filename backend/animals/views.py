import json
from urllib.parse import urlparse

from django.conf import settings
from django.core.files.storage import default_storage

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Animal
from .serializers import AnimalSerializer


def get_storage_path(value):
    """
    Convert either:
    - animals/gallery/cat.jpg
    - http://127.0.0.1:8000/media/animals/gallery/cat.jpg

    into:
    animals/gallery/cat.jpg
    """
    if not value:
        return value

    if value.startswith('http://') or value.startswith('https://'):
        value = urlparse(value).path

    media_url = settings.MEDIA_URL.rstrip('/')

    if value.startswith(media_url):
        value = value[len(media_url):]

    return value.lstrip('/')


def delete_file(path):
    """Delete a file from Django media storage if it exists."""
    if path:
        path = get_storage_path(path)

        if default_storage.exists(path):
            default_storage.delete(path)


class AnimalListCreateView(generics.ListCreateAPIView):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAuthenticated(), IsAdminUser()]

    def perform_create(self, serializer):
        animal = serializer.save()

        # =========================
        # MAIN IMAGE
        # =========================
        image_file = self.request.FILES.get('image_file')

        if image_file:
            animal.image_file = image_file
            animal.save(update_fields=['image_file'])

        # =========================
        # VIDEO
        # =========================
        video = self.request.FILES.get('video')

        if video:
            animal.video = video
            animal.save(update_fields=['video'])

        # =========================
        # GALLERY IMAGES
        # =========================
        gallery_files = self.request.FILES.getlist('gallery_files')

        if gallery_files:
            paths = []

            for file in gallery_files:
                path = default_storage.save(
                    f'animals/gallery/{file.name}',
                    file
                )
                paths.append(path)

            animal.gallery_files = paths
            animal.save(update_fields=['gallery_files'])


class AnimalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Animal.objects.all()
    serializer_class = AnimalSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return []
        return [IsAuthenticated(), IsAdminUser()]

    def perform_update(self, serializer):
        animal = serializer.save()

        # ==================================================
        # DELETE MAIN IMAGE
        # ==================================================
        remove_image_file = self.request.data.get('remove_image_file')

        if str(remove_image_file).lower() == 'true':
            if animal.image_file:
                animal.image_file.delete(save=False)

            animal.image_file = None
            animal.save(update_fields=['image_file'])

        # ==================================================
        # REPLACE / UPLOAD MAIN IMAGE
        # ==================================================
        image_file = self.request.FILES.get('image_file')

        if image_file:
            # Delete old uploaded image first
            if animal.image_file:
                animal.image_file.delete(save=False)

            animal.image_file = image_file
            animal.save(update_fields=['image_file'])

        # ==================================================
        # DELETE VIDEO
        # ==================================================
        remove_video = self.request.data.get('remove_video')

        if str(remove_video).lower() == 'true':
            if animal.video:
                animal.video.delete(save=False)

            animal.video = None
            animal.save(update_fields=['video'])

        # ==================================================
        # REPLACE / UPLOAD VIDEO
        # ==================================================
        video = self.request.FILES.get('video')

        if video:
            # Delete old uploaded video first
            if animal.video:
                animal.video.delete(save=False)

            animal.video = video
            animal.save(update_fields=['video'])

        # ==================================================
        # DELETE SELECTED GALLERY IMAGES
        # ==================================================
        remove_gallery_files = self.request.data.get(
            'remove_gallery_files'
        )

        if remove_gallery_files:
            try:
                remove_list = json.loads(remove_gallery_files)
            except (json.JSONDecodeError, TypeError):
                remove_list = []

            current_gallery = animal.gallery_files or []
            remaining_gallery = []

            for stored_value in current_gallery:

                # Convert stored value to a comparable URL
                if (
                    stored_value.startswith('http://')
                    or stored_value.startswith('https://')
                ):
                    stored_url = stored_value
                else:
                    stored_url = default_storage.url(stored_value)

                    stored_url = self.request.build_absolute_uri(
                        stored_url
                    )

                if stored_url in remove_list:
                    delete_file(stored_value)
                else:
                    remaining_gallery.append(stored_value)

            animal.gallery_files = remaining_gallery
            animal.save(update_fields=['gallery_files'])

        # ==================================================
        # ADD NEW GALLERY IMAGES
        # ==================================================
        gallery_files = self.request.FILES.getlist('gallery_files')

        if gallery_files:
            current_gallery = animal.gallery_files or []

            for file in gallery_files:
                path = default_storage.save(
                    f'animals/gallery/{file.name}',
                    file
                )

                current_gallery.append(path)

            animal.gallery_files = current_gallery
            animal.save(update_fields=['gallery_files'])

    def perform_destroy(self, instance):
        # Delete uploaded main image
        if instance.image_file:
            instance.image_file.delete(save=False)

        # Delete uploaded video
        if instance.video:
            instance.video.delete(save=False)

        # Delete uploaded gallery images
        for path in instance.gallery_files or []:
            delete_file(path)

        instance.delete()