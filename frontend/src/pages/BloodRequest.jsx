import { useState } from "react";
import axios from "axios";
import "./BloodRequest.css";
import PageTopbar from "../components/PageTopbar";

const initialForm = {
  patientName: "",
  bloodGroup: "",
  unitsRequired: "1",
  hospitalName: "",
  city: "",
  contactNumber: "",
  urgencyLevel: "Standard",
  requiredDate: "",
};

function BloodRequest({ user, onBack, onOpenCamps, onOpenDonations, onOpenProfile, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/requests",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessage(response.data.message);
      setForm(initialForm);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit blood request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="blood-request-page">
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
            className="dashboard-nav-item dashboard-nav-item-active"
            type="button"
          >
            <HeartIcon /> I want blood
          </button>
          <button className="dashboard-nav-item" onClick={onOpenDonations} type="button">
            <HistoryIcon /> My donations
          </button>
          <button
            className="dashboard-nav-item"
            onClick={onOpenProfile}
            type="button"
          >
            <ProfileIcon /> My profile
          </button>
        </nav>
        <button className="dashboard-logout" onClick={onLogout} type="button">
          <LogoutIcon /> Log out
        </button>
      </aside>
      <section className="blood-request-content">
        <PageTopbar onOpenProfile={onOpenProfile} user={user} />
        <button
          className="back-button blood-request-back"
          onClick={onBack}
          type="button"
        >
          <ArrowBackIcon /> Back to overview
        </button>
        <header className="blood-request-header">
          <p className="dashboard-eyebrow">Need blood?</p>
          <h1>Request blood donors</h1>
          <p>
            Share the details below so compatible donors can respond to your
            request.
          </p>
        </header>
        <div className="blood-request-workspace">
          <form className="blood-request-form" onSubmit={handleSubmit}>
            <div className="blood-request-fields">
              <label>
                Patient name
                <input
                  name="patientName"
                  onChange={handleChange}
                  required
                  value={form.patientName}
                />
              </label>
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
                Units required
                <input
                  min="0.5"
                  name="unitsRequired"
                  onChange={handleChange}
                  required
                  step="0.5"
                  type="number"
                  value={form.unitsRequired}
                />
              </label>
              <label>
                Required date
                <input
                  min={new Date().toISOString().slice(0, 10)}
                  name="requiredDate"
                  onChange={handleChange}
                  required
                  type="date"
                  value={form.requiredDate}
                />
              </label>
              <label>
                Hospital name
                <input
                  name="hospitalName"
                  onChange={handleChange}
                  required
                  value={form.hospitalName}
                />
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
              <label>
                Contact number
                <input
                  name="contactNumber"
                  onChange={handleChange}
                  required
                  value={form.contactNumber}
                />
              </label>
              <label>
                Urgency
                <select
                  name="urgencyLevel"
                  onChange={handleChange}
                  value={form.urgencyLevel}
                >
                  <option>Standard</option>
                  <option>Urgent</option>
                  <option>Critical</option>
                </select>
              </label>
            </div>
            {error && (
              <p className="blood-request-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="blood-request-success" role="status">
                {message}
              </p>
            )}
            <button
              className="blood-request-submit"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Submitting..." : "Submit blood request"}
            </button>
          </form>
          <aside
            aria-label="Blood donation illustration"
            className="blood-request-visual"
          >
            <div className="blood-pulse blood-pulse-one" />
            <div className="blood-pulse blood-pulse-two" />
            <div className="blood-drop">
              <span className="blood-drop-shine" />
            </div>
            <span className="blood-drip blood-drip-one" />
            <span className="blood-drip blood-drip-two" />
            <p className="blood-visual-title">Every request matters</p>
            <p className="blood-visual-copy">
              Your request helps nearby donors find someone who needs them.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Icon({ children, className = "dashboard-icon" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
    </svg>
  );
}
function DashboardIcon() {
  return (
    <Icon>
      <rect height="7" rx="1" width="7" x="3" y="3" />
      <rect height="7" rx="1" width="7" x="14" y="3" />
      <rect height="7" rx="1" width="7" x="3" y="14" />
      <rect height="7" rx="1" width="7" x="14" y="14" />
    </Icon>
  );
}
function CalendarIcon() {
  return (
    <Icon>
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  );
}
function HistoryIcon() {
  return (
    <Icon>
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Icon>
  );
}
function ProfileIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" />
    </Icon>
  );
}
function LogoutIcon() {
  return (
    <Icon>
      <path
        d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </Icon>
  );
}
function ArrowBackIcon() {
  return (
    <Icon>
      <path
        d="M19 12H5m7 7-7-7 7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Icon>
  );
}

export default BloodRequest;
