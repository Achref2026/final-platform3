#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def create_indexes():
    """Create database indexes for better performance"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.driving_school_platform
    
    try:
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        print("✓ Created users indexes")
        
        # Driving schools collection indexes
        await db.driving_schools.create_index("state")
        await db.driving_schools.create_index("price")
        await db.driving_schools.create_index("rating")
        await db.driving_schools.create_index("name")
        await db.driving_schools.create_index([("name", "text"), ("description", "text")])
        print("✓ Created driving_schools indexes")
        
        # Enrollments collection indexes
        await db.enrollments.create_index("student_id")
        await db.enrollments.create_index("driving_school_id")
        await db.enrollments.create_index("enrollment_status")
        print("✓ Created enrollments indexes")
        
        # Courses collection indexes
        await db.courses.create_index("enrollment_id")
        await db.courses.create_index("course_type")
        await db.courses.create_index("status")
        print("✓ Created courses indexes")
        
        # Sessions collection indexes
        await db.sessions.create_index("student_id")
        await db.sessions.create_index("teacher_id")
        await db.sessions.create_index("scheduled_at")
        print("✓ Created sessions indexes")
        
        # Documents collection indexes
        await db.documents.create_index("user_id")
        await db.documents.create_index("document_type")
        print("✓ Created documents indexes")
        
        # Quizzes collection indexes
        await db.quizzes.create_index("course_type")
        await db.quizzes.create_index("difficulty")
        print("✓ Created quizzes indexes")
        
        # Quiz attempts collection indexes
        await db.quiz_attempts.create_index("student_id")
        await db.quiz_attempts.create_index("quiz_id")
        print("✓ Created quiz_attempts indexes")
        
        print("\n🎉 All database indexes created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating indexes: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())