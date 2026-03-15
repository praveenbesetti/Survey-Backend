import express from 'express';
import { connectDB } from './db/connection.js';
import Routes from './routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. Added cookie parser
import dotenv from 'dotenv';

dotenv.config(); // 2. Load env at the very top to fix JWT Secret error

const app = express();

const corsOptions = {
  // Add BOTH your domain and any mobile app origins
  origin: [
    "https://hariyalimart.duckdns.org", // Your frontend domain
    "https://web-app-backend.duckdns.org",
    "http://localhost:5173" // Keep for local development
  ],
  credentials: true, // Required for cookies/sessions
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser()); // 4. Use cookie parser before routes

connectDB();

app.use('/api', Routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HariyaliMart Server running on port ${PORT}`));