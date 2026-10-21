import { useState } from "react";
import axios from "axios";
import "./Profile.css";
import "./DonorDetailsModal.css";
import PageTopbar from "../components/PageTopbar";

const API_URL = "http://localhost:5000/api/auth";

function Profile({
  user,
  onUserUpdate,
  onBack,
  onOpenCamps,
  onOpenBloodRequest,
  onOpenDonations, onOpenMarkDonation,
  onLogout,
  darkMode,
  onToggleDarkMode,
}) {
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    bloodGroup: user.bloodGroup || "",
    location: user.location || "",
  });
  const [profilePicture, setProfilePicture] = useState(
    user.profilePicture || "",
  );
  const [donorDetails, setDonorDetails] = useState({
    bloodGroup: user.donorDetails?.bloodGroup || user.bloodGroup || "",
    phone: user.donorDetails?.phone || user.phone || "",
    nic: user.donorDetails?.nic || "",
    age: user.donorDetails?.age || "",
    gender: user.donorDetails?.gender || "",
    city: user.donorDetails?.city || user.location || "",
    lastDonatedDate: user.donorDetails?.lastDonatedDate || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [notifications, setNotifications] = useState(
    () => localStorage.getItem("notifications") !== "false",
  );
  const [message, setMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
    if (name === "phone" || name === "bloodGroup") {
      setDonorDetails((current) => ({ ...current, [name]: value }));
    }
    setMessage("");
  };

  const handleDonorDetailChange = (event) => {
    const { name, value } = event.target;
    setDonorDetails((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
    setMessage("");
  };

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      setMessage("Please choose a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Profile picture must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(reader.result);
      setIsDirty(true);
    };
    reader.onerror = () => setMessage("Unable to read the selected picture.");
    reader.readAsDataURL(file);
    setMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await axios.put(
        `${API_URL}/profile`,
        { ...form, profilePicture },
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        },
      );
      const updatedUser = response.data.user;
      if (user.role === "donor") {
        const donorResponse = await axios.put(
          `${API_URL}/donor-details`,
          donorDetails,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token") },
          },
        );
        updatedUser.donorDetails = donorResponse.data.donorDetails;
        updatedUser.donorDetailsComplete =
          donorResponse.data.donorDetailsComplete;
      }
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);
      setMessage(response.data.message);
      setIsDirty(false);
      setShowSuccess(true);
      window.setTimeout(() => setShowSuccess(false), 2400);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotifications = (event) => {
    const enabled = event.target.checked;
    setNotifications(enabled);
    localStorage.setItem("notifications", String(enabled));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordMessage("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage("");
    try {
      const response = await axios.put(
        `${API_URL}/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        },
      );
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage(response.data.message);
    } catch (error) {
      setPasswordMessage(
        error.response?.data?.message ||
          "Unable to change password. Please try again.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <main className="profile-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">
            <HeartIcon />
          </div>
          <span>BloodCare</span>
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item" onClick={onBack} type="button">
            <DashboardIcon /> Overview
          </button>
          <button
            className="dashboard-nav-item"
            onClick={onOpenCamps}
            type="button"
          >
            <CalendarIcon /> Donation camps
          </button>
          <button
            className="dashboard-nav-item"
            onClick={onOpenBloodRequest}
            type="button"
          >
            <HeartIcon /> I want blood
          </button>
          <button className="dashboard-nav-item" onClick={onOpenDonations} type="button">
            <HistoryIcon /> My donations
          </button>
          <button className="dashboard-nav-item" onClick={onOpenMarkDonation} type="button">
            <CheckIcon /> Mark as donated
          </button>
          <button
            className="dashboard-nav-item dashboard-nav-item-active"
            type="button"
          >
            <ProfileIcon /> My profile
          </button>
        </nav>
        <button className="dashboard-logout" onClick={onLogout} type="button">
          <LogoutIcon /> Log out
        </button>
      </aside>

      <section className="profile-content">
        <PageTopbar user={{ ...user, name: form.name, profilePicture }} />
        <header className="profile-header">
          <div>
            <button className="back-button" onClick={onBack} type="button">
              <ArrowBackIcon /> Back to overview
            </button>
            <p className="dashboard-eyebrow">Account settings</p>
            <h1>My profile</h1>
            <p className="profile-description">
              Keep your donor details and preferences up to date.
            </p>
          </div>
        </header>

        <div className="profile-layout">
          <form className="profile-card profile-form" onSubmit={handleSave}>
            <div className="profile-card-heading">
              <div>
                <p className="panel-eyebrow">Personal information</p>
                <h2>Donor details</h2>
              </div>
              <span className="profile-status">Active donor</span>
            </div>
            <div className="profile-fields">
              <label className="profile-picture-field">
                Profile picture
                <span className="profile-picture-control">
                  <span className="profile-picture-preview">
                    {profilePicture ? (
                      <img alt="" src={profilePicture} />
                    ) : (
                      <ProfileIcon />
                    )}
                  </span>
                  <span>
                    <strong>Choose a picture</strong>
                    <small>JPG, PNG, WEBP or GIF · Max 2 MB</small>
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePictureChange}
                    type="file"
                  />
                </span>
              </label>
              <label>
                Full name
                <input
                  className="profile-input"
                  name="name"
                  onChange={handleChange}
                  required
                  value={form.name}
                />
              </label>
              <label>
                Email address
                <input
                  className="profile-input"
                  name="email"
                  onChange={handleChange}
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label>
                Phone number
                <input
                  className="profile-input"
                  name="phone"
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  value={form.phone}
                />
              </label>
              <label>
                Blood group
                <select
                  className="profile-select"
                  name="bloodGroup"
                  onChange={handleChange}
                  value={form.bloodGroup}
                >
                  <option value="">Select blood group</option>
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
              <label className="profile-field-wide">
                Preferred location
                <input
                  className="profile-input"
                  name="location"
                  onChange={handleChange}
                  placeholder="e.g. Galle, Matara"
                  value={form.location}
                />
              </label>
              <label>
                NIC
                <input
                  className="profile-input"
                  name="nic"
                  onChange={handleDonorDetailChange}
                  required
                  value={donorDetails.nic}
                />
              </label>
              <label>
                Age
                <input
                  className="profile-input"
                  min="18"
                  max="100"
                  name="age"
                  onChange={handleDonorDetailChange}
                  required
                  type="number"
                  value={donorDetails.age}
                />
              </label>
              <label>
                Gender
                <select
                  className="profile-select"
                  name="gender"
                  onChange={handleDonorDetailChange}
                  required
                  value={donorDetails.gender}
                >
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                City
                <input
                  className="profile-input"
                  name="city"
                  onChange={handleDonorDetailChange}
                  required
                  value={donorDetails.city}
                />
              </label>
              <label className="profile-field-wide">
                Last donated date
                <input
                  className="profile-input"
                  name="lastDonatedDate"
                  onChange={handleDonorDetailChange}
                  type="date"
                  value={donorDetails.lastDonatedDate}
                />
              </label>
            </div>
            <div className="profile-form-footer">
              {message && <span className="profile-success">{message}</span>}
              {isDirty && (
                <button
                  className="profile-save-button"
                  disabled={isSaving}
                  type="submit"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              )}
            </div>
          </form>

          <section className="profile-card preferences-card">
            <div className="profile-card-heading">
              <div>
                <p className="panel-eyebrow">Personalize</p>
                <h2>Preferences</h2>
              </div>
            </div>
            <Preference
              title="Dark mode"
              description="Use a darker color scheme at night."
              checked={darkMode}
              onChange={onToggleDarkMode}
            />
            <Preference
              title="Camp reminders"
              description="Get reminders about nearby donation camps."
              checked={notifications}
              onChange={handleNotifications}
            />
            <div className="profile-tip">
              <HeartIcon />
              <div>
                <strong>Every donation matters</strong>
                <p>
                  Your updated location helps us show the most convenient camps
                  for you.
                </p>
              </div>
            </div>
          </section>

          <form
            className="profile-card password-card"
            onSubmit={handlePasswordSubmit}
          >
            <div className="profile-card-heading">
              <div>
                <p className="panel-eyebrow">Security</p>
                <h2>Change password</h2>
              </div>
            </div>
            <div className="password-fields">
              <label>
                Current password
                <input
                  className="profile-input"
                  name="currentPassword"
                  onChange={handlePasswordChange}
                  required
                  type="password"
                  value={passwordForm.currentPassword}
                />
              </label>
              <label>
                New password
                <input
                  className="profile-input"
                  minLength="8"
                  name="newPassword"
                  onChange={handlePasswordChange}
                  required
                  type="password"
                  value={passwordForm.newPassword}
                />
              </label>
              <label>
                Confirm new password
                <input
                  className="profile-input"
                  minLength="8"
                  name="confirmPassword"
                  onChange={handlePasswordChange}
                  required
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>
            </div>
            {passwordMessage && (
              <p
                className={`password-message ${passwordMessage.includes("successfully") ? "password-message-success" : ""}`}
              >
                {passwordMessage}
              </p>
            )}
            <button
              className="profile-save-button"
              disabled={isChangingPassword}
              type="submit"
            >
              {isChangingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </section>
      {showSuccess && (
        <div className="donor-details-overlay">
          <section
            aria-live="polite"
            className="donor-details-modal donor-details-success-modal"
          >
            <div className="donor-details-success-icon">✓</div>
            <p className="dashboard-eyebrow">Profile updated</p>
            <h2>Thank you, your changes were saved!</h2>
            <p className="donor-details-description">
              Your profile details have been updated successfully.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

function Preference({ title, description, checked, onChange }) {
  return (
    <label className="preference-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span className="toggle" />
    </label>
  );
}

const icon = (children, className = "dashboard-icon") => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    {children}
  </svg>
);
function HeartIcon() {
  return (
    <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
    </svg>
  );
}
function ArrowBackIcon() {
  return icon(
    <>
      <path
        d="m15 18-6-6 6-6M9 12h10"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>,
    "dashboard-icon small-icon",
  );
}
function DashboardIcon() {
  return icon(
    <>
      <rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" />
    </>,
  );
}
function CalendarIcon() {
  return icon(
    <>
      <rect height="16" rx="2" strokeWidth="2" width="18" x="3" y="5" />
      <path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" />
    </>,
  );
}
function HistoryIcon() {
  return icon(
    <path
      d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />,
  );
}

function CheckIcon() {
  return icon(
    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />,
  );
}

function ProfileIcon() {
  return icon(
    <>
      <circle cx="12" cy="8" r="4" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" />
    </>,
  );
}
function LogoutIcon() {
  return icon(
    <path
      d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />,
  );
}

export default Profile;
