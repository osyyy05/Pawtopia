import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from .models import TrainingTopic, Quiz, QuizQuestion


def seed_training():
    TrainingTopic.objects.all().delete()

    topics = [
        {
            "title": "Basic Dog Training",
            "category": "Dog Training",
            "duration": "30 minutes",
            "difficulty": "Beginner",
            "description": "Learn essential commands and positive reinforcement techniques for your dog.",
            "content": """
# Basic Dog Training Guide

## Introduction
Training your dog is essential for building a strong bond and ensuring good behavior. This guide covers fundamental commands and techniques.

## Essential Commands

### 1. Sit
- Hold a treat near your dog's nose
- Move your hand up, allowing their head to follow the treat
- As their bottom touches the ground, say "Sit" and give the treat
- Practice daily for 5-10 minutes

### 2. Stay
- Ask your dog to sit
- Open your palm in front of you and say "Stay"
- Take a few steps back
- Reward them if they stay in place
- Gradually increase distance and duration

### 3. Come
- Put a leash and collar on your dog
- Get down to their level and say "Come" while gently pulling the leash
- Reward when they come to you
- Practice in a safe, enclosed area

## Positive Reinforcement
Always use positive reinforcement - reward good behavior with treats, praise, and affection. Never punish or use harsh methods.

## Practice Schedule
- Train for 10-15 minutes twice daily
- Keep sessions short and fun
- End on a positive note
- Be consistent with commands
""",
            "image": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
            "video_url": "https://www.youtube.com/embed/eHbcb2EQC88",
        },
        {
            "title": "Cat Behavior and Training",
            "category": "Cat Training",
            "duration": "25 minutes",
            "difficulty": "Beginner",
            "description": "Understanding cat behavior and training techniques for a harmonious home.",
            "content": """
# Cat Behavior and Training

## Understanding Your Cat

Cats are independent creatures but can be trained with patience and the right techniques.

## Litter Box Training
- Choose the right location - quiet and accessible
- Use unscented litter initially
- Show your cat the box after meals
- Keep the box clean
- Never punish accidents

## Scratching Post Training
- Place posts near favorite scratching spots
- Use catnip to attract them
- Reward when they use the post
- Cover furniture temporarily

## Basic Commands
Yes, cats can learn commands!
- Use treats and click training
- Keep sessions short (5 minutes)
- Teach "Come," "Sit," and "High Five"

## Behavior Solutions
- Provide adequate play time
- Use puzzle feeders
- Create vertical spaces
- Maintain routine
""",
            "image": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
            "video_url": "https://www.youtube.com/watch?v=example",
        },
        {
            "title": "Pet Bathing Guide",
            "category": "Pet Care Guide",
            "duration": "20 minutes",
            "difficulty": "Beginner",
            "description": "Step-by-step guide to safely and effectively bathe your pets.",
            "content": """
# Pet Bathing Guide

## Before You Start

### Gather Supplies
- Pet-specific shampoo
- Towels
- Brush
- Non-slip mat
- Cotton balls for ears
- Treats

## Dog Bathing Steps

1. **Brush First** - Remove loose fur and tangles
2. **Prepare Water** - Lukewarm temperature
3. **Wet Thoroughly** - Avoid eyes and ears
4. **Apply Shampoo** - Massage gently
5. **Rinse Well** - No residue left
6. **Dry** - Towel dry or use pet dryer
7. **Reward** - Give treats and praise

## Cat Bathing
Most cats don't need regular baths, but when necessary:
- Use cat-specific shampoo
- Fill sink with a few inches of water
- Be gentle and calm
- Have someone help
- Dry thoroughly

## Frequency
- Dogs: Every 4-6 weeks (varies by breed)
- Cats: Rarely, only when necessary
""",
            "image": "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800",
            "video_url": "",
        },
        {
            "title": "Proper Feeding Guide",
            "category": "Feeding Guide",
            "duration": "25 minutes",
            "difficulty": "Beginner",
            "description": "Learn about proper nutrition and feeding schedules for your pets.",
            "content": """
# Proper Feeding Guide

## Understanding Pet Nutrition

### Dogs
- Protein: 18-25% (adult), 22-32% (puppy)
- Fats: Essential for energy
- Carbohydrates: Energy source
- Vitamins and minerals

### Cats
- Obligate carnivores
- Higher protein needs (26-40%)
- Require taurine
- Lower carbohydrate needs

## Feeding Schedule

### Puppies (up to 6 months)
- 3-4 meals per day
- Small, frequent meals

### Adult Dogs
- 2 meals per day
- Consistent timing

### Kittens
- 3-4 meals per day
- High-calorie food

### Adult Cats
- 2 meals per day
- Can also free-feed dry food

## Portion Control
- Follow package guidelines
- Adjust for activity level
- Monitor body condition
- Measure food

## Foods to Avoid
**Toxic to Dogs & Cats:**
- Chocolate
- Onions and garlic
- Grapes and raisins
- Xylitol
- Alcohol
- Caffeine

## Fresh Water
- Always available
- Clean bowl daily
- Multiple water stations
""",
            "image": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800",
            "video_url": "",
        },
    ]

    for topic_data in topics:
        TrainingTopic.objects.create(**topic_data)

    print("Training topics seeded successfully!")

    # Create quizzes and questions
    quiz_data = [
        {
            "training_title": "Basic Dog Training",
            "title": "Basic Dog Training Quiz",
            "questions": [
                {
                    "question": "What is the best training method for dogs?",
                    "options": [
                        "Punishment-based training",
                        "Positive reinforcement",
                        "Ignoring the dog",
                        "Physical correction"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "How long should training sessions be?",
                    "options": [
                        "1 hour",
                        "45 minutes",
                        "10-15 minutes",
                        "2 hours"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "Which command is introduced in the guide as an essential command?",
                    "options": [
                        "Roll over",
                        "Play dead",
                        "Sit",
                        "Fetch"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What should you give your dog when it performs the desired behavior?",
                    "options": [
                        "A punishment",
                        "A reward",
                        "A longer training session",
                        "No response"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What should you do when teaching the Stay command?",
                    "options": [
                        "Run away immediately",
                        "Take a few steps back gradually",
                        "Stop rewarding the dog",
                        "Use physical correction"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What should you gradually increase when practicing Stay?",
                    "options": [
                        "Distance and duration",
                        "Food and water",
                        "Noise and punishment",
                        "Training equipment"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "Where should you practice the Come command?",
                    "options": [
                        "On a busy highway",
                        "In an unsafe area",
                        "In a safe, enclosed area",
                        "Only in a vehicle"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "Which of these is a form of positive reinforcement?",
                    "options": [
                        "Harsh punishment",
                        "Physical correction",
                        "Treats and praise",
                        "Ignoring good behavior"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "How often does the guide recommend training a dog?",
                    "options": [
                        "Once a month",
                        "10-15 minutes twice daily",
                        "One hour once a week",
                        "Only when the dog misbehaves"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What should you do at the end of a training session?",
                    "options": [
                        "End on a positive note",
                        "Punish the dog",
                        "Continue until the dog is tired",
                        "Stop rewarding the dog"
                    ],
                    "correct_answer": 0
                }
            ]
        },

        {
            "training_title": "Cat Behavior and Training",
            "title": "Cat Behavior Quiz",
            "questions": [
                {
                    "question": "Can cats be trained?",
                    "options": [
                        "No, cats cannot be trained",
                        "Yes, with patience and treats",
                        "Only kittens can be trained",
                        "Training cats is harmful"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What should you never do when training a cat?",
                    "options": [
                        "Use treats",
                        "Use punishment",
                        "Be patient",
                        "Keep sessions short"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What type of litter should be used initially according to the guide?",
                    "options": [
                        "Scented litter",
                        "Unscented litter",
                        "Outdoor soil",
                        "Wood chips"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "Where should a cat's litter box be placed?",
                    "options": [
                        "In a noisy area",
                        "In a quiet and accessible location",
                        "Outside the home",
                        "Near its food bowl"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "When should you show your cat the litter box?",
                    "options": [
                        "After meals",
                        "Only at night",
                        "Once a month",
                        "Only when it scratches furniture"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "How should you maintain the litter box?",
                    "options": [
                        "Keep it dirty",
                        "Keep it clean",
                        "Move it every day",
                        "Fill it with water"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "Where should scratching posts be placed?",
                    "options": [
                        "Near favorite scratching spots",
                        "Only outside",
                        "Inside the food bowl",
                        "Far away from the cat"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "What can be used to attract a cat to a scratching post?",
                    "options": [
                        "Chocolate",
                        "Catnip",
                        "Salt",
                        "Coffee"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "How long should cat training sessions be?",
                    "options": [
                        "5 minutes",
                        "30 minutes",
                        "2 hours",
                        "All day"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "Which activity can help provide cats with mental stimulation?",
                    "options": [
                        "Puzzle feeders",
                        "Punishment",
                        "Removing play time",
                        "Keeping the cat isolated"
                    ],
                    "correct_answer": 0
                }
            ]
        },

        {
            "training_title": "Pet Bathing Guide",
            "title": "Pet Bathing Quiz",
            "questions": [
                {
                    "question": "How often should most dogs be bathed according to the guide?",
                    "options": [
                        "Weekly",
                        "Daily",
                        "Every 4-6 weeks",
                        "Once a year"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What temperature should bath water be?",
                    "options": [
                        "Hot",
                        "Cold",
                        "Lukewarm",
                        "Ice cold"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What should you do before bathing a dog?",
                    "options": [
                        "Brush first",
                        "Feed chocolate",
                        "Use very hot water",
                        "Skip preparation"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "What type of shampoo should be used?",
                    "options": [
                        "Pet-specific shampoo",
                        "Dishwashing liquid",
                        "Industrial cleaner",
                        "Perfume"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "What should you avoid when wetting a pet?",
                    "options": [
                        "The body",
                        "The paws",
                        "The eyes and ears",
                        "The tail"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What should you do after applying shampoo?",
                    "options": [
                        "Leave it on permanently",
                        "Rinse well",
                        "Add more soap",
                        "Use hot water"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "Which item can help prevent slipping during a bath?",
                    "options": [
                        "Non-slip mat",
                        "Plastic bag",
                        "Paper towel",
                        "Blanket"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "What should you use to dry a pet?",
                    "options": [
                        "Towel or pet dryer",
                        "Hair spray",
                        "Cooking oil",
                        "Ice"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "How often do most cats need baths?",
                    "options": [
                        "Every day",
                        "Every week",
                        "Rarely, only when necessary",
                        "Every morning"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What should you do after bathing your pet?",
                    "options": [
                        "Leave the pet wet",
                        "Reward with treats and praise",
                        "Punish the pet",
                        "Immediately bathe again"
                    ],
                    "correct_answer": 1
                }
            ]
        },

        {
            "training_title": "Proper Feeding Guide",
            "title": "Pet Feeding Quiz",
            "questions": [
                {
                    "question": "Which food is toxic to both dogs and cats?",
                    "options": [
                        "Chicken",
                        "Rice",
                        "Chocolate",
                        "Fish"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "How many meals should adult dogs have per day according to the guide?",
                    "options": [
                        "1 meal",
                        "2 meals",
                        "4 meals",
                        "6 meals"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "What type of animal are cats described as?",
                    "options": [
                        "Herbivores",
                        "Obligate carnivores",
                        "Omnivores only",
                        "Insectivores"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "Which nutrient do cats require according to the guide?",
                    "options": [
                        "Taurine",
                        "Xylitol",
                        "Alcohol",
                        "Caffeine"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "How many meals per day are recommended for puppies up to 6 months?",
                    "options": [
                        "1 meal",
                        "2 meals",
                        "3-4 meals",
                        "6-8 meals"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What is recommended for puppies' meals?",
                    "options": [
                        "Large meals once a day",
                        "Small, frequent meals",
                        "No food during the day",
                        "Only dry treats"
                    ],
                    "correct_answer": 1
                },
                {
                    "question": "How many meals per day are recommended for kittens?",
                    "options": [
                        "1 meal",
                        "2 meals",
                        "3-4 meals",
                        "8 meals"
                    ],
                    "correct_answer": 2
                },
                {
                    "question": "What should pet owners monitor when controlling portions?",
                    "options": [
                        "Body condition",
                        "Fur color only",
                        "Sleeping position",
                        "Barking volume"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "Which food should pets avoid?",
                    "options": [
                        "Chocolate",
                        "Cooked rice",
                        "Plain chicken",
                        "Fish"
                    ],
                    "correct_answer": 0
                },
                {
                    "question": "How should fresh water be provided?",
                    "options": [
                        "Only once a week",
                        "Always available",
                        "Only during training",
                        "Only at night"
                    ],
                    "correct_answer": 1
                }
            ]
        }
    ]

    for quiz_info in quiz_data:
        training = TrainingTopic.objects.get(
            title=quiz_info["training_title"]
        )

        quiz = Quiz.objects.create(
            training=training,
            title=quiz_info["title"]
        )

        for question_info in quiz_info["questions"]:
            QuizQuestion.objects.create(
                quiz=quiz,
                question=question_info["question"],
                options=question_info["options"],
                correct_answer=question_info["correct_answer"]
            )

    print("Quizzes and questions seeded successfully!")

seed_training()