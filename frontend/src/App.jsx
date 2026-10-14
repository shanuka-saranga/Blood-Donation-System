import { useState } from "react";

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      {/* Header / Hero Section */}
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border-t-8 border-red-600 text-center">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
          <svg
            className="w-12 h-12 text-red-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Blood Donation Camp Management System
        </h1>
        <p className="text-gray-600 mb-6">
          Faculty of Technology - University of Ruhuna (Group 07)
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition shadow-md">
            Login
          </button>
          <button className="bg-white hover:bg-gray-100 text-red-600 font-semibold px-6 py-2.5 rounded-lg border border-red-600 transition">
            Register as Donor
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
