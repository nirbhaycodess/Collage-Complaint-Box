# Collage Complaint Box

This project is a simple complaint portal with:
- A **React** frontend (student + admin views)
- A **Node/Express** backend with **MongoDB**
- Image uploads for complaint evidence

Below is the full workflow and how each part connects.

**High-Level Workflow**
1. Student opens the frontend and signs in with Google.
2. Student submits a complaint with details + image + location.
3. Backend stores the complaint in MongoDB and uploads the image to Cloudinary.
4. Admin logs in with a password + access code.
5. Admin views all complaints and marks them as resolved.

---

**Frontend Flow (React)**

**Entry**
- `frontend/index.html` loads `frontend/src/main.jsx`.
- `main.jsx` sets up `GoogleOAuthProvider` and `BrowserRouter`.

**Routes**
- `/` -> `frontend/src/pages/LoginPage.jsx`
- `/complaint` -> `frontend/src/pages/ComplaintPage.jsx`
- `/admin/dashboard` -> `frontend/src/pages/AdminPage.jsx` (guarded by `RequireAdmin`)

**Login Page (`LoginPage.jsx`)**
- Student:
  - Uses Google OAuth.
  - The decoded profile is saved in `localStorage` as `ccb_student_user`.
- Admin:
  - Calls `POST /api/admin/login`.
  - Stores JWT token in `sessionStorage` as `adminToken`.

**Complaint Page (`ComplaintPage.jsx`)**
- Reads student profile from `localStorage`.
- Checks for an existing active complaint:
  - `GET /api/complaints/active/:email`
  - If active, the form is blocked.
- Gets location using the browser geolocation API.
- Submits complaint:
  - `POST /api/complaints/submit` with form data + image.

**Admin Page (`AdminPage.jsx`)**
- Fetches all complaints (requires admin token):
  - `GET /api/complaints`
- Updates complaint status:
  - `PATCH /api/complaints/:id/status`
- Shows uploaded image using:
  - Cloudinary URL directly (for new uploads), or
  - `${API_BASE}${complaint.image}` for legacy local `/uploads/...` paths.

**Config**
- Frontend reads backend base URL from:
  - `VITE_API_BASE_URL`
  - Fallback: `http://10.56.212.140:5000`

---

**Backend Flow (Express + MongoDB)**

**Server Setup (`backend/server.js`)**
- Connects to MongoDB (`backend/config/db.js`).
- Sets JSON parsing + CORS.
- Serves uploads from `/uploads` (legacy local files only).
- Registers routes:
  - `/api/complaints`
  - `/api/admin`

**Database (`backend/config/db.js`)**
- Reads `MONGO_URI` from environment.
- Fallback: `mongodb://127.0.0.1:27017/college_complaint_box`

**Complaint Model (`backend/models/complaint.js`)**
- Stores student data, complaint info, location, image path, status, timestamps.

**Routes + Controllers**
- Complaint routes: `backend/routes/complaintRoutes.js`
- Complaint logic: `backend/controllers/complaintcontroller.js`

Endpoints:
- `POST /api/complaints/submit`
  - Creates a complaint with image upload.
  - Blocks if student already has an unresolved complaint.
- `GET /api/complaints/active/:email`
  - Checks if student has an unresolved complaint.
- `GET /api/complaints`
  - Admin-only list of all complaints.
- `PATCH /api/complaints/:id/status`
  - Admin-only status update.
- `GET /api/complaints/track/:id`
  - Public: track a complaint by id.

**Admin Auth**
- Admin routes: `backend/routes/adminRoutes.js`
- Admin logic: `backend/controllers/adminController.js`
- Middleware: `backend/middleware/adminAuth.js`

Login:
- `POST /api/admin/login`
- Requires `adminId`, `password`, `accessCode`
- Returns a JWT token (12-hour expiry)

Token validation:
- Middleware expects `Authorization: Bearer <token>`
- Checks `role === "admin"`

---

**Environment Variables**

Backend:
- `MONGO_URI` (MongoDB connection string)
- `ADMIN_ID`
- `ADMIN_PASSWORD`
- `ADMIN_ACCESS_CODE`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional, default: `college-complaints`)

Frontend:
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

---

**Run Locally**

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

If you want, I can also add diagrams or a step-by-step API walkthrough.
