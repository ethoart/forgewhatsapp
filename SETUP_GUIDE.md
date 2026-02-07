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
    DOMAIN_NAME=n8n.arcane.click
    GENERIC_TIMEZONE=Asia/Kolkata
    MONGO_USER=admin
    MONGO_PASS=securepassword123
    ```

3.  **Docker Compose**: `nano docker-compose.yml` (Paste the new code).

4.  **Start**:
    ```bash
    docker-compose up -d
    ```

---

## 🟠 Phase 3: Cloudflare & WhatsApp Setup

We need to access two dashboards: n8n and WAHA (to scan QR).

1.  **Configure Tunnels**:
    *   Go to Cloudflare Zero Trust -> Tunnels.
    *   Add a **Public Hostname** for n8n:
        *   `n8n.yourdomain.com` -> `http://n8n:5678`
    *   Add a **Public Hostname** for WAHA:
        *   `waha.yourdomain.com` -> `http://waha:3000`

2.  **Scan WhatsApp QR**:
    *   Go to `https://waha.yourdomain.com/dashboard`
    *   You will see the API Dashboard.
    *   Look for the **"Start Session"** or **"Screenshot"** section, or check the logs if the dashboard is complex.
    *   **Easiest Method**: Watch the logs to grab the QR code string or image.
        ```bash
        docker logs -f waha
        ```
    *   Open WhatsApp on your phone -> Linked Devices -> Link a Device.
    *   Scan the QR code shown in the Dashboard (or logs).
    *   Once connected, the status will change to `WORKING`.

---

## 🟣 Phase 4: Configure n8n

1.  **Log in** to n8n (`https://n8n.yourdomain.com`).
2.  **Import Workflow**: Upload `n8n_workflow.json`.
3.  **Check Connection**:
    *   The workflow now sends data to `http://waha:3000/api/sendFile`.
    *   This is an internal Docker link, so no configuration is needed inside n8n!
4.  **Activate** the workflow.

---

## 🟡 Phase 5: Deploy Frontend (Netlify)

1.  **Update `netlify.toml`**:
    *   Ensure `to = "https://n8n.yourdomain.com/webhook/:splat"` points to your n8n domain.
2.  **Build & Deploy** to Netlify.

---

## ✅ Done!

**How to use:**
1.  **Register**: Go to `your-netlify-app.com/register`. Enter phone (e.g., `919876543210`).
2.  **Upload**: Go to `your-netlify-app.com/admin`. Upload a file named `video.mp4`.
3.  **Receive**: Your WhatsApp (the one you scanned) will send the file to the customer automatically!