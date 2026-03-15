import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function TrackComplaint() {
  const params = useParams();
  const [complaintId, setComplaintId] = useState(params.id || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStatus = async (id) => {
    const cleaned = (id || "").trim();
    if (!cleaned) return;
    try {
      setLoading(true);
      setError("");
      setResult(null);
      const res = await axios.get(
        `http://localhost:5000/api/complaints/track/${encodeURIComponent(
          cleaned
        )}`
      );
      setResult(res.data?.data || null);
    } catch (e) {
      console.log(e);
      const status = e?.response?.status;
      const data = e?.response?.data;
      const message =
        typeof data === "string" ? data : data?.message || data?.error;

      setError(
        message ||
          (status ? `Unable to track this complaint ID. (${status})` : "Unable to reach backend.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = params.id || localStorage.getItem("lastComplaintId") || "";
    if (!complaintId && initial) setComplaintId(initial);
    if (params.id) fetchStatus(params.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const statusLabel = (status) => {
    if (status === "done") return "Done";
    if (status === "resolved") return "Resolved";
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Track Complaint</h2>

        <div className="space-y-3">
          <input
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            placeholder="Enter your complaint tracking ID"
            className="w-full border rounded-lg px-4 py-2"
          />
          <button
            onClick={() => fetchStatus(complaintId)}
            disabled={loading || !complaintId}
            className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900 transition"
          >
            {loading ? "Checking..." : "Check Status"}
          </button>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {result && (
          <div className="mt-6 rounded-lg border p-4 bg-gray-50">
            <p className="font-semibold">Status: {statusLabel(result.status)}</p>
            <p className="text-sm text-gray-700 mt-1">Type: {result.type}</p>
            <p className="text-sm text-gray-700 mt-1">
              Submitted: {new Date(result.submittedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
