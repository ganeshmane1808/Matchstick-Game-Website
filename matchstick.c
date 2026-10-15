/**
 * ============================================================================
 * File: matchstick.c
 * Description: Matchstick Game (AI vs Human) in C (C99 standard).
 * Author: Ganesh Mane (DSA Case Study)
 * 
 * Data Structures & Algorithms Case Study:
 * Impartial Games & Misère Play Mathematical Strategy
 * ============================================================================
 * 
 * Game Rules:
 * 1. The game starts with 21 matchsticks (TOTAL = 21).
 * 2. Players alternate turns.
 * 3. On each turn, a player removes 1, 2, 3, or 4 sticks (MAX_PICK = 4),
 *    never exceeding the number of sticks remaining.
 * 4. Misère Rule: The player forced to take the very last stick LOSES.
 * 
 * Mathematical Winning Strategy (Misère Nim):
 * - In misère play, the terminal losing position is n = 1 (the player whose
 *   turn it is must take the 1 remaining stick and loses).
 * - From n in {2, 3, 4, 5}, a player can remove {1, 2, 3, 4} sticks respectively
 *   to leave exactly 1 stick for the opponent. Thus, {2, 3, 4, 5} are winning
 *   positions (N-positions).
 * - From n = 6, any legal move of 1..4 leaves {5, 4, 3, 2} sticks, all of
 *   which allow the opponent to transition to 1. Thus, 6 is a losing position
 *   (P-position).
 * - By mathematical induction, the losing positions (P-positions) are:
 *       n % (MAX_PICK + 1) == 1   =>   n % 5 == 1
 *   Specifically up to 21: 1, 6, 11, 16, 21.
 * 
 * - From any non-losing position, the optimal winning move is:
 *       optimal_move = (remaining - 1) % (MAX_PICK + 1)   [i.e., (remaining - 1) % 5]
 * - If the human plays x sticks from a losing pile (e.g., 21, 16, 11, 6),
 *   the computer counters with (5 - x) sticks. Because x + (5 - x) = 5,
 *   the pile strictly transitions: 21 -> 16 -> 11 -> 6 -> 1.
 * - When 1 stick remains, the human is forced to take it and loses.
 * - If the computer starts from 21 (a losing position), it plays a random
 *   legal move and waits for a human mistake to seize control.
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define TOTAL 21
#define MAX_PICK 4

#define PLAYER_HUMAN 1
#define PLAYER_COMPUTER 2

/**
 * Discards leftover characters from stdin until a newline or EOF is reached.
 * Prevents remaining characters from polluting subsequent input calls.
 */
void clearBuffer(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF) {
        /* Discard characters */
    }
}

/**
 * Prints the current number of sticks and draws the pile visually using '|'.
 * 
 * @param n Number of matchsticks currently remaining in the pile.
 */
void displaySticks(int n) {
    printf("\nSticks left: %d\n", n);
    for (int i = 0; i < n; i++) {
        printf("| ");
    }
    printf("\n");
}

/**
 * Prompts the human player for a move and validates the input.
 * Rejects non-numeric characters, numbers out of bounds (1..MAX_PICK),
 * decimals/trailing garbage, and moves greater than sticks remaining.
 * 
 * @param remaining Number of matchsticks currently remaining.
 * @return Validated number of sticks to take (1 to min(MAX_PICK, remaining)).
 */
int getUserMove(int remaining) {
    int max_allowed = (remaining < MAX_PICK) ? remaining : MAX_PICK;
    int move;

    while (1) {
        if (max_allowed == 1) {
            printf("Your move (1): ");
        } else {
            printf("Your move (1-%d): ", max_allowed);
        }

        int res = scanf("%d", &move);

        /* 1. Handle EOF safely */
        if (res == EOF || feof(stdin)) {
            printf("\nEnd of input detected. Exiting game. Goodbye!\n");
            exit(0);
        }

        /* 2. Check scanf return value: if not 1, non-numeric input */
        if (res != 1) {
            clearBuffer();
            printf("Invalid input! Please pick 1 to %d.\n", max_allowed);
            continue;
        }

        /* 3. Discard trailing characters on line and detect inputs like 3abc or 2.5 */
        int c;
        int has_extra = 0;
        while ((c = getchar()) != '\n' && c != EOF) {
            if (c != ' ' && c != '\t' && c != '\r') {
                has_extra = 1;
            }
        }
        if (has_extra) {
            printf("Invalid input! Decimals and trailing text are not allowed. Please pick 1 to %d.\n", max_allowed);
            continue;
        }

        /* 4. Validate move bounds */
        if (move < 1 || move > MAX_PICK) {
            printf("Invalid choice! Please pick 1 to %d.\n", MAX_PICK);
            continue;
        }

        /* 5. Ensure move does not exceed remaining sticks */
        if (move > remaining) {
            printf("Invalid choice! Only %d stick(s) remaining. Cannot take more sticks than remaining.\n", remaining);
            continue;
        }

        return move;
    }
}

/**
 * Determines the computer's move based on difficulty mode.
 * 
 * In Easy mode: chooses a random legal move between 1 and min(MAX_PICK, remaining).
 * In Hard mode: plays the mathematical winning strategy ((remaining - 1) % (MAX_PICK + 1)).
 *               If in a losing position (result is 0), falls back to a random legal move.
 * 
 * @param remaining Number of sticks currently remaining.
 * @param easyMode 1 for Easy mode (random moves), 0 for Hard mode (optimal strategy).
 * @return Number of sticks the computer chooses to remove.
 */
int computerMove(int remaining, int easyMode) {
    int max_allowed = (remaining < MAX_PICK) ? remaining : MAX_PICK;

    if (easyMode) {
        /* Easy mode: random legal move from 1 to max_allowed */
        return (rand() % max_allowed) + 1;
    }

    /* Hard mode: Misère Nim mathematical winning strategy.
     * Target move is (remaining - 1) % (MAX_PICK + 1).
     */
    int optimal = (remaining - 1) % (MAX_PICK + 1);

    /* If optimal == 0, the computer is currently in a losing position
     * (remaining is 1, 6, 11, 16, or 21). Play a random legal move
     * and wait for the human to make a mistake.
     */
    if (optimal == 0) {
        return (rand() % max_allowed) + 1;
    }

    return optimal;
}

/**
 * Prints who won, based on whose turn it is when the game concludes.
 * Under misère rules, the player whose turn it is must take the last stick and loses.
 * 
 * @param turn The player who is forced to take the last stick (or took it).
 */
void checkWinner(int turn) {
    if (turn == PLAYER_HUMAN) {
        printf("The computer wins!\n");
    } else {
        printf("You win! Congratulations!\n");
    }
}

/**
 * Prints the title banner, game rules, and strategy insight.
 */
static void printBannerAndRules(void) {
    printf("=== MATCHSTICK GAME ===\n");
    printf("Rules: %d sticks. Take 1 to %d per turn.\n", TOTAL, MAX_PICK);
    printf("Whoever takes the LAST stick loses.\n\n");
    printf("Strategy Note:\n");
    printf("  Hard mode is UNBEATABLE if you move first!\n");
    printf("  If the computer moves first, you can win with perfect play\n");
    printf("  by always leaving 16, 11, 6, or 1 sticks.\n\n");
}

/**
 * Safely reads and validates a menu choice between minVal and maxVal.
 * 
 * @param prompt Prompt message shown to the user.
 * @param minVal Minimum allowed integer choice.
 * @param maxVal Maximum allowed integer choice.
 * @return Validated choice.
 */
static int getMenuChoice(const char *prompt, int minVal, int maxVal) {
    int choice;
    while (1) {
        printf("%s", prompt);
        int res = scanf("%d", &choice);

        if (res == EOF || feof(stdin)) {
            printf("\nEnd of input detected. Exiting game. Goodbye!\n");
            exit(0);
        }

        if (res != 1) {
            clearBuffer();
            printf("Invalid input! Please enter a whole number (%d to %d).\n", minVal, maxVal);
            continue;
        }

        int c;
        int has_extra = 0;
        while ((c = getchar()) != '\n' && c != EOF) {
            if (c != ' ' && c != '\t' && c != '\r') {
                has_extra = 1;
            }
        }
        if (has_extra) {
            printf("Invalid input! Decimals and trailing text are not allowed. Please enter %d or %d.\n", minVal, maxVal);
            continue;
        }

        if (choice < minVal || choice > maxVal) {
            printf("Invalid selection! Please enter %d or %d.\n", minVal, maxVal);
            continue;
        }

        return choice;
    }
}

/**
 * Main game entry point.
 * Coordinates setup menus, main game loop, rematch handling, and score keeping.
 */
int main(void) {
    /* Disable stdout buffering so prompts appear immediately on console and pipes */
    setvbuf(stdout, NULL, _IONBF, 0);

    /* Seed pseudo-random number generator once at startup */
    srand((unsigned int)time(NULL));

    printBannerAndRules();

    int humanWins = 0;
    int computerWins = 0;
    int playAgain = 1;

    while (playAgain) {
        int diffChoice = getMenuChoice("Difficulty: 1 = Easy, 2 = Hard: ", 1, 2);
        int easyMode = (diffChoice == 1);

        int whoStarts = getMenuChoice("Who starts? 1 = You, 2 = Computer: ", 1, 2);
        int turn = (whoStarts == 1) ? PLAYER_HUMAN : PLAYER_COMPUTER;

        int sticks = TOTAL;

        /* Main game loop: continue while more than 1 stick remains */
        while (sticks > 1) {
            if (turn == PLAYER_HUMAN) {
                displaySticks(sticks);
                int move = getUserMove(sticks);
                sticks -= move;

                /* If human took all remaining sticks (including the last stick) */
                if (sticks <= 0) {
                    break;
                }
            } else {
                int move = computerMove(sticks, easyMode);
                printf("Computer takes %d.\n", move);
                sticks -= move;

                /* If computer took all remaining sticks (including the last stick) */
                if (sticks <= 0) {
                    break;
                }
            }

            /* Alternate turn for the next round */
            turn = (turn == PLAYER_HUMAN) ? PLAYER_COMPUTER : PLAYER_HUMAN;
        }

        /* Endgame resolution */
        if (sticks == 1) {
            displaySticks(sticks);
            if (turn == PLAYER_HUMAN) {
                printf("\nYou are forced to take the last stick.\n");
            } else {
                printf("\nComputer is forced to take the last stick.\n");
            }
        } else {
            /* sticks <= 0: the player who just moved took the last stick */
            if (turn == PLAYER_HUMAN) {
                printf("\nYou took the last stick!\n");
            } else {
                printf("\nComputer took the last stick!\n");
            }
        }

        /* Announce winner */
        checkWinner(turn);

        /* Update and display score */
        if (turn == PLAYER_HUMAN) {
            computerWins++;
        } else {
            humanWins++;
        }
        printf("Current Score: You %d | Computer %d\n\n", humanWins, computerWins);

        /* Ask for a rematch */
        playAgain = getMenuChoice("Play again? (1 = yes, 0 = no): ", 0, 1);
        if (playAgain) {
            printf("\n-----------------------------------------------------\n");
            printf("Starting a new game with %d sticks!\n", TOTAL);
            printf("-----------------------------------------------------\n\n");
        }
    }

    printf("\nThank you for playing! Final Score: You %d | Computer %d\n", humanWins, computerWins);
    return 0;
}
