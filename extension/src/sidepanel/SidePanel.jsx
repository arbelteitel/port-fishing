import { useState } from "react";
import "./sidepanel.css";

const RARITY_COLORS = {
  common:    "#9E9E9E",
  uncommon:  "#4CAF50",
  rare:      "#2196F3",
  legendary: "#FF9800",
};
const RARITY_RANK = { legendary: 4, rare: 3, uncommon: 2, common: 1 };

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
  { id: "eel",        name: "Electric Eel",emoji: "⚡", rarity: "uncommon", description: "Powers the scheduler with unexpected voltage." },
  { id: "pufferfish", name: "Pufferfish", emoji: "🐡", rarity: "uncommon",  description: "Inflates when a component re-renders too much." },
  { id: "swordfish",  name: "Swordfish",  emoji: "🗡️", rarity: "uncommon",  description: "Cuts through schema migrations cleanly." },
  { id: "clownfish",  name: "Clownfish",  emoji: "🐠", rarity: "common",    description: "Lives in colorful UI components." },
  { id: "bass",       name: "Sea Bass",   emoji: "🐟", rarity: "common",    description: "Sturdy, reliable, deeply indexed." },
  { id: "salmon",     name: "Salmon",     emoji: "🎏", rarity: "common",    description: "Runs upstream through action pipelines." },
  { id: "anchovy",    name: "Anchovy",    emoji: "🐾", rarity: "common",    description: "Small but vital to every data pipeline." },
];

const MOCK_CATCHES = [
  { ...ALL_FISH.find(f => f.id === "coelacanth"), caughtAt: "2026-06-20" },
  { ...ALL_FISH.find(f => f.id === "narwhal"),    caughtAt: "2026-06-19" },
  { ...ALL_FISH.find(f => f.id === "anglerfish"), caughtAt: "2026-06-18" },
  { ...ALL_FISH.find(f => f.id === "octopus"),    caughtAt: "2026-06-17" },
  { ...ALL_FISH.find(f => f.id === "clownfish"),  caughtAt: "2026-06-16" },
];

function SwimmingFish({ fish, index, total }) {
  const duration  = 10 + (index * 2.3) % 12;
  const delay     = -(index * 3.1) % duration;
  const topPct    = 6 + (index / Math.max(total - 1, 1)) * 72;
  const size      = fish.rarity === "legendary" ? 36 : fish.rarity === "rare" ? 28 : fish.rarity === "uncommon" ? 24 : 20;
  const glow      = RARITY_COLORS[fish.rarity];

  return (
    <div
      className="swimming-fish"
      style={{
        top: `${topPct}%`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s, ${duration / 2}s`,
        animationDelay: `${delay}s, ${delay}s`,
        filter: `drop-shadow(0 0 8px ${glow})`,
      }}
      title={`${fish.name} · ${fish.rarity}`}
    >
      {fish.emoji}
    </div>
  );
}

export default function SidePanel() {
  const [catches, setCatches]     = useState(MOCK_CATCHES);
  const [baitCount, setBaitCount] = useState(5);
  const [loading, setLoading]     = useState(false);
  const [catchResult, setCatchResult] = useState(null);
  const [tab, setTab]             = useState("fish"); // fish | dex

  const top10 = [...catches]
    .sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity])
    .slice(0, 10);

  const caughtIds = new Set(catches.map(f => f.id));

  async function goFish() {
    if (baitCount === 0 || loading) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    const weights = ALL_FISH.map(f => ({ legendary: 3, rare: 12, uncommon: 25, common: 60 }[f.rarity]));
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * total;
    let fish = ALL_FISH[ALL_FISH.length - 1];
    for (let i = 0; i < ALL_FISH.length; i++) { roll -= weights[i]; if (roll <= 0) { fish = ALL_FISH[i]; break; } }
    setLoading(false);
    setCatchResult({ ...fish, isNew: !caughtIds.has(fish.id) });
    setCatches(prev => prev.find(f => f.id === fish.id) ? prev : [{ ...fish, caughtAt: new Date().toISOString() }, ...prev]);
    setBaitCount(c => Math.max(0, c - 1));
  }

  async function pollNow() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setBaitCount(c => c + 2);
    setLoading(false);
  }

  return (
    <div className="panel">
      {/* ── Header ── */}
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-icon">🎣</span>
          <div>
            <h1>Port Fishing</h1>
            <p className="panel-user">⚓ FISHER</p>
          </div>
        </div>
        <div className="bait-pill">
          <span className="bait-num">{baitCount}</span>
          <span className="bait-icon">🪱</span>
        </div>
      </div>

      {/* ── Cast button ── */}
      <div className="cast-area">
        <button className="cast-btn" disabled={baitCount === 0 || loading} onClick={goFish}>
          {loading ? "🎣  Casting..." : baitCount === 0 ? "No Bait — Keep Working!" : "🎣  Go Fish!"}
        </button>
        <button className="check-btn" onClick={pollNow} disabled={loading}>Check for new baits</button>
      </div>

      {/* ── Catch result banner ── */}
      {catchResult && (
        <div className="catch-banner" style={{ borderColor: RARITY_COLORS[catchResult.rarity] }} onClick={() => setCatchResult(null)}>
          <span className="catch-emoji">{catchResult.emoji}</span>
          <div className="catch-info">
            <span className="catch-name">{catchResult.name}</span>
            {catchResult.isNew && <span className="new-badge">NEW!</span>}
            <span className="catch-rarity" style={{ color: RARITY_COLORS[catchResult.rarity] }}>
              {catchResult.rarity}
            </span>
            <span className="catch-desc">{catchResult.description}</span>
          </div>
          <span className="catch-dismiss">✕</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${tab === "fish" ? "active" : ""}`} onClick={() => setTab("fish")}>🐠 Aquarium</button>
        <button className={`tab ${tab === "dex"  ? "active" : ""}`} onClick={() => setTab("dex")}>📖 Fish-Dex</button>
      </div>

      {/* ── Aquarium tab ── */}
      {tab === "fish" && (
        <div className="aquarium-wrap">
          <div className="tank">
            <div className="bubbles">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bubble" style={{ left: `${5 + i * 12}%`, animationDelay: `${i * 0.6}s`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px` }} />
              ))}
            </div>
            {top10.map((fish, i) => (
              <SwimmingFish key={fish.id} fish={fish} index={i} total={top10.length} />
            ))}
            <div className="tank-floor" />
          </div>

          <div className="fish-list">
            {top10.map(fish => (
              <div key={fish.id} className="fish-row">
                <span className="fish-row-emoji">{fish.emoji}</span>
                <div className="fish-row-info">
                  <span className="fish-row-name">{fish.name}</span>
                  <span className="fish-row-desc">{fish.description}</span>
                </div>
                <span className="fish-row-rarity" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.rarity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fish-Dex tab ── */}
      {tab === "dex" && (
        <div className="dex-wrap">
          <p className="dex-progress">{caughtIds.size} / {ALL_FISH.length} discovered</p>
          <div className="dex-grid">
            {[...ALL_FISH].sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]).map(fish => {
              const caught = caughtIds.has(fish.id);
              return (
                <div key={fish.id} className={`dex-card ${caught ? "caught" : "unknown"}`} style={{ borderColor: caught ? RARITY_COLORS[fish.rarity] : "transparent" }} title={caught ? fish.description : "???"}>
                  <span className="dex-emoji">{caught ? fish.emoji : "❓"}</span>
                  <span className="dex-name">{caught ? fish.name : "???"}</span>
                  <span className="dex-rarity" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.rarity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
