const ACTORS = [
  { id: "u-alex", username: "alexwanders", avatar_url: null },
  { id: "u-mia", username: "mia_maps", avatar_url: null },
  { id: "u-sam", username: "sam_on_road", avatar_url: null },
  { id: "u-jules", username: "julesjetlag", avatar_url: null },
  { id: "u-rio", username: "rio_routes", avatar_url: null },
];

function minsAgo(m) {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}
function hoursAgo(h) {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}
function daysAgo(d) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/** Default in-app notifications until a live feed is wired up. */
export const DEFAULT_NOTIFICATIONS = [
  {
    id: "n1",
    type: "kudos",
    category: "likes",
    actor: ACTORS[0],
    title: "Alex kudos'd your trip",
    body: "Two weeks in Japan",
    link: "/trips/demo-japan",
    created_at: minsAgo(12),
  },
  {
    id: "n2",
    type: "comment",
    category: "comments",
    actor: ACTORS[1],
    title: "Mia commented on your trip",
    body: "\"That Kyoto temple day looks incredible — which ryokan did you stay at?\"",
    link: "/trips/demo-japan",
    created_at: minsAgo(45),
  },
  {
    id: "n3",
    type: "follow",
    category: "social",
    actor: ACTORS[2],
    title: "Sam started following you",
    body: "See their trips on your feed when they post.",
    link: "/u/u-sam",
    created_at: hoursAgo(2),
  },
  {
    id: "n4",
    type: "trip_post",
    category: "updates",
    actor: ACTORS[3],
    title: "Jules shared a new trip",
    body: "Portugal coast · 6 stops · 8 days",
    link: "/",
    created_at: hoursAgo(5),
  },
  {
    id: "n5",
    type: "kudos",
    category: "likes",
    actor: ACTORS[4],
    title: "Rio kudos'd your trip",
    body: "Weekend in Montreal",
    link: "/trips/demo-montreal",
    created_at: hoursAgo(8),
  },
  {
    id: "n6",
    type: "comment",
    category: "comments",
    actor: ACTORS[0],
    title: "Alex replied to your comment",
    body: "\"We stayed at a machiya near Nishiki — added it to Day 3!\"",
    link: "/trips/demo-japan",
    created_at: hoursAgo(11),
  },
  {
    id: "n7",
    type: "trip_update",
    category: "updates",
    actor: ACTORS[1],
    title: "Mia updated a trip you follow",
    body: "Added 3 new stops to Iceland ring road",
    link: "/",
    created_at: daysAgo(1),
  },
  {
    id: "n8",
    type: "bookmark",
    category: "likes",
    actor: ACTORS[3],
    title: "Jules saved your trip",
    body: "Two weeks in Japan — added to their Saved list",
    link: "/trips/demo-japan",
    created_at: daysAgo(1),
  },
  {
    id: "n9",
    type: "follow",
    category: "social",
    actor: ACTORS[4],
    title: "Rio started following you",
    body: "You have 12 mutual connections on Trekkit.",
    link: "/u/u-rio",
    created_at: daysAgo(2),
  },
  {
    id: "n10",
    type: "system",
    category: "updates",
    actor: { id: "system", username: "Trekkit", avatar_url: null },
    title: "Planner tip",
    body: "Search hotels worldwide before you fly — try the Plan tab.",
    link: "/plan",
    created_at: daysAgo(3),
  },
  {
    id: "n11",
    type: "trip_post",
    category: "updates",
    actor: ACTORS[0],
    title: "Alex shared a new trip",
    body: "Patagonia trek · 11 stops",
    link: "/",
    created_at: daysAgo(4),
  },
  {
    id: "n12",
    type: "mention",
    category: "comments",
    actor: ACTORS[2],
    title: "Sam mentioned you in a comment",
    body: "\"@you this route is basically our Bali plan from last year\"",
    link: "/",
    created_at: daysAgo(5),
  },
];

export const NOTIF_ICONS = {
  kudos: "♥",
  comment: "💬",
  follow: "👤",
  trip_post: "🗺️",
  trip_update: "✏️",
  bookmark: "🔖",
  mention: "@",
  system: "🔔",
};

export const NOTIF_FILTERS = [
  { id: "all", label: "All" },
  { id: "likes", label: "Likes & saves" },
  { id: "comments", label: "Comments" },
  { id: "social", label: "Follows" },
  { id: "updates", label: "Posts & updates" },
];
