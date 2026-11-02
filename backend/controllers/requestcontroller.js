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
    const [[inventory]] = await db.query(
      "SELECT available_units FROM blood_inventory WHERE blood_group = ?",
      [bloodGroup],
    );
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

    await db.query(
      `INSERT INTO notifications (recipient_id, title, message)
       SELECT id, 'New blood request', ?
       FROM users WHERE role = 'admin'`,
      [
        `${bloodGroup} request for ${units} unit(s) was submitted by ${hospitalName.trim()}.`,
      ],
    );

    return res.status(201).json({
      message: "Blood request submitted successfully.",
      requestId: result.insertId,
      inventoryAvailable: Number(inventory?.available_units || 0) >= units,
      availableUnits: Number(inventory?.available_units || 0),
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
              status, required_date, created_at, updated_at, dispatched_at
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
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[request]] = await connection.query(
      `SELECT requests.id, requests.requester_id, requests.patient_name,
              requests.blood_group, requests.units_required, requests.hospital_name,
              requests.city, requests.contact_number, requests.required_date,
              requester.name AS requester_name
       FROM blood_requests AS requests
       INNER JOIN users AS requester ON requester.id = requests.requester_id
       WHERE requests.id = ?
         AND LOWER(TRIM(requests.status)) = 'pending'
         AND requests.requester_id <> ?
       FOR UPDATE`,
      [req.params.requestId, req.user.id],
    );

    if (!request) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "This request is no longer available." });
    }

    const [[donor]] = await connection.query(
      `SELECT users.name, users.email, COALESCE(NULLIF(donor_details.phone, ''), users.phone) AS phone
       FROM users
       LEFT JOIN donor_details ON donor_details.user_id = users.id
       WHERE users.id = ?`,
      [req.user.id],
    );

    await connection.query(
      `UPDATE blood_requests
       SET status = 'accepted', accepted_by = ?, accepted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, request.id],
    );

    await connection.query(
      `INSERT INTO notifications (recipient_id, title, message)
       VALUES (?, 'Donor accepted your blood request', ?)`,
      [
        request.requester_id,
        `ඔබගේ ලේ ඉල්ලීම සඳහා ${donor.name} දායක වීමට එකඟ විය. Donor contact: ${donor.phone || donor.email || "Not available"}.`,
      ],
    );

    await connection.query(
      `INSERT INTO notifications (recipient_id, title, message)
       VALUES (?, 'Blood donation confirmation', ?)`,
      [
        req.user.id,
        `You agreed to donate for ${request.patient_name}. Hospital: ${request.hospital_name}, ${request.city}. Contact person: ${request.requester_name}. Contact: ${request.contact_number}. Required date: ${request.required_date}.`,
      ],
    );

    await connection.commit();
    return res.status(200).json({
      message: "Request accepted successfully.",
      confirmation: {
        patientName: request.patient_name,
        hospitalName: request.hospital_name,
        city: request.city,
        contactPerson: request.requester_name,
        contactNumber: request.contact_number,
        requiredDate: request.required_date,
        bloodGroup: request.blood_group,
        unitsRequired: request.units_required,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return res
      .status(500)
      .json({ message: "Unable to accept request.", error: error.message });
  } finally {
    connection?.release();
  }
};

exports.reviewRequest = async (req, res) => {
  const isApproval = req.params.action === "approve";
  if (!isApproval && req.params.action !== "decline") {
    return res.status(400).json({ message: "Invalid blood request action." });
  }
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[request]] = await connection.query(
      `SELECT id, requester_id, blood_group, units_required, hospital_name
       FROM blood_requests
       WHERE id = ? AND LOWER(status) IN ('pending', 'open', 'active')
       FOR UPDATE`,
      [req.params.requestId],
    );
    if (!request) {
      await connection.rollback();
      return res.status(404).json({ message: "Active blood request not found." });
    }

    if (!isApproval) {
      await connection.query(
        "UPDATE blood_requests SET status = 'declined' WHERE id = ?",
        [request.id],
      );
      await connection.query(
        `INSERT INTO notifications (recipient_id, title, message)
         VALUES (?, 'Blood request declined', ?)`,
        [
          request.requester_id,
          `Your blood request for ${request.blood_group} at ${request.hospital_name} was declined by an administrator.`,
        ],
      );
      await connection.commit();
      return res.status(200).json({ message: "Blood request declined successfully." });
    }

    const [[inventory]] = await connection.query(
      "SELECT available_units FROM blood_inventory WHERE blood_group = ? FOR UPDATE",
      [request.blood_group],
    );
    const availableUnits = Number(inventory?.available_units || 0);
    if (!inventory || availableUnits < Number(request.units_required)) {
      await connection.rollback();
      return res.status(409).json({
        message: `Insufficient ${request.blood_group} stock. Available: ${availableUnits} bag(s); required: ${request.units_required}.`,
      });
    }

    await connection.query(
      "UPDATE blood_inventory SET available_units = available_units - ? WHERE blood_group = ?",
      [request.units_required, request.blood_group],
    );
    await connection.query(
      `UPDATE blood_requests
       SET status = 'dispatched', approved_by = ?, dispatched_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, request.id],
    );
    await connection.query(
      `INSERT INTO notifications (recipient_id, title, message)
       VALUES (?, 'Blood request dispatched', ?)`,
      [
        request.requester_id,
        `Your ${request.blood_group} blood request has been approved and dispatched. ${request.units_required} bag(s) were released from inventory.`,
      ],
    );
    await connection.commit();
    return res.status(200).json({
      message: "Blood request approved and dispatched successfully.",
      deductedUnits: Number(request.units_required),
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return res
      .status(500)
      .json({
        message: "Unable to review blood request.",
        error: error.message,
      });
  } finally {
    connection?.release();
  }
};
