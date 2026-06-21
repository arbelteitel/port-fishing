// Content script - runs on app.getport.io

const TOAST_CSS = `
#pf-toast {
  position: fixed; bottom: 24px; right: 24px;
  background: #1f6feb; color: #fff;
  padding: 10px 16px; border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 999999; opacity: 0; transform: translateY(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  display: flex; align-items: center; gap: 8px;
}
#pf-toast.pf-toast-show { opacity: 1; transform: translateY(0); }
`;

const style = document.createElement("style");
style.textContent = TOAST_CSS;
document.head.appendChild(style);

function showBaitToast(message) {
  const existing = document.getElementById("pf-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "pf-toast";
  toast.innerHTML = `<span>🪱</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("pf-toast-show"), 10);
  setTimeout(() => { toast.classList.remove("pf-toast-show"); setTimeout(() => toast.remove(), 400); }, 4000);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "BAIT_EARNED") showBaitToast(`Bait earned! ${msg.count} available`);
});
