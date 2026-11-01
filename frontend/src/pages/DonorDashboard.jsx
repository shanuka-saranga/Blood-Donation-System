import { useEffect, useState } from "react";
import axios from "axios";
import "./DonorDashboard.css";
import PageTopbar from "../components/PageTopbar";
import MatchingRequestsList from "../components/MatchingRequestsList";

function DonorDashboard({
  user,
  onLogout,
  onOpenCamps,
  onOpenAppointments,
  onOpenBloodRequest,
  onOpenDonations,
  onOpenProfile,
  onBookAppointment,
}) {
  const firstName = user.name?.split(" ")[0] || "Donor";
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay);
  const eligibilityStorageKey = `eligibility:${user.id}`;
  const [lastDonatedDate, setLastDonatedDate] = useState("");
  const [totalDonations, setTotalDonations] = useState(0);
  const [eligibility, setEligibility] = useState(() => {
    try {
      const savedEligibility = localStorage.getItem(eligibilityStorageKey);
      return savedEligibility ? JSON.parse(savedEligibility) : null;
    } catch {
      localStorage.removeItem(eligibilityStorageKey);
      return null;
    }
  });
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [upcomingCamps, setUpcomingCamps] = useState([]);
  const [campsError, setCampsError] = useState("");
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    if (!eligibility?.nextEligibleDate) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [eligibility?.isEligible, eligibility?.nextEligibleDate]);

  const loadActivities = async () => {
    try {
      const response = await axios.get("/api/auth/activity", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      const loadedActivities = Array.isArray(response.data.activities)
        ? response.data.activities
        : [];
      setActivities(loadedActivities);
      setActivityError("");
    } catch (error) {
      setActivityError(
        error.response?.data?.message || "Unable to load recent activity.",
      );
    }
  };

  useEffect(() => {
    const refreshTimeOfDay = () => setTimeOfDay(getTimeOfDay());
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        refreshTimeOfDay();
      }
    };
    const intervalId = window.setInterval(refreshTimeOfDay, 60 * 1000);

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshTimeOfDay);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshTimeOfDay);
    };
  }, []);

  useEffect(() => {
    const refreshActivitiesWhenVisible = () => {
      if (document.visibilityState === "visible") loadActivities();
    };
    const activityLoadId = window.setTimeout(loadActivities, 0);
    document.addEventListener("visibilitychange", refreshActivitiesWhenVisible);
    window.addEventListener("focus", loadActivities);
    const activityRefreshId = window.setInterval(loadActivities, 15000);
    return () => {
      document.removeEventListener(
        "visibilitychange",
        refreshActivitiesWhenVisible,
      );
      window.removeEventListener("focus", loadActivities);
      window.clearInterval(activityRefreshId);
      window.clearTimeout(activityLoadId);
    };
  }, []);

  useEffect(() => {
    const loadUpcomingCamps = async () => {
      try {
        const response = await axios.get("/api/auth/camps", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        setUpcomingCamps(
          Array.isArray(response.data.camps)
            ? response.data.camps.slice(0, 2)
            : [],
        );
      } catch (error) {
        setCampsError(
          error.response?.data?.message || "Unable to load upcoming camps.",
        );
      }
    };

    loadUpcomingCamps();
  }, []);

  const updateEligibility = (nextEligibility) => {
    setEligibility(nextEligibility);
    if (nextEligibility.lastDonatedDate) {
      setLastDonatedDate(nextEligibility.lastDonatedDate);
    }
    localStorage.setItem(
      eligibilityStorageKey,
      JSON.stringify(nextEligibility),
    );
  };

  useEffect(() => {
    const loadDonationSummary = async () => {
      try {
        const headers = {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        };
        const [donationsResult, latestDonationResult, eligibilityResult] =
          await Promise.allSettled([
          axios.get("/api/auth/donations", headers),
          axios.get("/api/auth/donations/latest", headers),
          axios.get("/api/auth/eligibility", headers),
          ]);

        if (donationsResult.status === "rejected") {
          throw donationsResult.reason;
        }

        const donations = Array.isArray(donationsResult.value.data.donations)
          ? donationsResult.value.data.donations
          : [];
        const latestDate =
          latestDonationResult.status === "fulfilled"
            ? latestDonationResult.value.data.lastDonatedDate || ""
            : "";
        const displayedDate = latestDate;

        setTotalDonations(donations.length);
        setLastDonatedDate(displayedDate);
        if (eligibilityResult.status === "fulfilled") {
          updateEligibility({
            isEligible: eligibilityResult.value.data.isEligible,
            lastDonatedDate:
              displayedDate ||
              eligibilityResult.value.data.lastDonatedDate ||
              latestDate,
            nextEligibleDate: eligibilityResult.value.data.nextEligibleDate || "",
            assessmentEligibility:
              latestDonationResult.status === "fulfilled"
                ? latestDonationResult.value.data.assessmentEligibility || ""
                : "",
            message: eligibilityResult.value.data.message,
          });
        } else if (eligibilityResult.reason.response?.status === 401) {
          setEligibilityError(
            "Your session has expired. Please sign in again.",
          );
        } else if (eligibilityResult.reason.response?.status === 404) {
          setEligibilityError(eligibilityResult.reason.response.data.message);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setEligibilityError(
            "Your session has expired. Please sign in again.",
          );
        }
      }
    };

    loadDonationSummary();
    const refreshSummary = () => {
      if (document.visibilityState === "visible") loadDonationSummary();
    };
    const summaryRefreshId = window.setInterval(loadDonationSummary, 15000);
    window.addEventListener("focus", refreshSummary);
    document.addEventListener("visibilitychange", refreshSummary);
    return () => {
      window.clearInterval(summaryRefreshId);
      window.removeEventListener("focus", refreshSummary);
      document.removeEventListener("visibilitychange", refreshSummary);
    };
  }, []);

  const handleCheckEligibility = async () => {
    setIsCheckingEligibility(true);
    setEligibilityError("");
    try {
      const response = await axios.get("/api/auth/eligibility", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      updateEligibility(response.data);
    } catch (error) {
      setEligibilityError(
        error.response?.data?.message || "Unable to check eligibility.",
      );
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon">
            <HeartIcon />
          </div>
          <span>BloodCare</span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button
            className="dashboard-nav-item dashboard-nav-item-active"
            type="button"
          >
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
            onClick={onOpenAppointments}
            type="button"
          >
            <CalendarIcon /> My bookings
          </button>
          <button
            className="dashboard-nav-item"
            onClick={onOpenBloodRequest}
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

      <section className="dashboard-content">
        <PageTopbar onOpenProfile={onOpenProfile} user={user} />
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Donor dashboard</p>
            <h1>
              Good {timeOfDay}, {firstName}!
            </h1>
            <p className="dashboard-subtitle">
              Your generosity can save up to three lives.
            </p>
          </div>
        </header>

        <section className="dashboard-hero-card">
          <div>
            <span className="hero-card-label">Your next opportunity</span>
            <h2>Be someone's reason to live.</h2>
            <p>
              Find a nearby blood donation camp and make your next life-saving
              donation.
            </p>
            {eligibility?.assessmentEligibility && (
              <p className="eligibility-assessment-status">
                Latest assessment:{" "}
                {eligibility.assessmentEligibility === "eligible"
                  ? "Passed / Eligible"
                  : eligibility.assessmentEligibility}
              </p>
            )}
            <div className="hero-card-actions">
              <button
                className="primary-dashboard-button"
                onClick={onOpenCamps}
                type="button"
              >
                Find a donation camp <ArrowIcon />
              </button>
              <button
                className="secondary-dashboard-button"
                onClick={onOpenBloodRequest}
                type="button"
              >
                I want blood <HeartIcon />
              </button>
            </div>
          </div>
          <div className="hero-card-heart">
            <HeartIcon className="hero-card-heart-icon" />
          </div>
        </section>

        <section className="dashboard-stats" aria-label="Donation statistics">
          <StatCard
            icon={<HeartIcon />}
            value={totalDonations}
            label="Total donations"
            tone="red"
          />
          <StatCard
            icon={<CalendarIcon />}
            value={formatDonationDate(lastDonatedDate)}
            label="Last donation"
            tone="blue"
          />
          <StatCard
            icon={eligibility?.isEligible ? <CheckIcon /> : <ClockIcon />}
            value={
              eligibility
                ? eligibility.isEligible
                  ? "Eligible"
                  : "Not eligible"
                : "Checking..."
            }
            label="Donation status"
            tone={eligibility?.isEligible ? "green" : "orange"}
          />
        </section>

        <div className="dashboard-grid">
          <section
            className={`dashboard-panel eligibility-panel ${
              eligibility
                ? eligibility.isEligible
                  ? "eligibility-panel-eligible"
                  : "eligibility-panel-not-eligible"
                : ""
            }`}
          >
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Stay ready</p>
                <h2>Donation eligibility</h2>
              </div>
              {eligibility && (
                <span
                  className={`status-pill ${!eligibility.isEligible ? "status-pill-not-eligible" : ""}`}
                >
                  {eligibility.isEligible ? "Eligible now" : "Not eligible yet"}
                </span>
              )}
            </div>
            {eligibility ? (
              <>
                <div className="eligibility-row">
                  <div
                    className={`eligibility-icon ${!eligibility.isEligible ? "eligibility-icon-not-eligible" : ""}`}
                  >
                    {!eligibility.isEligible ? <ClockIcon /> : <CheckIcon />}
                  </div>
                  <div>
                    <strong>
                      {eligibility.isEligible
                        ? "You can donate blood"
                        : "Please wait before donating"}
                    </strong>
                    <p>
                      {eligibility.isEligible
                        ? eligibility.lastDonatedDate
                          ? `Last donated on ${formatDonationDate(eligibility.lastDonatedDate)}. You can donate again.`
                          : "No previous donation is recorded. You can donate blood."
                        : `Last donated on ${formatDonationDate(eligibility.lastDonatedDate)}. At least 3 months should pass between donations.`}
                    </p>
                    {eligibility.nextEligibleDate && (
                      <>
                        <p className="eligibility-next-date">
                          Next eligible date: {formatDonationDate(eligibility.nextEligibleDate)}
                        </p>
                        <p className="eligibility-countdown" aria-live="polite">
                          <EligibilityCountdown
                            dateValue={eligibility.nextEligibleDate}
                            now={countdownNow}
                          />
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div
                  className={`progress-track ${!eligibility.isEligible ? "progress-track-not-eligible" : ""}`}
                >
                  <span />
                </div>
                <p
                  className={`progress-caption ${!eligibility.isEligible ? "progress-caption-not-eligible" : ""}`}
                >
                  {eligibilityError ||
                    (eligibility.isEligible
                      ? "Ready to help someone in need"
                      : "Your eligibility will update after the waiting period")}
                </p>
              </>
            ) : (
              <div className="eligibility-row eligibility-row-unchecked">
                <div className="eligibility-icon eligibility-icon-unchecked">
                  <ClockIcon />
                </div>
                <div>
                  <strong>
                    {isCheckingEligibility
                      ? "Checking your eligibility..."
                      : "Please check your eligibility"}
                  </strong>
                  <p>
                    {isCheckingEligibility
                      ? "Please wait while we check your latest donation from the database."
                      : "Check your eligibility before donating blood."}
                  </p>
                </div>
              </div>
            )}
            {!eligibility && !isCheckingEligibility && (
              <button
                className="eligibility-button"
                onClick={handleCheckEligibility}
                type="button"
              >
                Check eligibility
              </button>
            )}
            {isCheckingEligibility && (
              <p className="progress-caption">
                <span className="eligibility-spinner" /> Checking eligibility...
              </p>
            )}
            {eligibilityError && (
              <p
                className="progress-caption progress-caption-not-eligible"
                role="alert"
              >
                {eligibilityError}
              </p>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Coming soon</p>
                <h2>Upcoming camps</h2>
              </div>
              <button
                className="text-button"
                onClick={onOpenCamps}
                type="button"
              >
                View all
              </button>
            </div>
            {campsError && (
              <p className="camp-item-message" role="alert">
                {campsError}
              </p>
            )}
            {!campsError && upcomingCamps.length === 0 && (
              <p className="camp-item-message">
                No upcoming donation camps available.
              </p>
            )}
            {upcomingCamps.map((camp) => (
              <button
                className="camp-item"
                key={camp.id}
                onClick={() => setSelectedCamp(camp)}
                type="button"
              >
                <div className="camp-date">
                  <strong>{formatCampDay(camp.camp_date)}</strong>
                  <span>{formatCampMonth(camp.camp_date)}</span>
                </div>
                <div>
                  <strong>{camp.name}</strong>
                  <p>
                    {formatCampTime(camp.start_time)} · {camp.city}
                  </p>
                </div>
                <ArrowIcon />
              </button>
            ))}
          </section>
        </div>

        <MatchingRequestsList onActivityChanged={loadActivities} />

        <section className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Your journey</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          {activityError && (
            <p className="camp-item-message" role="alert">
              {activityError}
            </p>
          )}
          {!activityError && activities.length === 0 && (
            <p className="camp-item-message">No recent activity yet.</p>
          )}
          {activities.length > 0 && (
            <div className="activity-list">
              {activities.map((activity, index) => (
                <Activity
                  date={formatActivityDate(activity.date)}
                  description={activity.description}
                  icon={
                    activity.type === "request" ? <HeartIcon /> : <CheckIcon />
                  }
                  key={`${activity.type}-${activity.date}-${index}`}
                  title={activity.title}
                />
              ))}
            </div>
          )}
        </section>
      </section>
      {selectedCamp && (
        <CampDetailsModal
          camp={selectedCamp}
          onClose={() => setSelectedCamp(null)}
          onBookAppointment={onBookAppointment}
        />
      )}
    </main>
  );
}

function CampDetailsModal({ camp, onClose, onBookAppointment }) {
  return (
    <div className="donation-modal-overlay" onMouseDown={onClose}>
      <section
        aria-labelledby="camp-details-title"
        aria-modal="true"
        className="donation-modal camp-details-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close camp details"
          className="donation-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="dashboard-eyebrow">Upcoming donation camp</p>
        <h2 id="camp-details-title">{camp.name}</h2>
        <p className="donation-modal-description">
          {camp.description ||
            "Join this camp and help save lives in your community."}
        </p>
        <dl className="camp-details-list">
          <div>
            <dt>Organizer</dt>
            <dd>{camp.organizer || "Not available"}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{formatCampFullDate(camp.camp_date)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {formatCampTime(camp.start_time)} -{" "}
              {formatCampTime(camp.end_time)}
            </dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>
              {camp.location}, {camp.city}
            </dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{camp.contact_number || "Not available"}</dd>
          </div>
        </dl>
        <div className="donation-modal-actions">
          <button
            className="primary-dashboard-button"
            onClick={() => onBookAppointment(camp)}
            type="button"
          >
            Book your appointment
          </button>
          <button
            className="donation-cancel-button"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function StatCard({ icon, value, label, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function formatDonationDate(dateValue) {
  if (!dateValue) {
    return "No record";
  }

  const match = String(dateValue).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return "No record";
  }

  const [, year, month, day] = match;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

function EligibilityCountdown({ dateValue, now }) {
  const targetDate = parseDateOnly(dateValue);
  if (!targetDate) return "Eligibility countdown unavailable";

  const remainingSeconds = Math.max(
    0,
    Math.ceil((targetDate.getTime() - now) / 1000),
  );
  if (remainingSeconds === 0) return "Eligible now";

  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return (
    <span className="countdown-calendar">
      <span className="countdown-calendar-title">Available in</span>
      <span className="countdown-calendar-units">
        <CountdownUnit value={days} label="Days" />
        <CountdownUnit value={hours} label="Hours" />
        <CountdownUnit value={minutes} label="Min" />
        <CountdownUnit value={seconds} label="Sec" />
      </span>
    </span>
  );
}

function CountdownUnit({ value, label }) {
  return (
    <span className={`countdown-calendar-unit ${label === "Sec" ? "countdown-calendar-seconds" : ""}`}>
      <span className="countdown-calendar-number">{String(value).padStart(2, "0")}</span>
      <span className="countdown-calendar-label">{label}</span>
    </span>
  );
}

function parseDateOnly(dateValue) {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatActivityDate(dateValue) {
  if (!dateValue) return "Date unavailable";
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatCampDay(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
}

function formatCampMonth(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "---"
    : new Intl.DateTimeFormat("en", { month: "short" })
        .format(date)
        .toUpperCase();
}

function formatCampFullDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
}

function formatCampTime(value) {
  if (!value) return "Time unavailable";
  const [hours, minutes] = String(value).split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes))
    return "Time unavailable";
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function Activity({ icon, title, description, date }) {
  return (
    <div className="activity-item">
      <div className="activity-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <time>{date}</time>
    </div>
  );
}

function HeartIcon({ className = "" }) {
  return (
    <svg className={`dashboard-icon ${className}`.trim()} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="dashboard-icon small-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" />
      <rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="2" width="18" x="3" y="5" />
      <path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="4" strokeWidth="2" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="dashboard-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default DonorDashboard;
