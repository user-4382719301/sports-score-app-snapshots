# Flight Notifier

A tiny static web app that fires a desktop notification whenever an aircraft
flies within a configurable radius of your current location.

It's a single-page PWA with no build step and no backend. Data comes from the
free [OpenSky Network](https://opensky-network.org/) public REST API.

## Run it

Because the page uses Geolocation, Notifications, and a service worker, it
must be served over HTTPS or `localhost` — opening `index.html` from disk
won't work.

```sh
cd flight-notifier
python3 -m http.server 8000
# then open http://localhost:8000
```

Or deploy the `flight-notifier/` directory to any static host (GitHub Pages,
Netlify, Vercel, Cloudflare Pages, etc.).

## How it works

1. The browser asks for geolocation and notification permission.
2. Every N seconds (default 30) the page queries OpenSky for all aircraft in
   a bounding box around you.
3. Each aircraft's true distance is computed via the haversine formula and
   filtered by your radius (default 15 km) and altitude bounds.
4. The first time a new flight enters range, a `Notification` fires. The
   flight is remembered for 15 minutes so you don't get re-notified on every
   poll.

## Settings

| Field         | Default | Notes                                            |
| ------------- | ------- | ------------------------------------------------ |
| Radius (km)   | 15      | Great-circle distance from your reported location. |
| Poll every (s)| 30      | OpenSky's anonymous rate limit is ~1 req / 10s.  |
| Min altitude  | —       | Useful to ignore helicopters / approaches.       |
| Max altitude  | —       | Useful to ignore high cruising flights.          |

Settings are stored in `localStorage`.

## Caveats

- Notifications only work while the page is open. True background push
  requires a push server (FCM/APNS), which is out of scope for a static app.
- OpenSky's coverage is great over Europe and most of North America; sparser
  elsewhere. Aircraft with broken or off ADS-B transponders won't appear.
- The anonymous OpenSky API is rate-limited. Don't poll faster than every
  10 seconds.
