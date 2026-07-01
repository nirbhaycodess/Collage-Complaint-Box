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
  import.meta.env.VITE_API_BASE_URL || "https://speakup-invertians.onrender.com";

function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [studentUser, setStudentUser] = useState(null);
  const [adminId, setAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAccessCode, setAdminAccessCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("unknown");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [idCardFile, setIdCardFile] = useState(null);
  const getReverifyKey = (email) =>
    email ? `ccb_force_reverify_${String(email).toLowerCase()}` : "";

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
    setVerificationStatus("unknown");
    setIdCardFile(null);
    setVerifyError("");
  };

  const handleIdCardChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setIdCardFile(nextFile);
    setVerifyError("");
    if (nextFile) {
      // Force fresh verification for every new upload attempt.
      setVerificationStatus("unverified");
      const reverifyKey = getReverifyKey(studentUser?.email);
      if (reverifyKey) {
        localStorage.setItem(reverifyKey, "1");
      }
    }
  };

  const fetchVerificationStatus = async (email) => {
    const reverifyKey = getReverifyKey(email);
    if (reverifyKey && localStorage.getItem(reverifyKey) === "1") {
      setVerificationStatus("unverified");
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}/api/students/verify/status`, {
        params: { email },
      });
      setVerificationStatus(res.data?.verified ? "verified" : "unverified");
    } catch (error) {
      console.log(error);
      setVerificationStatus("unverified");
    }
  };

  const handleVerifyStudent = async () => {
    if (!studentUser?.email || !studentUser?.name) {
      setVerifyError("Please sign in first.");
      return;
    }
    if (!idCardFile) {
      setVerifyError("Please upload your ID card.");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError("");
      const formData = new FormData();
      formData.append("studentEmail", studentUser.email);
      formData.append("studentName", studentUser.name);
      formData.append("idCard", idCardFile);

      const res = await axios.post(
        `${API_BASE}/api/students/verify`,
        formData
      );
      const reverifyKey = getReverifyKey(studentUser.email);

      if (res.data?.verified) {
        setVerificationStatus("verified");
        if (reverifyKey) {
          localStorage.removeItem(reverifyKey);
        }
      } else {
        setVerificationStatus("unverified");
        setVerifyError(
          "Verification failed. Please upload a clearer ID card."
        );
        if (reverifyKey) {
          localStorage.setItem(reverifyKey, "1");
        }
      }
    } catch (error) {
      console.log(error);
      setVerifyError("Verification failed. Please try again.");
      setVerificationStatus("unverified");
      const reverifyKey = getReverifyKey(studentUser?.email);
      if (reverifyKey) {
        localStorage.setItem(reverifyKey, "1");
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    if (studentUser?.email) {
      fetchVerificationStatus(studentUser.email);
    }
  }, [studentUser?.email]);

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

      <div className="relative min-h-screen flex items-center justify-center px-6 py-12 pb-28 md:pb-12">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 md:-translate-y-[40%]">
            <img
              src={logo}
              alt="University Logo"
              className="w-32 md:w-40 bg-transparent brightness-125 contrast-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
            />
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">
                Complaint Portal for Invertains 
            </h1>
            <p className="text-slate-100 text-lg leading-relaxed">
              A safe space for students to raise concerns and for admins to act
              quickly. Your voice matters - let's make our campus better together.
            </p>

            <div className="mt-4 hidden md:flex flex-col items-start gap-2 text-slate-100">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>Made By Nirbhay Yadav</span>
                <span className="text-red-400">❤️</span>
              </div>

              <div className="flex items-center gap-3">
                <a href="https://github.com/nirbhaycodess" data-social="github" aria-label="GitHub" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.03-.02-2.02-3.2.7-3.88-1.55-3.88-1.55-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.2 1.19a11.1 11.1 0 012.92-.39c.99 0 1.99.13 2.92.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.6.23 2.78.11 3.07.75.81 1.2 1.84 1.2 3.1 0 4.44-2.71 5.4-5.29 5.69.42.36.79 1.09.79 2.2 0 1.59-.02 2.87-.02 3.26 0 .31.21.68.8.56A10.52 10.52 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
                  </svg>
                </a>

                <a href="https://www.linkedin.com/in/nirbhay-yadav-202535ys/" data-social="linkedin" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zM8.5 8h3.8v2.2h.1c.5-1 1.7-2.2 3.6-2.2 3.8 0 4.5 2.5 4.5 5.7V24h-4V14.3c0-2.2-.04-5-3-5-3 0-3.5 2.3-3.5 4.8V24h-4V8z" />
                  </svg>
                </a>

                <a href="https://www.instagram.com/nirbhay.yadav_/" data-social="instagram" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zM12 7.5A4.5 4.5 0 1012 16.5 4.5 4.5 0 0012 7.5zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM17.7 6.3a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <img
                  src={logo}
                  alt="University Logo"
                  className="w-20 md:w-24 mb-3 bg-transparent brightness-125 contrast-125 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
                />
                <h2 className="text-2xl font-semibold">Login</h2>
                <p className="text-slate-200 text-sm">
                  Choose a role and continue
                </p>
              </div>
              <div className="bg-white/10 p-1 rounded-full flex items-center">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    role === "student"
                      ? "bg-white text-slate-900"
                      : "text-slate-200 hover:text-white"
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
                      : "text-slate-200 hover:text-white"
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
                    <p className="text-sm text-slate-100">
                      Sign in with Google to continue
                    </p>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleStudentLoginSuccess}
                        onError={() => console.log("Student login failed")}
                      />
                    </div>
                    <p className="text-xs text-slate-200">
                      We will remember this device next time.
                    </p>
                  </div>
                )}

                {studentUser && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4">
                      <p className="text-sm text-slate-200">Signed in as</p>
                      <p className="text-lg font-semibold">
                        {studentUser.name || "Student"}
                      </p>
                      <p className="text-sm text-slate-200">
                        {studentUser.email}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 p-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-200">
                        Student Verification
                      </p>
                      {verificationStatus === "unverified" && (
                        <p className="rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
                          Upload your college ID card to verify your account. Important: Your Google account name should match the name printed on your college ID card.
                        </p>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIdCardChange}
                        className="w-full rounded-lg border border-white/20 bg-white/10 text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-900 hover:file:bg-amber-100"
                      />
                      {verifyError && (
                        <p className="text-xs text-amber-200">{verifyError}</p>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyStudent}
                        disabled={verifyLoading}
                        className="w-full bg-amber-300 text-slate-900 font-semibold py-2.5 rounded-lg shadow-lg hover:bg-amber-100 transition"
                      >
                        {verifyLoading ? "Verifying..." : "Verify Student"}
                      </button>
                      {verificationStatus === "verified" && (
                        <p className="text-xs text-emerald-200">
                          Student status verified. You may now proceed to the complaint form.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/complaint")}
                      disabled={verificationStatus !== "verified"}
                      className="w-full bg-amber-300 text-slate-900 font-semibold py-3 rounded-lg shadow-lg hover:bg-amber-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
                  className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
                  className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
                  className="mt-2 w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </label>
                {adminError && (
                  <p className="text-sm text-red-300">{adminError}</p>
                )}
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-sky-300 text-slate-900 font-semibold py-3 rounded-lg shadow-lg hover:bg-sky-100 transition"
                >
                  {adminLoading ? "Signing in..." : "Continue as Admin"}
                </button>
                <p className="text-xs text-slate-200 text-center">
                  Admin access is monitored and logged.
                </p>
              </form>
            )}

            <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center border-t border-white/10 bg-slate-950/90 px-4 py-3 text-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span>Made By Nirbhay Yadav</span>
                  <span className="text-red-400">❤️</span>
                </div>
                <div className="flex items-center gap-3">
                  <a href="https://github.com/nirbhaycodess" data-social="github" aria-label="GitHub" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.03-.02-2.02-3.2.7-3.88-1.55-3.88-1.55-.53-1.36-1.3-1.72-1.3-1.72-1.06-.73.08-.72.08-.72 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.2 1.19a11.1 11.1 0 012.92-.39c.99 0 1.99.13 2.92.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.6.23 2.78.11 3.07.75.81 1.2 1.84 1.2 3.1 0 4.44-2.71 5.4-5.29 5.69.42.36.79 1.09.79 2.2 0 1.59-.02 2.87-.02 3.26 0 .31.21.68.8.56A10.52 10.52 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/in/nirbhay-yadav-202535ys/" data-social="linkedin" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zM8.5 8h3.8v2.2h.1c.5-1 1.7-2.2 3.6-2.2 3.8 0 4.5 2.5 4.5 5.7V24h-4V14.3c0-2.2-.04-5-3-5-3 0-3.5 2.3-3.5 4.8V24h-4V8z" />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/nirbhay.yadav_/" data-social="instagram" aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="text-slate-100 hover:text-amber-300 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3h10zM12 7.5A4.5 4.5 0 1012 16.5 4.5 4.5 0 0012 7.5zm0 2a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM17.7 6.3a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default Dashboard;

