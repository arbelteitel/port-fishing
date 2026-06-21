import { useState, useEffect, useRef } from "react";
import "./popup.css";

const RARITY_COLORS = {
  common:    "#9E9E9E",
  uncommon:  "#4CAF50",
  rare:      "#2196F3",
  legendary: "#FF9800",
};

const RARITY_RANK = { legendary: 4, rare: 3, uncommon: 2, common: 1 };

const MOCK_USER = "FISHER";
const MOCK_BAIT_COUNT = 5;

const ALL_FISH = [
  { id: "coelacanth", name: "Coelacanth", emoji: "🦖", rarity: "legendary", description: "Ancient platform fish. Survives every breaking change." },
  { id: "narwhal",    name: "Narwhal",    emoji: "🦄", rarity: "legendary", description: "Pierces through stuck queue backlogs." },
  { id: "whale",      name: "Blue Whale", emoji: "🐋", rarity: "legendary", description: "Swallows entire data lake migrations whole." },
  { id: "starfish",   name: "Starfish",   emoji: "⭐", rarity: "legendary", description: "A perfect UX moment, caught at just the right time." },
  { id: "anglerfish", name: "Anglerfish", emoji: "🔦", rarity: "rare",      description: "Found only in the deep query optimizer." },
  { id: "manta_ray",  name: "Manta Ray",  emoji: "🦈", rarity: "rare",      description: "Glides gracefully through complex workflows." },
  { id: "squid",      name: "Giant Squid",emoji: "🦑", rarity: "rare",      description: "Lurks in the lakehouse depths." },
  { id: "seahorse",   name: "Seahorse",   emoji: "🐴", rarity: "rare",      description: "Rare sighting near polished feature releases." },
  { id: "octopus",    name: "Octopus",    emoji: "🐙", rarity: "uncommon",  description: "Tentacles reach every external integration." },
  { id: "eel",        name: "Electric Eel",emoji: "⚡",rarity: "uncommon",  description: "Powers the scheduler with unexpected voltage." },
  { id: "pufferfish", name: "Pufferfish", emoji: "🐡", rarity: "uncommon",  description: "Inflates when a component re-renders too much." },
  { id: "swordfish",  name: "Swordfish",  emoji: "🗡️", rarity: "uncommon",  description: "Cuts through schema migrations cleanly." },
  { id: "clownfish",  name: "Clownfish",  emoji: "🐠", rarity: "common",    description: "Lives in colorful UI components." },
  { id: "bass",       name: "Sea Bass",   emoji: "🐟", rarity: "common",    description: "Sturdy, reliable, deeply indexed." },
  { id: "salmon",     name: "Salmon",     emoji: "🎏", rarity: "common",    description: "Runs upstream through action pipelines." },
  { id: "anchovy",    name: "Anchovy",    emoji: "🐾", rarity: "common",    description: "Small but vital to every data pipeline." },
];

// Seed aquarium with a few catches for the mock
const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "coelacanth"), caughtAt: "2026-06-20" },
  { ...ALL_FISH.find(f => f.id === "narwhal"),    caughtAt: "2026-06-19" },
  { ...ALL_FISH.find(f => f.id === "anglerfish"), caughtAt: "2026-06-18" },
  { ...ALL_FISH.find(f => f.id === "octopus"),    caughtAt: "2026-06-17" },
  { ...ALL_FISH.find(f => f.id === "clownfish"),  caughtAt: "2026-06-16" },
];

function SwimmingFish({ fish, index, total }) {
  const duration  = 8 + (index * 1.7) % 10;
  const delay     = -(index * 2.3) % duration;
  const topPct    = 8 + (index / total) * 75;
  const size      = fish.rarity === "legendary" ? 32 : fish.rarity === "rare" ? 26 : fish.rarity === "uncommon" ? 22 : 18;
  const glowColor = RARITY_COLORS[fish.rarity];

  return (
    <div
      className="swimming-fish"
      style={{
        top: `${topPct}%`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        filter: `drop-shadow(0 0 6px ${glowColor})`,
      }}
      title={`${fish.name} · ${fish.rarity}`}
    >
      {fish.emoji}
    </div>
  );
}

function Aquarium({ catches, onBack }) {
  const top10 = [...catches]
    .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])
    .slice(0, 10);

  return (
    <div className="popup aquarium-screen">
      <header>
        <button className="back-btn" onClick={onBack}>←</button>
        <h1>🐠 Aquarium</h1>
        <span className="fish-count">{catches.length} caught</span>
      </header>

      <div className="tank">
        <div className="bubbles">
          {[...Array(6)].map((_, i) => <div key={i} className="bubble" style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.7}s` }} />)}
        </div>
        {top10.map((fish, i) => (
          <SwimmingFish key={fish.id} fish={fish} index={i} total={top10.length} />
        ))}
        <div className="tank-floor" />
      </div>

      <div className="legend">
        {top10.map((fish) => (
          <div key={fish.id} className="legend-row">
            <span className="legend-emoji">{fish.emoji}</span>
            <span className="legend-name">{fish.name}</span>
            <span className="legend-rarity" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.rarity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]       = useState("main");
  const [baitCount, setBaitCount] = useState(MOCK_BAIT_COUNT);
  const [loading, setLoading]     = useState(false);
  const [catchResult, setCatchResult] = useState(null);
  const [catches, setCatches]     = useState(MOCK_CATCHES);

  async function goFish() {
    if (baitCount === 0) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const pool = ALL_FISH;
    const weights = pool.map(f => ({ legendary: 3, rare: 12, uncommon: 25, common: 60 }[f.rarity]));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let fish = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) { roll -= weights[i]; if (roll <= 0) { fish = pool[i]; break; } }
    setLoading(false);
    setCatchResult(fish);
    setCatches((prev) => prev.find(f => f.id === fish.id) ? prev : [{ ...fish, caughtAt: new Date().toISOString() }, ...prev]);
    setBaitCount((c) => Math.max(0, c - 1));
    setScreen("result");
  }

  async function pollNow() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setBaitCount((c) => c + 2);
    setLoading(false);
  }

  if (screen === "aquarium") return <Aquarium catches={catches} onBack={() => setScreen("main")} />;

  if (screen === "result" && catchResult) {
    const fish = catchResult;
    const isNew = catches.filter(f => f.id === fish.id).length <= 1;
    return (
      <div className="popup result-screen">
        <div className="fish-reveal" style={{ borderColor: RARITY_COLORS[fish.rarity] }}>
          <div className="fish-emoji-big">{fish.emoji}</div>
          {isNew && <div className="new-badge">NEW!</div>}
          <h2 style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.rarity.toUpperCase()}</h2>
          <h3>{fish.name}</h3>
          <p className="fish-desc">{fish.description}</p>
        </div>
        <div className="result-actions">
          <button className="btn primary" onClick={() => setScreen("main")}>Cast Again</button>
          <button className="btn secondary" onClick={() => setScreen("aquarium")}>🐠 Aquarium</button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      <header>
        <h1>🎣 Port Fishing</h1>
        <span className="username">⚓ {MOCK_USER}</span>
      </header>

      <div className="bait-display">
        <span className="bait-count">{baitCount}</span>
        <span className="bait-label">🪱 Baits available</span>
      </div>

      <button className="btn primary cast-btn" disabled={baitCount === 0 || loading} onClick={goFish}>
        {loading ? "🎣 Casting..." : baitCount === 0 ? "No Bait" : "🎣 Go Fish!"}
      </button>

      <div className="secondary-actions">
        <button className="btn secondary" onClick={pollNow} disabled={loading}>Check for new baits</button>
        <button className="btn secondary" onClick={() => setScreen("aquarium")}>🐠 My Aquarium</button>
      </div>

      <p className="hint">Merge PRs in Port.io to earn baits</p>
    </div>
  );
}
