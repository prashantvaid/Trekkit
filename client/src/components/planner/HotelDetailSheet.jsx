import BottomSheet from "./BottomSheet.jsx";
import { buildHotelViewLinks } from "../../planner/travelLinks.js";
import { formatActivityPrice } from "../../planner/plannerModel.js";

function formatStayDates(checkIn, checkOut) {
  if (!checkIn) return null;
  try {
    const fmt = (iso) =>
      new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    if (!checkOut || checkOut === checkIn) return fmt(checkIn);
    return `${fmt(checkIn)} – ${fmt(checkOut)}`;
  } catch {
    return `${checkIn} – ${checkOut || ""}`;
  }
}

export default function HotelDetailSheet({
  open,
  onClose,
  hotel,
  cityName,
  checkIn,
  checkOut,
  adults = 2,
  onAddToItinerary,
  addLabel = "Add to itinerary",
}) {
  if (!hotel) return null;

  const meta = hotel.meta || {};
  const stayCheckIn = checkIn || meta.checkIn;
  const stayCheckOut = checkOut || meta.checkOut;
  const stayCity = cityName || meta.cityName || "";
  const nights = meta.nights || 1;
  const links = buildHotelViewLinks({
    hotelName: hotel.title,
    city: stayCity,
    checkIn: stayCheckIn,
    checkOut: stayCheckOut,
    adults,
  });
  const priceLabel = formatActivityPrice({ ...hotel, type: "hotel" });
  const stayDates = formatStayDates(stayCheckIn, stayCheckOut);
  const image = hotel.image || meta.images?.[0] || null;

  return (
    <BottomSheet open={open} onClose={onClose} title="Hotel details" tall>
      <div className="planner-hotel-detail">
        {image && (
          <div className="planner-hotel-detail-photo">
            <img src={image} alt="" loading="lazy" />
          </div>
        )}

        <div className="planner-hotel-detail-head">
          <h3>{hotel.title}</h3>
          {hotel.subtitle && <p className="muted small">{hotel.subtitle}</p>}
        </div>

        <div className="planner-hotel-detail-facts">
          {hotel.rating != null && (
            <span className="planner-hotel-detail-pill">★ {Number(hotel.rating).toFixed(1)}</span>
          )}
          {meta.stars && (
            <span className="planner-hotel-detail-pill">{meta.stars}★ hotel</span>
          )}
          {stayDates && (
            <span className="planner-hotel-detail-pill">{stayDates}</span>
          )}
          {nights > 0 && (
            <span className="planner-hotel-detail-pill">
              {nights} night{nights === 1 ? "" : "s"}
            </span>
          )}
        </div>

        <div className="planner-hotel-detail-price card">
          {priceLabel ? (
            <>
              <strong>{priceLabel}</strong>
              {meta.totalStayPrice != null && nights > 1 && (
                <span className="muted small">
                  {hotel.currency || "USD"} {Number(meta.totalStayPrice).toFixed(0)} total for {nights} nights
                </span>
              )}
            </>
          ) : (
            <>
              <strong>Rates unavailable for these dates</strong>
              <span className="muted small">Open a booking site below to see live nightly prices.</span>
            </>
          )}
          {meta.roomName && <span className="muted small">Room: {meta.roomName}</span>}
        </div>

        {meta.address && (
          <p className="planner-hotel-detail-address muted small">{meta.address}</p>
        )}

        <div className="planner-hotel-detail-links">
          <p className="planner-hotel-detail-links-label">Book or learn more</p>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="planner-hotel-detail-link card"
            >
              <span>
                <strong>{link.title}</strong>
                <span className="muted small">{link.subtitle}</span>
              </span>
              <span className="planner-hotel-detail-link-arrow" aria-hidden>↗</span>
            </a>
          ))}
        </div>

        {onAddToItinerary && (
          <button type="button" className="btn-secondary planner-hotel-detail-add" onClick={() => onAddToItinerary(hotel)}>
            {addLabel}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
