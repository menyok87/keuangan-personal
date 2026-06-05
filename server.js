import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'keuangan-personal-secret-key-2024';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// =================================================
// DATABASE CONNECTION
// =================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'keuangan_personal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test koneksi database
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Gagal koneksi ke PostgreSQL:', err.message);
    console.error('   Pastikan PostgreSQL berjalan dan konfigurasi DB sudah benar');
  } else {
    console.log('✅ Berhasil terhubung ke PostgreSQL');
    release();
  }
});

// =================================================
// MIDDLEWARE
// =================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// =================================================
// AUTH MIDDLEWARE
// =================================================

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

// =================================================
// AUTH ROUTES
// =================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  try {
    // Cek email sudah terdaftar
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at',
      [email.toLowerCase().trim(), password_hash, full_name || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, occupation, phone, location, bio, avatar_url FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Gagal login' });
  }
});

// Get current user
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, occupation, phone, location, bio, avatar_url, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

// =================================================
// PROFILE ROUTES
// =================================================

app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, occupation, phone, location, bio, avatar_url, created_at, updated_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Profil tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Gagal mengambil profil' });
  }
});

app.put('/api/profile', authenticate, async (req, res) => {
  const { full_name, occupation, phone, location, bio, avatar_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        occupation = COALESCE($2, occupation),
        phone = COALESCE($3, phone),
        location = COALESCE($4, location),
        bio = COALESCE($5, bio),
        avatar_url = COALESCE($6, avatar_url),
        updated_at = now()
       WHERE id = $7
       RETURNING id, email, full_name, occupation, phone, location, bio, avatar_url, updated_at`,
      [full_name, occupation, phone, location, bio, avatar_url, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Gagal update profil' });
  }
});

// =================================================
// TRANSACTIONS ROUTES
// =================================================

app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Gagal mengambil transaksi' });
  }
});

app.post('/api/transactions', authenticate, async (req, res) => {
  const {
    amount, description, category, subcategory, type, date,
    payment_method, tags, notes, location, is_recurring, recurring_frequency
  } = req.body;

  if (!amount || !description || !category || !type || !date) {
    return res.status(400).json({ error: 'Field wajib: amount, description, category, type, date' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions
        (user_id, amount, description, category, subcategory, type, date,
         payment_method, tags, notes, location, is_recurring, recurring_frequency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.userId, amount, description, category, subcategory || null,
        type, date, payment_method || 'cash',
        tags || [], notes || null, location || null,
        is_recurring || false, is_recurring ? recurring_frequency : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Gagal menyimpan transaksi' });
  }
});

app.put('/api/transactions/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const {
    amount, description, category, subcategory, type, date,
    payment_method, tags, notes, location, is_recurring, recurring_frequency
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions SET
        amount = COALESCE($1, amount),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        subcategory = $4,
        type = COALESCE($5, type),
        date = COALESCE($6, date),
        payment_method = COALESCE($7, payment_method),
        tags = COALESCE($8, tags),
        notes = $9,
        location = $10,
        is_recurring = COALESCE($11, is_recurring),
        recurring_frequency = $12,
        updated_at = now()
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [
        amount, description, category, subcategory || null,
        type, date, payment_method, tags || null, notes || null,
        location || null, is_recurring,
        is_recurring ? recurring_frequency : null,
        id, req.userId
      ]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Gagal mengupdate transaksi' });
  }
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Gagal menghapus transaksi' });
  }
});

// =================================================
// BUDGETS ROUTES
// =================================================

app.get('/api/budgets', authenticate, async (req, res) => {
  try {
    const budgets = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    // Hitung spent per kategori
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const startOfYear = `${now.getFullYear()}-01-01`;

    const result = await Promise.all(
      budgets.rows.map(async (budget) => {
        const startDate = budget.period === 'yearly' ? startOfYear : startOfMonth;
        const spent_result = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) as spent
           FROM transactions
           WHERE user_id = $1 AND category = $2 AND type = 'expense' AND date >= $3`,
          [req.userId, budget.category, startDate]
        );
        const spent = parseFloat(spent_result.rows[0].spent);
        const remaining = Math.max(budget.amount - spent, 0);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        return { ...budget, spent, remaining, percentage };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('Get budgets error:', err);
    res.status(500).json({ error: 'Gagal mengambil anggaran' });
  }
});

app.post('/api/budgets', authenticate, async (req, res) => {
  const { category, amount, period } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ error: 'Field wajib: category, amount' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO budgets (user_id, category, amount, period) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.userId, category, amount, period || 'monthly']
    );
    const budget = result.rows[0];
    res.status(201).json({ ...budget, spent: 0, remaining: budget.amount, percentage: 0 });
  } catch (err) {
    console.error('Create budget error:', err);
    res.status(500).json({ error: 'Gagal menyimpan anggaran' });
  }
});

app.put('/api/budgets/:id', authenticate, async (req, res) => {
  const { category, amount, period } = req.body;
  try {
    const result = await pool.query(
      `UPDATE budgets SET
        category = COALESCE($1, category),
        amount = COALESCE($2, amount),
        period = COALESCE($3, period),
        updated_at = now()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [category, amount, period, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anggaran tidak ditemukan' });

    const budget = result.rows[0];
    const now = new Date();
    const startDate = budget.period === 'yearly'
      ? `${now.getFullYear()}-01-01`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const spent_result = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as spent
       FROM transactions
       WHERE user_id = $1 AND category = $2 AND type = 'expense' AND date >= $3`,
      [req.userId, budget.category, startDate]
    );
    const spent = parseFloat(spent_result.rows[0].spent);
    const remaining = Math.max(budget.amount - spent, 0);
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    res.json({ ...budget, spent, remaining, percentage });
  } catch (err) {
    console.error('Update budget error:', err);
    res.status(500).json({ error: 'Gagal mengupdate anggaran' });
  }
});

app.delete('/api/budgets/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Anggaran tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Gagal menghapus anggaran' });
  }
});

// =================================================
// FINANCIAL GOALS ROUTES
// =================================================

app.get('/api/goals', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Gagal mengambil target keuangan' });
  }
});

app.post('/api/goals', authenticate, async (req, res) => {
  const { title, target_amount, current_amount, deadline, category, priority } = req.body;

  if (!title || !target_amount || !deadline || !category) {
    return res.status(400).json({ error: 'Field wajib: title, target_amount, deadline, category' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO financial_goals
        (user_id, title, target_amount, current_amount, deadline, category, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.userId, title, target_amount, current_amount || 0, deadline, category, priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Gagal menyimpan target keuangan' });
  }
});

app.put('/api/goals/:id', authenticate, async (req, res) => {
  const { title, target_amount, current_amount, deadline, category, priority } = req.body;
  try {
    const result = await pool.query(
      `UPDATE financial_goals SET
        title = COALESCE($1, title),
        target_amount = COALESCE($2, target_amount),
        current_amount = COALESCE($3, current_amount),
        deadline = COALESCE($4, deadline),
        category = COALESCE($5, category),
        priority = COALESCE($6, priority),
        updated_at = now()
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [title, target_amount, current_amount, deadline, category, priority, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Target keuangan tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Gagal mengupdate target keuangan' });
  }
});

app.delete('/api/goals/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Target keuangan tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Gagal menghapus target keuangan' });
  }
});

// =================================================
// DEBTS ROUTES
// =================================================

app.get('/api/debts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get debts error:', err);
    res.status(500).json({ error: 'Gagal mengambil data hutang' });
  }
});

app.post('/api/debts', authenticate, async (req, res) => {
  const {
    creditor_name, debtor_name, amount, description,
    due_date, status, type, interest_rate
  } = req.body;

  if (!creditor_name || !amount || !description || !type) {
    return res.status(400).json({ error: 'Field wajib: creditor_name, amount, description, type' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO debts
        (user_id, creditor_name, debtor_name, amount, remaining_amount, description,
         due_date, status, type, interest_rate)
       VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        req.userId, creditor_name, debtor_name || null, amount,
        description, due_date || null, status || 'pending',
        type, interest_rate || 0
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create debt error:', err);
    res.status(500).json({ error: 'Gagal menyimpan hutang' });
  }
});

app.put('/api/debts/:id', authenticate, async (req, res) => {
  const {
    creditor_name, debtor_name, amount, description,
    due_date, status, type, interest_rate
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE debts SET
        creditor_name = COALESCE($1, creditor_name),
        debtor_name = $2,
        amount = COALESCE($3, amount),
        description = COALESCE($4, description),
        due_date = $5,
        status = COALESCE($6, status),
        type = COALESCE($7, type),
        interest_rate = COALESCE($8, interest_rate),
        updated_at = now()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        creditor_name, debtor_name || null, amount, description,
        due_date || null, status, type, interest_rate,
        req.params.id, req.userId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hutang tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update debt error:', err);
    res.status(500).json({ error: 'Gagal mengupdate hutang' });
  }
});

app.delete('/api/debts/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Hutang tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete debt error:', err);
    res.status(500).json({ error: 'Gagal menghapus hutang' });
  }
});

// =================================================
// DEBT PAYMENTS ROUTES
// =================================================

app.get('/api/debts/:debtId/payments', authenticate, async (req, res) => {
  try {
    // Pastikan debt milik user
    const debtCheck = await pool.query(
      'SELECT id FROM debts WHERE id = $1 AND user_id = $2',
      [req.params.debtId, req.userId]
    );
    if (debtCheck.rows.length === 0) return res.status(404).json({ error: 'Hutang tidak ditemukan' });

    const result = await pool.query(
      'SELECT * FROM debt_payments WHERE debt_id = $1 ORDER BY payment_date DESC',
      [req.params.debtId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get payments error:', err);
    res.status(500).json({ error: 'Gagal mengambil data pembayaran' });
  }
});

app.post('/api/debts/:debtId/payments', authenticate, async (req, res) => {
  const { amount, payment_date, notes } = req.body;

  if (!amount || !payment_date) {
    return res.status(400).json({ error: 'Field wajib: amount, payment_date' });
  }

  try {
    // Pastikan debt milik user dan cek remaining_amount
    const debtResult = await pool.query(
      'SELECT id, remaining_amount FROM debts WHERE id = $1 AND user_id = $2',
      [req.params.debtId, req.userId]
    );

    if (debtResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hutang tidak ditemukan' });
    }

    const debt = debtResult.rows[0];
    if (amount > debt.remaining_amount) {
      return res.status(400).json({
        error: `Jumlah pembayaran tidak boleh lebih dari sisa hutang (${debt.remaining_amount})`
      });
    }

    const result = await pool.query(
      'INSERT INTO debt_payments (debt_id, amount, payment_date, notes) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.debtId, amount, payment_date, notes || null]
    );

    // Trigger otomatis mengupdate remaining_amount dan status
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Gagal menyimpan pembayaran' });
  }
});

// =================================================
// HEALTH CHECK
// =================================================

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// =================================================
// SERVE STATIC FILES (PRODUCTION)
// =================================================

const listenPort = IS_PRODUCTION ? PORT : API_PORT;

if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn('⚠️  Folder dist tidak ditemukan. Jalankan: npm run build');
  }
}

// =================================================
// START SERVER
// =================================================

app.listen(listenPort, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 Keuangan Personal Server berjalan');
  console.log(`📡 Port: ${listenPort}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'keuangan_personal'}`);
  if (IS_PRODUCTION) {
    console.log(`🌐 Akses: http://localhost:${listenPort}`);
  } else {
    console.log(`📡 API Dev Server: http://localhost:${listenPort}/api`);
    console.log(`💡 Untuk frontend, jalankan: npm run dev`);
  }
  console.log('');
});
