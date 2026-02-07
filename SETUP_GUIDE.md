# 🚀 A-Z Guide: WhatsApp Document Platform (Hybrid Architecture)

**Architecture Update:**
*   **Data (Register/View)**: React -> Netlify Functions -> **Your VPS MongoDB** (Direct).
*   **Automation (Send)**: React -> n8n (AWS) -> WhatsApp.

---

## 🟢 Phase 1: Expose MongoDB on AWS

Since Netlify needs to talk to your server's database, we must open the port.

1.  **Update Server**:
    *   Pull the changes to your server (specifically `docker-compose.yml`).
    *   Restart containers:
        ```bash
        docker-compose down
        docker-compose up -d
        ```

2.  **Open AWS Firewall (Security Group)**:
    *   Go to **AWS Console** -> **EC2** -> **Instances**.
    *   Select your instance -> Click **Security** tab -> Click the **Security Group** link.
    *   **Edit Inbound Rules** -> **Add Rule**.
    *   **Type**: Custom TCP
    *   **Port Range**: `27017`
    *   **Source**: `0.0.0.0/0` (Anywhere).
    *   *Note: Since Netlify uses dynamic IPs, we must allow all. Ensure your MongoDB password in `.env` is STRONG.*
    *   **Save Rules**.

---

## 🔵 Phase 2: Netlify Configuration

1.  **Construct your Connection String**:
    *   Format: `mongodb://<user>:<password>@<your_vps_ip>:27017/whatsdoc?authSource=admin&directConnection=true`
    *   **User**: `admin` (or whatever is in your `.env`)
    *   **Password**: Your `MONGO_PASS` from `.env`.
    *   **VPS IP**: Your AWS Public IP (e.g., `54.12.34.56`).
    
    *Example*: `mongodb://admin:SuperSecurePass123@54.12.34.56:27017/whatsdoc?authSource=admin&directConnection=true`

2.  **Go to Netlify**:
    *   **Site Settings** -> **Environment Variables**.
    *   Add/Update Variable:
        *   **Key**: `MONGODB_URI`
        *   **Value**: (Paste the string from above)
3.  **Redeploy** your site.

---

## 🟠 Phase 3: n8n Configuration

Inside n8n, we are "inside" the Docker network, so we use the internal hostname `mongo` instead of the public IP.

1.  **Login to n8n**: `https://n8n.yourdomain.com`
2.  **Open Credentials**:
    *   Find your **MongoDB** credential.
    *   **Host**: `mongo` (Keep this as is! Do NOT use the public IP here).
    *   **Database**: `whatsdoc`
    *   **User/Pass**: Same as `.env`.
3.  **Save**.

---

## ✅ How it works now

1.  **Mobile Register**: Phone -> Netlify Function -> **AWS MongoDB (Port 27017)**.
2.  **Dashboard**: Netlify Function -> **AWS MongoDB (Port 27017)**.
3.  **Upload**: React -> n8n -> **AWS MongoDB (Internal Docker Network)** -> WhatsApp.

**Troubleshooting:**
*   **Connection Timeout / 500 Error**: 
    *   Check if AWS Security Group allows Port 27017.
    *   Check if `docker-compose` is running.
    *   Verify credentials in the Netlify `MONGODB_URI`.