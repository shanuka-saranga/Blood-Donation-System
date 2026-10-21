import { useEffect, useState } from "react";
import axios from "axios";
import "./DonorDashboard.css";
import PageTopbar from "../components/PageTopbar";
import MatchingRequestsList from "../components/MatchingRequestsList";

function DonorDashboard({ user, onLogout, onOpenCamps, onOpenBloodRequest, onOpenDonations, onOpenProfile }) {
  const firstName = user.name?.split(" ")[0] || "Donor";
  const [eligibility, setEligibility] = useState(user.donorDetails ? {
    isEligible: Boolean(user.donorDetails.isEligible),
    lastDonatedDate: user.donorDetails.lastDonatedDate || "",
  } : null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationError, setDonationError] = useState("");
  const [donationSuccess, setDonationSuccess] = useState(false);

  const handleCheckEligibility = async () => {
    setIsCheckingEligibility(true);
    setEligibilityError("");
    try {
      const response = await axios.get("http://localhost:5000/api/auth/eligibility", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEligibility(response.data);
    } catch (error) {
      setEligibilityError(error.response?.data?.message || "Unable to check eligibility.");
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const handleMarkDonation = async (donation) => {
    setIsSubmittingDonation(true);
    setDonationError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/donations", donation, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEligibility({
        isEligible: response.data.isEligible,
        lastDonatedDate: response.data.donation?.donatedDate || donation.donatedDate,
        message: response.data.message,
      });
      setDonationSuccess(true);
      setTimeout(() => {
        setDonationSuccess(false);
        setShowDonationForm(false);
      }, 1800);
    } catch (error) {
      setDonationError(error.response?.data?.message || "Unable to record donation.");
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      handleCheckEligibility();
    }, 0);

    return () => window.clearTimeout(refreshTimer);
  }, []);

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon"><HeartIcon /></div>
          <span>BloodCare</span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item dashboard-nav-item-active" type="button">
            <DashboardIcon /> Overview
          </button>
          <button className="dashboard-nav-item" onClick={onOpenCamps} type="button">
            <CalendarIcon /> Donation camps
          </button>
          <button className="dashboard-nav-item" onClick={onOpenBloodRequest} type="button">
            <HeartIcon /> I want blood
          </button>
          <button className="dashboard-nav-item" onClick={onOpenDonations} type="button">
            <HistoryIcon /> My donations
          </button>
          <button className="dashboard-nav-item" onClick={onOpenProfile} type="button">
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
            <h1>Good morning, {firstName}!</h1>
            <p className="dashboard-subtitle">Your generosity can save up to three lives.</p>
          </div>
        </header>

        <section className="dashboard-hero-card">
          <div>
            <span className="hero-card-label">Your next opportunity</span>
            <h2>Be someone's reason to live.</h2>
            <p>Find a nearby blood donation camp and make your next life-saving donation.</p>
            <div className="hero-card-actions">
              <button className="primary-dashboard-button" onClick={onOpenCamps} type="button">
              Find a donation camp <ArrowIcon />
              </button>
              <button className="secondary-dashboard-button" onClick={onOpenBloodRequest} type="button">
                I want blood <HeartIcon />
              </button>
            </div>
          </div>
          <div className="hero-card-heart"><HeartIcon /></div>
        </section>

        <section className="dashboard-stats" aria-label="Donation statistics">
          <StatCard icon={<HeartIcon />} value="3" label="Total donations" tone="red" />
          <StatCard
            icon={<CalendarIcon />}
            value={formatDonationDate(eligibility?.lastDonatedDate)}
            label="Last donation"
            tone="blue"
          />
          <StatCard
            icon={eligibility?.isEligible ? <CheckIcon /> : <ClockIcon />}
            value={eligibility ? (eligibility.isEligible ? "Eligible" : "Not eligible") : "Checking..."}
            label="Donation status"
            tone={eligibility?.isEligible ? "green" : "orange"}
          />
        </section>

        <div className="dashboard-grid">
          <section className="dashboard-panel eligibility-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Stay ready</p>
                <h2>Donation eligibility</h2>
              </div>
              <span className={`status-pill ${eligibility && !eligibility.isEligible ? "status-pill-not-eligible" : ""}`}>
                {eligibility ? (eligibility.isEligible ? "Eligible now" : "Not eligible yet") : "Not checked"}
              </span>
            </div>
            <div className="eligibility-row">
              <div className={`eligibility-icon ${eligibility && !eligibility.isEligible ? "eligibility-icon-not-eligible" : ""}`}>
                {eligibility && !eligibility.isEligible ? <ClockIcon /> : <CheckIcon />}
              </div>
              <div>
                <strong>
                  {eligibility
                    ? (eligibility.isEligible ? "You can donate blood" : "Please wait before donating")
                    : "Check your donation eligibility"}
                </strong>
                <p>
                  {eligibility
                    ? (eligibility.isEligible
                      ? (eligibility.lastDonatedDate
                        ? `Last donated on ${formatDonationDate(eligibility.lastDonatedDate)}. You can donate again.`
                        : "No previous donation is recorded. You can donate blood.")
                      : `Last donated on ${formatDonationDate(eligibility.lastDonatedDate)}. At least 3 months should pass between donations.`)
                    : "Review your latest donation date from our records."}
                </p>
              </div>
            </div>
            <div className="progress-track"><span /></div>
            <p className={`progress-caption ${eligibility && !eligibility.isEligible ? "progress-caption-not-eligible" : ""}`}>
              {eligibilityError || (eligibility
                ? (eligibility.isEligible ? "Ready to help someone in need" : "Your eligibility will update after the waiting period")
                : "Click below to check now")}
            </p>
            <button className="eligibility-button" disabled={isCheckingEligibility} onClick={handleCheckEligibility} type="button">
              {isCheckingEligibility ? <><span className="eligibility-spinner" /> Checking...</> : "Check eligibility"}
            </button>
            <button className="donation-button" onClick={() => { setDonationError(""); setShowDonationForm(true); }} type="button">
              Mark as donation
            </button>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-eyebrow">Coming soon</p>
                <h2>Upcoming camps</h2>
              </div>
              <button className="text-button" type="button">View all</button>
            </div>
            <div className="camp-item">
              <div className="camp-date"><strong>24</strong><span>JUN</span></div>
              <div><strong>University of Ruhuna</strong><p>8:30 AM · Faculty of Technology</p></div>
              <ArrowIcon />
            </div>
            <div className="camp-item">
              <div className="camp-date"><strong>02</strong><span>JUL</span></div>
              <div><strong>Matara General Hospital</strong><p>9:00 AM · Blood bank unit</p></div>
              <ArrowIcon />
            </div>
          </section>
        </div>

        <MatchingRequestsList />

        <section className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Your journey</p>
              <h2>Recent activity</h2>
            </div>
          </div>
          <div className="activity-list">
            <Activity icon={<CheckIcon />} title="Donation completed" description="Your blood donation was recorded successfully." date="12 Jun 2025" />
            <Activity icon={<CalendarIcon />} title="Camp reminder" description="You registered interest in the University of Ruhuna camp." date="05 Jun 2025" />
          </div>
        </section>
      </section>
      {showDonationForm && (
        <DonationForm
          error={donationError}
          isSaving={isSubmittingDonation}
          onClose={() => setShowDonationForm(false)}
          onSubmit={handleMarkDonation}
          success={donationSuccess}
        />
      )}
    </main>
  );
}

function DonationForm({ error, isSaving, onClose, onSubmit, success }) {
  const [form, setForm] = useState({
    donatedDate: new Date().toISOString().slice(0, 10),
    unitsDonated: "1",
    hospitalName: "",
    requestId: "",
    status: "completed",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  if (success) {
    return (
      <div className="donation-modal-overlay">
        <section aria-live="polite" className="donation-modal donation-success-modal">
          <div className="donation-success-icon">✓</div>
          <p className="dashboard-eyebrow">Donation recorded</p>
          <h2>Thank you for saving lives!</h2>
          <p>Your donation has been submitted successfully.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="donation-modal-overlay">
      <form className="donation-modal" onSubmit={handleSubmit}>
        <button aria-label="Close donation form" className="donation-modal-close" onClick={onClose} type="button">×</button>
        <p className="dashboard-eyebrow">Donation history</p>
        <h2>Mark a donation</h2>
        <p className="donation-modal-description">Add the details of your latest blood donation.</p>
        <div className="donation-form-fields">
          <label>Donation date<input max={new Date().toISOString().slice(0, 10)} name="donatedDate" onChange={handleChange} required type="date" value={form.donatedDate} /></label>
          <label>Units donated<select name="unitsDonated" onChange={handleChange} value={form.unitsDonated}><option value="0.5">0.5 units</option><option value="1">1 unit</option><option value="1.5">1.5 units</option><option value="2">2 units</option></select></label>
          <label className="donation-form-wide">Hospital or blood bank<input name="hospitalName" onChange={handleChange} placeholder="Enter hospital name" required value={form.hospitalName} /></label>
          <label>Request ID (optional)<input name="requestId" onChange={handleChange} placeholder="Optional" value={form.requestId} /></label>
          <label>Status<select name="status" onChange={handleChange} value={form.status}><option value="completed">Completed</option><option value="verified">Verified</option></select></label>
        </div>
        {error && <p className="donation-form-error" role="alert">{error}</p>}
        <div className="donation-modal-actions">
          <button className="donation-cancel-button" onClick={onClose} type="button">Cancel</button>
          <button className="donation-submit-button" disabled={isSaving} type="submit">{isSaving ? "Submitting..." : "Submit donation"}</button>
        </div>
      </form>
    </div>
  );
}

function StatCard({ icon, value, label, tone }) {
  return <div className="stat-card"><div className={`stat-icon stat-icon-${tone}`}>{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function formatDonationDate(dateValue) {
  if (!dateValue) {
    return "No record";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "No record";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function Activity({ icon, title, description, date }) {
  return <div className="activity-item"><div className="activity-icon">{icon}</div><div><strong>{title}</strong><p>{description}</p></div><time>{date}</time></div>;
}

function HeartIcon() {
  return <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" /></svg>;
}

function ArrowIcon() {
  return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function DashboardIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" /></svg>;
}

function CalendarIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function HistoryIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function ProfileIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="2" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" /></svg>;
}

function LogoutIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

function CheckIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>;
}

function ClockIcon() {
  return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>;
}

export default DonorDashboard;
