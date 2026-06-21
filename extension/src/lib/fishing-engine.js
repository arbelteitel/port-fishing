import { FISH, RARITY_WEIGHTS, getFishByPool } from "./fish-registry.js";

// ── Rarity roll ───────────────────────────────────────────────────────────────

function rollRarity(rarityBonus = 0) {
  // rarityBonus shifts weight toward rarer outcomes (0.0 - 1.0 scale)
  const weights = {
    common:    Math.max(5,  RARITY_WEIGHTS.common    - rarityBonus * 30),
    uncommon:  RARITY_WEIGHTS.uncommon  + rarityBonus * 10,
    rare:      RARITY_WEIGHTS.rare      + rarityBonus * 12,
    legendary: RARITY_WEIGHTS.legendary + rarityBonus * 8,
  };

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "common";
}

// ── Rarity bonus calculation from bait context ────────────────────────────────

export function calcRarityBonus(bait) {
  let bonus = 0;

  // PR lifecycle TTL: merged quickly after branch creation
  if (bait.prTtlHours != null) {
    if (bait.prTtlHours < 4)  bonus += 0.15;
    else if (bait.prTtlHours < 24) bonus += 0.08;
  }

  // File freshness: changes to old untouched files
  if (bait.avgFileStalenessMonths != null) {
    if (bait.avgFileStalenessMonths > 12) bonus += 0.2;
    else if (bait.avgFileStalenessMonths > 6) bonus += 0.1;
  }

  // Pool coverage: fewer fish from this pool means better discovery odds
  if (bait.userFishInPool != null) {
    const poolTotal = FISH.filter((f) => f.pool === bait.poolKey).length;
    const coverage = bait.userFishInPool / poolTotal;
    if (coverage < 0.25) bonus += 0.15;
    else if (coverage < 0.5) bonus += 0.07;
  }

  // Change quality: PR had reviews before merge
  if (bait.hadReview) bonus += 0.1;

  return Math.min(bonus, 0.6); // cap so rarity is never guaranteed
}

// ── Main fishing function ─────────────────────────────────────────────────────

export function castRod(bait, userCatches = []) {
  const pool = bait.poolKey || "core_platform";
  const rarityBonus = calcRarityBonus(bait);
  const rarity = rollRarity(rarityBonus);

  const poolFish = getFishByPool(pool).filter((f) => f.rarity === rarity);
  const candidates = poolFish.length ? poolFish : getFishByPool(pool);

  // Prefer fish the user hasn't caught yet
  const caughtIds = new Set(userCatches.map((c) => c.properties?.fishId));
  const fresh = candidates.filter((f) => !caughtIds.has(f.id));
  const pool_ = fresh.length ? fresh : candidates;

  const fish = pool_[Math.floor(Math.random() * pool_.length)];

  return {
    fish,
    rarity,
    rarityBonus: Math.round(rarityBonus * 100),
    poolKey: pool,
    baitId: bait.identifier,
  };
}
