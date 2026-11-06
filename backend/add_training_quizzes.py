import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from training.models import TrainingTopic, Quiz, QuizQuestion


quiz_data = {
    "Pet Grooming Basics": [
        ("Why is regular brushing important for pets?", ["Remove loose fur and prevent mats", "Increase their weight", "Replace feeding", "Prevent drinking"], 0),
        ("What should be checked regularly during grooming?", ["Nails", "Eye color", "Species", "Height"], 0),
        ("What should be used to brush a pet?", ["A suitable pet brush", "A kitchen knife", "A metal spoon", "A fork"], 0),
        ("Why should pets' ears be checked?", ["To notice dirt or possible problems", "To change their hearing", "To improve appetite", "To increase exercise"], 0),
        ("What is part of dental care?", ["Regular tooth cleaning", "Giving only treats", "Avoiding water", "Never checking the mouth"], 0),
        ("What should you do if grooming causes pain?", ["Stop and check the problem", "Continue harder", "Ignore it", "Punish the pet"], 0),
        ("Why is grooming useful?", ["It supports hygiene and comfort", "It changes the pet's species", "It replaces exercise", "It replaces food"], 0),
        ("Which area can be cleaned during grooming?", ["Fur", "Only the tail", "Only the paws", "None"], 0),
        ("What can indicate that brushing is needed?", ["Matted fur", "Clean fur", "Healthy nails", "Normal appetite"], 0),
        ("How should grooming normally be introduced?", ["Calmly and gradually", "By frightening the pet", "By forcing it immediately", "Only once a year"], 0),
    ],

    "Pet Health and Safety": [
        ("Why should pets have regular veterinary checkups?", ["To monitor their health", "To change their species", "To increase their height", "To replace exercise"], 0),
        ("What should a pet's living area be?", ["Safe and clean", "Dangerous", "Filled with hazards", "Always dark"], 0),
        ("What should you do if a pet becomes seriously ill?", ["Seek veterinary advice", "Ignore it", "Give random medication", "Punish the pet"], 0),
        ("Why should harmful objects be kept away from pets?", ["To prevent accidents", "To increase noise", "To improve appearance", "For entertainment"], 0),
        ("What is important for a pet's health?", ["Balanced nutrition", "Only treats", "No water", "No exercise"], 0),
        ("Should pets have access to clean water?", ["Yes", "No", "Only once a week", "Only during exercise"], 0),
        ("What can help prevent accidents at home?", ["Pet-proofing the environment", "Leaving hazards everywhere", "Ignoring cables", "Leaving doors open"], 0),
        ("What should owners monitor?", ["Changes in behavior or health", "Only fur color", "Only sleeping position", "Nothing"], 0),
        ("Why is exercise important?", ["It supports physical wellbeing", "It replaces food", "It prevents drinking", "It causes illness"], 0),
        ("Who should diagnose serious pet illnesses?", ["A veterinarian", "A stranger", "Another pet", "A social media comment"], 0),
    ],

    "Understanding Pet Body Language": [
        ("Why is pet body language important?", ["It helps us understand their feelings", "It changes their diet", "It replaces training", "It changes their breed"], 0),
        ("What can a relaxed body posture indicate?", ["Comfort", "Always aggression", "Always illness", "Hunger only"], 0),
        ("What should you do if a pet appears frightened?", ["Give it space and remain calm", "Chase it", "Shout loudly", "Force interaction"], 0),
        ("Why should owners observe the whole body?", ["Signals can appear in different body parts", "Only the tail matters", "Only the ears matter", "Nothing can be learned"], 0),
        ("Can tail movement communicate emotion?", ["Yes", "No", "Only in humans", "Only during sleep"], 0),
        ("Can ears provide behavioral clues?", ["Yes", "No", "Only for hearing music", "Never"], 0),
        ("What can defensive body language mean?", ["The pet may feel threatened", "The pet always wants food", "The pet is always happy", "Nothing"], 0),
        ("What is a good response to uncertain behavior?", ["Observe calmly", "Immediately punish", "Shout", "Ignore all signs"], 0),
        ("Why should context be considered?", ["The same signal can have different meanings", "Context never matters", "Pets cannot communicate", "Only humans have emotions"], 0),
        ("What can understanding body language improve?", ["Human-pet communication", "Pet height", "Pet species", "Food color"], 0),
    ],

    "Pet Exercise and Enrichment": [
        ("Why is exercise important for pets?", ["It supports physical health", "It replaces water", "It prevents sleep", "It removes the need for food"], 0),
        ("What is enrichment?", ["Activities that provide mental stimulation", "A type of medicine", "A feeding restriction", "A sleeping method"], 0),
        ("Should exercise be suitable for the pet?", ["Yes", "No", "Only for dogs", "Only for cats"], 0),
        ("What can mental stimulation help prevent?", ["Boredom", "Healthy behavior", "Drinking", "Rest"], 0),
        ("What should be considered when planning exercise?", ["Age and health", "Only fur color", "Only name", "Nothing"], 0),
        ("Can toys provide enrichment?", ["Yes", "No", "Only human toys", "Never"], 0),
        ("What should owners do if a pet becomes overly tired?", ["Allow it to rest", "Force more exercise", "Ignore it", "Punish the pet"], 0),
        ("Is regular activity beneficial?", ["Yes", "No", "Only once a year", "Never"], 0),
        ("What is a good approach to new activities?", ["Introduce them gradually", "Force them immediately", "Avoid observing the pet", "Use punishment"], 0),
        ("Exercise and enrichment support which areas?", ["Physical and mental wellbeing", "Only appearance", "Only appetite", "Only sleep"], 0),
    ],

    "Responsible Pet Ownership": [
        ("What is a basic responsibility of pet ownership?", ["Providing proper care", "Ignoring the pet", "Avoiding water", "Providing only toys"], 0),
        ("Should owners provide clean water?", ["Yes", "No", "Only on weekends", "Only during exercise"], 0),
        ("Why is veterinary care important?", ["To maintain pet health", "To change personality", "To increase height", "To replace feeding"], 0),
        ("What should owners provide?", ["Safe shelter", "Dangerous objects", "No resting area", "No food"], 0),
        ("Why is training useful?", ["It helps pets learn appropriate behaviors", "It replaces healthcare", "It replaces food", "It makes pets human"], 0),
        ("Should owners consider a pet's needs before adopting?", ["Yes", "No", "Only after adoption", "Never"], 0),
        ("What does responsible ownership require?", ["Time and commitment", "No attention", "No planning", "Only money"], 0),
        ("Should pets receive appropriate exercise?", ["Yes", "No", "Only once", "Never"], 0),
        ("What should owners do when a pet has a health concern?", ["Seek appropriate veterinary help", "Ignore it", "Punish the pet", "Give random medicine"], 0),
        ("What is responsible ownership?", ["Meeting a pet's needs throughout its life", "Only buying toys", "Only feeding treats", "Only taking photos"], 0),
    ],

    "Pet First Aid Basics": [
        ("What is the first priority during a pet emergency?", ["Keep the pet and yourself safe", "Run away immediately", "Give random medicine", "Ignore the situation"], 0),
        ("What should you do for a serious injury?", ["Contact a veterinarian", "Ignore it", "Wait several weeks", "Punish the pet"], 0),
        ("Why should owners remain calm?", ["It helps them respond appropriately", "It makes injuries disappear", "It replaces treatment", "It changes the pet's behavior"], 0),
        ("Should human medication be given without veterinary advice?", ["No", "Yes", "Always", "Only at night"], 0),
        ("What should be included in a pet first-aid kit?", ["Appropriate basic supplies", "Only candy", "Only toys", "Nothing"], 0),
        ("What should you do if you suspect poisoning?", ["Contact a veterinarian immediately", "Wait for days", "Give random food", "Ignore it"], 0),
        ("Why is it useful to know an emergency veterinary contact?", ["It allows faster access to professional help", "It replaces first aid", "It prevents all illness", "It replaces training"], 0),
        ("What should you avoid during an emergency?", ["Actions that could cause further injury", "Staying calm", "Seeking help", "Keeping the area safe"], 0),
        ("Can first aid replace veterinary treatment?", ["No", "Yes", "Always", "Only for serious injuries"], 0),
        ("What is the main purpose of pet first aid?", ["Provide immediate basic support while getting appropriate help", "Replace veterinarians", "Train pets", "Improve appearance"], 0),
    ],
}


for training_title, questions in quiz_data.items():

    training = TrainingTopic.objects.get(title=training_title)

    quiz, created = Quiz.objects.get_or_create(
        training=training,
        defaults={
            "title": training_title + " Quiz"
        }
    )

    for question, options, correct_answer in questions:

        QuizQuestion.objects.get_or_create(
            quiz=quiz,
            question=question,
            defaults={
                "options": options,
                "correct_answer": correct_answer
            }
        )

    print(
        training.title,
        "-> Quiz:",
        quiz.id,
        "| Questions:",
        quiz.questions.count()
    )


print()
print("====================================")
print("Total training topics:", TrainingTopic.objects.count())
print("Total quizzes:", Quiz.objects.count())
print("Total questions:", QuizQuestion.objects.count())
print("====================================")