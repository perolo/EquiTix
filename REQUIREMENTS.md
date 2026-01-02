
# Requirement Specification - EquiTix

## Functional Requirements

### 1. User Account Management
- **Persistence:** System must store a database of UserAccounts including names, encrypted passwords, and status.
- **Activation Workflow:** New accounts are set to `isActivated: false` by default. They cannot log in until changed to `true`.
- **Dashboard:** Each user has a unique profile view showing metadata and order history.

### 2. Admin Dashboard
- **Access Control:** Only users with `isAdmin: true` can access the Command Center.
- **CRUD Operations:** Admins must be able to list all users and toggle their activation status.
- **Override Capability:** Admins act as the primary gatekeepers for new account approvals until automated email verification is implemented.

### 3. Dynamic Donation Decay (D3)
- Tickets launch with a **Donation Multiplier**.
- The donation component decays over time until reaching the **Base Price**.

### 4. Transactional Integrity
- Every purchase must generate a unique `Purchase` object.
- Purchases must be linked to the user's email for historical tracking in their vault.

### 5. AI Narrative Engine
- Use Gemini API to describe real-world impact of the donation portions of ticket sales.
