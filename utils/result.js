// utils/result.js
// Robust payout rules with strict numeric comparisons and normalization.

function normalizeNumbers(input) {
  // Accept: array of numbers/strings OR a single comma/space-separated string
  if (Array.isArray(input)) {
    return input
      .flatMap(x => String(x).split(/[,\s]+/))
      .filter(Boolean)
      .map(x => Number(x))
      .filter(Number.isFinite);
  }
  if (typeof input === "string") {
    return input
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(x => Number(x))
      .filter(Number.isFinite);
  }
  return [];
}

function countMatches(betNums, drawNums) {
  const drawSet = new Set(drawNums);
  let c = 0;
  for (const n of betNums) if (drawSet.has(n)) c++;
  return c;
}

function calculatePayout(game_id, bet, draw) {
  // Normalize inputs
  const drawNums = normalizeNumbers(draw.winningNumbers);
  const betNums  = normalizeNumbers(bet.numbers);
  const bonusNum = draw.bonus != null ? Number(draw.bonus) : null;

  // Guard: empty/invalid
  if (!drawNums.length || !betNums.length) return 0;

  // Case-insensitive bet_type
  const betType = String(bet.bet_type || "").toUpperCase();

  // game_id may be numeric (1..4) or a string ("pick2"/"pick3")
  const gid = isNaN(Number(game_id)) ? String(game_id).toLowerCase() : Number(game_id);

  const matches = countMatches(betNums, drawNums);

  // Helper for bonus bet
  const hasBonus = bonusNum != null && betNums.includes(bonusNum);

  // For C1/C2/C3/C4 we expect the line to have exactly 1/2/3/4 numbers respectively.
  // We'll require exact-length matches to avoid accidental wins if someone passed more numbers.
  const requireExact = (need) => (betNums.length === need && matches === need);

  switch (gid) {
    /* ---------------------- PICK 2 ---------------------- */
    case "pick2":
    case 5: {
      if (betType === "STRAIGHT") {
        // exact order
        if (betNums.length === 2 &&
            betNums[0] === drawNums[0] &&
            betNums[1] === drawNums[1]) {
          return 50 * Number(bet.stake || 0);
        }
      } else if (betType === "MATCH_FIRST") {
        if (betNums.length >= 1 && betNums[0] === drawNums[0]) {
          return 2 * Number(bet.stake || 0);
        }
      }
      return 0;
    }

    /* ---------------------- PICK 3 ---------------------- */
    case "pick3":
    case 6: {
      if (betType === "STRAIGHT") {
        if (betNums.length === 3 &&
            betNums[0] === drawNums[0] &&
            betNums[1] === drawNums[1] &&
            betNums[2] === drawNums[2]) {
          return 550 * Number(bet.stake || 0);
        }
      } else if (betType === "BOX") {
        if (betNums.length === 3) {
          const a = [...betNums].sort((x,y)=>x-y).join(",");
          const b = [...drawNums].sort((x,y)=>x-y).join(",");
          if (a === b) return 91 * Number(bet.stake || 0);
        }
      }
      return 0;
    }

    /* -------------------- BIG DICE (1) ------------------- */
    case 1: {
      if (betType === "C1" && requireExact(1)) return 5 * Number(bet.stake || 0);
      if (betType === "C2" && requireExact(2)) return 35 * Number(bet.stake || 0);
      if (betType === "C3" && requireExact(3)) return 300 * Number(bet.stake || 0);
      if (betType === "JACKPOT" && betNums.length === 5 && matches === 5) return 30000;
      if (betType === "BONUS" && hasBonus) return 30 * Number(bet.stake || 0);
      return 0;
    }

    /* -------------------- BIG SIX (2) -------------------- */
    case 2: {
      if (betType === "C1" && requireExact(1)) return 7 * Number(bet.stake || 0);
      if (betType === "C2" && requireExact(2)) return 50 * Number(bet.stake || 0);
      if (betType === "C3" && requireExact(3)) return 550 * Number(bet.stake || 0);
      if (betType === "JACKPOT" && betNums.length === 5 && matches === 5) return 30000;
      if (betType === "BONUS" && hasBonus) return 42 * Number(bet.stake || 0);
      return 0;
    }

    /* -------------------- BIG MAX (3) -------------------- */
    case 3: {
      if (betType === "C1" && requireExact(1)) return 7 * Number(bet.stake || 0);
      if (betType === "C2" && requireExact(2)) return 35 * Number(bet.stake || 0);
      if (betType === "C3" && requireExact(3)) return 200 * Number(bet.stake || 0);
      if (betType === "C4" && requireExact(4)) return 640 * Number(bet.stake || 0);
      if (betType === "JACKPOT" && betNums.length === 5 && matches === 5) return 30000;
      if (betType === "BONUS" && hasBonus) return 42 * Number(bet.stake || 0);
      return 0;
    }

    /* ------------------- BIG FIVE (4) -------------------- */
    case 4: {
      if (betType === "C1" && requireExact(1)) return 7 * Number(bet.stake || 0);
      if (betType === "C2" && requireExact(2)) return 70 * Number(bet.stake || 0);
      if (betType === "C3" && requireExact(3)) return 800 * Number(bet.stake || 0);
      if (betType === "JACKPOT" && betNums.length === 5 && matches === 5) return 30000;
      return 0;
    }

    default:
      return 0;
  }
}

module.exports = { calculatePayout };