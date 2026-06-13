export const PREFS_KEY = "trekkit:prefs";

export const DEFAULT_PREFS = {
  defaultPublic: true,
  defaultMapPreset: "bright",
  defaultRouteStyle: "animated",
  distanceUnits: "km",
  autoPhotoGps: true,
  showPhotoPinsOnMap: true,
  profileDiscoverable: true,
  showTripStats: true,
  allowComments: true,
  allowKudos: true,
  hideStopCoordinates: false,
  emailKudos: true,
  emailComments: true,
  emailFollowers: true,
  emailDigest: false,
  pushNotifications: false,
  feedFollowingOnly: false,
  showSuggestedTravelers: true,
  reduceMotion: false,
  compactFeed: false,
  darkMode: false,
  language: "en",
};

export function loadPrefs() {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY));
    return { ...DEFAULT_PREFS, ...stored };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

/** Merge user map prefs into trip map_presets JSON object. */
export function mapPresetsWithUserDefaults(countryPresets) {
  const prefs = loadPrefs();
  return {
    ...countryPresets,
    basemap: prefs.defaultMapPreset || countryPresets.basemap,
    routeStyle: prefs.defaultRouteStyle || countryPresets.routeStyle,
  };
}
