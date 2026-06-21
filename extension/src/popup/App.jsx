import { useState, useEffect } from "react";
import "./popup.css";

const RARITY_COLORS = {
  common:    "#9E9E9E",
  uncommon:  "#4CAF50",
  rare:      "#2196F3",
  legendary: "#FF9800",
};

export default function App() {
  const [screen, setScreen] = useState("main"); // main | settings | result
  const [baitCount, setBaitCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [catchResult, setCatchResult] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [settings, setSettings] = useState({ clientId: "", clientSecret: "", email: "" });
  const [settingsMsg, setSettingsMsg] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["portUserEmail", "portClientId", "portClientSecret"], (data) => {
      const email = data.portUserEmail || "";
      setUserEmail(email);
      setSettings({ clientId: data.portClientId || "", clientSecret: data.portClientSecret || "", email });
      if (email) refreshBaitCount(email);
    });
  }, []);

  async function refreshBaitCount(email) {
    const res = await chrome.runtime.sendMessage({ type: "GET_BAIT_COUNT", userEmail: email });
    setBaitCount(res?.count || 0);
  }

  async function goFish() {
    if (!userEmail || baitCount === 0) return;
    setLoading(true);
    const res = await chrome.runtime.sendMessage({ type: "GO_FISH", userEmail });
    setLoading(false);
    if (res?.ok) {
      setCatchResult(res.result);
      setBaitCount((c) => Math.max(0, c - 1));
      setScreen("result");
    }
  }

  async function pollNow() {
    setLoading(true);
    await chrome.runtime.sendMessage({ type: "POLL_NOW" });
    await refreshBaitCount(userEmail);
    setLoading(false);
  }

  async function openAquarium() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ type: "OPEN_AQUARIUM", windowId: tab.windowId });
  }

  async function saveSettings() {
    await chrome.storage.local.set({
      portClientId: settings.clientId,
      portClientSecret: settings.clientSecret,
      portUserEmail: settings.email,
    });
    setUserEmail(settings.email);
    setSettingsMsg("Saved!");
    setTimeout(() => setSettingsMsg(""), 2000);
    setScreen("main");
    refreshBaitCount(settings.email);
  }

  if (screen === "settings") {
    return (
      <div className="popup">
        <header>
          <button className="back-btn" onClick={() => setScreen("main")}>←</button>
          <h1>Settings</h1>
        </header>
        <div className="settings-form">
          <label>Port Email</label>
          <input value={settings.email} onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))} placeholder="you@company.io" />
          <label>Client ID</label>
          <input value={settings.clientId} onChange={(e) => setSettings((s) => ({ ...s, clientId: e.target.value }))} placeholder="Port client ID" />
          <label>Client Secret</label>
          <input type="password" value={settings.clientSecret} onChange={(e) => setSettings((s) => ({ ...s, clientSecret: e.target.value }))} placeholder="Port client secret" />
          <button className="btn primary" onClick={saveSettings}>Save</button>
          {settingsMsg && <p className="settings-msg">{settingsMsg}</p>}
        </div>
      </div>
    );
  }

  if (screen === "result" && catchResult) {
    const { fish, rarity } = catchResult;
    return (
      <div className="popup result-screen">
        <div className="fish-reveal" style={{ borderColor: RARITY_COLORS[rarity] }}>
          <div className="fish-emoji">{fish.emoji}</div>
          <h2 style={{ color: RARITY_COLORS[rarity] }}>{rarity.toUpperCase()}</h2>
          <h3>{fish.name}</h3>
          <p className="fish-desc">{fish.description}</p>
          <p className="pool-label">From: {catchResult.poolKey.replace(/_/g, " ")}</p>
        </div>
        <div className="result-actions">
          <button className="btn primary" onClick={() => setScreen("main")}>Cast Again</button>
          <button className="btn secondary" onClick={openAquarium}>View Aquarium</button>
        </div>
      </div>
    );
  }

  return (
    <div className="popup">
      <header>
        <h1>🎣 Port Fishing</h1>
        <button className="settings-btn" onClick={() => setScreen("settings")}>⚙️</button>
      </header>

      {!userEmail ? (
        <div className="no-setup">
          <p>Set up your Port credentials to start fishing.</p>
          <button className="btn primary" onClick={() => setScreen("settings")}>Configure</button>
        </div>
      ) : (
        <>
          <div className="bait-display">
            <span className="bait-count">{baitCount}</span>
            <span className="bait-label">🪱 Baits available</span>
          </div>

          <button
            className="btn primary cast-btn"
            disabled={baitCount === 0 || loading}
            onClick={goFish}
          >
            {loading ? "Casting..." : baitCount === 0 ? "No Bait" : "🎣 Go Fish!"}
          </button>

          <div className="secondary-actions">
            <button className="btn secondary" onClick={pollNow} disabled={loading}>
              Check for new baits
            </button>
            <button className="btn secondary" onClick={openAquarium}>
              🐟 Aquarium
            </button>
          </div>

          <p className="hint">Merge PRs in Port.io to earn baits</p>
        </>
      )}
    </div>
  );
}
