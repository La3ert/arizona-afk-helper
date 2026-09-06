# 🚀 AFK Helper Dashboard

A modern, real-time web dashboard designed for SA-MP (Arizona RP) players to remotely monitor their in-game AFK sessions, earnings, and account stability.

## 📝 About the Project

Leaving a character AFK to earn PayDay rewards is a core mechanic for many players. AFK Helper solves the problem of "blind" AFK sessions. Instead of keeping the game window open or worrying about server kicks, players can link their game client to this web dashboard. This allows them to manage their sessions, track analytics, and communicate in-game from any device, anywhere.

## ✨ Key Features

* **Comprehensive PayDay Analytics:** View your session statistics through three distinct interfaces: quick-glance stat cards, interactive donut charts (`recharts`), and a detailed breakdown table.
* **Two-Way Live Chat:** Not only read the in-game chat directly from the browser, but also send messages and commands back into the game in real-time.
* **Status Monitoring:** Instant tracking of the player's online status to ensure the character hasn't been disconnected.

## 🛠️ Technical Stack

Built with a modern frontend ecosystem and custom game-client integration:

* **Frontend:** React 19 (SPA routing via `react-router-dom`), Vite 8.
* **Styling:** SCSS with a custom fluid responsive design (REM scaling based on root font-size) and mobile-first architectural decisions (`100dvh`, GPU-accelerated sidebars).
* **Data Visualization:** `recharts` for dynamic, responsive charts.
* **Infrastructure:** Docker Compose for containerized environment setup.
* **Integration:** A custom `.lua` script runs inside the game client, using WebSockets (`socket.io`) to stream real-time state updates to the Node.js backend.

---

## 🎮 How to Use (For Players)

*Note: The project is currently in active development. Once fully deployed, the usage flow will be as follows:*

1. Open the AFK Helper web application.
2. Download the provided `.lua` script and place it in your game's `moonloader` folder.
3. Generate a connection key on the dashboard and enter it in-game via the `/afkhelper` command.
4. Your session is now synced securely!

---

## 💻 Developer Setup

If you want to run the project locally for development or review:

### Prerequisites
* Node.js (v18.11 or higher / tested on v24.14.0)
* npm or yarn
* Docker (Optional, for containerized run)

### Installation

1. **Clone the repository:** `git clone https://github.com/La3ert/arizona-afk-helper.git`
2. **Install dependencies:** `npm install` (run this command in **both** the `frontend` and `backend` folders).
3. **Start the backend server:** Open a terminal in the `backend` folder and run `node server.js`.
4. **Start the frontend app:** Open a new terminal in the `frontend` folder and run `npm run dev`.

## 🗺️ Roadmap

- [ ] **Secure Auth System (Cross-Device Sync):** Currently, the WebSocket backend broadcasts data globally. The top priority is implementing a Key Generation logic to securely isolate and link specific game sessions with the web UI.
- [ ] **Persistence:** Add `localStorage` support to save user session state.
- [ ] **Localization:** Add multi-language support (i18n).

---
*Created by Serhii Zakharov - [Telegram: @La3ert](https://t.me/La3ert)*