import React, { useState, useEffect } from 'react';

// URL Backend Server kamu
const API_BASE_URL = "https://suruhaja-backend.vercel.app"; // Sesuaikan jika ada domain backend kustom

export default function App() {
  const [user, setUser] = useState(null);
  const [contactInput, setContactInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🔊 Audio Synthesizer Notifikasi Khusus SuruhAja
  const playSuruhAjaSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Note D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Note A5
      
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio play blocked by browser policy:", e);
    }
  };

  // 🔄 Fetch Notifikasi Real-Time Pengguna
  const fetchNotifications = async (contact) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${contact}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > notifications.length && notifications.length > 0) {
          playSuruhAjaSound(); // Pemicu suara notifikasi khas jika ada notif baru
        }
        setNotifications(data);
      }
    } catch (err) {
      console.error("Gagal mengambil notifikasi:", err);
    }
  };

  // 🔐 Fungsi Login Data Asli PostgreSQL
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: contactInput, password: passwordInput }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        playSuruhAjaSound();
        fetchNotifications(data.user.contact);
      } else {
        setErrorMessage(data.error || 'Login gagal. Periksa kembali nomor HP/password.');
      }
    } catch (err) {
      setErrorMessage('Gagal terhubung ke Server Backend SuruhAja.');
    } finally {
      setLoading(false);
    }
  };

  // 📍 Minta Akses GPS Real-Time
  const requestGPSLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          alert(`📍 Lokasi GPS Presisi Terdeteksi:\nLatitude: ${latitude}\nLongitude: ${longitude}`);
        },
        (error) => alert("Harap aktifkan Izin Lokasi/GPS di HP kamu!")
      );
    }
  };

  // Interval Polling Notifikasi Real-Time
  useEffect(() => {
    if (user?.contact) {
      const interval = setInterval(() => {
        fetchNotifications(user.contact);
      }, 5000); // Polling tiap 5 detik
      return () => clearInterval(interval);
    }
  }, [user, notifications]);

  // ----------------------------------------------------
  // LAYAR LOGIN (Tampil Pertama Kali Jika Belum Login)
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-indigo-400 tracking-wide">SuruhAja</h1>
            <p className="text-slate-400 text-sm mt-1">Platform Layanan On-Demand Real-Time</p>
          </div>

          {errorMessage && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 rounded-xl mb-4 text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 uppercase font-semibold">No. HP / Email Registered</label>
              <input
                type="text"
                placeholder="082284877658"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 uppercase font-semibold">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              {loading ? 'Verifikasi Data Asli...' : 'MASUK KE APLIKASI'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Terhubung langsung ke PostgreSQL Database Server
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // LAYAR DASHBOARD UTAMA (SETELAH SUCCESS LOGIN)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-xl font-black text-indigo-400">SuruhAja</h1>
          <p className="text-xs text-emerald-400 font-medium">● System Live & Data Real-Time</p>
        </div>
        <button
          onClick={() => setUser(null)}
          className="text-xs bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 px-3 py-1.5 rounded-lg border border-slate-700"
        >
          Keluar
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {/* User Card */}
        <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-5 rounded-2xl border border-indigo-500/30 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase font-bold">
                {user.role === 'admin' ? '👑 Master Admin Utama' : user.role}
              </span>
              <h2 className="text-xl font-bold text-white mt-2">{user.name}</h2>
              <p className="text-xs text-slate-300">{user.contact}</p>
            </div>
            <button
              onClick={requestGPSLocation}
              className="bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              📍 GPS Real-Time
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-500/20 flex justify-between items-center">
            <span className="text-xs text-slate-300">Saldo Rupiah Asli:</span>
            <span className="text-lg font-black text-emerald-400">
              Rp {Number(user.balance || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Real-time Notifications Section */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              🔔 Notifikasi Dashboard Real-Time
              {notifications.length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </h3>
            <button
              onClick={playSuruhAjaSound}
              className="text-[10px] text-indigo-400 hover:underline"
            >
              🔊 Tes Suara
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Belum ada notifikasi baru dari server.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div key={notif.id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 text-xs">
                  <div className="font-bold text-indigo-300">{notif.title}</div>
                  <div className="text-slate-300 mt-0.5">{notif.message}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {new Date(notif.created_at).toLocaleTimeString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}