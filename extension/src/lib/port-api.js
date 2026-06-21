const PORT_API_BASE = "https://api.getport.io/v1";

let _token = null;
let _tokenExpiry = 0;

async function getCredentials() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["portClientId", "portClientSecret"], resolve);
  });
}

async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 30_000) return _token;

  const { portClientId, portClientSecret } = await getCredentials();
  if (!portClientId || !portClientSecret) throw new Error("Port credentials not set");

  const res = await fetch(`${PORT_API_BASE}/auth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: portClientId, clientSecret: portClientSecret }),
  });

  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  _token = data.accessToken;
  // JWT exp is in seconds
  _tokenExpiry = (data.expiresIn ? Date.now() + data.expiresIn * 1000 : Date.now() + 3_600_000);
  return _token;
}

async function portFetch(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${PORT_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Port API ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Entities ──────────────────────────────────────────────────────────────────

export async function getEntity(blueprint, id) {
  return portFetch(`/blueprints/${blueprint}/entities/${id}`);
}

export async function upsertEntity(blueprint, id, properties, relations = {}) {
  return portFetch(`/blueprints/${blueprint}/entities?upsert=true&merge=true`, {
    method: "POST",
    body: JSON.stringify({ identifier: id, title: id, properties, relations }),
  });
}

export async function searchEntities(blueprint, query = {}) {
  return portFetch(`/blueprints/${blueprint}/entities/search`, {
    method: "POST",
    body: JSON.stringify(query),
  });
}

// ── PR entities from GitHub integration ──────────────────────────────────────

export async function getRecentMergedPRs(sinceTimestamp) {
  const res = await searchEntities("githubPullRequest", {
    rules: [
      { property: "state", operator: "=", value: "merged" },
      { property: "mergedAt", operator: ">", value: sinceTimestamp },
    ],
    combinator: "and",
  });
  return res.entities || [];
}

// ── User fishing state ────────────────────────────────────────────────────────

export async function getFishingUser(userEmail) {
  try {
    const res = await getEntity("fishing_user", userEmail.replace("@", "_at_"));
    return res.entity;
  } catch {
    return null;
  }
}

export async function upsertFishingUser(userEmail, props) {
  const id = userEmail.replace("@", "_at_");
  return upsertEntity("fishing_user", id, props);
}

// ── Bait entities ─────────────────────────────────────────────────────────────

export async function createBait(baitData) {
  const id = `bait_${baitData.prId}_${Date.now()}`;
  return upsertEntity("fishing_bait", id, baitData);
}

export async function getUserBaits(userEmail) {
  const id = userEmail.replace("@", "_at_");
  const res = await searchEntities("fishing_bait", {
    rules: [{ relation: "owner", blueprint: "fishing_user", value: id }],
    combinator: "and",
  });
  return res.entities || [];
}

// ── Catch entities ─────────────────────────────────────────────────────────────

export async function createCatch(catchData) {
  const id = `catch_${catchData.ownerEmail.replace("@", "_")}_${Date.now()}`;
  return upsertEntity("fishing_catch", id, catchData);
}

export async function getUserCatches(userEmail) {
  const id = userEmail.replace("@", "_at_");
  const res = await searchEntities("fishing_catch", {
    rules: [{ relation: "owner", blueprint: "fishing_user", value: id }],
    combinator: "and",
  });
  return res.entities || [];
}
