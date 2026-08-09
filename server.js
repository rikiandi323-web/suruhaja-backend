require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Config CORS agar dapat dipanggil dari Frontend Vercel / Localhost
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));

// Supabase PostgreSQL Pool Connection
const connectionString = process.env.DATABASE_URL || 
  "postgresql://postgres.pnmxukurudskokeduxfl:%40Srilestari201313%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Root Endpoint Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'SuruhAja Real-Time Super App REST API',
    database: 'Supabase PostgreSQL Connected',
    timestamp: new Date().toISOString()
  });
});

// 1. AUTHENTICATION & REGISTRATION
app.post('/api/auth/register', async (req, res) => {
  const { role, name, address, contact, password, ktpNumber, specialty } = req.body;

  if (role === 'admin') {
    return res.status(403).json({ error: 'Pendaftaran akun Admin secara mandiri dilarang!' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE contact = $1', [contact]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Nomor HP/Email sudah terdaftar!' });
    }

    const newUser = await pool.query(
      `INSERT INTO users (contact, role, name, address, password, balance, ktp_number, specialty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [contact, role, name, address, password, role === 'customer' ? 50000 : 0, ktpNumber || null, specialty || null]
    );

    if (role === 'helper') {
      const helperId = `h-${Date.now()}`;
      await pool.query(
        `INSERT INTO helpers (id, contact, name, specialty_service, custom_rate, bio)
         VALUES ($1, $2, $3, $4, 50000, $5)`,
        [helperId, contact, name, specialty || 'Jasa Multi-Skill', `Siap melayani kebutuhan ${specialty || 'jasa'}.`]
      );
    } else if (role === 'merchant') {
      const storeId = `store-${Date.now()}`;
      await pool.query(
        `INSERT INTO food_stores (id, contact, name, category, address)
         VALUES ($1, $2, $3, 'Kuliner Makanan & Minuman', $4)`,
        [storeId, contact, name, address]
      );
    }

    res.status(201).json({ message: 'Pendaftaran berhasil!', user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { contact, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE contact = $1 AND password = $2', [contact, password]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'No. HP/Email atau Password salah!' });
    }

    const user = result.rows[0];
    if (user.is_suspended) {
      return res.status(403).json({ error: 'Akun Anda sedang ditangguhkan (suspend) oleh Admin.' });
    }

    res.json({ message: 'Login Berhasil', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. HELPERS & STORES DATA
app.get('/api/helpers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM helpers WHERE is_suspended = FALSE ORDER BY rating DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM food_stores WHERE is_suspended = FALSE ORDER BY rating DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ORDERS ENGINE
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { customerName, customerContact, helperId, helperName, merchantId, merchantName, service, description, price, address } = req.body;
  const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    await pool.query(
      `INSERT INTO orders (id, customer_name, customer_contact, helper_id, helper_name, merchant_id, merchant_name, service, description, price, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, customerName, customerContact, helperId || null, helperName || null, merchantId || null, merchantName || null, service, description, price, address]
    );

    res.status(201).json({ message: 'Pesanan berhasil dibuat!', orderId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orders/:orderId/progress', async (req, res) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan!' });

    const order = orderRes.rows[0];
    const nextStep = (order.step_index || 1) + 1;
    const isDone = nextStep >= 3;
    const newStatus = isDone ? 'completed' : 'ongoing';

    await pool.query('UPDATE orders SET step_index = $1, status = $2 WHERE id = $3', [nextStep, newStatus, req.params.orderId]);

    res.json({ message: 'Status progres diperbarui!', nextStep, newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ADMIN ACTIONS
app.post('/api/admin/topup', async (req, res) => {
  const { contact, amount } = req.body;
  try {
    await pool.query('UPDATE users SET balance = balance + $1 WHERE contact = $2', [amount, contact]);
    res.json({ message: `Top Up Rp ${amount} ke ${contact} berhasil!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/suspend', async (req, res) => {
  const { contact } = req.body;
  try {
    await pool.query('UPDATE users SET is_suspended = NOT is_suspended WHERE contact = $1', [contact]);
    res.json({ message: 'Status suspend pengguna diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server REST API SuruhAja aktif di port ${PORT}`);
});