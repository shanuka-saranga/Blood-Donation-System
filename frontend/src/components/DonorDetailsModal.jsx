import { useState } from "react";
import "../pages/DonorDetailsModal.css";

const formatDateInput = (value) => {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

function DonorDetailsModal({ onSave, onClose, error, isSaving, showSuccess }) {
  const [form, setForm] = useState({
    bloodGroup: "",
    phone: "",
    nic: "",
    age: "",
    weight: "",
    dateOfBirth: formatDateInput(""),
    healthQuestionnaire: "",
    gender: "",
    city: "",
    lastDonatedDate: formatDateInput(""),
  });
  const [validationError, setValidationError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const age = Number(form.age);
    const weight = Number(form.weight);
    const errors = {};
    if (!Number.isInteger(age) || age < 18) {
      errors.age = "Age must be at least 18 years.";
    }
    if (age > 60) {
      errors.age = "Age must not be more than 60 years.";
    }
    if (!Number.isFinite(weight) || weight < 50) {
      errors.weight = "Weight must be at least 50 kg.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setValidationError("Please correct the eligibility requirements.");
      return;
    }
    setFieldErrors({});
    setValidationError("");
    await onSave({
      ...form,
      age,
      weight,
    });
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
          <label>
            Age (18-60)
            <input min="18" max="60" name="age" onChange={handleChange} required type="number" value={form.age} />
            {fieldErrors.age && <span className="donor-details-field-error">{fieldErrors.age}</span>}
          </label>
          <label>
            Weight (kg)
            <input min="50" name="weight" onChange={handleChange} required step="0.1" type="number" value={form.weight} />
            {fieldErrors.weight && <span className="donor-details-field-error">{fieldErrors.weight}</span>}
          </label>
          <label>Date of birth<input name="dateOfBirth" onChange={handleChange} required type="date" value={form.dateOfBirth} /></label>
          <label>
            Gender
            <select name="gender" onChange={handleChange} required value={form.gender}>
              <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </label>
          <label>City<input name="city" onChange={handleChange} required value={form.city} /></label>
          <label className="donor-details-wide">
            Health questionnaire <span className="donor-details-required">(required)</span>
            <textarea
              aria-label="Health questionnaire"
              name="healthQuestionnaire"
              onChange={handleChange}
              placeholder="Please describe recent illness, medication, allergies, pregnancy, or other health information."
              required
              rows="6"
              value={form.healthQuestionnaire}
            />
          </label>
          <label className="donor-details-wide">
            Last donated date (optional)
            <input name="lastDonatedDate" onChange={handleChange} type="date" value={form.lastDonatedDate} />
          </label>
        </div>
        {(validationError || error) && (
          <p className="donor-details-error" role="alert">
            {validationError || error}
          </p>
        )}
        <button className="profile-save-button" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save and continue"}
        </button>
      </form>
    </div>
  );
}

export default DonorDetailsModal;