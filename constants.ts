
import { Artist, Arena, Concert } from './types';

export const ARTISTS: Artist[] = [
  {
    id: '1',
    name: 'Aetheria',
    genre: 'Synth Pop / Ambient',
    description: 'Aetheria is known for their ethereal soundscapes and massive stadium-sized synth productions.',
    image: 'https://picsum.photos/seed/aetheria/800/600',
    charityCauses: [
      { id: 'c1', name: 'Global Reforestation', description: 'Planting native trees in damaged ecosystems.', icon: '🌳' },
      { id: 'c2', name: 'Clean Water Initiative', description: 'Providing clean drinking water to remote villages.', icon: '💧' }
    ]
  },
  {
    id: '2',
    name: 'Midnight Echo',
    genre: 'Indie Rock',
    description: 'Raw, energetic, and socially conscious rock from the heart of the underground.',
    image: 'https://picsum.photos/seed/echo/800/600',
    charityCauses: [
      { id: 'c3', name: 'Youth Music Education', description: 'Funding instruments for inner-city schools.', icon: '🎸' },
      { id: 'c4', name: 'Ocean Cleanup', description: 'Removing plastic from the Great Pacific Garbage Patch.', icon: '🌊' }
    ]
  },
  {
    id: '3',
    name: 'Solaris V',
    genre: 'Neo-Jazz / Funk',
    description: 'The futuristic collective blending brass with bass in a cosmic explosion of sound.',
    image: 'https://picsum.photos/seed/solaris/800/600',
    charityCauses: [
      { id: 'c5', name: 'Renewable Energy Lab', description: 'Researching decentralized solar power.', icon: '☀️' }
    ]
  }
];

export const ARENAS: Arena[] = [
  {
    id: 'a1',
    name: 'Prism Sphere',
    city: 'Los Angeles',
    capacity: 20000,
    sections: [
      { id: 's1', name: 'Platinum Pit', basePrice: 250, totalSeats: 200, availableSeats: 145 },
      { id: 's2', name: 'Main Tier', basePrice: 150, totalSeats: 5000, availableSeats: 3200 },
      { id: 's3', name: 'Upper Bowl', basePrice: 85, totalSeats: 14800, availableSeats: 12000 }
    ]
  },
  {
    id: 'a2',
    name: 'Nova Stadium',
    city: 'London',
    capacity: 60000,
    sections: [
      { id: 's4', name: 'Standing Floor', basePrice: 120, totalSeats: 15000, availableSeats: 8000 },
      { id: 's5', name: 'Grandstands', basePrice: 95, totalSeats: 45000, availableSeats: 35000 }
    ]
  }
];

const now = new Date();
const launch = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10); // Launched 10 days ago

export const CONCERTS: Concert[] = [
  {
    id: 'ev1',
    artistId: '1',
    arenaId: 'a1',
    date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days from now
    launchDate: launch.toISOString(),
    floorDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 40).toISOString(), // Donation drops to 0 in 40 days
    maxMultiplier: 100
  },
  {
    id: 'ev2',
    artistId: '2',
    arenaId: 'a2',
    date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    launchDate: launch.toISOString(),
    floorDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 55).toISOString(),
    maxMultiplier: 50
  }
];
