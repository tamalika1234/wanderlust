module.exports = function formatPrice(listing) {
  if (listing.country.trim().toLowerCase() === "india") {
    // India → show ₹
    return `₹ ${listing.price.toLocaleString("en-IN")}`;
  } else {
    // Other countries → show $
    return `$ ${listing.price.toLocaleString("en-US")}`;
  }
}
