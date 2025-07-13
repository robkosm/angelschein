import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Set up DB with default data
const adapter = new JSONFile('db/db.json');
const defaultData = { messages: [] };
const db = new Low(adapter, defaultData);
await db.read();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/messages', (req, res) => {
    res.json(db.data.messages);
});

app.post('/api/messages', async (req, res) => {
    const { text } = req.body;
    const newMessage = { id: Date.now(), text };
    db.data.messages.push(newMessage);
    await db.write();
    res.json({ success: true, message: newMessage });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
