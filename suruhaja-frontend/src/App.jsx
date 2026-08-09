import React, { useState, useEffect } from 'react';
import { 
  Search, Sparkles, MapPin, Bell, Wallet, Home, History, 
  Bike, Brush, Wrench, ShoppingBag, Users, DollarSign, 
  Check, X, CheckCircle, Phone, MessageSquare,
  Star, RefreshCw, Filter, LogOut,
  Plus, Building2, Store, ArrowDownLeft, Shield, BarChart3, Settings,
  AlertTriangle, Play, Calendar, Map, FileText, Lock, User, UserCheck,
  Utensils, ChevronDown, Tag, Copy, Ticket, Zap,
  SlidersHorizontal, Eye, EyeOff, ThumbsUp, LogIn, Trash2, GraduationCap, Scissors,
  Activity, MessageCircle, HeartHandshake, TrendingUp, Edit, AlertCircle, ArrowRight,
  ShoppingCart, ShieldCheck, CheckCircle2, Radio, Send, Layers, HelpCircle, Headphones
} from 'lucide-react';

const API_BASE_URL = "https://suruhaja-backend.vercel.app";

const ImgWithFallback = ({ src, alt, className = '', fallbackType = 'user' }: { src: string | null; alt?: string; className?: string; fallbackType?: string }) => {
  const [imgError, setImgError] = useState(false);

  if (imgError || !src) {
    return (
      <div className={`${className} bg-slate-800 text-slate-300 flex items-center justify-center font-bold overflow-hidden shrink-0 border border-slate-700`}>
        {fallbackType === 'user' ? <User className="w-1/2 h-1/2 text-blue-400" /> : <Store className="w-1/2 h-1/2 text-amber-400" />}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt || ''} 
      className={className} 
      onError={() => setImgError(true)} 
    />
  );
};

const INITIAL_SERVICES = [
  { id: 's0', name: 'SuruhFood', icon: Utensils, category: 'Food', price: 12000, unit: 'ongkir', desc: 'Pesan kuliner lezat & minuman dari warung terdekat.' },
  { id: 's1', name: 'SuruhRide / Kurir', icon: Bike, category: 'Transport', price: 25000, unit: 'per trip', desc: 'Jemput anak sekolah, antar dokumen, & kurir instan.' },
  { id: 's2', name: 'SuruhClean', icon: Brush, category: 'Cleaning', price: 45000, unit: 'per jam', desc: 'Bersih ruangan, cuci piring, & rapikan rumah.' },
  { id: 's3', name: 'SuruhFix Pertukangan', icon: Wrench, category: 'Fixing', price: 75000, unit: 'per jasa', desc: 'Perbaikan kran, listrik ringan, pompa air, dll.' },
  { id: 's4', name: 'Les Privat & Ngaji', icon: GraduationCap, category: 'Education', price: 50000, unit: 'per sesi', desc: 'Guru les matematika, B. Inggris, hingga ngajar ngaji.' },
  { id: 's5', name: 'Pangkas Rambut', icon: Scissors, category: 'Grooming', price: 35000, unit: 'per pangkas', desc: 'Potong rambut pria & wanita dipanggil ke rumah.' },
  { id: 's6', name: 'Kusuk & Refleksi', icon: Activity, category: 'Wellness', price: 80000, unit: 'per jam', desc: 'Tukang urut/kusuk tradisional refleksi capek badan.' },
  { id: 's7', name: 'Teman Curhat', icon: MessageCircle, category: 'Lifestyle', price: 40000, unit: 'per jam', desc: 'Pendamping obrol santai, mendengarkan curhat bebas stress.' },
  { id: 's8', name: 'Jasa Khusus / Sawit', icon: Sparkles, category: 'Custom', price: 60000, unit: 'per tugas', desc: 'Panen kebun sawit, dodos, & keterampilan khusus lainnya.' },
];

const QUICK_PROMPTS = [
  "Cari tukang memanen kebun sawit & dodos",
  "Panggil guru ngaji & les privat anak ke rumah",
  "Panggil tukang pangkas rambut home service",
  "Butuh tukang kusuk & pijat refleksi capek badan",
  "Cari teman curhat & tempat obrol santai",
  "Cari kuliner terdekat murah & enak"
];

const playSuruhAjaChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [
      { freq: 523.25, time: 0, duration: 0.12 },
      { freq: 659.25, time: 0.12, duration: 0.12 },
      { freq: 783.99, time: 0.24, duration: 0.28 },
      { freq: 1046.50, time: 0.24, duration: 0.28 }
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.time);

      gain.gain.setValueAtTime(0.01, ctx.currentTime + n.time);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + n.time);
      osc.stop(ctx.currentTime + n.time + n.duration);
    });
  } catch (e) {
    console.log("Audio synth blocked", e);
  }
};

function CustomerApp({
  customerTab, setCustomerTab, aiPrompt, setAiPrompt, handleParseAiPrompt,
  handleDirectServiceOrder, orders, customerBalance, sessionUser, handleLogout,
  handleOpenAuthModal, setShowTopUpModal, setShowCsModal,
  helpersList, foodStores, handleRateOrder, customerAddress, setShowAddressModal, 
  servicesList, checkAuthGuard, setSelectedReviewEntity, setShowNotifModal, unreadNotifCount
}: any) {
  const customerOrders = sessionUser ? orders.filter((o: any) => o.customerContact === sessionUser.contact || o.customerName === sessionUser.name) : orders;
  const currentServices = servicesList || INITIAL_SERVICES;

  const [ratingModalOrder, setRatingModalOrder] = useState<any>(null);
  const [starCount, setStarCount] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [activeFoodStoreModal, setActiveFoodStoreModal] = useState<any>(null);
  const [foodCart, setFoodCart] = useState<Record<string, number>>({});
  const [activeChatOrder, setActiveChatOrder] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');

  const updateCartQty = (menuId: string, delta: number) => {
    setFoodCart(prev => {
      const current = prev[menuId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: updated };
    });
  };

  const getCartTotal = (menuList: any[]) => {
    return Object.entries(foodCart).reduce((acc, [mId, qty]) => {
      const item = menuList.find(m => m.id === mId);
      return acc + (item ? Number(item.price) * qty : 0);
    }, 0);
  };

  const submitFoodCartOrder = () => {
    if (!checkAuthGuard('customer')) return;
    if (!activeFoodStoreModal) return;

    const totalFoodPrice = getCartTotal(activeFoodStoreModal.menu || []);
    if (totalFoodPrice === 0) return;

    const orderDesc = Object.entries(foodCart).map(([mId, qty]) => {
      const item = (activeFoodStoreModal.menu || []).find((m: any) => m.id === mId);
      return `${item?.name || 'Item'} x${qty}`;
    }).join(', ');

    handleDirectServiceOrder({
      name: `SuruhFood - ${activeFoodStoreModal.name}`,
      desc: orderDesc,
      price: totalFoodPrice + 10000
    }, null, activeFoodStoreModal);

    setFoodCart({});
    setActiveFoodStoreModal(null);
  };

  const submitOrderReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalOrder) return;
    handleRateOrder(ratingModalOrder.id, starCount, commentInput);
    setRatingModalOrder(null);
    setCommentInput('');
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, `Anda: ${chatInput}`]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, `Mitra: Siap kak, pesanan sedang diproses dan sesuai petunjuk!`]);
    }, 1000);
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto bg-white rounded-3xl shadow-2xl flex-1 flex flex-col relative overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-b-2xl shadow-md shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {!sessionUser ? (
              <div>
                <p className="text-[10px] text-blue-100">Selamat Datang di SuruhAja 👋</p>
                <button 
                  onClick={() => handleOpenAuthModal('login', 'customer')} 
                  className="bg-slate-950 hover:bg-slate-900 text-blue-300 px-3 py-1 rounded-full text-xs font-black shadow transition-all flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login / Daftar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[10px] text-blue-100">Halo 👋</p>
                  <h2 className="text-sm font-bold flex items-center gap-1">{sessionUser.name} <CheckCircle className="w-3 h-3 text-blue-300" /></h2>
                </div>
                <button 
                  onClick={handleLogout}
                  title="Keluar / Logout Akun"
                  className="bg-red-500/80 hover:bg-red-600 text-white px-2 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border border-red-300/40 shadow transition-all cursor-pointer ml-1"
                >
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => setShowNotifModal(true)}
              className="p-1.5 bg-slate-950/40 hover:bg-slate-950 text-blue-200 rounded-full border border-blue-300/40 flex items-center justify-center shadow cursor-pointer relative"
              title="Notifikasi Masuk"
            >
              <Bell className="w-4 h-4 text-blue-300" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setShowCsModal(true)}
              className="p-1.5 bg-slate-950/40 hover:bg-slate-950 text-blue-200 rounded-full border border-blue-300/40 flex items-center justify-center shadow cursor-pointer"
              title="Layanan Bantuan CS 24 Jam"
            >
              <Headphones className="w-4 h-4 text-blue-300" />
            </button>

            <div className="flex items-center space-x-1.5 bg-slate-950/40 pl-2 pr-1 py-1 rounded-full border border-blue-300/40 text-xs">
              <Wallet className="w-3.5 h-3.5 text-blue-300" />
              <span className="font-bold text-[11px]">
                {sessionUser ? `Rp ${(customerBalance || 0).toLocaleString('id-ID')}` : 'Rp 0'}
              </span>
              <button 
                onClick={() => checkAuthGuard('customer', () => setShowTopUpModal(true))} 
                className="bg-white hover:bg-blue-50 text-blue-900 font-black px-2 py-0.5 rounded-full text-[10px] flex items-center gap-0.5 shadow transition-all ml-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-blue-600" /> Top Up
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-blue-100">
          <button 
            onClick={() => checkAuthGuard('customer', () => setShowAddressModal(true))}
            className="flex items-center gap-1.5 truncate text-left hover:text-white transition-all cursor-pointer bg-blue-900/40 hover:bg-blue-900/80 px-2.5 py-1 rounded-xl border border-blue-400/40"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-bounce" />
            <span className="truncate font-bold text-[11px] max-w-[220px]">{customerAddress}</span>
            <ChevronDown className="w-3 h-3 text-blue-200 shrink-0" />
          </button>
          <span className="bg-slate-950/60 px-2 py-0.5 rounded text-[10px] font-bold text-blue-300 shrink-0 ml-1">
            Pelanggan
          </span>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
        <button 
          onClick={() => setCustomerTab('home')} 
          className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${customerTab === 'home' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Home className="w-4 h-4" /> Beranda
        </button>
        <button 
          onClick={() => checkAuthGuard('customer', () => setCustomerTab('orders'))} 
          className={`flex-1 py-2.5 text-center flex items-center justify-center gap-1 transition-all cursor-pointer ${customerTab === 'orders' ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <History className="w-4 h-4" /> Pesanan Saya ({customerOrders.length})
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-20 relative space-y-4">
        {customerTab === 'home' && (
          <>
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 rounded-2xl shadow-lg border border-blue-400/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Suruh AI • Cari Jasa & Keterampilan</span>
                </span>
              </div>

              <div className="flex gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-blue-500/30">
                <input 
                  type="text" 
                  placeholder="Ketik tugas / jasa yang dibutuhkan (pangkas, les, tukang, dll)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleParseAiPrompt()}
                  className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 px-2 focus:outline-none"
                />
                <button 
                  onClick={() => handleParseAiPrompt()}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs rounded-lg shadow flex items-center gap-1 cursor-pointer"
                >
                  <span>Cari Jasa</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9px] font-bold">
                {QUICK_PROMPTS.map((prompt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleParseAiPrompt(prompt)}
                    className="shrink-0 bg-blue-950/90 text-blue-200 border border-blue-700/50 hover:bg-blue-800 hover:text-white px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap"
                  >
                    ✨ {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-700 mb-2.5">Kategori Jasa & Keterampilan Utama</h4>
              <div className="grid grid-cols-3 gap-2">
                {currentServices.map((s: any) => {
                  const IconComp = s.icon;
                  return (
                    <button 
                      key={s.id} 
                      onClick={() => handleDirectServiceOrder(s)}
                      className="flex flex-col items-center p-2.5 bg-slate-50 border rounded-2xl hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm cursor-pointer active:scale-95 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-1 overflow-hidden p-1.5 border border-blue-200/60">
                        {IconComp && <IconComp className="w-5 h-5 text-blue-600" />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-800 text-center leading-tight">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-700">Toko & Warung Kuliner Terdaftar</h4>
              </div>

              {foodStores.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed rounded-2xl text-center space-y-2 text-slate-500 text-xs">
                  <Store className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-600">Belum ada toko/warung kuliner terdaftar di area ini.</p>
                  <button 
                    onClick={() => handleOpenAuthModal('register', 'merchant')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-[11px] shadow cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Daftarkan Warung/Toko Anda
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {foodStores.map((store: any) => (
                    <div key={store.id} className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center space-x-3">
                        <ImgWithFallback src={store.image} alt={store.name} className="w-12 h-12 rounded-xl object-cover border shrink-0" fallbackType="store" />
                        <div>
                          <h5 className="font-black text-xs text-slate-900">{store.name}</h5>
                          <p className="text-[10px] text-slate-500">{store.category} • Terdekat</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-amber-500 font-extrabold">⭐ {store.rating || 5.0}</span>
                            <button 
                              onClick={() => setSelectedReviewEntity({ type: 'store', data: store })}
                              className="text-[9px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              ({(store.reviews || []).length} Ulasan)
                            </button>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => checkAuthGuard('customer', () => setActiveFoodStoreModal(store))}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow cursor-pointer"
                      >
                        Pesan Makanan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-xs text-slate-700">Mitra Penyedia Jasa & Keterampilan</h4>
              </div>
              {helpersList.filter((h: any) => !h.isSuspended).length === 0 ? (
                <div className="p-6 bg-slate-50 border border-dashed rounded-2xl text-center space-y-2 text-slate-500 text-xs">
                  <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-medium text-slate-600">Belum ada mitra penyedia jasa terdaftar.</p>
                  <button 
                    onClick={() => handleOpenAuthModal('register', 'helper')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Daftar Sebagai Mitra Jasa
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {helpersList.filter((h: any) => !h.isSuspended).map((h: any) => (
                    <div key={h.id} className="p-2.5 bg-white border rounded-2xl flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0">
                          <ImgWithFallback src={h.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-blue-400 shrink-0" fallbackType="user" />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1 truncate">{h.name} <CheckCircle className="w-3 h-3 text-blue-500 shrink-0" /></h5>
                            <p className="text-[10px] text-blue-800 font-bold truncate">{h.specialtyService}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-emerald-600 font-black">⭐ {h.rating || 5.0} ({h.jobs || 0} Tugas)</span>
                              <button 
                                onClick={() => setSelectedReviewEntity({ type: 'helper', data: h })}
                                className="text-[9px] text-blue-600 hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200"
                              >
                                <MessageSquare className="w-2.5 h-2.5" /> {(h.reviews || []).length} Ulasan
                              </button>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDirectServiceOrder({ name: h.specialtyService, desc: h.bio, price: h.customRate || 50000 }, h)} 
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer"
                        >
                          Pesan Jasa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {customerTab === 'orders' && (
          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b pb-2">
              <History className="w-4 h-4 text-blue-600" /> Status & Riwayat Pesanan Anda
            </h3>

            {customerOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed rounded-2xl text-xs space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Belum Ada Transaksi Pesanan</p>
                <p className="text-[11px]">Seluruh riwayat pesanan Anda yang berhasil dibuat akan ditampilkan di sini.</p>
              </div>
            ) : (
              customerOrders.map((ord: any) => (
                <div key={ord.id} className="bg-slate-50 border-2 border-blue-100 p-3.5 rounded-2xl space-y-2 shadow-sm">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                    <div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${ord.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'}`}>
                        {ord.status === 'completed' ? 'Selesai' : 'Sedang Diproses (Tahap ' + (ord.stepIndex || 1) + '/3)'}
                      </span>
                      <h4 className="font-extrabold text-xs text-slate-900 mt-1">{ord.service}</h4>
                      <p className="text-[10px] text-slate-500">Penyedia: <strong className="text-blue-700">{ord.helperName || ord.merchantName}</strong></p>
                    </div>
                    <span className="font-black text-xs text-blue-600 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm block">
                      Rp {ord.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border">
                    <p className="font-medium text-slate-800">📍 Alamat Tujuan: {ord.address}</p>
                    <p className="text-[10px] text-slate-500 italic">Rincian: "{ord.description}"</p>
                  </div>

                  {ord.status !== 'completed' && (
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => {
                          setActiveChatOrder(ord);
                          setChatMessages([`Sistem: Anda terhubung dengan ${ord.helperName || ord.merchantName}`]);
                        }}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat Live
                      </button>
                      <button 
                        onClick={() => playSuruhAjaChime()}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" /> Panggil
                      </button>
                    </div>
                  )}

                  {ord.status === 'completed' && (
                    <div className="pt-1">
                      {ord.isReviewed ? (
                        <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-[10px] space-y-1">
                          <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                            ✓ Sudah Beri Ulasan: {"⭐".repeat(ord.rating)} ({ord.rating}/5)
                          </span>
                          <p className="text-slate-600 italic">"{ord.reviewComment}"</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setRatingModalOrder(ord)}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Beri Ulasan & Rating Bintang</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeFoodStoreModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 space-y-3 text-xs shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">{activeFoodStoreModal.name}</h3>
                <p className="text-[10px] text-slate-500">{activeFoodStoreModal.category} • ⭐ {activeFoodStoreModal.rating || 5.0}</p>
              </div>
              <button onClick={() => setActiveFoodStoreModal(null)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {(activeFoodStoreModal.menu || []).length === 0 ? (
                <p className="text-center text-slate-400 py-6 text-[11px]">Toko ini belum menambahkan daftar menu.</p>
              ) : (
                (activeFoodStoreModal.menu || []).map((menuItem: any) => {
                  const qty = foodCart[menuItem.id] || 0;
                  return (
                    <div key={menuItem.id} className="p-2.5 bg-slate-50 border rounded-2xl flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{menuItem.name}</h5>
                        <p className="text-[10px] text-slate-500">{menuItem.desc || 'Siap disajikan lezat'}</p>
                        <p className="font-black text-blue-600 text-xs mt-0.5">Rp {Number(menuItem.price).toLocaleString('id-ID')}</p>
                      </div>

                      <div className="flex items-center space-x-2 bg-white border rounded-xl p-1 shrink-0">
                        <button 
                          onClick={() => updateCartQty(menuItem.id, -1)}
                          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-black flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-extrabold text-xs px-1">{qty}</span>
                        <button 
                          onClick={() => updateCartQty(menuItem.id, 1)}
                          className="w-6 h-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {getCartTotal(activeFoodStoreModal.menu || []) > 0 && (
              <div className="pt-2 border-t shrink-0 space-y-2">
                <div className="flex justify-between items-center font-black text-xs">
                  <span>Total Makanan (+ Ongkir 10rb):</span>
                  <span className="text-blue-600 text-sm">Rp {(getCartTotal(activeFoodStoreModal.menu || []) + 10000).toLocaleString('id-ID')}</span>
                </div>
                <button 
                  onClick={submitFoodCartOrder}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-4 h-4" /> Konfirmasi & Buat Pesanan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {ratingModalOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative">
            <button onClick={() => setRatingModalOrder(null)} className="absolute top-4 right-4 text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 text-center">Ulasan & Rating Bintang</h3>
            <p className="text-[10px] text-slate-500 text-center">Beri ulasan jujur untuk {ratingModalOrder.helperName || ratingModalOrder.merchantName}</p>

            <form onSubmit={submitOrderReview} className="space-y-3 pt-1">
              <div className="flex justify-center space-x-2 text-2xl text-amber-400">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button 
                    key={num} 
                    type="button" 
                    onClick={() => setStarCount(num)} 
                    className="focus:outline-none transition-all hover:scale-110 cursor-pointer"
                  >
                    {num <= starCount ? '★' : '☆'}
                  </button>
                ))}
              </div>

              <textarea 
                rows={3} 
                placeholder="Tulis ulasan pengerjaan/layanan (contoh: Sangat rapi & tepat waktu)..."
                value={commentInput} 
                onChange={(e) => setCommentInput(e.target.value)} 
                className="w-full p-2.5 border rounded-xl font-medium text-xs focus:border-blue-600 focus:outline-none"
                required
              />

              <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl cursor-pointer shadow">
                Kirim Ulasan & Rating
              </button>
            </form>
          </div>
        </div>
      )}

      {activeChatOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 space-y-3 text-xs shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 shrink-0">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Chat Live: {activeChatOrder.helperName || activeChatOrder.merchantName}
              </h3>
              <button onClick={() => setActiveChatOrder(null)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`p-2 rounded-xl max-w-[85%] text-[11px] ${msg.startsWith('Anda:') ? 'bg-blue-600 text-white ml-auto' : 'bg-white border text-slate-800'}`}>
                  {msg}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChatMessage} className="flex gap-1.5 shrink-0">
              <input 
                type="text" 
                placeholder="Tulis pesan instan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 p-2 border rounded-xl text-xs focus:outline-none"
              />
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer">
                Kirim
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HelperPortal({ sessionUser, orders, handleProgressOrder, handleLogout, handleOpenAuthModal, helpersList, setHelpersList, showToast }: any) {
  const currentHelper = helpersList.find((h: any) => sessionUser && (h.id === sessionUser.contact || h.contact === sessionUser.contact || h.name === sessionUser.name));
  const activeHelperOrders = currentHelper ? orders.filter((o: any) => o.helperId === currentHelper.id || o.helperName === currentHelper.name) : [];

  const [skills, setSkills] = useState(currentHelper?.skills || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRate, setNewSkillRate] = useState('');

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName || !newSkillRate || !currentHelper) return;

    const newSkill = {
      id: `sk-${Date.now()}`,
      name: newSkillName,
      rate: Number(newSkillRate),
      desc: 'Layanan keahlian terverifikasi.'
    };

    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);

    setHelpersList((prev: any) => prev.map((h: any) => h.id === currentHelper.id ? { ...h, skills: updatedSkills } : h));
    setNewSkillName('');
    setNewSkillRate('');
    showToast("Keahlian & tarif jasa baru berhasil ditambahkan!", "success");
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto bg-slate-900 text-white rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden border border-slate-800">
      <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
        {sessionUser && currentHelper ? (
          <div className="flex items-center space-x-3">
            <ImgWithFallback src={currentHelper?.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover" fallbackType="user" />
            <div>
              <h3 className="font-extrabold text-xs text-white flex items-center gap-1">
                {currentHelper?.name} <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700">
                Mitra Jasa Terverifikasi
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-extrabold text-xs text-white">Portal Mitra Jasa</h3>
            <p className="text-[10px] text-slate-400">Silakan login sebagai Mitra Jasa</p>
          </div>
        )}

        {!sessionUser ? (
          <button onClick={() => handleOpenAuthModal('login', 'helper')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
            Login / Daftar Mitra
          </button>
        ) : (
          <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {!sessionUser ? (
          <div className="p-8 text-center text-slate-400 space-y-3 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700">
            <UserCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-sm text-white">Area Khusus Penyedia Jasa & Keterampilan</h4>
            <p className="text-xs text-slate-400">Login untuk menerima orderan tugas, mengelola keahlian, dan memantau pendapatan jasa Anda.</p>
            <div className="flex justify-center gap-2 pt-1">
              <button onClick={() => handleOpenAuthModal('login', 'helper')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow cursor-pointer">
                Login Mitra
              </button>
              <button onClick={() => handleOpenAuthModal('register', 'helper')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/50 font-black text-xs rounded-xl shadow cursor-pointer">
                Daftar Baru
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-400">Total Pekerjaan</p>
                <p className="text-lg font-black text-white">{currentHelper?.jobs || 0} Tugas</p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <p className="text-[10px] text-slate-400">Rating Bintang Pelanggan</p>
                <p className="text-lg font-black text-amber-400">⭐ {currentHelper?.rating || 5.0}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-300 flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-emerald-400" /> Daftar Pesanan Jasa Masuk ({activeHelperOrders.length})
              </h4>

              {activeHelperOrders.length === 0 ? (
                <div className="bg-slate-800/40 p-6 rounded-2xl border border-dashed border-slate-700 text-center text-slate-400">
                  Belum ada pesanan tugas jasa aktif untuk Anda saat ini.
                </div>
              ) : (
                activeHelperOrders.map((ord: any) => (
                  <div key={ord.id} className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-white text-xs">{ord.service}</h5>
                        <p className="text-[10px] text-slate-400">Pemesan: {ord.customerName} ({ord.customerContact})</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">Rp {ord.price.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl text-[10px] text-slate-300">
                      📍 {ord.address}
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">Tahap {ord.stepIndex || 0}/3</span>
                      {ord.status !== 'completed' ? (
                        <button 
                          onClick={() => handleProgressOrder(ord.id)} 
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] shadow cursor-pointer"
                        >
                          Proses Tahap Berikutnya
                        </button>
                      ) : (
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded font-bold">✓ Selesai</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-800 p-3.5 rounded-2xl border border-slate-700 space-y-3">
              <h4 className="font-extrabold text-xs text-white">Kelola Multi-Skills & Tarif Anda</h4>
              <form onSubmit={handleAddSkill} className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Nama keahlian/jasa (contoh: Panen Sawit, Pangkas Rambut)..." 
                  value={newSkillName} 
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Tarif (Rp)..." 
                    value={newSkillRate} 
                    onChange={(e) => setNewSkillRate(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs text-white focus:outline-none"
                    required
                  />
                  <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow">
                    + Tambah Skill
                  </button>
                </div>
              </form>

              <div className="space-y-1.5 pt-1">
                {skills.map((s: any) => (
                  <div key={s.id} className="bg-slate-900 p-2 rounded-xl flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-200">{s.name}</span>
                    <span className="font-mono text-emerald-400 font-extrabold">Rp {Number(s.rate).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MerchantPortal({ sessionUser, foodStores, setFoodStores, orders, handleLogout, handleOpenAuthModal, showToast }: any) {
  const currentStore = foodStores.find((s: any) => sessionUser && (s.contact === sessionUser.contact || s.name === sessionUser.name));
  const storeMenus = currentStore?.menu || [];

  const [menuName, setMenuName] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDesc, setMenuDesc] = useState('');

  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName || !menuPrice || !currentStore) return;

    const newMenuItem = {
      id: `m-${Date.now()}`,
      name: menuName,
      price: Number(menuPrice),
      desc: menuDesc || 'Menu lezat hangat siap disajikan.',
      category: 'Makanan',
      image: '',
      isAvailable: true
    };

    const updatedMenus = [newMenuItem, ...storeMenus];
    setFoodStores((prev: any) => prev.map((s: any) => s.id === currentStore.id ? { ...s, menu: updatedMenus } : s));

    setMenuName('');
    setMenuPrice('');
    setMenuDesc('');
    showToast("Menu kuliner baru berhasil ditambahkan!", "success");
  };

  const toggleAvailability = (menuId: string) => {
    if (!currentStore) return;
    const updatedMenus = storeMenus.map((m: any) => m.id === menuId ? { ...m, isAvailable: !m.isAvailable } : m);
    setFoodStores((prev: any) => prev.map((s: any) => s.id === currentStore.id ? { ...s, menu: updatedMenus } : s));
    showToast("Status ketersediaan menu diperbarui!", "info");
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto bg-amber-950/20 text-slate-900 rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden border border-amber-200 bg-white">
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex justify-between items-center shrink-0">
        {sessionUser && currentStore ? (
          <div className="flex items-center space-x-3">
            <ImgWithFallback src={currentStore?.image} alt="" className="w-10 h-10 rounded-xl object-cover border border-white shrink-0" fallbackType="store" />
            <div>
              <h3 className="font-black text-xs text-white">{currentStore?.name}</h3>
              <p className="text-[10px] text-amber-100">{currentStore?.category} • ⭐ {currentStore?.rating || 5.0}</p>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-black text-xs text-white">Portal Toko & Warung Kuliner</h3>
            <p className="text-[10px] text-amber-100">Silakan login sebagai Pengelola Toko</p>
          </div>
        )}

        {!sessionUser ? (
          <button onClick={() => handleOpenAuthModal('login', 'merchant')} className="bg-slate-900 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer">
            Login / Daftar Toko
          </button>
        ) : (
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
        {!sessionUser ? (
          <div className="p-8 text-center text-slate-500 space-y-3 bg-amber-50/50 rounded-2xl border border-dashed border-amber-200">
            <Store className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="font-bold text-sm text-amber-900">Portal Pemilik Toko Kuliner & Warung</h4>
            <p className="text-xs text-slate-500">Daftarkan warung/toko Anda untuk menjual makanan & minuman ke seluruh pengguna SuruhAja.</p>
            <div className="flex justify-center gap-2 pt-1">
              <button onClick={() => handleOpenAuthModal('login', 'merchant')} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow cursor-pointer">
                Login Toko
              </button>
              <button onClick={() => handleOpenAuthModal('register', 'merchant')} className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-black text-xs rounded-xl shadow cursor-pointer">
                Daftar Toko Baru
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-3">
              <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-600" /> Tambah Menu Makanan / Minuman
              </h4>
              <form onSubmit={handleAddMenu} className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Nama menu (contoh: Ayam Bakar Madu)..." 
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full bg-white border border-slate-300 p-2 rounded-xl text-xs focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Harga (Rp)..." 
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 p-2 rounded-xl text-xs focus:outline-none"
                    required
                  />
                  <button type="submit" className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs cursor-pointer shadow">
                    + Tambah
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800">Daftar Menu Toko ({storeMenus.length})</h4>
              {storeMenus.length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-[11px]">Belum ada menu yang ditambahkan.</p>
              ) : (
                storeMenus.map((m: any) => (
                  <div key={m.id} className="p-3 bg-slate-50 border rounded-2xl flex justify-between items-center shadow-sm">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{m.name}</h5>
                      <p className="text-[10px] text-amber-700 font-bold">Rp {Number(m.price).toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => toggleAvailability(m.id)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${m.isAvailable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                    >
                      {m.isAvailable ? 'Tersedia' : 'Stok Habis'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminPortal({ 
  sessionUser, registeredUsers, setRegisteredUsers, helpersList, setHelpersList, 
  foodStores, setFoodStores, orders, setOrders, handleLogout, handleOpenAuthModal, showToast 
}: any) {
  const [adminTab, setAdminTab] = useState<'analytics' | 'users' | 'orders' | 'vouchers' | 'broadcast' | 'staff'>('analytics');
  
  const totalGmv = orders.reduce((sum: number, o: any) => sum + Number(o.price || 0), 0);
  const platformCommission = Math.round(totalGmv * 0.15);
  const completedOrdersCount = orders.filter((o: any) => o.status === 'completed').length;
  const ongoingOrdersCount = orders.filter((o: any) => o.status !== 'completed').length;

  const [selectedUserForTopUp, setSelectedUserForTopUp] = useState<any>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [inspectKtpUser, setInspectKtpUser] = useState<any>(null);

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);

  const [vouchers, setVouchers] = useState<any[]>([
    { id: 'v1', code: 'SURUH20', discount: 20000, minSpend: 50000, active: true },
    { id: 'v2', code: 'WARUNGKULINER', discount: 10000, minSpend: 30000, active: true }
  ]);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState('');
  const [newVoucherMinSpend, setNewVoucherMinSpend] = useState('');

  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const [staffList, setStaffList] = useState<any[]>([
    { id: 'adm-1', name: 'Ahmad Verifikasi', contact: 'verifikasi@suruhaja.com', roleType: 'KYC & Verifikasi KTP', title: 'Senior Verifier' },
    { id: 'adm-2', name: 'Siti Finance', contact: 'finance@suruhaja.com', roleType: 'Keuangan & Top-Up', title: 'Treasury Admin' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffContact, setNewStaffContact] = useState('');
  const [newStaffPass, setNewStaffPass] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Verifikasi KTP & Merchant');

  const handleToggleSuspend = (contact: string) => {
    setRegisteredUsers((prev: any) => prev.map((u: any) => u.contact === contact ? { ...u, isSuspended: !u.isSuspended } : u));
    setHelpersList((prev: any) => prev.map((h: any) => h.contact === contact || h.id === contact ? { ...h, isSuspended: !h.isSuspended } : h));
    showToast("Status suspend akun pengguna berhasil diperbarui!", "info");
  };

  const handleExecuteTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTopUp || !topUpAmount) return;

    setRegisteredUsers((prev: any) => prev.map((u: any) => u.contact === selectedUserForTopUp.contact ? { ...u, balance: (u.balance || 0) + Number(topUpAmount) } : u));
    showToast(`Top Up Rp ${Number(topUpAmount).toLocaleString('id-ID')} ke ${selectedUserForTopUp.name} berhasil!`, "success");
    setSelectedUserForTopUp(null);
    setTopUpAmount('');
  };

  const handleApproveMitra = (helperId: string) => {
    setHelpersList((prev: any) => prev.map((h: any) => h.id === helperId ? { ...h, isVerified: true } : h));
    showToast("Mitra Jasa berhasil diverifikasi & diaktifkan!", "success");
    setInspectKtpUser(null);
  };

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode || !newVoucherDiscount) return;
    const voucher = {
      id: `v-${Date.now()}`,
      code: newVoucherCode.toUpperCase().trim(),
      discount: Number(newVoucherDiscount),
      minSpend: Number(newVoucherMinSpend) || 0,
      active: true
    };
    setVouchers([voucher, ...vouchers]);
    setNewVoucherCode('');
    setNewVoucherDiscount('');
    setNewVoucherMinSpend('');
    showToast(`Voucher Promo "${voucher.code}" berhasil diterbitkan!`, "success");
  };

  const handleToggleVoucher = (id: string) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, active: !v.active } : v));
    showToast("Status voucher promo diperbarui!", "info");
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    showToast(`Broadcast Notifikasi terkirim ke target: ${broadcastTarget.toUpperCase()}!`, "success");
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffContact || !newStaffPass) return;
    const staff = {
      id: `adm-${Date.now()}`,
      name: newStaffName,
      contact: newStaffContact,
      roleType: newStaffRole,
      title: 'Staf Terdaftar'
    };
    setStaffList([staff, ...staffList]);
    setNewStaffName('');
    setNewStaffContact('');
    setNewStaffPass('');
    showToast(`Staf Sub-Admin "${staff.name}" berhasil ditambahkan!`, "success");
  };

  const handleForceOrderStatus = (orderId: string, status: string) => {
    setOrders((prev: any) => prev.map((o: any) => o.id === orderId ? { ...o, status, stepIndex: status === 'completed' ? 3 : o.stepIndex } : o));
    showToast(`Status pesanan ${orderId} diubah menjadi ${status.toUpperCase()}`, "info");
    setSelectedOrderDetails(null);
  };

  const filteredUsers = registeredUsers.filter((u: any) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = userSearchTerm === '' || 
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      u.contact.toLowerCase().includes(userSearchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const filteredOrders = orders.filter((o: any) => {
    if (orderStatusFilter === 'ongoing') return o.status !== 'completed';
    if (orderStatusFilter === 'completed') return o.status === 'completed';
    return true;
  });

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-950 text-slate-100 rounded-3xl shadow-2xl flex-1 flex flex-col overflow-hidden border border-slate-800">
      <div className="bg-slate-900 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5">
              <span>Master Admin Console</span>
              <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-2 py-0.5 rounded-full border border-indigo-500/40 uppercase">V3 Enterprise</span>
            </h3>
            <p className="text-[10px] text-slate-400">Pusat Kendali Operasional, Keuangan, & Komisi Platform</p>
          </div>
        </div>

        {!sessionUser ? (
          <button onClick={() => handleOpenAuthModal('login', 'admin')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shadow">
            Login Admin
          </button>
        ) : (
          <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        )}
      </div>

      {!sessionUser ? (
        <div className="p-8 text-center text-slate-400 space-y-3 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 my-auto mx-4">
          <Shield className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
          <h4 className="font-bold text-base text-white">Login Master Admin Required</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Gunakan akun resmi Master Admin (<strong className="text-indigo-300">admin@suruhaja.com</strong>) untuk mengelola data pengguna, antrean KYC, transaksi live, dan keuangan platform.</p>
          <button onClick={() => handleOpenAuthModal('login', 'admin')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer inline-flex items-center gap-2">
            <Lock className="w-4 h-4" /> Login Admin Sekarang
          </button>
        </div>
      ) : (
        <>
          <div className="flex bg-slate-900 border-b border-slate-800 text-[11px] font-bold overflow-x-auto scrollbar-none shrink-0">
            <button 
              onClick={() => setAdminTab('analytics')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'analytics' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analitik & GMV
            </button>
            <button 
              onClick={() => setAdminTab('users')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'users' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <Users className="w-3.5 h-3.5" /> Pengguna & KYC
            </button>
            <button 
              onClick={() => setAdminTab('orders')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'orders' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Pesanan Live ({orders.length})
            </button>
            <button 
              onClick={() => setAdminTab('vouchers')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'vouchers' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <Ticket className="w-3.5 h-3.5" /> CMS Voucher
            </button>
            <button 
              onClick={() => setAdminTab('broadcast')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'broadcast' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <Radio className="w-3.5 h-3.5" /> Broadcast
            </button>
            <button 
              onClick={() => setAdminTab('staff')}
              className={`px-4 py-3 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${adminTab === 'staff' ? 'bg-slate-950 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Staf Admin ({staffList.length})
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
            {adminTab === 'analytics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" /> Total GMV Transaksi
                    </p>
                    <p className="text-sm font-black text-emerald-400 mt-1">Rp {totalGmv.toLocaleString('id-ID')}</p>
                    <span className="text-[9px] text-slate-500">Nilai Kotor Transaksi</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-indigo-400" /> Estimasi Komisi (15%)
                    </p>
                    <p className="text-sm font-black text-indigo-400 mt-1">Rp {platformCommission.toLocaleString('id-ID')}</p>
                    <span className="text-[9px] text-slate-500">Pendapatan Bersih Platform</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-amber-400" /> Transaksi Selesai
                    </p>
                    <p className="text-sm font-black text-amber-400 mt-1">{completedOrdersCount} Pesanan</p>
                    <span className="text-[9px] text-slate-500">{ongoingOrdersCount} Aktif Berjalan</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" /> Akun Terdaftar
                    </p>
                    <p className="text-sm font-black text-blue-400 mt-1">{registeredUsers.length} User</p>
                    <span className="text-[9px] text-slate-500">{helpersList.length} Mitra • {foodStores.length} Warung</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" /> Ringkasan Pembagian Komisi & Kategori Popularitas
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-bold">🛠️ Pertukangan & Perbaikan (SuruhFix)</span>
                      <span className="font-mono text-emerald-400 font-extrabold">Komisi 15%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-bold">🍔 Warung Kuliner (SuruhFood)</span>
                      <span className="font-mono text-emerald-400 font-extrabold">Komisi 12%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300 font-bold">🌴 Jasa Khusus Kebun Sawit & Dodos</span>
                      <span className="font-mono text-emerald-400 font-extrabold">Komisi 10%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'users' && (
              <div className="space-y-3">
                <div className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800">
                  <div className="flex-1 flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau No. HP..." 
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                    />
                  </div>
                  <select 
                    value={userRoleFilter} 
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl text-xs focus:outline-none font-bold"
                  >
                    <option value="all">Semua Peran</option>
                    <option value="customer">Pelanggan</option>
                    <option value="helper">Mitra Jasa</option>
                    <option value="merchant">Toko Kuliner</option>
                  </select>
                </div>

                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      Tidak ada data pengguna terdaftar yang sesuai kriteria pencarian.
                    </div>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <div key={u.contact} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <h5 className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                            <span>{u.name}</span>
                            <span className={`text-[9px] px-2 py-0.2 rounded font-mono font-bold uppercase ${u.role === 'helper' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : u.role === 'merchant' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-950 text-blue-400 border border-blue-800'}`}>
                              {u.role}
                            </span>
                            {u.isSuspended && (
                              <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.2 rounded font-bold border border-red-800">
                                Suspended
                              </span>
                            )}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">{u.contact} • Alamat: {u.address || 'Utama'} • Saldo: <strong className="text-emerald-400">Rp {(u.balance || 0).toLocaleString('id-ID')}</strong></p>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          {u.ktpNumber && (
                            <button 
                              onClick={() => setInspectKtpUser(u)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded-lg text-[10px] border border-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" /> Verifikasi KTP
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedUserForTopUp(u)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] shadow cursor-pointer"
                          >
                            Top Up
                          </button>
                          <button 
                            onClick={() => handleToggleSuspend(u.contact)}
                            className={`px-2 py-1 font-bold rounded-lg text-[10px] cursor-pointer ${u.isSuspended ? 'bg-emerald-600 text-white' : 'bg-red-600/80 hover:bg-red-600 text-white'}`}
                          >
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {adminTab === 'orders' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-slate-300">Pantau Seluruh Transaksi Masuk Platform</h4>
                  <div className="flex gap-1 text-[10px] bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setOrderStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${orderStatusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Semua ({orders.length})
                    </button>
                    <button 
                      onClick={() => setOrderStatusFilter('ongoing')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${orderStatusFilter === 'ongoing' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Diproses ({ongoingOrdersCount})
                    </button>
                    <button 
                      onClick={() => setOrderStatusFilter('completed')}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${orderStatusFilter === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                    >
                      Selesai ({completedOrdersCount})
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      Belum ada transaksi pesanan yang sesuai filter.
                    </div>
                  ) : (
                    filteredOrders.map((ord: any) => (
                      <div key={ord.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[9px] text-indigo-400 font-bold bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">{ord.id}</span>
                            <h5 className="font-extrabold text-white text-xs mt-1">{ord.service}</h5>
                            <p className="text-[10px] text-slate-400">Pemesan: {ord.customerName} ({ord.customerContact})</p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-emerald-400 text-xs block">Rp {ord.price.toLocaleString('id-ID')}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase inline-block mt-1 ${ord.status === 'completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'}`}>
                              {ord.status === 'completed' ? 'Selesai' : 'Tahap ' + (ord.stepIndex || 1) + '/3'}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2 rounded-xl text-[10px] text-slate-300 flex justify-between items-center border border-slate-800">
                          <span className="truncate">📍 {ord.address}</span>
                          <button 
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="text-indigo-400 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                          >
                            Tindakan Admin & Detail
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {adminTab === 'vouchers' && (
              <div className="space-y-3">
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-indigo-400" /> Terbitkan Voucher Promo Baru
                  </h4>
                  <form onSubmit={handleAddVoucher} className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Kode Promo (contoh: SURUH20K)..." 
                      value={newVoucherCode}
                      onChange={(e) => setNewVoucherCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none uppercase font-mono font-bold"
                      required
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Nilai Diskon (Rp)..." 
                        value={newVoucherDiscount}
                        onChange={(e) => setNewVoucherDiscount(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                      <input 
                        type="number" 
                        placeholder="Min Trax (Rp)..." 
                        value={newVoucherMinSpend}
                        onChange={(e) => setNewVoucherMinSpend(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs cursor-pointer shadow">
                        + Terbitkan
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-300">Daftar Voucher Promo Aktif Platform</h4>
                  {vouchers.map((v) => (
                    <div key={v.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="font-mono font-black text-amber-400 text-xs bg-amber-950 px-2 py-0.5 rounded border border-amber-800">{v.code}</span>
                        <p className="text-[10px] text-slate-300 mt-1">Diskon: <strong className="text-emerald-400">Rp {v.discount.toLocaleString('id-ID')}</strong> (Min: Rp {v.minSpend.toLocaleString('id-ID')})</p>
                      </div>
                      <button 
                        onClick={() => handleToggleVoucher(v.id)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold cursor-pointer ${v.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}
                      >
                        {v.active ? 'Aktif' : 'Non-Aktif'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'broadcast' && (
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-indigo-400" /> Kirim Broadcast Blast Massal
                </h4>
                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Penerima</label>
                    <select 
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none mt-1"
                    >
                      <option value="all">Seluruh Pengguna Platform (Semua Role)</option>
                      <option value="customer">Pelanggan Saja</option>
                      <option value="helper">Mitra Jasa Saja</option>
                      <option value="merchant">Toko Kuliner Saja</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Judul Pengumuman</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Promo Spesial Akhir Pekan SuruhAja..." 
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Isi Pesan Notifikasi</label>
                    <textarea 
                      rows={3} 
                      placeholder="Tulis pesan lengkap yang akan langsung membunyikan nada chime di HP pengguna..." 
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none mt-1"
                      required
                    />
                  </div>

                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs cursor-pointer shadow flex items-center justify-center gap-1.5">
                    <Send className="w-4 h-4" /> Kirim Broadcast Sekarang
                  </button>
                </form>
              </div>
            )}

            {adminTab === 'staff' && (
              <div className="space-y-3">
                <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Tambah Staf Sub-Admin Baru
                  </h4>
                  <form onSubmit={handleAddStaff} className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Nama Staf Admin..." 
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                      required
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Email / No HP Staf..." 
                        value={newStaffContact}
                        onChange={(e) => setNewStaffContact(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                      <input 
                        type="password" 
                        placeholder="Password Staf..." 
                        value={newStaffPass}
                        onChange={(e) => setNewStaffPass(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                    <select 
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value="Verifikasi KTP & Merchant">Divisi Verifikasi KTP & Merchant</option>
                      <option value="Finance & Top-Up Audit">Divisi Keuangan & Top-Up Audit</option>
                      <option value="Customer Support 24 Jam">Divisi Customer Support 24 Jam</option>
                    </select>
                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs cursor-pointer shadow">
                      + Tambah Staf Admin
                    </button>
                  </form>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-300">Daftar Staf Admin Terdaftar</h4>
                  {staffList.map((st) => (
                    <div key={st.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-white text-xs">{st.name} <span className="text-[10px] text-indigo-400 font-mono">({st.title})</span></h5>
                        <p className="text-[10px] text-slate-400">{st.contact} • Role: {st.roleType}</p>
                      </div>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">Terverifikasi</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedUserForTopUp && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative">
            <button onClick={() => setSelectedUserForTopUp(null)} className="absolute top-4 right-4 text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 text-center">Top Up Saldo Manual</h3>
            <p className="text-[10px] text-slate-500 text-center">Isi saldo untuk {selectedUserForTopUp.name}</p>
            <form onSubmit={handleExecuteTopUp} className="space-y-3 pt-2">
              <input 
                type="number" 
                placeholder="Jumlah nominal (Rp)..." 
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full p-2.5 border rounded-xl font-bold text-xs focus:outline-none"
                required
              />
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl cursor-pointer shadow">
                Eksekusi Top Up
              </button>
            </form>
          </div>
        </div>
      )}

      {inspectKtpUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative">
            <button onClick={() => setInspectKtpUser(null)} className="absolute top-4 right-4 text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 text-center">Verifikasi KTP & Berkas Mitra</h3>
            <div className="bg-slate-50 p-3 rounded-2xl border space-y-1.5">
              <p><strong>Nama:</strong> {inspectKtpUser.name}</p>
              <p><strong>Kontak:</strong> {inspectKtpUser.contact}</p>
              <p><strong>No. KTP (NIK):</strong> <span className="font-mono font-extrabold text-indigo-600">{inspectKtpUser.ktpNumber || '3174092812890001'}</span></p>
              <p><strong>Spesialisasi:</strong> {inspectKtpUser.specialty || 'Mitra Jasa Multi-Skill'}</p>
            </div>
            <div className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 text-center">
              <p className="text-[10px] italic">📸 Dokumen Identitas KTP Terlampir & Terverifikasi Sistem</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => setInspectKtpUser(null)} 
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button 
                onClick={() => handleApproveMitra(inspectKtpUser.contact)} 
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl cursor-pointer shadow"
              >
                Setujui & Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative">
            <button onClick={() => setSelectedOrderDetails(null)} className="absolute top-4 right-4 text-slate-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900 text-center">Tindakan Darurat Admin Pesanan</h3>
            <div className="bg-slate-50 p-3 rounded-2xl border space-y-1">
              <p><strong>ID Pesanan:</strong> {selectedOrderDetails.id}</p>
              <p><strong>Layanan:</strong> {selectedOrderDetails.service}</p>
              <p><strong>Pemesan:</strong> {selectedOrderDetails.customerName} ({selectedOrderDetails.customerContact})</p>
              <p><strong>Total Harga:</strong> Rp {selectedOrderDetails.price.toLocaleString('id-ID')}</p>
              <p><strong>Status Saat Ini:</strong> {selectedOrderDetails.status}</p>
            </div>
            <div className="space-y-2 pt-1">
              <button 
                onClick={() => handleForceOrderStatus(selectedOrderDetails.id, 'completed')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl cursor-pointer shadow"
              >
                Selesaikan Pesanan Ini Secara Paksa
              </button>
              <button 
                onClick={() => handleForceOrderStatus(selectedOrderDetails.id, 'cancelled')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl cursor-pointer shadow"
              >
                Batalkan Pesanan & Refund Saldo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthModal({ isOpen, onClose, initialMode, initialRole, onAuthSuccess, registeredUsers, setRegisteredUsers, helpersList, setHelpersList, foodStores, setFoodStores, showToast }: any) {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register'>(initialMode || 'login');
  const [role, setRole] = useState<'customer' | 'helper' | 'merchant' | 'admin'>(initialRole || 'customer');

  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  
  const [specialty, setSpecialty] = useState('Pertukangan & Perbaikan');
  const [customRate, setCustomRate] = useState('50000');
  const [ktpNumber, setKtpNumber] = useState('');
  const [storeCategory, setStoreCategory] = useState('Kuliner Makanan & Minuman');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode || 'login');
    const safeRole = (initialMode === 'register' && initialRole === 'admin') ? 'customer' : (initialRole || 'customer');
    setRole(safeRole);
  }, [initialMode, initialRole, isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'register' && role === 'admin') {
      showToast("Pendaftaran akun Admin secara mandiri tidak diizinkan!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const bodyData = mode === 'login' 
        ? { contact, password }
        : { role, name, address, contact, password, ktpNumber, specialty };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (res.ok) {
        const userObj = data.user || { name, contact, role, address, balance: role === 'customer' ? 50000 : 0 };
        
        if (mode === 'register') {
          setRegisteredUsers((prev: any) => [...prev, userObj]);
          if (role === 'helper') {
            const newHelper = {
              id: contact,
              contact: contact,
              name: name,
              rating: 5.0,
              jobs: 0,
              avatar: null,
              specialtyService: specialty || 'Jasa Multi-Skill',
              customRate: Number(customRate) || 50000,
              bio: `Siap melayani kebutuhan ${specialty || 'jasa panggilan'}.`,
              skills: [{ id: `sk-${Date.now()}`, name: specialty || 'Jasa Utama', rate: Number(customRate) || 50000, desc: 'Layanan utama' }]
            };
            setHelpersList((prev: any) => [newHelper, ...prev]);
          } else if (role === 'merchant') {
            const newStore = {
              id: contact,
              contact: contact,
              name: name,
              category: storeCategory,
              rating: 5.0,
              image: null,
              address: address || 'Lokasi Warung Utama',
              menu: []
            };
            setFoodStores((prev: any) => [newStore, ...prev]);
          }
        }

        showToast(`${mode === 'login' ? 'Login' : 'Pendaftaran'} berhasil! Selamat datang, ${userObj.name}`, 'success');
        onAuthSuccess(role, userObj);
        onClose();
      } else {
        if (mode === 'login') {
          const match = registeredUsers.find((u: any) => u.contact === contact && u.password === password);
          if (match) {
            if (match.isSuspended) {
              showToast('Akun Anda ditangguhkan (suspend) oleh Admin.', 'error');
            } else {
              showToast(`Login berhasil! Selamat datang, ${match.name}`, 'success');
              onAuthSuccess(match.role || role, match);
              onClose();
            }
          } else {
            showToast(data.error || 'No. HP/Email atau Password salah!', 'error');
          }
        } else {
          showToast(data.error || 'Pendaftaran gagal. Periksa kembali data Anda.', 'error');
        }
      }
    } catch (err) {
      if (mode === 'login') {
        const match = registeredUsers.find((u: any) => u.contact === contact && u.password === password);
        if (match) {
          showToast(`Login Offline Berhasil! Selamat datang, ${match.name}`, 'success');
          onAuthSuccess(match.role || role, match);
          onClose();
        } else {
          showToast('Koneksi gagal & kredensial tidak ditemukan.', 'error');
        }
      } else {
        const newUserObj = { contact, password, name, address, role, balance: role === 'customer' ? 50000 : 0 };
        setRegisteredUsers((prev: any) => [...prev, newUserObj]);
        if (role === 'helper') {
          setHelpersList((prev: any) => [{
            id: contact, contact, name, rating: 5.0, jobs: 0, avatar: null,
            specialtyService: specialty, customRate: Number(customRate) || 50000, bio: `Siap melayani ${specialty}`, skills: []
          }, ...prev]);
        } else if (role === 'merchant') {
          setFoodStores((prev: any) => [{
            id: contact, contact, name, category: storeCategory, rating: 5.0, image: null, address, menu: []
          }, ...prev]);
        }
        showToast('Pendaftaran offline berhasil! Silakan gunakan akun Anda.', 'success');
        onAuthSuccess(role, newUserObj);
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login' ? 'Masuk ke SuruhAja' : 'Pendaftaran Akun Baru'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login' ? 'Akses portal layanan & kelola akun Anda' : 'Buat akun dalam hitungan detik gratis'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${mode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            {initialRole !== 'admin' && (
              <button 
                onClick={() => {
                  setMode('register');
                  if (role === 'admin') setRole('customer');
                }} 
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${mode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                Daftar Baru
              </button>
            )}
          </div>

          {initialRole !== 'admin' ? (
            <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
              <button 
                type="button"
                onClick={() => setRole('customer')} 
                className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${role === 'customer' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Pelanggan
              </button>
              <button 
                type="button"
                onClick={() => setRole('helper')} 
                className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${role === 'helper' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Mitra Jasa
              </button>
              <button 
                type="button"
                onClick={() => setRole('merchant')} 
                className={`py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${role === 'merchant' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Toko Kuliner
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl text-center font-extrabold text-xs text-indigo-900">
              🔑 Pintu Masuk Khusus Master Admin
            </div>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3 pt-1 text-xs">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase">
                {role === 'merchant' ? 'Nama Toko / Warung Kuliner' : 'Nama Lengkap'}
              </label>
              <input 
                type="text" 
                placeholder={role === 'merchant' ? 'Contoh: Warung Nasi Bebek Madura' : 'Nama sesuai KTP'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:outline-none mt-0.5"
                required
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold text-slate-600 uppercase">No. HP / Whatsapp / Email</label>
            <input 
              type="text" 
              placeholder="Contoh: admin@suruhaja.com atau 081234567890"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:outline-none mt-0.5"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-600 uppercase">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:outline-none mt-0.5"
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase">Alamat Lengkap Domisili</label>
              <input 
                type="text" 
                placeholder="Jl. Merdeka No. 123..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-medium focus:border-blue-600 focus:outline-none mt-0.5"
                required
              />
            </div>
          )}

          {mode === 'register' && role === 'helper' && (
            <div className="space-y-2 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
              <span className="font-bold text-[11px] text-emerald-900 block">Detail Registrasi Mitra Jasa</span>
              <div>
                <label className="text-[9px] font-bold text-emerald-800">Spesialisasi / Keahlian Utama</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Tukang Pangkas, Pijat Refleksi, Panen Sawit..."
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2 bg-white border rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-emerald-800">Tarif Standar (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="50000"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl text-xs focus:outline-none"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-bold text-emerald-800">Nomor KTP (16 Digit)</label>
                  <input 
                    type="text" 
                    placeholder="3174..."
                    value={ktpNumber}
                    onChange={(e) => setKtpNumber(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && role === 'merchant' && (
            <div className="space-y-2 bg-amber-50 p-3 rounded-2xl border border-amber-200">
              <span className="font-bold text-[11px] text-amber-900 block">Detail Registrasi Toko Kuliner</span>
              <div>
                <label className="text-[9px] font-bold text-amber-800">Kategori Kuliner</label>
                <select 
                  value={storeCategory}
                  onChange={(e) => setStoreCategory(e.target.value)}
                  className="w-full p-2 bg-white border rounded-xl text-xs focus:outline-none"
                >
                  <option value="Kuliner Makanan & Minuman">Kuliner Makanan & Minuman</option>
                  <option value="Warung Nasi & Rumah Makan">Warung Nasi & Rumah Makan</option>
                  <option value="Aneka Minuman & Kedai Kopi">Aneka Minuman & Kedai Kopi</option>
                  <option value="Jajanan Pasar & Snacking">Jajanan Pasar & Snacking</option>
                </select>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl font-black text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${role === 'helper' ? 'bg-emerald-600 hover:bg-emerald-500' : role === 'merchant' ? 'bg-amber-600 hover:bg-amber-500' : role === 'admin' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {initialRole === 'admin' && (
          <div className="text-center pt-2 border-t text-[10px] text-slate-500">
            Akun Master Admin: <strong className="font-mono text-slate-800">admin@suruhaja.com</strong> / <strong className="font-mono text-slate-800">masteradmin123</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [activeRole, setActiveRole] = useState('customer');

  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    playSuruhAjaChime();
    setTimeout(() => setToast(null), 3500);
  };

  const [customerAddress, setCustomerAddress] = useState('Lokasi Presisi GPS (Aktifkan Izin)');
  
  const [foodStores, setFoodStores] = useState<any[]>([]);
  const [helpersList, setHelpersList] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customerBalance, setCustomerBalance] = useState(0);

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([
    { role: 'admin', name: 'Riki Andi (Master Admin)', contact: 'admin@suruhaja.com', password: 'masteradmin123', position: 'Super Admin', balance: 5000000 }
  ]);

  const [sessions, setSessions] = useState<Record<string, any>>({
    customer: null,
    helper: null,
    merchant: null,
    admin: { role: 'admin', name: 'Riki Andi (Master Admin)', contact: 'admin@suruhaja.com' }
  });

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login' as 'login' | 'register',
    role: 'customer' as 'customer' | 'helper' | 'merchant' | 'admin'
  });

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login', role: 'customer' | 'helper' | 'merchant' | 'admin' = 'customer') => {
    setAuthModal({
      isOpen: true,
      mode,
      role
    });
  };

  const [customerTab, setCustomerTab] = useState('home');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showCsModal, setShowCsModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedReviewEntity, setSelectedReviewEntity] = useState<any>(null);

  const [csChatMessages, setCsChatMessages] = useState<Array<{ sender: 'cs' | 'user'; text: string; time: string }>>([
    { sender: 'cs', text: 'Halo 👋 Saya Siti dari Customer Care SuruhAja 24 Jam. Ada yang bisa saya bantu terkait pesanan atau kendala Anda hari ini?', time: 'Baru saja' }
  ]);
  const [csChatInput, setCsChatInput] = useState('');
  const [csTab, setCsTab] = useState<'chat' | 'ticket' | 'faq'>('chat');
  const [ticketTopic, setTicketTopic] = useState('Kendala Pesanan / Pembayaran');
  const [ticketDesc, setTicketDesc] = useState('');

  const [topUpNominal, setTopUpNominal] = useState<number>(50000);
  const [topUpMethod, setTopUpMethod] = useState<'qris' | 'va' | 'ewallet'>('qris');

  const [tempAddressInput, setTempAddressInput] = useState(customerAddress);

  const handleSendCsMessage = (textToSend?: string) => {
    const query = textToSend || csChatInput;
    if (!query.trim()) return;

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user' as const, text: query, time: timeNow };
    
    setCsChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setCsChatInput('');

    setTimeout(() => {
      let csReply = "Terima kasih telah menghubungi CS SuruhAja. Tim operasional kami sedang memproses laporan Anda. Harap tunggu sebentar ya kak!";
      const lower = query.toLowerCase();

      if (lower.includes('top up') || lower.includes('isi saldo')) {
        csReply = "Untuk Top Up Saldo, silakan klik tombol '+ Top Up' di pojok kanan atas aplikasi. Anda dapat memilih pembayaran via QRIS Instant, Virtual Account Bank, atau E-Wallet.";
      } else if (lower.includes('batal') || lower.includes('refund')) {
        csReply = "Jika ingin membatalkan pesanan, silakan buka tab 'Pesanan Saya' dan hubungi Mitra/Admin. Saldo akan otomatis di-refund 100% jika pesanan dibatalkan sebelum diproses.";
      } else if (lower.includes('mitra') || lower.includes('daftar') || lower.includes('warung')) {
        csReply = "Untuk mendaftar sebagai Mitra Jasa atau Toko Kuliner, silakan klik tombol 'Login / Daftar' lalu pilih kategori 'Mitra Jasa' atau 'Toko Kuliner' secara gratis!";
      } else if (lower.includes('lambat') || lower.includes('lama') || lower.includes('respon')) {
        csReply = "Mohon maaf atas ketidaknyamanannya. Kami telah mengirimkan peringatan prioritas ke Mitra/Merchant terkait untuk segera memproses pesanan Anda.";
      }

      setCsChatMessages(prev => [...prev, { sender: 'cs', text: csReply, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }]);
      playSuruhAjaChime();
    }, 800);
  };

  const handleSubmitCsTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketDesc.trim()) return;
    showToast(`Tiket kendala "${ticketTopic}" berhasil dikirim ke Admin CS 24 Jam!`, "success");
    setTicketDesc('');
    setCsTab('chat');
  };

  const handleExecuteCustomerTopUp = () => {
    if (topUpNominal <= 0) return;
    setCustomerBalance((prev: number) => prev + topUpNominal);
    showToast(`Top Up Rp ${topUpNominal.toLocaleString('id-ID')} via ${topUpMethod.toUpperCase()} Berhasil!`, "success");
    setShowTopUpModal(false);
  };

  const checkAuthGuard = (role: string, actionCallback?: () => void) => {
    if (!sessions[role]) {
      showToast("Silakan login terlebih dahulu untuk menggunakan fitur ini.", "error");
      handleOpenAuthModal('login', role as any);
      return false;
    }
    if (actionCallback) actionCallback();
    return true;
  };

  const handleProgressOrder = (orderId: string) => {
    setOrders((prev: any) => prev.map((ord: any) => {
      if (ord.id === orderId) {
        const nextStep = (ord.stepIndex || 0) + 1;
        const isDone = nextStep >= 3;
        return { ...ord, stepIndex: nextStep, status: isDone ? 'completed' : 'ongoing' };
      }
      return ord;
    }));
    showToast("Tahap pengerjaan tugas berhasil diperbarui!", "success");
  };

  const handleRateOrder = (orderId: string, rating: number, comment: string) => {
    setOrders((prev: any) => prev.map((ord: any) => ord.id === orderId ? { ...ord, isReviewed: true, rating, reviewComment: comment } : ord));
    showToast("Terima kasih! Ulasan & rating bintang Anda telah tersimpan.", "success");
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 font-sans text-slate-800 flex flex-col p-0 sm:p-4 relative overflow-x-hidden">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] px-4 py-2.5 rounded-2xl shadow-2xl font-extrabold text-xs text-white border transition-all animate-bounce ${toast.type === 'error' ? 'bg-red-600 border-red-400' : 'bg-emerald-600 border-emerald-400'}`}>
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-md sm:max-w-lg mx-auto mb-3 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex text-xs font-bold shrink-0 shadow-lg">
        <button 
          onClick={() => setActiveRole('customer')} 
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${activeRole === 'customer' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Pelanggan
        </button>
        <button 
          onClick={() => setActiveRole('helper')} 
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${activeRole === 'helper' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Mitra Jasa
        </button>
        <button 
          onClick={() => setActiveRole('merchant')} 
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${activeRole === 'merchant' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Toko Kuliner
        </button>
        <button 
          onClick={() => setActiveRole('admin')} 
          className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${activeRole === 'admin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
        >
          Admin 🔒
        </button>
      </div>

      {activeRole === 'customer' && (
        <CustomerApp 
          customerTab={customerTab} setCustomerTab={setCustomerTab}
          aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
          handleParseAiPrompt={() => showToast("Pencarian AI menemukan jasa sesuai kata kunci!", "info")}
          handleDirectServiceOrder={(service: any, helper?: any, merchant?: any) => {
            if (!checkAuthGuard('customer')) return;
            const newOrder = {
              id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
              customerName: sessions.customer?.name || 'Pelanggan',
              customerContact: sessions.customer?.contact || '08123456789',
              helperId: helper?.id || null,
              helperName: helper?.name || null,
              merchantId: merchant?.id || null,
              merchantName: merchant?.name || null,
              service: service.name,
              description: service.desc || 'Jasa panggilan cepat.',
              price: service.price || 50000,
              address: customerAddress,
              status: 'ongoing',
              stepIndex: 1
            };
            setOrders([newOrder, ...orders]);
            setCustomerTab('orders');
            showToast(`Pesanan "${service.name}" berhasil dibuat!`, "success");
          }}
          orders={orders} customerBalance={customerBalance}
          sessionUser={sessions.customer}
          handleLogout={() => setSessions((prev: any) => ({ ...prev, customer: null }))}
          handleOpenAuthModal={handleOpenAuthModal}
          setShowTopUpModal={setShowTopUpModal}
          setShowCsModal={setShowCsModal}
          helpersList={helpersList}
          foodStores={foodStores}
          handleRateOrder={handleRateOrder}
          customerAddress={customerAddress}
          setShowAddressModal={setShowAddressModal}
          servicesList={INITIAL_SERVICES}
          checkAuthGuard={checkAuthGuard}
          setSelectedReviewEntity={setSelectedReviewEntity}
          setShowNotifModal={setShowNotifModal}
          unreadNotifCount={0}
        />
      )}

      {activeRole === 'helper' && (
        <HelperPortal 
          sessionUser={sessions.helper}
          orders={orders}
          handleProgressOrder={handleProgressOrder}
          handleLogout={() => setSessions((prev: any) => ({ ...prev, helper: null }))}
          handleOpenAuthModal={handleOpenAuthModal}
          helpersList={helpersList}
          setHelpersList={setHelpersList}
          showToast={showToast}
        />
      )}

      {activeRole === 'merchant' && (
        <MerchantPortal 
          sessionUser={sessions.merchant}
          foodStores={foodStores}
          setFoodStores={setFoodStores}
          orders={orders}
          handleLogout={() => setSessions((prev: any) => ({ ...prev, merchant: null }))}
          handleOpenAuthModal={handleOpenAuthModal}
          showToast={showToast}
        />
      )}

      {activeRole === 'admin' && (
        <AdminPortal 
          sessionUser={sessions.admin}
          registeredUsers={registeredUsers}
          setRegisteredUsers={setRegisteredUsers}
          helpersList={helpersList}
          setHelpersList={setHelpersList}
          foodStores={foodStores}
          setFoodStores={setFoodStores}
          orders={orders}
          setOrders={setOrders}
          handleLogout={() => setSessions((prev: any) => ({ ...prev, admin: null }))}
          handleOpenAuthModal={handleOpenAuthModal}
          showToast={showToast}
        />
      )}

      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
        initialMode={authModal.mode}
        initialRole={authModal.role}
        onAuthSuccess={(role: string, userObj: any) => {
          setSessions(prev => ({ ...prev, [role]: userObj }));
          if (role === 'admin') {
            setActiveRole('admin');
          }
        }}
        registeredUsers={registeredUsers}
        setRegisteredUsers={setRegisteredUsers}
        helpersList={helpersList}
        setHelpersList={setHelpersList}
        foodStores={foodStores}
        setFoodStores={setFoodStores}
        showToast={showToast}
      />

      {selectedReviewEntity && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 space-y-3 text-xs shadow-2xl relative max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Ulasan & Rating: {selectedReviewEntity.data?.name}</h3>
                <p className="text-[10px] text-slate-500">⭐ {selectedReviewEntity.data?.rating || 5.0} • Total ({selectedReviewEntity.data?.reviews?.length || 0} Ulasan)</p>
              </div>
              <button onClick={() => setSelectedReviewEntity(null)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {(!selectedReviewEntity.data?.reviews || selectedReviewEntity.data.reviews.length === 0) ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <Star className="w-8 h-8 text-amber-300 mx-auto opacity-50" />
                  <p className="text-[11px]">Belum ada ulasan tertulis dari pelanggan.</p>
                </div>
              ) : (
                selectedReviewEntity.data.reviews.map((rev: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 border rounded-2xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{rev.customerName || 'Pelanggan'}</span>
                      <span className="text-amber-500 font-extrabold text-[10px]">{"⭐".repeat(rev.rating || 5)}</span>
                    </div>
                    <p className="text-slate-600 italic text-[11px]">"{rev.comment || rev.reviewComment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showCsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3 text-xs shadow-2xl relative max-h-[85vh] flex flex-col border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2.5 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-2xl border border-blue-200">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Layanan Bantuan CS 24 Jam</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.2 rounded-full border border-emerald-300 font-bold">Online Live</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">Pusat Bantuan, Kendala Pesanan & Support Pelanggan</p>
                </div>
              </div>
              <button onClick={() => setShowCsModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold shrink-0">
              <button 
                onClick={() => setCsTab('chat')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${csTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                💬 Chat Live CS
              </button>
              <button 
                onClick={() => setCsTab('ticket')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${csTab === 'ticket' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                📝 Lapor Kendala
              </button>
              <button 
                onClick={() => setCsTab('faq')}
                className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${csTab === 'faq' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
              >
                ❓ Bantuan FAQ
              </button>
            </div>

            {csTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[9px] font-bold shrink-0">
                  <button 
                    onClick={() => handleSendCsMessage("Bagaimana cara Top Up saldo?")}
                    className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap"
                  >
                    💳 Cara Top Up
                  </button>
                  <button 
                    onClick={() => handleSendCsMessage("Pesanan saya belum diproses Mitra")}
                    className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap"
                  >
                    ⏳ Pesanan Lambat
                  </button>
                  <button 
                    onClick={() => handleSendCsMessage("Bagaimana cara batalkan pesanan & refund?")}
                    className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap"
                  >
                    ❌ Batal & Refund
                  </button>
                  <button 
                    onClick={() => handleSendCsMessage("Cara daftar jadi Mitra Jasa / Warung?")}
                    className="shrink-0 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-2.5 py-1 rounded-full cursor-pointer whitespace-nowrap"
                  >
                    🚀 Daftar Mitra/Warung
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
                  {csChatMessages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`p-2.5 rounded-2xl text-[11px] ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-sm' : 'bg-white border text-slate-800 rounded-bl-none shadow-sm'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 shrink-0 pt-1">
                  <input 
                    type="text" 
                    placeholder="Ketik pertanyaan atau kendala Anda..."
                    value={csChatInput}
                    onChange={(e) => setCsChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCsMessage()}
                    className="flex-1 p-2.5 border rounded-xl text-xs focus:outline-none focus:border-blue-600"
                  />
                  <button 
                    onClick={() => handleSendCsMessage()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {csTab === 'ticket' && (
              <form onSubmit={handleSubmitCsTicket} className="space-y-3 py-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Kategori Kendala</label>
                  <select 
                    value={ticketTopic}
                    onChange={(e) => setTicketTopic(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-xs focus:outline-none mt-1"
                  >
                    <option value="Kendala Pesanan / Pembayaran">Kendala Pesanan / Pembayaran Saldo</option>
                    <option value="Perilaku Mitra / Driver">Laporan Perilaku Mitra / Driver</option>
                    <option value="Akun / Keamanan Lupa Password">Masalah Akun / Keamanan</option>
                    <option value="Kritik & Saran Layanan">Kritik & Saran Pengembangan</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Rincian Kendala Lengkap</label>
                  <textarea 
                    rows={4} 
                    placeholder="Tuliskan nomor pesanan, kronologi kendala, dan bukti pendukung..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-medium text-xs focus:outline-none mt-1"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Tiket Laporan CS
                </button>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-600" /> Garansi Penanganan CS 24 Jam</p>
                  <p className="text-slate-600">Tiket laporan Anda akan ditinjau oleh Tim Operasional Admin CS dalam waktu maksimal 1x24 jam.</p>
                </div>
              </form>
            )}

            {csTab === 'faq' && (
              <div className="space-y-3 py-1 overflow-y-auto max-h-[300px]">
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border rounded-2xl space-y-1">
                    <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Bagaimana cara pesan jasa panggilan?</h5>
                    <p className="text-slate-600 text-[11px]">Pilih kategori jasa di beranda atau gunakan fitur "Suruh AI", tentukan lokasi GPS Anda, dan buat pesanan. Mitra terdekat akan segera merespon.</p>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-2xl space-y-1">
                    <h5 className="font-extrabold text-xs text-slate-900 flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Apakah transaksi di SuruhAja aman?</h5>
                    <p className="text-slate-600 text-[11px]">Ya, seluruh Mitra Jasa melewati proses verifikasi KTP dan identitas resmi oleh Admin sebelum dapat menerima pesanan.</p>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <span className="font-bold text-xs text-slate-800 block">Hubungi Langsung Tim CS:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => playSuruhAjaChime()}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call CS Center
                    </button>
                    <button 
                      onClick={() => showToast("Terhubung ke WhatsApp Official CS SuruhAja", "info")}
                      className="p-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp CS
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 text-xs shadow-2xl relative border border-slate-200">
            <button onClick={() => setShowTopUpModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-1 border border-blue-200">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Top Up Saldo SuruhPay</h3>
              <p className="text-[10px] text-slate-500">Pilih nominal & metode pembayaran instant</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Nominal Top Up</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[20000, 50000, 100000, 200000, 500000, 1000000].map((nom) => (
                    <button 
                      key={nom}
                      type="button"
                      onClick={() => setTopUpNominal(nom)}
                      className={`py-2 px-1 rounded-xl border text-center font-extrabold text-[11px] transition-all cursor-pointer ${topUpNominal === nom ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      Rp {(nom / 1000).toLocaleString('id-ID')}rb
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1 font-bold text-[10px]">
                  <button 
                    type="button"
                    onClick={() => setTopUpMethod('qris')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${topUpMethod === 'qris' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    QRIS Instant
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTopUpMethod('va')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${topUpMethod === 'va' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Bank VA
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTopUpMethod('ewallet')}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${topUpMethod === 'ewallet' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    E-Wallet
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center font-black">
                <span className="text-slate-700 text-xs">Total Pembayaran:</span>
                <span className="text-blue-600 text-sm">Rp {topUpNominal.toLocaleString('id-ID')}</span>
              </div>

              <button 
                onClick={handleExecuteCustomerTopUp}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Bayar & Konfirmasi Top Up
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative border border-slate-200">
            <button onClick={() => setShowAddressModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-sm text-slate-900 text-center flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" /> Setel Lokasi GPS & Alamat
            </h3>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase">Alamat Lengkap Tujuan</label>
                <textarea 
                  rows={3}
                  value={tempAddressInput}
                  onChange={(e) => setTempAddressInput(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600 mt-1"
                />
              </div>

              <button 
                type="button"
                onClick={() => {
                  if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const gpsStr = `GPS Presisi: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Lokasi Terdeteksi)`;
                        setTempAddressInput(gpsStr);
                        showToast("Koordinat GPS berhasil terdeteksi!", "success");
                      },
                      () => showToast("Izin GPS ditolak. Silakan ketik alamat manual.", "error")
                    );
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Deteksi Otomatis Lokasi GPS Saya
              </button>

              <button 
                onClick={() => {
                  setCustomerAddress(tempAddressInput);
                  setShowAddressModal(false);
                  showToast("Alamat pengantaran/tujuan berhasil disimpan!", "success");
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow cursor-pointer mt-1"
              >
                Simpan Alamat Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotifModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4 text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 text-xs shadow-2xl relative max-h-[80vh] flex flex-col border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2 shrink-0">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-600" /> Notifikasi & Pengumuman Masuk
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <span className="font-extrabold text-blue-900 text-[11px] block">🎉 Selamat Datang di SuruhAja Super App!</span>
                <p className="text-slate-600 text-[10px]">Nikmati kemudahan memesan jasa pertukangan, pangkas rambut, les privat, kuliner warung terdekat, dan layanan pesan-antar instan.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}