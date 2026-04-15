# LocalBiz Pulse 🏪📈

A beginner-friendly full-stack web application designed for small business owners in India (Kirana stores, tea stalls, local vendors) to track their sales, expenses, customers, and calculate a Business Health Score.

## Project Structure
- `backend/` - Node.js + Express API backend
- `frontend/` - HTML, CSS, JavaScript Vanilla frontend
- `schema.sql` - PostgreSQL initialization file

## Setup Instructions

### 1. Database Setup (PostgreSQL)
1. Ensure you have PostgreSQL installed.
2. Open pgAdmin or your terminal run `psql -U postgres`.
3. Create a new database named `localbiz`:
   ```sql
   CREATE DATABASE localbiz;
   ```
4. Connect to `localbiz` database and run the `schema.sql` (e.g. `\i schema.sql` inside psql). This will create tables and insert one dummy user.

### 2. Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check the `.env` file inside `backend/` and verify the `DB_PASSWORD` matches your PostgreSQL password.
4. Run the server:
   ```bash
   node server.js
   ```
   *You should see "✅ PostgreSQL Connected Successfully".*

### 3. Frontend Setup
1. You don't need any build steps for the frontend!
2. You can open `frontend/index.html` directly in your browser, OR use VS Code Live Server for a better experience.

### Dummy Data to Login
Use the following credentials in the login page:
- **Email:** ramesh@example.com
- **Password:** password123

---
*Built specifically for small businesses in India.* 🇮🇳
