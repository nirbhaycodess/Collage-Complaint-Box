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

## Notes

- Student complaint submission is blocked if:
  - Student is not OCR-verified.
  - Student is outside campus location radius.
  - Student already has an unresolved complaint.
- Complaint image upload uses Cloudinary and stores secure URL in database.
