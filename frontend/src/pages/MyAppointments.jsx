import { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode";
import "./MyAppointments.css";
import PageTopbar from "../components/PageTopbar";
import DonorFooter from "../components/DonorFooter";

function MyAppointments({
  user,
  onBack,
  onOpenCamps,
  onOpenAppointments,
  onOpenBloodRequest,
  onOpenDonations,
  onOpenProfile,
  onLogout,
}) {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ appointmentTime: "", phone: "", notes: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");

  const loadAppointments = async () => {
    try {
      const response = await axios.get("/api/auth/appointments", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      const records = response.data.appointments || [];
      setAppointments(records);
      setSelectedAppointment((current) =>
        records.find((item) => item.id === current?.id) || records[0] || null,
      );
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        onLogout();
        return;
      }
      setError(requestError.response?.data?.message || "Unable to load your bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    const refreshId = window.setInterval(loadAppointments, 15000);
    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedAppointment || selectedAppointment.status !== "confirmed") {
      setQrCode("");
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(JSON.stringify({
      bookingId: selectedAppointment.id,
      camp: selectedAppointment.camp_title,
      date: selectedAppointment.camp_date,
      time: formatTime(selectedAppointment.appointment_time),
      donor: user.name,
      location: `${selectedAppointment.location}, ${selectedAppointment.city}`,
    }), { width: 220, margin: 2 }).then((dataUrl) => {
      if (active) setQrCode(dataUrl);
    }).catch(() => {
      if (active) setQrCode("");
    });

    return () => {
      active = false;
    };
  }, [selectedAppointment, user.name]);

  const startEditing = () => {
    setForm({
      appointmentTime: formatTime(selectedAppointment.appointment_time),
      phone: selectedAppointment.phone,
      notes: selectedAppointment.notes || "",
    });
    setEditing(true);
  };

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const saveChanges = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      await axios.put(`/api/auth/appointments/${selectedAppointment.id}`, form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setEditing(false);
      await loadAppointments();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update booking.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBooking = async () => {
    const appointmentId = selectedAppointment?.id;
    if (!appointmentId) {
      setError("Please select a booking to delete.");
      return;
    }
    if (!window.confirm("Delete this appointment booking?")) return;
    try {
      await axios.delete(`/api/auth/appointments/${appointmentId}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setEditing(false);
      const remainingAppointments = appointments.filter(
        (appointment) => appointment.id !== appointmentId,
      );
      setAppointments(remainingAppointments);
      setSelectedAppointment(remainingAppointments[0] || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to delete booking.");
    }
  };

  return (
    <main className="appointments-page donation-history-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><div className="dashboard-brand-icon"><HeartIcon /></div><span>BloodCare</span></div>
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <button className="dashboard-nav-item" onClick={onBack} type="button"><DashboardIcon /> Overview</button>
          <button className="dashboard-nav-item" onClick={onOpenCamps} type="button"><CalendarIcon /> Donation camps</button>
          <button className="dashboard-nav-item dashboard-nav-item-active" onClick={onOpenAppointments} type="button"><CalendarIcon /> My bookings</button>
          <button className="dashboard-nav-item" onClick={onOpenBloodRequest} type="button"><HeartIcon /> I want blood</button>
          <button className="dashboard-nav-item" onClick={onOpenDonations} type="button"><HistoryIcon /> My donations</button>
          <button className="dashboard-nav-item" onClick={onOpenProfile} type="button"><ProfileIcon /> My profile</button>
        </nav>
        <button className="dashboard-logout" onClick={onLogout} type="button"><LogoutIcon /> Log out</button>
      </aside>

      <section className="appointments-content donation-history-content">
        <PageTopbar onOpenProfile={onOpenProfile} user={user} />
        <button className="back-button donation-history-back" onClick={onBack} type="button"><ArrowBackIcon /> Back to overview</button>
        <header className="donation-history-header">
          <p className="dashboard-eyebrow">Your appointments</p>
          <h1>My bookings</h1>
          <p>Review and manage your upcoming donation camp appointments.</p>
        </header>
        {error && <section className="donation-history-message donation-history-error">{error}</section>}
        {isLoading && <section className="donation-history-message">Loading your bookings...</section>}
        {!isLoading && !error && !appointments.length && (
          <section className="donation-history-empty">
            <div className="donation-history-empty-icon"><CalendarIcon /></div>
            <h2>No bookings yet</h2>
            <p>Choose a donation camp and book your appointment.</p>
            <button className="appointment-primary-button" onClick={onOpenCamps} type="button">Find a donation camp</button>
          </section>
        )}
        {!isLoading && !error && appointments.length > 0 && (
          <div className="donation-history-layout">
            <section className="donation-records-panel">
              <div className="donation-panel-heading"><div><p className="panel-eyebrow">Appointment record</p><h2>Upcoming bookings</h2></div><span className="donation-record-count">{appointments.length}</span></div>
              <div className="donation-record-list">
                {appointments.map((appointment) => (
                  <button className={`donation-record-item ${selectedAppointment?.id === appointment.id ? "donation-record-item-active" : ""}`} key={appointment.id} onClick={() => { setSelectedAppointment(appointment); setEditing(false); }} type="button">
                    <span className="donation-record-icon"><CalendarIcon /></span>
                    <span className="donation-record-summary"><strong>{formatDate(appointment.camp_date)}</strong><span>{appointment.camp_title}</span><small>{formatTime(appointment.appointment_time)} · {formatStatus(appointment.status)}</small></span>
                    <ArrowIcon />
                  </button>
                ))}
              </div>
            </section>
            {selectedAppointment && (
              <AppointmentDetails
                appointment={selectedAppointment}
                editing={editing}
                form={form}
                isSaving={isSaving}
                onChange={updateForm}
                onDelete={deleteBooking}
                onEdit={startEditing}
                onCancel={() => setEditing(false)}
                onSave={saveChanges}
                qrCode={qrCode}
                donorName={user.name}
              />
            )}
          </div>
        )}
        <DonorFooter />
      </section>
    </main>
  );
}

function AppointmentDetails({ appointment, editing, form, isSaving, onChange, onDelete, onEdit, onCancel, onSave, qrCode, donorName }) {
  return (
    <section className="donation-details-card appointment-details-card">
      <div className="donation-details-top"><div className="donation-details-icon"><CalendarIcon /></div><span className="donation-status">{formatStatus(appointment.status)}</span></div>
      <p className="panel-eyebrow">Booking details</p>
      <h2>{appointment.camp_title}</h2>
      {!editing ? (
        <>
          <p className="donation-details-copy">{appointment.location}, {appointment.city}</p>
          <dl className="donation-details-list">
            <DetailRow label="Camp date" value={formatDate(appointment.camp_date)} />
            <DetailRow label="Appointment time" value={formatTime(appointment.appointment_time)} />
            <DetailRow label="Phone" value={appointment.phone} />
            <DetailRow label="Notes" value={appointment.notes || "No notes"} />
          </dl>
          {appointment.status === "confirmed" && qrCode && (
            <div className="appointment-qr">
              <p className="panel-eyebrow">Digital appointment pass</p>
              <strong>BloodCare confirmed booking</strong>
              <img alt="Appointment QR code" src={qrCode} />
              <div className="appointment-qr-details">
                <DetailRow label="Booking ID" value={`#${appointment.id}`} />
                <DetailRow label="Donor" value={donorName || "Registered donor"} />
                <DetailRow label="Date" value={formatDate(appointment.camp_date)} />
                <DetailRow label="Time" value={formatTime(appointment.appointment_time)} />
                <DetailRow label="Location" value={`${appointment.location}, ${appointment.city}`} />
              </div>
              <a download={`bloodcare-booking-${appointment.id}.png`} href={qrCode}>Download QR pass</a>
            </div>
          )}
          {appointment.status === "pending" && (
            <div className="appointment-actions"><button onClick={onEdit} type="button">Edit</button><button className="appointment-delete-button" onClick={onDelete} type="button">Delete</button></div>
          )}
        </>
      ) : (
        <form className="appointment-edit-form" onSubmit={onSave}>
          <label>Appointment time<input max={appointment.end_time?.slice(0, 5)} min={appointment.start_time?.slice(0, 5)} name="appointmentTime" onChange={onChange} required type="time" value={form.appointmentTime} /></label>
          <label>Phone<input name="phone" onChange={onChange} required value={form.phone} /></label>
          <label>Notes<textarea name="notes" onChange={onChange} value={form.notes} /></label>
          <div className="appointment-actions"><button disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save changes"}</button><button onClick={onCancel} type="button">Cancel</button></div>
        </form>
      )}
    </section>
  );
}

function DetailRow({ label, value }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
function formatTime(value) { return value ? String(value).slice(0, 5) : "Time unavailable"; }
function formatStatus(value) { return value === "confirmed" ? "Approved" : value === "cancelled" ? "Rejected" : "Pending"; }
function HeartIcon() { return <svg className="dashboard-icon" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.017 6.017 0 0 1 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z" /></svg>; }
function CalendarIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="16" rx="2" strokeWidth="2" width="18" x="3" y="5" /><path d="M16 3v4M8 3v4m-5 4h18" strokeLinecap="round" strokeWidth="2" /></svg>; }
function DashboardIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="3" /><rect height="7" rx="1" strokeWidth="2" width="7" x="3" y="14" /><rect height="7" rx="1" strokeWidth="2" width="7" x="14" y="14" /></svg>; }
function HistoryIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5m4-2v5l3 2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>; }
function ProfileIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth="2" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" strokeWidth="2" /></svg>; }
function LogoutIcon() { return <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9V3h8v18h-8v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>; }
function ArrowIcon() { return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>; }
function ArrowBackIcon() { return <svg className="dashboard-icon small-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6M9 12h10" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>; }

export default MyAppointments;
