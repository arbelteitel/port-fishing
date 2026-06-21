import { getRecentMergedPRs, getFishingUser, upsertFishingUser, createBait, getUserBaits, getUserCatches, createCatch, upsertEntity } from "../lib/port-api.js";
import { prFilesToPool, serviceToPool } from "../lib/fish-registry.js";
import { castRod, calcRarityBonus } from "../lib/fishing-engine.js";

const POLL_ALARM = "port-fishing-poll";
const POLL_INTERVAL_MINUTES = 5;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_INTERVAL_MINUTES });
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  console.log("[Port Fishing] Installed - polling every", POLL_INTERVAL_MINUTES, "min");
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) pollForNewPRs();
});

// ── PR polling ────────────────────────────────────────────────────────────────

async function pollForNewPRs() {
  const { portUserEmail, lastPollAt } = await chrome.storage.local.get(["portUserEmail", "lastPollAt"]);
  if (!portUserEmail) return;

  const since = lastPollAt || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const prs = await getRecentMergedPRs(since);
    const myPRs = prs.filter((pr) => pr.properties?.author === portUserEmail || pr.properties?.authorEmail === portUserEmail);

    for (const pr of myPRs) {
      await awardBaitForPR(pr, portUserEmail);
    }

    await chrome.storage.local.set({ lastPollAt: new Date().toISOString() });

    if (myPRs.length > 0) {
      chrome.action.setBadgeText({ text: String(myPRs.length) });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    }
  } catch (err) {
    console.error("[Port Fishing] Poll error:", err.message);
  }
}

async function awardBaitForPR(pr, userEmail) {
  const prId = pr.identifier;

  // Avoid double-awarding the same PR
  const { awardedPRs = [] } = await chrome.storage.local.get("awardedPRs");
  if (awardedPRs.includes(prId)) return;

  const props = pr.properties || {};
  const changedFiles = props.changedFiles || [];
  const poolKey = prFilesToPool(changedFiles);

  const mergedAt = props.mergedAt ? new Date(props.mergedAt) : new Date();
  const createdAt = props.createdAt ? new Date(props.createdAt) : mergedAt;
  const prTtlHours = (mergedAt - createdAt) / (1000 * 60 * 60);

  const baitData = {
    prId,
    prTitle: props.title || prId,
    poolKey,
    prTtlHours: Math.round(prTtlHours * 10) / 10,
    hadReview: (props.reviewCount || 0) > 0,
    ownerEmail: userEmail,
    earnedAt: mergedAt.toISOString(),
    spent: false,
  };

  await createBait(baitData);

  awardedPRs.push(prId);
  await chrome.storage.local.set({ awardedPRs });

  console.log("[Port Fishing] Bait awarded for PR:", prId, "pool:", poolKey);
}

// ── Message handler (from popup/content) ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "GET_BAIT_COUNT") {
    handleGetBaitCount(msg.userEmail).then(sendResponse);
    return true;
  }

  if (msg.type === "GO_FISH") {
    handleGoFish(msg.userEmail).then(sendResponse);
    return true;
  }

  if (msg.type === "POLL_NOW") {
    pollForNewPRs().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === "OPEN_AQUARIUM") {
    chrome.sidePanel.open({ windowId: msg.windowId });
    sendResponse({ ok: true });
  }

  if (msg.type === "OPEN_AQUARIUM_WINDOW") {
    chrome.windows.create({
      url: chrome.runtime.getURL("aquarium.html"),
      type: "popup",
      width: 1000,
      height: 680,
      focused: true,
    });
    sendResponse({ ok: true });
  }

  if (msg.type === "GET_CATCHES") {
    handleGetCatches(msg.userEmail).then(sendResponse);
    return true;
  }
});

async function handleGetCatches(userEmail) {
  try {
    const catches = await getUserCatches(userEmail);
    return { catches };
  } catch (err) {
    return { catches: [], error: err.message };
  }
}

async function handleGetBaitCount(userEmail) {
  try {
    const baits = await getUserBaits(userEmail);
    const unspent = baits.filter((b) => !b.properties?.spent);
    return { count: unspent.length, baits: unspent };
  } catch (err) {
    return { count: 0, error: err.message };
  }
}

async function handleGoFish(userEmail) {
  try {
    const baits = await getUserBaits(userEmail);
    const unspent = baits.filter((b) => !b.properties?.spent);
    if (!unspent.length) return { error: "no_bait" };

    // Use the oldest unspent bait
    const bait = unspent.sort((a, b) => new Date(a.properties.earnedAt) - new Date(b.properties.earnedAt))[0];

    const userCatches = await getUserCatches(userEmail);
    const result = castRod(bait.properties, userCatches);

    // Save catch
    await createCatch({
      fishId: result.fish.id,
      fishName: result.fish.name,
      fishEmoji: result.fish.emoji,
      rarity: result.rarity,
      rarityBonus: result.rarityBonus,
      poolKey: result.poolKey,
      sourceBaitId: bait.identifier,
      ownerEmail: userEmail,
      caughtAt: new Date().toISOString(),
    });

    // Mark bait as spent
    await upsertEntity("fishing_bait", bait.identifier, { ...bait.properties, spent: true });

    return { ok: true, result };
  } catch (err) {
    console.error("[Port Fishing] Go fish error:", err.message);
    return { error: err.message };
  }
}
