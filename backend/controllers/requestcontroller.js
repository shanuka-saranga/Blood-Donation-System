const db = require("../config/db");

exports.createRequest = async (req, res) => {
  const {
    patientName, bloodGroup, unitsRequired, hospitalName, city,
    contactNumber, urgencyLevel, requiredDate,
  } = req.body;
  const units = Number(unitsRequired);

  if (
    !patientName?.trim()
    || !["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].includes(bloodGroup)
    || !Number.isFinite(units)
    || units <= 0
    || !hospitalName?.trim()
    || !city?.trim()
    || !contactNumber?.trim()
    || !requiredDate
  ) {
    return res.status(400).json({ message: "Please complete all blood request details." });
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
    return res.status(500).json({ message: "Unable to submit blood request.", error: error.message });
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
         AND LOWER(TRIM(requests.status)) = 'pending'
       ORDER BY FIELD(
                  LOWER(COALESCE(NULLIF(requests.urgency_level, ''), requests.urgency, 'standard')),
                  'critical', 'urgent', 'high', 'standard', 'low'
                ),
                requests.created_at DESC`,
      [req.user.id],
    );

    return res.status(200).json({ requests: rows });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load matching requests.", error: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const [result] = await db.query(
      `UPDATE blood_requests
       SET status = 'accepted', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'pending'`,
      [req.user.id, req.params.requestId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "This request is no longer available." });
    }

    return res.status(200).json({ message: "Request accepted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to accept request.", error: error.message });
  }
};
