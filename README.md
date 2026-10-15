# Matchstick Game (AI vs Human) in C

A complete, clean, and mathematically optimal console game written in **C (C99 standard)** for a Data Structures and Algorithms (DSA) case study on **Impartial Games and Combinatorial Game Theory (Misère Nim)**.

---

## 1. Game Rules

1. The game starts with **21 matchsticks**.
2. Players alternate turns. On each turn, a player removes **1, 2, 3, or 4 sticks** (never more than the number of sticks remaining).
3. **Misère Rule:** The player who is forced to take the very last stick **loses**.
4. At the start of the game, the player chooses:
   - **Difficulty:** `1 = Easy` (computer plays random legal moves) or `2 = Hard` (computer plays the optimal mathematical winning strategy).
   - **Who starts:** `1 = You` or `2 = Computer`.
5. After each game ends, players are prompted for a rematch (`1 = yes, 0 = no`), preserving the running score across rounds.

---

## 2. 5-Line Explanation of the Winning Strategy

1. Under misère play, the terminal losing position is `1` stick left (the player to move must take it and loses).
2. Any pile size where `n % 5 == 1` (specifically `1, 6, 11, 16, 21`) is a **losing position (P-position)** for whoever has to move.
3. Whenever the human takes `x` sticks from a losing pile, the computer counters by taking `5 - x` sticks.
4. Because `x + (5 - x) = 5`, the pile strictly transitions: `21 -> 16 -> 11 -> 6 -> 1`, forcing the human to face the final stick.
5. In general, the computer plays `(remaining - 1) % 5`; if already in a losing position (`0`), it plays a random move hoping for a human blunder.

---

## 3. How to Compile and Run

### Compilation
Compile with `gcc` (strict C99 flags and all warnings enabled):
```bash
gcc -Wall -Wextra -std=c99 matchstick.c -o matchstick
```

### Running the Game
On Linux / macOS / Windows CMD:
```bash
./matchstick
```
*(On Windows PowerShell: `.\matchstick.exe`)*

---

## 4. Automated Testing and Verification

### Standalone Brute-Force Strategy Verifier (`verify_strategy.c`)
Implements backward induction (minimax game tree evaluation) from base state `n = 1` up to `n = 21` to prove with assertions that the only losing positions are `{1, 6, 11, 16, 21}`.
```bash
gcc -Wall -Wextra -std=c99 verify_strategy.c -o verify_strategy
./verify_strategy
```

### Automated End-to-End Test Suite (`test_matchstick.py`)
Run the Python test harness:
```bash
python test_matchstick.py
```

### Test Coverage Summary:
- **Test 1 (Hard mode, human starts):** Human plays arbitrary moves (`[3, 4, 2, 1]`); computer consistently counters with `5 - x` (`[2, 1, 3, 4]`) and wins.
- **Test 2 (Hard mode, computer starts):** Human plays optimal moves `(rem - 1) % 5` and wins against the computer.
- **Test 3 (Input validation):** Tests non-numeric input (`abc`), floats/decimals (`2.5`), negative numbers (`-2`), out-of-range picks (`0`, `5`), and moves exceeding remaining sticks (`3` when `2` remain). Confirmed friendly errors and no infinite loops.
- **Test 4 (Endgame handling):** Human faces `2` sticks and chooses `2` sticks (takes the last stick), confirming immediate loss.
- **Test 5 (Rematch & scoring):** Verifies a fresh pile of `21` matchsticks upon rematch and tracks running score across rounds.
- **Test 6 (Easy mode):** Confirms computer plays random legal moves and human can win.
- **Test 7 (Game theory theorem):** Formally verifies all P-positions and N-positions up to 21 via backward induction.
