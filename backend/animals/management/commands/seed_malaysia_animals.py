from django.core.management.base import BaseCommand
from animals.models import Animal


# =========================================================
# PAWTOPIA - MALAYSIA ANIMAL ENCYCLOPEDIA
# 30 animals per category = 180 animals
# =========================================================

ANIMALS = [
    # =====================================================
    # MAMMALS - 30
    # =====================================================
    ("Malayan Tiger", "Panthera tigris", "mammals"),
    ("Malayan Tapir", "Tapirus indicus", "mammals"),
    ("Asian Elephant", "Elephas maximus", "mammals"),
    ("Malayan Sun Bear", "Helarctos malayanus", "mammals"),
    ("Sunda Pangolin", "Manis javanica", "mammals"),
    ("Sunda Clouded Leopard", "Neofelis diardi", "mammals"),
    ("Leopard Cat", "Prionailurus bengalensis", "mammals"),
    ("Marbled Cat", "Pardofelis marmorata", "mammals"),
    ("Flat-headed Cat", "Prionailurus planiceps", "mammals"),
    ("Bornean Orangutan", "Pongo pygmaeus", "mammals"),
    ("Proboscis Monkey", "Nasalis larvatus", "mammals"),
    ("Siamang", "Symphalangus syndactylus", "mammals"),
    ("White-handed Gibbon", "Hylobates lar", "mammals"),
    ("Bornean Gibbon", "Hylobates muelleri", "mammals"),
    ("Dusky Leaf Monkey", "Trachypithecus obscurus", "mammals"),
    ("Silvered Langur", "Trachypithecus cristatus", "mammals"),
    ("Long-tailed Macaque", "Macaca fascicularis", "mammals"),
    ("Southern Pig-tailed Macaque", "Macaca nemestrina", "mammals"),
    ("Sunda Slow Loris", "Nycticebus coucang", "mammals"),
    ("Malayan Colugo", "Galeopterus variegatus", "mammals"),
    ("Malayan Porcupine", "Hystrix brachyura", "mammals"),
    ("Lesser Mouse-deer", "Tragulus kanchil", "mammals"),
    ("Greater Mouse-deer", "Tragulus napu", "mammals"),
    ("Sambar Deer", "Rusa unicolor", "mammals"),
    ("Malayan Gaur", "Bos gaurus", "mammals"),
    ("Bearded Pig", "Sus barbatus", "mammals"),
    ("Smooth-coated Otter", "Lutrogale perspicillata", "mammals"),
    ("Hairy-nosed Otter", "Lutra sumatrana", "mammals"),
    ("Prevost's Squirrel", "Callosciurus prevostii", "mammals"),
    ("Cream-coloured Giant Squirrel", "Ratufa affinis", "mammals"),

    # =====================================================
    # BIRDS - 30
    # =====================================================
    ("Rhinoceros Hornbill", "Buceros rhinoceros", "birds"),
    ("Great Hornbill", "Buceros bicornis", "birds"),
    ("Helmeted Hornbill", "Rhinoplax vigil", "birds"),
    ("Oriental Pied Hornbill", "Anthracoceros albirostris", "birds"),
    ("Black Hornbill", "Anthracoceros malayanus", "birds"),
    ("Wreathed Hornbill", "Rhyticeros undulatus", "birds"),
    ("Wrinkled Hornbill", "Rhabdotorrhinus corrugatus", "birds"),
    ("Bushy-crested Hornbill", "Anorrhinus galeritus", "birds"),
    ("White-crowned Hornbill", "Berenicornis comatus", "birds"),
    ("Great Argus", "Argusianus argus", "birds"),
    ("Crested Fireback", "Lophura ignita", "birds"),
    ("Malayan Peacock-Pheasant", "Polyplectron malacense", "birds"),
    ("Mountain Peacock-Pheasant", "Polyplectron inopinatum", "birds"),
    ("White-bellied Sea Eagle", "Icthyophaga leucogaster", "birds"),
    ("Brahminy Kite", "Haliastur indus", "birds"),
    ("Crested Serpent Eagle", "Spilornis cheela", "birds"),
    ("Black-and-red Broadbill", "Cymbirhynchus macrorhynchos", "birds"),
    ("Green Broadbill", "Calyptomena viridis", "birds"),
    ("Banded Kingfisher", "Lacedo pulchella", "birds"),
    ("Stork-billed Kingfisher", "Pelargopsis capensis", "birds"),
    ("Blue-eared Kingfisher", "Alcedo meninting", "birds"),
    ("Oriental Dwarf Kingfisher", "Ceyx erithaca", "birds"),
    ("Asian Fairy-bluebird", "Irena puella", "birds"),
    ("Greater Racket-tailed Drongo", "Dicrurus paradiseus", "birds"),
    ("Common Hill Myna", "Gracula religiosa", "birds"),
    ("Yellow-vented Bulbul", "Pycnonotus goiavier", "birds"),
    ("White-throated Kingfisher", "Halcyon smyrnensis", "birds"),
    ("Malaysian Pied Fantail", "Rhipidura javanica", "birds"),
    ("Black-naped Oriole", "Oriolus chinensis", "birds"),
    ("Purple-naped Sunbird", "Kurochkinegramma hypogrammicum", "birds"),

    # =====================================================
    # REPTILES - 30
    # =====================================================
    ("Saltwater Crocodile", "Crocodylus porosus", "reptiles"),
    ("False Gharial", "Tomistoma schlegelii", "reptiles"),
    ("King Cobra", "Ophiophagus hannah", "reptiles"),
    ("Equatorial Spitting Cobra", "Naja sumatrana", "reptiles"),
    ("Monocled Cobra", "Naja kaouthia", "reptiles"),
    ("Reticulated Python", "Malayopython reticulatus", "reptiles"),
    ("Blood Python", "Python brongersmai", "reptiles"),
    ("Wagler's Pit Viper", "Tropidolaemus wagleri", "reptiles"),
    ("Malayan Pit Viper", "Calloselasma rhodostoma", "reptiles"),
    ("Mangrove Pit Viper", "Trimeresurus purpureomaculatus", "reptiles"),
    ("Paradise Flying Snake", "Chrysopelea paradisi", "reptiles"),
    ("Oriental Whip Snake", "Ahaetulla prasina", "reptiles"),
    ("Mangrove Snake", "Boiga dendrophila", "reptiles"),
    ("Malayan Krait", "Bungarus candidus", "reptiles"),
    ("Banded Krait", "Bungarus fasciatus", "reptiles"),
    ("Red-headed Krait", "Bungarus flaviceps", "reptiles"),
    ("Asian Water Monitor", "Varanus salvator", "reptiles"),
    ("Clouded Monitor", "Varanus nebulosus", "reptiles"),
    ("Dumeril's Monitor", "Varanus dumerilii", "reptiles"),
    ("Green Crested Lizard", "Bronchocela cristatella", "reptiles"),
    ("Common Flying Dragon", "Draco volans", "reptiles"),
    ("Five-banded Gliding Lizard", "Draco quinquefasciatus", "reptiles"),
    ("Tokay Gecko", "Gekko gecko", "reptiles"),
    ("Common House Gecko", "Hemidactylus frenatus", "reptiles"),
    ("Malayan Box Turtle", "Cuora amboinensis", "reptiles"),
    ("Asian Giant Tortoise", "Manouria emys", "reptiles"),
    ("Painted Terrapin", "Batagur borneoensis", "reptiles"),
    ("Southern River Terrapin", "Batagur affinis", "reptiles"),
    ("Hawksbill Sea Turtle", "Eretmochelys imbricata", "reptiles"),
    ("Green Sea Turtle", "Chelonia mydas", "reptiles"),

    # =====================================================
    # AMPHIBIANS - 30
    # =====================================================
    ("Malayan Horned Frog", "Pelobatrachus nasutus", "amphibians"),
    ("Bornean Horned Frog", "Pelobatrachus baluensis", "amphibians"),
    ("Wallace's Flying Frog", "Rhacophorus nigropalmatus", "amphibians"),
    ("Harlequin Flying Frog", "Rhacophorus pardalis", "amphibians"),
    ("Norhayati's Gliding Frog", "Rhacophorus norhayatiae", "amphibians"),
    ("Dark-eared Tree Frog", "Polypedates macrotis", "amphibians"),
    ("Four-lined Tree Frog", "Polypedates leucomystax", "amphibians"),
    ("Cinnamon Frog", "Nyctixalus pictus", "amphibians"),
    ("White-lipped Frog", "Chalcorana labialis", "amphibians"),
    ("Giant River Frog", "Limnonectes leporinus", "amphibians"),
    ("Blyth's River Frog", "Limnonectes blythii", "amphibians"),
    ("Peat Swamp Frog", "Limnonectes malesianus", "amphibians"),
    ("Crab-eating Frog", "Fejervarya cancrivora", "amphibians"),
    ("Asian Grass Frog", "Fejervarya limnocharis", "amphibians"),
    ("Green Paddy Frog", "Hylarana erythraea", "amphibians"),
    ("Common Greenback", "Chalcorana labialis", "amphibians"),
    ("Asian Painted Frog", "Kaloula pulchra", "amphibians"),
    ("Banded Bullfrog", "Kaloula pulchra", "amphibians"),
    ("Malaysian Narrowmouth Frog", "Kalophrynus pleurostigma", "amphibians"),
    ("Black-spotted Sticky Frog", "Kalophrynus interlineatus", "amphibians"),
    ("Malayan Slender Toad", "Ansonia malayana", "amphibians"),
    ("Asian Common Toad", "Duttaphrynus melanostictus", "amphibians"),
    ("River Toad", "Phrynoidis asper", "amphibians"),
    ("Malayan Giant Toad", "Phrynoidis juxtasper", "amphibians"),
    ("Kinabalu Slender Toad", "Ansonia hanitschi", "amphibians"),
    ("Bornean Flat-headed Frog", "Barbourula kalimantanensis", "amphibians"),
    ("Hole-in-the-head Frog", "Huia cavitympanum", "amphibians"),
    ("Malesian Frog", "Limnonectes malesianus", "amphibians"),
    ("File-eared Tree Frog", "Polypedates otilophus", "amphibians"),
    ("Spotted Tree Frog", "Nyctixalus pictus", "amphibians"),

    # =====================================================
    # FISH - 30
    # =====================================================
    ("Asian Arowana", "Scleropages formosus", "fish"),
    ("Malaysian Mahseer", "Tor tambroides", "fish"),
    ("Hampala Barb", "Hampala macrolepidota", "fish"),
    ("Clown Loach", "Chromobotia macracanthus", "fish"),
    ("Giant Gourami", "Osphronemus goramy", "fish"),
    ("Kissing Gourami", "Helostoma temminckii", "fish"),
    ("Snakeskin Gourami", "Trichopodus pectoralis", "fish"),
    ("Pearl Gourami", "Trichopodus leerii", "fish"),
    ("Three Spot Gourami", "Trichopodus trichopterus", "fish"),
    ("Giant Snakehead", "Channa micropeltes", "fish"),
    ("Striped Snakehead", "Channa striata", "fish"),
    ("Forest Snakehead", "Channa lucius", "fish"),
    ("Walking Catfish", "Clarias batrachus", "fish"),
    ("Asian Redtail Catfish", "Hemibagrus wyckioides", "fish"),
    ("Iridescent Shark Catfish", "Pangasianodon hypophthalmus", "fish"),
    ("Spotted Archerfish", "Toxotes chatareus", "fish"),
    ("Banded Archerfish", "Toxotes jaculatrix", "fish"),
    ("Spotted Scat", "Scatophagus argus", "fish"),
    ("Green Chromide", "Etroplus suratensis", "fish"),
    ("Barramundi", "Lates calcarifer", "fish"),
    ("Giant Mudskipper", "Periophthalmodon schlosseri", "fish"),
    ("Silver Moony", "Monodactylus argenteus", "fish"),
    ("Indo-Pacific Tarpon", "Megalops cyprinoides", "fish"),
    ("Blacktip Reef Shark", "Carcharhinus melanopterus", "fish"),
    ("Whitetip Reef Shark", "Triaenodon obesus", "fish"),
    ("Zebra Shark", "Stegostoma tigrinum", "fish"),
    ("Whale Shark", "Rhincodon typus", "fish"),
    ("Blue-spotted Ribbontail Ray", "Taeniura lymma", "fish"),
    ("Giant Freshwater Stingray", "Urogymnus polylepis", "fish"),
    ("Humphead Wrasse", "Cheilinus undulatus", "fish"),

    # =====================================================
    # INSECTS - 30
    # =====================================================
    ("Rajah Brooke's Birdwing", "Trogonoptera brookiana", "insects"),
    ("Common Birdwing", "Troides helena", "insects"),
    ("Common Rose", "Pachliopta aristolochiae", "insects"),
    ("Common Mormon", "Papilio polytes", "insects"),
    ("Lime Butterfly", "Papilio demoleus", "insects"),
    ("Common Bluebottle", "Graphium sarpedon", "insects"),
    ("Common Jay", "Graphium doson", "insects"),
    ("Tailed Jay", "Graphium agamemnon", "insects"),
    ("Great Mormon", "Papilio memnon", "insects"),
    ("Blue Mormon", "Papilio polymnestor", "insects"),
    ("Common Tree Nymph", "Idea stolli", "insects"),
    ("Malay Lacewing", "Cethosia hypsea", "insects"),
    ("Cruiser Butterfly", "Vindula dejone", "insects"),
    ("Common Tiger", "Danaus genutia", "insects"),
    ("Blue Glassy Tiger", "Ideopsis vulgaris", "insects"),
    ("Plain Tiger", "Danaus chrysippus", "insects"),
    ("Atlas Moth", "Attacus atlas", "insects"),
    ("Malaysian Moon Moth", "Actias maenas", "insects"),
    ("Common Evening Brown", "Melanitis leda", "insects"),
    ("Giant Forest Ant", "Dinomyrmex gigas", "insects"),
    ("Weaver Ant", "Oecophylla smaragdina", "insects"),
    ("Giant Honey Bee", "Apis dorsata", "insects"),
    ("Asian Honey Bee", "Apis cerana", "insects"),
    ("Blue-banded Bee", "Amegilla zonata", "insects"),
    ("Common Tiger Dragonfly", "Ictinogomphus decoratus", "insects"),
    ("Scarlet Skimmer", "Crocothemis servilia", "insects"),
    ("Giant Malaysian Katydid", "Macrolyristes corporalis", "insects"),
    ("Malaysian Jungle Nymph", "Heteropteryx dilatata", "insects"),
    ("Giant Longhorn Beetle", "Batocera rubus", "insects"),
    ("Coconut Rhinoceros Beetle", "Oryctes rhinoceros", "insects"),
]


CATEGORY_DATA = {
    "mammals": {
        "habitat": "Tropical rainforests, lowland forests, montane forests, wetlands and other suitable habitats in Malaysia.",
        "diet": "Diet varies by species and may include plants, fruits, insects, fish or other animals.",
        "lifespan": "Varies by species",
        "physical": "A vertebrate animal with characteristics typical of mammals, including hair or fur and mammary glands.",
        "behaviour": "Behaviour varies by species and habitat. Many Malaysian mammals depend strongly on healthy forest ecosystems.",
        "reproduction": "Mammals give birth to live young in most species and provide parental care.",
        "role": "Contributes to Malaysian ecosystems through seed dispersal, predation, herbivory and food-web interactions.",
    },
    "birds": {
        "habitat": "Malaysian rainforests, mangroves, wetlands, coastal areas, mountains and urban environments.",
        "diet": "Depending on species, the diet may include fruit, seeds, nectar, insects, fish and small animals.",
        "lifespan": "Varies by species",
        "physical": "A feathered vertebrate with wings, a beak and lightweight skeletal adaptations.",
        "behaviour": "May be solitary, territorial, social or migratory depending on the species.",
        "reproduction": "Reproduces by laying eggs, usually in nests or protected nesting sites.",
        "role": "Important for seed dispersal, pollination, insect control and food-web balance.",
    },
    "reptiles": {
        "habitat": "Forests, rivers, wetlands, mangroves, coastal areas and marine environments in Malaysia.",
        "diet": "Diet varies and may include insects, fish, amphibians, reptiles, birds, mammals or vegetation.",
        "lifespan": "Varies by species",
        "physical": "A cold-blooded vertebrate generally characterised by scales or scutes.",
        "behaviour": "Uses environmental heat to regulate body temperature and displays species-specific hunting and defensive behaviour.",
        "reproduction": "Most species lay eggs, although reproductive strategies vary among reptiles.",
        "role": "Functions as predator, prey or scavenger and contributes to balanced Malaysian ecosystems.",
    },
    "amphibians": {
        "habitat": "Humid Malaysian forests, streams, rivers, wetlands, peat swamps and freshwater habitats.",
        "diet": "Primarily small invertebrates such as insects, although diet varies by species.",
        "lifespan": "Varies by species",
        "physical": "Typically has moist skin and adaptations for life associated with both terrestrial and aquatic environments.",
        "behaviour": "Often most active during humid conditions or at night and many species communicate using calls.",
        "reproduction": "Most reproduce through eggs associated with freshwater or moist environments.",
        "role": "Controls invertebrate populations and acts as both predator and prey in Malaysian food webs.",
    },
    "fish": {
        "habitat": "Freshwater rivers, streams, lakes, peat swamps, estuaries, mangroves, coral reefs and Malaysian seas.",
        "diet": "Diet varies by species and may include plankton, plants, insects, crustaceans, molluscs or other fish.",
        "lifespan": "Varies by species",
        "physical": "An aquatic vertebrate adapted for swimming and extracting oxygen from water primarily through gills.",
        "behaviour": "Behaviour varies widely, including schooling, territoriality, migration and solitary hunting.",
        "reproduction": "Most reproduce by laying eggs, although reproductive strategies vary considerably.",
        "role": "Important components of aquatic food webs and contribute to the ecological health of Malaysian waters.",
    },
    "insects": {
        "habitat": "Malaysian rainforests, gardens, wetlands, agricultural landscapes and other terrestrial habitats.",
        "diet": "May consume nectar, pollen, leaves, fruit, wood or other organisms depending on species.",
        "lifespan": "Varies by species",
        "physical": "An arthropod with six legs and a body divided into head, thorax and abdomen.",
        "behaviour": "Behaviour ranges from solitary lifestyles to complex social colonies and includes many specialised feeding strategies.",
        "reproduction": "Typically lays eggs and undergoes development through species-specific life stages.",
        "role": "Important for pollination, decomposition, nutrient cycling and as a food source for many Malaysian animals.",
    },
}


# =========================================================
# TEMPORARY DEMO IMAGES
# These are placeholders for supervisor demonstration.
# Replace with verified species-specific media later.
# =========================================================

DEMO_IMAGES = {
    # =========================
    # MAMMALS
    # =========================
    "Malayan Tiger": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1200",
    "Malayan Tapir": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Malayan%20Tapir.jpg",
    "Asian Elephant": "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=1200",
    "Malayan Sun Bear": "https://images.unsplash.com/photo-1599948058230-78896e742f7e?w=1200",
    "Bornean Orangutan": "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=1200",

    # =========================
    # BIRDS
    # =========================
    "Rhinoceros Hornbill": "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200",
    "Great Hornbill": "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=1200",
    "White-bellied Sea Eagle": "https://images.unsplash.com/photo-1611689342806-0863700ce1e4?w=1200",

    # =========================
    # REPTILES
    # =========================
    "King Cobra": "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=1200",
    "Reticulated Python": "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=1200",
    "Green Sea Turtle": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
    "Hawksbill Sea Turtle": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",

    # =========================
    # AMPHIBIANS
    # =========================
    "Wallace's Flying Frog": "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=1200",
    "Malayan Horned Frog": "https://images.unsplash.com/photo-1550853024-fae8cd4be47f?w=1200",

    # =========================
    # FISH
    # =========================
    "Asian Arowana": "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1200",
    "Whale Shark": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=1200",
    "Blacktip Reef Shark": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=1200",
    "Whitetip Reef Shark": "https://images.unsplash.com/photo-1560275619-4662e36fa65c?w=1200",

    # =========================
    # INSECTS
    # =========================
    "Rajah Brooke's Birdwing": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Rajah%20Brooke%27s%20birdwing%20%28Trogonoptera%20brookiana%29.jpg",
    "Atlas Moth": "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?w=1200",
}


class Command(BaseCommand):
    help = "Seed Pawtopia with Malaysian animal encyclopedia records"

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0

        for name, scientific_name, category in ANIMALS:
            category_data = CATEGORY_DATA[category]
            demo_image = DEMO_IMAGES[category]

            defaults = {
                "name": name,
                "category": category,

                "habitat": category_data["habitat"],
                "diet": category_data["diet"],
                "lifespan": category_data["lifespan"],

                # Temporary demo value.
                # Verify species-specific IUCN status later.
                "conservation_status": "To Be Verified",

                "description": (
                    f"{name} ({scientific_name}) is an animal recorded from "
                    f"Malaysia and included in the Pawtopia Malaysia Animal "
                    f"Encyclopedia. This entry provides introductory information "
                    f"for educational use."
                ),

                "image": demo_image,

                "gallery": [
                    demo_image,
                    demo_image,
                    demo_image,
                ],

                "gallery_files": [],

                "facts": [
                    f"{name} is included in Pawtopia's Malaysian animal collection.",
                    f"Its scientific name is {scientific_name}.",
                    "Malaysia supports exceptionally rich tropical biodiversity.",
                ],

                "physical_characteristics": category_data["physical"],
                "behaviour": category_data["behaviour"],
                "reproduction": category_data["reproduction"],

                "geographic_range": (
                    "Recorded in Malaysia. Detailed state-level distribution "
                    "will be added after species-level verification."
                ),

                "conservation_threats": (
                    "Threats vary by species and may include habitat loss, "
                    "habitat fragmentation, pollution, exploitation and other "
                    "human pressures."
                ),

                "ecosystem_role": category_data["role"],
            }

            animal, created = Animal.objects.update_or_create(
                scientific_name=scientific_name,
                defaults=defaults,
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"Created: {animal.name}")
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f"Updated: {animal.name}")
                )

        self.stdout.write("")
        self.stdout.write("=" * 60)

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished: {created_count} created, "
                f"{updated_count} updated."
            )
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Total seed records processed: {len(ANIMALS)}"
            )
        )

        self.stdout.write("=" * 60)