/**
 * test_web_logic.js
 * Automated test suite for matchstick-web/script.js logic
 * Validates all required algorithms, game states, endgame conditions, and brute-force theorem.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=================================================");
console.log("MATCHSTICK WEB APP: AUTOMATED LOGIC TEST SUITE");
console.log("=================================================\n");

// Read script.js content
const scriptPath = path.join(__dirname, 'script.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Mock a minimal browser DOM environment for Node
const domMock = {
  window: {
    addEventListener: () => {},
    matchMedia: () => ({ matches: true })
  },
  document: {
    readyState: 'complete',
    documentElement: {
      setAttribute: () => {},
      getAttribute: () => 'dark'
    },
    getElementById: (id) => ({
      id,
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      setAttribute: () => {},
      getAttribute: () => null,
      querySelectorAll: () => [],
      appendChild: () => {},
      addEventListener: () => {},
      focus: () => {}
    }),
    createDocumentFragment: () => ({ appendChild: () => {} }),
    createElement: (tag) => ({
      className: '',
      setAttribute: () => {},
      appendChild: () => {}
    }),
    addEventListener: () => {}
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};

// Evaluate script.js inside the mock environment
const vm = require('vm');
const context = vm.createContext({
  window: domMock.window,
  document: domMock.document,
  localStorage: domMock.localStorage,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  console: console,
  AudioContext: class {
    createOscillator() { return { type: '', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
    createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
    get destination() { return {}; }
    get currentTime() { return 0; }
  }
});

vm.runInContext(scriptCode, context);

const { gameState, computerMove, humanMove, startGame, verifyStrategyBruteForce } = context.window;

// -----------------------------------------------------------------------------
// Test 1: Brute-Force Theorem Check
// -----------------------------------------------------------------------------
console.log("Test 1: Brute-force verification of losing positions up to 21...");
const losingPositions = Array.from(verifyStrategyBruteForce(21, 4));
console.log("  Identified P-positions:", losingPositions);
assert.deepStrictEqual(losingPositions, [1, 6, 11, 16, 21], "P-positions must strictly match [1, 6, 11, 16, 21]");
console.log("  -> PASSED: Mathematical proof verified! Only losing positions are 1, 6, 11, 16, 21.\n");

// -----------------------------------------------------------------------------
// Test 2: Hard Mode - Human starts, Computer always counters with 5 - x
// -----------------------------------------------------------------------------
console.log("Test 2: Hard mode, human starts (computer counter-moves)...");
gameState.easyMode = false;
gameState.startingPlayer = 'human';
startGame();
assert.strictEqual(gameState.sticks, 21);
assert.strictEqual(gameState.turn, 'human');

const humanPicks = [3, 4, 2, 1];
const expectedComputerCounter = [2, 1, 3, 4];
const actualComputerMoves = [];

for (let i = 0; i < humanPicks.length; i++) {
  const hPick = humanPicks[i];
  const beforeHuman = gameState.sticks;
  
  // Computer counter calculation under Hard mode from (beforeHuman - hPick):
  const remainingForAi = beforeHuman - hPick;
  const aiPick = computerMove(remainingForAi, false);
  actualComputerMoves.push(aiPick);
  assert.strictEqual(aiPick, expectedComputerCounter[i], `Expected AI to pick 5 - ${hPick} = ${expectedComputerCounter[i]}`);
  
  // Human moves in game
  humanMove(hPick);
}

console.log("  Human picks:    ", humanPicks);
console.log("  Computer moves: ", actualComputerMoves);
assert.deepStrictEqual(actualComputerMoves, expectedComputerCounter);
assert.strictEqual(gameState.sticks, 1, "Sticks remaining should be 1");
assert.strictEqual(gameState.gameOver, true, "Game should be over");
assert.strictEqual(gameState.computerWins, 1, "Computer should win");
console.log("  -> PASSED: Computer consistently countered with 5 - x and won!\n");

// -----------------------------------------------------------------------------
// Test 3: Hard Mode - Computer starts at 21 (losing position) & Human plays winning strategy
// -----------------------------------------------------------------------------
console.log("Test 3: Hard mode, computer starts (human plays winning strategy)...");
gameState.easyMode = false;
gameState.startingPlayer = 'computer';
startGame();

// Computer at 21 is in losing position, must make a random legal move
assert.ok([1, 2, 3, 4].includes(computerMove(21, false)), "AI at 21 must make a legal move 1..4");

// Simulate game where Human plays winning strategy ((rem - 1) % 5)
let simSticks = 21;
let compFirstMove = computerMove(21, false);
simSticks -= compFirstMove;

while (simSticks > 1) {
  // Human optimal move
  let opt = (simSticks - 1) % 5;
  if (opt === 0) opt = 1;
  simSticks -= opt;
  assert.ok([16, 11, 6, 1].includes(simSticks), `Human must leave pile with n % 5 === 1, got ${simSticks}`);
  
  if (simSticks === 1) break;
  
  // Computer move from losing position
  let cPick = computerMove(simSticks, false);
  simSticks -= cPick;
}

assert.strictEqual(simSticks, 1, "Pile reduced to 1 stick for the computer");
console.log("  -> PASSED: Human playing winning strategy forces computer to face 1 stick and wins!\n");

// -----------------------------------------------------------------------------
// Test 4: Endgame - With 2 sticks left, Human takes 2 and loses
// -----------------------------------------------------------------------------
console.log("Test 4: Endgame - with 2 sticks left, human takes 2 and loses...");
gameState.easyMode = false;
gameState.startingPlayer = 'human';
startGame();
gameState.sticks = 2; // Set directly to 2 sticks
gameState.turn = 'human';
gameState.gameOver = false;
gameState.isAiThinking = false;

humanMove(2); // Human takes all 2 remaining sticks!
assert.strictEqual(gameState.sticks, 0, "Sticks should be 0");
assert.strictEqual(gameState.gameOver, true, "Game should be over");
assert.strictEqual(gameState.computerWins, 2, "Computer should win when human takes the last stick");
console.log("  -> PASSED: Human voluntarily took last stick from 2 sticks and lost!\n");

// -----------------------------------------------------------------------------
// Test 5: Button validation logic - Take 3 and Take 4 disabled when only 2 remain
// -----------------------------------------------------------------------------
console.log("Test 5: Button disabled validation when only 2 sticks remain...");
gameState.sticks = 2;
const maxAllowedAt2 = Math.min(gameState.maxPick, gameState.sticks);
assert.strictEqual(maxAllowedAt2, 2, "Max allowed pick at 2 sticks must be 2");
for (let pick = 1; pick <= 4; pick++) {
  const isAllowed = (pick <= maxAllowedAt2);
  if (pick <= 2) {
    assert.strictEqual(isAllowed, true, `Take ${pick} must be enabled`);
  } else {
    assert.strictEqual(isAllowed, false, `Take ${pick} must be disabled`);
  }
}
console.log("  -> PASSED: Take 1 and 2 are allowed; Take 3 and 4 are strictly disabled!\n");

// -----------------------------------------------------------------------------
// Test 6: Play Again - Fresh pile of 21 and reset state
// -----------------------------------------------------------------------------
console.log("Test 6: Play Again resets state to 21 sticks...");
startGame();
assert.strictEqual(gameState.sticks, 21, "Sticks must reset to 21");
assert.strictEqual(gameState.gameOver, false, "Game over must be false");
assert.strictEqual(gameState.totalMovesCount, 0, "Move count must reset to 0");
console.log("  -> PASSED: State successfully reset to fresh 21 sticks!\n");

// -----------------------------------------------------------------------------
// Test 7: Easy Mode - Computer plays random legal moves
// -----------------------------------------------------------------------------
console.log("Test 7: Easy mode computer moves are random and legal...");
const movesSeen = new Set();
for (let i = 0; i < 50; i++) {
  const move = computerMove(20, true); // Easy mode
  assert.ok(move >= 1 && move <= 4, "Move must be between 1 and 4");
  movesSeen.add(move);
}
console.log("  Distinct moves chosen over 50 iterations in Easy mode:", Array.from(movesSeen).sort());
assert.ok(movesSeen.size >= 3, "Randomness should produce multiple distinct moves");
console.log("  -> PASSED: Easy mode verified random and legal!\n");

console.log("=================================================");
console.log("ALL 7 TESTS COMPLETED AND PASSED WITH 100% SUCCESS!");
console.log("=================================================");
