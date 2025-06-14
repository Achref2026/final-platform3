import os
import uuid
import logging
import smtplib
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException, status, Depends, UploadFile, File, Form, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
from enum import Enum
import requests
import cloudinary
import cloudinary.uploader
import cloudinary.api
import aiofiles
import json
import qrcode
from io import BytesIO
import base64
import sys
import os
sys.path.append(os.path.dirname(__file__))

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

# Initialize API Router
api_router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

# Constants
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Initialize FastAPI app
app = FastAPI(title="Driving School Platform API")

# Initialize API Router with /api prefix
api_router = APIRouter(prefix="/api")

# Create demo uploads directory and mount static files
demo_uploads_dir = Path("demo-uploads")
demo_uploads_dir.mkdir(exist_ok=True)
app.mount("/demo-uploads", StaticFiles(directory="demo-uploads"), name="demo-uploads")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.driving_school_platform

# Security setup
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
ALGORITHM = "HS256"

# Daily.co API setup
DAILY_API_KEY = os.environ.get('DAILY_API_KEY')
DAILY_API_URL = os.environ.get('DAILY_API_URL', 'https://api.daily.co/v1')

# Cloudinary setup
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# Basic routes that don't need /api prefix
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Driving School Platform API is running"}

# Enums
class UserRole(str, Enum):
    GUEST = "guest"
    STUDENT = "student"
    TEACHER = "teacher"
    MANAGER = "manager"
    EXTERNAL_EXPERT = "external_expert"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"

class CourseType(str, Enum):
    THEORY = "theory"
    PARK = "park"
    ROAD = "road"

class CourseStatus(str, Enum):
    LOCKED = "locked"  # Can't start yet
    AVAILABLE = "available"  # Can start
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class ExamStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    AVAILABLE = "available"
    PASSED = "passed"
    FAILED = "failed"

class DocumentType(str, Enum):
    PROFILE_PHOTO = "profile_photo"
    ID_CARD = "id_card"
    MEDICAL_CERTIFICATE = "medical_certificate"
    DRIVING_LICENSE = "driving_license"
    TEACHING_LICENSE = "teaching_license"

class EnrollmentStatus(str, Enum):
    PENDING_DOCUMENTS = "pending_documents"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class QuizDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class NotificationType(str, Enum):
    ENROLLMENT_APPROVED = "enrollment_approved"
    ENROLLMENT_REJECTED = "enrollment_rejected"
    SESSION_REMINDER = "session_reminder"
    EXAM_SCHEDULED = "exam_scheduled"
    COURSE_COMPLETED = "course_completed"
    CERTIFICATE_READY = "certificate_ready"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"

class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class CertificateStatus(str, Enum):
    NOT_ELIGIBLE = "not_eligible"
    ELIGIBLE = "eligible"
    GENERATED = "generated"
    ISSUED = "issued"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: str
    date_of_birth: str
    gender: Gender

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    role: UserRole
    is_active: bool = True
    created_at: datetime

class DrivingSchool(BaseModel):
    id: str
    name: str
    address: str
    state: str
    phone: str
    email: EmailStr
    description: str
    logo_url: Optional[str] = None
    photos: List[str] = []
    price: float
    rating: float = 0.0
    total_reviews: int = 0
    manager_id: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

class DrivingSchoolCreate(BaseModel):
    name: str
    address: str
    state: str
    phone: str
    email: EmailStr
    description: str
    price: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Teacher(BaseModel):
    id: str
    user_id: str
    driving_school_id: str
    driving_license_url: str
    teaching_license_url: str
    photo_url: str
    can_teach_male: bool = True
    can_teach_female: bool = True
    rating: float = 0.0
    total_reviews: int = 0
    is_approved: bool = False
    created_at: datetime

class TeacherCreate(BaseModel):
    email: str
    can_teach_male: bool = True
    can_teach_female: bool = True

class Enrollment(BaseModel):
    id: str
    student_id: str
    driving_school_id: str
    enrollment_status: EnrollmentStatus
    created_at: datetime
    approved_at: Optional[datetime] = None

class EnrollmentCreate(BaseModel):
    school_id: str

class Course(BaseModel):
    id: str
    enrollment_id: str
    course_type: CourseType
    status: CourseStatus
    teacher_id: Optional[str] = None
    scheduled_sessions: List[dict] = []
    completed_sessions: int = 0
    total_sessions: int
    exam_status: ExamStatus = ExamStatus.NOT_AVAILABLE
    exam_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class DocumentUpload(BaseModel):
    id: str
    user_id: str
    document_type: DocumentType
    file_url: str
    file_name: str
    file_size: int
    upload_date: datetime
    is_verified: bool = False

# New Models for Enhanced Functionality

class Quiz(BaseModel):
    id: str
    course_type: CourseType
    title: str
    description: str
    difficulty: QuizDifficulty
    questions: List[dict]  # Array of question objects
    passing_score: float = 70.0
    time_limit_minutes: int = 30
    is_active: bool = True
    created_by: str  # manager_id
    created_at: datetime

class QuizCreate(BaseModel):
    course_type: CourseType
    title: str
    description: str
    difficulty: QuizDifficulty
    questions: List[dict]
    passing_score: float = 70.0
    time_limit_minutes: int = 30

class QuizAttempt(BaseModel):
    id: str
    quiz_id: str
    student_id: str
    answers: dict
    score: float
    passed: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    time_taken_minutes: Optional[int] = None

class VideoRoom(BaseModel):
    id: str
    course_id: str
    teacher_id: str
    student_id: str
    room_url: str
    room_name: str
    scheduled_at: datetime
    duration_minutes: int = 60
    is_active: bool = True
    daily_room_id: Optional[str] = None
    created_at: datetime

class VideoRoomCreate(BaseModel):
    course_id: str
    student_id: str
    scheduled_at: str  # ISO string
    duration_minutes: int = 60

class Session(BaseModel):
    id: str
    course_id: str
    teacher_id: str
    student_id: str
    session_type: CourseType
    scheduled_at: datetime
    duration_minutes: int
    location: Optional[str] = None
    status: SessionStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SessionCreate(BaseModel):
    course_id: str
    teacher_id: str
    scheduled_at: str  # ISO string
    duration_minutes: int = 60
    location: Optional[str] = None

class ExternalExpert(BaseModel):
    id: str
    user_id: str
    specialization: List[CourseType]  # park, road
    available_states: List[str]
    certification_number: str
    years_of_experience: int
    rating: float = 0.0
    total_exams_conducted: int = 0
    is_available: bool = True
    created_at: datetime

class ExternalExpertCreate(BaseModel):
    email: str
    specialization: List[CourseType]
    available_states: List[str]
    certification_number: str
    years_of_experience: int

class ExamSchedule(BaseModel):
    id: str
    course_id: str
    student_id: str
    external_expert_id: str
    exam_type: CourseType
    scheduled_at: datetime
    location: str
    duration_minutes: int = 90
    status: ExamStatus
    score: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime

class ExamScheduleCreate(BaseModel):
    course_id: str
    exam_type: CourseType
    preferred_dates: List[str]  # ISO strings
    location: str

class Certificate(BaseModel):
    id: str
    student_id: str
    enrollment_id: str
    certificate_number: str
    issue_date: datetime
    expiry_date: Optional[datetime] = None
    status: CertificateStatus
    pdf_url: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime

class Notification(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool = False
    metadata: Optional[dict] = None
    created_at: datetime

class ProgressAnalytics(BaseModel):
    id: str
    student_id: str
    enrollment_id: str
    course_type: CourseType
    sessions_completed: int
    total_sessions: int
    quiz_scores: List[float] = []
    average_score: float = 0.0
    time_spent_minutes: int = 0
    last_activity: datetime
    completion_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

class ReviewCreate(BaseModel):
    rating: int  # 1-5 stars
    comment: str
    enrollment_id: str

class Review(BaseModel):
    id: str
    student_id: str
    enrollment_id: str
    driving_school_id: str
    teacher_id: Optional[str] = None
    rating: int
    comment: str
    created_at: datetime

# Algerian States (58 wilayas)
ALGERIAN_STATES = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", 
    "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", 
    "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda", 
    "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", 
    "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", 
    "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", 
    "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", 
    "Naâma", "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", 
    "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès", "In Salah", 
    "In Guezzam", "Touggourt", "Djanet", "El M'Ghair", "El Meniaa"
]

# Course sequence order
COURSE_SEQUENCE = [CourseType.THEORY, CourseType.PARK, CourseType.ROAD]

# Required documents by role
REQUIRED_DOCUMENTS = {
    UserRole.STUDENT: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD, DocumentType.MEDICAL_CERTIFICATE],
    UserRole.TEACHER: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD, DocumentType.DRIVING_LICENSE, DocumentType.TEACHING_LICENSE],
    UserRole.MANAGER: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD],
    UserRole.EXTERNAL_EXPERT: [DocumentType.PROFILE_PHOTO, DocumentType.ID_CARD, DocumentType.DRIVING_LICENSE, DocumentType.TEACHING_LICENSE]
}

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    from bson import ObjectId
    from datetime import datetime
    
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB _id field
            result[key] = serialize_doc(value)
        return result
    if isinstance(doc, ObjectId):
        return str(doc)  # Convert ObjectId to string
    if isinstance(doc, datetime):
        return doc.isoformat()  # Convert datetime to ISO string
    return doc

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def check_user_documents_complete(user_id: str, role: str) -> bool:
    """Check if user has uploaded and verified all required documents"""
    required_docs = REQUIRED_DOCUMENTS.get(role, [])
    
    documents_cursor = db.documents.find({
        "user_id": user_id,
        "is_verified": True,
        "document_type": {"$in": [doc.value for doc in required_docs]}
    })
    documents = await documents_cursor.to_list(length=None)
    
    uploaded_types = {doc["document_type"] for doc in documents}
    required_types = {doc.value for doc in required_docs}
    
    return required_types.issubset(uploaded_types)

async def update_course_availability(enrollment_id: str):
    """Update course availability based on completion status"""
    courses_cursor = db.courses.find({"enrollment_id": enrollment_id}).sort("course_type", 1)
    courses = await courses_cursor.to_list(length=None)
    
    # Sort courses by sequence
    course_order = {CourseType.THEORY: 0, CourseType.PARK: 1, CourseType.ROAD: 2}
    courses.sort(key=lambda x: course_order[x["course_type"]])
    
    for i, course in enumerate(courses):
        if i == 0:  # First course (theory) is always available
            if course["status"] == CourseStatus.LOCKED:
                await db.courses.update_one(
                    {"id": course["id"]},
                    {"$set": {"status": CourseStatus.AVAILABLE, "updated_at": datetime.utcnow()}}
                )
        else:
            # Check if previous course is completed and exam passed
            prev_course = courses[i-1]
            if prev_course["exam_status"] == ExamStatus.PASSED:
                if course["status"] == CourseStatus.LOCKED:
                    await db.courses.update_one(
                        {"id": course["id"]},
                        {"$set": {"status": CourseStatus.AVAILABLE, "updated_at": datetime.utcnow()}}
                    )
            else:
                # Lock the course if previous not completed
                if course["status"] != CourseStatus.LOCKED:
                    await db.courses.update_one(
                        {"id": course["id"]},
                        {"$set": {"status": CourseStatus.LOCKED, "updated_at": datetime.utcnow()}}
                    )

async def create_sequential_courses(enrollment_id: str):
    """Create courses with proper sequential logic"""
    courses = []
    course_configs = [
        {"type": CourseType.THEORY, "sessions": 10},
        {"type": CourseType.PARK, "sessions": 5}, 
        {"type": CourseType.ROAD, "sessions": 15}
    ]
    
    for i, course_config in enumerate(course_configs):
        course_id = str(uuid.uuid4())
        # Only first course (theory) is available initially
        initial_status = CourseStatus.AVAILABLE if i == 0 else CourseStatus.LOCKED
        
        course_doc = {
            "id": course_id,
            "enrollment_id": enrollment_id,
            "course_type": course_config["type"],
            "status": initial_status,
            "teacher_id": None,
            "scheduled_sessions": [],
            "completed_sessions": 0,
            "total_sessions": course_config["sessions"],
            "exam_status": ExamStatus.NOT_AVAILABLE,
            "exam_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        courses.append(course_doc)
    
    await db.courses.insert_many(courses)
    return courses

# Cloudinary upload function
async def upload_to_cloudinary(file: UploadFile, folder: str, resource_type: str = "auto"):
    """Upload file to Cloudinary"""
    try:
        file_content = await file.read()
        
        upload_result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type=resource_type,
            public_id=f"{str(uuid.uuid4())}_{file.filename}",
            overwrite=True
        )
        
        return {
            "file_url": upload_result["secure_url"],
            "public_id": upload_result["public_id"],
            "file_size": upload_result.get("bytes", 0),
            "format": upload_result.get("format", ""),
            "width": upload_result.get("width"),
            "height": upload_result.get("height")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

# Enhanced Certificate Generation Functions
async def generate_qr_code(data: str) -> str:
    """Generate QR code and return base64 encoded image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str

async def create_certificate_pdf(certificate_data: dict) -> bytes:
    """Generate a professional PDF certificate"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.darkblue,
        alignment=1,  # Center alignment
        spaceAfter=30
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=colors.blue,
        alignment=1,
        spaceAfter=20
    )
    
    content_style = ParagraphStyle(
        'CustomContent',
        parent=styles['Normal'],
        fontSize=12,
        alignment=1,
        spaceAfter=10
    )
    
    # Build certificate content
    content = []
    
    # Certificate Header
    content.append(Paragraph("🇩🇿 REPUBLIC OF ALGERIA", title_style))
    content.append(Paragraph("MINISTRY OF TRANSPORT", subtitle_style))
    content.append(Spacer(1, 20))
    
    # Certificate Title
    content.append(Paragraph("DRIVING LICENSE CERTIFICATE", title_style))
    content.append(Paragraph("شهادة رخصة القيادة", subtitle_style))
    content.append(Spacer(1, 30))
    
    # Certificate Body
    content.append(Paragraph(
        f"This certifies that <b>{certificate_data['student_name']}</b> has successfully completed",
        content_style
    ))
    content.append(Paragraph(
        f"the comprehensive driving education program at <b>{certificate_data['school_name']}</b>",
        content_style
    ))
    content.append(Spacer(1, 20))
    
    # Certificate Details Table
    details_data = [
        ['Certificate Number:', certificate_data['certificate_number']],
        ['Issue Date:', certificate_data['issue_date'].strftime('%B %d, %Y')],
        ['Valid Until:', certificate_data['expiry_date'].strftime('%B %d, %Y')],
        ['Student ID:', certificate_data['student_id']],
        ['School Location:', certificate_data['school_location']]
    ]
    
    details_table = Table(details_data, colWidths=[2*inch, 3*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(details_table)
    content.append(Spacer(1, 30))
    
    # QR Code for verification
    qr_code = await generate_qr_code(f"VERIFY:{certificate_data['certificate_number']}")
    qr_image = Image(BytesIO(base64.b64decode(qr_code)), width=100, height=100)
    content.append(Paragraph("Scan QR Code to Verify Certificate:", content_style))
    content.append(qr_image)
    content.append(Spacer(1, 20))
    
    # Signature section
    content.append(Paragraph("Authorized by the Ministry of Transport, Algeria", content_style))
    content.append(Paragraph("This certificate is valid for 5 years from the date of issue.", content_style))
    
    # Build PDF
    doc.build(content)
    buffer.seek(0)
    return buffer.getvalue()

# Enhanced Analytics Functions
async def generate_student_analytics_chart(student_data: dict) -> str:
    """Generate analytics charts for student progress"""
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle(f"Student Progress Analytics - {student_data['student_name']}", fontsize=16)
    
    # Course Progress Chart
    courses = ['Theory', 'Park', 'Road']
    progress = [
        student_data.get('theory_progress', 0),
        student_data.get('park_progress', 0),
        student_data.get('road_progress', 0)
    ]
    
    colors_list = ['#3498db', '#2ecc71', '#e74c3c']
    ax1.bar(courses, progress, color=colors_list)
    ax1.set_title('Course Progress (%)')
    ax1.set_ylabel('Completion %')
    ax1.set_ylim(0, 100)
    
    # Quiz Scores Over Time
    if student_data.get('quiz_scores'):
        quiz_dates = range(1, len(student_data['quiz_scores']) + 1)
        ax2.plot(quiz_dates, student_data['quiz_scores'], marker='o', color='#9b59b6')
        ax2.set_title('Quiz Scores Over Time')
        ax2.set_xlabel('Quiz Number')
        ax2.set_ylabel('Score (%)')
        ax2.set_ylim(0, 100)
    else:
        ax2.text(0.5, 0.5, 'No Quiz Data Available', ha='center', va='center', transform=ax2.transAxes)
        ax2.set_title('Quiz Scores')
    
    # Session Attendance
    session_data = student_data.get('session_attendance', {})
    if session_data:
        sessions = list(session_data.keys())
        attendance = list(session_data.values())
        ax3.pie(attendance, labels=sessions, autopct='%1.1f%%', startangle=90)
        ax3.set_title('Session Attendance')
    else:
        ax3.text(0.5, 0.5, 'No Session Data Available', ha='center', va='center', transform=ax3.transAxes)
        ax3.set_title('Session Attendance')
    
    # Time Spent Learning (hours)
    learning_time = student_data.get('learning_time', {})
    if learning_time:
        activities = list(learning_time.keys())
        hours = list(learning_time.values())
        ax4.barh(activities, hours, color='#f39c12')
        ax4.set_title('Time Spent Learning (Hours)')
        ax4.set_xlabel('Hours')
    else:
        ax4.text(0.5, 0.5, 'No Time Data Available', ha='center', va='center', transform=ax4.transAxes)
        ax4.set_title('Learning Time')
    
    plt.tight_layout()
    
    # Save to base64
    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
    buffer.seek(0)
    chart_base64 = base64.b64encode(buffer.getvalue()).decode()
    plt.close()
    
    return chart_base64

async def calculate_student_metrics(student_id: str) -> dict:
    """Calculate comprehensive student metrics"""
    # Get student enrollments
    enrollments_cursor = db.enrollments.find({"student_id": student_id})
    enrollments = await enrollments_cursor.to_list(length=None)
    
    metrics = {
        "total_enrollments": len(enrollments),
        "completed_courses": 0,
        "total_quiz_attempts": 0,
        "average_quiz_score": 0,
        "total_sessions_attended": 0,
        "certificates_earned": 0,
        "learning_time_hours": 0,
        "course_progress": {},
        "quiz_scores": [],
        "session_attendance": {},
        "learning_time": {}
    }
    
    for enrollment in enrollments:
        # Get courses for this enrollment
        courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
        courses = await courses_cursor.to_list(length=None)
        
        for course in courses:
            course_type = course["course_type"]
            progress = (course["completed_sessions"] / course["total_sessions"]) * 100 if course["total_sessions"] > 0 else 0
            metrics["course_progress"][course_type] = progress
            
            if course["status"] == "completed":
                metrics["completed_courses"] += 1
        
        # Get quiz attempts
        quiz_attempts_cursor = db.quiz_attempts.find({"student_id": student_id})
        quiz_attempts = await quiz_attempts_cursor.to_list(length=None)
        
        quiz_scores = [attempt["score"] for attempt in quiz_attempts]
        metrics["total_quiz_attempts"] = len(quiz_attempts)
        metrics["quiz_scores"] = quiz_scores
        metrics["average_quiz_score"] = sum(quiz_scores) / len(quiz_scores) if quiz_scores else 0
        
        # Get sessions
        sessions_cursor = db.sessions.find({"student_id": student_id})
        sessions = await sessions_cursor.to_list(length=None)
        
        attended_sessions = [s for s in sessions if s["status"] == "completed"]
        metrics["total_sessions_attended"] = len(attended_sessions)
        
        # Calculate session attendance by type
        for session in sessions:
            session_type = session["session_type"]
            if session_type not in metrics["session_attendance"]:
                metrics["session_attendance"][session_type] = 0
            if session["status"] == "completed":
                metrics["session_attendance"][session_type] += 1
        
        # Calculate learning time (estimated)
        metrics["learning_time"] = {
            "Theory Sessions": len([s for s in attended_sessions if s["session_type"] == "theory"]) * 1,
            "Park Practice": len([s for s in attended_sessions if s["session_type"] == "park"]) * 1.5,
            "Road Practice": len([s for s in attended_sessions if s["session_type"] == "road"]) * 2
        }
        metrics["learning_time_hours"] = sum(metrics["learning_time"].values())
    
    # Get certificates
    certificates_cursor = db.certificates.find({"student_id": student_id})
    certificates = await certificates_cursor.to_list(length=None)
    metrics["certificates_earned"] = len(certificates)
    
    return metrics

# API Routes
@api_router.get("/health")
async def api_health_check():
    return {"status": "healthy", "message": "Driving School Platform API is running"}

@api_router.get("/states")
async def get_states():
    return {"states": ALGERIAN_STATES}

@api_router.post("/auth/register", response_model=dict)
async def register_user(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone: str = Form(...),
    address: str = Form(...),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    state: str = Form(...),
    profile_photo: Optional[UploadFile] = File(None)
):
    try:
        # Validate date_of_birth format
        try:
            birth_date = datetime.fromisoformat(date_of_birth)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Validate state
        if state not in ALGERIAN_STATES:
            raise HTTPException(status_code=400, detail="Invalid state")
        
        # Validate gender
        if gender not in ['male', 'female']:
            raise HTTPException(status_code=400, detail="Invalid gender")
        
        # Hash password
        password_hash = pwd_context.hash(password)
        
        # Handle profile photo upload
        profile_photo_url = None
        if profile_photo and profile_photo.size > 0:
            try:
                upload_result = await upload_to_cloudinary(profile_photo, "profile_photos", "image")
                profile_photo_url = upload_result["file_url"]
            except Exception as e:
                logger.warning(f"Failed to upload profile photo: {str(e)}")
        
        # Create user with default "guest" role
        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": password_hash,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "address": address,
            "date_of_birth": birth_date,
            "gender": gender,
            "role": "guest",
            "state": state,
            "profile_photo_url": profile_photo_url,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        await db.users.insert_one(user_data)
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data["id"]}, 
            expires_delta=access_token_expires
        )
        
        # Return user data (exclude password hash)
        user_response = {k: v for k, v in user_data.items() if k != "password_hash"}
        user_response = serialize_doc(user_response)
        
        return {
            "message": "Registration successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login", response_model=dict)
async def login_user(user_data: UserLogin):
    try:
        # Find user by email
        user = await db.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"]}, 
            expires_delta=access_token_expires
        )
        
        # Return user data (exclude password hash)
        user_response = {k: v for k, v in user.items() if k != "password_hash"}
        user_response = serialize_doc(user_response)
        
        return {
            "message": "Login successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/driving-schools")
async def get_driving_schools(
    state: str = None,
    search: str = None,
    min_price: float = None,
    max_price: float = None,
    min_rating: float = None,
    sort_by: str = "name",  # name, price, rating, newest
    sort_order: str = "asc",  # asc, desc
    page: int = 1,
    limit: int = 20
):
    try:
        # Build query
        query = {}
        
        # State filter
        if state:
            query["state"] = state
        
        # Search filter (name, description, address)
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"name": search_regex},
                {"description": search_regex},
                {"address": search_regex}
            ]
        
        # Price range filter
        if min_price is not None or max_price is not None:
            price_filter = {}
            if min_price is not None:
                price_filter["$gte"] = min_price
            if max_price is not None:
                price_filter["$lte"] = max_price
            query["price"] = price_filter
        
        # Rating filter
        if min_rating is not None:
            query["rating"] = {"$gte": min_rating}
        
        # Sort configuration
        sort_field = "name"
        if sort_by == "price":
            sort_field = "price"
        elif sort_by == "rating":
            sort_field = "rating"
        elif sort_by == "newest":
            sort_field = "created_at"
        
        sort_direction = 1 if sort_order == "asc" else -1
        
        # Calculate pagination
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total_count = await db.driving_schools.count_documents(query)
        
        # Fetch schools with pagination and sorting
        schools_cursor = db.driving_schools.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)
        schools = await schools_cursor.to_list(length=None)
        
        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit
        has_next = page < total_pages
        has_prev = page > 1
        
        # Serialize the schools data
        schools_serialized = serialize_doc(schools)
        
        return {
            "schools": schools_serialized,
            "pagination": {
                "current_page": page,
                "total_pages": total_pages,
                "total_count": total_count,
                "has_next": has_next,
                "has_prev": has_prev,
                "per_page": limit
            },
            "filters_applied": {
                "state": state,
                "search": search,
                "min_price": min_price,
                "max_price": max_price,
                "min_rating": min_rating,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching driving schools: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch driving schools")

@api_router.get("/driving-schools/search-suggestions")
async def get_search_suggestions(q: str):
    """Get search suggestions for driving school names"""
    try:
        if len(q) < 2:
            return {"suggestions": []}
        
        # Get school names that match the query
        query = {"name": {"$regex": q, "$options": "i"}}
        schools_cursor = db.driving_schools.find(query, {"name": 1, "_id": 0}).limit(10)
        schools = await schools_cursor.to_list(length=None)
        
        suggestions = [school["name"] for school in schools]
        
        return {"suggestions": suggestions}
    
    except Exception as e:
        logger.error(f"Error getting search suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get search suggestions")

@api_router.get("/driving-schools/filters/stats")
async def get_filter_stats():
    """Get statistics for filter options (price range, rating distribution)"""
    try:
        # Get price range
        price_stats = await db.driving_schools.aggregate([
            {
                "$group": {
                    "_id": None,
                    "min_price": {"$min": "$price"},
                    "max_price": {"$max": "$price"},
                    "avg_price": {"$avg": "$price"}
                }
            }
        ]).to_list(length=1)
        
        # Get rating distribution
        rating_stats = await db.driving_schools.aggregate([
            {
                "$group": {
                    "_id": {"$floor": "$rating"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]).to_list(length=None)
        
        # Get state distribution
        state_stats = await db.driving_schools.aggregate([
            {
                "$group": {
                    "_id": "$state",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}}
        ]).to_list(length=None)
        
        result = {
            "price_range": {
                "min": price_stats[0]["min_price"] if price_stats else 0,
                "max": price_stats[0]["max_price"] if price_stats else 100000,
                "average": price_stats[0]["avg_price"] if price_stats else 50000
            },
            "rating_distribution": {str(stat["_id"]): stat["count"] for stat in rating_stats},
            "state_distribution": state_stats[:10],  # Top 10 states
            "total_schools": await db.driving_schools.count_documents({})
        }
        
        return result
    
    except Exception as e:
        logger.error(f"Error getting filter stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get filter statistics")

@api_router.post("/enrollments")
async def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user = Depends(get_current_user)
):
    try:
        # Check if user is a guest (students can enroll)
        if current_user["role"] not in ["guest", "student"]:
            raise HTTPException(status_code=403, detail="Only guests and students can enroll")
        
        # Check if school exists
        school = await db.driving_schools.find_one({"id": enrollment_data.school_id})
        if not school:
            raise HTTPException(status_code=404, detail="Driving school not found")
        
        # Check if user already enrolled in this school
        existing_enrollment = await db.enrollments.find_one({
            "student_id": current_user["id"],
            "driving_school_id": enrollment_data.school_id,
            "enrollment_status": {"$in": ["pending_documents", "pending_approval", "approved"]}
        })
        
        if existing_enrollment:
            raise HTTPException(status_code=400, detail="Already enrolled or have pending enrollment")
        
        # Create enrollment without payment requirement
        enrollment_id = str(uuid.uuid4())
        enrollment_doc = {
            "id": enrollment_id,
            "student_id": current_user["id"],
            "driving_school_id": enrollment_data.school_id,
            "enrollment_status": EnrollmentStatus.PENDING_DOCUMENTS,
            "created_at": datetime.utcnow(),
            "approved_at": None
        }
        
        await db.enrollments.insert_one(enrollment_doc)
        
        # Update user role to student if they were a guest
        if current_user["role"] == "guest":
            await db.users.update_one(
                {"id": current_user["id"]},
                {"$set": {"role": "student"}}
            )
        
        # Create sequential courses for the enrollment
        await create_sequential_courses(enrollment_id)
        
        return {
            "message": "Enrollment successful! Please upload required documents for approval.",
            "enrollment_id": enrollment_id,
            "status": "pending_documents"
        }
    
    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Enrollment failed")

@api_router.get("/dashboard")
async def get_dashboard_data(current_user = Depends(get_current_user)):
    try:
        dashboard_data = {
            "user": serialize_doc(current_user),
            "enrollments": [],
            "courses": [],
            "notifications": []
        }
        
        # Get user's enrollments
        enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
        enrollments = await enrollments_cursor.to_list(length=None)
        
        # Get school information for each enrollment
        for enrollment in enrollments:
            school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
            if school:
                enrollment["school_name"] = school["name"]
                enrollment["school_address"] = school["address"]
        
        dashboard_data["enrollments"] = serialize_doc(enrollments)
        
        # Get courses for approved enrollments
        if enrollments:
            enrollment_ids = [e["id"] for e in enrollments if e["enrollment_status"] == "approved"]
            if enrollment_ids:
                courses_cursor = db.courses.find({"enrollment_id": {"$in": enrollment_ids}})
                courses = await courses_cursor.to_list(length=None)
                dashboard_data["courses"] = serialize_doc(courses)
        
        # Get recent notifications
        notifications_cursor = db.notifications.find(
            {"user_id": current_user["id"]}
        ).sort("created_at", -1).limit(10)
        notifications = await notifications_cursor.to_list(length=None)
        dashboard_data["notifications"] = serialize_doc(notifications)
        
        return dashboard_data
    
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard data")

@api_router.post("/documents/upload")
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        # Validate document type
        if document_type not in [doc.value for doc in DocumentType]:
            raise HTTPException(status_code=400, detail="Invalid document type")
        
        # Upload file to Cloudinary
        upload_result = await upload_to_cloudinary(file, f"documents/{document_type}", "auto")
        
        # Create document record
        document_id = str(uuid.uuid4())
        document_doc = {
            "id": document_id,
            "user_id": current_user["id"],
            "document_type": document_type,
            "file_url": upload_result["file_url"],
            "file_name": file.filename,
            "file_size": upload_result["file_size"],
            "upload_date": datetime.utcnow(),
            "is_verified": False  # Manager needs to verify
        }
        
        await db.documents.insert_one(document_doc)
        
        return {
            "message": "Document uploaded successfully",
            "document_id": document_id,
            "file_url": upload_result["file_url"]
        }
    
    except Exception as e:
        logger.error(f"Document upload error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Document upload failed")

@api_router.get("/documents")
async def get_user_documents(current_user = Depends(get_current_user)):
    try:
        documents_cursor = db.documents.find({"user_id": current_user["id"]})
        documents = await documents_cursor.to_list(length=None)
        
        return {"documents": serialize_doc(documents)}
    
    except Exception as e:
        logger.error(f"Get documents error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")

# Manager Routes
@api_router.get("/manager/enrollments")
async def get_pending_enrollments(current_user = Depends(get_current_user)):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can access this")
        
        # Get manager's driving school
        school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
        if not school:
            raise HTTPException(status_code=404, detail="No driving school found for this manager")
        
        # Get pending enrollments for the school
        enrollments_cursor = db.enrollments.find({
            "driving_school_id": school["id"],
            "enrollment_status": {"$in": ["pending_documents", "pending_approval"]}
        })
        enrollments = await enrollments_cursor.to_list(length=None)
        
        # Get student information for each enrollment
        for enrollment in enrollments:
            student = await db.users.find_one({"id": enrollment["student_id"]})
            if student:
                enrollment["student_name"] = f"{student['first_name']} {student['last_name']}"
                enrollment["student_email"] = student["email"]
                enrollment["student_phone"] = student["phone"]
        
        return {"enrollments": serialize_doc(enrollments)}
    
    except Exception as e:
        logger.error(f"Get enrollments error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to fetch enrollments")

@api_router.post("/manager/enrollments/{enrollment_id}/approve")
async def approve_enrollment(
    enrollment_id: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can approve enrollments")
        
        # Get enrollment
        enrollment = await db.enrollments.find_one({"id": enrollment_id})
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Verify manager owns this school
        school = await db.driving_schools.find_one({
            "id": enrollment["driving_school_id"],
            "manager_id": current_user["id"]
        })
        if not school:
            raise HTTPException(status_code=403, detail="Unauthorized to approve this enrollment")
        
        # Check if student has uploaded all required documents
        documents_complete = await check_user_documents_complete(
            enrollment["student_id"], 
            "student"
        )
        
        if not documents_complete:
            raise HTTPException(status_code=400, detail="Student has not uploaded all required documents")
        
        # Approve enrollment
        await db.enrollments.update_one(
            {"id": enrollment_id},
            {
                "$set": {
                    "enrollment_status": EnrollmentStatus.APPROVED,
                    "approved_at": datetime.utcnow()
                }
            }
        )
        
        # Update course availability
        await update_course_availability(enrollment_id)
        
        # Send notification to student
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": enrollment["student_id"],
            "type": NotificationType.ENROLLMENT_APPROVED,
            "title": "Enrollment Approved!",
            "message": f"Your enrollment at {school['name']} has been approved. You can now start your courses!",
            "is_read": False,
            "metadata": {"enrollment_id": enrollment_id, "school_name": school["name"]},
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification_doc)
        
        return {"message": "Enrollment approved successfully"}
    
    except Exception as e:
        logger.error(f"Approve enrollment error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to approve enrollment")

@api_router.post("/manager/enrollments/{enrollment_id}/reject")
async def reject_enrollment(
    enrollment_id: str,
    reason: str = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can reject enrollments")
        
        # Get enrollment
        enrollment = await db.enrollments.find_one({"id": enrollment_id})
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Verify manager owns this school
        school = await db.driving_schools.find_one({
            "id": enrollment["driving_school_id"],
            "manager_id": current_user["id"]
        })
        if not school:
            raise HTTPException(status_code=403, detail="Unauthorized to reject this enrollment")
        
        # Reject enrollment
        await db.enrollments.update_one(
            {"id": enrollment_id},
            {"$set": {"enrollment_status": EnrollmentStatus.REJECTED}}
        )
        
        # Send notification to student
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": enrollment["student_id"],
            "type": NotificationType.ENROLLMENT_REJECTED,
            "title": "Enrollment Rejected",
            "message": f"Your enrollment at {school['name']} was rejected. Reason: {reason}",
            "is_read": False,
            "metadata": {"enrollment_id": enrollment_id, "school_name": school["name"], "reason": reason},
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification_doc)
        
        return {"message": "Enrollment rejected"}
    
    except Exception as e:
        logger.error(f"Reject enrollment error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to reject enrollment")

# DRIVING SCHOOL MANAGEMENT ENDPOINTS

@api_router.post("/driving-schools")
async def create_driving_school(
    school_data: DrivingSchoolCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "guest":
            raise HTTPException(status_code=403, detail="Only guests can create driving schools")
        
        # Update user role to manager
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "manager"}}
        )
        
        # Create driving school
        school_id = str(uuid.uuid4())
        school_doc = {
            "id": school_id,
            "name": school_data.name,
            "address": school_data.address,
            "state": school_data.state,
            "phone": school_data.phone,
            "email": school_data.email,
            "description": school_data.description,
            "logo_url": None,
            "photos": [],
            "price": school_data.price,
            "rating": 0.0,
            "total_reviews": 0,
            "manager_id": current_user["id"],
            "latitude": school_data.latitude,
            "longitude": school_data.longitude,
            "created_at": datetime.utcnow()
        }
        
        await db.driving_schools.insert_one(school_doc)
        
        return {"id": school_id, "message": "Driving school created successfully"}
    
    except Exception as e:
        logger.error(f"Create driving school error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to create driving school")

@api_router.get("/driving-schools/{school_id}")
async def get_driving_school(school_id: str):
    try:
        school = await db.driving_schools.find_one({"id": school_id})
        if not school:
            raise HTTPException(status_code=404, detail="Driving school not found")
        
        return serialize_doc(school)
    
    except Exception as e:
        logger.error(f"Get driving school error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve driving school")

@api_router.put("/driving-schools/{school_id}")
async def update_driving_school(
    school_id: str,
    school_data: DrivingSchoolCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can update driving schools")
        
        # Verify ownership
        school = await db.driving_schools.find_one({
            "id": school_id,
            "manager_id": current_user["id"]
        })
        if not school:
            raise HTTPException(status_code=404, detail="Driving school not found or unauthorized")
        
        # Update school
        update_data = {
            "name": school_data.name,
            "address": school_data.address,
            "state": school_data.state,
            "phone": school_data.phone,
            "email": school_data.email,
            "description": school_data.description,
            "price": school_data.price,
            "latitude": school_data.latitude,
            "longitude": school_data.longitude
        }
        
        await db.driving_schools.update_one(
            {"id": school_id},
            {"$set": update_data}
        )
        
        return {"message": "Driving school updated successfully"}
    
    except Exception as e:
        logger.error(f"Update driving school error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to update driving school")

# TEACHER MANAGEMENT ENDPOINTS

@api_router.post("/teachers/add")
async def add_teacher(
    teacher_data: TeacherCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can add teachers")
        
        # Get manager's school
        school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
        if not school:
            raise HTTPException(status_code=404, detail="Manager has no driving school")
        
        # Find teacher user by email
        teacher_user = await db.users.find_one({"email": teacher_data.email})
        if not teacher_user:
            raise HTTPException(status_code=404, detail="User not found with this email")
        
        if teacher_user["role"] not in ["guest", "teacher"]:
            raise HTTPException(status_code=400, detail="User cannot be assigned as teacher")
        
        # Check if teacher already exists for this school
        existing_teacher = await db.teachers.find_one({
            "user_id": teacher_user["id"],
            "driving_school_id": school["id"]
        })
        if existing_teacher:
            raise HTTPException(status_code=400, detail="Teacher already exists for this school")
        
        # Create teacher record
        teacher_id = str(uuid.uuid4())
        teacher_doc = {
            "id": teacher_id,
            "user_id": teacher_user["id"],
            "driving_school_id": school["id"],
            "driving_license_url": "",
            "teaching_license_url": "",
            "photo_url": teacher_user.get("profile_photo_url", ""),
            "can_teach_male": teacher_data.can_teach_male,
            "can_teach_female": teacher_data.can_teach_female,
            "rating": 0.0,
            "total_reviews": 0,
            "is_approved": False,
            "created_at": datetime.utcnow()
        }
        
        await db.teachers.insert_one(teacher_doc)
        
        # Update user role to teacher
        await db.users.update_one(
            {"id": teacher_user["id"]},
            {"$set": {"role": "teacher"}}
        )
        
        return {"teacher_id": teacher_id, "message": "Teacher added successfully"}
    
    except Exception as e:
        logger.error(f"Add teacher error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to add teacher")

@api_router.get("/teachers/my")
async def get_my_teachers(current_user = Depends(get_current_user)):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can view teachers")
        
        # Get manager's school
        school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
        if not school:
            raise HTTPException(status_code=404, detail="Manager has no driving school")
        
        # Get teachers
        teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
        teachers = await teachers_cursor.to_list(length=None)
        
        # Get user details for each teacher
        for teacher in teachers:
            user = await db.users.find_one({"id": teacher["user_id"]})
            if user:
                teacher["user_details"] = {
                    "first_name": user["first_name"],
                    "last_name": user["last_name"],
                    "email": user["email"],
                    "phone": user["phone"]
                }
        
        return serialize_doc(teachers)
    
    except Exception as e:
        logger.error(f"Get teachers error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve teachers")

@api_router.post("/teachers/{teacher_id}/approve")
async def approve_teacher(
    teacher_id: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can approve teachers")
        
        # Get teacher
        teacher = await db.teachers.find_one({"id": teacher_id})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        # Verify ownership
        school = await db.driving_schools.find_one({
            "id": teacher["driving_school_id"],
            "manager_id": current_user["id"]
        })
        if not school:
            raise HTTPException(status_code=403, detail="Unauthorized to approve this teacher")
        
        # Approve teacher
        await db.teachers.update_one(
            {"id": teacher_id},
            {"$set": {"is_approved": True}}
        )
        
        return {"message": "Teacher approved successfully"}
    
    except Exception as e:
        logger.error(f"Approve teacher error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to approve teacher")

# QUIZ SYSTEM ENDPOINTS

@api_router.post("/quizzes")
async def create_quiz(
    quiz_data: QuizCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can create quizzes")
        
        # Create quiz
        quiz_id = str(uuid.uuid4())
        quiz_doc = {
            "id": quiz_id,
            "course_type": quiz_data.course_type,
            "title": quiz_data.title,
            "description": quiz_data.description,
            "difficulty": quiz_data.difficulty,
            "questions": quiz_data.questions,
            "passing_score": quiz_data.passing_score,
            "time_limit_minutes": quiz_data.time_limit_minutes,
            "is_active": True,
            "created_by": current_user["id"],
            "created_at": datetime.utcnow()
        }
        
        await db.quizzes.insert_one(quiz_doc)
        
        return {"quiz_id": quiz_id, "message": "Quiz created successfully"}
    
    except Exception as e:
        logger.error(f"Create quiz error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to create quiz")

@api_router.get("/quizzes")
async def get_quizzes(
    course_type: str = None,
    difficulty: str = None,
    current_user = Depends(get_current_user)
):
    try:
        query = {"is_active": True}
        
        if course_type:
            query["course_type"] = course_type
        if difficulty:
            query["difficulty"] = difficulty
        
        quizzes_cursor = db.quizzes.find(query)
        quizzes = await quizzes_cursor.to_list(length=None)
        
        return serialize_doc(quizzes)
    
    except Exception as e:
        logger.error(f"Get quizzes error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve quizzes")

@api_router.post("/quizzes/{quiz_id}/attempt")
async def take_quiz(
    quiz_id: str,
    answers: dict,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can take quizzes")
        
        # Get quiz
        quiz = await db.quizzes.find_one({"id": quiz_id, "is_active": True})
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Calculate score
        total_questions = len(quiz["questions"])
        correct_answers = 0
        
        for i, question in enumerate(quiz["questions"]):
            student_answer = answers.get(str(i))
            correct_answer = question["correct_answer"]
            if student_answer == correct_answer:
                correct_answers += 1
        
        score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
        passed = score >= quiz["passing_score"]
        
        # Save attempt
        attempt_id = str(uuid.uuid4())
        attempt_doc = {
            "id": attempt_id,
            "quiz_id": quiz_id,
            "student_id": current_user["id"],
            "answers": answers,
            "score": score,
            "passed": passed,
            "started_at": datetime.utcnow(),
            "completed_at": datetime.utcnow(),
            "time_taken_minutes": 0  # Would be calculated in real implementation
        }
        
        await db.quiz_attempts.insert_one(attempt_doc)
        
        return {
            "attempt_id": attempt_id,
            "score": score,
            "passed": passed,
            "correct_answers": correct_answers,
            "total_questions": total_questions
        }
    
    except Exception as e:
        logger.error(f"Take quiz error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to take quiz")

# VIDEO ROOM ENDPOINTS

@api_router.post("/video-rooms")
async def create_video_room(
    room_data: VideoRoomCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "teacher":
            raise HTTPException(status_code=403, detail="Only teachers can create video rooms")
        
        # Verify course exists and teacher access
        course = await db.courses.find_one({"id": room_data.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Create video room
        room_id = str(uuid.uuid4())
        room_name = f"course-{course['id']}-{int(datetime.utcnow().timestamp())}"
        
        room_doc = {
            "id": room_id,
            "course_id": room_data.course_id,
            "teacher_id": current_user["id"],
            "student_id": room_data.student_id,
            "room_url": f"https://daily.co/{room_name}",
            "room_name": room_name,
            "scheduled_at": datetime.fromisoformat(room_data.scheduled_at),
            "duration_minutes": room_data.duration_minutes,
            "is_active": True,
            "daily_room_id": room_name,
            "created_at": datetime.utcnow()
        }
        
        await db.video_rooms.insert_one(room_doc)
        
        return {
            "room_id": room_id,
            "room_url": room_doc["room_url"],
            "message": "Video room created successfully"
        }
    
    except Exception as e:
        logger.error(f"Create video room error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to create video room")

@api_router.get("/video-rooms/my")
async def get_my_video_rooms(current_user = Depends(get_current_user)):
    try:
        query = {}
        if current_user["role"] == "teacher":
            query["teacher_id"] = current_user["id"]
        elif current_user["role"] == "student":
            query["student_id"] = current_user["id"]
        else:
            raise HTTPException(status_code=403, detail="Only teachers and students can view video rooms")
        
        rooms_cursor = db.video_rooms.find(query)
        rooms = await rooms_cursor.to_list(length=None)
        
        return serialize_doc(rooms)
    
    except Exception as e:
        logger.error(f"Get video rooms error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve video rooms")

# EXTERNAL EXPERT ENDPOINTS

@api_router.post("/external-experts/register")
async def register_external_expert(
    expert_data: ExternalExpertCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "guest":
            raise HTTPException(status_code=403, detail="Only guests can register as external experts")
        
        # Create external expert record
        expert_id = str(uuid.uuid4())
        expert_doc = {
            "id": expert_id,
            "user_id": current_user["id"],
            "specialization": expert_data.specialization,
            "available_states": expert_data.available_states,
            "certification_number": expert_data.certification_number,
            "years_of_experience": expert_data.years_of_experience,
            "rating": 0.0,
            "total_exams_conducted": 0,
            "is_available": True,
            "created_at": datetime.utcnow()
        }
        
        await db.external_experts.insert_one(expert_doc)
        
        # Update user role
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"role": "external_expert"}}
        )
        
        return {"expert_id": expert_id, "message": "External expert registered successfully"}
    
    except Exception as e:
        logger.error(f"Register external expert error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to register external expert")

@api_router.get("/external-experts")
async def get_external_experts(
    specialization: str = None,
    state: str = None
):
    try:
        query = {"is_available": True}
        
        if specialization:
            query["specialization"] = {"$in": [specialization]}
        if state:
            query["available_states"] = {"$in": [state]}
        
        experts_cursor = db.external_experts.find(query)
        experts = await experts_cursor.to_list(length=None)
        
        return serialize_doc(experts)
    
    except Exception as e:
        logger.error(f"Get external experts error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve external experts")

# SESSION MANAGEMENT ENDPOINTS

@api_router.post("/sessions/schedule")
async def schedule_session(
    session_data: SessionCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can schedule sessions")
        
        # Verify course exists and student access
        course = await db.courses.find_one({"id": session_data.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Verify teacher exists
        teacher = await db.teachers.find_one({"id": session_data.teacher_id, "is_approved": True})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found or not approved")
        
        # Create session
        session_id = str(uuid.uuid4())
        session_doc = {
            "id": session_id,
            "course_id": session_data.course_id,
            "teacher_id": session_data.teacher_id,
            "student_id": current_user["id"],
            "session_type": course["course_type"],
            "scheduled_at": datetime.fromisoformat(session_data.scheduled_at),
            "duration_minutes": session_data.duration_minutes,
            "location": session_data.location,
            "status": SessionStatus.SCHEDULED,
            "notes": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.sessions.insert_one(session_doc)
        
        return {"session_id": session_id, "message": "Session scheduled successfully"}
    
    except Exception as e:
        logger.error(f"Schedule session error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to schedule session")

@api_router.get("/sessions/my")
async def get_my_sessions(current_user = Depends(get_current_user)):
    try:
        query = {}
        if current_user["role"] == "student":
            query["student_id"] = current_user["id"]
        elif current_user["role"] == "teacher":
            query["teacher_id"] = current_user["id"]
        else:
            raise HTTPException(status_code=403, detail="Only students and teachers can view sessions")
        
        sessions_cursor = db.sessions.find(query)
        sessions = await sessions_cursor.to_list(length=None)
        
        return serialize_doc(sessions)
    
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions")

@api_router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: str,
    notes: str = Form(""),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] not in ["teacher", "manager"]:
            raise HTTPException(status_code=403, detail="Only teachers and managers can complete sessions")
        
        # Get session
        session = await db.sessions.find_one({"id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update session
        await db.sessions.update_one(
            {"id": session_id},
            {
                "$set": {
                    "status": SessionStatus.COMPLETED,
                    "notes": notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update course progress
        course = await db.courses.find_one({"id": session["course_id"]})
        if course:
            new_completed = course["completed_sessions"] + 1
            await db.courses.update_one(
                {"id": session["course_id"]},
                {
                    "$set": {
                        "completed_sessions": new_completed,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Check if course is completed
            if new_completed >= course["total_sessions"]:
                await db.courses.update_one(
                    {"id": session["course_id"]},
                    {
                        "$set": {
                            "status": CourseStatus.COMPLETED,
                            "exam_status": ExamStatus.AVAILABLE,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
        
        return {"message": "Session completed successfully"}
    
    except Exception as e:
        logger.error(f"Complete session error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to complete session")

# EXAM MANAGEMENT ENDPOINTS

@api_router.post("/exams/schedule")
async def schedule_exam(
    exam_data: ExamScheduleCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can schedule exams")
        
        # Verify course exists and is ready for exam
        course = await db.courses.find_one({"id": exam_data.course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if course["exam_status"] != ExamStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Course is not ready for exam")
        
        # Find available external expert
        experts_cursor = db.external_experts.find({
            "specialization": {"$in": [exam_data.exam_type]},
            "is_available": True
        })
        experts = await experts_cursor.to_list(length=None)
        
        if not experts:
            raise HTTPException(status_code=404, detail="No available external experts for this exam type")
        
        # Select first available expert (in real app, would have better logic)
        expert = experts[0]
        
        # Create exam
        exam_id = str(uuid.uuid4())
        exam_doc = {
            "id": exam_id,
            "course_id": exam_data.course_id,
            "student_id": current_user["id"],
            "external_expert_id": expert["id"],
            "exam_type": exam_data.exam_type,
            "scheduled_at": datetime.fromisoformat(exam_data.preferred_dates[0]),  # Use first preferred date
            "location": exam_data.location,
            "duration_minutes": 90,
            "status": ExamStatus.AVAILABLE,
            "score": None,
            "notes": None,
            "created_at": datetime.utcnow()
        }
        
        await db.exam_schedules.insert_one(exam_doc)
        
        return {"exam_id": exam_id, "message": "Exam scheduled successfully"}
    
    except Exception as e:
        logger.error(f"Schedule exam error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to schedule exam")

@api_router.get("/exams/my")
async def get_my_exams(current_user = Depends(get_current_user)):
    try:
        query = {}
        if current_user["role"] == "student":
            query["student_id"] = current_user["id"]
        elif current_user["role"] == "external_expert":
            expert = await db.external_experts.find_one({"user_id": current_user["id"]})
            if expert:
                query["external_expert_id"] = expert["id"]
        else:
            raise HTTPException(status_code=403, detail="Only students and external experts can view exams")
        
        exams_cursor = db.exam_schedules.find(query)
        exams = await exams_cursor.to_list(length=None)
        
        return serialize_doc(exams)
    
    except Exception as e:
        logger.error(f"Get exams error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve exams")

@api_router.post("/exams/{exam_id}/confirm")
async def confirm_exam(
    exam_id: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "external_expert":
            raise HTTPException(status_code=403, detail="Only external experts can confirm exams")
        
        # Get exam
        exam = await db.exam_schedules.find_one({"id": exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Verify expert ownership
        expert = await db.external_experts.find_one({"user_id": current_user["id"]})
        if not expert or exam["external_expert_id"] != expert["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to confirm this exam")
        
        # Confirm exam (no status change needed, just acknowledgment)
        return {"message": "Exam confirmed successfully"}
    
    except Exception as e:
        logger.error(f"Confirm exam error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to confirm exam")

@api_router.post("/exams/{exam_id}/complete")
async def complete_exam(
    exam_id: str,
    score: float = Form(...),
    notes: str = Form(""),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "external_expert":
            raise HTTPException(status_code=403, detail="Only external experts can complete exams")
        
        # Get exam
        exam = await db.exam_schedules.find_one({"id": exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Verify expert ownership
        expert = await db.external_experts.find_one({"user_id": current_user["id"]})
        if not expert or exam["external_expert_id"] != expert["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to complete this exam")
        
        # Determine pass/fail
        passing_score = 70.0
        passed = score >= passing_score
        
        # Update exam
        await db.exam_schedules.update_one(
            {"id": exam_id},
            {
                "$set": {
                    "status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                    "score": score,
                    "notes": notes
                }
            }
        )
        
        # Update course exam status
        await db.courses.update_one(
            {"id": exam["course_id"]},
            {
                "$set": {
                    "exam_status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                    "exam_score": score,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update course availability for next course
        course = await db.courses.find_one({"id": exam["course_id"]})
        if course and passed:
            await update_course_availability(course["enrollment_id"])
        
        return {"message": "Exam completed successfully", "passed": passed}
    
    except Exception as e:
        logger.error(f"Complete exam error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to complete exam")

# CERTIFICATE ENDPOINTS

@api_router.get("/certificates/my")
async def get_my_certificates(current_user = Depends(get_current_user)):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can view certificates")
        
        certificates_cursor = db.certificates.find({"student_id": current_user["id"]})
        certificates = await certificates_cursor.to_list(length=None)
        
        return serialize_doc(certificates)
    
    except Exception as e:
        logger.error(f"Get certificates error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve certificates")

@api_router.get("/certificates/{cert_id}/verify")
async def verify_certificate(cert_id: str):
    try:
        certificate = await db.certificates.find_one({"id": cert_id})
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        # Get student details
        student = await db.users.find_one({"id": certificate["student_id"]})
        
        verification_data = {
            "certificate_number": certificate["certificate_number"],
            "student_name": f"{student['first_name']} {student['last_name']}" if student else "Unknown",
            "issue_date": certificate["issue_date"],
            "expiry_date": certificate.get("expiry_date"),
            "status": certificate["status"],
            "is_valid": certificate["status"] == "issued" and 
                       (not certificate.get("expiry_date") or 
                        datetime.utcnow() < certificate["expiry_date"])
        }
        
        return verification_data
    
    except Exception as e:
        logger.error(f"Verify certificate error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to verify certificate")

# NOTIFICATION ENDPOINTS

@api_router.get("/notifications/my")
async def get_my_notifications(current_user = Depends(get_current_user)):
    try:
        notifications_cursor = db.notifications.find({"user_id": current_user["id"]}).sort("created_at", -1)
        notifications = await notifications_cursor.to_list(length=None)
        
        return serialize_doc(notifications)
    
    except Exception as e:
        logger.error(f"Get notifications error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve notifications")

@api_router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user = Depends(get_current_user)
):
    try:
        # Verify notification ownership
        notification = await db.notifications.find_one({
            "id": notification_id,
            "user_id": current_user["id"]
        })
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Mark as read
        await db.notifications.update_one(
            {"id": notification_id},
            {"$set": {"is_read": True}}
        )
        
        return {"message": "Notification marked as read"}
    
    except Exception as e:
        logger.error(f"Mark notification read error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")

@api_router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(current_user = Depends(get_current_user)):
    try:
        await db.notifications.update_many(
            {"user_id": current_user["id"], "is_read": False},
            {"$set": {"is_read": True}}
        )
        
        return {"message": "All notifications marked as read"}
    
    except Exception as e:
        logger.error(f"Mark all notifications read error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to mark all notifications as read")

# ANALYTICS ENDPOINTS

@api_router.get("/analytics/student-progress/{student_id}")
async def get_student_progress(
    student_id: str,
    current_user = Depends(get_current_user)
):
    try:
        # Verify access
        if current_user["role"] == "student" and current_user["id"] != student_id:
            raise HTTPException(status_code=403, detail="Can only view your own progress")
        elif current_user["role"] not in ["student", "teacher", "manager"]:
            raise HTTPException(status_code=403, detail="Unauthorized to view student progress")
        
        # Calculate metrics
        metrics = await calculate_student_metrics(student_id)
        
        # Generate chart if needed
        if metrics["total_enrollments"] > 0:
            chart_data = await generate_student_analytics_chart({
                "student_name": "Student Progress",
                "theory_progress": metrics["course_progress"].get("theory", 0),
                "park_progress": metrics["course_progress"].get("park", 0),
                "road_progress": metrics["course_progress"].get("road", 0),
                "quiz_scores": metrics["quiz_scores"],
                "session_attendance": metrics["session_attendance"],
                "learning_time": metrics["learning_time"]
            })
            metrics["chart_data"] = chart_data
        
        return metrics
    
    except Exception as e:
        logger.error(f"Get student progress error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve student progress")

@api_router.get("/analytics/school-overview")
async def get_school_overview(current_user = Depends(get_current_user)):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can view school analytics")
        
        # Get manager's school
        school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
        if not school:
            raise HTTPException(status_code=404, detail="Manager has no driving school")
        
        # Calculate school metrics
        enrollments_cursor = db.enrollments.find({"driving_school_id": school["id"]})
        enrollments = await enrollments_cursor.to_list(length=None)
        
        teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
        teachers = await teachers_cursor.to_list(length=None)
        
        reviews_cursor = db.reviews.find({"driving_school_id": school["id"]})
        reviews = await reviews_cursor.to_list(length=None)
        
        metrics = {
            "school_name": school["name"],
            "total_enrollments": len(enrollments),
            "active_enrollments": len([e for e in enrollments if e["enrollment_status"] == "approved"]),
            "pending_enrollments": len([e for e in enrollments if e["enrollment_status"] == "pending_approval"]),
            "total_teachers": len(teachers),
            "approved_teachers": len([t for t in teachers if t["is_approved"]]),
            "total_reviews": len(reviews),
            "average_rating": sum([r["rating"] for r in reviews]) / len(reviews) if reviews else 0,
            "revenue_estimate": len([e for e in enrollments if e["enrollment_status"] == "approved"]) * school["price"]
        }
        
        return metrics
    
    except Exception as e:
        logger.error(f"Get school overview error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve school analytics")

@api_router.get("/analytics/teacher-performance/{teacher_id}")
async def get_teacher_performance(
    teacher_id: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can view teacher performance")
        
        # Get teacher
        teacher = await db.teachers.find_one({"id": teacher_id})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        # Verify manager owns this teacher's school
        school = await db.driving_schools.find_one({
            "id": teacher["driving_school_id"],
            "manager_id": current_user["id"]
        })
        if not school:
            raise HTTPException(status_code=403, detail="Unauthorized to view this teacher's performance")
        
        # Calculate teacher metrics
        sessions_cursor = db.sessions.find({"teacher_id": teacher_id})
        sessions = await sessions_cursor.to_list(length=None)
        
        completed_sessions = [s for s in sessions if s["status"] == "completed"]
        
        reviews_cursor = db.reviews.find({"teacher_id": teacher_id})
        reviews = await reviews_cursor.to_list(length=None)
        
        metrics = {
            "teacher_id": teacher_id,
            "total_sessions": len(sessions),
            "completed_sessions": len(completed_sessions),
            "completion_rate": (len(completed_sessions) / len(sessions) * 100) if sessions else 0,
            "total_reviews": len(reviews),
            "average_rating": sum([r["rating"] for r in reviews]) / len(reviews) if reviews else 0,
            "recent_sessions": serialize_doc(sessions[-10:])  # Last 10 sessions
        }
        
        return metrics
    
    except Exception as e:
        logger.error(f"Get teacher performance error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve teacher performance")

# REVIEW ENDPOINTS

@api_router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can create reviews")
        
        # Verify enrollment exists and is completed
        enrollment = await db.enrollments.find_one({
            "id": review_data.enrollment_id,
            "student_id": current_user["id"],
            "enrollment_status": "approved"
        })
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found or not completed")
        
        # Check if review already exists
        existing_review = await db.reviews.find_one({
            "student_id": current_user["id"],
            "enrollment_id": review_data.enrollment_id
        })
        if existing_review:
            raise HTTPException(status_code=400, detail="Review already exists for this enrollment")
        
        # Create review
        review_id = str(uuid.uuid4())
        review_doc = {
            "id": review_id,
            "student_id": current_user["id"],
            "enrollment_id": review_data.enrollment_id,
            "driving_school_id": enrollment["driving_school_id"],
            "teacher_id": None,  # Could be assigned to specific teacher
            "rating": review_data.rating,
            "comment": review_data.comment,
            "created_at": datetime.utcnow()
        }
        
        await db.reviews.insert_one(review_doc)
        
        # Update school rating
        school_reviews_cursor = db.reviews.find({"driving_school_id": enrollment["driving_school_id"]})
        school_reviews = await school_reviews_cursor.to_list(length=None)
        
        if school_reviews:
            avg_rating = sum([r["rating"] for r in school_reviews]) / len(school_reviews)
            await db.driving_schools.update_one(
                {"id": enrollment["driving_school_id"]},
                {
                    "$set": {
                        "rating": avg_rating,
                        "total_reviews": len(school_reviews)
                    }
                }
            )
        
        return {"review_id": review_id, "message": "Review created successfully"}
    
    except Exception as e:
        logger.error(f"Create review error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to create review")

@api_router.get("/reviews/school/{school_id}")
async def get_school_reviews(school_id: str):
    try:
        # Get reviews for the school
        reviews_cursor = db.reviews.find({"driving_school_id": school_id}).sort("created_at", -1)
        reviews = await reviews_cursor.to_list(length=None)
        
        # Get student names for reviews
        for review in reviews:
            student = await db.users.find_one({"id": review["student_id"]})
            if student:
                review["student_name"] = f"{student['first_name']} {student['last_name']}"
            else:
                review["student_name"] = "Anonymous"
        
        return serialize_doc(reviews)
    
    except Exception as e:
        logger.error(f"Get school reviews error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve school reviews")

# COURSE MANAGEMENT ENDPOINTS

@api_router.post("/courses/{course_id}/complete-session")
async def complete_course_session(
    course_id: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] not in ["student", "teacher", "manager"]:
            raise HTTPException(status_code=403, detail="Unauthorized to complete sessions")
        
        # Get course
        course = await db.courses.find_one({"id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Increment completed sessions
        new_completed = course["completed_sessions"] + 1
        
        # Update course
        update_data = {
            "completed_sessions": new_completed,
            "updated_at": datetime.utcnow()
        }
        
        # Check if course is completed
        if new_completed >= course["total_sessions"]:
            update_data["status"] = CourseStatus.COMPLETED
            update_data["exam_status"] = ExamStatus.AVAILABLE
        
        await db.courses.update_one({"id": course_id}, {"$set": update_data})
        
        # Update course availability
        await update_course_availability(course["enrollment_id"])
        
        return {"message": "Session completed successfully"}
    
    except Exception as e:
        logger.error(f"Complete course session error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to complete session")

@api_router.post("/courses/{course_id}/take-exam")
async def take_course_exam(
    course_id: str,
    score: float = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can take exams")
        
        # Get course
        course = await db.courses.find_one({"id": course_id})
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        if course["exam_status"] != ExamStatus.AVAILABLE:
            raise HTTPException(status_code=400, detail="Exam is not available for this course")
        
        # Determine pass/fail
        passing_score = 70.0
        passed = score >= passing_score
        
        # Update course
        await db.courses.update_one(
            {"id": course_id},
            {
                "$set": {
                    "exam_status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                    "exam_score": score,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update course availability for next course
        if passed:
            await update_course_availability(course["enrollment_id"])
        
        return {"message": "Exam completed successfully", "passed": passed, "score": score}
    
    except Exception as e:
        logger.error(f"Take course exam error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to take exam")

# DASHBOARD ENDPOINTS

@api_router.get("/dashboard/{role}")
async def get_dashboard(
    role: str,
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != role:
            raise HTTPException(status_code=403, detail="Role mismatch")
        
        dashboard_data = {}
        
        if role == "student":
            # Get student's enrollments with courses
            enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
            enrollments = await enrollments_cursor.to_list(length=None)
            
            for enrollment in enrollments:
                # Get school details
                school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
                enrollment["school_name"] = school["name"] if school else "Unknown School"
                
                # Get courses
                courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
                courses = await courses_cursor.to_list(length=None)
                enrollment["courses"] = serialize_doc(courses)
            
            dashboard_data["enrollments"] = serialize_doc(enrollments)
            
        elif role == "teacher":
            # Get teacher's school and students
            teacher = await db.teachers.find_one({"user_id": current_user["id"]})
            if teacher:
                school = await db.driving_schools.find_one({"id": teacher["driving_school_id"]})
                dashboard_data["school"] = serialize_doc(school)
                
                # Get assigned sessions
                sessions_cursor = db.sessions.find({"teacher_id": teacher["id"]})
                sessions = await sessions_cursor.to_list(length=None)
                dashboard_data["sessions"] = serialize_doc(sessions)
            
        elif role == "manager":
            # Get manager's school
            school = await db.driving_schools.find_one({"manager_id": current_user["id"]})
            if school:
                dashboard_data["school"] = serialize_doc(school)
                
                # Get enrollments
                enrollments_cursor = db.enrollments.find({"driving_school_id": school["id"]})
                enrollments = await enrollments_cursor.to_list(length=None)
                dashboard_data["enrollments"] = serialize_doc(enrollments)
                
                # Get teachers
                teachers_cursor = db.teachers.find({"driving_school_id": school["id"]})
                teachers = await teachers_cursor.to_list(length=None)
                dashboard_data["teachers"] = serialize_doc(teachers)
        
        elif role == "external_expert":
            # Get expert's exams
            expert = await db.external_experts.find_one({"user_id": current_user["id"]})
            if expert:
                exams_cursor = db.exam_schedules.find({"external_expert_id": expert["id"]})
                exams = await exams_cursor.to_list(length=None)
                dashboard_data["exams"] = serialize_doc(exams)
        
        return dashboard_data
    
    except Exception as e:
        logger.error(f"Get dashboard error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve dashboard data")

# PAYMENT ENDPOINTS

@api_router.post("/payments/complete")
async def complete_payment(
    enrollment_id: str = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        # Get enrollment
        enrollment = await db.enrollments.find_one({
            "id": enrollment_id,
            "student_id": current_user["id"]
        })
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Simulate payment completion
        await db.enrollments.update_one(
            {"id": enrollment_id},
            {"$set": {"enrollment_status": EnrollmentStatus.PENDING_APPROVAL}}
        )
        
        # Create notification for manager
        school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
        if school:
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": school["manager_id"],
                "type": "payment_completed",
                "title": "Payment Completed",
                "message": f"Student has completed payment for enrollment at {school['name']}",
                "is_read": False,
                "metadata": {"enrollment_id": enrollment_id},
                "created_at": datetime.utcnow()
            }
            await db.notifications.insert_one(notification_doc)
        
        return {"message": "Payment completed successfully"}
    
    except Exception as e:
        logger.error(f"Complete payment error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to complete payment")

# MISSING ENDPOINTS THAT WERE IDENTIFIED IN TESTING

@api_router.get("/documents")
async def get_user_documents(current_user = Depends(get_current_user)):
    try:
        documents_cursor = db.documents.find({"user_id": current_user["id"]})
        documents = await documents_cursor.to_list(length=None)
        
        return serialize_doc(documents)
    
    except Exception as e:
        logger.error(f"Get documents error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")

@api_router.get("/enrollments/my")
async def get_my_enrollments_fixed(current_user = Depends(get_current_user)):
    try:
        if current_user["role"] != "student":
            raise HTTPException(status_code=403, detail="Only students can view enrollments")
        
        # Get student's enrollments
        enrollments_cursor = db.enrollments.find({"student_id": current_user["id"]})
        enrollments = await enrollments_cursor.to_list(length=None)
        
        # Get school details for each enrollment
        for enrollment in enrollments:
            school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
            if school:
                enrollment["school_name"] = school["name"]
                enrollment["school_address"] = school["address"]
                enrollment["school_price"] = school["price"]
            
            # Get courses for this enrollment
            courses_cursor = db.courses.find({"enrollment_id": enrollment["id"]})
            courses = await courses_cursor.to_list(length=None)
            enrollment["courses"] = serialize_doc(courses)
        
        return serialize_doc(enrollments)
    
    except Exception as e:
        logger.error(f"Get enrollments error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve enrollments")

@api_router.post("/documents/verify/{document_id}")
async def verify_document(
    document_id: str,
    is_verified: bool = Form(...),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "manager":
            raise HTTPException(status_code=403, detail="Only managers can verify documents")
        
        # Get document
        document = await db.documents.find_one({"id": document_id})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Update verification status
        await db.documents.update_one(
            {"id": document_id},
            {"$set": {"is_verified": is_verified}}
        )
        
        return {"message": "Document verification updated successfully"}
    
    except Exception as e:
        logger.error(f"Verify document error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to verify document")

@api_router.get("/analytics/student-progress/{student_id}")
async def get_student_progress_fixed(
    student_id: str,
    current_user = Depends(get_current_user)
):
    try:
        # Verify access permissions
        if current_user["role"] == "student" and current_user["id"] != student_id:
            raise HTTPException(status_code=403, detail="Can only view your own progress")
        elif current_user["role"] not in ["student", "teacher", "manager"]:
            raise HTTPException(status_code=403, detail="Unauthorized to view student progress")
        
        # Calculate student metrics
        metrics = await calculate_student_metrics(student_id)
        
        return metrics
    
    except Exception as e:
        logger.error(f"Get student progress error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to retrieve student progress")

# AUTO-GENERATE CERTIFICATE FOR COMPLETED STUDENTS
async def check_and_generate_certificate(enrollment_id: str):
    """Check if student has completed all courses and generate certificate"""
    try:
        # Get all courses for this enrollment
        courses_cursor = db.courses.find({"enrollment_id": enrollment_id})
        courses = await courses_cursor.to_list(length=None)
        
        # Check if all courses are completed and exams passed
        all_completed = True
        for course in courses:
            if course["exam_status"] != ExamStatus.PASSED:
                all_completed = False
                break
        
        if all_completed:
            # Get enrollment and student details
            enrollment = await db.enrollments.find_one({"id": enrollment_id})
            student = await db.users.find_one({"id": enrollment["student_id"]})
            school = await db.driving_schools.find_one({"id": enrollment["driving_school_id"]})
            
            # Check if certificate already exists
            existing_cert = await db.certificates.find_one({"enrollment_id": enrollment_id})
            if not existing_cert:
                # Generate certificate
                cert_id = str(uuid.uuid4())
                cert_number = f"DZ-{student['state'][:3].upper()}-{int(datetime.utcnow().timestamp())}"
                
                certificate_doc = {
                    "id": cert_id,
                    "student_id": enrollment["student_id"],
                    "enrollment_id": enrollment_id,
                    "certificate_number": cert_number,
                    "issue_date": datetime.utcnow(),
                    "expiry_date": datetime.utcnow() + timedelta(days=5*365),  # 5 years
                    "status": CertificateStatus.GENERATED,
                    "pdf_url": None,
                    "qr_code": None,
                    "created_at": datetime.utcnow()
                }
                
                await db.certificates.insert_one(certificate_doc)
                
                # Send notification
                notification_doc = {
                    "id": str(uuid.uuid4()),
                    "user_id": enrollment["student_id"],
                    "type": NotificationType.CERTIFICATE_READY,
                    "title": "Certificate Ready!",
                    "message": f"Congratulations! Your driving certificate is ready for download.",
                    "is_read": False,
                    "metadata": {"certificate_id": cert_id, "certificate_number": cert_number},
                    "created_at": datetime.utcnow()
                }
                await db.notifications.insert_one(notification_doc)
                
                return cert_id
        
        return None
    
    except Exception as e:
        logger.error(f"Certificate generation error: {str(e)}")
        return None

# Updated exam completion to trigger certificate generation
@api_router.post("/exams/{exam_id}/complete")
async def complete_exam_updated(
    exam_id: str,
    score: float = Form(...),
    notes: str = Form(""),
    current_user = Depends(get_current_user)
):
    try:
        if current_user["role"] != "external_expert":
            raise HTTPException(status_code=403, detail="Only external experts can complete exams")
        
        # Get exam
        exam = await db.exam_schedules.find_one({"id": exam_id})
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        # Verify expert ownership
        expert = await db.external_experts.find_one({"user_id": current_user["id"]})
        if not expert or exam["external_expert_id"] != expert["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized to complete this exam")
        
        # Determine pass/fail
        passing_score = 70.0
        passed = score >= passing_score
        
        # Update exam
        await db.exam_schedules.update_one(
            {"id": exam_id},
            {
                "$set": {
                    "status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                    "score": score,
                    "notes": notes
                }
            }
        )
        
        # Update course exam status
        await db.courses.update_one(
            {"id": exam["course_id"]},
            {
                "$set": {
                    "exam_status": ExamStatus.PASSED if passed else ExamStatus.FAILED,
                    "exam_score": score,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Update course availability for next course
        course = await db.courses.find_one({"id": exam["course_id"]})
        if course and passed:
            await update_course_availability(course["enrollment_id"])
            
            # Check if all courses completed and generate certificate
            cert_id = await check_and_generate_certificate(course["enrollment_id"])
            if cert_id:
                logger.info(f"Certificate generated: {cert_id}")
        
        return {"message": "Exam completed successfully", "passed": passed}
    
    except Exception as e:
        logger.error(f"Complete exam error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Failed to complete exam")

# Include the API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
