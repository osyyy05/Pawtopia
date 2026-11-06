
from functools import lru_cache

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MIN_SIMILARITY_SCORE = 0.40


@lru_cache(maxsize=1)
def get_ai_model():
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(MODEL_NAME)


def calculate_semantic_similarity(pet_needs, clinic_services):
    """
    Compare the user's pet needs with clinic services
    using a pre-trained Sentence Transformer.
    """
    if not isinstance(pet_needs, str) or not pet_needs.strip():
        return 0.0, None

    if not isinstance(clinic_services, list):
        return 0.0, None

    services = [
        service.strip()
        for service in clinic_services
        if isinstance(service, str) and service.strip()
    ]

    if not services:
        return 0.0, None

    from sentence_transformers import util

    model = get_ai_model()

    user_embedding = model.encode(
        pet_needs.strip(),
        convert_to_tensor=True
    )

    service_embeddings = model.encode(
        services,
        convert_to_tensor=True
    )

    similarities = util.cos_sim(
        user_embedding,
        service_embeddings
    )[0]

    best_index = int(similarities.argmax().item())
    best_score = float(similarities[best_index].item())

    return best_score, services[best_index]


def supports_pet_type(pet_type, supported_pet_types):
    """
    Only match clinics with confirmed pet types.
    """
    if not isinstance(pet_type, str) or not pet_type.strip():
        return False

    if not isinstance(supported_pet_types, list):
        return False

    normalized_types = {
        item.strip().casefold()
        for item in supported_pet_types
        if isinstance(item, str) and item.strip()
    }

    return pet_type.strip().casefold() in normalized_types


def rank_veterinary_clinics(
    pet_type,
    pet_needs,
    clinic_candidates,
    max_results=3
):
    """
    Rank clinics using 100% AI semantic similarity.

    No distance calculation or proximity weighting.

    clinic_candidates may contain clinic objects or
    dictionaries containing a "clinic" key.
    """

    # Reject empty, very short, or non-meaningful inputs.
    pet_needs = pet_needs.strip()

    if len(pet_needs) < 8:
        return []
    results = []

    for candidate in clinic_candidates:
        clinic = (
            candidate["clinic"]
            if isinstance(candidate, dict)
            else candidate
        )

        if not supports_pet_type(
            pet_type,
            clinic.supported_pet_types
        ):
            continue

        similarity, matched_service = calculate_semantic_similarity(
            pet_needs,
            clinic.services
        )

        if matched_service is None:
            continue

        semantic_score = max(0.0, min(1.0, similarity))
        # Reject recommendations with low semantic similarity.
        if semantic_score < MIN_SIMILARITY_SCORE:
            continue

        results.append({
            "id": clinic.id,
            "name": clinic.name,
            "address": clinic.address,
            "google_maps_url": clinic.google_maps_url,
            "supported_pet_types": clinic.supported_pet_types,
            "services": clinic.services,
            "matched_service": matched_service,
            "semantic_similarity": round(similarity, 4),
            "recommendation_score": round(semantic_score, 4),
            "recommendation_reason": (
                f"{clinic.name} offers {matched_service}, "
                f"which is the closest semantic match to your "
                f"described pet care needs among its listed services."
            ),
        })

    results.sort(
        key=lambda item: item["recommendation_score"],
        reverse=True
    )

    return results[:max_results]
