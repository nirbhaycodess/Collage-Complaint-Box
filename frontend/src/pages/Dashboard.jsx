import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">

      <div className="text-center">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="University Logo"
          className="w-32 md:w-40 mx-auto mb-6"
        />

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">
          Anonymous Complaint Portal
        </h1>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">

          <button
            onClick={() => navigate("/complaint")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg shadow-md transition duration-300"
          >
            Student Complaint Box
          </button>

          <button
            onClick={() => navigate("/track")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg text-lg shadow-md transition duration-300"
          >
            Track Complaint
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg text-lg shadow-md transition duration-300"
          >
            Admin Login
          </button>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;
