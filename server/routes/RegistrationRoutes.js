const express = require("express");
const router = express.Router();
const RegController = require("../controllers/RegistrationController");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");

// Student registers/unregisters (must be authenticated)
router.post("/:eventId/register", authenticate, RegController.registerForEvent);
router.delete("/:eventId/unregister", authenticate, RegController.unregisterFromEvent);

// Student views own registrations
router.get("/me", authenticate, RegController.getUserRegistrations);

// Admin/Faculty views registrations for an event
router.get("/:eventId", authenticate, authorizeRoles("admin", "faculty"), RegController.getEventRegistrations);

module.exports = router;
