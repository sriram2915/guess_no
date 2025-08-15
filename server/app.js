const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Auth routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('EventSphere backend running!');
});

const eventRoutes = require("./routes/EventRoutes");
app.use("/api/events", eventRoutes);

const regRoutes = require("./routes/RegistrationRoutes");
app.use("/api/registrations", regRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});