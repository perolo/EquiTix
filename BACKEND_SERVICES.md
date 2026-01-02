# Backend Services Specification - EquiTix

## 1. Pricing & Decay Engine
Calculates the `PriceSnapshot` in real-time.
- **Input:** `BasePrice`, `LaunchDate`, `FloorDate`, `MaxMultiplier`.
- **Logic:** `CurrentPrice = Base + (Base * MaxMultiplier * DecayFactor)`.
- **Output:** `Total`, `DonationComponent`, `BaseComponent`.

## 2. Inventory & Locking Service
Manages arena sections and seat availability.
- Handles high-concurrency "locking" during the 10-minute checkout phase to prevent overselling of popular sections.
- Tracks seat availability in real-time.

## 3. Philanthropy API Integration
Connects to global charity databases.
- Pulls metadata, logos, and mission statements for the causes selected by artists.
- Validates the legal status of organizations for tax-deductible receipt generation.

## 4. AI Content Service (Gemini)
- **Impact Generation:** Takes a donation amount and cause; returns a human-readable impact story to the frontend.
- **Receipt Summarization:** Generates formal, personalized receipt text that explains the anti-scalping impact of the purchase.

## 5. Notification Hub
A high-frequency service that monitors the decay engine.
- Triggers push notifications or emails when a section's current price matches a user's `Watcher` target price.

## 6. Payment & Escrow
- Splits payments between the event promoter (Base Price) and the Charity Fund (Donation).
- Issues separate transaction IDs for the commercial and charitable components.
