import { useEffect, useState } from "react";
import axios from "axios";
import "./DonorDashboard.css";
import "./CampOrganizerDashboard.css";
import PageTopbar from "../components/PageTopbar";

const emptyCamp = {
  title: "", organizer: "", location: "", city: "", campDate: "",
  startTime: "08:00", endTime: "16:00", contactNumber: "", description: "",
  slotDurationMinutes: 60, slotCapacity: 10,
};

function CampOrganizerDashboard({ user, onLogout }) {
  const [data, setData] = useState({ camps: [], appointments: [], volunteers: [], metrics: {} });
  const [camp, setCamp] = useState(emptyCamp);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const request = (method, url, data) => axios({
    method, url, data,
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });

  const loadData = async () => {
    try {
      const response = await request("get", "/api/auth/camp-organizer/summary");
      setData(response.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load organizer dashboard.");
    }
  };

  useEffect(() => {
    loadData();
    const intervalId = window.setInterval(loadData, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const updateCampField = (event) => {
    setCamp((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const createCamp = async (event) => {
    event.preventDefault();
    try {
      await request("post", "/api/auth/camp-organizer/camps", camp);
      setCamp(emptyCamp);
      setShowForm(false);
      setMessage("Donation camp created successfully.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create donation camp.");
    }
  };

  const updateAppointment = async (appointment, status) => {
    const volunteerName = window.prompt("Assign a volunteer (leave blank to clear):", appointment.volunteer_name || "");
    if (volunteerName === null) return;
    try {
      await request("patch", `/api/auth/camp-organizer/appointments/${appointment.id}`, {
        status, volunteerName,
      });
      setMessage("Appointment and volunteer assignment updated.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update appointment.");
    }
  };

  const addVolunteer = async (campId) => {
    const name = window.prompt("Volunteer name:");
    if (!name?.trim()) return;
    const role = window.prompt("Volunteer role (optional):", "");
    try {
      await request("post", `/api/auth/camp-organizer/camps/${campId}/volunteers`, {
        name, role,
      });
      setMessage("Volunteer added successfully.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add volunteer.");
    }
  };

  const updateMetrics = async (camp) => {
    const value = window.prompt("How many blood bags were collected?", String(camp.collected_bags || 0));
    if (value === null) return;
    try {
      await request("patch", `/api/auth/camp-organizer/camps/${camp.id}/metrics`, {
        collectedBags: Number(value),
      });
      setMessage("Camp performance metrics updated.");
      await loadData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update camp metrics.");
    }
  };

  const downloadReport = () => {
    const headers = ["Camp", "Date", "City", "Bookings", "Confirmed donors", "Attended donors", "Collected blood bags", "Approval"];
    const rows = data.camps
      .filter((item) => item.record_type !== "request")
      .map((item) => [
        item.title, item.camp_date, item.city, item.appointment_count || 0,
        item.confirmed_count || 0, item.completed_count || 0,
        item.collected_bags || 0, item.approval_status || "approved",
      ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bloodcare-camp-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = data.metrics || {};
  return (
    <main className="dashboard-page organizer-dashboard">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><div className="dashboard-brand-icon">♥</div><span>BloodCare</span></div>
        <nav className="dashboard-nav" aria-label="Organizer navigation">
          <button className="dashboard-nav-item dashboard-nav-item-active" type="button">▦ Overview</button>
          <button className="dashboard-nav-item" onClick={() => setShowForm(true)} type="button">＋ Create camp</button>
          <button className="dashboard-nav-item" onClick={() => document.getElementById("organizer-bookings")?.scrollIntoView({ behavior: "smooth" })} type="button">▣ Bookings</button>
          <button className="dashboard-nav-item" onClick={() => document.getElementById("organizer-metrics")?.scrollIntoView({ behavior: "smooth" })} type="button">◈ Performance</button>
        </nav>
        <button className="dashboard-logout" onClick={onLogout} type="button">↪ Log out</button>
      </aside>
      <section className="dashboard-content">
        <PageTopbar user={user} onOpenProfile={() => {}} />
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Camp organizer dashboard</p>
            <h1>Plan a successful blood drive.</h1>
            <p className="dashboard-subtitle">Create camps, manage donor slots, assign volunteers, and track performance.</p>
          </div>
          <button className="primary-dashboard-button" onClick={() => setShowForm(true)} type="button">＋ New camp</button>
        </header>
        {error && <p className="organizer-alert" role="alert">{error}</p>}
        {message && <p className="organizer-success">{message}</p>}
        <section className="dashboard-stats organizer-stats" id="organizer-metrics">
          <Stat value={metrics.total_camps || 0} label="Your camps" tone="red" />
          <Stat value={metrics.total_bookings || 0} label="Donor bookings" tone="blue" />
          <Stat value={metrics.confirmed_bookings || 0} label="Confirmed slots" tone="green" />
          <Stat value={metrics.completed_bookings || 0} label="Donors attended" tone="purple" />
          <Stat value={metrics.total_collected_bags || 0} label="Blood bags collected" tone="orange" />
        </section>
        <section className="dashboard-panel organizer-analytics-panel">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Drive performance metrics</p><h2>Camp analytics</h2></div>
            <button className="organizer-download-button" onClick={downloadReport} type="button">↓ Download report</button>
          </div>
          <div className="organizer-analytics-grid">
            <AnalyticsCard icon="♥" value={metrics.total_collected_bags || 0} label="Blood bags collected" tone="red" />
            <AnalyticsCard icon="●" value={metrics.completed_bookings || 0} label="Donors attended" tone="blue" />
            <AnalyticsCard icon="↗" value={metrics.total_bookings ? `${Math.round((Number(metrics.completed_bookings || 0) / Number(metrics.total_bookings)) * 100)}%` : "0%"} label="Attendance rate" tone="green" />
          </div>
          <div className="organizer-performance-list">
            {data.camps.filter((item) => item.record_type !== "request").map((item) => (
              <div className="organizer-performance-row" key={`performance-${item.id}`}>
                <strong>{item.title}</strong>
                <span>{item.completed_count || 0} donors attended</span>
                <span>{item.collected_bags || 0} bags</span>
                <div className="organizer-performance-bar"><i style={{ width: `${Math.min(100, Number(item.appointment_count) ? (Number(item.completed_count || 0) / Number(item.appointment_count)) * 100 : 0)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        {showForm && (
          <form className="dashboard-panel organizer-form" onSubmit={createCamp}>
            <div className="panel-heading"><div><p className="panel-eyebrow">Camp creation tools</p><h2>Create a donation camp</h2></div><button className="organizer-close" onClick={() => setShowForm(false)} type="button">Close</button></div>
            <div className="organizer-form-grid">
              {[
                ["title", "Camp name"], ["organizer", "Organizing group"], ["location", "Location"],
                ["city", "City"], ["contactNumber", "Contact number"],
              ].map(([name, label]) => <label key={name}>{label}<input required name={name} onChange={updateCampField} value={camp[name]} /></label>)}
              <label>Date<input required name="campDate" onChange={updateCampField} type="date" value={camp.campDate} /></label>
              <label>Start time<input required name="startTime" onChange={updateCampField} type="time" value={camp.startTime} /></label>
              <label>End time<input required name="endTime" onChange={updateCampField} type="time" value={camp.endTime} /></label>
              <label>Slot length (minutes)<input min="15" name="slotDurationMinutes" onChange={updateCampField} required type="number" value={camp.slotDurationMinutes} /></label>
              <label>Donors per slot<input min="1" name="slotCapacity" onChange={updateCampField} required type="number" value={camp.slotCapacity} /></label>
              <label className="organizer-form-wide">Description<textarea name="description" onChange={updateCampField} value={camp.description} /></label>
            </div>
            <button className="primary-dashboard-button" type="submit">Create camp</button>
          </form>
        )}
        <section className="dashboard-grid organizer-grid">
          <section className="dashboard-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Camp creation tools</p><h2>Upcoming camps</h2></div></div>
            <div className="organizer-list">{data.camps.length ? data.camps.map((item) => <article className="organizer-item" key={`${item.record_type || "camp"}-${item.id}`}><strong>{item.title}</strong><span>{item.city} · {item.camp_date}</span><small className={`camp-approval-status camp-approval-${item.approval_status || "approved"}`}><span className="camp-approval-dot" />{item.approval_status || "approved"}</small>{item.record_type !== "request" && <><small>{item.appointment_count || 0} bookings · {item.confirmed_count || 0} confirmed · {item.completed_count || 0} attended</small><small>Slots: every {item.slot_duration_minutes || 60} minutes · {item.slot_capacity || 10} donors/slot · Collected bags: {item.collected_bags || 0}</small><div className="organizer-actions"><button className="organizer-action-button organizer-volunteer-button" onClick={() => addVolunteer(item.id)} type="button">＋ Add volunteer</button><button className="organizer-action-button organizer-report-button" onClick={() => updateMetrics(item)} type="button">▣ Update report</button></div></>}</article>) : <p>No camps or requests yet.</p>}</div>
          </section>
          <section className="dashboard-panel" id="organizer-bookings"><div className="panel-heading"><div><p className="panel-eyebrow">Donor appointment slot booking</p><h2>Manage bookings</h2></div></div>
            <div className="organizer-list">{data.appointments.length ? data.appointments.map((item) => <article className="organizer-item" key={item.id}><strong>{item.donor_name}</strong><span>{item.camp_title} · {String(item.appointment_time).slice(0, 5)}</span><small>Status: {item.status} · Volunteer: {item.volunteer_name || "Unassigned"}</small><div className="organizer-actions"><button onClick={() => updateAppointment(item, "confirmed")} type="button">Confirm & assign</button><button onClick={() => updateAppointment(item, "completed")} type="button">Complete</button></div></article>) : <p>No donor bookings yet.</p>}</div>
          </section>
          <section className="dashboard-panel"><div className="panel-heading"><div><p className="panel-eyebrow">Volunteer assignment</p><h2>Camp volunteers</h2></div></div>
            <div className="organizer-list">{data.volunteers?.length ? data.volunteers.map((item) => <article className="organizer-item" key={item.id}><strong>{item.name}</strong><span>{item.role || "Volunteer"} · Camp #{item.camp_id}</span><small>{item.phone || "No phone provided"}</small></article>) : <p>No volunteers added yet.</p>}</div>
          </section>
        </section>
      </section>
    </main>
  );
}

function Stat({ value, label, tone }) {
  return <div className="stat-card"><div className={`stat-icon stat-icon-${tone}`}>♥</div><div><strong>{value}</strong><span>{label}</span></div></div>;
}

function AnalyticsCard({ icon, value, label, tone }) {
  return <article className={`organizer-analytics-card organizer-analytics-${tone}`}><span className="organizer-analytics-icon">{icon}</span><strong>{value}</strong><span>{label}</span></article>;
}

export default CampOrganizerDashboard;
