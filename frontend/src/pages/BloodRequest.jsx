import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./BloodRequest.css";
import PageTopbar from "../components/PageTopbar";

const API_BASE_URL = "/api/requests";

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

const URGENCY_OPTIONS = ["Standard", "Urgent", "Critical"];

function BloodRequest({
  user,
  onBack,
  onOpenCamps,
  onOpenDonations,
  onOpenProfile,
  onOpenMarkDonation,
  onLogout,
}) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState("");
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [deletingRequestId, setDeletingRequestId] = useState(null);
  const [requestsVersion, setRequestsVersion] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/mine`, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const loadedRequests = response.data.requests || response.data;
        setRequests(Array.isArray(loadedRequests) ? loadedRequests : []);
        setRequestsError("");
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          onLogout();
          return;
        }

        setRequestsError(
          requestError.response?.data?.message ||
            "Unable to load your blood requests.",
        );
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadRequests();
  }, [onLogout, requestsVersion]);

  const refreshRequests = () => {
    setRequestsVersion((current) => current + 1);
  };

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
      const response = editingRequestId
        ? await axios.put(`${API_BASE_URL}/${editingRequestId}`, form, {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          })
        : await axios.post(API_BASE_URL, form, {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          });

      setMessage(
        response.data.message ||
          (editingRequestId
            ? "Blood request updated successfully."
            : "Blood request submitted successfully."),
      );
      setForm(initialForm);
      setEditingRequestId(null);
      refreshRequests();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to submit blood request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = (request) => {
    setMessage("");
    setError("");
    setEditingRequestId(request.id);
    setForm({
      patientName: request.patient_name || "",
      bloodGroup: request.blood_group || "",
      unitsRequired: String(request.units_required ?? ""),
      hospitalName: request.hospital_name || "",
      city: request.city || "",
      contactNumber: request.contact_number || "",
      urgencyLevel: normalizeUrgency(request.urgency || request.urgency_level),
      requiredDate: toDateInputValue(request.required_date),
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancelEdit = () => {
    setEditingRequestId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  };

  const handleDeleteRequest = async (request) => {
    const isConfirmed = window.confirm(
      "Delete this blood request? This action cannot be undone.",
    );
    if (!isConfirmed) return;

    setDeletingRequestId(request.id);
    setRequestsError("");
    try {
      await axios.delete(`${API_BASE_URL}/${request.id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      if (editingRequestId === request.id) handleCancelEdit();
      setMessage("Blood request deleted successfully.");
      refreshRequests();
    } catch (requestError) {
      setRequestsError(
        requestError.response?.data?.message ||
          "Unable to delete blood request.",
      );
    } finally {
      setDeletingRequestId(null);
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
          <button
            className="dashboard-nav-item"
            onClick={onOpenDonations}
            type="button"
          >
            <HistoryIcon /> My donations
          </button>
          <button
            className="dashboard-nav-item"
            onClick={onOpenMarkDonation}
            type="button"
          >
            <CheckIcon /> Mark as donated
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
          <form
            className="blood-request-form"
            onSubmit={handleSubmit}
            ref={formRef}
          >
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
                  min={
                    editingRequestId
                      ? undefined
                      : new Date().toISOString().slice(0, 10)
                  }
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
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
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
            <div className="blood-request-form-actions">
              <button
                className="blood-request-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingRequestId
                    ? "Update blood request"
                    : "Submit blood request"}
              </button>
              {editingRequestId && (
                <button
                  className="blood-request-cancel"
                  disabled={isSubmitting}
                  onClick={handleCancelEdit}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>
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

        <section
          className="blood-request-list-panel"
          aria-label="My blood requests"
        >
          <div className="blood-request-list-heading">
            <div>
              <p className="dashboard-eyebrow">Your activity</p>
              <h2>My blood requests</h2>
            </div>
            <span className="blood-request-list-count">{requests.length}</span>
          </div>

          {requestsError && (
            <p className="blood-request-error" role="alert">
              {requestsError}
            </p>
          )}

          {isLoadingRequests && (
            <p className="blood-request-list-message">
              Loading your blood requests...
            </p>
          )}

          {!isLoadingRequests && !requestsError && requests.length === 0 && (
            <p className="blood-request-list-message">
              You have not raised any blood requests yet. Submit the form above
              to request donors.
            </p>
          )}

          {!isLoadingRequests && requests.length > 0 && (
            <div className="blood-request-list">
              {requests.map((request) => {
                const isPending = isPendingStatus(request.status);
                const isEditing = editingRequestId === request.id;
                const isDeleting = deletingRequestId === request.id;
                const urgency = normalizeUrgency(
                  request.urgency || request.urgency_level,
                );

                return (
                  <article
                    className={`blood-request-card ${isEditing ? "blood-request-card-editing" : ""}`}
                    key={request.id}
                  >
                    <div className="blood-request-card-header">
                      <span
                        className={`blood-request-urgency blood-request-urgency-${urgency.toLowerCase()}`}
                      >
                        {urgency}
                      </span>
                      <span className="blood-request-blood-group">
                        {request.blood_group || "Blood needed"}
                      </span>
                      <span
                        className={`blood-request-status blood-request-status-${(request.status || "pending").toLowerCase()}`}
                      >
                        {request.status || "Pending"}
                      </span>
                    </div>

                    <h3>{request.hospital_name || "Hospital not provided"}</h3>
                    <p className="blood-request-card-meta">
                      <strong>{formatUnits(request.units_required)}</strong>{" "}
                      units required · {request.city || "City not provided"} ·
                      Required on {formatDate(request.required_date)}
                    </p>
                    <p className="blood-request-card-contact">
                      For {request.patient_name || "patient"} ·{" "}
                      {request.contact_number || "No contact"}
                    </p>

                    <div className="blood-request-card-actions">
                      {isPending ? (
                        <>
                          <button
                            className="blood-request-edit"
                            disabled={isDeleting}
                            onClick={() => handleEditRequest(request)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="blood-request-delete"
                            disabled={isDeleting}
                            onClick={() => handleDeleteRequest(request)}
                            type="button"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      ) : (
                        <span className="blood-request-locked">
                          Only pending requests can be edited or deleted.
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function isPendingStatus(status) {
  return (
    String(status || "")
      .trim()
      .toLowerCase() === "pending"
  );
}

function normalizeUrgency(value) {
  const urgency = String(value || "").trim();
  if (!urgency) return "Standard";

  const matchedOption = URGENCY_OPTIONS.find(
    (option) => option.toLowerCase() === urgency.toLowerCase(),
  );
  return (
    matchedOption ||
    urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase()
  );
}

function toDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatUnits(value) {
  const units = Number(value);
  return Number.isFinite(units) ? units.toFixed(2).replace(/\.00$/, "") : "0";
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

function CheckIcon() {
  return (
    <Icon>
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
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
