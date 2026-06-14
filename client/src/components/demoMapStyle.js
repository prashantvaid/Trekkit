/** Shared MapLibre style for landing-page demo maps (no API key). */
export const DEMO_MAP_STYLE = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 18,
      attribution: "Imagery © Esri",
    },
    dem: {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 14,
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    {
      id: "hillshade",
      type: "hillshade",
      source: "dem",
      paint: {
        "hillshade-exaggeration": 0.35,
        "hillshade-shadow-color": "#3a2b1f",
        "hillshade-highlight-color": "#fff6ec",
      },
    },
  ],
  terrain: { source: "dem", exaggeration: 1.6 },
};

export const JAPAN_DEMO_STOPS = [
  { name: "Tokyo", lng: 139.69, lat: 35.66 },
  { name: "Hakone", lng: 138.76, lat: 35.31 },
  { name: "Kyoto", lng: 135.78, lat: 34.99 },
];
