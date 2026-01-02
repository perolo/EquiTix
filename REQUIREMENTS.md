# Requirement Specification - EquiTix

EquiTix is a ticket-distribution platform designed to neutralize the secondary "black market" (scalping) by capturing market-clearing prices for philanthropic causes.

## Functional Requirements

### 1. Dynamic Donation Decay (D3)
- Tickets launch at a high price consisting of a **Base Price** plus a **Donation Multiplier**.
- The donation component decays over time from the `launchDate` to the `floorDate` (typically the day of the concert).
- The decay follows a predictable path (linear or exponential) set by the artist.

### 2. Mandatory Philanthropy
- A predefined percentage of the total ticket price during the premium period is designated as a tax-deductible donation.
- The donation must be directed to a selection of causes vetted and chosen by the artist.

### 3. Artist-Driven Configuration
- Artists define the `maxMultiplier` (e.g., 10x, 50x, or 100x the base price).
- Artists select the `charityCauses` from a supported list.
- Artists set the `floorDate` (when the price reaches base value).

### 4. Price Watchers & Alerts
- Users must be able to set a "Target Price" for specific arena sections.
- The system provides notifications when the current decayed price meets or falls below the user's target.

### 5. Transparency & Impact Tracking
- The app must display a live counter of the total ethical impact (total donations processed).
- Every ticket must clearly print the donation amount and the supported cause.

### 6. Tax Compliance
- The system generates receipts that separate the commercial "base price" from the "charitable donation" for tax-deductible purposes.
