
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, Music, MapPin, Heart, ChevronRight, Bell, Receipt, History, User, Mail, Lock, Key, X, AlertCircle, CheckCircle, ShieldCheck, Ticket, LogOut } from 'lucide-react';
import { ARTISTS, ARENAS, CONCERTS } from './constants';
import { Artist, Arena, Concert, Watcher, PriceSnapshot, ArenaSection, UserAccount, Purchase } from './types';
import { calculateCurrentPrice, formatCurrency } from './utils/pricing';
import { getImpactStory, generateReceiptSummary } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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

const SectionPriceRow: React.FC<{ section: ArenaSection; concert: Concert; onWatch: (s: ArenaSection) => void; onBuy: (s: ArenaSection) => void }> = ({ section, concert, onWatch, onBuy }) => {
  const price = calculateCurrentPrice(section.basePrice, concert);
  
  return (
    <div className="flex items-center justify-between p-4 glass rounded-xl mb-3 hover:border-purple-500/50 transition-colors">
      <div>
        <h4 className="font-semibold text-lg">{section.name}</h4>
        <p className="text-xs text-gray-400">{section.availableSeats} seats remaining</p>
      </div>
      <div className="text-right flex items-center gap-4">
        <div>
          <div className="text-2xl font-bold text-white">{formatCurrency(price.total)}</div>
          <div className="text-[10px] text-pink-400 uppercase font-semibold">Incl. {formatCurrency(price.donation)} donation</div>
        </div>
        <button 
          onClick={() => onWatch(section)}
          className="p-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-all"
        >
          <Bell size={18} />
        </button>
        <button 
          onClick={() => onBuy(section)}
          className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-purple-500 hover:text-white transition-all"
        >
          Buy
        </button>
      </div>
    </div>
  );
};

// --- Auth Components ---

const AuthModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onLogin: (user: UserAccount) => void;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}> = ({ isOpen, onClose, onLogin, users, setUsers }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

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
        setStatus({ type: 'error', message: 'Invalid credentials. Please check your email and password.' });
      }
    } else if (mode === 'signup') {
      if (users.some(u => u.email === email)) {
        setStatus({ type: 'error', message: 'A user with this email already exists.' });
        return;
      }
      const newUser: UserAccount = {
        email,
        passwordHash: password,
        name,
        isActivated: false,
        isAdmin: false,
        joinedAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      setStatus({ type: 'success', message: `Account created for ${email}. Please wait for admin activation.` });
      // Clear inputs
      setEmail('');
      setName('');
      setPassword('');
    } else if (mode === 'forgot') {
      const exists = users.some(u => u.email === email);
      if (exists) {
        setStatus({ type: 'success', message: `Password reset instructions have been sent to ${email}.` });
      } else {
        setStatus({ type: 'error', message: 'No account found with that email address.' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-2xl">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center font-bold mx-auto mb-4 text-xl">E</div>
          <h2 className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' ? 'Sign in to access your tickets and alerts' : mode === 'signup' ? 'Join the ethical ticketing revolution' : 'We will help you get back into your account'}
          </p>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {status.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                {mode === 'signup' && (
                  <button type="button" onClick={generatePassword} className="text-xs text-purple-400 hover:text-purple-300 font-bold mb-1 flex items-center gap-1">
                    <Key size={12} /> Generate Secure
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all mt-4">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-2">
          {mode === 'login' && (
            <>
              <p className="text-sm text-gray-400">
                Don't have an account? <button onClick={() => setMode('signup')} className="text-purple-400 hover:underline font-medium">Create one</button>
              </p>
              <button onClick={() => setMode('forgot')} className="text-xs text-gray-500 hover:text-white transition-colors underline decoration-dotted">I don't remember my password</button>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-sm text-gray-400">
              Already a member? <button onClick={() => setMode('login')} className="text-purple-400 hover:underline font-medium">Log in</button>
            </p>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')} className="text-sm text-purple-400 hover:underline font-medium">Back to login</button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'home' | 'details' | 'profile' | 'admin'>('home');
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [impactStory, setImpactStory] = useState<string>('');
  
  // Simulated User DB and Auth
  const [users, setUsers] = useState<UserAccount[]>([
    {
      email: 'admin@example.com',
      passwordHash: 'admin',
      name: 'EquiTix Admin',
      isActivated: true,
      isAdmin: true,
      joinedAt: new Date().toISOString()
    }
  ]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const filteredArtists = useMemo(() => {
    return ARTISTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const artistConcerts = useMemo(() => {
    if (!selectedArtist) return [];
    return CONCERTS.filter(c => c.artistId === selectedArtist.id);
  }, [selectedArtist]);

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    setView('details');
  };

  const handleConcertSelect = (concert: Concert) => {
    setSelectedConcert(concert);
  };

  const handleWatch = (section: ArenaSection) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedConcert) return;
    const target = prompt(`Alert me when price for ${section.name} drops below:`, "500");
    if (target && !isNaN(Number(target))) {
      const newWatcher: Watcher = {
        id: Math.random().toString(),
        concertId: selectedConcert.id,
        sectionId: section.id,
        targetPrice: Number(target),
        createdAt: new Date().toISOString()
      };
      setWatchers([...watchers, newWatcher]);
      alert(`Watching ${section.name}. We'll notify you when it hits ${formatCurrency(Number(target))}.`);
    }
  };

  const handleBuy = (section: ArenaSection) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedConcert) return;
    
    const artist = ARTISTS.find(a => a.id === selectedConcert.artistId);
    const arena = ARENAS.find(a => a.id === selectedConcert.arenaId);
    const price = calculateCurrentPrice(section.basePrice, selectedConcert);

    const newPurchase: Purchase = {
      id: `TIX-${Math.floor(Math.random() * 999999)}`,
      userEmail: currentUser.email,
      concertId: selectedConcert.id,
      artistName: artist?.name || 'Unknown Artist',
      arenaName: arena?.name || 'Unknown Arena',
      sectionName: section.name,
      totalPrice: price.total,
      donationAmount: price.donation,
      purchaseDate: new Date().toISOString(),
      eventDate: selectedConcert.date
    };

    setPurchases([newPurchase, ...purchases]);
    alert(`Purchase Successful! Your ticket to ${artist?.name} is confirmed.`);
    setView('profile');
  };

  const toggleActivation = (email: string) => {
    setUsers(users.map(u => u.email === email ? { ...u, isActivated: !u.isActivated } : u));
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  // Pricing visualization data
  const pricingChartData = useMemo(() => {
    if (!selectedConcert) return [];
    const data = [];
    const launch = new Date(selectedConcert.launchDate).getTime();
    const floor = new Date(selectedConcert.floorDate).getTime();
    const steps = 10;
    const interval = (floor - launch) / steps;

    for (let i = 0; i <= steps; i++) {
      const t = launch + i * interval;
      const daysUntilFloor = Math.round((floor - t) / (1000 * 60 * 60 * 24));
      const arena = ARENAS.find(a => a.id === selectedConcert.arenaId);
      const base = arena?.sections[0].basePrice || 100;
      
      const decay = 1 - (i / steps);
      const donation = base * selectedConcert.maxMultiplier * decay;
      
      data.push({
        name: `${daysUntilFloor}d`,
        total: base + donation,
        donation: donation,
        base: base
      });
    }
    return data;
  }, [selectedConcert]);

  useEffect(() => {
    if (selectedArtist && selectedArtist.charityCauses.length > 0) {
      getImpactStory(500, selectedArtist.charityCauses[0].name).then(setImpactStory);
    }
  }, [selectedArtist]);

  return (
    <div className="min-h-screen pb-20">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleLogin}
        users={users}
        setUsers={setUsers}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold">E</div>
          <h1 className="text-xl font-bold tracking-tight">EquiTix</h1>
        </div>
        
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Search artists, cities, or arenas..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {currentUser?.isAdmin && (
            <button 
              onClick={() => setView('admin')}
              className={`p-2 rounded-full transition-colors ${view === 'admin' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ShieldCheck size={20} />
            </button>
          )}
          {currentUser ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('profile')}
                className={`flex items-center gap-3 p-1 pl-3 rounded-full transition-all border ${view === 'profile' ? 'bg-purple-600/20 border-purple-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] uppercase font-bold text-purple-400">Account</p>
                  <p className="text-xs font-medium truncate max-w-[100px]">{currentUser.name}</p>
                </div>
                <div className="w-8 h-8 bg-purple-600/50 rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-purple-600 rounded-lg font-semibold text-sm hover:bg-purple-500 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {view === 'home' && (
          <div className="animate-in fade-in duration-700">
            <ImpactCounter />
            
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Music className="text-purple-500" /> Featured Artists
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtists.map(artist => (
                  <ArtistCard 
                    key={artist.id} 
                    artist={artist} 
                    onClick={() => handleArtistSelect(artist)} 
                  />
                ))}
              </div>
            </section>

            <section className="p-8 glass rounded-3xl border-purple-500/20 border flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-3xl font-bold mb-4 italic">Defeating the Black Market.</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Traditional ticketing rewards scalpers. <strong>EquiTix</strong> rewards humanity. 
                  Prices start high as a mandatory donation to the artist's chosen causes and decay daily. 
                  Scalpers can't profit because the "market price" is already captured by charities. 
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-green-400 border-green-500/20">
                    <Heart size={14} /> 100% Transparency
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-blue-400 border-blue-500/20">
                    <Receipt size={14} /> Tax Deductible
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64 h-64 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-2xl flex items-center justify-center border border-white/10 p-6 text-center">
                 <p className="text-xs uppercase tracking-widest text-purple-300 font-bold">The Fair Market Standard</p>
              </div>
            </section>
          </div>
        )}

        {view === 'details' && selectedArtist && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setView('home')}
              className="mb-6 text-gray-500 hover:text-white flex items-center gap-1 text-sm font-medium"
            >
              <ChevronRight className="rotate-180" size={16} /> Back to Search
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="glass rounded-2xl p-6 mb-6">
                  <img src={selectedArtist.image} className="w-full h-48 object-cover rounded-xl mb-4" />
                  <h2 className="text-3xl font-bold mb-2">{selectedArtist.name}</h2>
                  <p className="text-gray-400 text-sm mb-6">{selectedArtist.description}</p>
                  
                  <h4 className="font-semibold text-xs uppercase text-gray-500 mb-3 tracking-widest">Upcoming Dates</h4>
                  <div className="space-y-3">
                    {artistConcerts.map(concert => {
                      const arena = ARENAS.find(a => a.id === concert.arenaId);
                      const isActive = selectedConcert?.id === concert.id;
                      return (
                        <div 
                          key={concert.id}
                          onClick={() => handleConcertSelect(concert)}
                          className={`p-4 rounded-xl cursor-pointer border transition-all ${
                            isActive ? 'bg-purple-600/20 border-purple-500' : 'glass border-transparent hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{arena?.city}</span>
                            <span className="text-xs text-purple-400 font-medium">
                              {new Date(concert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{arena?.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                {!selectedConcert ? (
                  <div className="h-full glass rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                    <MapPin size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Select a city to view tickets</h3>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="glass rounded-3xl p-8 border border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold">Dynamic Donation Decay</h3>
                          <p className="text-xs text-gray-500">Wait for the drop, or secure your spot and make an impact today.</p>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pricingChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                            <Area type="monotone" dataKey="total" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="glass rounded-3xl p-8 border border-white/5">
                      <h3 className="text-xl font-bold mb-6">Arena Sections</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {ARENAS.find(a => a.id === selectedConcert.arenaId)?.sections.map(section => (
                          <SectionPriceRow 
                            key={section.id} 
                            section={section} 
                            concert={selectedConcert}
                            onWatch={handleWatch}
                            onBuy={handleBuy}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'profile' && currentUser && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-bold mb-8">Account Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="glass rounded-2xl p-6">
                  <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-center">{currentUser.name}</h3>
                  <p className="text-center text-gray-400 text-sm mb-6">{currentUser.email}</p>
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Member Since</span>
                      <span className="font-medium">{new Date(currentUser.joinedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tickets Owned</span>
                      <span className="font-medium">{purchases.filter(p => p.userEmail === currentUser.email).length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-8">
                <section>
                  <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Ticket className="text-purple-500" /> Your Ticket Vault
                  </h4>
                  {purchases.filter(p => p.userEmail === currentUser.email).length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/10">
                      <p className="text-gray-500">No tickets purchased yet. Explore tours to start your ethical journey.</p>
                      <button onClick={() => setView('home')} className="mt-4 px-6 py-2 bg-white/5 rounded-full text-sm font-bold border border-white/10 hover:bg-white/10">Browse Artists</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {purchases.filter(p => p.userEmail === currentUser.email).map(p => (
                        <div key={p.id} className="glass rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all">
                          <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded font-bold uppercase">{p.id}</span>
                                <span className="text-xs text-gray-500">{new Date(p.purchaseDate).toLocaleDateString()}</span>
                              </div>
                              <h5 className="text-2xl font-bold">{p.artistName}</h5>
                              <p className="text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin size={14} /> {p.arenaName} • {p.sectionName}
                              </p>
                            </div>
                            <div className="flex flex-col md:items-end justify-center">
                              <p className="text-2xl font-black">{formatCurrency(p.totalPrice)}</p>
                              <p className="text-xs text-pink-400 font-bold uppercase">Incl. {formatCurrency(p.donationAmount)} donation</p>
                              <button className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">
                                <Receipt size={14} /> Download Tax Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && currentUser?.isAdmin && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <ShieldCheck className="text-purple-500" /> Admin Command Center
            </h2>
            <div className="glass rounded-3xl overflow-hidden border border-white/10">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-widest">User Details</th>
                    <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-widest">Joined Date</th>
                    <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-widest">Status</th>
                    <th className="p-4 text-xs font-bold uppercase text-gray-500 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => !u.isAdmin).map(u => (
                    <tr key={u.email} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <p className="font-bold">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(u.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.isActivated ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'}`}>
                          {u.isActivated ? 'Active' : 'Pending Activation'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleActivation(u.email)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${u.isActivated ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white'}`}
                        >
                          {u.isActivated ? 'Deactivate' : 'Activate User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => !u.isAdmin).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-500 italic">No registered users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-8 py-4 md:hidden flex justify-around">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-purple-500' : 'text-gray-500'}`}>
          <Search size={20} />
          <span className="text-[10px] font-bold uppercase">Explore</span>
        </button>
        <button onClick={() => currentUser ? setView('profile') : setIsAuthModalOpen(true)} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-purple-500' : 'text-gray-500'}`}>
          <History size={20} />
          <span className="text-[10px] font-bold uppercase">Activity</span>
        </button>
        {currentUser?.isAdmin && (
          <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-purple-500' : 'text-gray-500'}`}>
            <ShieldCheck size={20} />
            <span className="text-[10px] font-bold uppercase">Admin</span>
          </button>
        )}
      </nav>
    </div>
  );
}
