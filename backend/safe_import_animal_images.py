
import os
import csv
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests

# Use the same Django settings as manage.py
BASE = Path(__file__).resolve().parent
manage_text = (BASE / "manage.py").read_text(encoding="utf-8")
match = re.search(
    r"""DJANGO_SETTINGS_MODULE['"]\s*,\s*['"]([^'"]+)['"]""",
    manage_text
)

if not match:
    raise RuntimeError("Django settings not found in manage.py")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", match.group(1))

import django
django.setup()

from django.apps import apps
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image
from io import BytesIO

Animal = next(
    m for m in apps.get_models()
    if m.__name__ == "Animal"
    and any(f.name == "gallery_files" for f in m._meta.fields)
)

CSV_PATH = BASE / "pawtopia_image_review.csv"
LOG_PATH = BASE / "pawtopia_image_import_log.csv"

session = requests.Session()
session.headers.update({
    "User-Agent": "PawtopiaFYP/1.0 (educational project; contact: your-email@example.com)"
})

MAX_BYTES = 15 * 1024 * 1024
ALLOWED = {".jpg", ".jpeg", ".png", ".webp"}


def download_image(url, filename, folder):
    response = session.get(url, timeout=45, stream=True)
    response.raise_for_status()

    data = bytearray()

    for chunk in response.iter_content(256 * 1024):
        if chunk:
            data.extend(chunk)

        if len(data) > MAX_BYTES:
            response.close()
            raise ValueError("Image exceeds 15 MB")

    response.close()

    # Verify actual image bytes
    with Image.open(BytesIO(data)) as image:
        image.verify()

    return default_storage.save(
        f"{folder}/{filename}",
        ContentFile(bytes(data))
    )


def run():
    if not CSV_PATH.exists():
        raise FileNotFoundError(CSV_PATH)

    with CSV_PATH.open(
        encoding="utf-8-sig",
        newline=""
    ) as file:
        rows = list(csv.DictReader(file))

    grouped = {}

    for row in rows:
        if row["approved"].strip().upper() != "YES":
            continue

        grouped.setdefault(
            int(row["animal_id"]), []
        ).append(row)

    print("Animals with approved candidates:", len(grouped))

    log = []

    for index, (animal_id, candidates) in enumerate(
        grouped.items(), 1
    ):
        try:
            animal = Animal.objects.get(pk=animal_id)

            if any(
                row["animal_name"] != animal.name
                or row["scientific_name"] != animal.scientific_name
                for row in candidates
            ):
                print("SKIPPED: Name mismatch:", animal_id)
                continue

            # Skip animals already imported
            if animal.image_file and animal.gallery_files:
                print("SKIPPED: Already imported:", animal.name)
                continue

            print(f"[{index}/{len(grouped)}] {animal.name}")

            main_path = None
            gallery_paths = []
            saved_paths = []

            seen_urls = set()

            for row in candidates:
                url = row["download_url"].strip()
                slot = row["slot"].strip()

                if not url or url in seen_urls:
                    continue

                seen_urls.add(url)

                extension = Path(
                    urlparse(url).path
                ).suffix.lower()

                if extension not in ALLOWED:
                    continue

                filename = (
                    f"{animal.pk}_{slot}"
                    f"{extension}"
                )

                folder = (
                    "animals/images"
                    if slot == "main"
                    else "animals/gallery"
                )

                try:
                    path = download_image(
                        url, filename, folder
                    )
                except Exception as error:
                    print("  Download failed:", slot, error)
                    continue

                saved_paths.append(path)

                if slot == "main":
                    main_path = path
                elif slot.startswith("gallery_"):
                    gallery_paths.append(path)

                time.sleep(1)

            # Do not replace an animal's images if no
            # main image was successfully downloaded.
            if not main_path:
                print("  SKIPPED: Main image unavailable")

                for path in saved_paths:
                    default_storage.delete(path)

                continue

            # Update one animal only after downloads finish.
            animal.image_file.name = main_path
            animal.image = ""

            animal.gallery_files = gallery_paths

            # Clear old placeholder URLs only when
            # replacement gallery images exist.
            if gallery_paths:
                animal.gallery = []

            animal.save(update_fields=[
                "image_file",
                "image",
                "gallery_files",
                "gallery"
            ])

            log.append({
                "animal_id": animal.pk,
                "animal_name": animal.name,
                "main_image": main_path,
                "gallery_count": len(gallery_paths),
                "gallery_paths": " | ".join(gallery_paths)
            })

            print(
                "  SUCCESS:",
                "Main image +",
                len(gallery_paths),
                "gallery images"
            )

        except Exception as error:
            print("ERROR:", animal_id, error)

    with LOG_PATH.open(
        "w",
        encoding="utf-8-sig",
        newline=""
    ) as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "animal_id",
                "animal_name",
                "main_image",
                "gallery_count",
                "gallery_paths"
            ]
        )

        writer.writeheader()
        writer.writerows(log)

    print("\nFINISHED")
    print("Animals imported:", len(log))
    print("Log:", LOG_PATH)


if __name__ == "__main__":
    run()
