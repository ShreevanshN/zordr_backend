# 🚀 DEPLOYMENT GUIDE - Run These Commands

## ⚠️ PowerShell Issue Detected

Your system has script execution disabled. You have two options:

### Option 1: Enable PowerShell Scripts (Recommended)

Run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then restart your terminal and continue with Option 2.

### Option 2: Use CMD Instead

Open **Command Prompt (CMD)** instead of PowerShell and run:

---

## 📋 Step-by-Step Deployment

### Step 1: Apply Database Migration

Open CMD or PowerShell (after enabling) in the backend directory:

```bash
cd d:\PROJECTS\Zorder_project\zordr-backend--main
npx prisma migrate dev --name add_favorites_and_campus
```

**Expected Output:**

```
✔ Generated Prisma Client
✔ Prisma Migrate applied the migration:
  - add_favorites_and_campus
```

This creates:

- ✅ `Favorite` table
- ✅ `campus` field in User table
- ✅ `dietary` field in MenuItem table

---

### Step 2: Restart Backend Server

If the server is running, stop it (Ctrl+C), then:

```bash
npm start
```

**Expected Output:**

```
🚀 Zordr Backend running on http://localhost:3000
📡 API available at http://localhost:3000/api
```

---

### Step 3: Test New Endpoints

#### Test Favorites API:

```bash
# GET favorites (requires auth token)
curl http://localhost:3000/api/favorites -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Enhanced Outlets:

```bash
# Get outlets by campus
curl http://localhost:3000/api/outlets?campus=KITSW

# Get available campuses
curl http://localhost:3000/api/outlets/meta/campuses
```

#### Test Enhanced Menu:

```bash
# Filter by dietary preference and price
curl "http://localhost:3000/api/menu/items?dietary=Veg&maxPrice=200"
```

---

### Step 4: Verify Mobile App Integration

1. **Restart your mobile app** (reload in Expo)
2. **Test these flows:**

#### Cart Flow:

- [ ] Add items to cart from home screen
- [ ] View cart with correct totals
- [ ] Cart persists after app reload

#### Favorites Flow:

- [ ] Tap heart icon on items
- [ ] Navigate to favorites tab
- [ ] Favorites persist across sessions

#### Profile Flow:

- [ ] Complete sign-up with campus selection
- [ ] Set dietary preferences
- [ ] Add allergies
- [ ] Profile updates save to backend

#### Search & Filter:

- [ ] Search for items
- [ ] Filter by category
- [ ] Filter by price range
- [ ] See filtered results

---

## ✅ Success Checklist

After running the migration and restarting the server:

- [ ] Database migration completed without errors
- [ ] Server started successfully on port 3000
- [ ] `/api/favorites` route accessible
- [ ] `/api/outlets` returns campus-filtered results
- [ ] Mobile app can add items to cart
- [ ] Mobile app can favorite items
- [ ] User profile saves campus and allergies

---

## 🐛 Troubleshooting

### Migration Error: "Table already exists"

If you get this error, run:

```bash
npx prisma db push
```

### Server Won't Start

Check if port 3000 is already in use:

```bash
netstat -ano | findstr :3000
```

### Database Connection Error

Verify your `.env` file has correct DATABASE_URL.

---

## 📞 Need Help?

If you encounter any issues:

1. Check the server console for error messages
2. Verify PostgreSQL is running
3. Check that all route files exist
4. Ensure Prisma Client is generated: `npx prisma generate`
