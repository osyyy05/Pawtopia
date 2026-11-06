
import os
import csv
import re
import time
import html
import tempfile
import argparse
from pathlib import Path
from urllib.parse import urlparse

import requests

# ============================================================
# DJANGO SETUP
# ============================================================

manage_py = Path(__file__).resolve().parent / "manage.py"

manage_content = manage_py.read_text(encoding="utf-8")

match = re.search(
    r"""DJANGO_SETTINGS_MODULE['"]\s*,\s*['"]([^'"]+)['"]""",
    manage_content
)

if not match:
    raise RuntimeError(
        "Cannot find DJANGO_SETTINGS_MODULE in manage.py"
    )

os.environ["DJANGO_SETTINGS_MODULE"] = match.group(1)

import django
django.setup()

from django.apps import apps
from django.core.files import File
from django.core.files.storage import default_storage

Animal = next(
    model for model in apps.get_models()
    if model.__name__ == "Animal"
    and any(
        field.name == "gallery_files"
        for field in model._meta.fields
    )
)

BASE = Path(__file__).resolve().parent
INPUT_CSV = BASE / "pawtopia_animals.csv"
REVIEW_CSV = BASE / "pawtopia_image_review.csv"
CREDIT_CSV = BASE / "pawtopia_image_credits.csv"

API = "https://commons.wikimedia.org/w/api.php"

session = requests.Session()
session.headers.update({
    "User-Agent": (
        "PawtopiaFYP/1.0 "
        "(educational animal encyclopedia; "
        "contact: pawtopia-fyp@example.org)"
    )
})

# IMPORTANT:
# Replace the example email above with a real contact email
# before running. Wikimedia requires an identifiable User-Agent.

MAX_IMAGE_BYTES = 15 * 1024 * 1024
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}

EXCLUDED_WORDS = [
    "map", "distribution", "range", "diagram",
    "drawing", "illustration", "skeleton",
    "skull", "logo", "icon", "chart",
    "phylogeny", "phylogenetic", "fossil"
]


# ============================================================
# HELPERS
# ============================================================

def clean_html(value):
    value = re.sub(r"<[^>]*>", " ", str(value or ""))
    return html.unescape(value).strip()


def safe_name(value):
    value = re.sub(r"[^A-Za-z0-9_-]+", "_", value)
    return value.strip("_")[:70]


def api_request(params):
    for attempt in range(3):
        try:
            response = session.get(
                API,
                params=params,
                timeout=35
            )

            if response.status_code == 429:
                wait = min(
                    int(response.headers.get(
                        "Retry-After", "30"
                    )),
                    120
                )
                print(f"Rate limited; waiting {wait}s")
                time.sleep(wait)
                continue

            response.raise_for_status()
            return response.json()

        except requests.RequestException as error:
            print("API error:", error)
            time.sleep(5 * (attempt + 1))

    return {}


def search_images(scientific_name):
    """
    Search Wikimedia Commons for candidate photos.
    Results are suggestions, not verified species matches.
    """

    data = api_request({
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": (
            f'"{scientific_name}" filetype:bitmap'
        ),
        "gsrnamespace": 6,
        "gsrlimit": 30,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": 900
    })

    pages = data.get("query", {}).get("pages", {})
    candidates = []
    seen = set()

    for page in pages.values():
        title = page.get("title", "")
        lower_title = title.lower()

        if any(word in lower_title for word in EXCLUDED_WORDS):
            continue

        info_list = page.get("imageinfo", [])
        if not info_list:
            continue

        info = info_list[0]

        url = info.get("url", "")
        preview = info.get("thumburl", url)

        extension = Path(
            urlparse(url).path
        ).suffix.lower()

        if extension not in ALLOWED_EXT:
            continue

        if url in seen:
            continue

        metadata = info.get("extmetadata", {})

        license_name = metadata.get(
            "LicenseShortName", {}
        ).get("value", "")

        artist = clean_html(
            metadata.get("Artist", {}).get("value", "")
        )

        description = clean_html(
            metadata.get(
                "ImageDescription", {}
            ).get("value", "")
        )

        # Require identifiable license information.
        if not license_name:
            continue

        # Exclude licenses requiring separate permission.
        if license_name.lower() in {
            "copyrighted",
            "unknown"
        }:
            continue

        seen.add(url)

        candidates.append({
            "url": url,
            "preview": preview,
            "title": title,
            "license": license_name,
            "artist": artist[:300],
            "description": description[:300],
            "source": (
                "https://commons.wikimedia.org/wiki/"
                + title.replace(" ", "_")
            )
        })

    return candidates[:4]


# ============================================================
# GENERATE REVIEW CSV
# ============================================================

def generate_review():
    if not INPUT_CSV.exists():
        print("ERROR: pawtopia_animals.csv not found")
        return

    with INPUT_CSV.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:
        animals = list(csv.DictReader(file))

    print("Animals in CSV:", len(animals))

    fields = [
        "animal_id",
        "animal_name",
        "scientific_name",
        "slot",
        "candidate_title",
        "preview_url",
        "download_url",
        "source_url",
        "license",
        "artist",
        "description",
        "approved"
    ]

    with REVIEW_CSV.open(
        "w", encoding="utf-8-sig", newline=""
    ) as output:

        writer = csv.DictWriter(
            output, fieldnames=fields
        )
        writer.writeheader()

        for index, animal in enumerate(animals, 1):
            animal_id = animal["id"]
            name = animal["name"]
            scientific = animal["scientific_name"].strip()

            print(
                f"[{index}/{len(animals)}] "
                f"{name} ({scientific})"
            )

            if not scientific:
                print("SKIPPED: No scientific name")
                continue

            candidates = search_images(scientific)

            for slot, candidate in enumerate(candidates):
                writer.writerow({
                    "animal_id": animal_id,
                    "animal_name": name,
                    "scientific_name": scientific,
                    "slot": (
                        "main" if slot == 0
                        else f"gallery_{slot}"
                    ),
                    "candidate_title": candidate["title"],
                    "preview_url": candidate["preview"],
                    "download_url": candidate["url"],
                    "source_url": candidate["source"],
                    "license": candidate["license"],
                    "artist": candidate["artist"],
                    "description": candidate["description"],
                    "approved": "NO"
                })

            # Reduce load on Wikimedia servers
            time.sleep(1.5)

    print("\nREVIEW FILE CREATED:")
    print(REVIEW_CSV)
    print("Review photos and set approved to YES.")


# ============================================================
# DOWNLOAD APPROVED IMAGES
# ============================================================

def download_image(url, filename, folder):
    response = session.get(
        url,
        stream=True,
        timeout=(15, 90)
    )

    response.raise_for_status()

    content_type = response.headers.get(
        "Content-Type", ""
    ).lower()

    if not content_type.startswith("image/"):
        response.close()
        raise ValueError("URL did not return an image")

    total = 0

    with tempfile.TemporaryFile() as temp:
        for chunk in response.iter_content(1024 * 256):
            if not chunk:
                continue

            total += len(chunk)

            if total > MAX_IMAGE_BYTES:
                response.close()
                raise ValueError("Image exceeds 15 MB")

            temp.write(chunk)

        temp.seek(0)

        # Validate image contents, not just extension.
        from PIL import Image

        with Image.open(temp) as img:
            img.verify()

        temp.seek(0)

        saved = default_storage.save(
            f"{folder}/{filename}",
            File(temp, name=filename)
        )

    response.close()
    return saved


# ============================================================
# APPLY APPROVED IMAGES TO DATABASE
# ============================================================

def apply_review():
    if not REVIEW_CSV.exists():
        print("ERROR: Review CSV not found")
        return

    with REVIEW_CSV.open(
        "r", encoding="utf-8-sig", newline=""
    ) as file:
        rows = list(csv.DictReader(file))

    approved = [
        row for row in rows
        if row["approved"].strip().upper() == "YES"
    ]

    print("Approved images:", len(approved))

    if not approved:
        print("Nothing to import.")
        return

    credit_fields = [
        "animal_id",
        "animal_name",
        "slot",
        "source_url",
        "license",
        "artist",
        "saved_path"
    ]

    credit_exists = CREDIT_CSV.exists()

    with CREDIT_CSV.open(
        "a", encoding="utf-8-sig", newline=""
    ) as credit_file:

        credit_writer = csv.DictWriter(
            credit_file,
            fieldnames=credit_fields
        )

        if not credit_exists:
            credit_writer.writeheader()

        for row in approved:
            try:
                animal = Animal.objects.get(
                    pk=int(row["animal_id"])
                )

                # Prevent applying a candidate to a
                # different animal if IDs have changed.
                if (
                    animal.name != row["animal_name"]
                    or animal.scientific_name
                    != row["scientific_name"]
                ):
                    print(
                        "SKIPPED: Animal details changed:",
                        row["animal_name"]
                    )
                    continue

                slot = row["slot"]
                url = row["download_url"]

                extension = Path(
                    urlparse(url).path
                ).suffix.lower()

                if extension not in ALLOWED_EXT:
                    continue

                filename = (
                    f"{animal.pk}_"
                    f"{safe_name(animal.name)}_"
                    f"{slot}{extension}"
                )

                folder = (
                    "animals/images"
                    if slot == "main"
                    else "animals/gallery"
                )

                # Skip if a local image already exists
                # for the same slot.
                if slot == "main" and animal.image_file:
                    print(
                        "SKIPPED: Main image already uploaded:",
                        animal.name
                    )
                    continue

                if slot.startswith("gallery_"):
                    index = int(slot.split("_")[1]) - 1
                    current = animal.gallery_files or []

                    if len(current) > index:
                        print(
                            "SKIPPED: Gallery slot already filled:",
                            animal.name, slot
                        )
                        continue

                saved_path = download_image(
                    url, filename, folder
                )

                if slot == "main":
                    animal.image_file.name = saved_path
                    animal.image = ""
                    animal.save(
                        update_fields=["image_file", "image"]
                    )

                else:
                    current = list(animal.gallery_files or [])

                    if saved_path not in current:
                        current.append(saved_path)

                    animal.gallery_files = current
                    animal.gallery = []
                    animal.save(
                        update_fields=["gallery_files", "gallery"]
                    )

                credit_writer.writerow({
                    "animal_id": animal.pk,
                    "animal_name": animal.name,
                    "slot": slot,
                    "source_url": row["source_url"],
                    "license": row["license"],
                    "artist": row["artist"],
                    "saved_path": saved_path
                })

                credit_file.flush()

                print("SUCCESS:", animal.name, slot)

                time.sleep(1.5)

            except Exception as error:
                print(
                    "FAILED:",
                    row["animal_name"],
                    str(error)
                )

    print("\nIMPORT FINISHED")
    print("Credit records:", CREDIT_CSV)


# ============================================================
# COMMAND LINE
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--mode",
        choices=["review", "apply"],
        required=True
    )

    args = parser.parse_args()

    if args.mode == "review":
        generate_review()

    elif args.mode == "apply":
        apply_review()
