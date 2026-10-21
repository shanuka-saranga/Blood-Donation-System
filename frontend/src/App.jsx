import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./pages/Login";
import DonorDashboard from "./pages/DonorDashboard";
import DonationCamps from "./pages/DonationCamps";
import Profile from "./pages/Profile";
import BloodRequest from "./pages/BloodRequest";
import DonationHistory from "./pages/DonationHistory";
import "./pages/DonorDetailsModal.css";

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });
  const [page, setPage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true",
  );
  const [isSavingDonorDetails, setIsSavingDonorDetails] = useState(false);
  const [donorDetailsError, setDonorDetailsError] = useState("");
  const [showDonorDetailsSuccess, setShowDonorDetailsSuccess] = useState(false);
  const [showDonorDetailsModal, setShowDonorDetailsModal] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return false;

    try {
      const restoredUser = JSON.parse(storedUser);
      return restoredUser.role === "donor" && !restoredUser.donorDetailsComplete;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  const handleDonorDetails = async (details) => {
    setIsSavingDonorDetails(true);
    setDonorDetailsError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:5000/api/auth/donor-details",
        details,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const updatedUser = {
        ...user,
        donorDetails: response.data.donorDetails,
        donorDetailsComplete: response.data.donorDetailsComplete,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setShowDonorDetailsSuccess(true);
      window.setTimeout(() => {
        setShowDonorDetailsSuccess(false);
        setShowDonorDetailsModal(false);
      }, 2400);
      return true;
    } catch (error) {
      setDonorDetailsError(
        error.response?.data?.message ||
          "Unable to save donor details. Please try again.",
      );
      return false;
    } finally {
      setIsSavingDonorDetails(false);
    }
  };

  if (!user) {
    return (
      <Login
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setPage("dashboard");
          setDonorDetailsError("");
          setShowDonorDetailsModal(
            loggedInUser.role === "donor" && !loggedInUser.donorDetailsComplete,
          );
        }}
      />
    );
  }

  if (page === "camps") {
    return (
      <DonationCamps
        user={user}
        onBack={() => setPage("dashboard")}
        onOpenBloodRequest={() => setPage("request-blood")}
        onOpenDonations={() => setPage("donations")}
        onOpenProfile={() => setPage("profile")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "profile") {
    return (
      <>
        <Profile
          darkMode={darkMode}
          onBack={() => setPage("dashboard")}
          onOpenCamps={() => setPage("camps")}
          onOpenBloodRequest={() => setPage("request-blood")}
          onOpenDonations={() => setPage("donations")}
          onLogout={handleLogout}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
          user={user}
          onUserUpdate={setUser}
        />
      </>
    );
  }

  if (page === "request-blood") {
    return (
      <BloodRequest
        user={user}
        onBack={() => setPage("dashboard")}
        onOpenCamps={() => setPage("camps")}
        onOpenDonations={() => setPage("donations")}
        onOpenProfile={() => setPage("profile")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "donations") {
    return (
      <DonationHistory
        user={user}
        onBack={() => setPage("dashboard")}
        onOpenCamps={() => setPage("camps")}
        onOpenBloodRequest={() => setPage("request-blood")}
        onOpenProfile={() => setPage("profile")}
        onLogout={handleLogout}
      />
    );
  }

  const pageContent =
    page === "camps" ? (
      <DonationCamps
        user={user}
        onBack={() => setPage("dashboard")}
        onOpenBloodRequest={() => setPage("request-blood")}
        onOpenDonations={() => setPage("donations")}
        onOpenProfile={() => setPage("profile")}
        onLogout={handleLogout}
      />
    ) : (
      <DonorDashboard
        user={user}
        onLogout={handleLogout}
        onOpenCamps={() => setPage("camps")}
        onOpenBloodRequest={() => setPage("request-blood")}
        onOpenDonations={() => setPage("donations")}
        onOpenProfile={() => setPage("profile")}
      />
    );

  return (
    <>
      {pageContent}
      {user.role === "donor" &&
        (showDonorDetailsModal || showDonorDetailsSuccess) && (
          <DonorDetailsModal
            onSave={handleDonorDetails}
            error={donorDetailsError}
            isSaving={isSavingDonorDetails}
            showSuccess={showDonorDetailsSuccess}
          />
        )}
    </>
  );
}

function DonorDetailsModal({ onSave, error, isSaving, showSuccess }) {
  const [form, setForm] = useState({
    bloodGroup: "",
    phone: "",
    nic: "",
    age: "",
    gender: "",
    city: "",
    lastDonatedDate: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave(form);
  };

  if (showSuccess) {
    return (
      <div className="donor-details-overlay">
        <section
          aria-live="polite"
          className="donor-details-modal donor-details-success-modal"
        >
          <div className="donor-details-success-icon">✓</div>
          <p className="dashboard-eyebrow">Profile updated</p>
          <h2>Thank you, your details were submitted!</h2>
          <p className="donor-details-description">
            Your donor information has been saved successfully.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="donor-details-overlay">
      <form className="donor-details-modal" onSubmit={handleSubmit}>
        <p className="dashboard-eyebrow">Complete your profile</p>
        <h2>Tell us about yourself</h2>
        <p className="donor-details-description">
          Please add your donor details before continuing.
        </p>
        <div className="donor-details-fields">
          <label>
            Blood group
            <select
              name="bloodGroup"
              onChange={handleChange}
              required
              value={form.bloodGroup}
            >
              <option value="">Select</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
          </label>
          <label>
            Phone
            <input
              name="phone"
              onChange={handleChange}
              required
              value={form.phone}
            />
          </label>
          <label>
            NIC
            <input
              name="nic"
              onChange={handleChange}
              required
              value={form.nic}
            />
          </label>
          <label>
            Age
            <input
              min="18"
              max="100"
              name="age"
              onChange={handleChange}
              required
              type="number"
              value={form.age}
            />
          </label>
          <label>
            Gender
            <select
              name="gender"
              onChange={handleChange}
              required
              value={form.gender}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            City
            <input
              name="city"
              onChange={handleChange}
              required
              value={form.city}
            />
          </label>
          <label className="donor-details-wide">
            Last donated date (optional)
            <input
              name="lastDonatedDate"
              onChange={handleChange}
              type="date"
              value={form.lastDonatedDate}
            />
          </label>
        </div>
        {error && (
          <p className="donor-details-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="profile-save-button"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}

export default App;
