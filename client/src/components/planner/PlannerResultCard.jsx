import { useState } from "react";
import { formatActivityPrice } from "../../planner/plannerModel.js";

export default function PlannerResultCard({ item, onSelect, actionLabel = "Add" }) {
  const images = item.meta?.images?.length
    ? item.meta.images
    : item.image
      ? [item.image]
      : [];
  const [photoIdx, setPhotoIdx] = useState(0);
  const [broken, setBroken] = useState(false);

  const current = images[photoIdx];
  const showImage = current && !broken;

  const isHotel = item.meta?.source === "liteapi";
  const priceLabel =
    item.price != null && item.meta?.source === "foursquare"
      ? "$".repeat(Math.min(Math.max(Number(item.price), 1), 4))
      : null;
  const hotelPrice = isHotel ? formatActivityPrice({ ...item, type: "hotel" }) : null;

  function handleImageError() {
    if (photoIdx < images.length - 1) {
      setPhotoIdx((i) => i + 1);
    } else {
      setBroken(true);
    }
  }

  return (
    <article className="planner-search-result card">
      <div className={`planner-search-result-photo${showImage ? "" : " planner-search-result-photo-empty"}`}>
        {showImage ? (
          <>
            <img
              src={current}
              alt=""
              className="planner-search-result-img"
              loading="lazy"
              onError={handleImageError}
            />
            {images.length > 1 && (
              <button
                type="button"
                className="planner-search-photo-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoIdx((i) => (i + 1) % images.length);
                  setBroken(false);
                }}
                aria-label="Next photo"
              >
                ›
              </button>
            )}
          </>
        ) : item.meta?.categories?.[0] ? (
          <span className="planner-search-photo-fallback">{item.meta.categories[0]}</span>
        ) : null}
      </div>
      <div className="planner-search-result-body">
        <strong>{item.title}</strong>
        {item.subtitle && <span className="muted small">{item.subtitle}</span>}
        <div className="planner-search-result-meta">
          {item.rating != null && <span className="planner-search-rating">★ {Number(item.rating).toFixed(1)}</span>}
          {priceLabel && <span className="planner-search-price-tier">{priceLabel}</span>}
          {item.meta?.categories?.length > 0 && (
            <span className="planner-search-tag">{item.meta.categories[0]}</span>
          )}
          {hotelPrice && <span className="planner-search-price">{hotelPrice}</span>}
          {!isHotel && item.price != null && (
            <span className="planner-search-price">
              {item.currency || "USD"} {Number(item.price).toFixed(0)}
            </span>
          )}
          {isHotel && item.price == null && item.meta?.catalogOnly && (
            <span className="planner-search-tag">View for rates</span>
          )}
        </div>
        {onSelect && (
          <button type="button" className="btn-primary planner-search-add-btn" onClick={() => onSelect(item)}>
            {actionLabel}
          </button>
        )}
      </div>
    </article>
  );
}
