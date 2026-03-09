# 🌿 Arborea EcoSense

> **Real-time IoT monitoring platform for green areas** — built with Next.js 15, Supabase, and Arduino sensors.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?style=flat-square&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38BDF8?style=flat-square&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)

---

## 📖 About

**Arborea EcoSense** is a full-stack IoT monitoring solution developed by [Arborea Inovações](https://github.com/marcosafns). It connects Arduino-based sensor stations to a modern web dashboard, enabling real-time tracking of environmental variables in parks, urban forests, gardens, and green infrastructure.

The platform collects data from up to 8 sensor types per station and presents it through an interactive dashboard with live charts, anomaly detection, smart alerts, and automated reports.

---

## ✨ Features

- 🔴 **Real-time monitoring** — live sensor readings via Supabase Realtime
- 📊 **Interactive charts** — historical data with 1h / 6h / 24h / 7d range selector
- 🔀 **Sensor comparison** — overlay multiple sensors in a single normalized chart
- 🚨 **Smart alerts** — automatic anomaly detection with severity levels
- 🗺️ **Station map** — Leaflet-powered map with station markers and status
- 📋 **Reports** — weekly/monthly summaries with trend analysis
- 📤 **Export** — download data as CSV or PDF
- 🔔 **Notifications** — real-time alert bell with unread count
- ⚙️ **Settings** — profile, notification preferences, appearance, password change
- 🔐 **Auth** — Supabase Auth with email confirmation
- 📱 **Responsive** — works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + inline styles |
| UI Components | shadcn/ui + Radix UI |
| Animations | Motion (motion/react) |
| Charts | Recharts |
| Maps | Leaflet + react-leaflet |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Fonts | Syne (display) · DM Sans (body) · Geist Mono (values) |
| Package Manager | pnpm |
| Deployment | Vercel |

---

## 🌡️ Monitored Variables

| Sensor | Unit | Description |
|--------|------|-------------|
| Temperature | °C | Ambient air temperature |
| Air Humidity | % | Relative humidity |
| Soil Humidity | % | Soil moisture content |
| Luminosity | lux | Light intensity |
| pH | — | Soil acidity level |
| CO₂ | ppm | Carbon dioxide concentration |
| Wind Speed | km/h | Anemometer reading |
| Rainfall | mm | Precipitation accumulation |

---

## 🗂️ Project Structure

```
arborea-ecosense/
├── app/
│   ├── (public)/              # Landing page (Hero, Pricing, Testimonials…)
│   ├── (private)/
│   │   └── dashboard/
│   │       ├── page.tsx       # Overview — sensor cards + realtime
│   │       ├── charts/        # Historical charts + sensor comparison
│   │       ├── stations/      # Station list + detail view + map
│   │       ├── alerts/        # Alert log with filters
│   │       ├── reports/       # Weekly/monthly reports
│   │       ├── settings/      # Profile, notifications, account
│   │       └── components/    # Sidebar, Topbar, SensorChart, Toast…
│   ├── onboarding/            # 5-step onboarding flow
│   ├── login/                 # Auth page (sign in + sign up)
│   └── api/
│       └── delete-account/    # Server-side account deletion
├── lib/
│   └── supabase/              # Client, server, and type helpers
├── components/                # Public site components
├── constants/                 # Nav links, site metadata, pricing
└── simulator/                 # Arduino data simulator (local use only)
```

---

## 🗄️ Database Schema

```sql
plans            — subscription tiers (Semente, Broto, Floresta, Ecossistema)
clients          — user profiles linked to auth.users
stations         — monitoring stations with GPS coordinates
sensors          — sensor definitions per station
readings         — time-series sensor data (Realtime enabled)
alerts           — anomaly and threshold alerts (Realtime enabled)
station_groups   — grouping of stations
```

---


## 📄 License

MIT © [Arborea Inovações](https://github.com/marcosafns)

---

<p align="center">
  Built with 🌿 by <a href="https://github.com/marcosafns">Arborea Inovações</a>
</p>