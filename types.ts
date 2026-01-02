
export type UserCategory = 'customer' | 'artist' | 'admin';

export interface Artist {
  id: string;
  name: string;
  genre: string;
  description: string;
  image: string;
  charityCauses: CharityCause[];
}

export interface CharityCause {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Arena {
  id: string;
  name: string;
  city: string;
  capacity: number;
  sections: ArenaSection[];
}

export interface ArenaSection {
  id: string;
  name: string;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
}

export interface Concert {
  id: string;
  artistId: string;
  arenaId: string;
  date: string;
  launchDate: string;
  floorDate: string; // The date when donation is 0
  maxMultiplier: number; // e.g., 100 for 100x price
  charityIds: string[]; // List of selected charity IDs for this specific concert
}

export interface PriceSnapshot {
  total: number;
  base: number;
  donation: number;
}

export interface Watcher {
  id: string;
  concertId: string;
  sectionId: string;
  targetPrice: number;
  createdAt: string;
}

export interface UserAccount {
  email: string;
  passwordHash: string;
  name: string;
  isActivated: boolean;
  category: UserCategory;
  joinedAt: string;
  linkedArtistId?: string; // Optional: Link artist user to an actual Artist profile
}

export interface Purchase {
  id: string;
  userEmail: string;
  concertId: string;
  artistName: string;
  arenaName: string;
  sectionName: string;
  totalPrice: number;
  donationAmount: number;
  purchaseDate: string;
  eventDate: string;
  impactStory?: string;
  charityNames?: string[];
}
