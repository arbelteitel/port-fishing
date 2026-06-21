import { useState, useEffect } from "react";
import { FISH, POOLS } from "../lib/fish-registry.js";
import "./aquarium.css";

const RARITY_COLORS = {
  common:    "#9E9E9E",
  uncommon:  "#4CAF50",
  rare:      "#2196F3",
  legendary: "#FF9800",
};

export default function Aquarium() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePool, setActivePool] = useState("all");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["portUserEmail"], async ({ portUserEmail }) => {
      if (!portUserEmail) { setLoading(false); return; }
      setUserEmail(portUserEmail);
      await loadCatches(portUserEmail);
    });
  }, []);

  async function loadCatches(email) {
    setLoading(true);
    try {
      const res = await chrome.runtime.sendMessage({ type: "GET_CATCHES", userEmail: email });
      setCatches(res?.catches || []);
    } catch {
      setCatches([]);
    }
    setLoading(false);
  }

  const caughtFishIds = new Set(catches.map((c) => c.properties?.fishId));

  const displayFish = FISH.filter((f) =>
    activePool === "all" ? true : f.pool === activePool
  );

  const totalCaught = caughtFishIds.size;
  const totalFish = FISH.length;

  return (
    <div className="aquarium">
      <header className="aq-header">
        <div>
          <h1>🐠 Aquarium</h1>
          <p className="progress-line">{totalCaught} / {totalFish} discovered</p>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${(totalCaught / totalFish) * 100}%` }} />
        </div>
      </header>

      <div className="pool-tabs">
        <button className={`tab ${activePool === "all" ? "active" : ""}`} onClick={() => setActivePool("all")}>All</button>
        {Object.entries(POOLS).map(([key, pool]) => (
          <button key={key} className={`tab ${activePool === key ? "active" : ""}`} onClick={() => setActivePool(key)}>
            {pool.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading your catches...</div>
      ) : (
        <div className="fish-grid">
          {displayFish.map((fish) => {
            const caught = caughtFishIds.has(fish.id);
            const catchEntry = catches.find((c) => c.properties?.fishId === fish.id);
            return (
              <div
                key={fish.id}
                className={`fish-card ${caught ? "caught" : "undiscovered"}`}
                style={{ borderColor: caught ? RARITY_COLORS[fish.rarity] : "transparent" }}
                title={caught ? fish.description : "???"}
              >
                <div className="fish-card-emoji">{caught ? fish.emoji : "❓"}</div>
                <div className="fish-card-name">{caught ? fish.name : "???"}</div>
                <div className="fish-card-rarity" style={{ color: RARITY_COLORS[fish.rarity] }}>
                  {fish.rarity}
                </div>
                {caught && catchEntry && (
                  <div className="fish-card-date">
                    {new Date(catchEntry.properties?.caughtAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!userEmail && !loading && (
        <div className="no-setup">Configure Port Fishing in the extension popup to get started.</div>
      )}
    </div>
  );
}
