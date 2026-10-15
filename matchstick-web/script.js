/**
 * ============================================================================
 * Matchstick Game: Beat the AI (AI vs Human)
 * Vanilla JavaScript (ES6+ / No Frameworks / Zero Dependencies)
 * 
 * Data Structures & Algorithms Case Study:
 * Combinatorial Game Theory & Misère Nim Optimal Strategy
 * ============================================================================
 * 
 * Game Theory Overview:
 * - Total sticks: 21
 * - Legal move per turn: 1, 2, 3, or 4 sticks (max: remaining)
 * - Misère Rule: The player forced to take the very last stick LOSES.
 * 
 * Winning Mathematical Strategy:
 * - Losing positions (P-positions): n % 5 === 1 => {1, 6, 11, 16, 21}.
 * - In Hard mode, from any N-position, the optimal move is: (remaining - 1) % 5.
 * - When human takes x sticks from a losing pile, computer counters with (5 - x),
 *   maintaining the invariant: 21 -> 16 -> 11 -> 6 -> 1.
 * - In Easy mode, computer chooses randomly among legal moves.
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1. Constants & Configurations
   * -------------------------------------------------------------------------- */
  const TOTAL = 21;
  const MAX_PICK = 4;
  const AI_THINKING_DELAY_MS = 800;

  /* --------------------------------------------------------------------------
   * 2. Centralized Game State Object
   * -------------------------------------------------------------------------- */
  const gameState = {
    sticks: TOTAL,
    totalSticks: TOTAL,
    maxPick: MAX_PICK,
    turn: 'human',        // 'human' | 'computer'
    easyMode: false,      // false = Hard mode (optimal AI), true = Easy mode (random)
    startingPlayer: 'human', // 'human' | 'computer'
    humanWins: 0,
    computerWins: 0,
    totalMovesCount: 0,
    gameOver: false,
    isAiThinking: false,
    pendingTimerId: null,
    moveLog: []
  };

  /* --------------------------------------------------------------------------
   * 3. Web Audio API Sound Synthesizer (Zero external audio files required)
   * -------------------------------------------------------------------------- */
  class SoundManager {
    constructor() {
      this.audioCtx = null;
      this.isMuted = false;
      this.initFromStorage();
    }

    initFromStorage() {
      try {
        const savedMute = localStorage.getItem('matchstick_muted');
        this.isMuted = savedMute === 'true';
      } catch (e) {
        this.isMuted = false;
      }
    }

    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem('matchstick_muted', String(this.isMuted));
      } catch (e) {
        /* Ignore storage errors */
      }
      return this.isMuted;
    }

    /* Soft wooden click when sticks are taken */
    playStickPick(count = 1) {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 260 + count * 40;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }

    /* Subtle electronic chime when AI moves */
    playAiChime() {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    }

    /* Celebratory fanfare when Human wins */
    playWinFanfare() {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.1;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    }

    /* Descending defeat tone when Computer wins */
    playLossTone() {
      if (this.isMuted) return;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  }

  const sound = new SoundManager();

  /* --------------------------------------------------------------------------
   * 4. DOM Elements Cache
   * -------------------------------------------------------------------------- */
  const DOM = {
    // Scoreboard
    humanScore: document.getElementById('humanScore'),
    computerScore: document.getElementById('computerScore'),
    resetScoreBtn: document.getElementById('resetScoreBtn'),

    // Setup options
    diffHardBtn: document.getElementById('diffHardBtn'),
    diffEasyBtn: document.getElementById('diffEasyBtn'),
    startHumanBtn: document.getElementById('startHumanBtn'),
    startAiBtn: document.getElementById('startAiBtn'),
    startGameBtn: document.getElementById('startGameBtn'),

    // Arena & Status
    statusBanner: document.getElementById('statusBanner'),
    statusText: document.getElementById('statusText'),
    statusDot: document.getElementById('statusDot'),
    stickCounter: document.getElementById('stickCounter'),
    sticksField: document.getElementById('sticksField'),
    actionPromptText: document.getElementById('actionPromptText'),

    // Move buttons
    actionButtons: [
      document.getElementById('take1Btn'),
      document.getElementById('take2Btn'),
      document.getElementById('take3Btn'),
      document.getElementById('take4Btn')
    ],

    // Hint
    hintBtn: document.getElementById('hintBtn'),
    hintBox: document.getElementById('hintBox'),
    hintText: document.getElementById('hintText'),
    closeHintBtn: document.getElementById('closeHintBtn'),

    // Move Log
    logStream: document.getElementById('logStream'),
    roundCounter: document.getElementById('roundCounter'),

    // Modal
    gameOverModal: document.getElementById('gameOverModal'),
    modalIcon: document.getElementById('modalIcon'),
    modalTitle: document.getElementById('modalTitle'),
    modalMessage: document.getElementById('modalMessage'),
    modalWinnerName: document.getElementById('modalWinnerName'),
    modalTotalMoves: document.getElementById('modalTotalMoves'),
    playAgainBtn: document.getElementById('playAgainBtn'),

    // Header buttons
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon')
  };

  /* --------------------------------------------------------------------------
   * 5. Storage Helpers
   * -------------------------------------------------------------------------- */
  function loadScoreboard() {
    try {
      const hWins = localStorage.getItem('matchstick_human_wins');
      const cWins = localStorage.getItem('matchstick_computer_wins');
      if (hWins !== null) gameState.humanWins = parseInt(hWins, 10) || 0;
      if (cWins !== null) gameState.computerWins = parseInt(cWins, 10) || 0;
    } catch (e) {
      console.warn('localStorage unavailable, using in-memory score tracking.');
    }
    renderScoreboard();
  }

  function saveScoreboard() {
    try {
      localStorage.setItem('matchstick_human_wins', String(gameState.humanWins));
      localStorage.setItem('matchstick_computer_wins', String(gameState.computerWins));
    } catch (e) {
      /* Ignore storage quota or disabled errors */
    }
    renderScoreboard();
  }

  function renderScoreboard() {
    if (DOM.humanScore) DOM.humanScore.textContent = String(gameState.humanWins);
    if (DOM.computerScore) DOM.computerScore.textContent = String(gameState.computerWins);
  }

  /* --------------------------------------------------------------------------
   * 6. UI Rendering & Animations
   * -------------------------------------------------------------------------- */
  
  /**
   * Renders the visual matchsticks in the sticks field.
   * Updates the big stick counter with pulse animation.
   */
  function renderSticks() {
    if (!DOM.sticksField || !DOM.stickCounter) return;

    // Counter update
    DOM.stickCounter.textContent = String(gameState.sticks);
    DOM.stickCounter.classList.add('updated');
    setTimeout(() => {
      DOM.stickCounter.classList.remove('updated');
    }, 200);

    // Existing sticks in DOM
    const currentDomSticks = Array.from(DOM.sticksField.querySelectorAll('.matchstick'));
    const currentCount = currentDomSticks.length;
    const targetCount = gameState.sticks;

    if (currentCount === targetCount) {
      // Already matching, no update needed
      return;
    }

    if (targetCount === 0) {
      DOM.sticksField.innerHTML = '';
      return;
    }

    // If decreasing: animate removal of the difference from the end
    if (currentCount > targetCount) {
      const removeCount = currentCount - targetCount;
      const sticksToRemove = currentDomSticks.slice(currentCount - removeCount);

      sticksToRemove.forEach((stickEl, index) => {
        // Staggered removal animation
        setTimeout(() => {
          stickEl.classList.add('removing');
          setTimeout(() => {
            if (stickEl.parentNode) {
              stickEl.parentNode.removeChild(stickEl);
            }
          }, 350);
        }, index * 40);
      });
      return;
    }

    // If increasing (e.g. game reset to 21): fresh build
    DOM.sticksField.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < targetCount; i++) {
      const matchstick = document.createElement('div');
      matchstick.className = 'matchstick';
      matchstick.setAttribute('data-index', String(i + 1));
      matchstick.setAttribute('title', `Matchstick #${i + 1}`);

      const head = document.createElement('div');
      head.className = 'match-head';

      const body = document.createElement('div');
      body.className = 'match-body';

      matchstick.appendChild(head);
      matchstick.appendChild(body);
      fragment.appendChild(matchstick);
    }

    DOM.sticksField.appendChild(fragment);
  }

  /**
   * Updates button disabled states based on remaining sticks and turn.
   */
  function updateActionButtons() {
    const isHumanTurn = (gameState.turn === 'human' && !gameState.gameOver && !gameState.isAiThinking);

    DOM.actionButtons.forEach((btn, index) => {
      const pickAmount = index + 1; // 1, 2, 3, 4
      const canPick = isHumanTurn && (pickAmount <= gameState.sticks);
      btn.disabled = !canPick;
    });

    if (DOM.actionPromptText) {
      if (gameState.gameOver) {
        DOM.actionPromptText.textContent = 'Game concluded.';
      } else if (gameState.turn === 'computer') {
        DOM.actionPromptText.textContent = 'Computer is choosing...';
      } else {
        const maxTake = Math.min(gameState.maxPick, gameState.sticks);
        DOM.actionPromptText.textContent = `Your turn: take 1 to ${maxTake} stick${maxTake > 1 ? 's' : ''}:`;
      }
    }
  }

  /**
   * Updates the status banner text and indicator styling.
   */
  function setStatus(message, type = 'normal') {
    if (!DOM.statusText || !DOM.statusBanner) return;

    DOM.statusText.textContent = message;
    DOM.statusBanner.className = 'status-banner';

    if (type === 'thinking') {
      DOM.statusBanner.classList.add('thinking');
    } else if (type === 'human-loss') {
      DOM.statusBanner.classList.add('game-over-human-loss');
    }
  }

  /**
   * Appends an entry to the visual move log.
   */
  function logMove(text, type = 'system') {
    if (!DOM.logStream) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}-move`;
    if (type === 'system') entry.className = 'log-entry system-entry';

    const textSpan = document.createElement('span');
    textSpan.textContent = text;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    const now = new Date();
    timeSpan.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    entry.appendChild(textSpan);
    entry.appendChild(timeSpan);

    DOM.logStream.appendChild(entry);
    DOM.logStream.scrollTop = DOM.logStream.scrollHeight;

    // Update round counter badge
    if (DOM.roundCounter) {
      const roundNum = Math.floor(gameState.totalMovesCount / 2) + 1;
      DOM.roundCounter.textContent = `Round ${roundNum}`;
    }
  }

  /* --------------------------------------------------------------------------
   * 7. Core Game Logic (Required Algorithm & Functions)
   * -------------------------------------------------------------------------- */

  /**
   * Required Function: startGame()
   * Resets the game state, clears timers, populates sticks, and starts turn.
   */
  function startGame() {
    // 1. Cancel any active AI thinking timer
    if (gameState.pendingTimerId) {
      clearTimeout(gameState.pendingTimerId);
      gameState.pendingTimerId = null;
    }

    // 2. Hide modals and hints
    if (DOM.gameOverModal) DOM.gameOverModal.classList.add('hidden');
    hideHint();

    // 3. Reset state variables
    gameState.sticks = TOTAL;
    gameState.gameOver = false;
    gameState.isAiThinking = false;
    gameState.totalMovesCount = 0;
    gameState.turn = gameState.startingPlayer;

    // 4. Clear move log and record start
    if (DOM.logStream) DOM.logStream.innerHTML = '';
    logMove(`New game started (${gameState.easyMode ? 'Easy Mode' : 'Hard Mode'}). 21 sticks ready.`, 'system');

    // 5. Render sticks and update buttons
    renderSticks();
    updateActionButtons();

    // 6. Direct flow based on who starts
    if (gameState.turn === 'human') {
      setStatus('Your turn! Pick 1, 2, 3, or 4 matchsticks.');
    } else {
      setStatus('Computer starts. Computer is thinking...', 'thinking');
      scheduleAiMove();
    }
  }

  /**
   * Required Function: computerMove(remaining, easyMode)
   * Returns the number of sticks the computer chooses to remove.
   * 
   * Strategy Implementation:
   * - Easy Mode: Returns random legal move from 1 to min(4, remaining).
   * - Hard Mode (Misère Nim optimal):
   *     Calculates optimal = (remaining - 1) % (MAX_PICK + 1).
   *     If optimal === 0 (computer is in a losing position), falls back to
   *     a random legal move from 1 to min(4, remaining) and waits for human error.
   * 
   * @param {number} remaining Number of matchsticks currently on the table.
   * @param {boolean} easyMode True for random moves, false for optimal strategy.
   * @returns {number} Move chosen (1 to min(4, remaining)).
   */
  function computerMove(remaining, easyMode) {
    const maxAllowed = Math.min(MAX_PICK, remaining);

    // 1. Easy mode: random legal move
    if (easyMode) {
      return Math.floor(Math.random() * maxAllowed) + 1;
    }

    // 2. Hard mode: Misère Nim mathematical winning formula
    // Optimal move leaves the opponent with a pile where (opponent_pile - 1) % 5 === 0.
    const optimal = (remaining - 1) % (MAX_PICK + 1);

    // If optimal === 0, the computer is currently in a losing position (1, 6, 11, 16, or 21).
    // Play a random legal move and wait for the human to make a mistake.
    if (optimal === 0) {
      return Math.floor(Math.random() * maxAllowed) + 1;
    }

    return optimal;
  }

  /**
   * Required Function: humanMove(n)
   * Handles the human's pick, validates bounds, updates state, and advances turn.
   * 
   * @param {number} n Number of sticks chosen by human (1 to 4).
   */
  function humanMove(n) {
    // Edge-case guards
    if (gameState.gameOver || gameState.isAiThinking || gameState.turn !== 'human') {
      return;
    }

    const pick = parseInt(n, 10);
    const maxAllowed = Math.min(gameState.maxPick, gameState.sticks);

    if (isNaN(pick) || pick < 1 || pick > maxAllowed) {
      console.warn(`Invalid move: ${n}. Must be between 1 and ${maxAllowed}.`);
      return;
    }

    // Play pick sound
    sound.playStickPick(pick);
    hideHint();

    // Update state
    gameState.sticks -= pick;
    gameState.totalMovesCount++;
    logMove(`You took ${pick} stick${pick > 1 ? 's' : ''}. (Left: ${gameState.sticks})`, 'human');

    renderSticks();

    // Check if the game is over
    if (checkGameOver()) {
      return;
    }

    // Switch turn to computer
    gameState.turn = 'computer';
    updateActionButtons();
    setStatus('Computer is thinking...', 'thinking');
    scheduleAiMove();
  }

  /**
   * Schedules the computer's move with a realistic thinking delay.
   */
  function scheduleAiMove() {
    gameState.isAiThinking = true;
    updateActionButtons();

    gameState.pendingTimerId = setTimeout(() => {
      gameState.pendingTimerId = null;
      executeAiMove();
    }, AI_THINKING_DELAY_MS);
  }

  /**
   * Executes the computer's turn logic.
   */
  function executeAiMove() {
    if (gameState.gameOver) return;

    const pick = computerMove(gameState.sticks, gameState.easyMode);

    sound.playAiChime();
    sound.playStickPick(pick);

    gameState.sticks -= pick;
    gameState.totalMovesCount++;
    gameState.isAiThinking = false;

    logMove(`Computer took ${pick} stick${pick > 1 ? 's' : ''}. (Left: ${gameState.sticks})`, 'ai');
    renderSticks();

    // Check if the game is over
    if (checkGameOver()) {
      return;
    }

    // Switch turn back to human
    gameState.turn = 'human';
    updateActionButtons();
    setStatus(`Computer took ${pick}. Your turn! Pick 1 to ${Math.min(gameState.maxPick, gameState.sticks)}.`);
  }

  /**
   * Required Function: checkGameOver()
   * Detects end of game and announces the winner.
   * 
   * Misère Rules:
   * - Case 1: sticks <= 0 => The player who just moved took the last stick and LOSES.
   * - Case 2: sticks === 1 => The game loop concludes; the player whose turn it is
   *   next is forced to take the final stick and LOSES.
   * 
   * @returns {boolean} True if the game ended, false otherwise.
   */
  function checkGameOver() {
    // Case 1: Player voluntarily or by exhaustion took all remaining sticks (sticks <= 0)
    if (gameState.sticks <= 0) {
      gameState.gameOver = true;
      // The player who just moved took the last stick!
      const loser = (gameState.turn === 'human') ? 'human' : 'computer';
      const winner = (loser === 'human') ? 'computer' : 'human';
      resolveGameOutcome(winner, loser, 'took the last matchstick');
      return true;
    }

    // Case 2: Exactly 1 stick remains on the table
    if (gameState.sticks === 1) {
      gameState.gameOver = true;
      // The player whose turn is NEXT is forced to take the last stick and loses!
      const loser = (gameState.turn === 'human') ? 'computer' : 'human';
      const winner = (loser === 'human') ? 'computer' : 'human';
      resolveGameOutcome(winner, loser, 'forced to take the last stick');
      return true;
    }

    return false;
  }

  /**
   * Resolves the visual and statistical outcome of the game.
   */
  function resolveGameOutcome(winner, loser, reasonDescription) {
    updateActionButtons();

    const isHumanWinner = (winner === 'human');
    updateScore(winner);

    // Audio effect
    if (isHumanWinner) {
      sound.playWinFanfare();
      setStatus(`Victory! You won! The computer was ${reasonDescription}.`, 'normal');
    } else {
      sound.playLossTone();
      setStatus(`Game Over! The computer wins. You were ${reasonDescription}.`, 'human-loss');
    }

    logMove(`Game over! ${isHumanWinner ? 'You won!' : 'Computer won!'} (${loser === 'human' ? 'You' : 'Computer'} ${reasonDescription})`, 'system');

    // Show Game Over Modal
    setTimeout(() => {
      showGameOverModal(isHumanWinner, reasonDescription);
    }, 450);
  }

  /**
   * Required Function: updateScore()
   * Updates human and computer win counters and saves to localStorage.
   */
  function updateScore(winner) {
    if (winner === 'human') {
      gameState.humanWins++;
    } else if (winner === 'computer') {
      gameState.computerWins++;
    }
    saveScoreboard();
  }

  /**
   * Displays the Game Over modal with relevant stats.
   */
  function showGameOverModal(isHumanWinner, reasonDescription) {
    if (!DOM.gameOverModal) return;

    if (isHumanWinner) {
      DOM.modalIcon.textContent = '🏆';
      DOM.modalTitle.textContent = 'You Won!';
      DOM.modalMessage.textContent = `Outstanding! The computer was ${reasonDescription}.`;
      DOM.modalWinnerName.textContent = 'You (Human)';
      DOM.modalWinnerName.style.color = 'var(--accent-green)';
    } else {
      DOM.modalIcon.textContent = '🤖';
      DOM.modalTitle.textContent = 'Computer Wins!';
      DOM.modalMessage.textContent = `Hard luck! You were ${reasonDescription}.`;
      DOM.modalWinnerName.textContent = 'Computer (AI)';
      DOM.modalWinnerName.style.color = 'var(--accent-blue)';
    }

    DOM.modalTotalMoves.textContent = String(gameState.totalMovesCount);
    DOM.gameOverModal.classList.remove('hidden');
    DOM.playAgainBtn.focus();
  }

  /* --------------------------------------------------------------------------
   * 8. Strategy Hint System
   * -------------------------------------------------------------------------- */
  function showHint() {
    if (gameState.gameOver || gameState.turn !== 'human' || !DOM.hintBox || !DOM.hintText) return;

    const remaining = gameState.sticks;
    const optimal = (remaining - 1) % (gameState.maxPick + 1);

    if (optimal === 0) {
      // Human is in a losing position (e.g. 21, 16, 11, 6, 1)
      DOM.hintText.innerHTML = `<strong>⚠️ Losing Position (${remaining} sticks):</strong> You are on a losing pile ($n \\pmod 5 = 1$). Any move you make can be countered by the AI ($5 - x$). Take <strong>1</strong> stick and hope the AI makes an error!`;
    } else {
      const targetPile = remaining - optimal;
      DOM.hintText.innerHTML = `<strong>💡 Winning Move:</strong> Take <strong>${optimal}</strong> stick${optimal > 1 ? 's' : ''}! This leaves exactly <strong>${targetPile}</strong> sticks ($${targetPile} \\pmod 5 = 1$), trapping the AI on a losing position!`;
    }

    DOM.hintBox.classList.remove('hidden');
  }

  function hideHint() {
    if (DOM.hintBox) {
      DOM.hintBox.classList.add('hidden');
    }
  }

  /* --------------------------------------------------------------------------
   * 9. Mathematical Verification: Backward Induction Brute Force Check
   * -------------------------------------------------------------------------- */
  /**
   * Verifies by backward induction that the only losing positions up to 21
   * are {1, 6, 11, 16, 21}.
   * 
   * @param {number} maxN Total sticks to verify (default 21).
   * @param {number} k Maximum pick allowed (default 4).
   * @returns {Array<number>} List of identified losing positions (P-positions).
   */
  function verifyStrategyBruteForce(maxN = 21, k = 4) {
    const isLosing = new Array(maxN + 1).fill(false);

    // Misère Base Case: having 1 stick left forces the player to take it and lose.
    isLosing[1] = true;

    // Backward induction for all pile sizes from 2 to maxN
    for (let n = 2; n <= maxN; n++) {
      let canForceOpponentLoss = false;
      const maxM = Math.min(k, n - 1);

      for (let m = 1; m <= maxM; m++) {
        if (isLosing[n - m] === true) {
          canForceOpponentLoss = true;
          break;
        }
      }

      // If player can transition to a state where opponent loses, current state is WINNING (N).
      // Otherwise, current state is LOSING (P).
      isLosing[n] = !canForceOpponentLoss;
    }

    const losingPositions = [];
    for (let n = 1; n <= maxN; n++) {
      if (isLosing[n]) {
        losingPositions.push(n);
      }
    }

    // Consistency check against n % (k + 1) === 1
    const formulaMatch = losingPositions.every(n => (n % (k + 1)) === 1);

    console.log('[Game Theory Verification] Evaluated positions 1 to', maxN);
    console.log('[Game Theory Verification] Identified P-positions (losing for player to move):', losingPositions);
    console.log('[Game Theory Verification] Formula (n % 5 === 1) verified:', formulaMatch);

    return losingPositions;
  }

  // Expose verification function on window for automated browser testing
  window.verifyStrategyBruteForce = verifyStrategyBruteForce;
  window.gameState = gameState;
  window.humanMove = humanMove;
  window.computerMove = computerMove;
  window.startGame = startGame;

  /* --------------------------------------------------------------------------
   * 10. Theme & Sound Controllers
   * -------------------------------------------------------------------------- */
  function initTheme() {
    let savedTheme = null;
    try {
      savedTheme = localStorage.getItem('matchstick_theme');
    } catch (e) {
      /* Ignore */
    }

    if (!savedTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      savedTheme = prefersDark ? 'dark' : 'light';
    }

    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (DOM.themeIcon) {
      DOM.themeIcon.textContent = (theme === 'dark') ? '🌙' : '☀️';
    }
    try {
      localStorage.setItem('matchstick_theme', theme);
    } catch (e) {
      /* Ignore */
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    applyTheme(nextTheme);
  }

  function updateSoundIcon() {
    if (DOM.soundIcon) {
      DOM.soundIcon.textContent = sound.isMuted ? '🔇' : '🔊';
    }
  }

  /* --------------------------------------------------------------------------
   * 11. Event Listeners & Initialization
   * -------------------------------------------------------------------------- */
  function setupEventListeners() {
    // Theme toggle
    if (DOM.themeToggleBtn) {
      DOM.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Sound toggle
    if (DOM.soundToggleBtn) {
      DOM.soundToggleBtn.addEventListener('click', () => {
        sound.toggleMute();
        updateSoundIcon();
      });
    }

    // Setup Difficulty toggle buttons
    if (DOM.diffHardBtn && DOM.diffEasyBtn) {
      DOM.diffHardBtn.addEventListener('click', () => {
        DOM.diffHardBtn.classList.add('active');
        DOM.diffHardBtn.setAttribute('aria-checked', 'true');
        DOM.diffEasyBtn.classList.remove('active');
        DOM.diffEasyBtn.setAttribute('aria-checked', 'false');
        gameState.easyMode = false;
      });

      DOM.diffEasyBtn.addEventListener('click', () => {
        DOM.diffEasyBtn.classList.add('active');
        DOM.diffEasyBtn.setAttribute('aria-checked', 'true');
        DOM.diffHardBtn.classList.remove('active');
        DOM.diffHardBtn.setAttribute('aria-checked', 'false');
        gameState.easyMode = true;
      });
    }

    // Setup Starting Player toggle buttons
    if (DOM.startHumanBtn && DOM.startAiBtn) {
      DOM.startHumanBtn.addEventListener('click', () => {
        DOM.startHumanBtn.classList.add('active');
        DOM.startHumanBtn.setAttribute('aria-checked', 'true');
        DOM.startAiBtn.classList.remove('active');
        DOM.startAiBtn.setAttribute('aria-checked', 'false');
        gameState.startingPlayer = 'human';
      });

      DOM.startAiBtn.addEventListener('click', () => {
        DOM.startAiBtn.classList.add('active');
        DOM.startAiBtn.setAttribute('aria-checked', 'true');
        DOM.startHumanBtn.classList.remove('active');
        DOM.startHumanBtn.setAttribute('aria-checked', 'false');
        gameState.startingPlayer = 'computer';
      });
    }

    // Start New Game button
    if (DOM.startGameBtn) {
      DOM.startGameBtn.addEventListener('click', startGame);
    }

    // Action buttons (Take 1..4)
    DOM.actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const count = parseInt(btn.getAttribute('data-count'), 10);
        humanMove(count);
      });
    });

    // Keyboard support: 1, 2, 3, 4 keys trigger moves
    window.addEventListener('keydown', (e) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const count = parseInt(e.key, 10);
        if (gameState.turn === 'human' && !gameState.gameOver && !gameState.isAiThinking) {
          if (count <= gameState.sticks) {
            humanMove(count);
          }
        }
      }
    });

    // Hint buttons
    if (DOM.hintBtn) DOM.hintBtn.addEventListener('click', showHint);
    if (DOM.closeHintBtn) DOM.closeHintBtn.addEventListener('click', hideHint);

    // Play Again button in modal
    if (DOM.playAgainBtn) {
      DOM.playAgainBtn.addEventListener('click', startGame);
    }

    // Reset Scoreboard button
    if (DOM.resetScoreBtn) {
      DOM.resetScoreBtn.addEventListener('click', () => {
        if (confirm('Reset scores to 0 : 0?')) {
          gameState.humanWins = 0;
          gameState.computerWins = 0;
          saveScoreboard();
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
   * 12. Startup Sequence
   * -------------------------------------------------------------------------- */
  function init() {
    initTheme();
    updateSoundIcon();
    loadScoreboard();
    setupEventListeners();

    // Run backward induction check on startup
    verifyStrategyBruteForce(TOTAL, MAX_PICK);

    // Initialize first game
    startGame();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
