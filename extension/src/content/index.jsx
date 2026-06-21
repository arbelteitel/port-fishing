// Content script - runs on app.getport.io
// Injects reward toast notifications when baits are awarded

function showBaitToast(message) {
  const existing = document.getElementById("pf-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "pf-toast";
  toast.innerHTML = `<span>🪱</span> ${message}`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("pf-toast-show"), 10);
  setTimeout(() => {
    toast.classList.remove("pf-toast-show");
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "BAIT_EARNED") {
    showBaitToast(`Bait earned! ${msg.count} available`);
  }
});
