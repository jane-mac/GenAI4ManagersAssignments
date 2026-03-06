# Public User Tests

The AI Grader will launch each app in a headless browser and perform the actions listed below.
**Note: the majority of unit and user tests are hidden.** You should prompt your AI agent to anticipate edge cases (negative quantities, empty inputs, very large numbers, special characters, etc.) and handle them gracefully.

---

## E-Commerce App

1. Select a waist and length size, then click **Add to Cart**. Verify the cart icon badge count increases by the correct amount.
2. Open the cart and verify the **item subtotal** (price × quantity) is calculated correctly.
3. Enter a zip code into the **shipping estimator** and verify a shipping cost is displayed.

---

## Dashboard App

1. Upload a CSV file and verify that **charts appear** and stats are populated.
2. Apply a **custom date-range filter** and verify the charts update to reflect only data within the selected range.
3. Click the **Export CSV** button and verify the downloaded file contains the correct data rows (not just column headers).

---

## Game App

1. Start the game and verify the **score is visible** in the top-right HUD during gameplay.
2. Collect coins and stars and verify the **score updates correctly** (coins = 1 pt, stars = 5 pts).
3. Press **P** to pause the game, wait a moment, then press **P** again to resume. Verify the **timer continues from where it left off** (does not reset to 0).
4. Reach a game over and verify the **High Score Leaderboard** appears and updates if the current score is a new personal best.

---

*The hidden test suite also covers regression tests on the engine functions and additional edge-case user flows not listed here.*
