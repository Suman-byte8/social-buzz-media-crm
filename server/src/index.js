const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const teamRoutes = require('./routes/teamRoutes');
const settingRoutes = require('./routes/settingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const taskRoutes = require('./routes/taskRoutes');
const meetingNoteRoutes = require('./routes/meetingNoteRoutes');
app.use('/api', authRoutes);
app.use('/api', clientRoutes);
app.use('/api', teamRoutes);
app.use('/api', settingRoutes);
app.use('/api', documentRoutes);
app.use('/api', taskRoutes);
app.use('/api', meetingNoteRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});