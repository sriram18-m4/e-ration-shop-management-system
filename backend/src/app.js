const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const shopRoutes = require('./modules/shops/shop.routes');
const userRoutes = require('./modules/users/user.routes');
const beneficiaryRoutes = require('./modules/beneficiaries/beneficiary.routes');
const stockRoutes = require('./modules/stock/stock.routes');
const transactionRoutes = require('./modules/transactions/transaction.routes');
const chatRoutes = require('./modules/chat/chat.routes');

const app = express();

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (env.clientOrigins.includes(origin)) return callback(null, true);

  return callback(null, false);
}

app.use(helmet());
app.use(compression());
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', environment: env.nodeEnv });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
