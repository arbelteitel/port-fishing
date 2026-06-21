// Fish pools map to Port monorepo service groups.
// Each pool has rarity bands: common, uncommon, rare, legendary.
// species: unique id, name, emoji, pool, rarity, description

export const POOLS = {
  product_surface: {
    label: "Product Surface",
    services: ["frontend", "page-service"],
    color: "#6C8EBF",
    habitat: "Shallow Reefs",
  },
  core_platform: {
    label: "Core Platform",
    services: ["port-api", "asset-service", "search-service", "calculation-properties-service"],
    color: "#82B366",
    habitat: "Deep Ocean",
  },
  workflow_automation: {
    label: "Workflow & Automation",
    services: ["workflow-service", "workflow-scheduler", "action-service", "scheduler-service"],
    color: "#D6B656",
    habitat: "River Delta",
  },
  integrations_data: {
    label: "Integrations & Data",
    services: ["integ-service", "github-app", "bitbucket-app", "slack-app", "lakehouse-reader", "lakehouse-writer", "notification-service"],
    color: "#AE4132",
    habitat: "Open Sea",
  },
};

// Maps a service folder name to a pool key
export function serviceToPool(serviceName) {
  for (const [poolKey, pool] of Object.entries(POOLS)) {
    if (pool.services.some((s) => serviceName.startsWith(s))) return poolKey;
  }
  return "core_platform"; // fallback
}

// Maps a PR's changed files to a pool key by majority service
export function prFilesToPool(changedFiles = []) {
  const counts = {};
  for (const file of changedFiles) {
    const service = file.split("/")[1] || "unknown";
    const pool = serviceToPool(service);
    counts[pool] = (counts[pool] || 0) + 1;
  }
  if (!Object.keys(counts).length) return "core_platform";
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// Fish registry
export const FISH = [
  // ── Product Surface ────────────────────────────────────────────────────────
  { id: "clownfish",      name: "Clownfish",       emoji: "🐠", pool: "product_surface",    rarity: "common",    description: "Lives in colorful UI components." },
  { id: "bluefish",       name: "Blue Tang",        emoji: "🐟", pool: "product_surface",    rarity: "common",    description: "Swims through page layouts effortlessly." },
  { id: "pufferfish",     name: "Pufferfish",       emoji: "🐡", pool: "product_surface",    rarity: "uncommon",  description: "Inflates when a component re-renders too much." },
  { id: "seahorse",       name: "Seahorse",         emoji: "🦄", pool: "product_surface",    rarity: "rare",      description: "Rare sighting near polished feature releases." },
  { id: "starfish",       name: "Starfish",         emoji: "⭐", pool: "product_surface",    rarity: "legendary", description: "A perfect UX moment, caught at just the right time." },

  // ── Core Platform ─────────────────────────────────────────────────────────
  { id: "catfish",        name: "Catfish",          emoji: "🐈", pool: "core_platform",      rarity: "common",    description: "Bottom feeder of the API layer." },
  { id: "bass",           name: "Sea Bass",         emoji: "🐟", pool: "core_platform",      rarity: "common",    description: "Sturdy, reliable, deeply indexed." },
  { id: "swordfish",      name: "Swordfish",        emoji: "🗡️", pool: "core_platform",      rarity: "uncommon",  description: "Cuts through schema migrations cleanly." },
  { id: "anglerfish",     name: "Anglerfish",       emoji: "🔦", pool: "core_platform",      rarity: "rare",      description: "Found only in the deep query optimizer." },
  { id: "coelacanth",     name: "Coelacanth",       emoji: "🦖", pool: "core_platform",      rarity: "legendary", description: "Ancient platform fish. Survives every breaking change." },

  // ── Workflow & Automation ─────────────────────────────────────────────────
  { id: "salmon",         name: "Salmon",           emoji: "🐟", pool: "workflow_automation", rarity: "common",    description: "Runs upstream through action pipelines." },
  { id: "eel",            name: "Electric Eel",     emoji: "⚡", pool: "workflow_automation", rarity: "uncommon",  description: "Powers the scheduler with unexpected voltage." },
  { id: "manta_ray",      name: "Manta Ray",        emoji: "🦈", pool: "workflow_automation", rarity: "rare",      description: "Glides gracefully through complex workflows." },
  { id: "narwhal",        name: "Narwhal",          emoji: "🦄", pool: "workflow_automation", rarity: "legendary", description: "Pierces through stuck queue backlogs." },

  // ── Integrations & Data ───────────────────────────────────────────────────
  { id: "anchovy",        name: "Anchovy",          emoji: "🐟", pool: "integrations_data",  rarity: "common",    description: "Small but vital to every data pipeline." },
  { id: "octopus",        name: "Octopus",          emoji: "🐙", pool: "integrations_data",  rarity: "uncommon",  description: "Tentacles reach every external integration." },
  { id: "squid",          name: "Giant Squid",      emoji: "🦑", pool: "integrations_data",  rarity: "rare",      description: "Lurks in the lakehouse depths." },
  { id: "whale",          name: "Blue Whale",       emoji: "🐋", pool: "integrations_data",  rarity: "legendary", description: "Swallows entire data lake migrations whole." },
];

export const RARITY_WEIGHTS = {
  common:    60,
  uncommon:  25,
  rare:      12,
  legendary:  3,
};

export function getFishByPool(poolKey) {
  return FISH.filter((f) => f.pool === poolKey);
}

export function getFishById(id) {
  return FISH.find((f) => f.id === id);
}
