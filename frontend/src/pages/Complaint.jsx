import { useRef, useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function ComplaintPage() {

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const fileInputRef = useRef(null);

  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser(decoded);
      setSuccess(`Logged in as ${decoded.email}`);
    } catch (e) {
      console.log(e);
      setError("Google login failed. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!user) {
        setError("Please login with Google first.");
        return;
      }

      const formData = new FormData();
      formData.append("type", type);
      formData.append("description", description);
      if (file) formData.append("image", file);

      const res = await axios.post(
        "http://localhost:5000/api/complaints/submit",
        formData
      );

      const newId = res.data?.data?._id;
      if (newId) {
        setSubmittedId(newId);
        localStorage.setItem("lastComplaintId", newId);
      }
      setSuccess(res.data?.message || "Complaint submitted successfully");
      setType("");
      setDescription("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.log(e);
      const message = e?.response?.data?.message;
      setError(message || "Failed to submit complaint. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">

        <h2 className="text-2xl font-bold text-center mb-6">
          Submit Anonymous Complaint
        </h2>

        {error && <p className="mb-4 text-red-600">{error}</p>}
        {success && <p className="mb-4 text-green-700">{success}</p>}
        {submittedId && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-900">
            <p className="font-semibold">Your Tracking ID:</p>
            <p className="break-all">{submittedId}</p>
            <a
              className="mt-2 inline-block underline"
              href={`/track/${submittedId}`}
            >
              Track complaint status
            </a>
          </div>
        )}

        {!user && (
          <div className="mb-6 text-center">
            <p className="mb-2 font-semibold">
              Login with Google to submit complaint
            </p>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => setError("Google login failed. Please try again.")}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Complaint Type */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
            disabled={!user || loading}
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
            className="w-full border rounded-lg px-4 py-2"
            disabled={!user || loading}
            required
          />

          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full"
            disabled={!user || loading}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!user || loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default ComplaintPage;
