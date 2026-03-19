import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgComplaint from "../assets/bgcomplaint.png.jpeg";
import bgMobile from "../assets/BgMs.png";
import logo from "../assets/logo.png";

// Backend base URL (override with VITE_API_BASE_URL in .env)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://speakup-invertians.onrender.com";

const ALLOWED_COMPLAINT_LAT = Number(import.meta.env.VITE_ALLOWED_COMPLAINT_LAT);
const ALLOWED_COMPLAINT_LNG = Number(import.meta.env.VITE_ALLOWED_COMPLAINT_LNG);
const ALLOWED_COMPLAINT_RADIUS_METERS = Number(
  import.meta.env.VITE_ALLOWED_COMPLAINT_RADIUS_METERS
);

const LOCATION_CHECK_CONFIGURED =
  Number.isFinite(ALLOWED_COMPLAINT_LAT) &&
  Number.isFinite(ALLOWED_COMPLAINT_LNG) &&
  Number.isFinite(ALLOWED_COMPLAINT_RADIUS_METERS) &&
  ALLOWED_COMPLAINT_RADIUS_METERS > 0;

const toRad = (value) => (value * Math.PI) / 180;

const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const parseCoordinates = (value) => {
  if (!value || typeof value !== "string") return null;
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const getLocationEligibility = (value) => {
  if (!LOCATION_CHECK_CONFIGURED) {
    return {
      ok: false,
      reason:
        "Location validation is not configured. Contact admin to set campus location.",
    };
  }

  const coords = parseCoordinates(value);
  if (!coords) {
    return {
      ok: false,
      reason: "Invalid location format. Please capture location again.",
    };
  }

  const distanceMeters = getDistanceMeters(
    coords.lat,
    coords.lng,
    ALLOWED_COMPLAINT_LAT,
    ALLOWED_COMPLAINT_LNG
  );

  if (distanceMeters > ALLOWED_COMPLAINT_RADIUS_METERS) {
    return {
      ok: false,
      reason: "You are outside campus. Please try when you are on campus.",
    };
  }

  return { ok: true, reason: "" };
};

function ComplaintPage() {

  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [location, setLocation] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [locationEligible, setLocationEligible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittedStatus, setSubmittedStatus] = useState("");
  const [activeBlock, setActiveBlock] = useState("");
  const [activeComplaint, setActiveComplaint] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Restore student session (if any)
    const stored = localStorage.getItem("ccb_student_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("ccb_student_user");
      }
    }
  }, []);

  useEffect(() => {
    // Block new submissions if there's an unresolved complaint
    const checkActive = async () => {
      if (!user?.email) return;
      try {
        const res = await axios.get(
          `${API_BASE}/api/complaints/active/${encodeURIComponent(
            user.email
          )}`
        );
        if (res.data?.data) {
          setActiveBlock(
            "You already have an active complaint. Please wait until it is resolved."
          );
          setActiveComplaint(res.data.data);
        } else {
          setActiveBlock("");
          setActiveComplaint(null);
        }
      } catch (e) {
        console.log(e);
      }
    };

    checkActive();
  }, [user]);

  const handleGetLocation = () => {
    // Ask browser for current coordinates
    if (!navigator.geolocation) {
      setLocationStatus("Location not supported on this device.");
      return;
    }
    setLocationStatus("Fetching location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setLocation(coords);
        const eligibility = getLocationEligibility(coords);
        setLocationEligible(eligibility.ok);
        setLocationStatus(
          eligibility.ok
            ? "You are on campus. You can continue."
            : eligibility.reason
        );
      },
      () => {
        setLocationEligible(null);
        setLocationStatus("Location access denied. Please allow location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!user) {
        setError("Please login from the dashboard first.");
        return;
      }
      if (activeBlock) {
        setError(activeBlock);
        return;
      }
      if (!studentId.trim()) {
        setError("Student ID is required.");
        return;
      }
      if (!location) {
        setError("Location is required. Please allow location access.");
        return;
      }
      if (locationEligible === false) {
        setError("You are outside campus. Please try when you are on campus.");
        return;
      }
      const eligibility = getLocationEligibility(location);
      if (!eligibility.ok) {
        setError(eligibility.reason);
        return;
      }
      if (!file) {
        setError("Complaint image is required.");
        return;
      }

      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("studentName", user?.name || "");
      formData.append("studentEmail", user?.email || "");
      formData.append("type", type);
      formData.append("description", description);
      formData.append("location", location);
      if (file) {
        formData.append("image", file);
      }

      const res = await axios.post(
        `${API_BASE}/api/complaints/submit`,
        formData
      );

      const newStatus = res.data?.data?.status;
      if (newStatus) {
        setSubmittedStatus(newStatus);
      }
      setSuccess(res.data?.message || "Complaint submitted successfully");
      setType("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.log(e);
      const message = e?.response?.data?.message;
      const detail = e?.response?.data?.error;
      const errorText = [message, detail].filter(Boolean).join(": ");
      if (e?.response?.status === 409) {
        setActiveBlock(
          message ||
            "You already have an active complaint. Please wait until it is resolved."
        );
        if (e?.response?.data?.data) {
          setActiveComplaint(e.response.data.data);
        }
        setError(
          message ||
            "You already have an active complaint. Please wait until it is resolved."
        );
      } else {
        setError(
          errorText || "Failed to submit complaint. Is the backend running?"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-slate-950 complaint-bg">
      <style>{`
        .complaint-bg {
          background-image: url(${bgComplaint});
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        @media (max-width: 768px) {
          .complaint-bg {
            background-image: url(${bgMobile});
            background-position: center 30%;
            background-size: cover;
            background-attachment: fixed;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-slate-950/70" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-400/30 blur-3xl" />
      <div className="absolute bottom-[-140px] left-1/4 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="mb-6 space-y-4">
            <img
              src={logo}
              alt="University Logo"
              className="w-28 md:w-36 bg-transparent brightness-125 contrast-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
            />
            <h2 className="text-2xl md:text-3xl font-semibold text-white">
              Submit Complaint To The College Authorities
            </h2>
            <p className="text-slate-100">
              Share your concern safely. Required fields help us act faster.
            </p>
          </div>

        {error && <p className="mb-4 text-red-300">{error}</p>}
        {activeBlock && (
          <div className="mb-4 rounded-lg border border-amber-300/40 bg-amber-300/10 p-4 text-amber-100">
            {activeBlock}
          </div>
        )}
        {activeComplaint && (
          <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4 text-slate-100">
            <p className="font-semibold">Active Complaint Summary</p>
            <p className="mt-2 text-sm">
              <span className="text-slate-200">Type:</span>{" "}
              {activeComplaint.type || "â€”"}
            </p>
            <p className="text-sm">
              <span className="text-slate-200">Description:</span>{" "}
              {activeComplaint.description || "â€”"}
            </p>
            <p className="text-sm">
              <span className="text-slate-200">Time:</span>{" "}
              {activeComplaint.complaintTime
                ? new Date(activeComplaint.complaintTime).toLocaleString()
                : activeComplaint.submittedAt
                  ? new Date(activeComplaint.submittedAt).toLocaleString()
                  : "â€”"}
            </p>
          </div>
        )}
        {success && <p className="mb-4 text-emerald-300">{success}</p>}
        {submittedStatus && (
          <div className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-4 text-emerald-100">
            <p className="font-semibold">Complaint Status</p>
            <p className="mt-1 capitalize">{submittedStatus}</p>
          </div>
        )}

        {!user && (
          <div className="mb-6 rounded-xl border border-white/20 bg-white/10 p-4 text-center">
            <p className="mb-3 font-semibold">
              Please login from the Dashboard first
            </p>
            <button
              className="inline-flex items-center justify-center rounded-lg bg-white text-slate-900 px-4 py-2 font-semibold"
              onClick={() => navigate("/")}
            >
              Go to Dashboard
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            placeholder="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            maxLength={15}
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
            disabled={!user || loading || Boolean(activeBlock)}
            required
          />

          <div className="grid gap-3">
            <input
              type="text"
              value={user?.name || ""}
              placeholder="Student Name"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-slate-100"
              disabled
            />
            <input
              type="email"
              value={user?.email || ""}
              placeholder="Student Email"
              className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-slate-100"
              disabled
            />
          </div>

          {/* Complaint Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg bg-gradient-to-r from-amber-100 via-white to-amber-50 border border-amber-200 px-4 py-3 text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300"
            disabled={!user || loading || Boolean(activeBlock)}
            required
          >
            <option value="">Select Complaint Type</option>
            <option value="Faculty">Faculty Issue</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Ragging">Ragging</option>
            <option value="Administration">Administration</option>
            <option value="Other">Other</option>
          </select>

          {/* Description */}
          <textarea
            placeholder="Write your complaint..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
            disabled={!user || loading || Boolean(activeBlock)}
            required
          />

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={!user || loading || Boolean(activeBlock)}
              className="w-full border border-white/20 rounded-lg px-4 py-3 bg-white/10 hover:bg-white/15 transition"
            >
              {location ? "Location Captured" : "Get Location"}
            </button>
            {locationStatus && (
              <p className="text-sm text-slate-200">{locationStatus}</p>
            )}
            {location && (
              <p className="text-sm text-slate-200">Location: {location}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-100">
              Upload Evidence (Required)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full rounded-lg border border-white/20 bg-white/10 text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-amber-100"
              disabled={!user || loading || Boolean(activeBlock)}
              required
            />
            {!file && (
              <p className="text-xs text-amber-200">
                Please select an image before submitting.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!user || loading || Boolean(activeBlock)}
            className="w-full bg-amber-300 text-slate-900 font-semibold py-3 rounded-lg shadow-lg hover:bg-amber-100 transition"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

        </form>

      </div>

    </div>

  </div>
  );
}

export default ComplaintPage;

