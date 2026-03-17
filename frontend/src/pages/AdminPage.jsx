import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgAdmin from "../assets/bgAdmin.png.jpeg";
import bgMobile from "../assets/bgMA.png";
import logo from "../assets/logo.png";

// Backend base URL (override with VITE_API_BASE_URL in .env)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://10.56.212.140:5000";

function AdminDashboard() {

  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [locationNames, setLocationNames] = useState({});

  const getAuthHeaders = () => {
    // Pull admin JWT from session storage
    const token = sessionStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch complaints
  const fetchComplaints = async () => {
    try {

      setLoading(true);
      setError("");
      const res = await axios.get(`${API_BASE}/api/complaints`, {
        headers: getAuthHeaders(),
      });

      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      setComplaints(Array.isArray(list) ? list : []);

    } catch (error) {
      console.log(error);
      if (error?.response?.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/");
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
        `${API_BASE}/api/complaints/${id}/status`,
        { status },
        { headers: getAuthHeaders() }
      );

      fetchComplaints();

    } catch (error) {
      console.log(error);
      if (error?.response?.status === 401) {
        sessionStorage.removeItem("adminToken");
        navigate("/");
        return;
      }
      setError("Failed to update complaint status.");
    }
  };

  const logout = () => {
    // Clear admin session and return to login
    sessionStorage.removeItem("adminToken");
    navigate("/admin");
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    // Reverse geocode coordinates for friendlier admin display
    const parseLatLon = (value) => {
      if (typeof value !== "string") return null;
      const parts = value.split(",").map((item) => item.trim());
      if (parts.length !== 2) return null;
      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
      return { lat, lon };
    };

    const unresolved = complaints
      .map((item) => item.location)
      .filter((loc) => loc && !locationNames[loc] && parseLatLon(loc));

    if (unresolved.length === 0) return;

    let cancelled = false;

    const resolveLocations = async () => {
      for (const loc of unresolved) {
        if (cancelled) return;
        const coords = parseLatLon(loc);
        if (!coords) continue;
        try {
          const url = new URL(
            "https://nominatim.openstreetmap.org/reverse"
          );
          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("lat", String(coords.lat));
          url.searchParams.set("lon", String(coords.lon));
          const res = await fetch(url.toString(), {
            headers: { "Accept-Language": "en" },
          });
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          const displayName = data?.display_name || loc;
          setLocationNames((prev) => ({
            ...prev,
            [loc]: displayName,
          }));
        } catch (error) {
          setLocationNames((prev) => ({ ...prev, [loc]: loc }));
        }
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    };

    resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [complaints, locationNames]);

  const totalCount = complaints.length;
  const resolvedCount = complaints.filter(
    (item) => String(item.status).toLowerCase() === "resolved"
  ).length;
  const newCount = complaints.filter(
    (item) => String(item.status).toLowerCase() !== "resolved"
  ).length;

  const typeOptions = Array.from(
    new Set(complaints.map((item) => item.type).filter(Boolean))
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus =
      statusFilter === "all" ||
      String(item.status).toLowerCase() === statusFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      String(item.type).toLowerCase().includes(normalizedSearch) ||
      String(item.description).toLowerCase().includes(normalizedSearch);
    return matchesStatus && matchesType && matchesSearch;
  });

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    const aDate = new Date(a.submittedAt || a.complaintTime || 0).getTime();
    const bDate = new Date(b.submittedAt || b.complaintTime || 0).getTime();
    if (sortOrder === "oldest") {
      return aDate - bDate;
    }
    return bDate - aDate;
  });

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-slate-950 admin-bg">
      <style>{`
        .admin-bg {
          background-image: url(${bgAdmin});
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        @media (max-width: 768px) {
          .admin-bg {
            background-image: url(${bgMobile});
            background-position: center 25%;
            background-size: cover;
            background-attachment: fixed;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-slate-950/50" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-400/30 blur-3xl" />
      <div className="absolute bottom-[-140px] left-1/4 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative min-h-screen px-6 py-10 md:px-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="space-y-3">
              <img
                src={logo}
                alt="University Logo"
                className="w-24 md:w-32 bg-transparent brightness-125 contrast-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
              />
              <p className="text-sm text-slate-300 tracking-wide uppercase">
                Admin Workspace
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold">
                Complaint Dashboard
              </h1>
              <p className="text-slate-300 max-w-2xl">
                Review new complaints, check Verification , and mark them as resolved
                from a single streamlined view.
              </p>
            </div>

            <button
              onClick={logout}
              className="bg-white/10 border border-white/10 text-white px-5 py-2.5 rounded-lg hover:bg-white/20 transition"
            >
              Logout
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">New</p>
              <p className="text-3xl font-semibold">{newCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Resolved</p>
              <p className="text-3xl font-semibold">{resolvedCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Total</p>
              <p className="text-3xl font-semibold">{totalCount}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <h2 className="text-xl font-semibold">All Complaints</h2>
              <span className="text-sm text-slate-300">
                Showing: {filteredComplaints.length}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr] mb-6">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-300">
                  Search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by type or description"
                  className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-300">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-white/90 border border-white/10 px-4 py-3 text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-300">
                  Type
                </span>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-white/90 border border-white/10 px-4 py-3 text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="all">All Types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-300">
                  Sort
                </span>
                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  className="mt-2 w-full rounded-lg bg-white/90 border border-white/10 px-4 py-3 text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
            </div>

            {loading && <p className="text-slate-300 mb-4">Loading...</p>}
            {error && <p className="text-red-300 mb-4">{error}</p>}

            {!loading && !error && complaints.length === 0 && (
              <div className="text-center py-12 text-slate-300">
                No complaints yet. You are all caught up.
              </div>
            )}

            {!loading && !error && complaints.length > 0 && filteredComplaints.length === 0 && (
              <div className="text-center py-12 text-slate-300">
                No complaints match your filters.
              </div>
            )}

            <div className="grid gap-5">
              {sortedComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-300">
                        Complaint Type
                      </p>
                      <p className="text-lg font-semibold">
                        {complaint.type}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm">
                      <span className="text-slate-300">Status</span>
                      <span className="font-semibold text-white">
                        {complaint.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200">
                    {complaint.description}
                  </p>

                  <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                    <p>
                      <span className="text-slate-400">Student ID:</span>{" "}
                      {complaint.studentId || "—"}
                    </p>
                    <p>
                      <span className="text-slate-400">Student Name:</span>{" "}
                      {complaint.studentName || "—"}
                    </p>
                    <p>
                      <span className="text-slate-400">Email:</span>{" "}
                      {complaint.studentEmail || "—"}
                    </p>
                    <p>
                      <span className="text-slate-400">Location:</span>{" "}
                      {complaint.location
                        ? locationNames[complaint.location] ||
                          complaint.location
                        : "—"}
                    </p>
                    <p>
                      <span className="text-slate-400">Submitted At:</span>{" "}
                      {complaint.submittedAt
                        ? new Date(complaint.submittedAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  {complaint.image && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Verification</p>
                      <img
                        src={`${API_BASE}${complaint.image}`}
                        alt="complaint proof"
                        className="w-full max-w-sm rounded-lg border border-white/10"
                      />
                    </div>
                  )}

                  {complaint.status !== "resolved" && (
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() =>
                          updateStatus(complaint._id, "resolved")
                        }
                        className="bg-emerald-300 text-slate-900 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-200 transition"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
