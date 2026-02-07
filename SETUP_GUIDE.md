# 🚀 A-Z Guide: WhatsApp Document Platform (Self-Hosted)

This guide takes you from a fresh AWS server to a fully working application using **WAHA (WhatsApp HTTP API)** instead of Meta Cloud API.

**Architecture:**
*   **Backend**: n8n + MongoDB + **WAHA** (Hosted on AWS T3 Small)
*   **Connectivity**: Cloudflare Tunnel
*   **Frontend**: React (Hosted on Netlify)

---

## 🟢 Phase 1: AWS Server Setup

1.  **Launch Instance**: AWS EC2 **t3.small** (Ubuntu).
2.  **Connect**: `ssh -i key.pem ubuntu@ip`
3.  **Enable Swap (MANDATORY)**:
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    ```
4.  **Install Docker**:
    ```bash
    sudo apt update && sudo apt install -y docker.io docker-compose
    sudo usermod -aG docker $USER
    newgrp docker
    ```

---

## 🔵 Phase 2: Deploy Backend

1.  **Create Project**:
    ```bash
    mkdir whatsdoc-backend && cd whatsdoc-backend
    ```

2.  **Config**: `nano .env`
    ```env
    CLOUDFLARED_TOKEN=replace_me
    DOMAIN_NAME=n8n.arcanes.click
    GENERIC_TIMEZONE=Asia/Kolkata
    MONGO_USER=admin
    MONGO_PASS=securepassword123
    ```

3.  **Docker Compose**: `nano docker-compose.yml` (Paste the new code).

4.  **Start Services**:
    ```bash
    docker-compose up -d
    ```

---

## 🟠 Phase 3: Cloudflare & WhatsApp Setup

We need to access two dashboards: n8n and WAHA (to scan QR).

### 🚨 Troubleshooting: "401 Unauthorized" or Login Fails
If you cannot log in, the server might be holding onto old data or your browser is caching the failure.

**Step 1: Run the Fix Script**
This script will wipe the database and print the **exact password** from the logs.
```bash
# Create or update the script
nano reset_waha.sh
# (Paste the new content of reset_waha.sh)
# Run it
bash reset_waha.sh
```
**Read the output of this script!** It will tell you the password.

**Step 2: Use Incognito Mode**
Open your browser in **Incognito/Private Mode** and go to `https://waha.yourdomain.com/dashboard`.
*   **User**: `admin`
*   **Password**: `secret123` (or whatever the script output says)

### 📲 Linking WhatsApp
1.  **Go to Dashboard**: `https://waha.yourdomain.com/dashboard`
2.  **Login**: `admin` / `secret123`
3.  **Scan QR**:
    *   If you see the dashboard, look for the QR code (screenshot or start session).
    *   Open WhatsApp on your phone -> Linked Devices -> Link a Device.
    *   Scan the QR code.

**Alternative Method (If Dashboard fails):**
View the QR code directly in the server terminal:
```bash
docker logs waha -f
```
(Look for a giant QR code made of text blocks. Scroll up if needed).

---

## 🟣 Phase 4: Configure n8n Credentials (CRITICAL)

**⚠️ If you skip this, the app will give 500 Errors!**

1.  **Log in** to n8n (`https://n8n.yourdomain.com`).
2.  **Set up MongoDB Credential**:
    *   Click **Credentials** (Key icon) in the left sidebar.
    *   Click **Add Credential**.
    *   Search for **MongoDB**.
    *   **Configuration**:
        *   **User**: `admin`
        *   **Password**: `securepassword123` (or whatever you set in .env)
        *   **Host(s)**: `mongo` (IMPORTANT: Do not use localhost)
        *   **Port**: `27017`
        *   **Database**: `test` (or `admin`)
        *   **Authentication Database**: `admin`
    *   Click **Save**.

3.  **Import Workflow**:
    *   Go to Workflows -> **Import from File**.
    *   Upload `n8n_workflow.json`.

4.  **Link Credentials (VERY IMPORTANT)**:
    *   You will see 4 MongoDB nodes (Green nodes).
    *   Double-click **each one**.
    *   In the **Credential to connect with** dropdown, select the MongoDB credential you just created.
    *   **Close and Save**.

5.  **Activate**:
    *   Toggle the **Active** switch in the top right corner.

---

## 🟡 Phase 5: Deploy Frontend (Netlify)

1.  **Update `netlify.toml`**:
    *   Ensure `to = "https://n8n.arcanes.click/webhook/:splat"` points to your n8n domain.
2.  **Build & Deploy** to Netlify.

---

## ✅ Done!

**How to use:**
1.  **Register**: Go to `your-netlify-app.com/register`. Enter phone (e.g., `919876543210`).
2.  **Upload**: Go to `your-netlify-app.com/admin`. Upload a file named `video.mp4`.
3.  **Receive**: Your WhatsApp (the one you scanned) will send the file to the customer automatically!