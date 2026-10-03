# 🚀 CareConnect Hospital - Complete Deployment Guide
> **Step-by-step instructions to push your repository to GitHub, deploy the Node.js backend to Render, and deploy the responsive frontend to Vercel.**

---

## 📌 Deployment Architecture Overview

```
+-------------------------------------------------------------------------+
|                        VERCEL (Frontend Hosting)                       |
|   URL: https://careconnect-hospital.vercel.app                          |
|   Serves: HTML5, CSS3, JavaScript, Images, Modals, Slips                |
+-------------------------------------------------------------------------+
                                    |
          Rewrites/Proxy via vercel.json (or direct API calls)
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         RENDER (Backend Web Service)                    |
|   URL: https://careconnect-backend.onrender.com                         |
|   Runs: Express REST APIs, JWT Auth, SQLite/MySQL DB, Business Logic    |
+-------------------------------------------------------------------------+
```

---

## Part 1: Push Project to Your GitHub Repository

Repository URL: **`https://github.com/adii023/CareConnect-Hospital-Appointment-System`**

### Step 1.1: Open Terminal in Project Folder
Open PowerShell or Command Prompt in:
```powershell
cd "c:\Users\Admin\Desktop\Adii TYCS"
```

### Step 1.2: Initialize and Commit
If Git is installed, execute the following standard commands:
```powershell
# 1. Initialize git repository
git init

# 2. Add all files (respecting .gitignore)
git add .

# 3. Create your initial commit
git commit -m "feat: complete CareConnect Hospital Appointment System"

# 4. Set the default branch to main
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/adii023/CareConnect-Hospital-Appointment-System.git

# 6. Push code to GitHub
git push -u origin main
```

*(If prompted by GitHub for credentials, sign in with your GitHub account or use a Personal Access Token / GitHub Desktop).*

---

## Part 2: Deploy Backend to Render (Free Web Service)

[Render](https://render.com) provides free cloud hosting for Node.js applications.

### Step 2.1: Create Render Account & Link GitHub
1. Go to [https://render.com](https://render.com) and click **Sign Up** (or log in with GitHub).
2. Click **New +** in the top navigation and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and select your repository:
   `adii023/CareConnect-Hospital-Appointment-System`

### Step 2.2: Configure Web Service Settings
Fill in the following details:

| Configuration Field | Value |
| :--- | :--- |
| **Name** | `careconnect-backend` (or any unique name you prefer) |
| **Region** | Choose closest to you (e.g., `Singapore` or `Frankfurt`) |
| **Branch** | `main` |
| **Root Directory** | *(Leave empty - defaults to root)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 2.3: Add Environment Variables
Under the **Environment Variables** section on Render, add:
- `NODE_ENV` = `production`
- `JWT_SECRET` = `careconnect_super_secret_jwt_key_2026`

### Step 2.4: Deploy & Copy Your Render URL
1. Click **Create Web Service**.
2. Render will run `npm install` and `npm start`.
3. In 2–3 minutes, you will see `Server running at http://localhost:10000` and the status will turn **Live**.
4. Copy your backend URL at the top left of the Render dashboard:
   Example: **`https://careconnect-backend.onrender.com`**

> **Note on Render Free Tier:** Render spins down free services after 15 minutes of inactivity. When accessed again, the first request may take 30–50 seconds to wake up. This is normal for free hosting.

---

## Part 3: Deploy Frontend to Vercel (Free Frontend Hosting)

[Vercel](https://vercel.com) provides blazing-fast edge hosting for web applications.

### Step 3.1: Connect Vercel to Your GitHub
1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Locate `CareConnect-Hospital-Appointment-System` and click **Import**.

### Step 3.2: Configure Project on Vercel
1. **Framework Preset:** Select `Other` (Static HTML/CSS/JS).
2. **Root Directory:** Keep `./` (the included `vercel.json` will automatically route traffic).
3. **Build & Development Settings:** Leave defaults.

### Step 3.3: Point Vercel to Your Render Backend
Open `vercel.json` in your project and update the destination with your actual Render backend URL:
```json
{
  "version": 2,
  "cleanUrls": true,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://YOUR-RENDER-NAME.onrender.com/api/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/$1"
    }
  ]
}
```

### Step 3.4: Deploy!
1. Click **Deploy**.
2. Within 30 seconds, Vercel will build and give you a live production link:
   Example: **`https://careconnect-hospital.vercel.app`**
3. Open the link on your laptop or phone:
   - Your landing page will load instantly.
   - Doctor search, login, slot booking, and dashboards will communicate seamlessly with your Render backend!

---

## Part 4: Alternative (Easiest Full-Stack 1-Service Deployment)

If you prefer to deploy **both frontend and backend together on a single free Render Web Service**:
- Because our Express server already serves the static frontend from the `frontend/` folder, **deploying the backend on Render automatically hosts your entire frontend too!**
- You can simply open your Render URL:  
  👉 `https://careconnect-backend.onrender.com/`  
  and the entire hospital portal will run from a single URL with zero cross-origin configuration!
