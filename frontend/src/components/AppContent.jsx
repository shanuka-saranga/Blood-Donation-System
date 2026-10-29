import { useState } from "react";
import axios from "axios";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AdminDashboard from "../pages/AdminDashboard";
import BloodRequest from "../pages/BloodRequest";
import DonationCamps from "../pages/DonationCamps";
import DonationHistory from "../pages/DonationHistory";
import DonorDashboard from "../pages/DonorDashboard";
import MarkDonation from "../pages/MarkDonation";
import Profile from "../pages/Profile";
import DonorDetailsModal from "./DonorDetailsModal";

function AppContent({
  user,
  onLogout,
  darkMode,
  onToggleDarkMode,
  onUserUpdate,
}) {
  const navigate = useNavigate();
  const [latestDonationDate, setLatestDonationDate] = useState("");
  const [latestActivity, setLatestActivity] = useState(null);
  const [isSavingDonorDetails, setIsSavingDonorDetails] = useState(false);
  const [donorDetailsError, setDonorDetailsError] = useState("");
  const [showDonorDetailsSuccess, setShowDonorDetailsSuccess] = useState(false);
  const [showDonorDetailsModal, setShowDonorDetailsModal] = useState(
    () => user.role === "donor" && !user.donorDetailsComplete,
  );

  const open = (path) => () => navigate(path);
  const donorNavigation = {
    onBack: open("/dashboard"),
    onOpenCamps: open("/camps"),
    onOpenBloodRequest: open("/request-blood"),
    onOpenDonations: open("/donations"),
    onOpenProfile: open("/profile"),
    onOpenMarkDonation: open("/mark-donation"),
    onLogout,
  };

  const handleDonorDetails = async (details) => {
    setIsSavingDonorDetails(true);
    setDonorDetailsError("");
    try {
      const response = await axios.put("/api/auth/donor-details", details, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      const updatedUser = {
        ...user,
        donorDetails: response.data.donorDetails,
        donorDetailsComplete: response.data.donorDetailsComplete,
      };
      onUserUpdate(updatedUser);
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

  if (user.role === "admin") {
    return (
      <Routes>
        <Route
          path="/admin"
          element={<AdminDashboard user={user} onLogout={onLogout} />}
        />
        <Route path="*" element={<Navigate replace to="/admin" />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <DonorDashboard
              {...donorNavigation}
              user={user}
              latestDonationDate={latestDonationDate}
              latestActivity={latestActivity}
            />
          }
        />
        <Route
          path="/camps"
          element={<DonationCamps {...donorNavigation} user={user} />}
        />
        <Route
          path="/request-blood"
          element={<BloodRequest {...donorNavigation} user={user} />}
        />
        <Route
          path="/donations"
          element={<DonationHistory {...donorNavigation} user={user} />}
        />
        <Route
          path="/mark-donation"
          element={
            <MarkDonation
              {...donorNavigation}
              user={user}
              onDonationRecorded={(donation) => {
                setLatestDonationDate(donation.date);
                setLatestActivity(donation);
              }}
            />
          }
        />
        <Route
          path="/profile"
          element={
            <Profile
              {...donorNavigation}
              darkMode={darkMode}
              onToggleDarkMode={onToggleDarkMode}
              user={user}
              onUserUpdate={onUserUpdate}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
      {(showDonorDetailsModal || showDonorDetailsSuccess) && (
        <DonorDetailsModal
          onSave={handleDonorDetails}
          onClose={() => setShowDonorDetailsModal(false)}
          error={donorDetailsError}
          isSaving={isSavingDonorDetails}
          showSuccess={showDonorDetailsSuccess}
        />
      )}
    </>
  );
}

export default AppContent;
