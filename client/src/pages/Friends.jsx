import { useEffect, useState } from "react";
import { api } from "../api.js";
import PersonCard from "../components/PersonCard.jsx";

export default function Friends() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [following, setFollowing] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [searching, setSearching] = useState(false);

  function loadFollowing() {
    api.following().then(({ users }) => setFollowing(users)).catch(() => {});
  }
  function loadSuggested() {
    api.recommendations().then((d) => setSuggested(d.people || [])).catch(() => {});
  }

  useEffect(() => {
    loadFollowing();
    loadSuggested();
  }, []);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return setResults(null);
    setSearching(true);
    try {
      const { users } = await api.searchUsers(query);
      setResults(users);
    } finally {
      setSearching(false);
    }
  }

  async function toggle(u) {
    const willFollow = !u.following;
    // optimistic update across every list the user might appear in
    const apply = (list) => list.map((x) => (x.id === u.id ? { ...x, following: willFollow } : x));
    setResults((r) => (r ? apply(r) : r));
    setSuggested(apply);
    try {
      if (willFollow) await api.follow(u.id);
      else await api.unfollow(u.id);
    } catch {
      setResults((r) => (r ? apply(r) : r));
      setSuggested(apply);
    }
    loadFollowing();
  }

  return (
    <div className="page friends">
      <div className="friends-container">
        <div className="page-head">
          <h1>Friends</h1>
          <p className="muted">Find travelers, follow their journeys, and discover people who share your vibe.</p>
        </div>

        <form className="friend-search" onSubmit={search}>
          <span className="friend-search-icon">🔍</span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setResults(null);
            }}
            placeholder="Search travelers by username"
          />
          <button className="btn-primary" disabled={searching}>{searching ? "…" : "Search"}</button>
        </form>

        {results !== null && (
          <section className="friends-section">
            <div className="rec-section-head">
              <div>
                <h2>Search results</h2>
                <p className="rec-sub muted">{results.length} traveler{results.length === 1 ? "" : "s"} found</p>
              </div>
            </div>
            {results.length === 0 ? (
              <div className="card empty-state"><p className="muted">No travelers found for “{query}”.</p></div>
            ) : (
              <div className="people-grid">
                {results.map((u) => <PersonCard key={u.id} u={u} onToggle={toggle} />)}
              </div>
            )}
          </section>
        )}

        {suggested.length > 0 && (
          <section className="friends-section">
            <div className="rec-section-head">
              <div>
                <h2>Suggested travelers</h2>
                <p className="rec-sub muted">People who share your interests — follow them for inspiration.</p>
              </div>
              <span className="rec-hint">Scroll to browse →</span>
            </div>
            <div className="people-scroller">
              {suggested.map((u) => <PersonCard key={u.id} u={u} onToggle={toggle} />)}
            </div>
          </section>
        )}

        <section className="friends-section">
          <div className="rec-section-head">
            <div>
              <h2>Following</h2>
              <p className="rec-sub muted">{following.length} traveler{following.length === 1 ? "" : "s"} you follow</p>
            </div>
          </div>
          {following.length === 0 ? (
            <div className="card empty-state">
              <p className="muted">You're not following anyone yet — search above or check your suggestions.</p>
            </div>
          ) : (
            <div className="people-grid">
              {following.map((u) => <PersonCard key={u.id} u={{ ...u, following: true }} onToggle={toggle} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
