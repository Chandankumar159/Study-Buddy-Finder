const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data stores
const users = {};       // { userId: { id, name, subjects, schedule, messages } }
const sessions = {};    // { sessionToken: userId }

// Utility: Generate random IDs
function genId() {
  return Math.random().toString(36).substr(2, 9);
}

// ----------- 1. Login and Sign up with profile creation -----------
app.post('/signup', (req, res) => {
  const { name, subjects } = req.body;
  console.log('Received at backend:', req.body); // Debug log

  // Defensive: accept both array and comma-separated string for subjects (for robustness)
  let subjectsArr = subjects;
  if (typeof subjects === 'string') {
    subjectsArr = subjects.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!name || !Array.isArray(subjectsArr) || subjectsArr.length === 0) {
    return res.status(400).json({ error: 'Name and subjects required' });
  }
  const id = genId();
  users[id] = {
    id,
    name,
    subjects: subjectsArr,
    schedule: [],
    messages: []
  };
  return res.json({ userId: id });
});

app.post('/login', (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) {
    return res.status(404).json({ error: 'User not found' });
  }
  const sessionToken = genId();
  sessions[sessionToken] = userId;
  return res.json({ sessionToken });
});

// ----------- 2. List subjects and find matched buddies -----------
app.get('/subjects', (req, res) => {
  // List all subjects in the system
  const allSubjects = new Set();
  Object.values(users).forEach(u => u.subjects.forEach(s => allSubjects.add(s)));
  return res.json({ subjects: Array.from(allSubjects) });
});

app.get('/buddies', (req, res) => {
  const { sessiontoken } = req.headers;
  const userId = sessions[sessiontoken];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = users[userId];
  // Find users with at least one matching subject, excluding self
  const matches = Object.values(users).filter(
    u => u.id !== userId && u.subjects.some(sub => user.subjects.includes(sub))
  );
  return res.json({ matches });
});

// ----------- 3. Smart algorithm for buddy recommendations -----------
app.get('/recommendations', (req, res) => {
  const { sessiontoken } = req.headers;
  const userId = sessions[sessiontoken];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = users[userId];
  // Recommend users with the most subjects in common
  const recommendations = Object.values(users)
    .filter(u => u.id !== userId)
    .map(u => ({
      id: u.id,
      name: u.name,
      commonSubjects: u.subjects.filter(sub => user.subjects.includes(sub)),
      commonCount: u.subjects.filter(sub => user.subjects.includes(sub)).length
    }))
    .filter(r => r.commonCount > 0)
    .sort((a, b) => b.commonCount - a.commonCount);
  return res.json({ recommendations });
});

// ----------- 4. In-app chat for planning and discussion -----------
app.post('/message', (req, res) => {
  const { sessiontoken } = req.headers;
  const { toUserId, text } = req.body;
  const fromUserId = sessions[sessiontoken];
  if (!fromUserId || !users[toUserId]) return res.status(400).json({ error: 'Invalid users' });
  const message = {
    id: genId(),
    from: fromUserId,
    to: toUserId,
    text,
    timestamp: Date.now()
  };
  users[toUserId].messages.push(message);
  users[fromUserId].messages.push(message); // Save in both inboxes
  return res.json({ success: true, message });
});

app.get('/messages', (req, res) => {
  const { sessiontoken } = req.headers;
  const userId = sessions[sessiontoken];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ messages: users[userId].messages });
});

// ----------- 5. Study schedule planner with reminders -----------
app.post('/schedule', (req, res) => {
  const { sessiontoken } = req.headers;
  const userId = sessions[sessiontoken];
  const { title, datetime } = req.body;
  if (!userId || !title || !datetime) return res.status(400).json({ error: 'Missing fields' });
  const reminder = {
    id: genId(),
    title,
    datetime, // ISO string
    created: Date.now()
  };
  users[userId].schedule.push(reminder);
  return res.json({ reminder });
});

app.get('/schedule', (req, res) => {
  const { sessiontoken } = req.headers;
  const userId = sessions[sessiontoken];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  return res.json({ schedule: users[userId].schedule });
});

// ----------- Start server -----------
app.listen(PORT, () => {
  console.log(`Study Buddy Finder backend running on port ${PORT}`);
});