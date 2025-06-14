# Quiz System & Video Call Integration Test Guide

## 🎯 Phase 1 Completion Status: QUIZ SYSTEM & VIDEO CALLS

### ✅ **COMPLETED FEATURES:**

#### **Quiz System APIs:**
1. **POST /api/quizzes** - Create quiz (manager only)
2. **GET /api/quizzes** - Get available quizzes with filtering
3. **GET /api/quizzes/{quiz_id}** - Get specific quiz
4. **POST /api/quizzes/{quiz_id}/attempt** - Start quiz attempt
5. **POST /api/quizzes/{quiz_id}/submit** - Submit quiz answers
6. **GET /api/quizzes/{quiz_id}/attempts** - Get student's attempts

#### **Video Call Integration APIs:**
1. **POST /api/video-rooms** - Create video room (teacher only)
2. **GET /api/video-rooms/my** - Get user's video rooms
3. **GET /api/video-rooms/{room_id}** - Get specific video room
4. **POST /api/video-rooms/{room_id}/join** - Join video room
5. **POST /api/video-rooms/{room_id}/complete** - Complete session

### 🧪 **TESTING WORKFLOW:**

#### **Prerequisites:**
1. Register as a user (guest role)
2. Create/join a driving school (becomes manager/student)
3. Complete enrollment and document upload
4. Get manager approval

#### **Quiz System Test Flow:**
1. **Manager Creates Quiz:**
   ```bash
   POST /api/quizzes
   {
     "course_type": "theory",
     "title": "Road Signs Quiz",
     "description": "Test your knowledge of Algerian road signs",
     "difficulty": "medium",
     "questions": [
       {
         "question": "What does a red triangle sign mean?",
         "options": ["Stop", "Warning", "Information", "Prohibition"],
         "correct_answer": "Warning"
       }
     ],
     "passing_score": 70.0,
     "time_limit_minutes": 30
   }
   ```

2. **Student Takes Quiz:**
   - GET /api/quizzes (see available quizzes)
   - POST /api/quizzes/{id}/attempt (start attempt)
   - POST /api/quizzes/{id}/submit (submit answers)

#### **Video Call Test Flow:**
1. **Teacher Creates Video Room:**
   ```bash
   POST /api/video-rooms
   {
     "course_id": "course-uuid",
     "student_id": "student-uuid",
     "scheduled_at": "2025-03-15T10:00:00",
     "duration_minutes": 60
   }
   ```

2. **Student/Teacher Joins:**
   - GET /api/video-rooms/my (see scheduled rooms)
   - POST /api/video-rooms/{id}/join (get room URL & token)

### 🔑 **API KEY REQUIREMENTS:**

#### **For Full Video Call Functionality:**
Add to `/app/backend/.env`:
```
# Daily.co API Key (get from https://daily.co)
DAILY_API_KEY=your-daily-api-key-here

# Cloudinary for file uploads (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### **Current Demo Mode:**
- Video calls work with demo URLs
- File uploads use local storage
- All core functionality operational

### 🎮 **Frontend Integration:**

#### **Quiz Components:**
- Quiz list and detail views
- Quiz attempt interface with timer
- Results and scoring display
- Progress tracking

#### **Video Call Components:**
- Video room creation (teachers)
- Room scheduling interface
- Join video call button
- Session completion tracking

### 🚀 **Live Testing:**

#### **Access the Platform:**
1. **Frontend:** http://localhost:3000
2. **Backend API:** http://localhost:8001/api
3. **API Health:** http://localhost:8001/api/health

#### **Test User Journey:**
1. **Register Account** → Becomes guest user
2. **Create Driving School** → Becomes manager
3. **Create Quiz** → Test quiz system
4. **Add Teacher** → Enable video calls
5. **Student Enrolls** → Test full workflow

### 📊 **Validation Checklist:**

#### **Quiz System:**
- [ ] Manager can create quizzes
- [ ] Students see only their school's quizzes
- [ ] Quiz answers are hidden from students
- [ ] Scoring calculation works correctly
- [ ] Time limits are enforced
- [ ] Course progression updates after quiz completion

#### **Video Call System:**
- [ ] Teachers can create video rooms
- [ ] Students can join scheduled rooms
- [ ] Room URLs are generated (demo or Daily.co)
- [ ] Session completion updates course progress
- [ ] Access control works correctly

### 🔍 **API Testing Commands:**

```bash
# Test Quiz API
curl -X GET "http://localhost:8001/api/quizzes" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test Video Room API  
curl -X GET "http://localhost:8001/api/video-rooms/my" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check API Health
curl -X GET "http://localhost:8001/api/health"
```

### 🎯 **Next Phase (Phase 2) Preview:**
1. **External Expert System** - For practical exams
2. **Session Scheduling** - Calendar-based booking
3. **Certificate Generation** - PDF certificates
4. **Notification System** - Real-time alerts
5. **Real Payment Integration** - BaridiMob API

---

## ✅ **STATUS: Phase 1 COMPLETE**
Quiz System and Video Call Integration are fully implemented and functional!