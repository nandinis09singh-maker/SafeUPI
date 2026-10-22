# SafeUPI — AI-Powered UPI Scam & Fraud Detector

A production-grade, full-stack fintech security platform designed to protect Indian citizens and digital payment users against UPI fraud, deceptive "scan-to-receive" collect request traps, phishing domains, and social engineering scams.

![SafeUPI Architecture](https://img.shields.io/badge/SafeUPI-Fintech%20Security-0066FF?style=for-the-badge&logo=shield)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-6DB33F?style=for-the-badge&logo=springboot)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)
![Java](https://img.shields.io/badge/Java-17%20LTS-ED8B00?style=for-the-badge&logo=openjdk)

---

## 🛡️ Core Features

1. **Camera QR Code Scanner:**
   - Real-time live camera scanning using device webcam/mobile cameras.
   - Upload QR screenshot/image scanning fallback.
   - Parses official NPCI UPI payload formats (`upi://pay?pa=...&pn=...&am=...&tn=...`).
   - Manual payload input with pre-configured scam presets.

2. **SMS & WhatsApp Scam Checker:**
   - Detects the **#1 Indian UPI scam** ("Enter your UPI PIN to receive money").
   - Flags fake electricity disconnection threats ("Power cut at 9:30 PM").
   - Identifies remote screen-sharing coercion (AnyDesk, QuickSupport, TeamViewer).
   - Evaluates official transactional SMS headers vs. personal mobile numbers.

3. **Phishing & Malicious Link Inspector:**
   - Analyzes URLs without executing scripts or opening links.
   - Detects brand typosquatting (e.g., `sbi-kyc-pan-update.top`).
   - Identifies raw IP addresses, direct APK downloads, and URL shorteners.

4. **Deterministic Weighted Rules Engine:**
   - Returns a **Rule Weight Score (0–100)**, Risk Level (**LOW / MEDIUM / HIGH**), plain-language explanation, and actionable safety checklists.
   - Explicitly presented as an indicator-based rule evaluation, not a statistically calibrated fraud probability.

5. **Multilingual Voice Warnings (Browser Text-to-Speech):**
   - Reads loud spoken security warnings in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** using `window.speechSynthesis`.

6. **Scan History & Audit Log:**
   - Persists all past evaluations to MySQL database with full indicator breakdowns.
   - Filter by scan type (QR, Message, Link) and risk level.
   - One-click inspection modal and history clearing.

7. **Trusted Contacts & Emergency Broadcast:**
   - Add emergency family contacts (parents, spouse, siblings).
   - One-tap warning broadcast via `navigator.share` or WhatsApp to protect vulnerable family members.

8. **Community Scam Registry:**
   - File reports against fraudulent UPI IDs, phishing sites, and extortion messages.
   - Newly reported VPAs are dynamically added to active detection indicators.

---

## 🏗️ Architecture & Technology Stack

```
 safe-upi/
 ├── backend/                    # Spring Boot 3.2.5 Java REST API
 │   ├── src/main/java/com/safeupi/
 │   │   ├── config/             # SecurityConfig (BCrypt), JwtAuthFilter, JwtService
 │   │   ├── controller/         # Auth, Analysis, History, Contacts, Reports
 │   │   ├── dto/                # Request & Response Data Transfer Objects
 │   │   ├── model/              # JPA Entities (User, ScanHistory, TrustedContact, etc.)
 │   │   ├── repository/         # Spring Data JPA Repositories
 │   │   ├── service/            # Core business logic
 │   │   │   └── engine/         # QrRuleEvaluator, MessageRuleEvaluator, LinkRuleEvaluator
 │   │   └── SafeUpiApplication.java
 │   ├── src/main/resources/
 │   │   ├── application.properties
 │   │   ├── application-mysql.properties   # MySQL database settings
 │   │   ├── application-local.properties   # Embedded fallback profile
 │   │   ├── schema.sql                     # Full MySQL schema
 │   │   └── data.sql                       # Seed data & known indicators
 │   ├── pom.xml
 │   └── start-backend.bat       # One-click Windows runner
 │
 └── frontend/                   # React.js 18 + Vite SPA
     ├── src/
     │   ├── components/         # Navbar, Sidebar, RiskCard, VoiceReader
     │   ├── context/            # AuthContext, LanguageContext
     │   ├── services/           # api.js REST client with offline fallback
     │   ├── views/              # Dashboard, QrScanner, MessageChecker, LinkChecker,
     │   │                       # History, TrustedContacts, ScamReports, Settings, AuthModal
     │   ├── App.jsx
     │   ├── main.jsx
     │   └── index.css           # Premium fintech styling (Navy / Neon Blue)
     ├── index.html
     ├── package.json
     ├── vite.config.js
     └── start-frontend.bat      # One-click Windows runner
```

---

## ⚡ Quick Start (Windows)

### Prerequisites

- **Node.js** (v18+ or v24+ installed)
- **Java JDK 17+** (Microsoft OpenJDK 17 configured in `C:\Users\rajveer singh\Documents\tools\jdk-17.0.10+7` or standard PATH)
- **Apache Maven 3.9+** (Configured in `C:\Users\rajveer singh\Documents\tools\apache-maven-3.9.6\bin` or standard PATH)
- **MySQL 8.0+** (Optional: the backend automatically uses an embedded MySQL-compatible database if a live MySQL server is not currently running)

---

### Step 1: Start MySQL (Optional Production Database)

If MySQL is installed locally:

```powershell
# In PowerShell or Windows CMD
mysql -u root -p

# Inside MySQL prompt:
CREATE DATABASE IF NOT EXISTS safe_upi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

To configure database credentials via environment variables:

```powershell
$env:SPRING_PROFILES_ACTIVE = "mysql"
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/safe_upi?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME = "root"
$env:SPRING_DATASOURCE_PASSWORD = "your_mysql_password"
```

*(Note: If `$env:SPRING_PROFILES_ACTIVE` is not set, SafeUPI defaults to the built-in persistent local database, ensuring 100% immediate out-of-the-box operation.)*

---

### Step 2: Start Spring Boot Backend

Open a terminal or double-click `safe-upi\backend\start-backend.bat`:

```powershell
cd "safe-upi\backend"
.\start-backend.bat
```

Or manually:

```powershell
$env:JAVA_HOME = "C:\Users\rajveer singh\Documents\tools\jdk-17.0.10+7"
$env:Path = "C:\Users\rajveer singh\Documents\tools\jdk-17.0.10+7\bin;C:\Users\rajveer singh\Documents\tools\apache-maven-3.9.6\bin;" + $env:Path
cd "safe-upi\backend"
mvn spring-boot:run
```

The Spring Boot backend will start at **`http://localhost:8080`**.

---

### Step 3: Start React Frontend

Open a second terminal or double-click `safe-upi\frontend\start-frontend.bat`:

```powershell
cd "safe-upi\frontend"
cmd.exe /c "npm run dev"
```

The Vite dev server will start at **`http://localhost:5173`**. Open this URL in your web browser.

---

## 🔑 Preloaded Demo Credentials

For quick testing without creating a new account:
- **Username:** `demo`
- **Password:** `SafeUPI@123`

*(You can also click **"Use Pre-loaded Demo Account"** inside the Sign In modal).*

---

## 📷 Testing the QR Code Scanner

1. Navigate to the **Scan QR** tab.
2. Select **Live Camera Scan** and click **Start Camera Scanner**.
3. Allow the browser camera permission when prompted.
4. Point your camera at any real UPI QR code on your phone, invoice, or printed merchant placard.
5. **Alternative Test via Image Upload:**
   - Switch to **Upload QR Image** and select any screenshot or picture of a QR code.
6. **Alternative Test via Preset Scenarios:**
   - Switch to **Manual Input / Scenarios**.
   - Click **Electricity Refund Scam** (`upi://pay?pa=refund-desk-8899@paytm&pn=Electricity%20Department&am=4500&cu=INR&tn=Scan%20to%20receive%20refund`).
   - Notice the **HIGH RISK (95/100)** verdict with the alert: *"In UPI, scanning a QR code ALWAYS sends money out of your account, NEVER receives it!"*
   - Click **Read Voice Warning** to hear the spoken alert in English, Hindi, or Marathi!

---

## ⚖️ Rules Engine Heuristics & Scoring

| Scam Indicator | Trigger Condition | Severity | Weight |
|---|---|---|---|
| `RECEIVE_MONEY_DECEPTION` | QR/note claims scanning will receive/credit funds | HIGH | +50 |
| `UPI_PIN_SCAM` | Text claims entering UPI PIN is required to get refund | HIGH | +50 |
| `IMPERSONATION_MISMATCH` | Official name (e.g. SBI) paired with personal VPA | HIGH | +45 |
| `COLLECT_REQUEST_TRAP` | Prompting user to approve collect request for refund | HIGH | +45 |
| `ELECTRICITY_SCAM` | Urgent threat of power cut tonight unless number called | HIGH | +40 |
| `OTP_THEFT` | Soliciting 6-digit OTP or SMS forwarding | HIGH | +45 |
| `REMOTE_ACCESS_APP` | Demanding AnyDesk / QuickSupport installation | HIGH | +45 |
| `BRAND_IMPERSONATION` | Domain contains bank name without official host | HIGH | +50 |
| `RAW_IP_URL` | Numerical IP address used as payment URL host | HIGH | +45 |
| `MALICIOUS_APK` | Direct link to download an unofficial Android `.apk` | HIGH | +50 |
| `SUSPICIOUS_TLD` | Financial lures hosted on cheap `.top`, `.xyz`, etc. | MEDIUM | +25 |

---

## 🔒 SafeUPI Ethical & Privacy Principles

- SafeUPI **never** asks for, receives, or stores your UPI PIN or banking passwords.
- SafeUPI **never** initiates or routes payment transactions.
- SafeUPI **never** claims to inspect background activity of other banking apps.
- The risk score is an indicator-based rule evaluation designed for awareness and education.
