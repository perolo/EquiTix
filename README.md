# Evaluating AI Studio app

# EquiTix - Ethical Concert Ticketing Platform

EquiTix is a revolutionary ticketing solution designed to eliminate the secondary black market (scalping) through a model of **Dynamic Donation Decay (D3)**.

<div align="center">
<img width="757" height="1037" alt="image" src="https://github.com/user-attachments/assets/1ace3e89-99af-4635-bb79-fe99b7c0c9c6" />
</div>


## Core Concept
Instead of allowing scalpers to capture the "market value" of popular tickets, EquiTix sets the initial price high (Base Price + Donation). This donation decays daily as the concert date approaches. 
- **Wait for the drop:** Fans can wait until the price matches their budget.
- **Support a cause:** Fans who buy early pay more, but that premium is a direct, tax-deductible donation to the artist's chosen charities.
- **No Profit for Scalpers:** Since the initial price is already at the "scalper level," there is no margin for illegal reselling.

## Key Features
- **Dynamic Pricing Engine:** Linear decay logic based on concert launch and show dates.
- **User Profiles:** Secure dashboard for tracking purchase history and downloading tax receipts.
- **Admin Command Center:** Manual user activation logic to prevent platform abuse.
- **AI-Enhanced UX:** Gemini API integration for generating impact stories and receipt summaries.
- **Live Impact Tracker:** Real-time global counter of total funds raised for philanthropy.

## Technology Stack
- **Frontend:** React 19, Tailwind CSS, Recharts.
- **Icons:** Lucide-React.
- **AI:** Google Gemini SDK (@google/genai).

## Getting Started
1. **Initial Login:** Use `admin@example.com` / `admin` to access administrative features.
2. **Registration:** New users must sign up and be activated by the admin before they can log in.
3. **Purchase:** Navigate to an artist tour, select a city, and buy a ticket to see it reflected in your profile.

---
*EquiTix - Turning scalper profits into charitable impact.*

## Documentation
For deeper insights into the project specifications, user requirements, and technical design, please refer to the following documents:

- [Requirement Specification](REQUIREMENTS.md)
- [User Stories](USER_STORIES.md)
- [Architectural Specification](ARCHITECTURE.md)
- [Backend Services Specification](BACKEND_SERVICES.md)