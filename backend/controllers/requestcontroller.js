const db = require("../config/db");

exports.createRequest = async (req, res) => {
  const {
    patientName,
    bloodGroup,
    unitsRequired,
    hospitalName,
    city,
    contactNumber,
    urgencyLevel,
    requiredDate,
  } = req.body;
  const units = Number(unitsRequired);

  if (
    !patientName?.trim() ||
    !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup) ||
    !Number.isFinite(units) ||
    units <= 0 ||
    !hospitalName?.trim() ||
    !city?.trim() ||
    !contactNumber?.trim() ||
    !requiredDate
  ) {
    return res
      .status(400)
      .json({ message: "Please complete all blood request details." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO blood_requests
        (requester_id, patient_name, blood_group, units_required, hospital_name,
         city, contact_number, urgency_level, status, required_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        req.user.id,
        patientName.trim(),
        bloodGroup,
        units,
        hospitalName.trim(),
        city.trim(),
        contactNumber.trim(),
        urgencyLevel || "Standard",
        requiredDate,
      ],
    );

    return res.status(201).json({
      message: "Blood request submitted successfully.",
      requestId: result.insertId,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to submit blood request.",
        error: error.message,
      });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT id, patient_name, blood_group, units_required, hospital_name, city,
              contact_number, urgency_level,
              COALESCE(NULLIF(urgency_level, ''), urgency, 'standard') AS urgency,
              status, required_date, created_at
       FROM blood_requests
       WHERE requester_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id],
    );

    // Direct Array එකක් ලෙස යැවීම
    return res.status(200).json(requests);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to load your blood requests.",
        error: error.message,
      });
  }
};

exports.updateMyRequest = async (req, res) => {
  const {
    patientName,
    bloodGroup,
    unitsRequired,
    hospitalName,
    city,
    contactNumber,
    urgencyLevel,
    requiredDate,
  } = req.body;
  const units = Number(unitsRequired);
  if (
    !patientName?.trim() ||
    !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup) ||
    !Number.isFinite(units) ||
    units <= 0 ||
    !hospitalName?.trim() ||
    !city?.trim() ||
    !contactNumber?.trim() ||
    !requiredDate
  ) {
    return res
      .status(400)
      .json({ message: "Please complete all blood request details." });
  }
  try {
    const [result] = await db.query(
      `UPDATE blood_requests
       SET patient_name = ?, blood_group = ?, units_required = ?, hospital_name = ?,
           city = ?, contact_number = ?, urgency_level = ?, required_date = ?
       WHERE id = ? AND requester_id = ? AND LOWER(status) = 'pending'`,
      [
        patientName.trim(),
        bloodGroup,
        units,
        hospitalName.trim(),
        city.trim(),
        contactNumber.trim(),
        urgencyLevel || "Standard",
        requiredDate,
        req.params.requestId,
        req.user.id,
      ],
    );
    if (!result.affectedRows)
      return res
        .status(404)
        .json({ message: "Only your pending requests can be edited." });
    return res
      .status(200)
      .json({ message: "Blood request updated successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to update blood request.",
        error: error.message,
      });
  }
};

exports.deleteMyRequest = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM blood_requests WHERE id = ? AND requester_id = ? AND LOWER(status) = 'pending'",
      [req.params.requestId, req.user.id],
    );
    if (!result.affectedRows)
      return res
        .status(404)
        .json({ message: "Only your pending requests can be deleted." });
    return res
      .status(200)
      .json({ message: "Blood request deleted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to delete blood request.",
        error: error.message,
      });
  }
};

exports.getMatchingRequests = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT requests.id, requests.requester_id, requests.patient_name,
              requests.blood_group, requests.units_required, requests.hospital_name,
              requests.city, requests.contact_number,
              COALESCE(NULLIF(requests.urgency_level, ''), requests.urgency, 'standard') AS urgency,
              requests.status, requests.required_date, requests.created_at
       FROM blood_requests AS requests
       INNER JOIN donor_details AS donors
         ON (
           LOWER(TRIM(donors.blood_group)) = 'o-'
           OR (
             LOWER(TRIM(donors.blood_group)) = 'o+'
             AND LOWER(TRIM(requests.blood_group)) IN ('o+', 'a+', 'b+', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'a-'
             AND LOWER(TRIM(requests.blood_group)) IN ('a-', 'a+', 'ab-', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'a+'
             AND LOWER(TRIM(requests.blood_group)) IN ('a+', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'b-'
             AND LOWER(TRIM(requests.blood_group)) IN ('b-', 'b+', 'ab-', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'b+'
             AND LOWER(TRIM(requests.blood_group)) IN ('b+', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'ab-'
             AND LOWER(TRIM(requests.blood_group)) IN ('ab-', 'ab+')
           )
           OR (
             LOWER(TRIM(donors.blood_group)) = 'ab+'
             AND LOWER(TRIM(requests.blood_group)) = 'ab+'
           )
         )
       WHERE donors.user_id = ?
           AND (requests.requester_id IS NULL OR requests.requester_id <> ?)
           AND LOWER(TRIM(requests.status)) = 'pending'
       ORDER BY FIELD(
                  LOWER(COALESCE(NULLIF(requests.urgency_level, ''), requests.urgency, 'standard')),
                  'critical', 'urgent', 'high', 'standard', 'low'
                ),
                requests.created_at DESC`,
      [req.user.id, req.user.id],
    );

    return res.status(200).json({ requests: rows });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to load matching requests.",
        error: error.message,
      });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE blood_requests
       SET status = 'accepted', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending' AND (requester_id IS NULL OR requester_id <> ?)`,
      [req.user.id, req.params.requestId, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "This request is no longer available." });
    }

    return res.status(200).json({ message: "Request accepted successfully." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Unable to accept request.", error: error.message });
  }
};

exports.reviewRequest = async (req, res) => {
  const status = req.params.action === "approve" ? "approved" : "declined";
  try {
    const [result] = await db.query(
      "UPDATE blood_requests SET status = ? WHERE id = ? AND LOWER(status) IN ('pending', 'open', 'active')",
      [status, req.params.requestId],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ message: "Active blood request not found." });
    return res
      .status(200)
      .json({ message: `Blood request ${status} successfully.` });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Unable to review blood request.",
        error: error.message,
      });
  }
};
