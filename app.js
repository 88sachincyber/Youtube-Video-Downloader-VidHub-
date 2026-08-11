const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const programRoutes = require('./routes/programRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const { sendSuccess } = require('./utils/apiResponse');

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok' }, 'Service healthy'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

module.exports = app;
