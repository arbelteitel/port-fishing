// Fish pools map to Port monorepo service groups.
// img paths are relative to extension public root (served as static assets).

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

export function serviceToPool(serviceName) {
  for (const [poolKey, pool] of Object.entries(POOLS)) {
    if (pool.services.some((s) => serviceName.startsWith(s))) return poolKey;
  }
  return "core_platform";
}

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

// ── Fish registry ─────────────────────────────────────────────────────────────
// size drives physics speed (bigger = slower). displayPx is the rendered size.
// img is the path from the extension public root.

export const FISH = [
  // ── Product Surface — colorful, tropical, reef ────────────────────────────
  { id: "clownfish",         name: "Clownfish",         img: "/fish/clownfish.png",              pool: "product_surface",    rarity: "common",    size: 18, description: "Lives in colorful UI components." },
  { id: "clownfish_tang",    name: "Tangerine Clownfish",img: "/fish/clownfish_tangerine.png",   pool: "product_surface",    rarity: "common",    size: 18, description: "A rare color variant from the design system." },
  { id: "tropical",          name: "Tropical Fish",     img: "/fish/tropical_fish.png",          pool: "product_surface",    rarity: "common",    size: 20, description: "Found in every polished onboarding flow." },
  { id: "sardine",           name: "Sardine",           img: "/fish/sardine.png",                pool: "product_surface",    rarity: "common",    size: 16, description: "Tiny, plentiful, gets things done." },
  { id: "yellow_seahorse",   name: "Yellow Seahorse",   img: "/fish/yellow_seahorse.png",        pool: "product_surface",    rarity: "common",    size: 17, description: "Blends into warm-toned dashboards." },
  { id: "ghostfish",         name: "Ghostfish",         img: "/fish/ghostfish.png",              pool: "product_surface",    rarity: "common",    size: 17, description: "A translucent skeleton from a deprecated component." },
  { id: "parrot_fish",       name: "Parrot Fish",       img: "/fish/parrot_fish.png",            pool: "product_surface",    rarity: "uncommon",  size: 26, description: "Chomps through pixel-level inconsistencies." },
  { id: "striped_fish",      name: "Striped Fish",      img: "/fish/striped_fish.png",           pool: "product_surface",    rarity: "uncommon",  size: 24, description: "Always on-brand. Never misses a grid line." },
  { id: "pufferfish",        name: "Pufferfish",        img: "/fish/pufferfish.png",             pool: "product_surface",    rarity: "uncommon",  size: 26, description: "Inflates when a component re-renders too much." },
  { id: "seahorse",          name: "Seahorse",          img: "/fish/seahorse.png",               pool: "product_surface",    rarity: "uncommon",  size: 22, description: "Drifts gracefully through a pixel-perfect release." },
  { id: "lionfish",          name: "Lionfish",          img: "/fish/lionfish.png",               pool: "product_surface",    rarity: "rare",      size: 34, description: "Beautiful but dangerous. Like a complex modal." },
  { id: "koi",               name: "Koi",               img: "/fish/koi.png",                    pool: "product_surface",    rarity: "rare",      size: 36, description: "Brings good fortune to launch days." },
  { id: "sunfish",           name: "Ocean Sunfish",     img: "/fish/sunfish.png",                pool: "product_surface",    rarity: "legendary", size: 54, description: "The largest, strangest UI you've ever shipped." },

  // ── Core Platform — deep, sturdy, indexed ────────────────────────────────
  { id: "tuna",              name: "Tuna",              img: "/fish/tuna.png",                   pool: "core_platform",      rarity: "common",    size: 22, description: "Reliable. Shows up in every API response." },
  { id: "halibut",           name: "Halibut",           img: "/fish/halibut.png",                pool: "core_platform",      rarity: "common",    size: 19, description: "Hard-typed. Cannot be null." },
  { id: "blue_tang",         name: "Blue Tang",         img: "/fish/blue_tang.png",              pool: "core_platform",      rarity: "common",    size: 19, description: "Runs in the background. Always. Keeps swimming." },
  { id: "snapper",           name: "Snapper",           img: "/fish/snapper.png",                pool: "core_platform",      rarity: "common",    size: 19, description: "Dark mode native. Schema-first attitude." },
  { id: "yellowfin_tuna",    name: "Yellowfin Tuna",    img: "/fish/yellowfin_tuna.png",         pool: "core_platform",      rarity: "uncommon",  size: 28, description: "Faster than regular tuna. Indexed on startup." },
  { id: "longfish",          name: "Longfish",          img: "/fish/Longfish.png",               pool: "core_platform",      rarity: "uncommon",  size: 30, description: "An unusually long query result." },
  { id: "crappie",           name: "Crappie",           img: "/fish/crappie.png",                pool: "core_platform",      rarity: "uncommon",  size: 24, description: "Lives in the compiled output." },
  { id: "uglyfish",          name: "Blobfish",          img: "/fish/uglyfish.png",               pool: "core_platform",      rarity: "rare",      size: 38, description: "Only beautiful under extreme API pressure." },
  { id: "anglerfish",        name: "Anglerfish",        img: "/fish/anglerfish.png",             pool: "core_platform",      rarity: "legendary", size: 52, description: "Lurks in the deep query optimizer. Draws in bugs." },

  // ── Workflow & Automation — river, movement, execution ───────────────────
  { id: "gupi",              name: "Guppy",             img: "/fish/gupi.png",                   pool: "workflow_automation", rarity: "common",   size: 14, description: "Spawned by the scheduler every 5 minutes." },
  { id: "tiny_goldfish",     name: "Tiny Goldfish",     img: "/fish/tiny_goldfish.png",          pool: "workflow_automation", rarity: "common",   size: 14, description: "Small action. Big intent." },
  { id: "brown_trout",       name: "Brown Trout",       img: "/fish/brown_trout.png",            pool: "workflow_automation", rarity: "common",   size: 18, description: "Executes once. Never fails." },
  { id: "perch",             name: "Perch",             img: "/fish/perch.png",                  pool: "workflow_automation", rarity: "common",   size: 18, description: "Sweet pipeline. Zero retries needed." },
  { id: "goldfish",          name: "Goldfish",          img: "/fish/Goldfish.png",               pool: "workflow_automation", rarity: "uncommon", size: 24, description: "Circles the workflow queue patiently." },
  { id: "flounder",          name: "Flounder",          img: "/fish/flounder_brown.png",         pool: "workflow_automation", rarity: "uncommon", size: 26, description: "Flat out fast when a trigger fires." },
  { id: "grouper",           name: "Grouper",           img: "/fish/grouper.png",                pool: "workflow_automation", rarity: "uncommon", size: 22, description: "Slow-growing but deeply reliable automation." },
  { id: "pirahna",           name: "Piranha",           img: "/fish/pirahna.png",                pool: "workflow_automation", rarity: "rare",     size: 34, description: "Aggressive retry logic with bite." },
  { id: "red_snapper",       name: "Red Snapper",       img: "/fish/red_snapper.png",            pool: "workflow_automation", rarity: "rare",     size: 36, description: "Snaps at stale action runs." },
  { id: "sea_turtle",        name: "Sea Turtle",        img: "/fish/sea-dwellers/sea_turtle.png",pool: "workflow_automation", rarity: "legendary",size: 50, description: "Has been running this workflow since 2019." },

  // ── Integrations & Data — creatures, connectors, lake ───────────────────
  { id: "crab_tan",          name: "Sand Crab",         img: "/fish/crab_tan.png",               pool: "integrations_data",  rarity: "common",    size: 18, description: "Scuttles between webhook endpoints." },
  { id: "crab_salmon",       name: "Salmon Crab",       img: "/fish/crab_salmon.png",            pool: "integrations_data",  rarity: "common",    size: 18, description: "Carries small payloads with pride." },
  { id: "snail",             name: "Snail",             img: "/fish/sea-dwellers/snail.png",     pool: "integrations_data",  rarity: "common",    size: 16, description: "Rate-limited. But it gets there." },
  { id: "pink_snail",        name: "Pink Snail",        img: "/fish/sea-dwellers/pink_snail.png",pool: "integrations_data",  rarity: "common",    size: 16, description: "A politely throttled API consumer." },
  { id: "squid",             name: "Squid",             img: "/fish/squid.png",                  pool: "integrations_data",  rarity: "uncommon",  size: 28, description: "Ink-jets data into the lakehouse." },
  { id: "lobster",           name: "Lobster",           img: "/fish/Lobster.png",                pool: "integrations_data",  rarity: "uncommon",  size: 30, description: "Claws through authentication headers." },
  { id: "red_crab",          name: "Red Crab",          img: "/fish/red_crab.png",               pool: "integrations_data",  rarity: "uncommon",  size: 24, description: "Triggers on every push event." },
  { id: "sea_cucumber",      name: "Sea Cucumber",      img: "/fish/sea-dwellers/sea_cucamber.png",pool: "integrations_data",rarity: "uncommon",  size: 22, description: "Ingests everything. Complains about nothing." },
  { id: "octopus",           name: "Octopus",           img: "/fish/octopus.png",                pool: "integrations_data",  rarity: "rare",      size: 38, description: "Eight integrations running simultaneously." },
  { id: "crab_maroon",       name: "Maroon Crab",       img: "/fish/crab_maroon.png",            pool: "integrations_data",  rarity: "rare",      size: 30, description: "Only appears in production. Never staging." },
  { id: "axolotl",           name: "Axolotl",           img: "/fish/sea-dwellers/axolotl.png",   pool: "integrations_data",  rarity: "legendary", size: 48, description: "Regenerates broken integrations automatically." },
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
