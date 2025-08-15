import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";

export default function EventManager() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", date: "", location: "" });
  const [editingId, setEditingId] = useState(null);

  const API_URL = "http://localhost:5000/api/events";

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(API_URL);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, { ...form, created_by: user.id });
      }
      setForm({ title: "", description: "", date: "", location: "" });
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title,
      description: event.description,
      date: event.date.split("T")[0],
      location: event.location
    });
    setEditingId(event.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow mt-6">
      <h3 className="text-lg font-bold mb-3">Event Manager</h3>

      {/* Only Admin/Faculty can create/edit events */}
      {(user?.role === "admin" || user?.role === "faculty") && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3">
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={form.title}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />
          <textarea
            name="description"
            placeholder="Event Description"
            value={form.description}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          ></textarea>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
            className="border p-2 w-full rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingId ? "Update Event" : "Create Event"}
          </button>
        </form>
      )}

      {/* Event List */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Location</th>
            {(user?.role === "admin" || user?.role === "faculty") && (
              <th className="p-2 border">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id}>
              <td className="p-2 border">{ev.title}</td>
              <td className="p-2 border">{ev.description}</td>
              <td className="p-2 border">{new Date(ev.date).toLocaleDateString()}</td>
              <td className="p-2 border">{ev.location}</td>
              {(user?.role === "admin" || user?.role === "faculty") && (
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleEdit(ev)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
