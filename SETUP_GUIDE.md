# 📘 Split Architecture Setup Guide

This guide separates the application into two parts for maximum performance and stability:
1.  **Frontend**: Hosted on **Netlify** (Free, Global CDN, Fast).
2.  **Backend**: Hosted on **AWS** (n8n + MongoDB).

---

## 🟢 Part 1: Backend Setup (AWS)

This runs the logic (n8n) and database (MongoDB).

### 1. Prepare AWS Server
SSH into your AWS T3 Small instance.

```bash
# Install Docker
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker

# Create Folder
mkdir whatsdoc-backend
cd whatsdoc-backend
```

### 2. Create Cloudflare Tunnel (Backend Only)
1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/).
2. **Networks** -> **Tunnels** -> **Create Tunnel**.
3. Name: `n8n-backend`.
4. Platform: **Docker**. Copy the Token (`eyJh...`).
5. **Public Hostname**:
   *   **Subdomain**: `n8n`
   *   **Domain**: `arcane.click`
   *   **Service**: `HTTP` -> `n8n:5678`
   *   *(Do NOT add the frontend 'app' hostname here anymore).*

### 3. Configure Docker
Create the environment file:
```bash
nano .env
```
Paste this:
```env
# Cloudflare Tunnel Token
CLOUDFLARED_TOKEN=eyJh...

# Domain
DOMAIN_NAME=n8n.arcane.click
GENERIC_TIMEZONE=Asia/Kolkata

# Database Config
MONGO_USER=admin
MONGO_PASS=securepassword123
```

Create the `docker-compose.yml` file:
```bash
nano docker-compose.yml
```
Paste this (Backend Only):
```yaml
version: "3.8"
services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://${DOMAIN_NAME}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
      # CORS Settings to allow Netlify Frontend to talk to AWS
      - N8N_ENDPOINT_REST_CORS_ORIGIN=*
      - N8N_ENDPOINT_REST_CORS_ALLOW_HEADERS=*
      # Memory Optimization for T3 Small
      - NODE_OPTIONS=--max-old-space-size=1024
    volumes:
      - ./n8n_data:/home/node/.n8n
    depends_on:
      - mongo

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: always
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARED_TOKEN}
    depends_on:
      - n8n

  mongo:
    image: mongo:6.0
    restart: always
    # Limit Cache to save RAM
    command: ["--wiredTigerCacheSizeGB", "0.25"]
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASS}
    volumes:
      - ./mongo_data:/data/db
```

### 4. Start Backend
```bash
docker-compose up -d
```
Your backend is now live at `https://n8n.arcane.click`.

---

## 🟡 Part 2: Frontend Setup (Netlify)

We will build the React app on your computer and deploy it to Netlify.

### 1. Configure
Open `constants.ts` in your local project.
Ensure `webhookBaseUrl` matches your AWS domain:
```typescript
webhookBaseUrl: "https://n8n.arcane.click/webhook",
```

### 2. Build
Run this in your local VS Code terminal:
```bash
npm run build
```
This creates a `dist` folder in your project directory.

### 3. Deploy
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** -> **Deploy manually**.
3. Drag and drop the `dist` folder onto the Netlify drop zone.
4. **Done!** Netlify will give you a URL (e.g., `https://funny-name-123.netlify.app`).

*(Optional)*: You can add a custom domain (e.g., `app.arcane.click`) in Netlify Site Settings -> Domain Management.

---

## 🟣 Part 3: n8n Workflow Configuration

1. Open `https://n8n.arcane.click` and create an owner account.
2. Create a new Workflow.
3. **Import from JSON**: Paste the code below.
4. **Important**:
   *   Open the "Webhook Register" node.
   *   Set **Respond** to `Immediately` (or `Using 'Respond to Webhook' Node` if available in your version, but 'Immediately' is safer for CORS).
   *   Repeat for "Webhook Upload" and "Webhook Get Pending".
   *   *Note: The JSON below is pre-configured for standard usage.*

### Workflow JSON

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "register-customer",
        "responseMode": "onReceived",
        "options": {}
      },
      "name": "Webhook Register",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [100, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "collection": "customers",
        "fields": "name, phone, videoName, status, requestedAt",
        "options": {}
      },
      "name": "Mongo Insert",
      "type": "n8n-nodes-base.mongoDb",
      "position": [300, 300]
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "upload-document",
        "responseMode": "onReceived",
        "options": {
          "binaryData": true
        }
      },
      "name": "Webhook Upload",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [100, 500]
    },
    {
      "parameters": {
        "operation": "find",
        "collection": "customers",
        "query": "={ \"videoName\": { \"$regex\": \"^{{$json.body.videoName}}\", \"$options\": \"i\" }, \"status\": \"pending\" }"
      },
      "name": "Mongo Find Match",
      "type": "n8n-nodes-base.mongoDb",
      "position": [300, 500]
    },
    {
      "parameters": {
        "amount": "={{ Math.floor(Math.random() * (120 - 45) + 45) }}",
        "unit": "seconds"
      },
      "name": "Human Delay",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1,
      "position": [500, 500]
    },
    {
      "parameters": {
        "operation": "send",
        "to": "={{ $json.phone }}",
        "type": "document",
        "document": {
          "link": "",
          "filename": "={{ $node[\"Webhook Upload\"].binary.file.fileName }}"
        },
        "caption": "Hi {{ $json.name }}! Here is the video document you requested: {{ $json.videoName }}. Thanks for visiting us!"
      },
      "name": "WhatsApp Cloud API",
      "type": "n8n-nodes-base.whatsapp",
      "position": [700, 500]
    },
    {
      "parameters": {
        "operation": "update",
        "collection": "customers",
        "updateKey": "_id",
        "updateFields": "status",
        "value": "completed"
      },
      "name": "Mongo Update Status",
      "type": "n8n-nodes-base.mongoDb",
      "position": [900, 500]
    },
    {
       "parameters": {
          "operation": "find",
          "collection": "customers",
          "query": "{ \"status\": \"pending\" }",
          "options": {
             "limit": 50
          }
       },
       "name": "Get Pending",
       "type": "n8n-nodes-base.mongoDb",
       "position": [300, 700]
    },
    {
       "parameters": {
          "httpMethod": "GET",
          "path": "get-pending",
          "responseMode": "responseNode",
          "options": {}
       },
       "name": "Webhook Get Pending",
       "type": "n8n-nodes-base.webhook",
       "typeVersion": 1,
       "position": [100, 700]
    },
    {
       "parameters": {
          "respondWith": "json",
          "responseBody": "={{ $json }}",
          "options": {}
       },
       "name": "Respond with Data",
       "type": "n8n-nodes-base.respondToWebhook",
       "typeVersion": 1,
       "position": [500, 700]
    }
  ],
  "connections": {
    "Webhook Register": {
      "main": [[{"node": "Mongo Insert", "type": "main", "index": 0}]]
    },
    "Webhook Upload": {
      "main": [[{"node": "Mongo Find Match", "type": "main", "index": 0}]]
    },
    "Mongo Find Match": {
      "main": [[{"node": "Human Delay", "type": "main", "index": 0}]]
    },
    "Human Delay": {
      "main": [[{"node": "WhatsApp Cloud API", "type": "main", "index": 0}]]
    },
    "WhatsApp Cloud API": {
      "main": [[{"node": "Mongo Update Status", "type": "main", "index": 0}]]
    },
    "Webhook Get Pending": {
       "main": [[{"node": "Get Pending", "type": "main", "index": 0}]]
    },
    "Get Pending": {
       "main": [[{"node": "Respond with Data", "type": "main", "index": 0}]]
    }
  }
}
