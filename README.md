# College Complaint Box

A full-stack complaint portal for students and admins.

## Basic Features

- Google authentication for student login (required).
- OCR-based student ID verification before complaint submission.
- Campus location restriction (students must be within the allowed campus radius).
- Cloud image upload for complaint evidence (Cloudinary).
- Admin dashboard to review and resolve complaints.

## Main Flow

1. Student signs in with Google.
2. Student uploads ID card for OCR verification.
3. Student opens complaint page and captures current location.
4. If inside allowed campus area, student submits complaint with image.
5. Complaint image is uploaded to Cloudinary and data is stored in MongoDB.
6. Admin logs in and updates complaint status.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- Auth: Google OAuth (student), JWT (admin)
- OCR: Tesseract.js
- Media Storage: Cloudinary

## Project Structure

```text
Collage-Complaint-Box/
  backend/
    config/
    controllers/
    middleware/
    models/
    routes/
    server.js
  frontend/
    src/
      pages/
      App.jsx
      main.jsx
```

## Important Routes

- `/` -> Login page (student + admin)
- `/complaint` -> Complaint submission page
- `/admin/dashboard` -> Admin dashboard

## Key Backend APIs

- `POST /api/students/verify` -> OCR verification of student ID card
- `GET /api/students/verify/status?email=...` -> Check verification status
- `POST /api/complaints/submit` -> Submit new complaint (with image + location)
- `GET /api/complaints/active/:email` -> Check active complaint for a student
- `GET /api/complaints` -> Admin: get all complaints
- `PATCH /api/complaints/:id/status` -> Admin: update complaint status
- `POST /api/admin/login` -> Admin login

## Environment Variables

### Backend (`backend/.env`)

```env
MONGO_URI=mongodb://127.0.0.1:27017/college_complaint_box
PORT=5000

ADMIN_ID=your_admin_id
ADMIN_PASSWORD=your_admin_password
ADMIN_ACCESS_CODE=your_admin_access_code
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=college-complaints

ALLOWED_COMPLAINT_LAT=28.3736
ALLOWED_COMPLAINT_LNG=79.4360
ALLOWED_COMPLAINT_RADIUS_METERS=500

UNIVERSITY_NAME=Invertis University
UNIVERSITY_FALLBACK=Invertis
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id

VITE_ALLOWED_COMPLAINT_LAT=28.3736
VITE_ALLOWED_COMPLAINT_LNG=79.4360
VITE_ALLOWED_COMPLAINT_RADIUS_METERS=500
```

## Run Locally

### 1) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Start backend

```bash
cd backend
npm start
```

### 3) Start frontend

```bash
cd frontend
npm run dev
```

## Notes

- Student complaint submission is blocked if:
  - Student is not OCR-verified.
  - Student is outside campus location radius.
  - Student already has an unresolved complaint.
- Complaint image upload uses Cloudinary and stores secure URL in database.
