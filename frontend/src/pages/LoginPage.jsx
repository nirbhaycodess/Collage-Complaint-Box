import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.png";
import bg from "../assets/Bg.png";
import bgMobile from "../assets/bgM.png";

// Backend base URL (override with VITE_API_BASE_URL in .env)
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://10.56.212.140:5000";

function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [studentUser, setStudentUser] = useState(null);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAccessCode, setAdminAccessCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    // Restore student session (if any)
    const stored = localStorage.getItem("ccb_student_user");
    if (stored) {
      try {
        setStudentUser(JSON.parse(stored));
      } catch (error) {
        localStorage.removeItem("ccb_student_user");
      }
    }
  }, []);

  const handleStudentLoginSuccess = (credentialResponse) => {
    // Decode Google JWT and store basic profile info
    const decoded = jwtDecode(credentialResponse.credential);
    setStudentUser(decoded);
    localStorage.setItem("ccb_student_user", JSON.stringify(decoded));
  };

  const handleStudentLogout = () => {
    // Clear local student session
    setStudentUser(null);
    localStorage.removeItem("ccb_student_user");
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    try {
      setAdminLoading(true);
      setAdminError("");
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        adminId,
        password: adminPassword,
        accessCode: adminAccessCode,
      });
      const token = res.data?.token;
      if (!token) throw new Error("Missing token");
      sessionStorage.setItem("adminToken", token);
      navigate("/admin/dashboard");
    } catch (error) {
      console.log(error);
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      if (status === 401) {
        setAdminError(message || "Invalid Admin ID, Password, or Access Code");
      } else if (!error?.response) {
        setAdminError(
          "Backend not reachable. Start backend on http://10.56.212.140:5000"
        );
      } else {
        setAdminError(message || "Login failed. Please try again.");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-slate-950 dashboard-bg">
      <style>{`
        .dashboard-bg {
          background-image: url(${bg});
          background-size: cover;
          background-position: top center;
          background-attachment: fixed;
        }
        .dashboard-overlay {
          background: linear-gradient(
            to bottom,
            rgba(2, 6, 23, 0.75) 0%,
            rgba(2, 6, 23, 0.75) 15%,
            rgba(2, 6, 23, 0.6) 45%,
            rgba(2, 6, 23, 0.5) 100%
          );
        }
        @media (max-width: 768px) {
          .dashboard-bg {
            background-image: url(${bgMobile});
            background-position: center 40%;
            background-attachment: fixed;
          }
          .dashboard-overlay {
            background: linear-gradient(
              to bottom,
              rgba(2, 6, 23, 0.6) 0%,
              rgba(2, 6, 23, 0.6) 20%,
              rgba(2, 6, 23, 0.45) 50%,
              rgba(2, 6, 23, 0.5) 100%
            );
          }
        }
      `}</style>
      <div className="absolute inset-0 dashboard-overlay" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-sky-400/30 blur-3xl" />
      <div className="absolute bottom-[-140px] left-1/4 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <img
              src={logo}
              alt="University Logo"
              className="w-32 md:w-40 bg-transparent brightness-125 contrast-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
            />
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                Complaint Portal for Invertains 
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              A safe space for students to raise concerns and for admins to act
              quickly. Your voice matters - let's make our campus better together.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Login</h2>
                <p className="text-slate-300 text-sm">
                  Choose a role and continue
                </p>
              </div>
              <div className="bg-white/5 p-1 rounded-full flex items-center">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    role === "student"
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    role === "admin"
                      ? "bg-white text-slate-900"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {role === "student" ? (
              <div className="space-y-4">
                {!studentUser && (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-slate-200">
                      Sign in with Google to continue
                    </p>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleStudentLoginSuccess}
                        onError={() => console.log("Student login failed")}
                      />
                    </div>
                    <p className="text-xs text-slate-300">
                      We will remember this device next time.
                    </p>
                  </div>
                )}

                {studentUser && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-slate-300">Signed in as</p>
                      <p className="text-lg font-semibold">
                        {studentUser.name || "Student"}
                      </p>
                      <p className="text-sm text-slate-300">
                        {studentUser.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/complaint")}
                      className="w-full bg-amber-300 text-slate-900 font-semibold py-3 rounded-lg shadow-lg hover:bg-amber-200 transition"
                    >
                      Continue to Complaint Form
                    </button>
                    <button
                      type="button"
                      onClick={handleStudentLogout}
                      className="w-full border border-white/20 text-white py-3 rounded-lg hover:bg-white/10 transition"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={handleAdminLogin}
              >
                <label className="block">
                  <span className="text-sm text-slate-200">Admin ID</span>
                  <input
                    type="text"
                    required
                    placeholder="eg. ADM-1024"
                    value={adminId}
                    onChange={(event) => setAdminId(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-200">Password</span>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-200">Access Code</span>
                  <input
                    type="password"
                    required
                    placeholder="6-digit code"
                    value={adminAccessCode}
                    onChange={(event) => setAdminAccessCode(event.target.value)}
                    className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </label>
                {adminError && (
                  <p className="text-sm text-red-300">{adminError}</p>
                )}
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-sky-300 text-slate-900 font-semibold py-3 rounded-lg shadow-lg hover:bg-sky-200 transition"
                >
                  {adminLoading ? "Signing in..." : "Continue as Admin"}
                </button>
                <p className="text-xs text-slate-300 text-center">
                  Admin access is monitored and logged.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
