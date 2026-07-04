import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import errorHandler from './middleware/errorHandler.js';
import { authenticate, adminOnly } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bankRoutes from './routes/banks.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
const corsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:5174', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => res.redirect('/api-docs'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/banks', authenticate, bankRoutes);
app.use('/api/v1/accounts', authenticate, accountRoutes);
app.use('/api/v1/transactions', authenticate, transactionRoutes);

const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.use((req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/api-docs')) {
    res.sendFile(path.join(distPath, 'index.html'));
  }
});

app.use(errorHandler);

export default app;
