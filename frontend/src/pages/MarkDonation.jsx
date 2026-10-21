import { useState } from "react";
import axios from "axios";
import "./MarkDonation.css";
import "../pages/DonorDashboard.css";
import PageTopbar from "../components/PageTopbar";

function MarkDonation({
  user,
  onBack,
  onOpenCamps,
  onOpenBloodRequest,
  onOpenDonations,
  onOpenProfile,
  onLogout,
  onDonationRecorded,
}) {
  const [form, setForm] = useState({
    donatedDate: new Date().toISOString().slice(0, 10),
    unitsDonated: "1",
    hospitalName: "",
    requestId: "",
    status: "completed",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      await axios.post("http://localhost:5000/api/auth/donations", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      localStorage.setItem(`lastDonation:${user.id}`, form.donatedDate);
      onDonationRecorded(form.donatedDate);
      setShowSuccess(true);
      window.setTimeout(onBack, 2400);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        onLogout();
        return;
      }
      setError(requestError.response?.data?.message || "Unable to record your donation.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mark-donation-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon"><HeartIcon /></div>
          <span>BloodCare</span>
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item" onClick={onBack} type="button"><DashboardIcon /> Overview</button>
          <button className="dashboard-nav-item" onClick={onOpenCamps} type="button"><CalendarIcon /> Donation camps</button>
          <button className="dashboard-nav-item" onClick={onOpenBloodRequest} type="button"><HeartIcon /> I want blood</button>
          <button className="dashboard-nav-item" onClick={onOpenDonations} type="button"><HistoryIcon /> My donations</button>
          <button className="dashboard-nav-item dashboard-nav-item-active" type="button"><CheckIcon /> Mark as donated</button>
          <button className="dashboard-nav-item" onClick={onOpenProfile} type="button"><ProfileIcon /> My profile</button>
        </nav>
        <button className="dashboard-logout" onClick={onLogout} type="button"><LogoutIcon /> Log out</button>
      </aside>

      <section className="mark-donation-content">
        <PageTopbar onOpenProfile={onOpenProfile} user={user} />
        <button className="mark-donation-back" onClick={onBack} type="button">← Back to overview</button>
        <header className="mark-donation-header">
          <p className="dashboard-eyebrow">Donation history</p>
          <h1>Mark as donated</h1>
          <p>Tell us about your latest donation so we can keep your eligibility and impact up to date.</p>
        </header>

        <form className="mark-donation-form" onSubmit={handleSubmit}>
          <div className="mark-donation-form-grid">
            <label>
              Donation date
              <input max={new Date().toISOString().slice(0, 10)} name="donatedDate" onChange={handleChange} required type="date" value={form.donatedDate} />
            </label>
            <label>
              Units donated
              <select name="unitsDonated" onChange={handleChange} value={form.unitsDonated}>
                <option value="0.5">0.5 units</option>
                <option value="1">1 unit</option>
                <option value="1.5">1.5 units</option>
                <option value="2">2 units</option>
              </select>
            </label>
            <label className="mark-donation-wide">
              Hospital or blood bank
              <input name="hospitalName" onChange={handleChange} placeholder="Enter hospital or blood bank name" required value={form.hospitalName} />
            </label>
            <label>
              Request ID <span>(optional)</span>
              <input name="requestId" onChange={handleChange} placeholder="Optional" value={form.requestId} />
            </label>
            <label>
              Status
              <select name="status" onChange={handleChange} value={form.status}>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>
            </label>
          </div>
          {error && <p className="mark-donation-error" role="alert">{error}</p>}
          <div className="mark-donation-actions">
            <button className="mark-donation-cancel" onClick={onBack} type="button">Cancel</button>
            <button className="mark-donation-submit" disabled={isSaving} type="submit">{isSaving ? "Submitting..." : "Submit donation"}</button>
          </div>
        </form>
      </section>

      {showSuccess && (
        <div className="mark-donation-success-overlay">
          <section aria-live="polite" className="mark-donation-success" role="dialog">
            <div className="mark-donation-success-icon">✓</div>
            <p className="dashboard-eyebrow">Donation recorded</p>
            <h2>Thank you for saving lives!</h2>
            <p>Your donation has been submitted successfully.</p>
          </section>
        </div>
      )}
    </main>
  );
}

function HeartIcon() { return <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" /></svg>; }
function DashboardIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" /></svg>; }
function CalendarIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" /></svg>; }
function HistoryIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function ProfileIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="2" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" /></svg>; }
function LogoutIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>; }
function CheckIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>; }

export default MarkDonation;
