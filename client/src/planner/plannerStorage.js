const PLANS_KEY = "trekkit:plannerPlans";
const ACTIVE_KEY = "trekkit:plannerActiveId";

export function loadPlans() {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlans(plans) {
  try {
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  } catch {
    /* quota / private mode */
  }
}

export function loadActivePlanId() {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function saveActivePlanId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
