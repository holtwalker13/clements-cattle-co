# Beef Order App MVP

A lightweight web app for managing beef cut orders from live Google Sheet inventory. Users browse inventory, add items to a queue, enter customer info, and submit orders. Orders are written to a Google Sheet and inventory is decremented; the server re-validates stock on submit to prevent overselling.

## Features

- **Inventory list** – Load cuts from a Google Sheet "Inventory" tab; show name, available qty, unit, and stock status (In Stock / Low Stock / Sold Out).
- **Queue/cart** – Plus/minus controls to adjust quantity per cut; queue is session-only (no persistence until order submit).
- **Customer form** – Name and phone required, email optional, before submit.
- **Submit order** – Server re-fetches inventory, validates quantities, appends rows to "Active Orders" tab, decrements inventory, returns success or conflict (409).
- **Oversell protection** – Client disables + at max; server re-checks on submit and returns a clear error if inventory changed.

## Google Sheet setup

Use one Google Sheet with two tabs.

### 1. Inventory tab

**Tab name:** `Inventory`

| Column        | Description        |
|---------------|--------------------|
| cut_id        | Unique ID (e.g. 101, 102) |
| cut_name      | Display name (e.g. Ribeye Steak) |
| category      | e.g. Steak, Roast, Ground |
| available_qty | Number available |
| unit          | e.g. lbs, each |
| price         | (optional) |
| status        | (optional) |

First row must be the header row with these exact column names.

### 2. Active Orders tab

**Tab name:** `Active Orders`

| Column        | Description        |
|---------------|--------------------|
| order_id      | e.g. ORD-1234567890 |
| created_at    | ISO timestamp |
| customer_name | |
| phone         | |
| email         | |
| cut_id        | |
| cut_name      | |
| qty           | |
| unit          | |
| order_status  | e.g. pending |
| pickup_date   | (optional) YYYY-MM-DD |
| pickup_time_slot | (optional) e.g. 9:00 AM – 10:00 AM |

One row per line item (multiple rows per order when multiple cuts).

## How to get Google Sheet ID, Service Account, and Private Key

### 1. Get the Google Sheet ID

1. Open your Google Sheet in the browser.
2. Look at the URL in the address bar. It looks like:
   ```text
   https://docs.google.com/spreadsheets/d/1ABC123xyz...longId.../edit
   ```
3. The **Sheet ID** is the long string between `/d/` and `/edit`. Copy that entire string (letters, numbers, hyphens).
   - Example: if the URL is `https://docs.google.com/spreadsheets/d/1a2B3c4D5e6F7g8H9i0J/edit`, the Sheet ID is `1a2B3c4D5e6F7g8H9i0J`.
4. Use this as **GOOGLE_SHEET_ID** in your env vars.

---

### 2. Create a Google Cloud project and service account

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project:
   - Click the project dropdown at the top → **New Project** (e.g. name it “Beef Order”) → **Create**.
   - Or select an existing project.
3. Enable the Google Sheets API:
   - In the left menu go to **APIs & Services** → **Library**.
   - Search for **Google Sheets API** → open it → **Enable**.
4. Create a service account:
   - Go to **APIs & Services** → **Credentials**.
   - Click **+ Create Credentials** → **Service account**.
   - Give it a name (e.g. “Beef Order App”) → **Create and Continue** → you can skip optional steps → **Done**.
5. Create a key for the service account:
   - On the Credentials page, under **Service Accounts**, click the service account you just created.
   - Open the **Keys** tab → **Add Key** → **Create new key**.
   - Choose **JSON** → **Create**. A JSON file will download.

---

### 3. Get the Service Account Email and Private Key from the JSON

1. Open the downloaded JSON file in a text editor.
2. Find these values:
   - **GOOGLE_SERVICE_ACCOUNT_EMAIL** = the `client_email` value. It looks like:
     `beef-order-app@your-project-123456.iam.gserviceaccount.com`
   - **GOOGLE_PRIVATE_KEY** = the `private_key` value. It’s a long string that starts with `-----BEGIN PRIVATE KEY-----` and ends with `-----END PRIVATE KEY-----`.
3. For **GOOGLE_PRIVATE_KEY** in `.env` or Netlify:
   - Paste the entire key as one line, including the `-----BEGIN...` and `...END PRIVATE KEY-----` lines.
   - Keep the `\n` characters inside the key as-is (the app will turn `\\n` into real newlines if needed). In Netlify you paste the key as one line; in a `.env` file you can use quotes around the value.

---

### 4. Share the Google Sheet with the service account

1. Open your Google Sheet.
2. Click **Share**.
3. In “Add people and groups”, paste the **service account email** (the `client_email` from the JSON).
4. Set permission to **Editor**.
5. Uncheck “Notify people” if you don’t want an email sent.
6. Click **Share**.

Without this step, the app will get “permission denied” when reading or writing the sheet.

---

## Environment variables

Copy `.env.local.example` to `.env.local` (for local dev) or add in Netlify **Site settings → Environment variables**:

| Variable | Where it comes from |
|----------|----------------------|
| **GOOGLE_SHEET_ID** | The long ID in your sheet URL (step 1 above). |
| **GOOGLE_SERVICE_ACCOUNT_EMAIL** | `client_email` in the service account JSON (step 3). |
| **GOOGLE_PRIVATE_KEY** | `private_key` in the service account JSON (step 3). |

**Important:** Share the Google Sheet with the service account email with **Editor** access (step 4) so the app can read and update both tabs.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy on Netlify

1. **Push your code to Git**  
   Put the project on GitHub, GitLab, or Bitbucket (e.g. create a repo and push).

2. **Log in to Netlify**  
   Go to [netlify.com](https://www.netlify.com) and sign in (GitHub/GitLab/Bitbucket).

3. **Add a new site**  
   Click **Add new site → Import an existing project**, choose your Git provider, and select the repo that contains this app.

4. **Build settings** (Netlify usually detects these; confirm or set):
   - **Build command:** `npm run build`
   - **Publish directory:** leave as-is (Next.js runtime sets this)
   - **Base directory:** leave blank unless the app lives in a subfolder

5. **Environment variables**  
   In **Site settings → Environment variables**, add the same vars you use locally (so the app can talk to Google Sheets in production):
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`  
   (If these are missing, the app will run in mock/demo mode with dummy data.)

6. **Deploy**  
   Click **Deploy site**. Netlify will run `npm run build` and deploy the Next.js app. Your live URL will be something like `https://your-site-name.netlify.app`.

7. **Optional: custom domain**  
   In **Domain management** you can add a custom domain and HTTPS is automatic.

## API

- **GET /api/inventory** – Returns all inventory rows. 503 if the sheet is unavailable.
- **POST /api/order** – Body: `{ customer_name, phone, email?, items: [{ cut_id, qty }] }`. Validates, writes to Active Orders, decrements inventory. 201 on success, 400 for invalid input or empty items, 409 if any item exceeds current inventory.
- **POST /api/order/preview** – Body: `{ items: [{ cut_id, qty }] }`. Returns `{ valid, conflicts }` against current inventory (optional).

## Notes

- No database: Google Sheets is the only persistence for MVP.
- No user accounts or payment.
- If a write to one tab fails after the other succeeds, the app returns 500; you may need to reconcile the sheet manually (no cross-tab transaction).
