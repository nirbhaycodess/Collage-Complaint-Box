import { Navigate } from "react-router-dom";

export default function RequireAdmin({ children }) {
  const token = sessionStorage.getItem("adminToken");
  if (!token) return <Navigate to="/" replace />;
  return children;
}
