# 📘 Split Architecture Setup Guide

This guide separates the application into two parts:
1.  **Frontend**: Hosted on **Netlify**.
2.  **Backend**: Hosted on **AWS** (n8n + MongoDB).

---

## 🚨 CRITICAL TROUBLESHOOTING (Error 502)

If you see a 502 Bad Gateway, perform this **Diagnostic Test** on your AWS server:

1. **Check if n8n is alive locally:**
   Run this command on your server:
   ```bash
   curl -v http://127.0.0.1:5678/healthz
   ```

   *   **Result A: "Connection refused"** -> n8n is CRASHED.
       *   Solution: Run `docker logs n8n` to see why.
   *   **Result B: "200 OK" or HTML output** -> n8n is ALIVE.
       *   **The issue is your Cloudflare Dashboard Config.**
       *   Go to Cloudflare -> Tunnel -> Public Hostname.
       *   Ensure service is `http://n8n:5678`.
       *   **Important:** If `n8n:5678` fails, try `http://172.17.0.1:5678` (Docker Host IP).

---

## 🟢 Part 1: Backend Setup (AWS)

### 1. Enable Swap (Mandatory)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Start Server
SSH into your instance.

```bash
cd whatsdoc-backend
nano docker-compose.yml 
# (Paste the new content provided in the code)

# Restart Everything
docker-compose down
docker-compose up -d
```

### 3. Verify Containers
```bash
docker ps
```
Wait 2 minutes. If `n8n` keeps restarting, it's a memory issue.

---

## 🟠 Part 2: Cloudflare Tunnel Configuration
**This is the #1 cause of 502 errors.**

1.  Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2.  **Networks** -> **Tunnels** -> **Configure** -> **Public Hostname**.
3.  Edit the `n8n` entry.
4.  **Service**:
    *   **Type**: `HTTP`
    *   **URL**: `n8n:5678`
    *   *(If that fails, try `host.docker.internal:5678`)*

---

## 🟡 Part 3: Frontend Setup (Netlify)

1.  **Configure**: Update `constants.ts` with `webhookBaseUrl: "https://n8n.arcane.click/webhook"`.
2.  **Build**: `npm run build`.
3.  **Deploy**: Upload `dist` folder to Netlify.

---

## 🟣 Part 4: n8n Workflow Configuration
*(Same as previous guide - import the JSON into n8n)*