
# Requirement Specification - EquiTix

## 1. Role-Based Access Control (RBAC)
- **Admin Role:** Full access to User Management, Arena registration, and Charity vetting.
- **Artist Role:** Restricted access to Concert creation and management for their linked profile.
- **Customer Role:** Standard access to search, view, and purchase tickets.

## 2. CRUD Functionality
### 2.1 User Management (Admin Only)
- List all users with join dates and status.
- Toggle activation status (Approval).
- Modify user category (Customer, Artist, Admin).

### 2.2 Arena Management (Admin Only)
- Create new arena profiles with name, city, and capacity.
- Automatically generate a default "General Admission" section for new arenas.

### 2.3 Charity Management (Admin Only)
- Manage a global pool of Charity Causes that artists can choose from.

### 2.4 Concert Management (Artist Only)
- Artists can create tour stops (Concerts) by linking to existing Arenas.
- Artists define the `floorDate` (when donation hits $0) and the `multiplier`.

## 3. Data Integrity & Security
- **Authentication:** All sensitive actions (Buy, Create Concert, Activate User) require a valid `currentUser` session.
- **Data Persistence:** Mocked using local state but architected to support RESTful API integration.
