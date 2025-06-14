#!/usr/bin/env python3
import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

# Sample driving schools data
SAMPLE_SCHOOLS = [
    {
        "id": str(uuid.uuid4()),
        "name": "École Plus de Conduite",
        "address": "123 Rue Hassiba Ben Bouali, Alger Centre",
        "state": "Alger",
        "phone": "+213551234567",
        "email": "contact@ecoleplus.dz",
        "description": "École de conduite moderne avec des instructeurs expérimentés et des véhicules récents. Formation complète théorie et pratique.",
        "logo_url": None,
        "photos": [],
        "price": 35000.0,
        "rating": 4.5,
        "total_reviews": 89,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 36.7537,
        "longitude": 3.0588,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Auto École El Baraka",
        "address": "45 Boulevard Mohamed V, Oran",
        "state": "Oran",
        "phone": "+213556789012",
        "email": "info@elbaraka.dz",
        "description": "Plus de 20 ans d'expérience dans la formation à la conduite. Équipe professionnelle et taux de réussite élevé.",
        "logo_url": None,
        "photos": [],
        "price": 32000.0,
        "rating": 4.2,
        "total_reviews": 156,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 35.6969,
        "longitude": -0.6331,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "École de Conduite Salam",
        "address": "78 Avenue 1er Novembre, Constantine",
        "state": "Constantine",
        "phone": "+213553456789",
        "email": "contact@salam-conduite.dz",
        "description": "Formation de qualité avec moniteurs qualifiés. Cours de code en arabe et français. Parking privé pour leçons.",
        "logo_url": None,
        "photos": [],
        "price": 28000.0,
        "rating": 4.7,
        "total_reviews": 203,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 36.3700,
        "longitude": 6.6100,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Conduite Expert Annaba",
        "address": "12 Rue Ferhat Abbas, Annaba",
        "state": "Annaba",
        "phone": "+213559876543",
        "email": "admin@conduite-expert.dz",
        "description": "École moderne avec simulateurs de conduite. Formation accélérée disponible. Instructeurs masculins et féminins.",
        "logo_url": None,
        "photos": [],
        "price": 30000.0,
        "rating": 4.0,
        "total_reviews": 74,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 36.9000,
        "longitude": 7.7500,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Auto École Tlemcen",
        "address": "89 Boulevard Zighout Youcef, Tlemcen",
        "state": "Tlemcen",
        "phone": "+213552345678",
        "email": "tlemcen@autoecole.dz",
        "description": "École familiale avec plus de 15 ans d'expérience. Cours personnalisés selon votre rythme. Prix compétitifs.",
        "logo_url": None,
        "photos": [],
        "price": 25000.0,
        "rating": 4.3,
        "total_reviews": 127,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 34.8833,
        "longitude": -1.3167,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "École Conduite Premium Blida",
        "address": "56 Rue Ben Boulaid, Blida",
        "state": "Blida",
        "phone": "+213557891234",
        "email": "premium@blida-conduite.dz",
        "description": "Formation premium avec véhicules neufs et équipements modernes. Suivi personnalisé de chaque élève.",
        "logo_url": None,
        "photos": [],
        "price": 40000.0,
        "rating": 4.8,
        "total_reviews": 92,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 36.4700,
        "longitude": 2.8300,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "Conduite Rapide Sétif",
        "address": "23 Avenue Ahmed Bey, Sétif",
        "state": "Sétif",
        "phone": "+213554567890",
        "email": "rapide@setif-auto.dz",
        "description": "Formation rapide et efficace. Stage intensif disponible. Excellent taux de réussite aux examens.",
        "logo_url": None,
        "photos": [],
        "price": 33000.0,
        "rating": 3.9,
        "total_reviews": 65,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 36.1900,
        "longitude": 5.4100,
        "created_at": datetime.utcnow()
    },
    {
        "id": str(uuid.uuid4()),
        "name": "École de Conduite Atlas",
        "address": "67 Rue Larbi Ben M'hidi, Batna",
        "state": "Batna",
        "phone": "+213558901234",
        "email": "atlas@batna-conduite.dz",
        "description": "École située au cœur de Batna. Formation complète avec code de la route et conduite pratique. Équipe jeune et dynamique.",
        "logo_url": None,
        "photos": [],
        "price": 27000.0,
        "rating": 4.1,
        "total_reviews": 111,
        "manager_id": "bbda2e01-694d-4ecf-bffe-d22be87c0b8e",
        "latitude": 35.5600,
        "longitude": 6.1700,
        "created_at": datetime.utcnow()
    }
]

async def add_sample_data():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.driving_school_platform
    
    # Check if schools already exist
    existing_count = await db.driving_schools.count_documents({})
    if existing_count > 0:
        print(f"Database already has {existing_count} schools. Skipping sample data insertion.")
        return
    
    # Insert sample schools
    await db.driving_schools.insert_many(SAMPLE_SCHOOLS)
    print(f"Successfully added {len(SAMPLE_SCHOOLS)} sample driving schools to the database.")
    
    # Print summary
    for school in SAMPLE_SCHOOLS:
        print(f"- {school['name']} in {school['state']} - {school['price']} DZD (Rating: {school['rating']}/5)")

if __name__ == "__main__":
    asyncio.run(add_sample_data())