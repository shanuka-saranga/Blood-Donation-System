import { useEffect, useState } from "react";
import axios from "axios";
import "./DonationHistory.css";
import PageTopbar from "../components/PageTopbar";

function DonationHistory({
  user,
  onBack,
  onOpenCamps,
  onOpenBloodRequest,
  onOpenProfile,
  onOpenMarkDonation,
  onLogout,
}) {
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          onLogout();
          return;
        }

        const response = await axios.get("/api/auth/donations", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        const records = Array.isArray(response.data.donations)
          ? response.data.donations
          : [];
        setDonations(records);
        setSelectedDonation(records[0] || null);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          onLogout();
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "Unable to load your donation history.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDonations();
  }, [onLogout]);

  return (
    <main className="donation-history-page">
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
          <button
            className="dashboard-nav-item dashboard-nav-item-active"
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

      <section className="donation-history-content">
        <PageTopbar onOpenProfile={onOpenProfile} user={user} />
        <button
          className="back-button donation-history-back"
          onClick={onBack}
          type="button"
        >
          <ArrowBackIcon /> Back to overview
        </button>
        <header className="donation-history-header">
          <p className="dashboard-eyebrow">Your impact</p>
          <h1>My donations</h1>
          <p>
            Review your previous blood donations and the lives you helped
            support.
          </p>
        </header>

        {isLoading && (
          <section className="donation-history-message">
            Loading your donation history...
          </section>
        )}
        {!isLoading && error && (
          <section
            className="donation-history-message donation-history-error"
            role="alert"
          >
            {error}
          </section>
        )}
        {!isLoading && !error && donations.length === 0 && (
          <section className="donation-history-empty">
            <div className="donation-history-empty-icon">
              <HeartIcon />
            </div>
            <h2>No donations recorded yet</h2>
            <p>
              Your completed donations will appear here after they are recorded.
            </p>
          </section>
        )}
        {!isLoading && !error && donations.length > 0 && (
          <div className="donation-history-layout">
            <section
              className="donation-records-panel"
              aria-label="Donation records"
            >
              <div className="donation-panel-heading">
                <div>
                  <p className="panel-eyebrow">Donation record</p>
                  <h2>Previous donations</h2>
                </div>
                <span className="donation-record-count">
                  {donations.length}
                </span>
              </div>
              <div className="donation-record-list">
                {donations.map((donation) => (
                  <button
                    className={`donation-record-item ${selectedDonation?.id === donation.id ? "donation-record-item-active" : ""}`}
                    key={donation.id}
                    onClick={() => setSelectedDonation(donation)}
                    type="button"
                  >
                    <span className="donation-record-icon">
                      <HeartIcon />
                    </span>
                    <span className="donation-record-summary">
                      <strong>{formatDate(donation.donated_date)}</strong>
                      <span>{donation.hospital_name}</span>
                      <small>
                        {formatUnits(donation.units_donated)} units donated
                      </small>
                    </span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            </section>

            {selectedDonation && (
              <DonationDetails donation={selectedDonation} />
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function DonationDetails({ donation }) {
  return (
    <section className="donation-details-card" aria-live="polite">
      <div className="donation-details-top">
        <div className="donation-details-icon">
          <HeartIcon />
        </div>
        <span className="donation-status">{donation.status}</span>
      </div>
      <p className="panel-eyebrow">Donation details</p>
      <h2>{donation.hospital_name}</h2>
      <p className="donation-details-copy">
        Thank you for giving someone another chance at life.
      </p>
      <dl className="donation-details-list">
        <DetailRow
          label="Donation date"
          value={formatDate(donation.donated_date)}
        />
        <DetailRow
          label="Units donated"
          value={`${formatUnits(donation.units_donated)} units`}
        />
        <DetailRow label="Record ID" value={`#${donation.id}`} />
        <DetailRow
          label="Request ID"
          value={
            donation.request_id ? `#${donation.request_id}` : "Direct donation"
          }
        />
        <DetailRow
          label="Recorded on"
          value={formatDateTime(donation.created_at)}
        />
      </dl>
    </section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
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

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatUnits(value) {
  const units = Number(value);
  return Number.isFinite(units) ? units.toFixed(2).replace(/\.00$/, "") : "0";
}

function Icon({ children }) {
  return (
    <svg
      className="dashboard-icon"
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
      <rect height="16" rx="2" width="16" x="4" y="5" />
      <path d="M8 3v4m8-4v4M4 10h16" />
    </Icon>
  );
}

function HistoryIcon() {
  return (
    <Icon>
      <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-1v5l3 2" />
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
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5m5-12 4 4-4 4m4-4H9" />
    </Icon>
  );
}

function ArrowIcon() {
  return (
    <Icon>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </Icon>
  );
}

function ArrowBackIcon() {
  return (
    <Icon>
      <path d="m15 18-6-6 6-6M9 12h10" />
    </Icon>
  );
}

export default DonationHistory;
