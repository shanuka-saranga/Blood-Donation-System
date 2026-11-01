import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

function AdminDashboard({ user, onLogout }) {
  const [summary, setSummary] = useState({ stats: {}, recentDonations: [] });
  const [error, setError] = useState("");
  const [selectedCard, setSelectedCard] = useState("donors");
  const [showCampForm, setShowCampForm] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [actionError, setActionError] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const adminRequest = (method, url, data) =>
    axios({
      method,
      url: `${url}`,
      data,
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
    });

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user and their related records?")) return;
    try {
      await adminRequest("delete", `/api/auth/admin/users/${userId}`);
      await loadSummary();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Unable to delete user.",
      );
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    try {
      await adminRequest("patch", `/api/requests/${requestId}/${action}`);
      await loadSummary();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message ||
          "Unable to review blood request.",
      );
    }
  };

  const handleAppointmentReview = async (appointmentId, status) => {
    try {
      await adminRequest("patch", `/api/auth/admin/appointments/${appointmentId}`, { status });
      await loadSummary();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Unable to update appointment.",
      );
    }
  };

  const handleCampReview = async (campId, status) => {
    try {
      await adminRequest("patch", `/api/auth/admin/camp-requests/${campId}`, { status });
      await loadSummary();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Unable to review camp request.",
      );
    }
  };

  const handleInventoryUpdate = async (bloodGroup, availableUnits) => {
    try {
      await adminRequest("put", `/api/auth/admin/inventory/${encodeURIComponent(bloodGroup)}`, {
        availableUnits,
      });
      await loadSummary();
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Unable to update blood stock.",
      );
    }
  };

  const loadSummary = async () => {
    try {
      const response = await axios.get("/api/auth/admin-summary", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setSummary(response.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load admin dashboard.",
      );
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
        <div className="admin-brand">
          <span className="admin-brand-mark">♥</span>
          <span>BloodCare</span>
        </div>
        <div className="admin-sidebar-copy">
          <span>Administration</span>
          <strong>{user.name}</strong>
        </div>
        <button className="admin-logout" onClick={onLogout} type="button">
          Log out
        </button>
      </aside>
      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">System overview</p>
            <h1>Admin dashboard</h1>
            <p>Monitor donors, donations, requests, and upcoming camps.</p>
          </div>
          <span className="admin-role-badge">Administrator</span>
          <button className="admin-add-button" onClick={() => setShowNotificationForm(true)} type="button">
            Send notification
          </button>
        </header>

        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <section className="admin-stats" aria-label="System statistics">
          <AdminStat
            active={selectedCard === "users"}
            label="Total registered users"
            onClick={() => setSelectedCard("users")}
            value={stats.users || 0}
          />
          <AdminStat
            active={selectedCard === "donors"}
            label="Total registered donors"
            onClick={() => setSelectedCard("donors")}
            value={stats.donors || 0}
          />
          <AdminStat
            active={selectedCard === "eligible"}
            label="Eligible donors"
            onClick={() => setSelectedCard("eligible")}
            value={stats.eligibleDonors || 0}
          />
          <AdminStat
            active={selectedCard === "donations"}
            label="Total donations"
            onClick={() => setSelectedCard("donations")}
            value={stats.donations || 0}
          />
          <AdminStat
            active={selectedCard === "requests"}
            label="Active blood requests"
            onClick={() => setSelectedCard("requests")}
            value={stats.activeRequests || 0}
          />
          <AdminStat
            active={selectedCard === "camps"}
            label="Upcoming donation camps"
            onClick={() => setSelectedCard("camps")}
            value={stats.upcomingCamps || 0}
          />
          <AdminStat
            active={selectedCard === "appointments"}
            label="Camp appointments"
            onClick={() => setSelectedCard("appointments")}
            value={stats.appointments || 0}
          />
        </section>

        <BloodInventory
          inventory={summary.inventory || []}
          onUpdate={handleInventoryUpdate}
        />

        <AdminDetails
          onAppointmentReview={handleAppointmentReview}
          onCampReview={handleCampReview}
          onDeleteUser={handleDeleteUser}
          onEditUser={setEditingUser}
          onReviewRequest={handleReviewRequest}
          onAddCamp={() => setShowCampForm(true)}
          onRoleFilterChange={setUserRoleFilter}
          userRoleFilter={userRoleFilter}
          selectedCard={selectedCard}
          summary={summary}
        />
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-eyebrow">Database records</p>
              <h2>Recent donations</h2>
            </div>
            <span>{summary.recentDonations?.length || 0} records</span>
          </div>
          {summary.recentDonations?.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Date</th>
                    <th>Hospital</th>
                    <th>Units</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentDonations.map((donation) => (
                    <tr key={donation.id}>
                      <td>{donation.donor_name}</td>
                      <td>{formatDate(donation.donated_date)}</td>
                      <td>{donation.hospital_name}</td>
                      <td>{donation.units_donated}</td>
                      <td>
                        <span className="admin-status">{donation.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">No donation records found.</p>
          )}
        </section>
      </section>
      {actionError && (
        <div className="admin-toast" role="alert">
          {actionError}
          <button onClick={() => setActionError("")} type="button">
            ×
          </button>
        </div>
      )}
      {showCampForm && (
        <CampForm
          onClose={() => setShowCampForm(false)}
          onSaved={async () => {
            setShowCampForm(false);
            await loadSummary();
          }}
        />
      )}
      {showNotificationForm && (
        <NotificationForm
          onClose={() => setShowNotificationForm(false)}
          onSaved={async () => {
            setShowNotificationForm(false);
            await loadSummary();
          }}
        />
      )}
      {editingUser && (
        <UserForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={async () => {
            setEditingUser(null);
            await loadSummary();
          }}
        />
      )}
    </main>
  );
}

function BloodInventory({ inventory, onUpdate }) {
  const lowStockThreshold = 5;
  const lowStock = inventory.filter(
    (item) => Number(item.available_units) <= lowStockThreshold,
  );

  return (
    <section className="admin-panel inventory-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-eyebrow">Live blood stock</p>
          <h2>Blood inventory by group</h2>
        </div>
        <span>Refreshes every 15 seconds</span>
      </div>
      {lowStock.length > 0 && (
        <div className="inventory-alert" role="alert">
          <strong>Low stock alert</strong>
          <span>
            {lowStock.map((item) => `${item.blood_group} (${item.available_units} bags)`).join(", ")}
          </span>
        </div>
      )}
      {!inventory.length ? (
        <p className="admin-empty">No blood inventory records found.</p>
      ) : (
        <div className="inventory-grid">
          {inventory.map((item) => {
            const units = Number(item.available_units) || 0;
            const isLow = units <= lowStockThreshold;
            return (
              <article className={`inventory-card ${isLow ? "inventory-card-low" : ""}`} key={item.id}>
                <div className="inventory-card-top">
                  <strong>{item.blood_group}</strong>
                  {isLow && <span>Low</span>}
                </div>
                <b>{units}</b>
                <small>bags available</small>
                <time dateTime={item.last_updated}>Updated {formatDateTime(item.last_updated)}</time>
                <div className="inventory-update">
                  <input aria-label={`Update ${item.blood_group} bags`} defaultValue={units} min="0" type="number" />
                  <button onClick={(event) => onUpdate(item.blood_group, event.currentTarget.previousElementSibling.value)} type="button">Update</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CampForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    organizer: "",
    location: "",
    city: "",
    campDate: "",
    startTime: "",
    endTime: "",
    contactNumber: "",
    description: "",
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
      await axios.post("/api/auth/admin/camps", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      await onSaved();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to add donation camp.",
      );
    } finally {
      setSaving(false);
    }

  };
  return (
    <div className="admin-modal-overlay">
      <form className="admin-camp-form" onSubmit={handleSubmit}>
        <button
          aria-label="Close add camp form"
          className="admin-modal-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="admin-eyebrow">Database event</p>
        <h2>Add donation camp</h2>
        <div className="admin-camp-fields">
          <label>
            Camp title
            <input
              name="title"
              onChange={handleChange}
              required
              value={form.title}
            />
          </label>
          <label>
            Organizer
            <input
              name="organizer"
              onChange={handleChange}
              required
              value={form.organizer}
            />
          </label>
          <label>
            Location
            <input
              name="location"
              onChange={handleChange}
              required
              value={form.location}
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
            Date
            <input
              min={new Date().toISOString().slice(0, 10)}
              name="campDate"
              onChange={handleChange}
              required
              type="date"
              value={form.campDate}
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
            Start time
            <input
              name="startTime"
              onChange={handleChange}
              required
              type="time"
              value={form.startTime}
            />
          </label>
          <label>
            End time
            <input
              name="endTime"
              onChange={handleChange}
              required
              type="time"
              value={form.endTime}
            />
          </label>
          <label className="admin-camp-wide">
            Description
            <textarea
              name="description"
              onChange={handleChange}
              value={form.description}
            />
          </label>
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-camp-actions">
          <button
            className="admin-cancel-button"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="admin-submit-button"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save camp"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminStat({ active, label, onClick, value }) {
  return (
    <button
      className={`admin-stat ${active ? "admin-stat-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <strong>{value}</strong>
      <span>{label}</span>
      <small>View details →</small>
    </button>
  );
}

function NotificationForm({ onClose, onSaved }) {
  const [form, setForm] = useState({ role: "donor", title: "", message: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await axios.post("/api/auth/admin/notifications", form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      await onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send notification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <form className="admin-camp-form" onSubmit={handleSubmit}>
        <button className="admin-modal-close" onClick={onClose} type="button">×</button>
        <p className="admin-eyebrow">User communication</p>
        <h2>Send notification</h2>
        {error && <p className="admin-error">{error}</p>}
        <div className="admin-camp-fields">
          <label>
            Send to role
            <select name="role" onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} value={form.role}>
              <option value="donor">Donors</option>
              <option value="camp_organizer">Camp organizers</option>
              <option value="medical_staff">Medical staff</option>
              <option value="admin">Administrators</option>
            </select>
          </label>
          <label className="admin-camp-wide">
            Title
            <input maxLength="150" name="title" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required value={form.title} />
          </label>
          <label className="admin-camp-wide">
            Message
            <textarea name="message" onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} required value={form.message} />
          </label>
        </div>
        <div className="admin-camp-actions">
          <button className="admin-cancel-button" onClick={onClose} type="button">Cancel</button>
          <button className="admin-submit-button" disabled={saving} type="submit">{saving ? "Sending..." : "Send notification"}</button>
        </div>
      </form>
    </div>
  );
}

function UserForm({ onClose, onSaved, user }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/auth/admin/users/${user.id}`, form, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      await onSaved();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to update user.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="admin-modal-overlay">
      <form className="admin-camp-form admin-user-form" onSubmit={handleSubmit}>
        <button className="admin-modal-close" onClick={onClose} type="button">
          ×
        </button>
        <p className="admin-eyebrow">User management</p>
        <h2>Edit user</h2>
        <div className="admin-camp-fields">
          <label>
            Name
            <input
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
              value={form.name}
            />
          </label>
          <label>
            Email
            <input
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
              type="email"
              value={form.email}
            />
          </label>
          <label>
            Role
            <select
              onChange={(event) =>
                setForm({ ...form, role: event.target.value })
              }
              value={form.role}
            >
              <option value="donor">Donor</option>
              <option value="admin">Admin</option>
              <option value="camp_organizer">Camp organizer</option>
              <option value="medical_staff">Medical staff</option>
            </select>
          </label>
        </div>
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        <div className="admin-camp-actions">
          <button
            className="admin-cancel-button"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="admin-submit-button"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminDetails({
  onAppointmentReview,
  onCampReview,
  onAddCamp,
  onDeleteUser,
  onEditUser,
  onReviewRequest,
  onRoleFilterChange,
  selectedCard,
  summary,
  userRoleFilter,
}) {
  const titles = {
    users: "Registered users",
    donors: "Registered donors",
    eligible: "Eligible donors",
    donations: "Donation records",
    requests: "Active blood requests",
    camps: "Upcoming donation camps",
    appointments: "Camp appointments",
  };
  const selectedItems =
    selectedCard === "camps"
      ? summary.upcomingCamps
      : selectedCard === "appointments"
        ? summary.appointments
      : selectedCard === "requests"
        ? summary.activeRequests
        : selectedCard === "eligible"
          ? summary.eligibleDonors
          : selectedCard === "donations"
            ? summary.recentDonations
            : selectedCard === "users"
              ? summary.users
              : summary.donors;
  const items = selectedCard === "users" && userRoleFilter !== "all"
    ? selectedItems.filter((item) => item.role === userRoleFilter)
    : selectedItems;
  return (
    <section className="admin-panel admin-detail-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="admin-eyebrow">Selected summary</p>
          <h2>{titles[selectedCard]}</h2>
        </div>
        <div className="admin-detail-actions">
          {selectedCard === "users" && (
            <select
              aria-label="Filter users by role"
              className="admin-role-filter"
              onChange={(event) => onRoleFilterChange(event.target.value)}
              value={userRoleFilter}
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="medical_staff">Medical staff</option>
              <option value="camp_organizer">Camp organizers</option>
              <option value="donor">Donors</option>
            </select>
          )}
          <span>{items?.length || 0} records</span>
          {selectedCard === "camps" && (
            <button
              className="admin-add-button"
              onClick={onAddCamp}
              type="button"
            >
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
              {selectedCard === "camps" && (
                <>
                  <strong>{item.title}</strong>
                  <span>
                    {item.city} · {formatDate(item.camp_date)}
                  </span>
                  <small>{item.organizer}</small>
                  <small className={`camp-approval-status camp-approval-${item.approval_status || "approved"}`}>
                    <span className="camp-approval-dot" />
                    {item.approval_status || "approved"}
                  </small>
                  {(item.approval_status === "pending" || !item.approval_status) && (
                    <div className="admin-item-actions">
                      <button className="admin-approve-button camp-action-button" onClick={() => onCampReview(item.id, "approved")} type="button">✓ Approve</button>
                      <button className="admin-decline-button camp-action-button" onClick={() => onCampReview(item.id, "rejected")} type="button">× Decline</button>
                    </div>
                  )}
                </>
              )}
              {selectedCard === "requests" && (
                <>
                  <strong>
                    {item.patient_name || "Blood request"} · {item.blood_group}
                  </strong>
                  <span>
                    {item.hospital_name}, {item.city}
                  </span>
                  <small>
                    {item.units_required} units · {item.urgency}
                    {item.inventory_available
                      ? ` · Stock available: ${item.available_units}`
                      : ` · Stock unavailable (available: ${item.available_units || 0})`}
                    {item.requester_name
                      ? ` · Requested by ${item.requester_name}`
                      : ""}
                  </small>
                  <div className="admin-item-actions">
                    <button
                      className="admin-approve-button"
                      disabled={!Number(item.inventory_available)}
                      onClick={() => onReviewRequest(item.id, "approve")}
                      type="button"
                    >
                      {Number(item.inventory_available) ? "Approve & dispatch" : "Insufficient stock"}
                    </button>
                    <button
                      className="admin-decline-button"
                      onClick={() => onReviewRequest(item.id, "decline")}
                      type="button"
                    >
                      Decline
                    </button>
                  </div>
                </>
              )}
              {selectedCard === "appointments" && (
                <>
                  <strong>{item.donor_name}</strong>
                  <span>{item.camp_title} · {formatDate(item.camp_date)}</span>
                  <small>
                    Appointment: {String(item.appointment_time).slice(0, 5)} · {item.phone}
                  </small>
                  <small>Status: {item.status}</small>
                  {item.status === "pending" && (
                    <div className="admin-item-actions">
                      <button
                        className="admin-approve-button"
                        onClick={() => onAppointmentReview(item.id, "confirmed")}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="admin-decline-button"
                        onClick={() => onAppointmentReview(item.id, "cancelled")}
                        type="button"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </>
              )}
              {selectedCard === "donations" && (
                <>
                  <strong>{item.donor_name}</strong>
                  <span>
                    {item.hospital_name} · {formatDate(item.donated_date)}
                  </span>
                  <small>
                    {item.units_donated} units · {item.status}
                  </small>
                </>
              )}
              {selectedCard === "users" && (
                <>
                  <strong>{item.name}</strong>
                  <span>{item.email}</span>
                  <small>{item.role}</small>
                  <div className="admin-item-actions">
                    <button
                      className="admin-edit-button"
                      onClick={() => onEditUser(item)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="admin-decline-button"
                      onClick={() => onDeleteUser(item.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
              {selectedCard !== "camps" &&
                selectedCard !== "appointments" &&
                selectedCard !== "requests" &&
                selectedCard !== "donations" &&
                selectedCard !== "users" && (
                  <>
                    <strong>{item.name}</strong>
                    <span>{item.email}</span>
                    <small>
                      {item.blood_group || "Blood group unavailable"} ·{" "}
                      {item.city || "Location unavailable"}
                    </small>
                  </>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export default AdminDashboard;
