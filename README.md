# Pizza Express Frontend 🍕

![Pizza Express Hero](./pizza-express-hero.png)

> **🚀 Backend Required**: This is the frontend client. To run the full application, you must also run the **[Pizza Express Backend](https://github.com/JFranciosi/pizza-express-backend)** (Quarkus/Java).

**Pizza Express** is a high-performance, real-time multiplayer crash game. Players bet on a flying pizza scooter 🛵, aiming to cash out before it crashes. The frontend is engineered for speed, responsiveness, and visual smoothness using the latest Angular technologies.

---

## Key Features

### Gameplay Experience
- **Real-Time Multiplayer**: Live synchronization of bets, cashouts, and crash events via WebSockets.
- **Smooth Animations**: 60FPS multiplier curve rendering using the **HTML5 Canvas API** (2D Context) with custom Cubic Bézier pathing.
- **Dynamic Controls**: 
  - Single-button flow: **BET**➡️ **CANCEL** (during countdown) ➡️ **CASHOUT** (during flight).
  - Keyboard shortcuts (Space/Enter) for quick actions.
- **Live Feed**: Real-time ticker of other players' bets and winnings.

### Security & Fairness
- **Provably Fair**: Client-side verification tools allowing players to check the integrity of every round (SHA-256 hashes and seeds).
- **JWT Authentication**: Secure Login and Register flows with automatic token refresh mechanisms.
- **Route Guards**: Protected routes for authenticated user sessions.

### UI/UX Design
- **Modern Interface**: Glassmorphism aesthetic with dark mode optimization.
- **Responsive Design**: Fully fluid layout adaptable to desktop and mobile viewports.
- **Audio Feedback**: Context-aware sound effects (Takeoff, Crash, Win, Tick) managed by a dedicated `SoundService`.

---

## Technology Stack

This project is built on the bleeding edge of the Angular ecosystem:

- **Framework**: [Angular v20](https://angular.io/)
- **Architecture**: 
  - **Standalone Components**: No NgModules, reducing boilerplate.
  - **Signals**: Used extensively for reactive state management (`signal`, `computed`, `effect`) ensuring fine-grained reactivity.
  - **RxJS**: For complex asynchronous event streams (WebSocket handling).
- **UI Component Library**: [PrimeNG v21](https://primeng.org/) (Aura Theme).
- **Styling**: CSS3 with Flexbox/Grid and custom variables.
- **Rendering**: Native HTML5 `<canvas>` for the game loop (zero DOM overhead for the multiplier curve).
- **Testing**: Jasmine & Karma.

---

## Architecture Highlights

### 1. Signal-Based State Management
Unlike traditional Angular apps relying heavily on `BehaviorSubjects`, this project leverages **Angular Signals** for the game state. The `GameSocketService` exposes read-only signals (`gameState`, `multiplier`, `bets`) that components like `Home` consume directly or via `effect()`. This minimizes change detection cycles and improves performance during rapid updates.

### 2. High-Performance Game Loop
The flight curve is drawn independently of Angular's change detection. The `Home` component maintains a `requestAnimationFrame` loop that interacts directly with the Canvas 2D context. It calculates the flight path using a specialized **Cubic Bézier** function to visualize the multiplier growth smoothly.

### 3. WebSocket Integration
The app maintains a persistent WebSocket connection via `GameSocketService`. It handles:
- Automatic reconnection strategies.
- Parsing of optimized distinct message types (`BET`, `CRASH`, `STATE`, `TICK`).
- Drift correction: Syncing the local animation timer with server timestamps to prevent lag.

---

## Getting Started

### Prerequisites
- **Node.js**: v18 or higher.
- **npm**: v9 or higher.
- **Angular CLI**: v20 (`npm install -g @angular/cli`).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/pizza-express-frontend.git
   cd pizza-express-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**: 
   Check `src/environments/environment.ts`. Ensure the `apiUrl` and `wsUrl` point to your local or remote backend.
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8080',
     wsUrl: 'ws://localhost:8080/game'
   };
   ```

4. **Run the application**:
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200`.

## Project Structure

```plaintext
src/app/
├── components/          # Reusable UI widgets (Standalone)
│   ├── bet-controls/    # Betting button and input logic
│   ├── crash-history/   # Past rounds bubbles
│   ├── player-bets/     # Live betting sidebar
│   ├── top-bar/         # Navigation and user stats
│   └── ...
├── pages/               # Main Route Components
│   ├── home/            # Game Canvas and main layout
│   ├── login/           # Authentication pages
│   └── ...
├── services/            # Global Business Logic
│   ├── auth.service.ts       # JWT and User Session handling
│   ├── game-socket.service.ts # WebSocket & Signals State Store
│   ├── sound.service.ts      # Audio asset management
│   └── fairness.service.ts   # Modal triggers for verification
├── guards/              # Router protection
└── interceptors/        # HTTP Token injection
```

## Testing
Unit tests are configured with Karma and Jasmine.

```bash
# Run unit tests
ng test

# Run tests in CI mode (headless)
ng test --no-watch --no-progress --browsers=ChromeHeadless
```

## 📦 Build for Production
To create an optimized build for deployment (e.g., Netlify, Vercel, Azure Static Web Apps):

```bash
npm run build
```
The output artifacts will be stored in the `dist/pizza-express-frontend` directory.