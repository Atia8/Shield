import type { SafetyMapProps } from "./types";

/**
 * Everything the map page needs to draw one frame. Sent to the page on every
 * prop change, so live positions move without reloading the map.
 */
export interface MapState {
  center: SafetyMapProps["center"];
  user: SafetyMapProps["userLocation"];
  markers: NonNullable<SafetyMapProps["markers"]>;
  circles: NonNullable<SafetyMapProps["circles"]>;
  path: NonNullable<SafetyMapProps["path"]>;
  span: number;
  follow: boolean;
  fitPoints: NonNullable<SafetyMapProps["fitPoints"]>;
}

export function toMapState(props: SafetyMapProps): MapState {
  return {
    center: props.center,
    user: props.userLocation ?? null,
    markers: props.markers ?? [],
    circles: props.circles ?? [],
    path: props.path ?? [],
    span: props.span ?? 0.02,
    follow: props.follow ?? false,
    fitPoints: props.fitPoints ?? [],
  };
}

/**
 * Self-contained Leaflet page with night-styled OpenStreetMap tiles. Needs no
 * Google Maps API key, so it renders the same in Expo Go, standalone builds
 * and on the web. The host calls `window.update(state)`; the page posts
 * "ready" once Leaflet has loaded.
 */
export const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #0B0F1A; }
  .leaflet-container { background: #0B0F1A; font-family: -apple-system, Roboto, sans-serif; }
  /* Night-mode streets to match the app; only tiles are filtered, pins keep their colours. */
  .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.85) saturate(0.5); }
  .leaflet-control-attribution { background: rgba(11,15,26,0.7) !important; color: #94A3B8; font-size: 9px; }
  .leaflet-control-attribution a { color: #94A3B8; }
  .leaflet-bar a { background: #161B2E; color: #fff; border-color: #2A3150; }
  .pin { width: 22px; height: 22px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
         border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); }
  .me { width: 16px; height: 16px; border-radius: 50%; background: #3B82F6; border: 3px solid #fff;
        box-shadow: 0 0 0 0 rgba(59,130,246,0.6); animation: pulse 2s infinite; }
  @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); } 70% { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
                     100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }
  .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: #161B2E; color: #fff; }
  .leaflet-popup-content { margin: 10px 12px; font-size: 13px; }
  .leaflet-popup-content small { color: #94A3B8; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  function post(msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
    else if (window.parent !== window) window.parent.postMessage(msg, "*");
  }
  if (!window.L) {
    document.body.innerHTML = '<p style="color:#94A3B8;font:13px sans-serif;text-align:center;margin-top:45%">Map needs an internet connection</p>';
    post("error");
  } else {
    var map = L.map("map", { zoomControl: false }).setView([23.8, 90.4], 7);
    // Key-free street tiles; if a source refuses us, fall back to the next one.
    var sources = [
      { url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
      { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles &copy; Esri" }
    ];
    var tiles = null, sourceIndex = -1;
    function useSource(i) {
      if (i >= sources.length) return;
      if (tiles) map.removeLayer(tiles);
      sourceIndex = i;
      var loaded = 0, failed = 0;
      tiles = L.tileLayer(sources[i].url, { maxZoom: 19, attribution: sources[i].attribution })
        .on("tileload", function () { loaded++; })
        .on("tileerror", function () { if (++failed >= 3 && loaded === 0 && sourceIndex === i) useSource(i + 1); })
        .addTo(map);
    }
    useSource(0);
    L.control.zoom({ position: "topright" }).addTo(map);

    var overlays = L.layerGroup().addTo(map);
    var pins = {};
    var firstView = true;
    var lastFit = "";

    function ll(p) { return [p.latitude, p.longitude]; }
    function popup(title, description) {
      var el = document.createElement("div");
      var b = document.createElement("b"); b.textContent = title; el.appendChild(b);
      if (description) { el.appendChild(document.createElement("br"));
        var s = document.createElement("small"); s.textContent = description; el.appendChild(s); }
      return el;
    }
    function boxAround(p, span) {
      return L.latLngBounds([p.latitude - span / 2, p.longitude - span / 2], [p.latitude + span / 2, p.longitude + span / 2]);
    }

    window.update = function (s) {
      // Circles, route and "you" dot are cheap to redraw.
      overlays.clearLayers();
      s.circles.forEach(function (c) {
        L.circle(ll(c.point), { radius: c.radiusMeters, color: c.color, weight: 1, opacity: 0.8, fillColor: c.color, fillOpacity: 0.3 }).addTo(overlays);
      });
      if (s.path.length > 1) {
        L.polyline(s.path.map(ll), { color: "#10B981", weight: 4, opacity: 0.85 }).addTo(overlays);
      }
      if (s.user) {
        if (s.user.accuracy && s.user.accuracy > 5) {
          L.circle(ll(s.user), { radius: s.user.accuracy, color: "#3B82F6", weight: 1, fillOpacity: 0.12, interactive: false }).addTo(overlays);
        }
        L.marker(ll(s.user), { icon: L.divIcon({ className: "", html: '<div class="me"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false, zIndexOffset: 1000 }).addTo(overlays);
      }

      // Pins are kept by id so an open popup survives live updates.
      var seen = {};
      s.markers.forEach(function (m) {
        seen[m.id] = true;
        var icon = L.divIcon({ className: "", html: '<div class="pin" style="background:' + m.color + '"></div>', iconSize: [22, 22], iconAnchor: [11, 26], popupAnchor: [0, -24] });
        if (pins[m.id]) { pins[m.id].setLatLng(ll(m.point)).setIcon(icon).setPopupContent(popup(m.title, m.description)); }
        else { pins[m.id] = L.marker(ll(m.point), { icon: icon }).bindPopup(popup(m.title, m.description)).addTo(map); }
      });
      Object.keys(pins).forEach(function (id) { if (!seen[id]) { map.removeLayer(pins[id]); delete pins[id]; } });

      // Camera: fit points of interest when they change, otherwise follow.
      var fitKey = s.fitPoints.map(function (p) { return p.latitude.toFixed(4) + "," + p.longitude.toFixed(4); }).join("|");
      if (fitKey && fitKey !== lastFit) {
        lastFit = fitKey;
        var bounds = L.latLngBounds(s.fitPoints.map(ll));
        if (s.fitPoints.length === 1) bounds = boxAround(s.fitPoints[0], s.span);
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 16, animate: !firstView });
        firstView = false;
      } else if (s.center && firstView) {
        map.fitBounds(boxAround(s.center, s.span), { animate: false });
        firstView = false;
      } else if (s.center && s.follow) {
        map.panTo(ll(s.center), { animate: true });
      }
    };
    post("ready");
  }
</script>
</body>
</html>`;
