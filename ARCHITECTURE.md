# Architectural Specification - EquiTix

The EquiTix application is designed as a modern, high-performance Single Page Application (SPA) with real-time dynamic pricing capabilities.

## Tech Stack
- **Frontend Framework:** React 19 (ES6+ modules).
- **Styling:** Tailwind CSS (Utility-first, responsive, dark-mode primary).
- **Data Visualization:** Recharts (Area charts for price decay projections).
- **Icons:** Lucide-React.
- **AI Engine:** Google Gemini API (Gemini 3 Flash) for generating impact narratives and automated receipt summaries.

## Core Components
1. **Pricing Logic (`pricing.ts`):** A decoupled utility service that calculates the `PriceSnapshot` based on system time, concert metadata, and decay constants.
2. **Impact Tracking:** A real-time global counter component that simulates live donation updates across the network.
3. **Price Watcher System:** A client-side state management system for tracking user price alerts (extensible to server-side push notifications).

## Design Patterns
- **Glassmorphism:** Used for the UI to provide a premium, futuristic feel suitable for large arena tours.
- **Responsive Design:** Optimized for mobile-first users (concert-goers) with a persistent bottom navigation bar.
- **Decoupled Pricing:** All pricing calculations are pure functions, allowing for easy testing and updates to decay algorithms without affecting UI components.
