const Registration = require("../models/RegistrationModel");

exports.registerForEvent = (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const userId = req.user.id;

  Registration.createRegistration(eventId, userId, (err, result) => {
    if (err) {
      // unique constraint violation -> already registered
      if (err.code === "ER_DUP_ENTRY")
        return res.status(400).json({ message: "Already registered" });
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Registered successfully", id: result.insertId });
  });
};

exports.unregisterFromEvent = (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  const userId = req.user.id;

  Registration.deleteRegistration(eventId, userId, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Registration not found" });
    res.json({ message: "Unregistered successfully" });
  });
};

exports.getEventRegistrations = (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);
  Registration.getRegistrationsByEvent(eventId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getUserRegistrations = (req, res) => {
  const userId = req.user.id;
  Registration.getRegistrationsByUser(userId, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
