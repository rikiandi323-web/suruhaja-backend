const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// String koneksi ke Pooler Supabase Proyek Baru (Port 6543)
const connectionString = process.env.DATABASE_URL || 
  "postgresql://postgres.pnmxukurudskokeduxfl:%40Srilestari201313%40@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// 🔄 Auto-Inisialisasi Skema Tabel & Data Awal di Supabase Baru
const initDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // 1. Buat Tabel Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        contact VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        balance NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Buat Tabel Notifications
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        contact VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Masukkan Data User Default Jika Belum Ada
    const checkUser = await client.query("SELECT * FROM users WHERE contact = '082284877658'");
    if (checkUser.rows.length === 0) {
      await client.query(`
        INSERT INTO users (contact, password, name, role, balance)
        VALUES ('082284877658', '123456', 'Riki Andi (Admin Master)', 'admin', 2500000);
      `);
      
      await client.query(`
        INSERT INTO notifications (contact, title, message)
        VALUES ('082284877658', 'Sistem SuruhAja Aktif', 'Selamat datang di Super App SuruhAja! Database PostgreSQL berhasil terhubung.');
      `);
      console.log("🌱 Data awal pengguna & notifikasi berhasil dibuat!");
    }

    client.release();
    console.log("✅ Database PostgreSQL & Skema Tabel SuruhAja Berhasil Terinisialisasi!");
  } catch (err) {
    console.error("❌ Gagal inisialisasi database:", err.message);
  }
};

initDatabase();

// ---------------- API ENDPOINTS ----------------

// Root API Check
app.get('/', (req, res) => {
  res.send('🚀 Backend SuruhAja Running & Connected to Supabase PostgreSQL!');
});

// API Login
app.post('/api/auth/login', async (req, res) => {
  const { contact, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT id, name, contact, role, balance FROM users WHERE contact = $1 AND password = $2",
      [contact, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ error: "Nomor HP/Email atau Password salah!" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan server database: " + err.message });
  }
});

// API Get Notifikasi
app.get('/api/notifications/:contact', async (req, res) => {
  const { contact } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE contact = $1 ORDER BY created_at DESC",
      [contact]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Backend SuruhAja berjalan di port ${PORT}`);
});