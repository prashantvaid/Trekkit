const TOKEN_KEY = "trekkit_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, isForm } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (isForm) {
    payload = body; // FormData; let the browser set the boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, { method, headers, body: payload });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = data.error;
    const msg =
      typeof err === "string"
        ? err
        : err?.description || err?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // auth
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me"),
  updateMe: (body) => request("/auth/me", { method: "PATCH", body }),

  // trips
  createTrip: (body) => request("/trips", { method: "POST", body }),
  myTrips: () => request("/trips/mine"),
  userTrips: (userId) => request(`/trips/user/${userId}`),
  getTrip: (id) => request(`/trips/${id}`),
  updateTrip: (id, body) => request(`/trips/${id}`, { method: "PATCH", body }),
  postTrip: (id, body) => request(`/trips/${id}/post`, { method: "POST", body }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: "DELETE" }),
  addStop: (tripId, body) => request(`/trips/${tripId}/stops`, { method: "POST", body }),
  deleteStop: (tripId, stopId) =>
    request(`/trips/${tripId}/stops/${stopId}`, { method: "DELETE" }),
  addPhoto: (tripId, stopId, body) =>
    request(`/trips/${tripId}/stops/${stopId}/photos`, { method: "POST", body }),
  toggleKudos: (tripId) => request(`/trips/${tripId}/kudos`, { method: "POST" }),
  toggleBookmark: (tripId) => request(`/trips/${tripId}/bookmark`, { method: "POST" }),
  bookmarks: () => request("/trips/bookmarks"),
  listComments: (tripId) => request(`/trips/${tripId}/comments`),
  addComment: (tripId, body) => request(`/trips/${tripId}/comments`, { method: "POST", body: { body } }),
  deleteComment: (tripId, commentId) =>
    request(`/trips/${tripId}/comments/${commentId}`, { method: "DELETE" }),

  // feed
  feed: () => request("/feed"),

  // informative posts
  createPost: (body) => request("/posts", { method: "POST", body }),
  getPost: (id) => request(`/posts/${id}`),
  updatePost: (id, body) => request(`/posts/${id}`, { method: "PATCH", body }),
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  userPosts: (userId) => request(`/posts/user/${userId}`),
  togglePostKudos: (postId) => request(`/posts/${postId}/kudos`, { method: "POST" }),
  listPostComments: (postId) => request(`/posts/${postId}/comments`),
  addPostComment: (postId, body) =>
    request(`/posts/${postId}/comments`, { method: "POST", body: { body } }),
  deletePostComment: (postId, commentId) =>
    request(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" }),

  // users / friends
  searchUsers: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  follow: (userId) => request(`/users/${userId}/follow`, { method: "POST" }),
  unfollow: (userId) => request(`/users/${userId}/follow`, { method: "DELETE" }),
  following: () => request("/users/following"),
  getProfile: (userId) => request(`/users/${userId}`),

  // recommendations
  recommendations: () => request("/recommendations"),
  recommendationDestinations: ({ offset = 0, limit = 8 } = {}) =>
    request(`/recommendations/destinations?offset=${offset}&limit=${limit}`),

  // geo
  geocode: (q, { type, lat, lng } = {}) => {
    const params = new URLSearchParams({ q });
    if (type) params.set("type", type);
    if (lat != null) params.set("lat", lat);
    if (lng != null) params.set("lng", lng);
    return request(`/geo/search?${params}`);
  },
  getRoute: (coords) => request(`/geo/route?coords=${encodeURIComponent(coords)}`),

  // planner (LiteAPI hotels/flights, Foursquare places, Ollama proxy)
  plannerPlaces: ({ q, lat, lng, type, sort, radius, limit }) => {
    const params = new URLSearchParams({ lat, lng, type: type || "restaurant" });
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    if (radius) params.set("radius", radius);
    if (limit) params.set("limit", limit);
    return request(`/planner/places?${params}`);
  },
  plannerHotels: ({ city, checkIn, checkOut, adults, lat, lng, countryCode, q }) => {
    const params = new URLSearchParams({ checkIn, checkOut, adults: adults || 1 });
    if (city) params.set("city", city);
    if (lat != null) params.set("lat", lat);
    if (lng != null) params.set("lng", lng);
    if (countryCode) params.set("countryCode", countryCode);
    if (q) params.set("q", q);
    return request(`/planner/hotels?${params}`);
  },
  plannerFlights: ({ origin, destination, date, returnDate, adults, nonStop, travelClass, maxPrice }) => {
    const params = new URLSearchParams({ origin, destination, date, adults: adults || 1 });
    if (returnDate) params.set("returnDate", returnDate);
    if (nonStop) params.set("nonStop", "true");
    if (travelClass) params.set("travelClass", travelClass);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return request(`/planner/flights?${params}`);
  },

  // upload
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("/upload", { method: "POST", body: fd, isForm: true });
  },
};
