from django.core.files.storage import default_storage

from rest_framework import serializers

from .models import Animal


class AnimalSerializer(serializers.ModelSerializer):

    # =========================================================
    # FILE UPLOAD FIELDS
    # =========================================================

    image_file = serializers.ImageField(
        required=False,
        allow_null=True
    )

    video = serializers.FileField(
        required=False,
        allow_null=True
    )

    # Uploaded gallery files
    gallery_files = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = '__all__'

    # =========================================================
    # GALLERY FILE URLS
    # =========================================================

    def get_gallery_files(self, obj):
        request = self.context.get('request')

        urls = []

        for path in obj.gallery_files or []:

            # Support old records containing full URLs
            if (
                isinstance(path, str)
                and (
                    path.startswith('http://')
                    or path.startswith('https://')
                )
            ):
                urls.append(path)
                continue

            url = default_storage.url(path)

            if request:
                url = request.build_absolute_uri(url)

            urls.append(url)

        return urls

    # =========================================================
    # REPRESENTATION
    # =========================================================

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get('request')

        # -----------------------------------------------------
        # VIDEO URL
        # -----------------------------------------------------

        if instance.video:

            try:
                video_url = instance.video.url

                if (
                    request
                    and video_url.startswith('/')
                ):
                    video_url = request.build_absolute_uri(
                        video_url
                    )

                data['video'] = video_url

            except Exception:
                data['video'] = ''

        else:
            data['video'] = ''

        # -----------------------------------------------------
        # MAIN IMAGE FILE URL
        # -----------------------------------------------------

        if instance.image_file:

            try:
                image_url = instance.image_file.url

                if (
                    request
                    and image_url.startswith('/')
                ):
                    image_url = request.build_absolute_uri(
                        image_url
                    )

                data['image_file'] = image_url

            except Exception:
                data['image_file'] = ''

        else:
            data['image_file'] = ''

        return data