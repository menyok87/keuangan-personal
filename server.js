import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cors from 'cors';
import 'dotenv/config';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'keuangan_personal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login ulang.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah expired. Silakan login ulang.' });
  }
};

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter.' });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email.toLowerCase().trim(), password_hash]
    );
    const user = result.rows[0];

    // Update full_name jika disediakan (trigger sudah buat profile row)
    if (full_name && full_name.trim()) {
      await client.query(
        'UPDATE user_profiles SET full_name = $1 WHERE id = $2',
        [full_name.trim(), user.id]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, full_name: full_name?.trim() || null, created_at: user.created_at }
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi.' });
  } finally {
    if (client) client.release();
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi.' });
  }
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.password_hash, u.created_at, p.full_name, p.avatar_url FROM users u LEFT JOIN user_profiles p ON p.id = u.id WHERE u.email = $1',
      [email.toLowerCase().trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url, created_at: user.created_at }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan saat login.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.email, u.created_at, p.full_name, p.avatar_url, p.occupation, p.phone, p.location, p.bio FROM users u LEFT JOIN user_profiles p ON p.id = u.id WHERE u.id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ error: 'Terjadi kesalahan.' });
  }
});

// ============================================================
// TRANSACTIONS ROUTES
// ============================================================

// GET /api/transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get transactions error:', err.message);
    res.status(500).json({ error: 'Gagal memuat transaksi.' });
  }
});

// POST /api/transactions
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { amount, description, category, subcategory, type, date, payment_method, tags, notes, location, is_recurring, recurring_frequency } = req.body;

  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Jumlah transaksi harus lebih dari 0.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Deskripsi transaksi wajib diisi.' });
  if (!category?.trim()) return res.status(400).json({ error: 'Kategori transaksi wajib dipilih.' });
  if (!type || !['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Tipe transaksi tidak valid.' });
  if (!date) return res.status(400).json({ error: 'Tanggal transaksi wajib diisi.' });

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, description, category, subcategory, type, date, payment_method, tags, notes, location, is_recurring, recurring_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        req.user.id,
        Number(amount),
        description.trim(),
        category.trim(),
        subcategory?.trim() || null,
        type,
        date,
        payment_method || 'cash',
        Array.isArray(tags) ? tags : [],
        notes?.trim() || null,
        location?.trim() || null,
        Boolean(is_recurring),
        is_recurring ? recurring_frequency : null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add transaction error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan transaksi.' });
  }
});

// PUT /api/transactions/:id
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount, description, category, subcategory, type, date, payment_method, tags, notes, location, is_recurring, recurring_frequency } = req.body;

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
        amount !== undefined ? Number(amount) : null,
        description?.trim() || null,
        category?.trim() || null,
        subcategory?.trim() || null,
        type || null,
        date || null,
        payment_method || null,
        Array.isArray(tags) ? tags : null,
        notes?.trim() || null,
        location?.trim() || null,
        is_recurring !== undefined ? Boolean(is_recurring) : null,
        is_recurring ? recurring_frequency : null,
        id,
        req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err.message);
    res.status(500).json({ error: 'Gagal mengupdate transaksi.' });
  }
});

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus transaksi.' });
  }
});

// ============================================================
// BUDGETS ROUTES
// ============================================================

// GET /api/budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.*,
        COALESCE(SUM(t.amount), 0)::DECIMAL(15,2) AS spent,
        GREATEST(b.amount - COALESCE(SUM(t.amount), 0), 0)::DECIMAL(15,2) AS remaining,
        CASE WHEN b.amount > 0 THEN ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 2) ELSE 0 END AS percentage
      FROM budgets b
      LEFT JOIN transactions t ON
        t.user_id = b.user_id
        AND t.category = b.category
        AND t.type = 'expense'
        AND t.date >= CASE
          WHEN b.period = 'monthly' THEN date_trunc('month', CURRENT_DATE)::date
          WHEN b.period = 'yearly'  THEN date_trunc('year',  CURRENT_DATE)::date
        END
      WHERE b.user_id = $1
      GROUP BY b.id
      ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get budgets error:', err.message);
    res.status(500).json({ error: 'Gagal memuat anggaran.' });
  }
});

// POST /api/budgets
app.post('/api/budgets', authenticateToken, async (req, res) => {
  const { category, amount, period } = req.body;
  if (!category?.trim()) return res.status(400).json({ error: 'Kategori anggaran wajib dipilih.' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Jumlah anggaran harus lebih dari 0.' });

  try {
    const existing = await pool.query(
      'SELECT id FROM budgets WHERE user_id = $1 AND category = $2 AND period = $3',
      [req.user.id, category.trim(), period || 'monthly']
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Anggaran untuk kategori "${category}" pada periode ini sudah ada.` });
    }

    const result = await pool.query(
      'INSERT INTO budgets (user_id, category, amount, period) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, category.trim(), Number(amount), period || 'monthly']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add budget error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan anggaran.' });
  }
});

// PUT /api/budgets/:id
app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
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
      [category?.trim() || null, amount !== undefined ? Number(amount) : null, period || null, id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anggaran tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update budget error:', err.message);
    res.status(500).json({ error: 'Gagal mengupdate anggaran.' });
  }
});

// DELETE /api/budgets/:id
app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Anggaran tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus anggaran.' });
  }
});

// ============================================================
// FINANCIAL GOALS ROUTES
// ============================================================

// GET /api/goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get goals error:', err.message);
    res.status(500).json({ error: 'Gagal memuat target keuangan.' });
  }
});

// POST /api/goals
app.post('/api/goals', authenticateToken, async (req, res) => {
  const { title, target_amount, current_amount, deadline, category, priority } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Judul target wajib diisi.' });
  if (!target_amount || Number(target_amount) <= 0) return res.status(400).json({ error: 'Target jumlah harus lebih dari 0.' });
  if (!deadline) return res.status(400).json({ error: 'Batas waktu target wajib diisi.' });
  if (!category?.trim()) return res.status(400).json({ error: 'Kategori target wajib dipilih.' });

  try {
    const result = await pool.query(
      `INSERT INTO financial_goals (user_id, title, target_amount, current_amount, deadline, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        title.trim(),
        Number(target_amount),
        Number(current_amount || 0),
        deadline,
        category.trim(),
        priority || 'medium'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add goal error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan target keuangan.' });
  }
});

// PUT /api/goals/:id
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
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
      [
        title?.trim() || null,
        target_amount !== undefined ? Number(target_amount) : null,
        current_amount !== undefined ? Number(current_amount) : null,
        deadline || null,
        category?.trim() || null,
        priority || null,
        id,
        req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target keuangan tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update goal error:', err.message);
    res.status(500).json({ error: 'Gagal mengupdate target keuangan.' });
  }
});

// DELETE /api/goals/:id
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM financial_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Target keuangan tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete goal error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus target keuangan.' });
  }
});

// ============================================================
// DEBTS ROUTES
// ============================================================

// GET /api/debts
app.get('/api/debts', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM debts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get debts error:', err.message);
    res.status(500).json({ error: 'Gagal memuat data hutang.' });
  }
});

// POST /api/debts
app.post('/api/debts', authenticateToken, async (req, res) => {
  const { creditor_name, debtor_name, amount, description, due_date, status, type, interest_rate } = req.body;
  if (!creditor_name?.trim()) return res.status(400).json({ error: 'Nama kreditor wajib diisi.' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Jumlah hutang harus lebih dari 0.' });
  if (!description?.trim()) return res.status(400).json({ error: 'Deskripsi hutang wajib diisi.' });
  if (!type || !['debt', 'receivable'].includes(type)) return res.status(400).json({ error: 'Tipe hutang tidak valid.' });

  try {
    const result = await pool.query(
      `INSERT INTO debts (user_id, creditor_name, debtor_name, amount, remaining_amount, description, due_date, status, type, interest_rate)
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        creditor_name.trim(),
        debtor_name?.trim() || null,
        Number(amount),
        description.trim(),
        due_date || null,
        status || 'pending',
        type,
        Number(interest_rate || 0)
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add debt error:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan data hutang.' });
  }
});

// PUT /api/debts/:id
app.put('/api/debts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { creditor_name, debtor_name, amount, description, due_date, status, type, interest_rate } = req.body;

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
        creditor_name?.trim() || null,
        debtor_name?.trim() || null,
        amount !== undefined ? Number(amount) : null,
        description?.trim() || null,
        due_date || null,
        status || null,
        type || null,
        interest_rate !== undefined ? Number(interest_rate) : null,
        id,
        req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data hutang tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update debt error:', err.message);
    res.status(500).json({ error: 'Gagal mengupdate data hutang.' });
  }
});

// DELETE /api/debts/:id
app.delete('/api/debts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM debts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data hutang tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete debt error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus data hutang.' });
  }
});

// POST /api/debts/:id/payments
app.post('/api/debts/:id/payments', authenticateToken, async (req, res) => {
  const { id: debtId } = req.params;
  const { amount, payment_date, notes } = req.body;

  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Jumlah pembayaran harus lebih dari 0.' });
  if (!payment_date) return res.status(400).json({ error: 'Tanggal pembayaran wajib diisi.' });

  try {
    // Verifikasi hutang milik user ini
    const debtResult = await pool.query(
      'SELECT id, remaining_amount FROM debts WHERE id = $1 AND user_id = $2',
      [debtId, req.user.id]
    );
    if (debtResult.rows.length === 0) {
      return res.status(404).json({ error: 'Data hutang tidak ditemukan.' });
    }
    const debt = debtResult.rows[0];
    if (Number(amount) > Number(debt.remaining_amount)) {
      return res.status(400).json({ error: `Jumlah pembayaran tidak boleh lebih dari sisa hutang (${debt.remaining_amount}).` });
    }

    // Insert payment (trigger otomatis update debts)
    const result = await pool.query(
      'INSERT INTO debt_payments (debt_id, amount, payment_date, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [debtId, Number(amount), payment_date, notes?.trim() || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add payment error:', err.message);
    res.status(500).json({ error: 'Gagal menambah pembayaran.' });
  }
});

// DELETE /api/debts/:id/payments/:paymentId
app.delete('/api/debts/:id/payments/:paymentId', authenticateToken, async (req, res) => {
  const { id: debtId, paymentId } = req.params;
  try {
    // Verifikasi payment milik debt yang milik user ini
    const result = await pool.query(
      `DELETE FROM debt_payments dp
       USING debts d
       WHERE dp.id = $1 AND dp.debt_id = $2 AND d.id = dp.debt_id AND d.user_id = $3
       RETURNING dp.id`,
      [paymentId, debtId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Data pembayaran tidak ditemukan.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Delete payment error:', err.message);
    res.status(500).json({ error: 'Gagal menghapus pembayaran.' });
  }
});

// ============================================================
// PROFILE ROUTES
// ============================================================

// GET /api/profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.email, u.created_at AS user_created_at
       FROM user_profiles p
       JOIN users u ON u.id = p.id
       WHERE p.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profil tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Gagal memuat profil.' });
  }
});

// PUT /api/profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { full_name, avatar_url, occupation, phone, location, bio } = req.body;
  try {
    const result = await pool.query(
      `UPDATE user_profiles SET
        full_name = COALESCE($1, full_name),
        avatar_url = $2,
        occupation = $3,
        phone = $4,
        location = $5,
        bio = $6,
        updated_at = now()
      WHERE id = $7
      RETURNING *`,
      [
        full_name?.trim() || null,
        avatar_url || null,
        occupation?.trim() || null,
        phone?.trim() || null,
        location?.trim() || null,
        bio?.trim() || null,
        req.user.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profil tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Gagal mengupdate profil.' });
  }
});

// GET /api/profile/stats
app.get('/api/profile/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM transactions WHERE user_id = $1)::int AS transaction_count,
        (SELECT COUNT(*) FROM budgets WHERE user_id = $1)::int AS budget_count,
        (SELECT COUNT(*) FROM financial_goals WHERE user_id = $1)::int AS goal_count,
        (SELECT COUNT(*) FROM debts WHERE user_id = $1)::int AS debt_count`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get stats error:', err.message);
    res.status(500).json({ error: 'Gagal memuat statistik.' });
  }
});

// ============================================================
// STATIC FILE SERVING (harus setelah semua API routes)
// ============================================================
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global error handler — pastikan semua unhandled async errors return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Keuangan Personal Server running on port ${port}`);
  console.log(`📱 Access: http://localhost:${port}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
});
