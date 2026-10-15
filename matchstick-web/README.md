# Matchstick Game: Beat the AI (Web Edition)

A complete, responsive, single-page web game built with **pure HTML5, CSS3, and Vanilla JavaScript** (Zero frameworks, zero build tools, zero external dependencies). Designed for a Data Structures & Algorithms (DSA) case study on **Combinatorial Game Theory and Misère Nim**.

---

## 1. 5-Line Explanation of the Winning Strategy

1. Under misère rules, the terminal losing position is `1` stick left (the player whose turn it is must take it and loses).
2. Any pile size where `n % 5 === 1` (specifically `1, 6, 11, 16, 21`) is a **losing position (P-position)** for whoever has to move.
3. Whenever the human takes `x` sticks from a losing pile, the computer counters by taking `5 - x` sticks.
4. Because `x + (5 - x) = 5`, the pile strictly drops: `21 -> 16 -> 11 -> 6 -> 1`, forcing the human to take the final stick.
5. In general, the computer plays `(remaining - 1) % 5`; if already in a losing position (`0`), it plays randomly waiting for human error.

---

## 2. How to Open and Run Locally

No compilation, Node.js, or build tools are required!

### Option A: Double-Click
Simply double-click `index.html` in your file explorer to open it directly in Google Chrome, Microsoft Edge, Firefox, or Safari.

### Option B: Local Web Server (Python)
If you prefer running via a local server:
```bash
# In the matchstick-web/ directory:
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

---

## 3. How to Host for Free on GitHub Pages

1. **Create a new repository** on GitHub (e.g. `matchstick-game`).
2. **Push the `matchstick-web` files** to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Matchstick Game web app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** $\to$ **Pages** (under "Code and automation").
   - Under **Build and deployment** $\to$ **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`, then click **Save**.
4. In 1–2 minutes, your website is live at:
   `https://<your-username>.github.io/<your-repo-name>/`!

---

## 4. Features & Architecture

- **Game Board:** 21 realistic CSS-rendered wooden matchsticks with red phosphorus heads and glowing animations.
- **Dynamic Physics:** Smooth removal animation as sticks drop/fade away.
- **AI Modes:**
  - **Hard Mode:** Perfect mathematical winning strategy using $(n - 1) \pmod 5$.
  - **Easy Mode:** Random legal moves, allowing the human to win.
- **Web Audio API:** Self-contained synthesized audio (wood clicks, AI chimes, victory fanfare, defeat tones) with mute toggle.
- **Strategic Hint System:** Analyzes the current pile and explains the mathematically optimal move.
- **Scoreboard:** Tracks human vs computer wins across rematches and browser reloads via `localStorage`.
- **Responsive & Accessible:** Dark / Light theme support, fluid layouts down to 380px mobile phones, keyboard controls (`1`, `2`, `3`, `4`), and screen-reader accessible status alerts.
