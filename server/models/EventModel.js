const db = require("../config");

// Create Event
exports.createEvent = (eventData, callback) => {
  const sql = `INSERT INTO events (title, description, date, location, created_by) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [
    eventData.title,
    eventData.description,
    eventData.date,
    eventData.location,
    eventData.created_by
  ], callback);
};

// Get All Events
exports.getAllEvents = (callback) => {
  db.query(`SELECT * FROM events ORDER BY date ASC`, callback);
};

// Get Single Event
exports.getEventById = (id, callback) => {
  db.query(`SELECT * FROM events WHERE id = ?`, [id], callback);
};

// Update Event
exports.updateEvent = (id, eventData, callback) => {
  const sql = `UPDATE events SET title=?, description=?, date=?, location=? WHERE id=?`;
  db.query(sql, [
    eventData.title,
    eventData.description,
    eventData.date,
    eventData.location,
    id
  ], callback);
};

// Delete Event
exports.deleteEvent = (id, callback) => {
  db.query(`DELETE FROM events WHERE id = ?`, [id], callback);
};
