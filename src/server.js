import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import propertyRoutes from './routes/propertyRoutes.js';
import riskRoutes from './routes/riskRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import temporalRoutes from './routes/temporalRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import mlRiskRoutes from './routes/mlRiskRoutes.js';

dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/temporal', temporalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ml-risk', mlRiskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
