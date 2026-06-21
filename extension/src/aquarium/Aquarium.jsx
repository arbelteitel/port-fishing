import { useState, useEffect, useRef, useCallback } from "react";
import { FISH } from "../lib/fish-registry.js";
import "./aquarium.css";

const sizeToSpeed = (size) => 22 / size;
const sizeToPx    = (size) => Math.round(size * 1.8);

// ── Physics tank ──────────────────────────────────────────────────────────────

function Tank({ fish }) {
  const containerRef = useRef(null);
  const elemsRef     = useRef([]);
  const stateRef     = useRef([]);
  const rafRef       = useRef(null);

  const fishIds = fish.map(f => f.id).join(",");
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const existingById = Object.fromEntries(stateRef.current.map(s => [s.id, s]));
    stateRef.current = fish.map((f) => {
      if (existingById[f.id]) return existingById[f.id];
      const spd   = sizeToSpeed(f.size);
      const angle = Math.random() * Math.PI * 2;
      const vx0   = Math.cos(angle) * spd;
      const halfPx = sizeToPx(f.size) / 2;
      return {
        id: f.id,
        halfPx,
        x: 80 + Math.random() * (W - 160),
        y: 60 + Math.random() * (H - 160),
        vx: vx0,
        vy: Math.sin(angle) * spd,
        baseSpeed: spd,
        bobPhase: Math.random() * Math.PI * 2,
        wanderStrength: 0.010 + Math.random() * 0.006,
        faceRight: vx0 >= 0,
        flipCooldown: 0,
        fleeTtl: 0,
        fleeVx: 0,
        fleeVy: 0,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishIds]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const SEABED      = 28;
    const MARGIN      = 18;
    const WALL_RANGE  = 60;
    const WALL_FORCE  = 0.14;
    const TOP_FORCE   = 0.32;
    const GRAVITY     = 0.018;

    function tick() {
      const W = container.clientWidth;
      const H = container.clientHeight;
      stateRef.current.forEach((s, i) => {
        const bottomLimit = H - SEABED - s.halfPx;
        s.bobPhase += 0.028;
        const speedMod  = 1 + Math.sin(s.bobPhase) * 0.28;
        const targetSpd = s.baseSpeed * speedMod;
        const wanderAngle = (Math.random() - 0.5) * s.wanderStrength;
        const cosW = Math.cos(wanderAngle), sinW = Math.sin(wanderAngle);
        const wvx = s.vx * cosW - s.vy * sinW;
        const wvy = s.vx * sinW + s.vy * cosW;
        s.vx = wvx; s.vy = wvy;
        const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
        s.vx = (s.vx / spd) * targetSpd;
        s.vy = (s.vy / spd) * targetSpd;
        if (s.x < WALL_RANGE)               s.vx += WALL_FORCE * (1 - s.x / WALL_RANGE);
        if (s.x > W - WALL_RANGE)           s.vx -= WALL_FORCE * (1 - (W - s.x) / WALL_RANGE);
        if (s.y < WALL_RANGE)               s.vy += TOP_FORCE  * (1 - s.y / WALL_RANGE);
        if (s.y > bottomLimit - WALL_RANGE) s.vy -= WALL_FORCE * (1 - (bottomLimit - s.y) / WALL_RANGE);
        s.vy += GRAVITY;
        if (s.fleeTtl > 0) {
          s.vx += s.fleeVx; s.vy += s.fleeVy;
          s.fleeVx *= 0.88; s.fleeVy *= 0.88;
          s.fleeTtl--;
        }
        s.x += s.vx; s.y += s.vy;
        if (s.x < MARGIN)      { s.x = MARGIN;       s.vx =  Math.abs(s.vx); }
        if (s.x > W - MARGIN)  { s.x = W - MARGIN;   s.vx = -Math.abs(s.vx); }
        if (s.y < MARGIN)      { s.y = MARGIN;        s.vy =  Math.abs(s.vy); }
        if (s.y > bottomLimit) { s.y = bottomLimit;   s.vy = -Math.abs(s.vy); }
        if (s.flipCooldown > 0) {
          s.flipCooldown--;
        } else if ((s.vx > 0) !== s.faceRight) {
          s.faceRight    = s.vx > 0;
          s.flipCooldown = 45;
        }
        const wagOffset = Math.sin(s.bobPhase * 1.8) * 2;
        const el = elemsRef.current[i];
        if (el) {
          el.style.left      = `${s.x}px`;
          el.style.top       = `${s.y + wagOffset}px`;
          el.style.transform = `translate(-50%,-50%) scaleX(${s.faceRight ? 1 : -1})`;
        }
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fish]);

  const handleClick = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const diag   = Math.sqrt(rect.width ** 2 + rect.height ** 2);
    const ripple = document.createElement("div");
    ripple.className = "tank-ripple";
    ripple.style.left = `${clickX}px`;
    ripple.style.top  = `${clickY}px`;
    containerRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
    stateRef.current.forEach((s) => {
      const dx   = s.x - clickX;
      const dy   = s.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const strength = Math.max(0.3, 1 - dist / diag) * s.baseSpeed * 5;
      const angle    = Math.atan2(dy, dx);
      s.fleeVx  = Math.cos(angle) * strength * 0.25;
      s.fleeVy  = Math.sin(angle) * strength * 0.25;
      s.fleeTtl = 28;
    });
  }, []);

  return (
    <div className="tank" ref={containerRef} onClick={handleClick}>
      <div className="water-shimmer" />
      <div className="bubbles">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="bubble" style={{ left: `${3 + i * 7}%`, animationDelay: `${i * 0.4}s`, width: `${4 + (i % 4) * 2}px`, height: `${4 + (i % 4) * 2}px` }} />
        ))}
      </div>

      {fish.map((f, i) => {
        const px = sizeToPx(f.size);
        return (
          <div
            key={f.id}
            ref={el => elemsRef.current[i] = el}
            className="tank-fish"
            title={`${f.name} · ${f.rarity}`}
          >
            <img src={f.img} alt={f.name} style={{ width: px, height: px }} className="fish-sprite" />
          </div>
        );
      })}

      <div className="tank-seabed">
        <div className="seaweed" style={{ left: "6%",  height: 40, animationDelay: "0s" }} />
        <div className="seaweed" style={{ left: "22%", height: 28, animationDelay: "-0.8s" }} />
        <div className="seaweed" style={{ left: "45%", height: 50, animationDelay: "-1.6s" }} />
        <div className="seaweed" style={{ left: "68%", height: 34, animationDelay: "-2.4s" }} />
        <div className="seaweed" style={{ right: "8%", height: 44, animationDelay: "-3.1s" }} />
      </div>
    </div>
  );
}

// ── Main aquarium page ────────────────────────────────────────────────────────

export default function Aquarium() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(["panelCatchIds", "portUserEmail"], async ({ panelCatchIds, portUserEmail }) => {
      // Prefer the live side-panel catches synced to storage
      if (panelCatchIds?.length) {
        const idSet = new Set(panelCatchIds);
        setCatches(FISH.filter(f => idSet.has(f.id)));
        setLoading(false);
        return;
      }
      // Fall back to Port API
      if (!portUserEmail) { setLoading(false); return; }
      try {
        const res = await chrome.runtime.sendMessage({ type: "GET_CATCHES", userEmail: portUserEmail });
        const caughtIds = new Set((res?.catches || []).map(c => c.properties?.fishId));
        setCatches(FISH.filter(f => caughtIds.has(f.id)));
      } catch {
        setCatches([]);
      }
      setLoading(false);
    });
  }, []);

  const displayFish = catches.length > 0 ? catches : FISH.slice(0, 12);

  return (
    <div className="aq-root">
      <div className="aq-hud">
        <span className="aq-hud-title">🐠 Aquarium</span>
        {!loading && (
          <span className="aq-hud-count">{catches.length} fish collected</span>
        )}
        {loading && <span className="aq-hud-count">Loading...</span>}
      </div>
      <Tank fish={displayFish} />
    </div>
  );
}
