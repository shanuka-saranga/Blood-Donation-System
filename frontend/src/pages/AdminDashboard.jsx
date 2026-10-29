import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

function AdminDashboard({ user, onLogout }) {
  const [summary, setSummary] = useState({ stats: {}, recentDonations: [] });
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState("donors");
  const [showCampForm, setShowCampForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionError, setActionError] = useState("");

  const adminRequest = (method, url, data) => axios({
    method,
    url: `http://localhost:5000${url}`,
    data,
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  });

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and their related records?")) return;
    try {
      await adminRequest("delete", `/api/auth/admin/users/${userId}`);
      await loadSummary();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to delete user.");
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    try {
      await adminRequest("patch", `/api/requests/${requestId}/${action}`);
      await loadSummary();
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to review blood request.");
    }
  };

  const loadSummary = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/admin-summary", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setSummary(response.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load admin dashboard.");
    }
  };

  useEffect(() => {
    loadSummary();
    const intervalId = window.setInterval(loadSummary, 15000);
    return () => window.clearInterval(intervalId);
  }, []);

  const stats = summary.stats || {};

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="admin-brand-mark">♥</span><span>BloodCare</span></div>
        <div className="admin-sidebar-copy">
          <span>Administration</span>
          <strong>{user.name}</strong>
        </div>
        <button className="admin-logout" onClick={onLogout} type="button">Log out</button>
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">System overview</p>
            <h1>Admin dashboard</h1>
            <p>Monitor donors, donations, requests, and upcoming camps.</p>
          </div>
          <span className="admin-role-badge">Administrator</span>
        </header>

        {error && <p className="admin-error" role="alert">{error}</p>}
        <section className="admin-stats" aria-label="System statistics">
          <AdminStat active={selectedCard === "users"} label="Total registered users" onClick={() => setSelectedCard("users")} value={stats.users || 0} />
          <AdminStat active={selectedCard === "donors"} label="Total registered donors" onClick={() => setSelectedCard("donors")} value={stats.donors || 0} />
          <AdminStat active={selectedCard === "eligible"} label="Eligible donors" onClick={() => setSelectedCard("eligible")} value={stats.eligibleDonors || 0} />
          <AdminStat active={selectedCard === "donations"} label="Total donations" onClick={() => setSelectedCard("donations")} value={stats.donations || 0} />
          <AdminStat active={selectedCard === "requests"} label="Active blood requests" onClick={() => setSelectedCard("requests")} value={stats.activeRequests || 0} />
          <AdminStat active={selectedCard === "camps"} label="Upcoming donation camps" onClick={() => setSelectedCard("camps")} value={stats.upcomingCamps || 0} />
        </section>

        <AdminDetails
          onDeleteUser={handleDeleteUser}
          onEditUser={setEditingUser}
          onReviewRequest={handleReviewRequest}
          onAddCamp={() => setShowCampForm(true)}
          selectedCard={selectedCard}
          summary={summary}
        />
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><p className="admin-eyebrow">Database records</p><h2>Recent donations</h2></div>
            <span>{summary.recentDonations?.length || 0} records</span>
          </div>
          {summary.recentDonations?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Donor</th><th>Date</th><th>Hospital</th><th>Units</th><th>Status</th></tr></thead>
                <tbody>{summary.recentDonations.map((donation) => (
                  <tr key={donation.id}>
                    <td>{donation.donor_name}</td>
                    <td>{formatDate(donation.donated_date)}</td>
                    <td>{donation.hospital_name}</td>
                    <td>{donation.units_donated}</td>
                    <td><span className="admin-status">{donation.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="admin-empty">No donation records found.</p>}
        </section>
      </section>
      {actionError && <div className="admin-toast" role="alert">{actionError}<button onClick={() => setActionError("")} type="button">×</button></div>}
      {showCampForm && <CampForm onClose={() => setShowCampForm(false)} onSaved={async () => { setShowCampForm(false); await loadSummary(); }} />}
      {editingUser && <UserForm
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={async () => { setEditingUser(null); await loadSummary(); }}
      />}
    </main>
  );
}

function CampForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "", organizer: "", location: "", city: "", campDate: "",
    startTime: "", endTime: "", contactNumber: "", description: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/admin/camps", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      await onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to add donation camp.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="admin-modal-overlay">
      <form className="admin-camp-form" onSubmit={handleSubmit}>
        <button aria-label="Close add camp form" className="admin-modal-close" onClick={onClose} type="button">×</button>
        <p className="admin-eyebrow">Database event</p>
        <h2>Add donation camp</h2>
        <div className="admin-camp-fields">
          <label>Camp title<input name="title" onChange={handleChange} required value={form.title} /></label>
          <label>Organizer<input name="organizer" onChange={handleChange} required value={form.organizer} /></label>
          <label>Location<input name="location" onChange={handleChange} required value={form.location} /></label>
          <label>City<input name="city" onChange={handleChange} required value={form.city} /></label>
          <label>Date<input min={new Date().toISOString().slice(0, 10)} name="campDate" onChange={handleChange} required type="date" value={form.campDate} /></label>
          <label>Contact number<input name="contactNumber" onChange={handleChange} required value={form.contactNumber} /></label>
          <label>Start time<input name="startTime" onChange={handleChange} required type="time" value={form.startTime} /></label>
          <label>End time<input name="endTime" onChange={handleChange} required type="time" value={form.endTime} /></label>
          <label className="admin-camp-wide">Description<textarea name="description" onChange={handleChange} value={form.description} /></label>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-camp-actions">
          <button className="admin-cancel-button" onClick={onClose} type="button">Cancel</button>
          <button className="admin-submit-button" disabled={saving} type="submit">{saving ? "Saving..." : "Save camp"}</button>
        </div>
      </form>
    </div>
  );
}

function AdminStat({ active, label, onClick, value }) {
  return <button className={`admin-stat ${active ? "admin-stat-active" : ""}`} onClick={onClick} type="button"><strong>{value}</strong><span>{label}</span><small>View details →</small></button>;
}

function UserForm({ onClose, onSaved, user }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, role: user.role });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/auth/admin/users/${user.id}`, form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      await onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update user.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="admin-modal-overlay">
      <form className="admin-camp-form admin-user-form" onSubmit={handleSubmit}>
        <button className="admin-modal-close" onClick={onClose} type="button">×</button>
        <p className="admin-eyebrow">User management</p><h2>Edit user</h2>
        <div className="admin-camp-fields">
          <label>Name<input onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
          <label>Email<input onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label>
          <label>Role<select onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role}><option value="donor">Donor</option><option value="admin">Admin</option></select></label>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-camp-actions"><button className="admin-cancel-button" onClick={onClose} type="button">Cancel</button><button className="admin-submit-button" disabled={saving} type="submit">{saving ? "Saving..." : "Save changes"}</button></div>
      </form>
    </div>
  );
}

function AdminDetails({ onAddCamp, onDeleteUser, onEditUser, onReviewRequest, selectedCard, summary }) {
  const titles = { users: "Registered users", donors: "Registered donors", eligible: "Eligible donors", donations: "Donation records", requests: "Active blood requests", camps: "Upcoming donation camps" };
  const items = selectedCard === "camps" ? summary.upcomingCamps : selectedCard === "requests" ? summary.activeRequests : selectedCard === "eligible" ? summary.eligibleDonors : selectedCard === "donations" ? summary.recentDonations : selectedCard === "users" ? summary.users : summary.donors;
  return (
    <section className="admin-panel admin-detail-panel">
      <div className="admin-panel-heading">
        <div><p className="admin-eyebrow">Selected summary</p><h2>{titles[selectedCard]}</h2></div>
        <div className="admin-detail-actions">
          <span>{items?.length || 0} records</span>
          {selectedCard === "camps" && (
            <button className="admin-add-button" onClick={onAddCamp} type="button">
              + Add donation camp
            </button>
          )}
        </div>
      </div>
      {!items?.length && <p className="admin-empty">No records found.</p>}
      {items?.length > 0 && (
        <div className="admin-detail-list">
          {items.map((item) => (
            <article className="admin-detail-item" key={item.id}>
              {selectedCard === "camps" && <><strong>{item.title}</strong><span>{item.city} · {formatDate(item.camp_date)}</span><small>{item.organizer}</small></>}
              {selectedCard === "requests" && <><strong>{item.patient_name || "Blood request"} · {item.blood_group}</strong><span>{item.hospital_name}, {item.city}</span><small>{item.units_required} units · {item.urgency}{item.requester_name ? ` · Requested by ${item.requester_name}` : ""}</small><div className="admin-item-actions"><button className="admin-approve-button" onClick={() => onReviewRequest(item.id, "approve")} type="button">Approve</button><button className="admin-decline-button" onClick={() => onReviewRequest(item.id, "decline")} type="button">Decline</button></div></>}
              {selectedCard === "donations" && <><strong>{item.donor_name}</strong><span>{item.hospital_name} · {formatDate(item.donated_date)}</span><small>{item.units_donated} units · {item.status}</small></>}
              {selectedCard === "users" && <><strong>{item.name}</strong><span>{item.email}</span><small>{item.role}</small><div className="admin-item-actions"><button className="admin-edit-button" onClick={() => onEditUser(item)} type="button">Edit</button><button className="admin-decline-button" onClick={() => onDeleteUser(item.id)} type="button">Delete</button></div></>}
              {selectedCard !== "camps" && selectedCard !== "requests" && selectedCard !== "donations" && selectedCard !== "users" && <><strong>{item.name}</strong><span>{item.email}</span><small>{item.blood_group || "Blood group unavailable"} · {item.city || "Location unavailable"}</small></>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default AdminDashboard;