# QURC — QUR Coin Project

> **QUR Coin (QURC)** is a community-driven TRC20 token built on the Tron blockchain. This repository contains the complete infrastructure stack powering the QUR Coin web presence: a countdown landing page, a Telegram MiniApp for community engagement, and a WordPress site with SSL configuration.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Repository Structure](#repository-structure)
- [Components](#components)
  - [Simple Timer (Landing Page)](#simple-timer-landing-page)
  - [Telegram MiniApp](#telegram-miniapp)
  - [WordPress Site](#wordpress-site)
  - [FTP Server](#ftp-server)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Security](#security)
- [License](#license)

---

## Project Overview

| Property       | Value                                   |
|----------------|-----------------------------------------|
| **Token Name** | QUR Coin                                |
| **Ticker**     | QURC                                    |
| **Blockchain** | Tron (TRC20)                            |
| **Website**    | [qurcoin.io](https://qurcoin.io)        |

The project stack consists of:

- A **countdown / landing page** (React + Vite + TypeScript) served over HTTPS
- A **Telegram MiniApp** (Node.js + PostgreSQL) for community airdrop engagement
- A **WordPress** instance (Docker) for the main website
- An **FTP server** for file management

---

## Repository Structure

```
QURC/
├── simple-timer/           # React countdown landing page
│   ├── src/
│   │   └── App.tsx
│   ├── index.html
│   ├── server.cjs          # HTTPS server to serve the built app
│   ├── certificates/       # SSL certificates (not committed)
│   └── package.json
│
├── tg-miniapp/             # Telegram MiniApp
│   ├── www/
│   │   ├── server.js       # Express API server
│   │   ├── index.html      # Frontend interface
│   │   ├── .env.example    # Environment variable template
│   │   └── package.json
│   ├── count_registered_users.py
│   └── db_credentials.md   # Credential reference (no real secrets)
│
├── certificates/           # Apache SSL configuration for WordPress
├── certificates-test/      # Apache SSL configuration for test environment
├── docker-compose.yml      # WordPress + MySQL stack
├── ftp_setup.md            # FTP server setup guide
└── Wordpress_README.md     # WordPress SSL & permissions guide
```

---

## Components

### Simple Timer (Landing Page)

A React + TypeScript countdown page served via a Node.js HTTPS server using Cloudflare-proxied SSL.

**Tech stack:** React 18, Vite, TypeScript, Tailwind CSS, Express

**Development:**
```bash
cd simple-timer
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build → dist/
```

**Production (HTTPS):**
```bash
# Place SSL certificates in simple-timer/certificates/
# privkey.pem and fullchain.pem
node server.cjs      # Serves on :443 (HTTPS) and :80 (HTTP)
```

---

### Telegram MiniApp

A Telegram Web App that lets community members earn airdrop points by:

- Following social media accounts (Instagram, Telegram channel, X/Twitter) — **+10 points each**
- Watching the introductory video — **+10 points**
- Opening the app every 4 hours — **+10 points per interval**

**Tech stack:** Node.js, Express, PostgreSQL (Aiven), Telegram Web App SDK

**Setup:**
```bash
cd tg-miniapp/www
npm install
cp .env.example .env
# Fill in your credentials in .env
npm start            # Starts server on port 8443
```

**API Endpoints:**

| Method | Endpoint             | Description                          |
|--------|----------------------|--------------------------------------|
| POST   | `/login`             | Register or update user login        |
| GET    | `/status`            | Get user points and task status      |
| POST   | `/verify/instagram`  | Mark Instagram follow as completed   |
| POST   | `/verify/telegram`   | Mark Telegram join as completed      |
| POST   | `/verify/twitter`    | Mark X/Twitter follow as completed   |
| POST   | `/watch-video`       | Mark introductory video as watched   |
| POST   | `/calculate-points`  | Calculate and update earned points   |
| GET    | `/db-test`           | Database connectivity check          |

**Database Schema:**
```sql
CREATE TABLE users (
    telegram_id          BIGINT PRIMARY KEY,
    points               INTEGER DEFAULT 0,
    last_login           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_points_earned   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    following_instagram  BOOLEAN DEFAULT false,
    following_telegram   BOOLEAN DEFAULT false,
    following_twitter    BOOLEAN DEFAULT false,
    watched_video        BOOLEAN DEFAULT false,
    completed_tasks      BOOLEAN DEFAULT false,
    points_instagram     BOOLEAN DEFAULT false,
    points_telegram      BOOLEAN DEFAULT false,
    points_twitter       BOOLEAN DEFAULT false
);
```

---

### WordPress Site

The main website runs in Docker via `docker-compose.yml`.

**Start:**
```bash
# Create a .env file with the required variables (see Environment Variables below)
docker compose up -d
```

**SSL setup (after first start):**
```bash
docker exec QUR_Coin_Wordpress a2enmod ssl headers rewrite
docker exec QUR_Coin_Wordpress a2ensite default-ssl
docker exec QUR_Coin_Wordpress service apache2 restart
```

See [`Wordpress_README.md`](Wordpress_README.md) for the full SSL and permissions guide.

---

### FTP Server

A vsftpd-based FTP server for managing WordPress files. See [`ftp_setup.md`](ftp_setup.md) for the complete setup guide including installation, user management, firewall rules, and troubleshooting.

---

## Environment Variables

### WordPress (`docker-compose.yml`)

Create a `.env` file alongside `docker-compose.yml`:

```env
WORDPRESS_DB_HOST=<your_db_host>:<port>
WORDPRESS_DB_USER=<your_db_user>
WORDPRESS_DB_PASSWORD=<your_db_password>
WORDPRESS_DB_NAME=defaultdb
```

### Telegram MiniApp (`tg-miniapp/www/.env`)

```env
BOT_TOKEN=<your_telegram_bot_token>
DB_HOST=<your_db_host>
DB_PORT=5432
DB_NAME=defaultdb
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
SERVER_HOST=0.0.0.0
```

A template is provided at [`tg-miniapp/www/.env.example`](tg-miniapp/www/.env.example).

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** and **Docker Compose**
- **PostgreSQL** database (e.g., Aiven)
- SSL certificates (`fullchain.pem` and `privkey.pem`)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/ali-rajabpour/QURC.git
   cd QURC
   ```

2. **Set up environment variables** for each component (see [Environment Variables](#environment-variables))

3. **Start WordPress**
   ```bash
   docker compose up -d
   ```

4. **Start the landing page**
   ```bash
   cd simple-timer && npm install && npm run build && node server.cjs
   ```

5. **Start the Telegram MiniApp**
   ```bash
   cd tg-miniapp/www && npm install && npm start
   ```

---

## Security

- **Never commit real credentials.** All secrets must be stored in `.env` files, which are listed in `.gitignore`.
- **Never commit SSL certificates or private keys.** Certificate files (`*.pem`, `*.key`, `*.crt`) are excluded from version control via `.gitignore`. Provide them out-of-band on your server.
- The Telegram MiniApp validates `initData` using HMAC-SHA256 against the bot token. Ensure `BOT_TOKEN` is set and never exposed.
- Review the hash verification logic in `tg-miniapp/www/server.js` before deploying to production — the bypass log warning is for development only.
- The `/db-test` endpoint exposes database connection metadata; restrict or remove it in production environments.

---

## License

This project is licensed under the [MIT License](LICENSE).

