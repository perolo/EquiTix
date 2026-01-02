
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, Music, MapPin, Heart, ChevronRight, Bell, Receipt, History, User, Mail, Lock, Key, X, AlertCircle, CheckCircle, ShieldCheck, Ticket, LogOut, Plus, Trash2, Edit3, Settings, Calendar, Briefcase } from 'lucide-react';
import { ARTISTS as INITIAL_ARTISTS, ARENAS as INITIAL_ARENAS, CONCERTS as INITIAL_CONCERTS } from './constants';
import { Artist, Arena, Concert, Watcher, PriceSnapshot, ArenaSection, UserAccount, Purchase, UserCategory, CharityCause } from './types';
import { calculateCurrentPrice, formatCurrency } from './utils/pricing';
import { getImpactStory } from './services/geminiService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// --- Sub-components ---

const ImpactCounter = () => {
  const [total, setTotal] = useState(1450280);
  useEffect(() => {
    const interval = setInterval(() => {
      setTotal(prev => prev + Math.floor(Math.random() * 50));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 glass rounded-2xl mb-8">
      <span className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-2">Global Ethical Impact</span>
      <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        {formatCurrency(total)}
      </h2>
      <p className="mt-2 text-gray-500 text-xs">Directly funded through ticket donations</p>
    </div>
  );
};

const ArtistCard: React.FC<{ artist: Artist; onClick: () => void }> = ({ artist, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
  >
    <img src={artist.image} alt={artist.name} className="w-full h-64 object-cover brightness-75 group-hover:brightness-100 transition-all" />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-6">
      <h3 className="text-2xl font-bold mb-1">{artist.name}</h3>
      <p className="text-gray-300 text-sm line-clamp-1">{artist.genre}</p>
    </div>
  </div>
);

// --- Auth Components ---

const AuthModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}> = ({ isOpen, onClose, onLogin, users, setUsers }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (mode === 'login') {
      const user = users.find(u => u.email === email && u.passwordHash === password);
      if (user) {
        if (!user.isActivated) {
          setStatus({ type: 'error', message: 'Account not activated. Please wait for admin approval.' });
        } else {
          onLogin(user);
          onClose();
        }
      } else {
        setStatus({ type: 'error', message: 'Invalid credentials.' });
      }
    } else {
      if (users.some(u => u.email === email)) {
        setStatus({ type: 'error', message: 'User already exists.' });
        return;
      }
      const newUser: UserAccount = {
        email,
        passwordHash: password,
        name,
        isActivated: false, // Must be approved by admin
        category: 'customer', // Default category
        joinedAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      setStatus({ type: 'success', message: 'Registration received. Admin approval required.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-500 hover:text-white"><X size={24} /></button>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome Back' : 'Join EquiTix'}</h2>
        </div>
        {status && <div className={`mb-6 p-4 rounded-xl text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{status.message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input type="text" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" required placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl transition-all">{mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-purple-400 hover:underline">{mode === 'login' ? 'Create an account' : 'Already have an account?'}</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'details' | 'profile' | 'admin' | 'artist_hub'>('home');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // App States (Simulated DB)
  const [users, setUsers] = useState<UserAccount[]>([
    { email: 'admin@example.com', passwordHash: 'admin', name: 'System Admin', isActivated: true, category: 'admin', joinedAt: new Date().toISOString() },
    { email: 'artist@example.com', passwordHash: 'artist', name: 'Midnight Echo Manager', isActivated: true, category: 'artist', joinedAt: new Date().toISOString(), linkedArtistId: '2' }
  ]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [arenas, setArenas] = useState<Arena[]>(INITIAL_ARENAS);
  const [concerts, setConcerts] = useState<Concert[]>(INITIAL_CONCERTS);
  const [charities, setCharities] = useState<CharityCause[]>(INITIAL_ARTISTS.flatMap(a => a.charityCauses));
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const filteredArtists = useMemo(() => INITIAL_ARTISTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);

  // Pricing visualization data helper
  const getPricingData = (concert: Concert) => {
    const data = [];
    const launch = new Date(concert.launchDate).getTime();
    const floor = new Date(concert.floorDate).getTime();
    const steps = 10;
    const interval = (floor - launch) / steps;
    const arena = arenas.find(a => a.id === concert.arenaId);
    const base = arena?.sections[0].basePrice || 100;

    for (let i = 0; i <= steps; i++) {
      const t = launch + i * interval;
      const decay = 1 - (i / steps);
      const donation = base * concert.maxMultiplier * decay;
      data.push({ name: `${Math.round((floor - t) / (1000 * 60 * 60 * 24))}d`, total: base + donation });
    }
    return data;
  };

  const handleBuy = (section: ArenaSection) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (!selectedConcert) return;
    const artist = INITIAL_ARTISTS.find(a => a.id === selectedConcert.artistId);
    const arena = arenas.find(a => a.id === selectedConcert.arenaId);
    const price = calculateCurrentPrice(section.basePrice, selectedConcert);

    setPurchases([{
      id: `TIX-${Math.floor(Math.random() * 999999)}`,
      userEmail: currentUser.email,
      concertId: selectedConcert.id,
      artistName: artist?.name || '',
      arenaName: arena?.name || '',
      sectionName: section.name,
      totalPrice: price.total,
      donationAmount: price.donation,
      purchaseDate: new Date().toISOString(),
      eventDate: selectedConcert.date
    }, ...purchases]);
    alert('Purchase confirmed!');
    setView('profile');
  };

  // Artist Actions
  const handleAddConcert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConcert: Concert = {
      id: `ev-${Date.now()}`,
      artistId: currentUser?.linkedArtistId || '1',
      arenaId: formData.get('arenaId') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      launchDate: new Date().toISOString(),
      floorDate: new Date(formData.get('floorDate') as string).toISOString(),
      maxMultiplier: Number(formData.get('multiplier'))
    };
    setConcerts([...concerts, newConcert]);
    e.currentTarget.reset();
  };

  // Admin Actions
  const handleAddArena = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newArena: Arena = {
      id: `a-${Date.now()}`,
      name: formData.get('name') as string,
      city: formData.get('city') as string,
      capacity: Number(formData.get('capacity')),
      sections: [{ id: 's-default', name: 'General Admission', basePrice: 100, totalSeats: 5000, availableSeats: 5000 }]
    };
    setArenas([...arenas, newArena]);
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen pb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={setCurrentUser} users={users} setUsers={setUsers} />
      
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold">E</div>
          <h1 className="text-xl font-bold">EquiTix</h1>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setView('home')} className={`text-sm font-medium ${view === 'home' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>Explore</button>
          {currentUser?.category === 'admin' && <button onClick={() => setView('admin')} className={`text-sm font-medium ${view === 'admin' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>Admin</button>}
          {currentUser?.category === 'artist' && <button onClick={() => setView('artist_hub')} className={`text-sm font-medium ${view === 'artist_hub' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>Artist Hub</button>}
        </div>

        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setView('profile')} className="flex items-center gap-2 glass px-3 py-1.5 rounded-full hover:border-purple-500/50">
                <span className="text-xs font-semibold">{currentUser.name}</span>
                <User size={16} className="text-purple-400" />
              </button>
              <button onClick={() => { setCurrentUser(null); setView('home'); }} className="text-gray-500 hover:text-red-400"><LogOut size={18} /></button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="px-5 py-2 bg-purple-600 rounded-lg text-sm font-bold">Sign In</button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {view === 'home' && (
          <div className="animate-in fade-in duration-700">
            <ImpactCounter />
            <h2 className="text-2xl font-bold mb-6">Upcoming Global Tours</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map(artist => <ArtistCard key={artist.id} artist={artist} onClick={() => { setSelectedArtist(artist); setView('details'); }} />)}
            </div>
          </div>
        )}

        {view === 'details' && selectedArtist && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-8 mb-12">
              <img src={selectedArtist.image} className="w-48 h-48 rounded-3xl object-cover shadow-2xl" />
              <div>
                <h2 className="text-5xl font-black mb-2">{selectedArtist.name}</h2>
                <p className="text-gray-400 max-w-xl">{selectedArtist.description}</p>
                <div className="flex gap-4 mt-6">
                  {concerts.filter(c => c.artistId === selectedArtist.id).map(c => (
                    <button key={c.id} onClick={() => setSelectedConcert(c)} className={`px-6 py-3 rounded-2xl border transition-all ${selectedConcert?.id === c.id ? 'bg-purple-600 border-purple-500 text-white' : 'glass border-white/5 hover:border-white/20'}`}>
                      <p className="text-xs uppercase font-bold text-white/50">{arenas.find(a => a.id === c.arenaId)?.city}</p>
                      <p className="font-bold">{new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedConcert && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6">Live Pricing Engine</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getPricingData(selectedConcert)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                          <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="glass rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6">Available Sections</h3>
                    {arenas.find(a => a.id === selectedConcert.arenaId)?.sections.map(s => (
                      <div key={s.id} className="flex justify-between items-center p-4 glass rounded-xl mb-3">
                        <div>
                          <p className="font-bold">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.availableSeats} tickets left</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xl font-black">{formatCurrency(calculateCurrentPrice(s.basePrice, selectedConcert).total)}</p>
                            <p className="text-[10px] text-pink-400 font-bold">ETHICAL DONATION INCLUDED</p>
                          </div>
                          <button onClick={() => handleBuy(s)} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-purple-600 hover:text-white transition-all">Buy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'profile' && currentUser && (
          <div className="animate-in slide-in-from-right-4">
            <h2 className="text-3xl font-bold mb-8">Your Vault</h2>
            <div className="space-y-4">
              {purchases.filter(p => p.userEmail === currentUser.email).map(p => (
                <div key={p.id} className="glass rounded-2xl p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-purple-400 font-bold mb-1">{p.id}</p>
                    <h4 className="text-xl font-bold">{p.artistName}</h4>
                    <p className="text-sm text-gray-500">{p.arenaName} • {new Date(p.eventDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black">{formatCurrency(p.totalPrice)}</p>
                    <p className="text-xs text-pink-400">Donated {formatCurrency(p.donationAmount)}</p>
                    <button className="mt-2 text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1"><Receipt size={14} /> Tax Receipt</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'admin' && currentUser?.category === 'admin' && (
          <div className="animate-in slide-in-from-top-4 space-y-12">
            <h2 className="text-4xl font-black flex items-center gap-3"><ShieldCheck className="text-purple-600" /> Command Center</h2>
            
            <section>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="text-gray-400" /> User Approvals & Roles</h3>
              <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr className="text-xs uppercase text-gray-500 font-bold">
                      <th className="p-4">User</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.email} className="border-b border-white/5 last:border-0">
                        <td className="p-4">
                          <p className="font-bold">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </td>
                        <td className="p-4">
                          <select 
                            value={u.category} 
                            onChange={(e) => setUsers(users.map(x => x.email === u.email ? { ...x, category: e.target.value as UserCategory } : x))}
                            className="bg-transparent text-sm font-bold text-purple-400 border-none outline-none cursor-pointer"
                          >
                            <option value="customer">Customer</option>
                            <option value="artist">Artist</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.isActivated ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {u.isActivated ? 'Active' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setUsers(users.map(x => x.email === u.email ? { ...x, isActivated: !x.isActivated } : x))} className="text-xs font-bold text-blue-400 hover:underline">{u.isActivated ? 'Deactivate' : 'Activate'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-gray-400" /> Add New Arena</h3>
                <form onSubmit={handleAddArena} className="space-y-4">
                  <input name="name" placeholder="Arena Name" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  <input name="city" placeholder="City" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  <input name="capacity" type="number" placeholder="Total Capacity" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  <button className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2"><Plus size={18} /> Register Arena</button>
                </form>
              </div>
              <div className="glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Heart className="text-gray-400" /> Active Charities</h3>
                <div className="space-y-3">
                  {charities.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <p className="text-sm font-bold">{c.name}</p>
                      </div>
                      <button className="text-red-400 p-1 hover:bg-red-400/10 rounded"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button className="w-full py-3 border border-dashed border-white/20 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all">+ Add New Charity Cause</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'artist_hub' && currentUser?.category === 'artist' && (
          <div className="animate-in slide-in-from-bottom-4 space-y-12">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black flex items-center gap-3"><Music className="text-pink-600" /> Artist Management</h2>
                <p className="text-gray-500">Linked to: <strong>{INITIAL_ARTISTS.find(a => a.id === currentUser.linkedArtistId)?.name}</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 glass rounded-3xl p-8 h-fit">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-gray-400" /> Create Tour Stop</h3>
                <form onSubmit={handleAddConcert} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Arena</label>
                    <select name="arenaId" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-white">
                      {arenas.map(a => <option key={a.id} value={a.id} className="bg-black">{a.name} ({a.city})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Show Date</label>
                    <input name="date" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Price Floor Date</label>
                    <input name="floorDate" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Donation Multiplier (Max)</label>
                    <input name="multiplier" type="number" defaultValue="50" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none" />
                  </div>
                  <button className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Plus size={20} /> Launch Tour Stop</button>
                </form>
              </div>

              <div className="lg:col-span-2 glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase className="text-gray-400" /> Active Tour Stops</h3>
                <div className="space-y-4">
                  {concerts.filter(c => c.artistId === currentUser.linkedArtistId).map(c => (
                    <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-bold">{arenas.find(a => a.id === c.arenaId)?.name}</h4>
                        <p className="text-sm text-gray-500">{new Date(c.date).toLocaleDateString()} • {c.maxMultiplier}x Max Multiplier</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 glass rounded-lg text-blue-400"><Edit3 size={18} /></button>
                        <button onClick={() => setConcerts(concerts.filter(x => x.id !== c.id))} className="p-2 glass rounded-lg text-red-400"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-8 py-4 md:hidden flex justify-around">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-purple-500' : 'text-gray-500'}`}><Search size={20} /><span className="text-[10px] font-bold">Explore</span></button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-500' : 'text-gray-500'}`}><History size={20} /><span className="text-[10px] font-bold">Vault</span></button>
        {currentUser?.category === 'admin' && <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-purple-500' : 'text-gray-500'}`}><ShieldCheck size={20} /><span className="text-[10px] font-bold">Admin</span></button>}
        {currentUser?.category === 'artist' && <button onClick={() => setView('artist_hub')} className={`flex flex-col items-center gap-1 ${view === 'artist_hub' ? 'text-purple-500' : 'text-gray-500'}`}><Music size={20} /><span className="text-[10px] font-bold">Artist</span></button>}
      </nav>
    </div>
  );
}
