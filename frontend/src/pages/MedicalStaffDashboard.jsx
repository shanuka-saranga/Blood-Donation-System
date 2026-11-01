import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./MedicalStaffDashboard.css";

const getColomboDate = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const emptyForm = {
  donorId: "",
  assessmentDate: getColomboDate(),
  preScreening: "",
  hemoglobin: "",
  weight: "",
  bloodBagBarcode: "",
  eligibility: "review",
  notes: "",
};

function MedicalStaffDashboard({ user, onLogout }) {
  const [data, setData] = useState({ donors: [], assessments: [] });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);
  const [donorSearch, setDonorSearch] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [submitState, setSubmitState] = useState("idle");
  const [deletingAssessmentId, setDeletingAssessmentId] = useState(null);

  const request = useCallback((method, url, body) => axios({
    method, url, data: body,
    headers: { Authorization: "Bearer " + localStorage.getItem("token") },
  }), []);

  const loadData = useCallback(async () => {
    try {
      const response = await request("get", "/api/auth/medical/summary");
      setData(response.data);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to load medical records." });
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const timerId = window.setTimeout(loadData, 0);
    return () => window.clearTimeout(timerId);
  }, [loadData]);

  const filteredDonors = data.donors.filter((donor) => {
    const query = donorSearch.trim().toLowerCase();
    if (!query) return true;
    return [donor.id, donor.name, donor.nic, donor.date_of_birth]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });

  const selectDonor = (donor) => {
    setSelectedDonor(donor);
    setForm((current) => ({ ...current, donorId: String(donor.id) }));
  };

  const clearDonorSelection = () => {
    setSelectedDonor(null);
    setForm(emptyForm);
  };

  const handleDonorSearchChange = (event) => {
    const value = event.target.value;
    setDonorSearch(value);
    if (!value.trim()) {
      clearDonorSelection();
    }
  };

  const handleDonorSearchBlur = () => {
    window.setTimeout(() => {
      if (!donorSearch.trim()) {
        clearDonorSelection();
      }
    }, 0);
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitState("saving");
    try {
      await request("post", "/api/auth/medical/assessments", form);
      setForm({ ...emptyForm, donorId: selectedDonor ? String(selectedDonor.id) : "" });
      setSubmitState("completed");
      setMessage({ type: "success", text: "Assessment completed and donation stock updated." });
      await loadData();
      window.setTimeout(() => setSubmitState("idle"), 1800);
    } catch (error) {
      setSubmitState("idle");
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save assessment." });
    }
  };

  const handleDeleteAssessment = async (assessment) => {
    if (!window.confirm("Delete this assessment and reverse its donation stock update?")) return;
    setDeletingAssessmentId(assessment.id);
    try {
      await request("delete", `/api/auth/medical/assessments/${assessment.id}`);
      if (selectedAssessment?.id === assessment.id) setSelectedAssessment(null);
      setMessage({ type: "success", text: "Assessment deleted and stock restored." });
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to delete assessment." });
    } finally {
      setDeletingAssessmentId(null);
    }
  };

  return (
    <main className="medical-dashboard">
      <aside className="medical-sidebar">
        <div className="medical-brand"><span>♥</span> BloodCare</div>
        <div className="medical-profile">
          <small>Medical staff</small>
          <strong>{user.name}</strong>
        </div>
        <button className="medical-logout" onClick={onLogout} type="button">Log out</button>
      </aside>
      <section className="medical-content">
        <header className="medical-header">
          <div>
            <p>Clinical operations</p>
            <h1>Medical staff dashboard</h1>
            <span>Screen donors, record collection data, and confirm eligibility.</span>
          </div>
          <strong className="medical-badge">Authorized staff</strong>
        </header>

        {message.text && <div className={`medical-message ${message.type}`}>{message.text}</div>}
        <section className="medical-stats">
          <div><strong>{data.donors.length}</strong><span>Registered donors</span></div>
          <div><strong>{data.assessments.length}</strong><span>Recent assessments</span></div>
          <div><strong>{data.assessments.filter((item) => item.eligibility === "eligible").length}</strong><span>Eligible assessments</span></div>
        </section>

        <section className="medical-search-panel">
          <div>
            <h2>Find donor for screening</h2>
            <p>Search by donor ID, NIC, name, or date of birth.</p>
          </div>
          <div className="medical-search-row">
            <input
              aria-label="Search donors"
              onBlur={handleDonorSearchBlur}
              onChange={handleDonorSearchChange}
              placeholder="Search ID, NIC, name or birth date"
              value={donorSearch}
            />
            <button type="button" onClick={() => setDonorSearch(donorSearch.trim())}>Search</button>
          </div>
          {donorSearch && (
            <div className="medical-donor-results">
              {filteredDonors.map((donor) => (
                <button
                  className={`medical-donor-result ${selectedDonor?.id === donor.id ? "selected" : ""}`}
                  key={donor.id}
                  onClick={() => selectDonor(donor)}
                  type="button"
                >
                  <strong>{donor.name}</strong>
                  <span>ID: {donor.id} · NIC: {donor.nic || "Not provided"} · DOB: {donor.date_of_birth || "Not provided"}</span>
                </button>
              ))}
              {!filteredDonors.length && <p>No matching donor found.</p>}
            </div>
          )}
          {selectedDonor && (
            <div className="medical-questionnaire">
              <h3>Selected donor details</h3>
              <p><strong>{selectedDonor.name}</strong> · {selectedDonor.email}</p>
              <p>
                ID: {selectedDonor.id} · NIC: {selectedDonor.nic || "Not provided"} ·
                DOB: {selectedDonor.date_of_birth || "Not provided"} · Age: {selectedDonor.age || "Not provided"}
              </p>
              <p>Last donation: {selectedDonor.last_donation_date || "No previous donation recorded"}</p>
              <h4>Digital pre-screening questionnaire</h4>
              <div>{selectedDonor.health_questionnaire || "The donor has not submitted a health questionnaire yet."}</div>
            </div>
          )}
        </section>

        {selectedDonor && (
        <form className="medical-form" onSubmit={handleSubmit}>
          <h2>New donor assessment — {selectedDonor.name}</h2>
          <div className="medical-fields">
            <label>Donor<input readOnly value={`${selectedDonor.name} (ID ${selectedDonor.id})`} /></label>
            <label>Submission date<input name="assessmentDate" readOnly type="date" value={form.assessmentDate} /></label>
            <label className="medical-wide">Digital pre-screening assessment<textarea name="preScreening" onChange={handleChange} placeholder="Record health questions, recent illness, medication, and risk assessment" required value={form.preScreening} /></label>
            <label>Hemoglobin (g/dL)<input min="0" name="hemoglobin" onChange={handleChange} step="0.1" type="number" value={form.hemoglobin} /></label>
            <label>Weight (kg)<input min="0" name="weight" onChange={handleChange} step="0.1" type="number" value={form.weight} /></label>
            <label>Blood bag barcode<input name="bloodBagBarcode" onChange={handleChange} placeholder="Scan or enter barcode" value={form.bloodBagBarcode} /></label>
            <label>Eligibility flag<select name="eligibility" onChange={handleChange} value={form.eligibility}>
              <option value="eligible">Eligible</option><option value="ineligible">Ineligible</option><option value="review">Needs review</option>
            </select></label>
            <label className="medical-wide">Notes<textarea name="notes" onChange={handleChange} value={form.notes} /></label>
          </div>
          <button className={`medical-submit medical-submit-${submitState}`} disabled={submitState === "saving"} type="submit">
            {submitState === "saving" ? "Saving..." : submitState === "completed" ? "✓ Completed" : "Save assessment"}
          </button>
        </form>
        )}

        <section className="medical-table-panel">
          <h2>Recent assessments</h2>
          {loading ? <p>Loading records...</p> : data.assessments.length ? (
            <div className="medical-table-wrap"><table><thead><tr><th>Donor</th><th>Date</th><th>Hb</th><th>Weight</th><th>Barcode</th><th>Eligibility</th><th>Actions</th></tr></thead>
              <tbody>{data.assessments.map((item) => <tr key={item.id}><td>{item.donor_name}</td><td>{item.assessment_date || "-"}</td><td>{item.hemoglobin || "-"}</td><td>{item.weight || "-"}</td><td>{item.blood_bag_barcode || "-"}</td><td><span className={`medical-status ${item.eligibility}`}>{item.eligibility}</span></td><td><div className="medical-row-actions"><button className="medical-detail-button" onClick={() => setSelectedAssessment(item)} type="button">See details</button><button className="medical-delete-button" disabled={deletingAssessmentId === item.id} onClick={() => handleDeleteAssessment(item)} type="button">{deletingAssessmentId === item.id ? "Deleting..." : "Delete"}</button></div></td></tr>)}</tbody>
            </table></div>
          ) : <p>No assessments have been recorded.</p>}
        </section>
        {selectedAssessment && (
          <section className="medical-detail-panel">
            <div className="medical-detail-heading"><h2>Assessment details</h2><button onClick={() => setSelectedAssessment(null)} type="button">Close</button></div>
            <div className="medical-detail-grid">
              <span>Donor<strong>{selectedAssessment.donor_name}</strong></span>
              <span>Blood group<strong>{selectedAssessment.blood_group || "-"}</strong></span>
              <span>Donation date<strong>{selectedAssessment.assessment_date?.slice(0, 10)}</strong></span>
              <span>Submitted at<strong>{selectedAssessment.donation_created_at ? new Date(selectedAssessment.donation_created_at).toLocaleString() : "-"}</strong></span>
              <span>Hemoglobin<strong>{selectedAssessment.hemoglobin || "-"} g/dL</strong></span>
              <span>Weight<strong>{selectedAssessment.weight || "-"} kg</strong></span>
              <span>Blood bag barcode<strong>{selectedAssessment.blood_bag_barcode || "-"}</strong></span>
              <span>Volume<strong>{selectedAssessment.volume_ml || "-"} ml</strong></span>
              <span>Current stock<strong>{selectedAssessment.available_units ?? "-" } bag(s)</strong></span>
              <span>Next eligible date<strong>{selectedAssessment.next_eligible_date || "-"}</strong></span>
              <span>Eligibility<strong>{selectedAssessment.eligibility}</strong></span>
            </div>
            <p><b>Screening:</b> {selectedAssessment.pre_screening}</p>
            <p><b>Notes:</b> {selectedAssessment.notes || "No notes"}</p>
          </section>
        )}
      </section>
    </main>
  );
}

export default MedicalStaffDashboard;
