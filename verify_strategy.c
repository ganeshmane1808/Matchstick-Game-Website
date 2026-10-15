/**
 * ============================================================================
 * File: verify_strategy.c
 * Description: Automated brute-force game-theoretic verification of P-positions
 *              (losing positions) for the Misère Matchstick Game up to N = 21.
 * ============================================================================
 * 
 * Game Theory Background:
 * In normal play, the player who takes the last stick wins.
 * In misère play, the player who takes the last stick LOSES.
 * 
 * We use backward induction (minimax / game tree evaluation):
 * - Base state: With 1 stick remaining, the player whose turn it is MUST take
 *   that 1 stick and immediately loses. Thus, position 1 is a LOSING (P) position.
 * 
 * - For any pile size n > 1:
 *   A player can choose to remove m sticks, where 1 <= m <= min(MAX_PICK, n - 1).
 *   (Note: Choosing m = n removes all remaining sticks, including the last stick,
 *   which loses immediately under misère play).
 * 
 *   If there exists ANY legal move m such that the resulting state (n - m) is
 *   a LOSING position for the opponent, then state n is a WINNING (N) position.
 * 
 *   If ALL legal moves lead to WINNING positions for the opponent, then state n
 *   is a LOSING (P) position.
 * 
 * We verify that the only losing positions up to 21 are {1, 6, 11, 16, 21}.
 * ============================================================================
 */

#include <stdio.h>
#include <stdlib.h>
#include <assert.h>

#define TOTAL 21
#define MAX_PICK 4

int main(void) {
    /* is_losing[n] is 1 if position n is a Losing position (P-position),
     * and 0 if position n is a Winning position (N-position).
     */
    int is_losing[TOTAL + 1];

    printf("=============================================================\n");
    printf("   MISÈRE MATCHSTICK GAME: BRUTE-FORCE STRATEGY VERIFICATION\n");
    printf("   Game parameters: TOTAL = %d, MAX_PICK = %d\n", TOTAL, MAX_PICK);
    printf("=============================================================\n\n");

    /* Base case: With 1 stick, player must take it and loses */
    is_losing[1] = 1;

    /* Backward induction for all pile sizes from 2 up to TOTAL */
    for (int n = 2; n <= TOTAL; n++) {
        int can_force_opponent_loss = 0;
        int max_m = (n - 1 < MAX_PICK) ? (n - 1) : MAX_PICK;

        for (int m = 1; m <= max_m; m++) {
            if (is_losing[n - m] == 1) {
                can_force_opponent_loss = 1;
                break;
            }
        }

        /* If player can force opponent into a losing state, current state is WINNING (0).
         * Otherwise, current state is LOSING (1).
         */
        is_losing[n] = can_force_opponent_loss ? 0 : 1;
    }

    /* Print and verify each state against the formula n % 5 == 1 */
    int losing_count = 0;
    int expected_losing[] = {1, 6, 11, 16, 21};
    int num_expected = (int)(sizeof(expected_losing) / sizeof(expected_losing[0]));

    for (int n = 1; n <= TOTAL; n++) {
        int expected_p_position = ((n % (MAX_PICK + 1)) == 1);

        printf("Pile size n = %2d: %-22s (n %% 5 = %d) -> %s\n",
               n,
               is_losing[n] ? "[LOSING / P-Position]" : "[WINNING / N-Position]",
               n % (MAX_PICK + 1),
               is_losing[n] == expected_p_position ? "MATCHES FORMULA" : "MISMATCH!");

        assert(is_losing[n] == expected_p_position);

        if (is_losing[n]) {
            assert(losing_count < num_expected);
            assert(n == expected_losing[losing_count]);
            losing_count++;
        }
    }

    assert(losing_count == num_expected);

    printf("\n-------------------------------------------------------------\n");
    printf("VERIFICATION SUMMARY:\n");
    printf("Total positions evaluated: %d\n", TOTAL);
    printf("Total losing positions:    %d\n", losing_count);
    printf("Identified losing positions: ");
    for (int i = 0; i < num_expected; i++) {
        printf("%d ", expected_losing[i]);
    }
    printf("\n-------------------------------------------------------------\n");
    printf("[SUCCESS] All assertions passed! The ONLY losing positions in [1, %d] are 1, 6, 11, 16, 21.\n", TOTAL);

    return 0;
}
