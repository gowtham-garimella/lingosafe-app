import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendOtp, verifyOtp } from './controllers/otpController';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - allowing Next.js local servers
app.use(cors({
  origin: '*', // Allow all for demo purposes, or specify ['http://localhost:3000', 'http://127.0.0.1:3000']
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'OTP Service is running.' });
});

app.post('/api/send-otp', sendOtp);
app.post('/api/verify-otp', verifyOtp);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ 
    error: 'An unexpected server error occurred.' 
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Multilingual OTP Backend running on: http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${process.env.SMTP_HOST ? 'Production SMTP Mailer' : 'Local Email Console Simulator'}`);
  console.log(`📁 Database Path Check: Configured in .env file`);
  console.log(`======================================================\n`);
});
