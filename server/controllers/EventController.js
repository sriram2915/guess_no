const Event = require("../models/EventModel");

exports.createEvent = (req, res) => {
  Event.createEvent(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Event created successfully", id: result.insertId });
  });
};

exports.getEvents = (req, res) => {
  Event.getAllEvents((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getEvent = (req, res) => {
  Event.getEventById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
};

exports.updateEvent = (req, res) => {
  Event.updateEvent(req.params.id, req.body, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Event updated successfully" });
  });
};

exports.deleteEvent = (req, res) => {
  Event.deleteEvent(req.params.id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Event deleted successfully" });
  });
};
