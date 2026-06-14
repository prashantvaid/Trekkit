/** External travel search URLs (no Amadeus required). */

function fmtSkyscanner(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y.slice(2)}${m}${d}`;
}

export function buildFlightLinks({ origin, destination, depart, returnDate, adults = 1 }) {
  const from = encodeURIComponent(origin.trim());
  const to = encodeURIComponent(destination.trim());
  const q = encodeURIComponent(
    `Flights from ${origin.trim()} to ${destination.trim()} on ${depart}${returnDate ? ` returning ${returnDate}` : ""}`
  );

  const links = [
    {
      id: "google-flights",
      title: "Google Flights",
      subtitle: "Compare airlines and prices",
      url: `https://www.google.com/travel/flights?q=${q}`,
    },
    {
      id: "kayak",
      title: "Kayak",
      subtitle: "Search deals across sites",
      url: returnDate
        ? `https://www.kayak.com/flights/${from}-${to}/${depart}/${returnDate}/${adults}adults`
        : `https://www.kayak.com/flights/${from}-${to}/${depart}/${adults}adults`,
    },
  ];

  const skyFrom = fmtSkyscanner(depart);
  const skyReturn = fmtSkyscanner(returnDate);
  if (skyFrom) {
    links.push({
      id: "skyscanner",
      title: "Skyscanner",
      subtitle: "Budget and multi-airline search",
      url: skyReturn
        ? `https://www.skyscanner.com/transport/flights/${from}/${to}/${skyFrom}/${skyReturn}/?adults=${adults}`
        : `https://www.skyscanner.com/transport/flights/${from}/${to}/${skyFrom}/?adults=${adults}`,
    });
  }

  return links;
}

export function buildHotelPriceLink({ city, checkIn, checkOut, adults = 1 }) {
  const place = encodeURIComponent(city.trim());
  const params = new URLSearchParams();
  params.set("q", `hotels in ${city.trim()}`);
  if (checkIn) params.set("checkin", checkIn);
  if (checkOut) params.set("checkout", checkOut);
  if (adults) params.set("adults", String(adults));
  return `https://www.google.com/travel/hotels/${place}?${params}`;
}

export function buildHotelViewLinks({ hotelName, city, checkIn, checkOut, adults = 2 }) {
  const label = `${hotelName || "hotel"} ${city || ""}`.trim();
  const query = encodeURIComponent(label);
  const googleParams = new URLSearchParams();
  googleParams.set("q", label);
  if (checkIn) googleParams.set("checkin", checkIn);
  if (checkOut) googleParams.set("checkout", checkOut);
  if (adults) googleParams.set("adults", String(adults));

  const bookingParams = new URLSearchParams();
  bookingParams.set("ss", label);
  if (checkIn) {
    bookingParams.set("checkin", checkIn);
    bookingParams.set("checkout", checkOut || checkIn);
  }

  return [
    {
      id: "google-hotels",
      title: "Google Hotels",
      subtitle: "Photos, reviews, and live rates",
      url: `https://www.google.com/travel/hotels/search?q=${query}&${googleParams}`,
    },
    {
      id: "booking",
      title: "Booking.com",
      subtitle: "Search this property",
      url: `https://www.booking.com/searchresults.html?${bookingParams}`,
    },
  ];
}

export function hotelItineraryNotes(hotel) {
  const meta = hotel?.meta || {};
  const parts = [];
  if (meta.checkIn && meta.checkOut) {
    parts.push(`${meta.checkIn} → ${meta.checkOut}`);
  }
  if (meta.roomName) parts.push(meta.roomName);
  if (meta.catalogOnly) parts.push("Check live rates on Google Hotels or Booking.com");
  return parts.join(" · ");
}

export function flightItineraryItem({ origin, destination, depart, returnDate }) {
  const title = `${origin.trim()} → ${destination.trim()}`;
  const subtitle = returnDate
    ? `${depart} – return ${returnDate}`
    : depart || "Dates TBD";
  return {
    type: "flight",
    title,
    subtitle,
    notes: "Book via Google Flights, Kayak, or Skyscanner.",
    meta: { source: "manual", origin, destination, depart, returnDate },
  };
}
