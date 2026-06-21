import { useState, useEffect, useRef, useCallback } from "react";
import { FISH } from "../lib/fish-registry.js";
import { getDecoration, decoImg, DECO_SCALE } from "../lib/decorations.js";
import "./aquarium.css";

const sizeToSpeed = (size) => 22 / size;
const sizeToPx    = (size) => Math.max(42, Math.round(size * 1.8));

// ── Physics tank ──────────────────────────────────────────────────────────────

function Tank({ fish, decorations, onMoveDecoration }) {
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

  function handleDecoDragStart(e, decId) {
    e.stopPropagation();
    const tank = containerRef.current;
    if (!tank) return;
    const rect = tank.getBoundingClientRect();
    function onMove(ev) {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      onMoveDecoration(decId, Math.max(3, Math.min(95, x)));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

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

        {decorations.map(dec => {
          const meta = getDecoration(dec.id);
          if (!meta) return null;
          const depthClass = meta.depth === "back" ? "tank-decoration--back" : "tank-decoration--front";
          return (
            <div
              key={dec.id}
              className={`tank-decoration ${depthClass}`}
              style={{ left: `${dec.xPos}%` }}
              onMouseDown={e => handleDecoDragStart(e, dec.id)}
              title={`${meta.name} — drag to reposition`}
            >
              <img
                className="tank-decoration-img"
                src={decoImg(meta.file)}
                alt={meta.name}
                draggable={false}
                style={{ width: meta.w * DECO_SCALE.full * (meta.scale ?? 1), height: meta.h * DECO_SCALE.full * (meta.scale ?? 1) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Editor inventory sidebar ─────────────────────────────────────────────────

function EditorPanel({ decorations, onToggleVisibility, onMoveToFront, onMoveToBack }) {
  const visible = decorations.filter(d => d.visible !== false);
  const stashed = decorations.filter(d => d.visible === false);

  function DecoRow({ dec, isStashed }) {
    const meta = getDecoration(dec.id);
    if (!meta) return null;
    return (
      <div className={`editor-deco-row${isStashed ? ' stashed' : ''}`}>
        <img
          className="editor-deco-thumb"
          src={decoImg(meta.file)}
          alt={meta.name}
          draggable={false}
        />
        <div className="editor-deco-info">
          <span className="editor-deco-name">{meta.name}</span>
        </div>
        <div className="editor-deco-actions">
          {!isStashed && (
            <>
              <button className="editor-action-btn" onClick={() => onMoveToFront(dec.id)} title="Move to front">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2L7 12M7 2L3 6M7 2L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="editor-action-btn" onClick={() => onMoveToBack(dec.id)} title="Move to back">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12L7 2M7 12L3 8M7 12L11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </>
          )}
          <button
            className={`editor-action-btn ${isStashed ? 'restore' : 'stash'}`}
            onClick={() => onToggleVisibility(dec.id)}
            title={isStashed ? 'Restore to aquarium' : 'Stash'}
          >
            {isStashed ? '👁' : '👁‍🗨'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="editor-panel-header">
        <span className="editor-panel-title">Decorations</span>
        <span className="editor-panel-count">{visible.length} placed</span>
      </div>
      <div className="editor-panel-list">
        {visible.length === 0 && stashed.length === 0 && (
          <div className="editor-empty">No decorations owned yet. Buy some from the market!</div>
        )}
        {visible.map(dec => <DecoRow key={dec.id} dec={dec} isStashed={false} />)}
        {stashed.length > 0 && (
          <>
            <div className="editor-section-label">Stashed</div>
            {stashed.map(dec => <DecoRow key={dec.id} dec={dec} isStashed={true} />)}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main aquarium page ────────────────────────────────────────────────────────

export default function Aquarium() {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decorations, setDecorations] = useState([]);
  const [editorMode, setEditorMode] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["panelDecorations"], ({ panelDecorations }) => {
      if (Array.isArray(panelDecorations)) setDecorations(panelDecorations);
    });
    const onChange = (changes, area) => {
      if (area === "local" && changes.panelDecorations) {
        setDecorations(changes.panelDecorations.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const moveDecoration = useCallback((id, xPos) => {
    setDecorations(prev => {
      const next = prev.map(d => d.id === id ? { ...d, xPos } : d);
      chrome.storage.local.set({ panelDecorations: next });
      return next;
    });
  }, []);

  const toggleVisibility = useCallback((id) => {
    setDecorations(prev => {
      const next = prev.map(d => d.id === id ? { ...d, visible: d.visible === false ? true : false } : d);
      chrome.storage.local.set({ panelDecorations: next });
      return next;
    });
  }, []);

  const moveToFront = useCallback((id) => {
    setDecorations(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      chrome.storage.local.set({ panelDecorations: next });
      return next;
    });
  }, []);

  const moveToBack = useCallback((id) => {
    setDecorations(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      chrome.storage.local.set({ panelDecorations: next });
      return next;
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.get(["panelCatchIds", "portUserEmail"], async ({ panelCatchIds, portUserEmail }) => {
      if (panelCatchIds?.length) {
        const idSet = new Set(panelCatchIds);
        setCatches(FISH.filter(f => idSet.has(f.id)));
        setLoading(false);
        return;
      }
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
  const visibleDecorations = decorations.filter(d => d.visible !== false);

  return (
    <div className={`aq-root${editorMode ? ' editor-active' : ''}`}>
      <div className="aq-hud">
        <span className="aq-hud-title">🐠 Aquarium</span>
        {!loading && (
          <span className="aq-hud-count">{catches.length} fish collected</span>
        )}
        {loading && <span className="aq-hud-count">Loading...</span>}
      </div>

      <button
        className={`editor-toggle-btn${editorMode ? ' active' : ''}`}
        onClick={() => setEditorMode(m => !m)}
        title={editorMode ? 'Exit editor' : 'Aquarium Editor Mode'}
      >
        {editorMode ? '✕ Close Editor' : '🎨 Editor'}
      </button>

      {editorMode && (
        <EditorPanel
          decorations={decorations}
          onToggleVisibility={toggleVisibility}
          onMoveToFront={moveToFront}
          onMoveToBack={moveToBack}
        />
      )}

      <Tank fish={displayFish} decorations={visibleDecorations} onMoveDecoration={moveDecoration} />
    </div>
  );
}
