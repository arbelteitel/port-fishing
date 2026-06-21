// ── Decoration catalog ─────────────────────────────────────────────────────────
// Pixel-art decorations live in /decorations/<file>.png. Each entry carries its
// native pixel size so every decoration can be rendered at the correct, consistent
// scale (display size = native × DISPLAY_SCALE), preserving aspect ratio.

export const decoImg = (file) => `/decorations/${file}`;

// Pixel scale applied on top of native sprite size.
// The side panel tank is small, the full-screen tank is large.
export const DECO_SCALE = { panel: 1.6, full: 3.0 };

// Curated, buyable decorations. `w`/`h` are the sprite's native pixel dimensions.
// `scale` is a per-decoration multiplier applied on top of DECO_SCALE.
// `depth` controls layering: "back" renders behind fish, "front" renders in front.
export const DECORATION_CATALOG = [
  // ── Structures ────────────────────────────────────────────────────────────
  { id: "ship",               name: "Sunken Ship",     file: "ship.png",               w: 64, h: 48, scale: 1.6,  depth: "back",  price: 120, description: "A weathered ship resting on the seafloor." },
  { id: "stone_castle",       name: "Stone Castle",    file: "stone_castle.png",       w: 80, h: 64, scale: 1.8,  depth: "back",  price: 180, description: "A grand fortress for your fish to explore." },
  { id: "stone_castle_tower", name: "Castle Tower",    file: "stone_castle_tower.png", w: 32, h: 48, scale: 1.4,  depth: "back",  price: 70,  description: "A lone watchtower of carved stone." },
  { id: "mushroom_house",     name: "Mushroom House",  file: "mushroom_house.png",     w: 48, h: 48, scale: 1.3,  depth: "back",  price: 110, description: "A cozy fungal cottage." },
  { id: "wooden_house",       name: "Wooden House",    file: "wooden_house.png",       w: 48, h: 32, scale: 1.3,  depth: "back",  price: 90,  description: "A little sunken cabin." },
  { id: "treasure_chest",     name: "Treasure Chest",  file: "treasure_chest.png",     w: 48, h: 32, scale: 1.0,  depth: "front", price: 130, description: "Glittering loot from the deep." },
  { id: "anchor",             name: "Old Anchor",      file: "anchor.png",             w: 32, h: 32, scale: 1.1,  depth: "front", price: 45,  description: "A rusted anchor, lost at sea." },
  { id: "barrel_1",           name: "Barrel",          file: "barrel_1.png",           w: 32, h: 32, scale: 0.9,  depth: "front", price: 35,  description: "A drifting wooden barrel." },
  { id: "barrel_2",           name: "Cracked Barrel",  file: "barrel_2.png",           w: 32, h: 32, scale: 0.9,  depth: "front", price: 35,  description: "Seen better days." },
  { id: "dead_tree",          name: "Dead Tree",       file: "dead_tree.png",          w: 32, h: 32, scale: 1.2,  depth: "back",  price: 40,  description: "A bare branch reaching up." },

  // ── Corals & shells ───────────────────────────────────────────────────────
  { id: "big_shell",          name: "Giant Shell",     file: "big_shell.png",          w: 48, h: 48, scale: 1.2,  depth: "front", price: 60,  description: "A grand spiral shell." },
  { id: "green_coral_3",      name: "Green Coral",     file: "green_coral_3.png",      w: 48, h: 48, scale: 1.1,  depth: "back",  price: 55,  description: "Lush living coral." },
  { id: "pink_coral_3",       name: "Pink Coral",      file: "pink_coral_3.png",       w: 48, h: 48, scale: 1.1,  depth: "back",  price: 55,  description: "Soft rosy coral fans." },
  { id: "orange_coral_3",     name: "Orange Coral",    file: "orange_coral_3.png",     w: 16, h: 16, scale: 1.4,  depth: "front", price: 25,  description: "A small fiery coral." },
  { id: "pink_coral_1",       name: "Coral Bud",       file: "pink_coral_1.png",       w: 32, h: 32, scale: 0.85, depth: "front", price: 30,  description: "A budding pink coral." },
  { id: "shell_1",            name: "Sea Shell",       file: "shell_1.png",            w: 16, h: 16, scale: 1.2,  depth: "front", price: 10,  description: "A tiny pearly shell." },

  // ── Plants & grass ──────────────────────────────────────────────────────────
  { id: "wavy_grass_1",       name: "Wavy Grass",      file: "wavy_grass_1.png",       w: 32, h: 32, scale: 1.0,  depth: "front", price: 20,  wiggle: true, description: "Gently swaying greenery." },
  { id: "red_plant_2",        name: "Red Plant",       file: "red_plant_2.png",        w: 32, h: 32, scale: 1.1,  depth: "front", price: 30,  wiggle: true, description: "A vivid crimson frond." },
  { id: "green_plant_3",      name: "Green Reeds",     file: "green_plant_3.png",      w: 48, h: 16, scale: 1.3,  depth: "front", price: 25,  wiggle: true, description: "A spread of tall reeds." },
  { id: "big_grass_3",        name: "Tall Grass",      file: "big_grass_3.png",        w: 32, h: 16, scale: 1.0,  depth: "front", price: 15,  wiggle: true, description: "A tuft of seabed grass." },

  // ── Rocks ────────────────────────────────────────────────────────────────────
  { id: "stone_6",            name: "Boulder",         file: "stone_6.png",            w: 80, h: 48, scale: 1.5,  depth: "back",  price: 50,  description: "A mossy underwater boulder." },
  { id: "stone_3",            name: "Stone",           file: "stone_3.png",            w: 32, h: 32, scale: 0.8,  depth: "front", price: 15,  description: "A simple smooth stone." },
];

const BY_ID = Object.fromEntries(DECORATION_CATALOG.map(d => [d.id, d]));
export const getDecoration = (id) => BY_ID[id];
