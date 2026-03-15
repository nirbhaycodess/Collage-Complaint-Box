import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const ComplaintPage = () => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
    alert("Logged in as " + decoded.email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please login with Google first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("description", description);
      if (file) formData.append("image", file);

      const res = await axios.post(
        "http://localhost:5000/api/complaints/submit",
        formData
      );

      console.log(res.data);
      alert("Complaint Submitted Successfully");

      setType("");
      setDescription("");
      setFile(null);
    } catch (error) {
      console.log(error);
      alert("Error submitting complaint");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          Submit Anonymous Complaint
        </h2>

        {!user && (
          <div className="mb-6 text-center">
            <p className="mb-2 font-semibold">
              Login with Google to submit complaint
            </p>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => console.log("Login Failed")}
            />
          </div>
        )}

        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Complaint Type */}
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
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
              required
            />

            {/* File Upload */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full"
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Submit Complaint
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ComplaintPage;
