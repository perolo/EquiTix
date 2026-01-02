
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Globe, Music, MapPin, Heart, ChevronRight, Bell, Receipt, History } from 'lucide-react';
import { ARTISTS, ARENAS, CONCERTS } from './constants';
import { Artist, Arena, Concert, Watcher, PriceSnapshot, ArenaSection } from './types';
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

// Fix: Use React.FC to correctly handle the 'key' prop when rendering in a list and ensure type safety for props
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

// Fix: Use React.FC and concrete types (ArenaSection, Concert) to resolve 'key' prop and type mismatch errors
const SectionPriceRow: React.FC<{ section: ArenaSection; concert: Concert; onWatch: (s: ArenaSection) => void }> = ({ section, concert, onWatch }) => {
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
        <button className="px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-purple-500 hover:text-white transition-all">
          Buy
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedConcert, setSelectedConcert] = useState<Concert | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'home' | 'details' | 'receipt'>('home');
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [impactStory, setImpactStory] = useState<string>('');
  const [receipt, setReceipt] = useState<string>('');

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
      // Use first section as baseline
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
              className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition-colors"><Globe size={20} /></button>
          <button className="px-4 py-2 bg-purple-600 rounded-lg font-semibold text-sm hover:bg-purple-500 transition-colors">Sign In</button>
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
                  Buy when the price is right for you.
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
              {/* Left Column: Artist Info & Tour Dates */}
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

                <div className="glass rounded-2xl p-6">
                  <h4 className="font-semibold text-xs uppercase text-gray-500 mb-4 tracking-widest">Philanthropy</h4>
                  {selectedArtist.charityCauses.map(cause => (
                    <div key={cause.id} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{cause.icon}</span>
                        <span className="font-bold">{cause.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">{cause.description}</p>
                    </div>
                  ))}
                  {impactStory && (
                    <div className="mt-6 p-4 bg-purple-900/20 rounded-xl border border-purple-500/20">
                      <p className="text-xs italic text-purple-200">"{impactStory}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle/Right: Arena & Pricing */}
              <div className="lg:col-span-2">
                {!selectedConcert ? (
                  <div className="h-full glass rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                    <MapPin size={48} className="text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Select a city to view tickets</h3>
                    <p className="text-gray-500 max-w-xs text-sm">Pick a stop on the {selectedArtist.name} World Tour to see dynamic donation pricing.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Price Decay Chart */}
                    <div className="glass rounded-3xl p-8 border border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-bold">Dynamic Donation Decay</h3>
                          <p className="text-xs text-gray-500">Wait for the drop, or secure your spot and make an impact today.</p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-white">
                            {formatCurrency(calculateCurrentPrice(
                              ARENAS.find(a => a.id === selectedConcert.arenaId)?.sections[0].basePrice || 100, 
                              selectedConcert
                            ).total)}
                          </span>
                          <p className="text-[10px] text-pink-500 font-bold uppercase">Current Multiplier: ~{
                            Math.round(calculateCurrentPrice(1, selectedConcert).donation)
                          }x</p>
                        </div>
                      </div>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={pricingChartData}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                            <YAxis stroke="#666" fontSize={10} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="total" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                            <Area type="monotone" dataKey="donation" stroke="#ec4899" fillOpacity={0} strokeWidth={1} strokeDasharray="5 5" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between mt-4 text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                        <span>Launch (Highest Donation)</span>
                        <span>Show Day (Base Price Only)</span>
                      </div>
                    </div>

                    {/* Section Selector */}
                    <div className="glass rounded-3xl p-8 border border-white/5">
                      <h3 className="text-xl font-bold mb-6">Arena Sections</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {ARENAS.find(a => a.id === selectedConcert.arenaId)?.sections.map(section => (
                          <SectionPriceRow 
                            key={section.id} 
                            section={section} 
                            concert={selectedConcert as Concert}
                            onWatch={handleWatch}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Active Watchers */}
                    {watchers.filter(w => w.concertId === selectedConcert.id).length > 0 && (
                      <div className="glass rounded-3xl p-8 border border-blue-500/20">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Bell size={20} className="text-blue-400" /> Your Price Alerts
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          {watchers.filter(w => w.concertId === selectedConcert.id).map(w => (
                            <div key={w.id} className="bg-white/5 rounded-full px-4 py-2 text-sm border border-white/10 flex items-center gap-4">
                              <span>Target: <strong className="text-white">{formatCurrency(w.targetPrice)}</strong></span>
                              <button 
                                onClick={() => setWatchers(watchers.filter(x => x.id !== w.id))}
                                className="text-gray-500 hover:text-red-400"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-8 py-4 md:hidden flex justify-around">
        <button onClick={() => setView('home')} className="flex flex-col items-center gap-1 text-purple-500">
          <Search size={20} />
          <span className="text-[10px] font-bold uppercase">Explore</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <History size={20} />
          <span className="text-[10px] font-bold uppercase">Activity</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500">
          <div className="relative">
            <Bell size={20} />
            {watchers.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></span>}
          </div>
          <span className="text-[10px] font-bold uppercase">Alerts</span>
        </button>
      </nav>
    </div>
  );
}
