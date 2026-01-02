
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, Music, MapPin, Heart, ChevronRight, Bell, Receipt, History, User, Mail, Lock, Key, X, AlertCircle, CheckCircle, ShieldCheck, Ticket, LogOut, Plus, Trash2, Edit3, Settings, Calendar, Briefcase, TrendingUp, DollarSign, Users, Sparkles } from 'lucide-react';
import { ARTISTS as INITIAL_ARTISTS, ARENAS as INITIAL_ARENAS, CONCERTS as INITIAL_CONCERTS } from './constants';
import { Artist, Arena, Concert, Watcher, PriceSnapshot, ArenaSection, UserAccount, Purchase, UserCategory, CharityCause } from './types';
import { calculateCurrentPrice, formatCurrency } from './utils/pricing';
import { getImpactStory } from './services/geminiService';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

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
          <p className="text-gray-500 text-xs mt-2 italic">Anti-Scalper Ethical Ticketing</p>
        </div>
        {status && <div className={`mb-6 p-4 rounded-xl text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{status.message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input type="text" required placeholder="Full Name" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-500 outline-none" value={name} onChange={e => setName(e.target.value)} />
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input type="password" required placeholder="Password" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20">{mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
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
  const [isPurchasing, setIsPurchasing] = useState(false);
  
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

  // Performance Metrics (Mock Data)
  const salesMetrics = useMemo(() => [
    { day: 'Mon', tickets: 120, revenue: 45000 },
    { day: 'Tue', tickets: 200, revenue: 78000 },
    { day: 'Wed', tickets: 150, revenue: 56000 },
    { day: 'Thu', tickets: 300, revenue: 110000 },
    { day: 'Fri', tickets: 450, revenue: 180000 },
    { day: 'Sat', tickets: 600, revenue: 250000 },
    { day: 'Sun', tickets: 550, revenue: 220000 },
  ], []);

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

  const handleBuy = async (section: ArenaSection) => {
    if (!currentUser) { setIsAuthModalOpen(true); return; }
    if (!selectedConcert) return;
    
    setIsPurchasing(true);
    try {
      const artist = INITIAL_ARTISTS.find(a => a.id === selectedConcert.artistId);
      const arena = arenas.find(a => a.id === selectedConcert.arenaId);
      const price = calculateCurrentPrice(section.basePrice, selectedConcert);

      // Get names of all selected charities for this concert
      const concertCharities = artist?.charityCauses.filter(c => selectedConcert.charityIds.includes(c.id)) || [];
      const charityNames = concertCharities.length > 0 ? concertCharities.map(c => c.name) : ["Global Relief Fund"];
      
      // Fetch impact story from Gemini (passing joined names)
      const story = await getImpactStory(price.donation, charityNames.join(", "));

      const newPurchase: Purchase = {
        id: `TIX-${Math.floor(Math.random() * 999999)}`,
        userEmail: currentUser.email,
        concertId: selectedConcert.id,
        artistName: artist?.name || '',
        arenaName: arena?.name || '',
        sectionName: section.name,
        totalPrice: price.total,
        donationAmount: price.donation,
        purchaseDate: new Date().toISOString(),
        eventDate: selectedConcert.date,
        impactStory: story,
        charityNames: charityNames
      };

      setPurchases([newPurchase, ...purchases]);
      alert('Purchase confirmed! View your impact story in your Vault.');
      setView('profile');
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to process purchase. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Artist Actions
  const handleAddConcert = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedCharityIds = Array.from(formData.getAll('charityIds')) as string[];
    
    const newConcert: Concert = {
      id: `ev-${Date.now()}`,
      artistId: currentUser?.linkedArtistId || '1',
      arenaId: formData.get('arenaId') as string,
      date: new Date(formData.get('date') as string).toISOString(),
      launchDate: new Date().toISOString(),
      floorDate: new Date(formData.get('floorDate') as string).toISOString(),
      maxMultiplier: Number(formData.get('multiplier')),
      charityIds: selectedCharityIds.length > 0 ? selectedCharityIds : []
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

  const currentArtistProfile = useMemo(() => {
    if (!currentUser?.linkedArtistId) return null;
    return INITIAL_ARTISTS.find(a => a.id === currentUser.linkedArtistId);
  }, [currentUser]);

  return (
    <div className="min-h-screen pb-20">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={(user) => {
        setCurrentUser(user);
        if (user.category === 'artist') setView('artist_hub');
        else if (user.category === 'admin') setView('admin');
        else setView('home');
      }} users={users} setUsers={setUsers} />
      
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
                <div className="flex gap-4 mt-6 overflow-x-auto pb-4">
                  {concerts.filter(c => c.artistId === selectedArtist.id).map(c => (
                    <button key={c.id} onClick={() => setSelectedConcert(c)} className={`px-6 py-3 rounded-2xl border transition-all shrink-0 ${selectedConcert?.id === c.id ? 'bg-purple-600 border-purple-500 text-white' : 'glass border-white/5 hover:border-white/20'}`}>
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
                            <p className="text-[10px] text-pink-400 font-bold uppercase">Ethical Donation Included</p>
                          </div>
                          <button 
                            disabled={isPurchasing}
                            onClick={() => handleBuy(s)} 
                            className={`px-6 py-2 font-bold rounded-lg transition-all ${isPurchasing ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-white text-black hover:bg-purple-600 hover:text-white'}`}>
                            {isPurchasing ? 'Processing...' : 'Buy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div className="glass rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Heart className="text-pink-500" /> Supported Causes</h3>
                    <div className="space-y-4">
                      {selectedArtist.charityCauses.filter(c => selectedConcert.charityIds.includes(c.id)).map(cause => (
                        <div key={cause.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{cause.icon}</span>
                            <p className="font-bold text-sm">{cause.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{cause.description}</p>
                        </div>
                      ))}
                      {selectedConcert.charityIds.length === 0 && (
                        <p className="text-sm text-gray-500 italic">This artist hasn't linked specific causes for this date yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="glass rounded-3xl p-8">
                     <h3 className="text-lg font-bold mb-4">Anti-Scalper Logic</h3>
                     <p className="text-sm text-gray-400 leading-relaxed">
                       Tickets start at {selectedConcert.maxMultiplier}x base price as a mandatory donation. This price decays linearly until {new Date(selectedConcert.floorDate).toLocaleDateString()}, ensuring the market price settles naturally without secondary scalping profits.
                     </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'profile' && currentUser && (
          <div className="animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">{currentUser.category === 'artist' ? 'Artist Profile' : 'Your Vault'}</h2>
              <div className="flex gap-4">
                 {currentUser.category === 'artist' && (
                    <button onClick={() => setView('artist_hub')} className="px-4 py-2 glass rounded-lg text-sm font-bold flex items-center gap-2 text-purple-400">
                      <Music size={16} /> Manage Tour
                    </button>
                 )}
                 {currentUser.category === 'admin' && (
                    <button onClick={() => setView('admin')} className="px-4 py-2 glass rounded-lg text-sm font-bold flex items-center gap-2 text-blue-400">
                      <ShieldCheck size={16} /> Admin Panel
                    </button>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass rounded-3xl p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                    {currentUser.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold">{currentUser.name}</h3>
                  <p className="text-gray-500 text-sm mb-4 uppercase tracking-tighter">{currentUser.category}</p>
                  <div className="text-left space-y-2 pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 flex items-center gap-2"><Mail size={12}/> {currentUser.email}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2"><Calendar size={12}/> Joined {new Date(currentUser.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {currentUser.category === 'customer' ? (
                  <div className="space-y-6">
                    {purchases.filter(p => p.userEmail === currentUser.email).map(p => (
                      <div key={p.id} className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/20 transition-all shadow-lg">
                        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <p className="text-xs text-purple-400 font-bold mb-1">{p.id}</p>
                            <h4 className="text-2xl font-black">{p.artistName}</h4>
                            <p className="text-sm text-gray-400 font-medium">{p.arenaName} • {new Date(p.eventDate).toLocaleDateString()}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 border border-white/5">{p.sectionName}</span>
                                {p.charityNames?.map(cn => (
                                  <span key={cn} className="bg-pink-500/10 px-3 py-1 rounded-full text-[10px] font-bold text-pink-400 border border-pink-500/10">Support: {cn}</span>
                                ))}
                            </div>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-2xl font-black">{formatCurrency(p.totalPrice)}</p>
                            <p className="text-xs text-pink-400 font-bold uppercase tracking-wide">Included {formatCurrency(p.donationAmount)} donation</p>
                          </div>
                        </div>
                        
                        {p.impactStory && (
                          <div className="bg-purple-600/10 border-t border-purple-500/10 p-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-purple-600/20 p-2 rounded-xl text-purple-400 shrink-0">
                                <Sparkles size={20} />
                              </div>
                              <div>
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">Gemini Verified Impact Story</h5>
                                <p className="text-sm text-gray-300 italic leading-relaxed">"{p.impactStory}"</p>
                                <button className="mt-4 text-xs text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"><Receipt size={14} /> Download Tax Receipt</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {purchases.filter(p => p.userEmail === currentUser.email).length === 0 && (
                      <div className="p-20 text-center glass rounded-3xl border-dashed border-white/10 border-2">
                        <p className="text-gray-500 italic">No tickets in your vault yet.</p>
                        <button onClick={() => setView('home')} className="mt-4 text-purple-400 font-bold hover:underline">Explore Tours</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass rounded-3xl p-12 text-center">
                    <Settings className="mx-auto mb-4 text-gray-600" size={48} />
                    <h3 className="text-xl font-bold mb-2">Management Role Active</h3>
                    <p className="text-gray-500 mb-6">You are logged in with elevated permissions. Use the specific hubs to manage your activity.</p>
                    <div className="flex justify-center gap-4">
                       {currentUser.category === 'artist' && <button onClick={() => setView('artist_hub')} className="bg-purple-600 px-6 py-2 rounded-lg font-bold shadow-lg shadow-purple-900/20">Go to Artist Hub</button>}
                       {currentUser.category === 'admin' && <button onClick={() => setView('admin')} className="bg-blue-600 px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20">Go to Admin Hub</button>}
                    </div>
                  </div>
                )}
              </div>
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
                  <button className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-white/10"><Plus size={18} /> Register Arena</button>
                </form>
              </div>
              <div className="glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Heart className="text-gray-400" /> Global Cause Library</h3>
                <div className="space-y-3">
                  {charities.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{c.icon}</span>
                        <p className="text-sm font-bold">{c.name}</p>
                      </div>
                      <button className="text-red-400 p-1 hover:bg-red-400/10 rounded transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button className="w-full py-3 border border-dashed border-white/20 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all hover:border-white/40">+ Add New Charity Cause</button>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'artist_hub' && currentUser?.category === 'artist' && (
          <div className="animate-in slide-in-from-bottom-4 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-black flex items-center gap-3 tracking-tighter"><Music className="text-pink-600" /> Artist Management</h2>
                <p className="text-gray-500 font-medium">Linked to: <span className="text-white">{currentArtistProfile?.name}</span></p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setView('profile')} className="p-3 glass rounded-full hover:border-purple-500/50 transition-all"><User size={20} /></button>
              </div>
            </div>

            {/* Performance Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass rounded-3xl p-6 border-l-4 border-purple-500">
                <div className="flex justify-between items-start mb-2">
                  <DollarSign className="text-purple-400" size={20} />
                  <span className="text-[10px] font-bold text-green-400">+12% vs last tour</span>
                </div>
                <p className="text-2xl font-black">$428.5k</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Gross Revenue</p>
              </div>
              <div className="glass rounded-3xl p-6 border-l-4 border-pink-500">
                <div className="flex justify-between items-start mb-2">
                  <Heart className="text-pink-400" size={20} />
                  <span className="text-[10px] font-bold text-pink-400">Direct Impact</span>
                </div>
                <p className="text-2xl font-black">$182.2k</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Philanthropic Funds</p>
              </div>
              <div className="glass rounded-3xl p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <Users className="text-blue-400" size={20} />
                </div>
                <p className="text-2xl font-black">12,450</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Tickets Verified</p>
              </div>
              <div className="glass rounded-3xl p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-2">
                  <TrendingUp className="text-green-400" size={20} />
                </div>
                <p className="text-2xl font-black">94%</p>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Anti-Scalp Efficiency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">Sales Velocity <span className="text-xs font-normal text-gray-500">(7 Day Window)</span></h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesMetrics}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                      <XAxis dataKey="day" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                      <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="lg:col-span-1 glass rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 tracking-tight"><Calendar className="text-gray-400" /> Create Tour Stop</h3>
                <form onSubmit={handleAddConcert} className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Arena Location</label>
                    <select name="arenaId" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-white text-sm">
                      {arenas.map(a => <option key={a.id} value={a.id} className="bg-black">{a.name} ({a.city})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Event & Floor Dates</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input name="date" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-sm" />
                      <input name="floorDate" type="date" required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Select Causes for this Stop</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {currentArtistProfile?.charityCauses.map(cause => (
                        <label key={cause.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                          <input type="checkbox" name="charityIds" value={cause.id} className="w-4 h-4 rounded border-gray-600 bg-black text-purple-600 focus:ring-purple-600" />
                          <span className="text-xs font-bold text-gray-300">{cause.icon} {cause.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Anti-Scalp Multiplier</label>
                    <input name="multiplier" type="number" defaultValue="100" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none text-sm" />
                  </div>
                  <button className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/40">Deploy Tour Date</button>
                </form>
              </div>
            </div>

            <div className="glass rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase className="text-gray-400" /> Live Tour Stops</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {concerts.filter(c => c.artistId === currentUser.linkedArtistId).map(c => (
                  <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-purple-500/30 transition-all group">
                    <div className="mb-4">
                      <h4 className="text-lg font-bold group-hover:text-purple-400 transition-colors">{arenas.find(a => a.id === c.arenaId)?.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">{arenas.find(a => a.id === c.arenaId)?.city} • {new Date(c.date).toLocaleDateString()}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.charityIds.map(cid => (
                          <span key={cid} className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[9px] rounded-full font-bold border border-pink-500/10">
                            {currentArtistProfile?.charityCauses.find(cause => cause.id === cid)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 border-t border-white/5 pt-4">
                      <button className="flex-1 py-2 glass rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Edit</button>
                      <button onClick={() => setConcerts(concerts.filter(x => x.id !== c.id))} className="p-2 glass rounded-lg text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-8 py-4 md:hidden flex justify-around">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-purple-400' : 'text-gray-500'}`}><Search size={20} /><span className="text-[10px] font-bold">Explore</span></button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-400' : 'text-gray-500'}`}><History size={20} /><span className="text-[10px] font-bold">Vault</span></button>
        {currentUser?.category === 'admin' && <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-purple-400' : 'text-gray-500'}`}><ShieldCheck size={20} /><span className="text-[10px] font-bold">Admin</span></button>}
        {currentUser?.category === 'artist' && <button onClick={() => setView('artist_hub')} className={`flex flex-col items-center gap-1 ${view === 'artist_hub' ? 'text-purple-400' : 'text-gray-500'}`}><Music size={20} /><span className="text-[10px] font-bold">Artist</span></button>}
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
