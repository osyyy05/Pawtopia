import re
import time
import urllib.parse
import urllib.request

from animals.models import Animal


# ============================================================
# SETTINGS
# ============================================================

COMMONS = "https://commons.wikimedia.org"

USER_AGENT = (
    "Mozilla/5.0 "
    "(Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 "
    "(KHTML, like Gecko) "
    "Chrome/140 Safari/537.36 "
    "Pawtopia-FYP"
)


# ============================================================
# HTTP
# ============================================================

def get_url(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
        }
    )

    with urllib.request.urlopen(
        request,
        timeout=30
    ) as response:
        return response.read().decode(
            "utf-8",
            errors="ignore"
        )


# ============================================================
# COMMONS CATEGORY
# ============================================================

def get_category_images(scientific_name, common_name):
    """
    Get actual image files from Wikimedia Commons category.

    This uses the normal Commons category webpage instead
    of hammering the Wikimedia API, which caused 429 errors.
    """

    possible_categories = [
        scientific_name.replace(" ", "_"),
        common_name.replace(" ", "_"),
        scientific_name,
        common_name,
    ]

    file_names = []

    for category in possible_categories:

        encoded = urllib.parse.quote(
            category,
            safe="_()"
        )

        url = (
            f"{COMMONS}/wiki/Category:"
            f"{encoded}"
        )

        print(
            "  Searching:",
            category
        )

        try:
            html = get_url(url)

        except Exception as exc:
            print(
                "  Category request failed:",
                exc
            )
            time.sleep(3)
            continue

        # Find Wikimedia File links.
        matches = re.findall(
            r'href="/wiki/File:([^"]+)"',
            html
        )

        for match in matches:

            filename = urllib.parse.unquote(
                match
            )

            # Ignore obvious non-photo assets.
            lower = filename.lower()

            if lower.endswith(
                (
                    ".jpg",
                    ".jpeg",
                    ".png",
                    ".webp"
                )
            ):
                if filename not in file_names:
                    file_names.append(
                        filename
                    )

        if len(file_names) >= 6:
            break

        # Be polite to Commons.
        time.sleep(3)

    # Remove likely maps / logos / icons when possible.
    filtered = []

    bad_words = [
        "map",
        "distribution",
        "range",
        "logo",
        "icon",
        "flag",
        "coat_of_arms",
        "stamp",
        "skull",
        "museum",
        "skeleton",
    ]

    for filename in file_names:

        lower = filename.lower()

        if any(
            word in lower
            for word in bad_words
        ):
            continue

        filtered.append(
            filename
        )

    # Add back usable files if filtering removed too many.
    if len(filtered) < 6:
        for filename in file_names:
            if filename not in filtered:
                filtered.append(filename)

            if len(filtered) >= 6:
                break

    # Convert filenames to redirect URLs.
    images = []

    for filename in filtered[:6]:

        encoded_filename = urllib.parse.quote(
            filename,
            safe=""
        )

        image_url = (
            f"{COMMONS}/wiki/Special:Redirect/"
            f"file/{encoded_filename}"
        )

        images.append(
            image_url
        )

    return images


# ============================================================
# VIDEO
# ============================================================

def get_category_video(
    scientific_name,
    common_name
):
    """
    Try to find one genuine WebM / MP4 / OGV video
    from the Commons category page.
    """

    possible_categories = [
        scientific_name.replace(" ", "_"),
        common_name.replace(" ", "_"),
    ]

    for category in possible_categories:

        encoded = urllib.parse.quote(
            category,
            safe="_()"
        )

        url = (
            f"{COMMONS}/wiki/Category:"
            f"{encoded}"
        )

        try:
            html = get_url(url)

        except Exception:
            time.sleep(3)
            continue

        matches = re.findall(
            r'href="/wiki/File:([^"]+)"',
            html
        )

        for match in matches:

            filename = urllib.parse.unquote(
                match
            )

            lower = filename.lower()

            if lower.endswith(
                (
                    ".webm",
                    ".mp4",
                    ".ogv"
                )
            ):

                encoded_filename = (
                    urllib.parse.quote(
                        filename,
                        safe=""
                    )
                )

                return (
                    f"{COMMONS}/wiki/"
                    f"Special:Redirect/file/"
                    f"{encoded_filename}"
                )

        time.sleep(3)

    return ""


# ============================================================
# UPDATE
# ============================================================

print()
print("=" * 60)
print("FIXING ENCYCLOPEDIA MEDIA")
print("=" * 60)
print()

animals = Animal.objects.order_by(
    "id"
)

for index, animal in enumerate(
    animals,
    start=1
):

    print()
    print(
        f"[{index}/{animals.count()}] "
        f"{animal.name}"
    )

    # --------------------------------------------------------
    # GALLERY
    # --------------------------------------------------------

    gallery = get_category_images(
        animal.scientific_name,
        animal.name
    )

    print(
        "  Gallery found:",
        len(gallery)
    )

    # IMPORTANT:
    # Exactly six gallery entries.
    #
    # If Commons has fewer than six real photos,
    # repeat only an actual species image instead of
    # inventing unrelated images.
    if gallery:

        while len(gallery) < 6:
            gallery.append(
                gallery[
                    len(gallery)
                    % len(gallery)
                ]
            )

        gallery = gallery[:6]

        animal.gallery = gallery

        # Main image = first gallery image
        animal.image = gallery[0]

    # --------------------------------------------------------
    # VIDEO
    # --------------------------------------------------------

    # Preserve an existing video if one already exists.
    existing_video = (
        str(animal.video)
        if animal.video
        else ""
    )

    if existing_video:
        print(
            "  Existing video kept."
        )

    else:

        video = get_category_video(
            animal.scientific_name,
            animal.name
        )

        if video:
            animal.video = video

            print(
                "  Video found."
            )

        else:
            print(
                "  No verified video found."
            )

    animal.save(
        update_fields=[
            "image",
            "gallery",
            "video",
        ]
    )

    # Slow down requests so Commons doesn't
    # rate-limit us again.
    time.sleep(4)


# ============================================================
# REPORT
# ============================================================

print()
print("=" * 60)
print("MEDIA FIX COMPLETE")
print("=" * 60)
print()

all_animals = Animal.objects.order_by(
    "category",
    "name"
)

print(
    "TOTAL:",
    all_animals.count()
)

print()

for animal in all_animals:

    print(
        f"{animal.name} | "
        f"{animal.category} | "
        f"Gallery={len(animal.gallery or [])} | "
        f"Video={'YES' if animal.video else 'NO'}"
    )

print()
print("Done.")