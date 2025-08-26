function normalizeNumbers(input) {
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

// helper: generate k-combinations
function combinations(arr, k) {
  if (k === 1) return arr.map(x => [x]);
  let result = [];
  arr.forEach((val, i) => {
    const smaller = combinations(arr.slice(i + 1), k - 1);
    smaller.forEach(c => result.push([val, ...c]));
  });
  return result;
}

// check full match of line against winning numbers
function lineMatches(line, drawNums) {
  const set = new Set(drawNums);
  return line.every(n => set.has(n));
}

function calculatePayout(game_id, bet, draw) {
  const drawNums = normalizeNumbers(draw.winningNumbers);
  const betNums = normalizeNumbers(bet.numbers);
  const bonusNum = draw.bonus != null ? Number(draw.bonus) : null;

  if (!drawNums.length || !betNums.length) return 0;

  const betType = String(bet.bet_type || "").toUpperCase();
  const innerType = String(bet.inner_type || "").toUpperCase();
  const gid = isNaN(Number(game_id)) ? String(game_id).toLowerCase() : Number(game_id);

  const stake = Number(bet.stake || 0);
  if (stake <= 0) return 0;

  let payout = 0;

  // line expansion + payout multipliers per PDF
  switch (gid) {
    /* ---------------- BIG DICE (1) ---------------- */
    case 1: {
      if (betType === "C1") {
        const lines = betNums.map(n => [n]);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 5 * stakePer;
      }
      if (betType === "C2") {
        const lines = combinations(betNums, 2);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 35 * stakePer;
      }
      if (betType === "C3") {
        const lines = combinations(betNums, 3);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 300 * stakePer;
      }
      if (betType === "JACKPOT" && betNums.length === 5 && lineMatches(betNums, drawNums)) {
        payout += 30000;
      }
      if (betType === "BONUS" && betNums.includes(bonusNum)) {
        payout += 30 * stake;
      }
      break;
    }

    /* ---------------- BIG SIX (2) ---------------- */
    case 2: {
      if (betType === "C1") {
        const lines = betNums.map(n => [n]);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 7 * stakePer;
      }
      if (betType === "C2") {
        const lines = combinations(betNums, 2);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 50 * stakePer;
      }
      if (betType === "C3") {
        const lines = combinations(betNums, 3);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 550 * stakePer;
      }
      if (betType === "JACKPOT" && betNums.length === 5 && lineMatches(betNums, drawNums)) {
        payout += 30000;
      }
      if (betType === "BONUS" && betNums.includes(bonusNum)) {
        payout += 42 * stake;
      }
      break;
    }

    /* ---------------- BIG MAX (3) ---------------- */
    case 3: {
      if (betType === "C1") {
        const lines = betNums.map(n => [n]);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 7 * stakePer;
      }
      if (betType === "C2") {
        const lines = combinations(betNums, 2);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 35 * stakePer;
      }
      if (betType === "C3") {
        const lines = combinations(betNums, 3);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 200 * stakePer;
      }
      if (betType === "C4") {
        const lines = combinations(betNums, 4);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 640 * stakePer;
      }
      if (betType === "JACKPOT" && betNums.length === 5 && lineMatches(betNums, drawNums)) {
        payout += 30000;
      }
      if (betType === "BONUS" && betNums.includes(bonusNum)) {
        payout += 42 * stake;
      }
      break;
    }

    /* ---------------- BIG FIVE (4) ---------------- */
    case 4: {
      if (betType === "C1") {
        const lines = betNums.map(n => [n]);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 7 * stakePer;
      }
      if (betType === "C2") {
        const lines = combinations(betNums, 2);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 70 * stakePer;
      }
      if (betType === "C3") {
        const lines = combinations(betNums, 3);
        const stakePer = stake / lines.length;
        for (const l of lines) if (lineMatches(l, drawNums)) payout += 800 * stakePer;
      }
      if (betType === "JACKPOT" && betNums.length === 5 && lineMatches(betNums, drawNums)) {
        payout += 30000;
      }
      break;
    }

    /* ---------------- PICK 2 (5) ---------------- */
    case 5: {
      console.error(innerType, betNums, stake, drawNums)
      if (innerType === "STRAIGHT") {
        if (betNums.length === 2 &&
          betNums[0] === drawNums[0] &&
          betNums[1] === drawNums[1]) {
          payout += 50 * stake;
          console.log("RN 1")
        }
      }
      if (innerType === "MATCH_FIRST") {
        if (betNums[0] === drawNums[0]) {
          payout += 2 * stake;
          console.log("RN 2")
        }
      }
      break;
    }

    /* ---------------- PICK 3 (6) ---------------- */
    case 6: {
      if (innerType === "STRAIGHT") {
        if (betNums.length === 3 &&
          betNums[0] === drawNums[0] &&
          betNums[1] === drawNums[1] &&
          betNums[2] === drawNums[2]) {
          payout += 550 * stake;
        }
      }
      if (innerType === "BOX") {
        if (betNums.length === 3) {
          const a = [...betNums].sort((x, y) => x - y).join(",");
          const b = [...drawNums].sort((x, y) => x - y).join(",");
          if (a === b) payout += 91 * stake;
        }
      }
      break;
    }

    default:
      payout = 0;
  }

  return payout;
}

module.exports = { calculatePayout };