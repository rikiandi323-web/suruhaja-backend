require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// PostgreSQL Connection Pool Supabase (Port 6543)
const supabaseConnectionString = 
  process.env.DATABASE_URL || 
  "postgresql://postgres.dcywunwkvwzorwpescnm:%40Srilestari201313%40@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: supabaseConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDb = async () => {
  try {
    // Tabel Pengguna
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        contact VARCHAR(100) PRIMARY KEY,
        role VARCHAR(20) NOT NULL,
        name VARCHAR(150) NOT NULL,
        address TEXT,
        password VARCHAR(255) NOT NULL,
        balance NUMERIC DEFAULT 0,
        is_suspended BOOLEAN DEFAULT FALSE,
        ktp_number VARCHAR(20),
        ktp_image TEXT,
        specialty VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabel Staf Admin Pembagian Jobdesk
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_staff (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        contact VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_type VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabel Mitra Jasa
    await pool.query(`
      CREATE TABLE IF NOT EXISTS helpers (
        id VARCHAR(50) PRIMARY KEY,
        contact VARCHAR(100) REFERENCES users(contact) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        rating NUMERIC DEFAULT 5.0,
        jobs INT DEFAULT 0,
        avatar TEXT,
        specialty_service VARCHAR(150),
        custom_rate NUMERIC DEFAULT 50000,
        is_suspended BOOLEAN DEFAULT FALSE,
        bio TEXT
      );
    `);

    // Tabel Multi-Skills Mitra Jasa
    await pool.query(`
      CREATE TABLE IF NOT EXISTS helper_skills (
        id VARCHAR(50) PRIMARY KEY,
        helper_id VARCHAR(50) REFERENCES helpers(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        rate NUMERIC NOT NULL,
        description TEXT
      );
    `);

    // Tabel Warung / Toko Kuliner
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_stores (
        id VARCHAR(50) PRIMARY KEY,
        contact VARCHAR(100) REFERENCES users(contact) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(100),
        rating NUMERIC DEFAULT 5.0,
        image TEXT,
        address TEXT,
        is_approved BOOLEAN DEFAULT TRUE,
        is_suspended BOOLEAN DEFAULT FALSE
      );
    `);

    // Tabel Menu Makanan & Minuman Toko
    await pool.query(`
      CREATE TABLE IF NOT EXISTS food_menus (
        id VARCHAR(50) PRIMARY KEY,
        store_id VARCHAR(50) REFERENCES food_stores(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT,
        is_available BOOLEAN DEFAULT TRUE
      );
    `);

    // Tabel Transaksi Pesanan (Mendukung GPS & Alamat Presisi)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        customer_contact VARCHAR(100) NOT NULL,
        helper_id VARCHAR(50),
        helper_name VARCHAR(150),
        merchant_id VARCHAR(50),
        merchant_name VARCHAR(150),
        service VARCHAR(150) NOT NULL,
        description TEXT,
        status VARCHAR(30) DEFAULT 'ongoing',
        step_index INT DEFAULT 0,
        price NUMERIC NOT NULL,
        address TEXT NOT NULL,
        latitude NUMERIC,
        longitude NUMERIC,
        is_reviewed BOOLEAN DEFAULT FALSE,
        rating NUMERIC,
        review_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabel Ulasan & Rating Bintang Transparan
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(50) PRIMARY KEY,
        entity_type VARCHAR(20) NOT NULL, -- 'helper' atau 'store'
        entity_id VARCHAR(50) NOT NULL,
        customer_name VARCHAR(150) NOT NULL,
        rating NUMERIC NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabel Notifikasi Real-Time Lintas Peran
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        target_role VARCHAR(20) NOT NULL,
        target_contact VARCHAR(100) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabel Voucher Promo CMS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_vouchers (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        voucher_code VARCHAR(50) NOT NULL UNIQUE,
        discount_amount NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Database PostgreSQL & Seluruh Skema Tabel SuruhAja Berhasil Terinisialisasi!");
  } catch (err) {
    console.error("❌ Error Inisialisasi Database PostgreSQL:", err);
  }
};

// 1. Simulasi Kirim OTP WA/SMS
app.post('/api/auth/send-otp', (req, res) => {
  const { contact } = req.body;
  if (!contact) return res.status(400).json({ error: 'Nomor HP/WA/Email wajib diisi!' });
  
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  res.json({ 
    message: `Kode OTP berhasil dikirim ke ${contact}`,
    otpCode 
  });
});

// 2. Registrasi Pengguna Baru (Pelanggan / Mitra Jasa / Toko)
app.post('/api/auth/register', async (req, res) => {
  const { role, name, address, contact, password, ktpNumber, ktpImage, specialty } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE contact = $1', [contact]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Nomor HP/Email sudah terdaftar!' });
    }

    const newUser = await pool.query(
      `INSERT INTO users (contact, role, name, address, password, balance, ktp_number, ktp_image, specialty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [contact, role, name, address, password, role === 'customer' ? 50000 : 0, ktpNumber, ktpImage, specialty]
    );

    if (role === 'helper') {
      const helperId = `h-${Date.now()}`;
      await pool.query(
        `INSERT INTO helpers (id, contact, name, specialty_service, custom_rate, bio)
         VALUES ($1, $2, $3, $4, 50000, $5)`,
        [helperId, contact, name, specialty || 'Jasa Panggilan Multi-Skill', `Siap melayani ${specialty || 'berbagai kebutuhan jasa'}.`]
      );
      
      await pool.query(
        `INSERT INTO helper_skills (id, helper_id, name, rate, description)
         VALUES ($1, $2, $3, 50000, 'Layanan utama')`,
        [`sk-${Date.now()}`, helperId, specialty || 'Jasa Panggilan Multi-Skill']
      );
    } else if (role === 'merchant') {
      const storeId = `store-${Date.now()}`;
      await pool.query(
        `INSERT INTO food_stores (id, contact, name, category, address)
         VALUES ($1, $2, $3, 'Kuliner Lokal', $4)`,
        [storeId, contact, name, address]
      );
    }

    res.status(201).json({ message: 'Pendaftaran berhasil!', user: newUser.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Login User
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

// 4. Reset Password (Lupa Password)
app.post('/api/auth/reset-password', async (req, res) => {
  const { contact, newPassword } = req.body;
  try {
    const result = await pool.query('UPDATE users SET password = $1 WHERE contact = $2 RETURNING *', [newPassword, contact]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nomor HP/Email tidak ditemukan!' });
    }
    res.json({ message: 'Password baru berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Notifikasi Pengguna berdasarkan Kontak
app.get('/api/notifications/:contact', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE target_contact = $1 ORDER BY created_at DESC',
      [req.params.contact]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Kirim Notifikasi Baru Lintas Peran
app.post('/api/notifications', async (req, res) => {
  const { targetRole, targetContact, title, message } = req.body;
  const id = `notif-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO notifications (id, target_role, target_contact, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, targetRole, targetContact, title, message]
    );
    res.status(201).json({ message: 'Notifikasi berhasil dikirim!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Tandai Notifikasi Telah Dibaca
app.put('/api/notifications/:contact/mark-read', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE target_contact = $1', [req.params.contact]);
    res.json({ message: 'Semua notifikasi ditandai telah dibaca!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Multi-Skills Mitra
app.get('/api/helpers/:helperId/skills', async (req, res) => {
  try {
    const skills = await pool.query('SELECT * FROM helper_skills WHERE helper_id = $1 ORDER BY id ASC', [req.params.helperId]);
    res.json(skills.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tambah Skill Mitra
app.post('/api/helpers/:helperId/skills', async (req, res) => {
  const { name, rate, description } = req.body;
  const id = `sk-${Date.now()}`;
  try {
    await pool.query(
      'INSERT INTO helper_skills (id, helper_id, name, rate, description) VALUES ($1, $2, $3, $4, $5)',
      [id, req.params.helperId, name, rate, description || 'Layanan berkualitas.']
    );
    res.status(201).json({ message: 'Skill baru berhasil ditambahkan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Skill Mitra
app.put('/api/skills/:skillId', async (req, res) => {
  const { name, rate, description } = req.body;
  try {
    await pool.query(
      'UPDATE helper_skills SET name = $1, rate = $2, description = $3 WHERE id = $4',
      [name, rate, description, req.params.skillId]
    );
    res.json({ message: 'Skill & tarif berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hapus Skill Mitra
app.delete('/api/skills/:skillId', async (req, res) => {
  try {
    await pool.query('DELETE FROM helper_skills WHERE id = $1', [req.params.skillId]);
    res.json({ message: 'Skill berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Menu Toko
app.get('/api/stores/:storeId/menus', async (req, res) => {
  try {
    const menus = await pool.query('SELECT * FROM food_menus WHERE store_id = $1 ORDER BY id DESC', [req.params.storeId]);
    res.json(menus.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tambah Menu Baru Toko
app.post('/api/stores/:storeId/menus', async (req, res) => {
  const { name, price, description } = req.body;
  const id = `m-${Date.now()}`;
  try {
    await pool.query(
      'INSERT INTO food_menus (id, store_id, name, price, description, is_available) VALUES ($1, $2, $3, $4, $5, TRUE)',
      [id, req.params.storeId, name, price, description]
    );
    res.status(201).json({ message: 'Menu kuliner berhasil ditambahkan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Menu Toko
app.put('/api/menus/:menuId', async (req, res) => {
  const { name, price, description } = req.body;
  try {
    await pool.query(
      'UPDATE food_menus SET name = $1, price = $2, description = $3 WHERE id = $4',
      [name, price, description, req.params.menuId]
    );
    res.json({ message: 'Menu kuliner berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle Status Menu Habis / Tersedia
app.put('/api/menus/:menuId/toggle-availability', async (req, res) => {
  try {
    await pool.query('UPDATE food_menus SET is_available = NOT is_available WHERE id = $1', [req.params.menuId]);
    res.json({ message: 'Status ketersediaan menu diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hapus Menu Toko
app.delete('/api/menus/:menuId', async (req, res) => {
  try {
    await pool.query('DELETE FROM food_menus WHERE id = $1', [req.params.menuId]);
    res.json({ message: 'Menu kuliner berhasil dihapus!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buat Pesanan Baru (Mendukung GPS & Alamat Presisi)
app.post('/api/orders', async (req, res) => {
  const { customerName, customerContact, helperId, helperName, merchantId, merchantName, service, description, price, address, latitude, longitude } = req.body;
  const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    await pool.query(
      `INSERT INTO orders (id, customer_name, customer_contact, helper_id, helper_name, merchant_id, merchant_name, service, description, price, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [id, customerName, customerContact, helperId, helperName, merchantId, merchantName, service, description, price, address, latitude || null, longitude || null]
    );

    // Kirim Notifikasi Otomatis ke Mitra/Toko
    const targetContact = helperId ? '081298765432' : '085711223344';
    await pool.query(
      `INSERT INTO notifications (id, target_role, target_contact, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [`notif-${Date.now()}`, helperId ? 'helper' : 'merchant', targetContact, '🔔 PESANAN BARU MASUK!', `Pelanggan ${customerName} memesan "${service}" [${id}]. Alamat: ${address}`]
    );

    res.status(201).json({ message: 'Pesanan berhasil dibuat & notifikasi terkirim!', orderId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Progres Tahapan Pesanan
app.put('/api/orders/:orderId/progress', async (req, res) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Pesanan tidak ditemukan!' });

    const order = orderRes.rows[0];
    const nextStep = (order.step_index || 0) + 1;
    const isDone = nextStep >= 3;
    const newStatus = isDone ? 'completed' : 'ongoing';

    await pool.query(
      'UPDATE orders SET step_index = $1, status = $2 WHERE id = $3',
      [nextStep, newStatus, req.params.orderId]
    );

    // Kirim Notifikasi ke Pelanggan
    await pool.query(
      `INSERT INTO notifications (id, target_role, target_contact, title, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        `notif-${Date.now()}`,
        'customer',
        order.customer_contact,
        isDone ? '🎉 TUGAS SELESAI!' : '🚚 UPDATE TUGAS DIPROSES',
        isDone 
          ? `Mitra ${order.helper_name} telah menyelesaikan pesanan "${order.service}". Silakan beri ulasan & bintang!`
          : `Mitra ${order.helper_name} sedang memproses tugas Anda (Tahap ${nextStep}/3).`
      ]
    );

    res.json({ message: 'Status progres berhasil diperbarui!', nextStep, newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kirim Ulasan & Rating Bintang Transparan
app.post('/api/orders/:orderId/review', async (req, res) => {
  const { rating, comment, entityType, entityId, customerName } = req.body;
  const reviewId = `rev-${Date.now()}`;
  try {
    await pool.query(
      'UPDATE orders SET is_reviewed = TRUE, rating = $1, review_comment = $2 WHERE id = $3',
      [rating, comment, req.params.orderId]
    );

    await pool.query(
      `INSERT INTO reviews (id, entity_type, entity_id, customer_name, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [reviewId, entityType, entityId, customerName, rating, comment]
    );

    const avgResult = await pool.query(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );
    const newRating = Number(avgResult.rows[0].avg_rating).toFixed(1);

    if (entityType === 'helper') {
      await pool.query('UPDATE helpers SET rating = $1 WHERE id = $2', [newRating, entityId]);
    } else if (entityType === 'store') {
      await pool.query('UPDATE food_stores SET rating = $1 WHERE id = $2', [newRating, entityId]);
    }

    res.json({ message: 'Ulasan & Rating Bintang berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Ulasan Transparan Mitra / Toko
app.get('/api/reviews/:entityType/:entityId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [req.params.entityType, req.params.entityId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin Menambah Staf Admin Baru
app.post('/api/admin/staff', async (req, res) => {
  const { name, contact, password, roleType, title } = req.body;
  const id = `admin-${Date.now()}`;
  try {
    await pool.query(
      `INSERT INTO admin_staff (id, name, contact, password, role_type, title)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name, contact, password, roleType, title]
    );
    res.status(201).json({ message: 'Staf admin baru berhasil didaftarkan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Top Up Saldo Manual Pengguna
app.post('/api/admin/users/:contact/topup', async (req, res) => {
  const { amount } = req.body;
  try {
    await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE contact = $2',
      [amount, req.params.contact]
    );
    res.json({ message: `Top Up manual Rp ${amount} berhasil!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Toggle Suspend Akun Pengguna
app.put('/api/admin/users/:contact/suspend', async (req, res) => {
  try {
    await pool.query(
      'UPDATE users SET is_suspended = NOT is_suspended WHERE contact = $1',
      [req.params.contact]
    );
    res.json({ message: 'Status suspend akun berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('<h1>🚀 Server Backend SuruhAja Online & Siap Digunakan!</h1>');
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 Server Backend SuruhAja berjalan di http://localhost:${PORT}`);
});