const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'ctf-secret-key-12345',
    resave: false,
    saveUninitialized: false
}));

// Preload basic challenges if not exist
const checkChals = db.prepare('SELECT count(*) as count FROM challenges').get();
if (checkChals.count === 0) {
    const initialChallenges = [
        { title: 'Welcome', description: 'The flag is in the source code of this page... or just here: FLAG{welcome_to_the_ctf}', flag: 'FLAG{welcome_to_the_ctf}', points: 10, category: 'Misc' },
        { title: 'Base64', description: 'Can you decode this? RkxBR3tiYXNlNjRfcm9ja3N9', flag: 'FLAG{base64_rocks}', points: 50, category: 'Crypto' },
        { title: 'Cookies', description: 'Check your cookies for something interesting.', flag: 'FLAG{cookie_monster}', points: 100, category: 'Web' }
    ];
    const insert = db.prepare('INSERT INTO challenges (title, description, flag, points, category) VALUES (?, ?, ?, ?, ?)');
    initialChallenges.forEach(c => insert.run(c.title, c.description, c.flag, c.points, c.category));
}

// Middleware
const auth = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/login');
};

const adminAuth = (req, res, next) => {
    if (req.session.userId && req.session.isAdmin) return next();
    res.status(403).send('Forbidden');
};

// Routes
app.get('/', (req, res) => {
    const user = req.session.userId ? { username: req.session.username, is_admin: req.session.isAdmin } : null;
    res.render('index', { user });
});

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // First user to register with username 'admin' will be admin
        const isAdmin = (username === 'admin' ? 1 : 0);
        db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run(username, hashedPassword, isAdmin);
        res.redirect('/login');
    } catch (e) {
        res.render('register', { error: 'Username already exists or error occurred.' });
    }
});

app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.isAdmin = !!user.is_admin;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid credentials' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/challenges', auth, (req, res) => {
    const challenges = db.prepare(`
        SELECT c.*, (SELECT 1 FROM submissions s WHERE s.challenge_id = c.id AND s.user_id = ?) as solved
        FROM challenges c
    `).all(req.session.userId);
    res.render('challenges', { challenges, user: req.session });
});

app.get('/challenge/:id', auth, (req, res) => {
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
    if (!challenge) return res.status(404).send('Challenge not found');

    const solved = db.prepare('SELECT 1 FROM submissions WHERE challenge_id = ? AND user_id = ?').get(challenge.id, req.session.userId);
    
    // Specifically for the Cookie challenge
    if (challenge.title === 'Cookies') {
        res.cookie('flag', 'FLAG{cookie_monster}', { httpOnly: false });
    }

    res.render('challenge', { challenge, solved: !!solved, user: req.session });
});

app.post('/submit', auth, (req, res) => {
    const { challenge_id, flag } = req.body;
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge_id);
    if (challenge && challenge.flag === flag) {
        const alreadySolved = db.prepare('SELECT * FROM submissions WHERE user_id = ? AND challenge_id = ?').get(req.session.userId, challenge_id);
        if (!alreadySolved) {
            db.prepare('INSERT INTO submissions (user_id, challenge_id) VALUES (?, ?)').run(req.session.userId, challenge_id);
        }
        res.redirect(`/challenge/${challenge_id}`);
    } else {
        res.render('challenge', { 
            challenge: db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge_id),
            error: 'Wrong flag! Try again.',
            solved: false,
            user: req.session
        });
    }
});

// Admin routes
app.get('/admin', adminAuth, (req, res) => {
    const challenges = db.prepare('SELECT * FROM challenges').all();
    res.render('admin/dashboard', { challenges });
});

app.post('/admin/add-challenge', adminAuth, (req, res) => {
    const { title, description, flag, points, category } = req.body;
    db.prepare('INSERT INTO challenges (title, description, flag, points, category) VALUES (?, ?, ?, ?, ?)').run(title, description, flag, points, category);
    res.redirect('/admin');
});

app.post('/admin/delete-challenge', adminAuth, (req, res) => {
    db.prepare('DELETE FROM challenges WHERE id = ?').run(req.body.id);
    res.redirect('/admin');
});

module.exports = app;

if (require.main === module) {
    app.listen(port, '0.0.0.0', () => {
        console.log(`CTF app listening at http://0.0.0.0:${port}`);
    });
}
