#!/usr/bin/env python3
import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Sample quiz data
SAMPLE_QUIZZES = [
    {
        "id": str(uuid.uuid4()),
        "course_type": "theory",
        "title": "Code de la Route - Signalisation",
        "description": "Quiz sur les panneaux de signalisation routière en Algérie",
        "difficulty": "easy",
        "questions": [
            {
                "id": str(uuid.uuid4()),
                "text": "Que signifie ce panneau : un triangle rouge avec un point d'exclamation ?",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "Danger non spécifique", "is_correct": True},
                    {"id": "b", "text": "Interdiction de passer", "is_correct": False},
                    {"id": "c", "text": "Limitation de vitesse", "is_correct": False},
                    {"id": "d", "text": "Sens interdit", "is_correct": False}
                ],
                "explanation": "Le panneau triangulaire rouge avec point d'exclamation indique un danger non spécifique."
            },
            {
                "id": str(uuid.uuid4()),
                "text": "À un feu rouge, vous devez :",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "Ralentir et passer si la voie est libre", "is_correct": False},
                    {"id": "b", "text": "Vous arrêter complètement", "is_correct": True},
                    {"id": "c", "text": "Accélérer pour passer rapidement", "is_correct": False},
                    {"id": "d", "text": "Klaxonner avant de passer", "is_correct": False}
                ],
                "explanation": "Au feu rouge, l'arrêt complet est obligatoire."
            },
            {
                "id": str(uuid.uuid4()),
                "text": "La vitesse maximale en agglomération est de :",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "40 km/h", "is_correct": False},
                    {"id": "b", "text": "50 km/h", "is_correct": True},
                    {"id": "c", "text": "60 km/h", "is_correct": False},
                    {"id": "d", "text": "70 km/h", "is_correct": False}
                ],
                "explanation": "En Algérie, la vitesse maximale en agglomération est de 50 km/h."
            }
        ],
        "passing_score": 70.0,
        "time_limit_minutes": 30,
        "is_active": True,
        "created_by": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "course_type": "theory",
        "title": "Priorités et Intersections",
        "description": "Règles de priorité aux intersections et ronds-points",
        "difficulty": "medium",
        "questions": [
            {
                "id": str(uuid.uuid4()),
                "text": "À un rond-point, qui a la priorité ?",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "Les véhicules qui entrent", "is_correct": False},
                    {"id": "b", "text": "Les véhicules déjà engagés dans le rond-point", "is_correct": True},
                    {"id": "c", "text": "Les véhicules venant de droite", "is_correct": False},
                    {"id": "d", "text": "Les véhicules les plus rapides", "is_correct": False}
                ],
                "explanation": "Dans un rond-point, la priorité revient aux véhicules déjà engagés."
            },
            {
                "id": str(uuid.uuid4()),
                "text": "Quand doit-on céder le passage ?",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "Toujours aux véhicules venant de gauche", "is_correct": False},
                    {"id": "b", "text": "Aux véhicules prioritaires et selon la signalisation", "is_correct": True},
                    {"id": "c", "text": "Uniquement aux ambulances", "is_correct": False},
                    {"id": "d", "text": "Jamais", "is_correct": False}
                ],
                "explanation": "On cède le passage selon la signalisation et aux véhicules prioritaires."
            }
        ],
        "passing_score": 75.0,
        "time_limit_minutes": 20,
        "is_active": True,
        "created_by": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "course_type": "park",
        "title": "Manœuvres de Stationnement",
        "description": "Quiz sur les différentes techniques de stationnement",
        "difficulty": "medium",
        "questions": [
            {
                "id": str(uuid.uuid4()),
                "text": "Pour un créneau, à quelle distance doit-on s'arrêter du véhicule de devant ?",
                "type": "multiple_choice",
                "options": [
                    {"id": "a", "text": "50 cm", "is_correct": True},
                    {"id": "b", "text": "1 mètre", "is_correct": False},
                    {"id": "c", "text": "2 mètres", "is_correct": False},
                    {"id": "d", "text": "Aucune distance spécifique", "is_correct": False}
                ],
                "explanation": "Pour un créneau, on s'arrête à environ 50 cm du véhicule de devant."
            }
        ],
        "passing_score": 80.0,
        "time_limit_minutes": 15,
        "is_active": True,
        "created_by": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "created_at": datetime.utcnow()
    }
]

async def add_sample_quizzes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.driving_school_platform
    
    # Check if quizzes already exist
    existing_count = await db.quizzes.count_documents({})
    if existing_count > 0:
        print(f"Database already has {existing_count} quizzes. Skipping sample data insertion.")
        return
    
    # Insert sample quizzes
    await db.quizzes.insert_many(SAMPLE_QUIZZES)
    print(f"Successfully added {len(SAMPLE_QUIZZES)} sample quizzes to the database.")
    
    # Print summary
    for quiz in SAMPLE_QUIZZES:
        print(f"- {quiz['title']} ({quiz['course_type']}) - {quiz['difficulty']} - {len(quiz['questions'])} questions")

if __name__ == "__main__":
    asyncio.run(add_sample_quizzes())