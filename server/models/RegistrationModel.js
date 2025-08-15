const db = require("../config");

exports.createRegistration = (eventId, userId, cb) => {
  const sql = `INSERT INTO registrations (event_id, user_id) VALUES (?, ?)`;
  db.query(sql, [eventId, userId], cb);
};

exports.deleteRegistration = (eventId, userId, cb) => {
  const sql = `DELETE FROM registrations WHERE event_id = ? AND user_id = ?`;
  db.query(sql, [eventId, userId], cb);
};

exports.getRegistrationsByEvent = (eventId, cb) => {
  const sql = `
    SELECT r.id, r.registered_at, u.id as user_id, u.name, u.email
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    WHERE r.event_id = ?
    ORDER BY r.registered_at DESC
  `;
  db.query(sql, [eventId], cb);
};

exports.getRegistrationsByUser = (userId, cb) => {
  const sql = `
    SELECT r.id, r.registered_at, e.id as event_id, e.title, e.date, e.location
    FROM registrations r
    JOIN events e ON e.id = r.event_id
    WHERE r.user_id = ?
    ORDER BY r.registered_at DESC
  `;
  db.query(sql, [userId], cb);
};

exports.isRegistered = (eventId, userId, cb) => {
  const sql = `SELECT * FROM registrations WHERE event_id = ? AND user_id = ?`;
  db.query(sql, [eventId, userId], (err, results) => {
    if (err) return cb(err);
    cb(null, results.length > 0);
  });
};
