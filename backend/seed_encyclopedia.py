import json
import urllib.parse
import urllib.request

from django.db import transaction
from animals.models import Animal


API = "https://commons.wikimedia.org/w/api.php"


# ============================================================
# WIKIMEDIA SEARCH
# ============================================================

def commons_search(query, media="image", limit=30):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|mime",
        "format": "json",
    }

    url = API + "?" + urllib.parse.urlencode(params)

    try:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent":
                    "Pawtopia-FYP-Animal-Encyclopedia/1.0"
            },
        )

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:
            data = json.loads(
                response.read().decode("utf-8")
            )

    except Exception as exc:
        print("Wikimedia API error:", exc)
        return []

    results = []

    pages = (
        data
        .get("query", {})
        .get("pages", {})
        .values()
    )

    for page in pages:
        info = page.get("imageinfo", [])

        if not info:
            continue

        item = info[0]

        media_url = item.get("url", "")
        mime = item.get("mime", "")

        if not media_url:
            continue

        clean_url = media_url.lower().split("?")[0]

        if media == "image":
            valid = (
                mime.startswith("image/")
                and clean_url.endswith(
                    (".jpg", ".jpeg", ".png", ".webp")
                )
            )
        else:
            valid = (
                mime.startswith("video/")
                and clean_url.endswith(
                    (".webm", ".mp4", ".ogv")
                )
            )

        if valid and media_url not in results:
            results.append(media_url)

    return results


def get_six_images(common_name, scientific_name):
    images = commons_search(
        f'"{scientific_name}"',
        media="image",
        limit=40
    )

    if len(images) < 6:
        more = commons_search(
            common_name,
            media="image",
            limit=40
        )

        for image in more:
            if image not in images:
                images.append(image)

    # We want EXACTLY 6 entries.
    # Prefer six unique images.
    if len(images) >= 6:
        return images[:6]

    # Only repeat if Commons returned fewer than six.
    # This prevents an empty gallery.
    if images:
        while len(images) < 6:
            images.append(
                images[len(images) % len(images)]
            )

    return images[:6]


def get_video(common_name, scientific_name):
    videos = commons_search(
        f'"{scientific_name}"',
        media="video",
        limit=40
    )

    if not videos:
        videos = commons_search(
            common_name,
            media="video",
            limit=40
        )

    return videos[0] if videos else ""


# ============================================================
# ENCYCLOPEDIA RECORDS
# ============================================================

DATA = [

    # --------------------------------------------------------
    # MAMMALS
    # --------------------------------------------------------

    {
        "name": "Malayan Tiger",
        "scientific_name": "Panthera tigris jacksoni",
        "category": "mammals",

        "habitat": (
            "The Malayan tiger is associated primarily with forest "
            "landscapes in Peninsular Malaysia. Suitable habitats "
            "include lowland evergreen rainforest, hill forest, "
            "peat swamp forest and other areas with dense vegetation, "
            "water and sufficient populations of wild prey. Tigers "
            "need large connected areas because individual animals "
            "can occupy extensive territories."
        ),

        "diet": (
            "The Malayan tiger is a carnivorous predator that depends "
            "mainly on medium and large ungulates and wild mammals. "
            "Important prey can include wild boar, deer and other "
            "suitable animals. Tigers are opportunistic and may take "
            "smaller prey when necessary. Maintaining a healthy prey "
            "base is therefore essential to tiger conservation."
        ),

        "lifespan": (
            "Wild tigers generally live for around 10 to 15 years, "
            "although survival varies depending on food availability, "
            "disease, injury, competition and human-related threats. "
            "Individuals under managed care may live longer."
        ),

        "conservation_status": "Critically Endangered",

        "description": (
            "The Malayan tiger is one of Malaysia's most iconic "
            "mammals and an apex predator of Peninsular Malaysian "
            "forests. Its orange coat is marked with a unique pattern "
            "of dark vertical stripes, allowing the animal to blend "
            "into broken light and vegetation. Tigers are powerful "
            "solitary hunters with highly developed senses of smell, "
            "hearing and vision. They may travel long distances while "
            "searching for prey and are capable swimmers, allowing them "
            "to cross rivers and wetland habitats. Individual tigers "
            "communicate through scent marking, scratching, vocalisation "
            "and other territorial signals. Because tigers require both "
            "large territories and a stable prey population, their survival "
            "depends on maintaining connected forest landscapes and reducing "
            "poaching and snaring. Protecting the tiger also protects many "
            "other species that share its habitat."
        ),

        "facts": [
            "A tiger population native to Peninsular Malaysia",
            "Each tiger has a unique stripe pattern",
            "Excellent swimmer",
            "Apex predator of forest ecosystems",
            "Large territories require connected habitat",
            "Poaching and snaring are major threats",
        ],

        "physical_characteristics": (
            "The Malayan tiger has a muscular body, strong forelimbs, "
            "large paws, retractable claws and long canine teeth adapted "
            "for capturing prey. Its orange or reddish coat is covered "
            "by irregular black stripes. Males are generally larger than "
            "females. The tail assists balance during running and turning, "
            "while the ears and facial markings contribute to communication "
            "and recognition."
        ),

        "behaviour": (
            "Adult tigers are generally solitary and territorial. They "
            "move quietly through forest vegetation and often rely on "
            "stealth before making a short, powerful attack on prey. "
            "Scent marking and scratching help maintain territorial boundaries. "
            "Tigers may rest for long periods between hunts and are comfortable "
            "around water, where they can swim or cool themselves."
        ),

        "reproduction": (
            "Female tigers usually give birth after a gestation of roughly "
            "three and a half months. A litter commonly contains several cubs, "
            "although survival depends heavily on the availability of food and "
            "safe denning areas. Cubs remain dependent on their mother for an "
            "extended period and gradually learn stalking, hunting and territorial "
            "skills before becoming independent."
        ),

        "geographic_range": (
            "The Malayan tiger is restricted to Peninsular Malaysia, making it "
            "geographically isolated from tiger populations farther north. "
            "Remaining populations are associated mainly with protected forest "
            "complexes and connected wildlife landscapes."
        ),

        "conservation_threats": (
            "Important threats include illegal hunting, indiscriminate snaring, "
            "habitat fragmentation, forest conversion, reduction of prey and "
            "human-wildlife conflict. Roads can fragment habitats and increase "
            "the risk of collisions or access by poachers. Long-term conservation "
            "requires anti-poaching work, habitat protection, wildlife corridors "
            "and recovery of natural prey populations."
        ),

        "ecosystem_role": (
            "As an apex predator, the Malayan tiger helps regulate populations "
            "and behaviour of prey species. Its presence reflects the ecological "
            "condition of a wider forest ecosystem because a stable tiger population "
            "requires sufficient habitat and prey throughout the food web."
        ),
    },


    {
        "name": "Bornean Orangutan",
        "scientific_name": "Pongo pygmaeus",
        "category": "mammals",

        "habitat": (
            "Bornean orangutans occur primarily in tropical rainforest, including "
            "lowland rainforest, peat swamp forest, riverine forest and other "
            "woodlands containing mature trees and abundant food. Continuous "
            "canopy is particularly valuable because orangutans spend much of "
            "their time moving, feeding and resting above the ground."
        ),

        "diet": (
            "Fruit is an important part of the diet, but orangutans also eat "
            "young leaves, bark, flowers, shoots, seeds and insects. Feeding "
            "strategies change with seasons because different forest trees "
            "produce fruit at different times."
        ),

        "lifespan": (
            "Bornean orangutans can live for several decades. Longevity is "
            "strongly influenced by habitat quality, food availability, disease "
            "and human-caused mortality."
        ),

        "conservation_status": "Critically Endangered",

        "description": (
            "The Bornean orangutan is one of the world's great apes and a "
            "specialist of the tropical forests of Borneo. Its reddish-brown "
            "hair, extremely long arms and strong hands allow it to move through "
            "the forest canopy. Compared with many other primates, orangutans "
            "are relatively solitary, although mothers maintain exceptionally "
            "strong relationships with their young. They construct sleeping nests "
            "in trees, often building a new nest at the end of the day. Their "
            "ability to remember feeding locations, manipulate objects and adapt "
            "to seasonal fruit availability demonstrates considerable intelligence. "
            "Orangutans are also important seed dispersers, carrying seeds through "
            "large areas of forest as they move between feeding trees."
        ),

        "facts": [
            "Native to the island of Borneo",
            "One of the world's great apes",
            "Builds sleeping nests in trees",
            "Very long arms aid canopy movement",
            "Important rainforest seed disperser",
            "Young remain dependent on mothers for many years",
        ],

        "physical_characteristics": (
            "Adults have long reddish-brown hair, powerful hands, long arms and "
            "flexible joints suited to climbing. Mature males are substantially "
            "larger than females and may develop cheek pads and a throat pouch. "
            "Their feet are also capable of gripping branches, allowing them to "
            "move through complex canopy structures."
        ),

        "behaviour": (
            "Orangutans spend much of their lives in trees. They move carefully "
            "between branches, search for seasonal fruit and build nests for resting. "
            "Adult males can have very large home ranges. Communication includes "
            "calls, gestures, facial expressions and other social signals. "
            "Young orangutans learn many survival skills by closely observing "
            "their mothers."
        ),

        "reproduction": (
            "Orangutans reproduce slowly compared with many mammals. Females normally "
            "raise a single infant at a time and invest years in teaching the young "
            "how to forage, climb and construct nests. This long reproductive interval "
            "means populations cannot quickly recover from heavy mortality."
        ),

        "geographic_range": (
            "The species occurs on Borneo, including Malaysian populations in "
            "Sabah and Sarawak, as well as populations in Indonesian Kalimantan. "
            "Many remaining groups are now isolated by habitat fragmentation."
        ),

        "conservation_threats": (
            "Deforestation, forest fires, habitat conversion, fragmentation, "
            "illegal hunting and capture of young animals are major concerns. "
            "Because orangutans reproduce slowly, even moderate increases in "
            "adult mortality can have large long-term effects."
        ),

        "ecosystem_role": (
            "Orangutans are important seed dispersers. By eating fruit and "
            "moving across wide areas, they transport seeds away from parent "
            "trees and contribute to regeneration and plant diversity in rainforest."
        ),
    },


    {
        "name": "Sun Bear",
        "scientific_name": "Helarctos malayanus",
        "category": "mammals",

        "habitat": (
            "Malayan sun bears live mainly in tropical forests, including "
            "lowland evergreen rainforest, hill forest, peat swamp forest "
            "and other wooded habitats containing fruiting trees, insects "
            "and suitable climbing structures."
        ),

        "diet": (
            "Sun bears are omnivores. They consume fruits, figs, insects, "
            "termites, ants, honey, small vertebrates and other available "
            "food. Their long tongue is particularly useful for extracting "
            "honey and insect larvae from difficult-to-reach cavities."
        ),

        "lifespan": (
            "Sun bears can live for roughly two decades or more, with "
            "managed individuals potentially surviving longer."
        ),

        "conservation_status": "Vulnerable",

        "description": (
            "The Malayan sun bear is the smallest living bear species and "
            "a highly specialised mammal of Southeast Asian tropical forest. "
            "It is named for the pale golden or white chest marking that often "
            "resembles a rising sun, although the exact shape varies between "
            "individuals. Sun bears are powerful climbers and can use their "
            "curved claws to open insect nests, climb trees and manipulate "
            "food. They are generally solitary and can forage both on the "
            "ground and in trees. Their diet is extremely varied, allowing "
            "them to exploit seasonal fruit, insects and honey. Sun bears "
            "also contribute to seed dispersal and soil disturbance through "
            "their feeding and digging activities."
        ),

        "facts": [
            "Smallest living bear species",
            "Recognised by its chest marking",
            "Excellent tree climber",
            "Has an unusually long tongue",
            "Omnivorous forest feeder",
            "Important seed disperser",
        ],

        "physical_characteristics": (
            "Sun bears have compact bodies, short dark fur, strong jaws, "
            "powerful limbs and long curved claws. The pale chest marking "
            "varies between individuals. Their flexible paws and claws help "
            "them climb trees and open decaying wood or insect nests."
        ),

        "behaviour": (
            "Sun bears are usually solitary and may be active during both "
            "day and night, depending on habitat and food availability. "
            "They climb trees to feed, rest and sometimes construct simple "
            "platforms. They rely heavily on smell while locating fruit, "
            "insects and honey."
        ),

        "reproduction": (
            "Females produce a small number of young and provide extensive "
            "maternal care. Cubs remain dependent while learning to climb, "
            "forage and respond to threats. The species' relatively slow "
            "reproductive rate makes adult survival particularly important."
        ),

        "geographic_range": (
            "The Malayan sun bear is distributed across mainland Southeast "
            "Asia and the Sunda region, including Peninsular Malaysia, "
            "Sabah, Sarawak, Borneo and Sumatra."
        ),

        "conservation_threats": (
            "Major pressures include habitat loss, forest fragmentation, "
            "illegal hunting, wildlife trafficking and human-bear conflict "
            "around farms and fruiting crops. Protecting large forest areas "
            "and reducing illegal trade are essential."
        ),

        "ecosystem_role": (
            "Sun bears help regulate insect populations, consume and disperse "
            "fruit seeds and disturb soil and decaying vegetation while feeding. "
            "These activities contribute to nutrient cycling and forest regeneration."
        ),
    },


    {
        "name": "Asian Elephant",
        "scientific_name": "Elephas maximus",
        "category": "mammals",

        "habitat": (
            "Asian elephants occupy forests, grasslands, river valleys and "
            "forest-edge habitats. In Malaysia, they are especially associated "
            "with large protected forest landscapes that provide food, water "
            "and connected movement routes."
        ),

        "diet": (
            "They feed on grasses, leaves, bark, roots, shoots, fruits and "
            "other vegetation. Because of their enormous body size, elephants "
            "consume large quantities of plant material and may travel long "
            "distances between feeding and watering areas."
        ),

        "lifespan": (
            "Asian elephants may live for approximately 50 to 70 years, although "
            "individual survival varies according to food, disease, injuries "
            "and human-related threats."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The Asian elephant is the largest land mammal found in Asia and "
            "one of the most ecologically influential animals in Malaysian "
            "forests. Its trunk is a highly flexible organ used for breathing, "
            "smelling, feeding, drinking, communication and manipulating objects. "
            "Family herds are generally led by experienced females and contain "
            "closely related individuals. Adult males may spend more time alone "
            "or in temporary groups. Elephants require large areas because "
            "they need substantial quantities of food and water, and their "
            "seasonal movements may cross roads, plantations and other human-dominated "
            "areas. This can result in conflict when traditional routes become blocked."
        ),

        "facts": [
            "Largest land animal in Asia",
            "Uses its trunk for many functions",
            "Family herds are often led by females",
            "Can travel long distances",
            "Important ecosystem engineer",
            "Major seed disperser",
        ],

        "physical_characteristics": (
            "Asian elephants have large bodies, column-like legs, a domed head, "
            "a muscular trunk and smaller rounded ears than African elephants. "
            "Some males have large tusks, while tusks are less common in females. "
            "The trunk contains thousands of muscles and permits highly precise movement."
        ),

        "behaviour": (
            "Elephants communicate using vocalisations, touch, body posture, "
            "chemical signals and low-frequency sounds that can travel long distances. "
            "Family members cooperate in caring for young and protecting vulnerable animals. "
            "Herds may repeatedly use traditional routes between feeding and water sites."
        ),

        "reproduction": (
            "Females have a very long gestation period of around 22 months and "
            "normally give birth to a single calf. Mothers and other herd members "
            "protect and teach the young. Calves gradually learn feeding, movement "
            "and social behaviour through observation and experience."
        ),

        "geographic_range": (
            "Asian elephants occur across parts of South and Southeast Asia. "
            "In Malaysia, important populations remain in Peninsular Malaysia "
            "and Sabah."
        ),

        "conservation_threats": (
            "Habitat fragmentation, agricultural expansion, road development, "
            "human-elephant conflict and poaching can affect populations. "
            "Maintaining wildlife corridors is particularly important because "
            "elephants naturally move across very large landscapes."
        ),

        "ecosystem_role": (
            "Elephants are ecosystem engineers. Their feeding and movement "
            "create trails, modify vegetation and transport seeds over long "
            "distances. These changes can create opportunities for other species."
        ),
    },


    {
        "name": "Proboscis Monkey",
        "scientific_name": "Nasalis larvatus",
        "category": "mammals",

        "habitat": (
            "Proboscis monkeys are strongly associated with mangroves, riverine "
            "forests, peat swamp forest and other wetland habitats on Borneo. "
            "They often remain close to rivers and estuaries, where trees provide "
            "food and safe sleeping locations."
        ),

        "diet": (
            "Their diet consists mainly of leaves, young shoots, fruits and "
            "flowers. They are adapted to processing a plant-rich diet and "
            "may change feeding locations according to seasonal availability."
        ),

        "lifespan": (
            "Wild individuals may live for roughly 15 to 20 years, although "
            "lifespan varies with environmental conditions and mortality."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The proboscis monkey is endemic to Borneo and is one of the most "
            "distinctive primates in Malaysia. Adult males are famous for their "
            "large pendulous noses, which are believed to play important roles "
            "in social and vocal communication. The species is also an exceptional "
            "swimmer for a primate. Partially webbed hands and feet assist movement "
            "through water and muddy environments. Groups frequently rest in "
            "riverside trees during the evening and early morning. When threatened, "
            "individuals can dive into rivers and swim rapidly away from danger. "
            "Their close association with wetlands makes them an important indicator "
            "of the condition of Bornean river and mangrove ecosystems."
        ),

        "facts": [
            "Endemic to Borneo",
            "Adult males have very large noses",
            "Excellent swimmer",
            "Partially webbed digits",
            "Often sleeps near rivers",
            "Strongly associated with wetlands",
        ],

        "physical_characteristics": (
            "Adults have reddish-brown and greyish fur, pale undersides and "
            "long limbs adapted for climbing. Males develop exceptionally large "
            "noses. Hands and feet include partial webbing that improves swimming "
            "performance."
        ),

        "behaviour": (
            "Proboscis monkeys live in social groups and communicate using calls, "
            "facial expressions and body movements. They are mainly arboreal but "
            "may move through water and along the ground. Groups often remain close "
            "to rivers because water provides escape routes from predators."
        ),

        "reproduction": (
            "Females generally give birth to a single infant. Young individuals "
            "remain dependent on their mothers while learning to feed, climb and "
            "interact socially within the group."
        ),

        "geographic_range": (
            "The species occurs only on Borneo, including Malaysian populations "
            "in Sabah and Sarawak and populations in Brunei and Kalimantan."
        ),

        "conservation_threats": (
            "Loss of mangroves and riverine forest, habitat fragmentation, fires, "
            "hunting and disturbance can reduce populations. Protection of wetland "
            "corridors is particularly important."
        ),

        "ecosystem_role": (
            "Proboscis monkeys consume large quantities of vegetation and transport "
            "seeds through their movements. Their dependence on intact wetland forest "
            "also makes them useful indicators of ecosystem health."
        ),
    },


    {
        "name": "Malayan Tapir",
        "scientific_name": "Tapirus indicus",
        "category": "mammals",

        "habitat": (
            "Malayan tapirs occur in lowland and hill rainforest, swamp forest, "
            "secondary vegetation and other dense habitats containing abundant "
            "plant food and dependable water sources."
        ),

        "diet": (
            "They are herbivores that browse leaves, shoots, fruits, aquatic "
            "vegetation and other soft plant material. Their flexible upper lip "
            "and nose help them grasp vegetation."
        ),

        "lifespan": (
            "Approximately 25 to 30 years under favourable conditions."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The Malayan tapir is the largest tapir species and the only tapir "
            "native to Asia. Its striking black-and-white adult coat makes it "
            "one of the most recognisable mammals in Malaysian forests. The white "
            "middle section of the body creates a broken outline in low-light "
            "forest environments, helping camouflage the animal. Tapirs generally "
            "live alone and use their strong sense of smell and hearing to locate "
            "food and detect danger. Despite their heavy bodies, they are capable "
            "swimmers and frequently use rivers, streams and muddy wallows. Their "
            "movement across large forest areas also makes them important seed dispersers."
        ),

        "facts": [
            "Largest living tapir species",
            "Only tapir species native to Asia",
            "Distinctive black-and-white coat",
            "Excellent swimmer",
            "Uses a flexible snout while feeding",
            "Important seed disperser",
        ],

        "physical_characteristics": (
            "Adults have a large rounded body, short strong legs, rounded ears "
            "and a flexible trunk-like snout. Front feet have four toes while "
            "hind feet have three. Young animals have a striped and spotted "
            "pattern that gradually changes into the adult colouration."
        ),

        "behaviour": (
            "Tapirs are generally solitary, secretive and more active during "
            "cooler periods. They use established paths through forests and "
            "may spend time in water to cool themselves or escape threats."
        ),

        "reproduction": (
            "Females give birth to a single calf after a gestation of roughly "
            "13 months. The striped young stay with their mother while developing "
            "feeding, movement and survival skills."
        ),

        "geographic_range": (
            "The species occurs in Peninsular Malaysia, southern Thailand and "
            "Sumatra. Malaysian populations are closely associated with remaining "
            "forest complexes."
        ),

        "conservation_threats": (
            "Major threats include habitat fragmentation, road collisions, "
            "snaring, forest conversion and increasing contact with human "
            "development."
        ),

        "ecosystem_role": (
            "Tapirs are large herbivores and important seed dispersers. Their "
            "feeding and movement influence forest vegetation and help transport "
            "seeds over substantial distances."
        ),
    },


    {
        "name": "Malayan Pangolin",
        "scientific_name": "Manis javanica",
        "category": "mammals",

        "habitat": (
            "Malayan pangolins occur in forests, secondary woodland, plantations "
            "close to natural habitats and other environments where ants, termites "
            "and suitable shelter are available."
        ),

        "diet": (
            "The species is an insectivore that feeds mainly on ants, termites "
            "and their larvae. Powerful claws break open nests while the long "
            "sticky tongue extracts insects."
        ),

        "lifespan": (
            "Potentially more than 10 years, although human-caused mortality "
            "substantially reduces wild survival."
        ),

        "conservation_status": "Critically Endangered",

        "description": (
            "The Malayan pangolin is a secretive nocturnal mammal protected by "
            "overlapping keratin scales. These scales form an unusual armour-like "
            "covering and allow the animal to defend itself by curling into a "
            "tight ball when threatened. Its specialised claws are used to open "
            "ant and termite nests, while a remarkably long tongue collects the "
            "insects. Pangolins spend much of their lives alone and are difficult "
            "to observe because they are mainly active at night. Their slow "
            "reproductive rate means that populations cannot recover quickly "
            "from heavy hunting pressure."
        ),

        "facts": [
            "Covered in keratin scales",
            "Feeds mainly on ants and termites",
            "Can curl into a defensive ball",
            "Mostly nocturnal",
            "Has a long sticky tongue",
            "Critically endangered",
        ],

        "physical_characteristics": (
            "The body and tail are covered in overlapping scales, while the "
            "underside is relatively soft. The limbs carry powerful curved claws "
            "and the tail is muscular and useful for support and climbing."
        ),

        "behaviour": (
            "Pangolins are mostly solitary and nocturnal. They rely on smell "
            "and hearing to locate food and identify potential danger. They may "
            "climb trees or use burrows and natural cavities for shelter."
        ),

        "reproduction": (
            "Females usually produce very few young, commonly one offspring at "
            "a time. Young remain closely associated with the mother until they "
            "can feed and move independently."
        ),

        "geographic_range": (
            "The species occurs in parts of mainland Southeast Asia and the "
            "Sunda region, including Peninsular Malaysia."
        ),

        "conservation_threats": (
            "Illegal hunting and trafficking for meat and scales are among the "
            "greatest threats. Habitat loss, snares and road mortality add "
            "further pressure."
        ),

        "ecosystem_role": (
            "Pangolins help regulate insect populations and disturb soil while "
            "digging. Their feeding activities contribute to nutrient cycling "
            "and create opportunities for other organisms."
        ),
    },


    {
        "name": "Siamang",
        "scientific_name": "Symphalangus syndactylus",
        "category": "mammals",

        "habitat": (
            "Siamangs depend on mature tropical forest with sufficiently continuous "
            "tree canopy for feeding, movement and sleeping."
        ),

        "diet": (
            "They eat fruit, leaves, flowers, young shoots and occasional animal "
            "matter. Seasonal food availability strongly influences movement."
        ),

        "lifespan": (
            "Approximately 25 to 30 years in favourable conditions."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The siamang is the largest living gibbon and a highly specialised "
            "canopy-dwelling primate. Its shaggy black coat, extremely long arms "
            "and large throat pouch distinguish it from other Malaysian primates. "
            "Siamangs spend most of their lives above the ground, swinging between "
            "branches and moving through the forest canopy in search of fruit and "
            "leaves. Their loud resonant calls can travel long distances through "
            "dense rainforest and are important for territory and social bonding. "
            "Family groups are usually cohesive and spend considerable time feeding, "
            "resting and grooming together."
        ),

        "facts": [
            "Largest living gibbon",
            "Has a large expandable throat pouch",
            "Highly adapted to canopy life",
            "Lives in family groups",
            "Produces loud calls",
            "Important seed disperser",
        ],

        "physical_characteristics": (
            "Siamangs have long arms, shaggy black hair, compact bodies and "
            "powerful gripping hands. The inflatable throat sac amplifies vocal "
            "signals and can become very large during calling."
        ),

        "behaviour": (
            "Family groups spend most of their time in the canopy. Long arms "
            "allow efficient brachiation. Vocal duets and coordinated calls help "
            "families communicate and defend their territory."
        ),

        "reproduction": (
            "Females generally give birth to one infant at a time. Young remain "
            "with their mothers and family group while developing complex climbing "
            "and social skills."
        ),

        "geographic_range": (
            "Occurs in parts of Peninsular Malaysia and Sumatra."
        ),

        "conservation_threats": (
            "Forest fragmentation, logging, habitat loss and illegal capture "
            "can isolate groups and reduce suitable canopy habitat."
        ),

        "ecosystem_role": (
            "Fruit-eating siamangs disperse seeds through the forest as they travel "
            "between feeding trees and family territories."
        ),
    },


    {
        "name": "Sunda Clouded Leopard",
        "scientific_name": "Neofelis diardi",
        "category": "mammals",

        "habitat": (
            "This secretive cat is associated with dense tropical forest on "
            "Borneo and Sumatra, using both ground-level and arboreal environments."
        ),

        "diet": (
            "It is a carnivore that may hunt mammals, birds, reptiles and other "
            "small or medium-sized prey."
        ),

        "lifespan": (
            "Wild longevity is thought to be roughly 10 to 15 years."
        ),

        "conservation_status": "Vulnerable",

        "description": (
            "The Sunda clouded leopard is a medium-sized forest cat named for "
            "the large cloud-shaped markings across its coat. It is highly secretive "
            "and is rarely seen directly in the wild, making camera trapping an "
            "important research method. The species possesses strong limbs, large "
            "paws and a very long tail that helps maintain balance while climbing. "
            "Individuals are generally solitary and may hunt from both the ground "
            "and trees. As a predator, it contributes to the natural regulation "
            "of smaller forest mammals and other prey."
        ),

        "facts": [
            "Native to Borneo and Sumatra",
            "Distinctive cloud-shaped coat pattern",
            "Excellent climber",
            "Long tail for balance",
            "Usually solitary",
            "Important forest predator",
        ],

        "physical_characteristics": (
            "The body is stocky with short powerful legs, large paws and a very "
            "long tail. Large dark cloud-like markings contrast against the "
            "grey-brown background coat."
        ),

        "behaviour": (
            "Individuals are generally solitary and secretive. They move quietly "
            "through dense vegetation and can climb effectively when hunting or "
            "avoiding danger."
        ),

        "reproduction": (
            "Females produce small litters and provide most parental care. Young "
            "gradually develop climbing, stalking and hunting skills."
        ),

        "geographic_range": (
            "Restricted to Borneo and Sumatra."
        ),

        "conservation_threats": (
            "Habitat loss, forest fragmentation, prey reduction and human disturbance "
            "can reduce populations."
        ),

        "ecosystem_role": (
            "As a forest predator, it helps regulate populations of smaller mammals "
            "and other prey species."
        ),
    },


    {
        "name": "Malayan Flying Fox",
        "scientific_name": "Pteropus vampyrus",
        "category": "mammals",

        "habitat": (
            "This large fruit bat occurs in forests, mangroves, orchards, plantations "
            "and forest edges where flowering and fruiting plants are available."
        ),

        "diet": (
            "The diet includes fruit, nectar, pollen and other plant material."
        ),

        "lifespan": (
            "Often more than 10 years, although survival varies with hunting, habitat "
            "quality and disturbance."
        ),

        "conservation_status": "Least Concern",

        "description": (
            "The Malayan flying fox is one of the world's largest bats and an important "
            "pollinator and seed disperser. Unlike many insect-eating bats, flying "
            "foxes rely strongly on vision and smell to locate fruit and flowers. "
            "They may travel several kilometres from communal roosts to feeding areas, "
            "allowing seeds and pollen to be transported between widely separated trees. "
            "Large colonies may gather in mature trees or mangrove areas. Their ecological "
            "importance extends beyond natural forests because they can also pollinate "
            "fruit trees and contribute to the regeneration of vegetation."
        ),

        "facts": [
            "One of the world's largest bats",
            "Uses vision and smell to locate food",
            "Important pollinator",
            "Major seed disperser",
            "Can fly long distances",
            "Often forms large colonies",
        ],

        "physical_characteristics": (
            "The species has a large body, long muzzle, strong forelimbs and broad "
            "wing membranes stretching between elongated fingers and the body."
        ),

        "behaviour": (
            "Flying foxes typically roost during the day and become active around "
            "sunset. They may travel considerable distances in search of fruit and flowers."
        ),

        "reproduction": (
            "Females normally raise a single young. Mothers protect and nurse the "
            "young until they are capable of independent flight."
        ),

        "geographic_range": (
            "Occurs throughout parts of Southeast Asia, including Malaysia, Borneo "
            "and nearby islands."
        ),

        "conservation_threats": (
            "Hunting, persecution, habitat loss, disturbance of roosts and conflict "
            "with fruit farmers can affect populations."
        ),

        "ecosystem_role": (
            "Flying foxes are important long-distance pollinators and seed dispersers "
            "that connect plant populations across large areas."
        ),
    },


    # --------------------------------------------------------
    # BIRDS
    # --------------------------------------------------------

    {
        "name": "Rhinoceros Hornbill",
        "scientific_name": "Buceros rhinoceros",
        "category": "birds",

        "habitat": (
            "Mature tropical rainforest containing large trees, fruiting plants "
            "and suitable nesting cavities."
        ),

        "diet": (
            "Mostly fruit, supplemented by insects, reptiles and small animal prey."
        ),

        "lifespan": (
            "Potentially several decades under favourable conditions."
        ),

        "conservation_status": "Vulnerable",

        "description": (
            "The Rhinoceros Hornbill is one of the most recognisable birds of the "
            "Malaysian rainforest. Its huge yellow-and-red bill is topped by a "
            "prominent curved casque, giving the species its distinctive appearance. "
            "It spends much of its life high in the forest canopy and moves between "
            "fruiting trees while searching for food. Breeding depends on large "
            "mature trees containing suitable cavities. Because such trees may take "
            "many decades to develop, the loss of mature forest can have an especially "
            "strong effect on hornbill populations. The species is also an important "
            "seed disperser for many rainforest trees."
        ),

        "facts": [
            "Iconic hornbill of Malaysian rainforest",
            "Large casque above the bill",
            "Important seed disperser",
            "Needs mature trees for nesting",
            "Strong canopy flyer",
            "Pairs can maintain long-term bonds",
        ],

        "physical_characteristics": (
            "The bird has a large black body, broad wings, long tail and massive "
            "yellow-and-red bill with a curved casque."
        ),

        "behaviour": (
            "Rhinoceros hornbills travel between fruiting trees and may cross large "
            "distances while searching for food. Loud calls help individuals communicate."
        ),

        "reproduction": (
            "The female uses a tree cavity for nesting and seals much of the entrance, "
            "leaving a small opening through which the male delivers food."
        ),

        "geographic_range": (
            "Occurs across parts of Southeast Asia, including Peninsular Malaysia, "
            "Sabah and Sarawak."
        ),

        "conservation_threats": (
            "Loss of mature forest, removal of large nesting trees and hunting "
            "can reduce populations."
        ),

        "ecosystem_role": (
            "A major seed disperser that carries seeds between fruiting trees and "
            "supports rainforest regeneration."
        ),
    },


    {
        "name": "Great Hornbill",
        "scientific_name": "Buceros bicornis",
        "category": "birds",

        "habitat": (
            "Large mature forests containing tall trees with suitable natural "
            "nest cavities and productive fruiting plants."
        ),

        "diet": (
            "Fruit, insects, reptiles and occasional small vertebrates."
        ),

        "lifespan": (
            "Potentially several decades."
        ),

        "conservation_status": "Least Concern",

        "description": (
            "The Great Hornbill is one of Asia's largest hornbills and an impressive "
            "forest canopy bird. Its huge bill and prominent casque make it easy to "
            "recognise, while its black-and-white plumage becomes particularly striking "
            "during flight. The bird often moves over considerable distances between "
            "fruiting trees and therefore occupies a large ecological space within "
            "the forest. Breeding depends on old trees containing suitable cavities, "
            "making mature forests extremely valuable even when younger vegetation "
            "appears healthy."
        ),

        "facts": [
            "One of Asia's largest hornbills",
            "Large yellow casque",
            "Important fruit-eating bird",
            "Uses tree cavities for nesting",
            "Can travel long distances",
            "Important seed disperser",
        ],

        "physical_characteristics": (
            "Large body, broad wings, long tail and powerful yellow bill with a "
            "large casque."
        ),

        "behaviour": (
            "Often travels between feeding trees and communicates using loud calls "
            "and displays."
        ),

        "reproduction": (
            "The female nests inside a tree cavity while the male delivers food "
            "from outside."
        ),

        "geographic_range": (
            "Occurs across South and Southeast Asia, including suitable Malaysian forests."
        ),

        "conservation_threats": (
            "Loss of mature trees, habitat fragmentation and hunting can reduce "
            "nesting and feeding opportunities."
        ),

        "ecosystem_role": (
            "A major seed disperser that contributes to regeneration of large-seeded "
            "rainforest trees."
        ),
    },


    {
        "name": "Helmeted Hornbill",
        "scientific_name": "Rhinoplax vigil",
        "category": "birds",

        "habitat": (
            "Large areas of intact lowland and hill rainforest containing old trees "
            "suitable for nesting."
        ),

        "diet": (
            "Fruit is important, supplemented by insects and small animal prey."
        ),

        "lifespan": (
            "Long-lived forest bird, though precise wild longevity is uncertain."
        ),

        "conservation_status": "Critically Endangered",

        "description": (
            "The Helmeted Hornbill is one of Southeast Asia's most distinctive "
            "forest birds. Its heavy solid casque makes it unusual among hornbills "
            "and has unfortunately made the species a target for illegal trade. "
            "The bird depends on mature forests containing large trees for nesting "
            "and feeding. Adults travel through the upper canopy searching for fruit "
            "and other food, and their movements can transport seeds over considerable "
            "distances. Protecting the species therefore means protecting some of "
            "the oldest remaining rainforest trees."
        ),

        "facts": [
            "Has a largely solid casque",
            "Critically endangered",
            "Requires mature forest",
            "Important seed disperser",
            "Highly threatened by illegal hunting",
            "Uses tree cavities for nesting",
        ],

        "physical_characteristics": (
            "Large black body, long tail and substantial red-and-yellow bill topped "
            "by a dense solid casque."
        ),

        "behaviour": (
            "Mostly canopy-dwelling and highly mobile between fruiting trees."
        ),

        "reproduction": (
            "Breeding relies on natural tree cavities and the male's ability to "
            "supply food to the enclosed female."
        ),

        "geographic_range": (
            "Occurs across parts of mainland Southeast Asia, Borneo and Sumatra."
        ),

        "conservation_threats": (
            "Illegal hunting for the casque, trafficking and destruction of "
            "old-growth forest are major threats."
        ),

        "ecosystem_role": (
            "A significant disperser of large forest fruits and seeds."
        ),
    },


    # --------------------------------------------------------
    # REPTILES
    # --------------------------------------------------------

    {
        "name": "Common Green Sea Turtle",
        "scientific_name": "Chelonia mydas",
        "category": "reptiles",

        "habitat": (
            "Tropical and subtropical coastal waters, seagrass meadows, lagoons, "
            "coral reef environments and sandy nesting beaches."
        ),

        "diet": (
            "Adults are mainly herbivorous and feed on seagrasses and algae. "
            "Juveniles may have a broader diet."
        ),

        "lifespan": (
            "Several decades, with maturity reached only after many years."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The green sea turtle is an important marine reptile found in Malaysian "
            "waters. Adults are named for the greenish colour of their body fat, "
            "not because their shells are necessarily green. They use powerful "
            "front flippers to travel between feeding grounds and nesting beaches, "
            "sometimes crossing very large marine areas. Females return to suitable "
            "sandy beaches to lay eggs and may produce several nests during a nesting "
            "season. The species connects marine and terrestrial ecosystems because "
            "nesting transfers ocean-derived nutrients onto coastal beaches."
        ),

        "facts": [
            "Marine reptile",
            "Adults graze on seagrass and algae",
            "Females nest on sandy beaches",
            "Can migrate long distances",
            "Nest temperature affects hatchling sex",
            "Important seagrass consumer",
        ],

        "physical_characteristics": (
            "Streamlined body, broad shell and paddle-like flippers adapted for "
            "efficient swimming."
        ),

        "behaviour": (
            "Adults forage in shallow coastal waters and migrate between feeding "
            "and nesting areas. Females commonly nest at night."
        ),

        "reproduction": (
            "Females lay multiple clutches and bury eggs in sand. Incubation lasts "
            "several weeks before hatchlings emerge."
        ),

        "geographic_range": (
            "Widely distributed through tropical and subtropical oceans, including "
            "Malaysian coastal waters."
        ),

        "conservation_threats": (
            "Egg collection, fishing bycatch, plastic pollution, coastal development, "
            "artificial lighting and habitat degradation."
        ),

        "ecosystem_role": (
            "Grazing affects seagrass structure and nesting transfers marine nutrients "
            "to terrestrial coastal environments."
        ),
    },


    {
        "name": "Southern River Terrapin",
        "scientific_name": "Batagur affinis",
        "category": "reptiles",

        "habitat": (
            "Large rivers, estuaries, tidal waterways and sandy riverbanks used "
            "for nesting."
        ),

        "diet": (
            "Aquatic plants, fruits, leaves, molluscs and other available food."
        ),

        "lifespan": (
            "Potentially several decades."
        ),

        "conservation_status": "Critically Endangered",

        "description": (
            "The Southern River Terrapin is a large turtle associated with rivers "
            "and estuaries in Southeast Asia. It depends on both healthy aquatic "
            "habitats and suitable sandy nesting sites, which means conservation "
            "cannot focus on the river alone. Females leave the water to dig nests "
            "and lay eggs, making them particularly vulnerable to disturbance "
            "along riverbanks. Historically the species occupied a wider range, "
            "but habitat modification, egg collection and other human pressures "
            "have caused substantial declines."
        ),

        "facts": [
            "Large freshwater and brackish-water turtle",
            "Uses rivers and estuaries",
            "Needs sandy nesting sites",
            "Critically endangered",
            "Sensitive to river alteration",
            "Conservation includes nest protection",
        ],

        "physical_characteristics": (
            "Large streamlined shell and strong limbs adapted for swimming and "
            "movement through river systems."
        ),

        "behaviour": (
            "Spends most of its time in water while females make seasonal movements "
            "toward nesting areas."
        ),

        "reproduction": (
            "Females lay eggs in sandy riverbanks or beaches. Nest conditions strongly "
            "influence reproductive success."
        ),

        "geographic_range": (
            "Occurs in parts of Peninsular Malaysia and nearby Southeast Asian rivers."
        ),

        "conservation_threats": (
            "Egg collection, habitat modification, sand mining, pollution and fishing "
            "interactions."
        ),

        "ecosystem_role": (
            "Participates in aquatic food webs and helps connect river and terrestrial "
            "nutrient cycles."
        ),
    },


    {
        "name": "Southeast Asian Softshell Turtle",
        "scientific_name": "Amyda cartilaginea",
        "category": "reptiles",

        "habitat": (
            "Freshwater rivers, streams, ponds and swamps with soft sand or mud."
        ),

        "diet": (
            "Aquatic invertebrates, fish, carrion, plants and other available food."
        ),

        "lifespan": (
            "Potentially several decades."
        ),

        "conservation_status": "Vulnerable",

        "description": (
            "The Southeast Asian softshell turtle has a flattened flexible shell "
            "covered by skin rather than the rigid scutes seen in many turtles. "
            "This body design helps it move through water and soft sediment. "
            "Individuals may bury themselves in mud or sand with only the head "
            "exposed, allowing them to remain concealed while breathing near the "
            "surface. It is an adaptable freshwater predator and scavenger that "
            "contributes to the processing of animal and plant material in aquatic "
            "ecosystems."
        ),

        "facts": [
            "Flexible soft shell",
            "Freshwater turtle",
            "Can bury itself in sediment",
            "Long neck and nose",
            "Omnivorous",
            "Important freshwater consumer",
        ],

        "physical_characteristics": (
            "Flattened body, flexible skin-covered shell, powerful limbs and a "
            "long neck ending in a tubular nose."
        ),

        "behaviour": (
            "Often hides beneath soft substrate and can swim rapidly when disturbed."
        ),

        "reproduction": (
            "Females lay eggs in sandy or muddy banks near freshwater habitats."
        ),

        "geographic_range": (
            "Distributed across several parts of Southeast Asia, including Malaysia."
        ),

        "conservation_threats": (
            "Hunting, collection, water pollution, river modification and destruction "
            "of nesting habitat."
        ),

        "ecosystem_role": (
            "Contributes to freshwater food webs as predator, scavenger and consumer "
            "of plant material."
        ),
    },


    # --------------------------------------------------------
    # AMPHIBIAN
    # --------------------------------------------------------

    {
        "name": "Wallace's Flying Frog",
        "scientific_name": "Rhacophorus nigropalmatus",
        "category": "amphibians",

        "habitat": (
            "Humid lowland and hill rainforest containing tall trees, vegetation "
            "and suitable breeding water bodies."
        ),

        "diet": (
            "Insects, spiders and other small invertebrates."
        ),

        "lifespan": (
            "Several years under favourable environmental conditions."
        ),

        "conservation_status": "Least Concern",

        "description": (
            "Wallace's flying frog is a spectacular arboreal amphibian famous for "
            "its ability to glide between trees. It does not produce powered flight; "
            "instead, the frog spreads its enormous webbed feet and limb membranes "
            "to increase drag and control its descent. This adaptation allows it "
            "to move through the rainforest canopy without dropping directly to "
            "the forest floor. The species spends much of its life in vegetation "
            "and is usually most active during humid nighttime conditions. Its "
            "specialised body demonstrates how rainforest amphibians can evolve "
            "remarkable adaptations for life above the ground."
        ),

        "facts": [
            "Known for gliding",
            "Large webbed feet",
            "Arboreal rainforest frog",
            "Mostly nocturnal",
            "Insectivorous",
            "Depends on humid environments",
        ],

        "physical_characteristics": (
            "Green body, broad webbed feet and large membranes between the limbs "
            "that act as gliding surfaces."
        ),

        "behaviour": (
            "Usually active at night and spends most of its time in vegetation. "
            "It can leap from branches and control its descent using extended limbs."
        ),

        "reproduction": (
            "Eggs are laid in vegetation above water and tadpoles eventually enter "
            "the water below."
        ),

        "geographic_range": (
            "Occurs in parts of Southeast Asia, including Borneo and other suitable "
            "Malaysian forest habitats."
        ),

        "conservation_threats": (
            "Forest loss, disturbance of breeding sites, pollution and changes in "
            "humidity can affect populations."
        ),

        "ecosystem_role": (
            "Helps regulate insect populations and serves as prey for other forest animals."
        ),
    },


    # --------------------------------------------------------
    # FISH
    # --------------------------------------------------------

    {
        "name": "Whale Shark",
        "scientific_name": "Rhincodon typus",
        "category": "fish",

        "habitat": (
            "Warm tropical and subtropical oceans, especially coastal and offshore "
            "areas where plankton and fish eggs become concentrated."
        ),

        "diet": (
            "Plankton, fish eggs, small fish and other tiny organisms filtered from water."
        ),

        "lifespan": (
            "Several decades or more, although exact longevity is difficult to measure."
        ),

        "conservation_status": "Endangered",

        "description": (
            "The whale shark is the largest living fish and one of the most spectacular "
            "animals found in tropical seas. Its enormous body contrasts with its gentle "
            "feeding behaviour: the shark filters tiny organisms from seawater rather "
            "than hunting large prey. It may travel considerable distances between "
            "feeding locations and can aggregate seasonally when plankton or fish eggs "
            "are especially abundant. Each individual has a distinctive pattern of "
            "spots and lines, allowing researchers to identify sharks through photographs. "
            "Its large size, slow growth and long lifespan mean that populations can be "
            "slow to recover after human-caused mortality."
        ),

        "facts": [
            "Largest living fish",
            "Filter feeder",
            "Distinctive individual spot pattern",
            "Can migrate long distances",
            "Occurs in Malaysian waters",
            "Slow population recovery",
        ],

        "physical_characteristics": (
            "Broad flattened head, huge mouth, streamlined body, powerful tail and "
            "distinctive pale spots and stripes."
        ),

        "behaviour": (
            "Usually moves slowly while feeding but can migrate across large areas "
            "of ocean between seasonal food sources."
        ),

        "reproduction": (
            "Gives birth to live young. The species matures slowly and produces young "
            "over a long reproductive lifespan."
        ),

        "geographic_range": (
            "Warm tropical and subtropical waters worldwide, including Malaysian seas."
        ),

        "conservation_threats": (
            "Fishing interactions, accidental capture, vessel strikes, pollution and "
            "poorly managed tourism."
        ),

        "ecosystem_role": (
            "Major filter feeder that processes large quantities of seawater and "
            "participates in plankton-based marine food webs."
        ),
    },


    {
        "name": "Bumphead Parrotfish",
        "scientific_name": "Bolbometopon muricatum",
        "category": "fish",

        "habitat": (
            "Shallow tropical coral reefs, lagoons and reef slopes where algae and "
            "reef surfaces provide suitable feeding areas."
        ),

        "diet": (
            "Primarily algae and plant material scraped from reef surfaces, with "
            "small amounts of reef substrate consumed incidentally."
        ),

        "lifespan": (
            "Can live for several decades."
        ),

        "conservation_status": "Vulnerable",

        "description": (
            "The bumphead parrotfish is one of the largest herbivorous reef fishes "
            "and is immediately recognisable by its massive head and beak-like fused "
            "teeth. It feeds by scraping or biting reef surfaces and consuming algae, "
            "thereby helping prevent excessive algal growth that can compete with corals. "
            "Large adults may travel between feeding and resting areas and can become "
            "important members of reef fish communities. Because the fish grows large "
            "and relatively slowly, the loss of adult breeding individuals can affect "
            "populations for many years."
        ),

        "facts": [
            "One of the largest parrotfishes",
            "Powerful fused teeth",
            "Important reef herbivore",
            "Controls algal growth",
            "Can live for decades",
            "Helps maintain coral habitat",
        ],

        "physical_characteristics": (
            "Large deep body, massive forehead and strong fused teeth that form "
            "a beak-like structure."
        ),

        "behaviour": (
            "Generally feeds during daylight and may travel between coral reef areas "
            "in search of algae."
        ),

        "reproduction": (
            "Reproduction occurs through spawning in the water column. Larvae drift "
            "before settling on suitable reefs."
        ),

        "geographic_range": (
            "Distributed through tropical Indo-Pacific reefs, including Malaysia."
        ),

        "conservation_threats": (
            "Overfishing, loss of adult fish, destructive fishing and coral reef "
            "degradation."
        ),

        "ecosystem_role": (
            "A major herbivore that removes algae and contributes to reef sediment "
            "production."
        ),
    },


    # --------------------------------------------------------
    # INSECT
    # --------------------------------------------------------

    {
        "name": "Asian Rhinoceros Beetle",
        "scientific_name": "Oryctes rhinoceros",
        "category": "insects",

        "habitat": (
            "Tropical lowlands, plantations, gardens, forest edges and environments "
            "containing palms and decomposing plant material."
        ),

        "diet": (
            "Larvae feed on decomposing plant material while adults consume plant "
            "juices and may feed on palm tissues."
        ),

        "lifespan": (
            "Usually several months to around one year, depending on environmental conditions."
        ),

        "conservation_status": "Not Evaluated",

        "description": (
            "The Asian rhinoceros beetle is a large scarab beetle named for the "
            "horn-like structure found on adult males. It is widespread in tropical "
            "Asia and is strongly associated with palms and decaying vegetation. "
            "Larvae develop inside decomposing plant material, where they help break "
            "down dead organic matter. Adults are often active at night and are strong "
            "flyers. The species has ecological importance as part of tropical "
            "decomposition food webs but can also become a serious agricultural pest "
            "when large populations attack coconut and other palms."
        ),

        "facts": [
            "Male has a horn",
            "Large scarab beetle",
            "Larvae develop in decaying material",
            "Adults are often nocturnal",
            "Associated with palms",
            "Can become an agricultural pest",
        ],

        "physical_characteristics": (
            "Robust dark brown to black body, strong legs and a horn-like projection "
            "on adult males. Larvae are pale C-shaped grubs."
        ),

        "behaviour": (
            "Adults are often active at night and fly between plants. Larvae remain "
            "inside decomposing vegetation while feeding and developing."
        ),

        "reproduction": (
            "Females lay eggs in suitable decaying organic material. Larvae develop "
            "through several stages before pupating."
        ),

        "geographic_range": (
            "Widespread throughout tropical parts of Southeast Asia and other regions "
            "where it has become established."
        ),

        "conservation_threats": (
            "Not primarily threatened as a conservation species. Instead, outbreaks "
            "can cause agricultural damage in palm-growing areas."
        ),

        "ecosystem_role": (
            "Larvae contribute to decomposition by processing dead plant material, "
            "while adults and larvae become food for insectivorous animals."
        ),
    },
]


# ============================================================
# UPDATE DATABASE
# ============================================================

@transaction.atomic
def seed():

    created_count = 0
    updated_count = 0

    for item in DATA:

        print("\n----------------------------------------")
        print(item["name"])

        # Get 6 species-specific images
        gallery = get_six_images(
            item["name"],
            item["scientific_name"]
        )

        print(
            "Gallery images found:",
            len(gallery)
        )

        # Get a real playable Commons video if one exists
        video = get_video(
            item["name"],
            item["scientific_name"]
        )

        if video:
            print(
                "Playable video found:",
                video
            )
        else:
            print(
                "No suitable Commons video found."
            )

        defaults = {
            "scientific_name":
                item["scientific_name"],

            "category":
                item["category"],

            "habitat":
                item["habitat"],

            "diet":
                item["diet"],

            "lifespan":
                item["lifespan"],

            "conservation_status":
                item["conservation_status"],

            "description":
                item["description"],

            "facts":
                item["facts"],

            "physical_characteristics":
                item["physical_characteristics"],

            "behaviour":
                item["behaviour"],

            "reproduction":
                item["reproduction"],

            "geographic_range":
                item["geographic_range"],

            "conservation_threats":
                item["conservation_threats"],

            "ecosystem_role":
                item["ecosystem_role"],
        }

        # Only replace the video when a real video was found.
        # This preserves your existing Malayan Tiger video.
        if video:
            defaults["video"] = video

        if gallery:
            defaults["gallery"] = gallery
            defaults["image"] = gallery[0]

        animal, created = (
            Animal.objects.update_or_create(
                name=item["name"],
                defaults=defaults
            )
        )

        if created:
            created_count += 1
            print("CREATED")
        else:
            updated_count += 1
            print("UPDATED")


    # ========================================================
    # FINAL REPORT
    # ========================================================

    print("\n========================================")
    print("ENCYCLOPEDIA SEED COMPLETE")
    print("========================================")

    print(
        "Total animals:",
        Animal.objects.count()
    )

    categories = sorted(
        set(
            Animal.objects.values_list(
                "category",
                flat=True
            )
        )
    )

    print(
        "Categories:",
        categories
    )

    print("\nRecords:")

    for animal in Animal.objects.order_by(
        "category",
        "name"
    ):

        print(
            f"{animal.name} | "
            f"{animal.category} | "
            f"Gallery={len(animal.gallery or [])} | "
            f"Video={'YES' if animal.video else 'NO'}"
        )

    print("\nCreated:", created_count)
    print("Updated:", updated_count)


seed()