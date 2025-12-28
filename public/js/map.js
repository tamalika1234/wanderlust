// Coordinates from backend
const coords = listingData.geometry.coordinates;
// coords = [lng, lat]

// Red marker icon
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create map
const map = L.map('map').setView(
  [coords[1], coords[0]], // lat, lng
  12
);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

//  USE redIcon here
L.marker([coords[1], coords[0]], { icon: redIcon })
  .addTo(map)
  .bindPopup(`
    <strong>${listingData.title}</strong><br>
    Exact location will be provided after booking
  `);

