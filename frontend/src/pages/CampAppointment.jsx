import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CampAppointment.css";
import DonorFooter from "../components/DonorFooter";

function CampAppointment({ user }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const camp = state?.camp;
  const [form, setForm] = useState({
    appointmentTime: camp?.start_time?.slice(0, 5) || "",
    phone: user.phone || user.donorDetails?.phone || "",
    notes: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [booked, setBooked] = useState(false);
  const slots = buildSlots(camp);

  if (!camp) {
    return (
      <main className="appointment-page">
        <section className="appointment-card">
          <h1>Camp not selected</h1>
          <p>Choose a donation camp first to book an appointment.</p>
          <button onClick={() => navigate("/camps")} type="button">View donation camps</button>
        </section>
        <DonorFooter />
      </main>
    );
  }

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await axios.post(`/api/auth/camps/${camp.id}/appointments`, form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setBooked(true);
      setMessage({ type: "success", text: "Your appointment was booked successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to book your appointment.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="appointment-page">
      <section className="appointment-card">
        <button className="appointment-back" onClick={() => navigate("/camps")} type="button">
          ← Back to donation camps
        </button>
        <p className="appointment-eyebrow">Appointment booking</p>
        <h1>Book your donation appointment</h1>
        <div className="appointment-camp-summary">
          <strong>{camp.name}</strong>
          <span>{camp.location}, {camp.city}</span>
          <span>{formatDate(camp.camp_date)} · {formatTime(camp.start_time)} - {formatTime(camp.end_time)}</span>
        </div>
        {message.text && <p className={`appointment-message ${message.type}`}>{message.text}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Appointment time
            <select name="appointmentTime" onChange={handleChange} required value={form.appointmentTime}>
              {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </label>
          <label>
            Phone number
            <input name="phone" onChange={handleChange} required value={form.phone} />
          </label>
          <label>
            Notes (optional)
            <textarea name="notes" onChange={handleChange} value={form.notes} />
          </label>
          {!booked ? (
            <button className="appointment-submit" disabled={saving} type="submit">
              {saving ? "Booking..." : "Confirm appointment"}
            </button>
          ) : (
            <button
              className="appointment-submit"
              onClick={() => navigate("/appointments")}
              type="button"
            >
              View my bookings
            </button>
          )}
        </form>
      </section>
      <DonorFooter />
    </main>
  );
}

function buildSlots(camp) {
  const start = toMinutes(camp?.start_time);
  const end = toMinutes(camp?.end_time);
  const duration = Number(camp?.slot_duration_minutes || 60);
  if (start === null || end === null || duration < 1) return [];
  const slots = [];
  for (let minutes = start; minutes < end; minutes += duration) {
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return slots;
}

function toMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "Time unavailable";
  return String(value).slice(0, 5);
}

export default CampAppointment;
