
import os
import re
import time
import requests

from urllib.parse import urlparse, unquote

os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "core.settings"
)

import django
django.setup()

from django.apps import apps
from django.core.files.base import File
from django.core.files.storage import default_storage

Animal = next(
    model for model in apps.get_models()
    if model.__name__ == "Animal"
    and any(
        field.name == "gallery_files"
        for field in model._meta.fields
    )
)

HEADERS = {
    "User-Agent": "PawtopiaFYP/1.0 (educational animal encyclopedia)"
}

MAX_SIZE = 150 * 1024 * 1024

session = requests.Session()
session.headers.update(HEADERS)


def safe_filename(name):
    name = re.sub(r"[^a-zA-Z0-9_-]+", "_", name)
    return name.strip("_")[:80]


def download_video(animal):
    url = animal.video.name

    print(f"\nProcessing: {animal.name}")

    try:
        with session.get(
            url,
            stream=True,
            timeout=(15, 90),
            allow_redirects=True
        ) as response:

            response.raise_for_status()

            content_type = response.headers.get(
                "Content-Type", ""
            ).lower()

            if not (
                content_type.startswith("video/")
                or "application/ogg" in content_type
            ):
                print(
                    "SKIPPED: Response is not a video:",
                    content_type
                )
                return False

            length = int(
                response.headers.get(
                    "Content-Length", "0"
                )
            )

            if length > MAX_SIZE:
                print("SKIPPED: Video too large")
                return False

            extension = os.path.splitext(
                unquote(
                    urlparse(response.url).path
                )
            )[1].lower()

            if extension not in (".mp4", ".webm", ".ogv"):
                extension = ".webm"

            filename = (
                f"{animal.pk}_"
                f"{safe_filename(animal.name)}"
                f"{extension}"
            )

            relative_path = (
                f"animals/videos/{filename}"
            )

            # Do not overwrite existing files
            if default_storage.exists(relative_path):
                print("SKIPPED: File already exists")
                return False

            import tempfile

            total = 0

            with tempfile.TemporaryFile() as temp:
                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):
                    if not chunk:
                        continue

                    total += len(chunk)

                    if total > MAX_SIZE:
                        print("SKIPPED: Exceeds size limit")
                        return False

                    temp.write(chunk)

                temp.seek(0)

                saved_path = default_storage.save(
                    relative_path,
                    File(temp, name=filename)
                )

            # Update database only after file is saved
            animal.video.name = saved_path
            animal.save(update_fields=["video"])

            print(
                f"SUCCESS: {saved_path} "
                f"({total / 1024 / 1024:.1f} MB)"
            )

            return True

    except requests.RequestException as error:
        print("DOWNLOAD FAILED:", error)
        return False

    except Exception as error:
        print("FAILED:", error)
        return False


def main():
    animals = [
        animal
        for animal in Animal.objects.all()
        if animal.video
        and animal.video.name.startswith(
            ("http://", "https://")
        )
    ]

    print("================================")
    print("PAWTOPIA VIDEO IMPORT")
    print("================================")
    print("External video records:", len(animals))

    success = 0

    for animal in animals:
        if download_video(animal):
            success += 1

        time.sleep(2)

    print("\n================================")
    print("IMPORT COMPLETE")
    print("================================")
    print("Successfully imported:", success)
    print("Not imported:", len(animals) - success)


if __name__ == "__main__":
    main()
