---
description: How to setup and run the Zordr Backend
---

1. Navigate to the backend directory:

   ```powershell
   cd d:/PROJECTS/Zorder_project/zordr-backend--main
   ```

2. Install dependencies:

   ```powershell
   npm install
   ```

3. Setup Environment Variables:
   - Copy `env.example` to `.env`
   - Update `DATABASE_URL` in `.env` if your Postgres credentials differ from defaults.

4. **Create the Database**:
   You need a PostgreSQL database named `zordr`.

   **Option A: Using Command Line (psql)**
   1. Open a new terminal.
   2. Run the following command (enter your password when prompted):
      ```powershell
      psql -U postgres -c "CREATE DATABASE zordr;"
      ```

   **Option B: Using pgAdmin (GUI)**
   1. Open **pgAdmin** from your Start menu.
   2. Expand **Servers** > **PostgreSQL** > **Databases**.
   3. Right-click **Databases** > **Create** > **Database...**
   4. Name it `zordr` and click **Save**.

5. Setup Database Schema (Prisma):

   ```powershell
   npx prisma migrate dev
   ```

6. Seed the Database (Optional):

   ```powershell
   node seed.js
   ```

7. Start the Server:
   ```powershell
   npm run dev
   ```
