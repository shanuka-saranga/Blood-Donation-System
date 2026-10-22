import { useState } from "react";
import "../pages/DonorDetailsModal.css";

function DonorDetailsModal({ onSave, onClose, error, isSaving, showSuccess }) {
  const [form, setForm] = useState({
    bloodGroup: "",
    phone: "",
    nic: "",
    age: "",
    gender: "",
    city: "",
    lastDonatedDate: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSave(form);
  };

  if (showSuccess) {
    return (
      <div className="donor-details-overlay">
        <section
          aria-live="polite"
          className="donor-details-modal donor-details-success-modal"
        >
          <div className="donor-details-success-icon">✓</div>
          <p className="dashboard-eyebrow">Profile updated</p>
          <h2>Thank you, your details were submitted!</h2>
          <p className="donor-details-description">
            Your donor information has been saved successfully.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="donor-details-overlay">
      <form className="donor-details-modal" onSubmit={handleSubmit}>
        <button
          aria-label="Close donor details form"
          className="donor-details-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="dashboard-eyebrow">Complete your profile</p>
        <h2>Tell us about yourself</h2>
        <p className="donor-details-description">
          Please add your donor details before continuing.
        </p>
        <div className="donor-details-fields">
          <label>
            Blood group
            <select name="bloodGroup" onChange={handleChange} required value={form.bloodGroup}>
              <option value="">Select</option>
              <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
              <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
            </select>
          </label>
          <label>Phone<input name="phone" onChange={handleChange} required value={form.phone} /></label>
          <label>NIC<input name="nic" onChange={handleChange} required value={form.nic} /></label>
          <label>Age<input min="18" max="100" name="age" onChange={handleChange} required type="number" value={form.age} /></label>
          <label>
            Gender
            <select name="gender" onChange={handleChange} required value={form.gender}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </label>
          <label>City<input name="city" onChange={handleChange} required value={form.city} /></label>
          <label className="donor-details-wide">
            Last donated date (optional)
            <input name="lastDonatedDate" onChange={handleChange} type="date" value={form.lastDonatedDate} />
          </label>
        </div>
        {error && <p className="donor-details-error" role="alert">{error}</p>}
        <button className="profile-save-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}

export default DonorDetailsModal;