import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {

  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch complaints
  const fetchComplaints = async () => {
    try {

      setLoading(true);
      setError("");
      const res = await axios.get("http://localhost:5000/api/complaints", {
        headers: getAuthHeaders(),
      });

      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      setComplaints(Array.isArray(list) ? list : []);

    } catch (error) {
      console.log(error);
      if (error?.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }
      setError("Failed to fetch complaints.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {

      await axios.patch(
        `http://localhost:5000/api/complaints/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      fetchComplaints();

    } catch (error) {
      console.log(error);
      if (error?.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }
      setError("Failed to update complaint status.");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-6">
        Admin Complaint Dashboard
      </h1>

      <button
        onClick={logout}
        className="mb-6 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
      >
        Logout
      </button>

      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="space-y-4">

        {complaints.map((complaint) => (

          <div
            key={complaint._id}
            className="bg-white p-4 rounded shadow"
          >

            <p className="font-semibold">
              Type: {complaint.type}
            </p>

            <p>
              Description: {complaint.description}
            </p>
            {complaint.image && (
              <div className="mt-3">
                <p className="font-semibold">Evidence:</p>
                <img
                  src={`http://localhost:5000${complaint.image}`}
                  alt="complaint proof"
                  className="w-48 mt-2 rounded border"
                />
              </div>
            )}
            <p className="mb-3">
              Status:
              <span className="ml-2 font-bold">
                {complaint.status}
              </span>
            </p>

            {complaint.status !== "resolved" && (
              <button
                onClick={() => updateStatus(complaint._id, "resolved")}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Resolve
              </button>
            )}

            

          </div>

        ))}

      </div>

    </div>
  );
}

export default AdminDashboard;
