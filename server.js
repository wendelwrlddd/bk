import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import criarPix from './api/criar-pix.js';
import checarStatus from './api/checar-status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));
app.use(express.static(join(__dirname, 'public'))); // Fallback for static files not in dist if needed

// API Routes
app.post('/api/criar-pix', criarPix);
app.get('/api/checar-status', checarStatus);
app.post('/api/log', (req, res) => {
    const { type, message, data } = req.body;
    console.log(`[CLIENT-LOG] [${type.toUpperCase()}] ${message}`, data || '');
    res.status(200).send('Logged');
});

// SPA Fallback - Serve index.html for any unknown route
app.get(/(.*)/, (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
