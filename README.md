# Fusion / Cortex — Commissioning & Configuration UI

A web-based commissioning & configuration UI for large-scale retail lighting deployments (e.g., Walmart, American Eagle).

## 🎯 Purpose

Fusion/Cortex is:
- A setup, mapping, and rules platform
- A bridge between physical devices (fixtures, motion sensors, light sensors) and BACnet/BMS
- Optimized for remote commissioning at scale (thousands of devices, thousands of sites)

Fusion/Cortex is **not**:
- A lighting control dashboard
- An energy analytics/heatmap tool
- A BMS replacement
- A store manager "operations dashboard"

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **UI Components**: Custom components with design tokens
- **Canvas Rendering**: react-konva for map/blueprint visualization
- **API**: tRPC for type-safe API calls
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis (for future use)
- **Auth**: Auth.js (NextAuth) (to be configured)
- **Workers**: Node.js workers (for background tasks)

### Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main layout group
│   │   ├── discovery/     # Discovery section
│   │   ├── map/           # Map & Devices section
│   │   ├── zones/         # Zones section
│   │   ├── bacnet/        # BACnet Mapping section
│   │   ├── rules/         # Rules & Overrides section
│   │   ├── lookup/        # Device Lookup section
│   │   ├── faults/        # Faults / Health section
│   │   └── layout.tsx     # Main layout wrapper
│   ├── api/trpc/          # tRPC API route
│   ├── globals.css        # Design tokens & global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (Nav, TopBar, Panels)
│   └── map/               # Map visualization components
├── server/
│   └── trpc/              # tRPC setup & routers
│       ├── routers/       # Feature-specific routers
│       └── trpc.ts        # Base tRPC config
├── prisma/
│   └── schema.prisma      # Database schema
└── lib/                   # Shared utilities (to be added)
```

## 🎨 Design System

### Design Tokens

All design values are defined as CSS custom properties in `app/globals.css`. This enables:
- Easy theming (swap dark/light themes)
- Consistent spacing, colors, typography
- No hard-coded values in components

**Key Token Categories:**
- Colors (backgrounds, borders, text, primary, status)
- Spacing (4px base unit scale)
- Border radius
- Shadows (layered, modern)
- Typography (system fonts)
- Transitions
- Z-index layers

**AI Note**: Always use design tokens (`var(--color-primary)`) instead of hard-coded values. To change the theme, modify tokens in `globals.css`.

### Layout System

The app uses a **main + panel** system:

1. **Left Navigation** (80px wide, persistent)
   - Minimal icons only
   - Logo + product name at top
   - Navigation items with active states

2. **Top App Bar** (64px high)
   - Site/store selector
   - Global search (device/serial lookup)
   - User menu

3. **Main Content Area** (center, flexible)
   - Primary working surface per section
   - Scrollable when needed

4. **Right Context Panel** (384px wide, slide-in)
   - Device details
   - Zone properties
   - Rule preview
   - Controlled by section components

5. **Bottom Drawer** (collapsible)
   - Discovery status
   - Fault summary
   - Background tasks

## 📋 Core Features

### 1. Discovery
- Start/stop device discovery
- Progress tracking with counts
- Results as table and map
- Status in bottom drawer

### 2. Map & Devices
- Point cloud visualization over blueprint
- Color-coded by device type (fixtures, motion, light sensors)
- Zoom, pan, drag-select
- Layer toggles
- Device selection → right panel details

### 3. Zones
- Drag-select devices on map → create zone
- Name + color code zones
- Adjust membership with Ctrl-click
- Zones are the unit of control for BMS + rules

### 4. BACnet Mapping
- Table: Zone ↔ BACnet Object ID
- Inline editing of IDs
- Status: Connected / Error / Not Assigned
- Validation help in right panel

### 5. Rules & Overrides
- Alexa-style rule builder:
  - Trigger (motion, no motion, daylight, BMS)
  - Condition (zone, duration, threshold)
  - Action (set zones, dim, return to BMS)
- Override BMS checkbox + duration
- Human-readable preview in right panel

### 6. Device Lookup
- Search by device ID or serial number
- Map highlight of device location
- I2QR details: build date, CCT, warranty, parts list

### 7. Faults / Health
- Summary counts (missing, offline, duplicates)
- Click to see filtered device table
- Detailed device info in right panel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Redis (optional, for future caching)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/fusion_cortex"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma db push
   # Or use migrations:
   npx prisma migrate dev
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Database Management

- **Generate Prisma Client**: `npm run db:generate`
- **Push schema changes**: `npm run db:push`
- **Open Prisma Studio**: `npm run db:studio`
- **Create migration**: `npm run db:migrate`

## 🔧 Development Notes

### For AI Assistants (Cursor, etc.)

**File Organization:**
- Each section has its own route under `app/(main)/[section]/`
- Layout components are in `components/layout/`
- tRPC routers are organized by feature in `server/trpc/routers/`
- Design tokens are centralized in `app/globals.css`

**Adding New Features:**
1. Create route in `app/(main)/[feature]/page.tsx`
2. Add navigation item in `components/layout/MainNav.tsx`
3. Create tRPC router in `server/trpc/routers/[feature].ts`
4. Add router to `server/trpc/routers/_app.ts`
5. Update Prisma schema if needed

**Styling Guidelines:**
- Always use design tokens (`var(--color-primary)`)
- Use Tailwind for layout utilities
- Custom components use `.fusion-*` classes when needed
- Avoid inline styles except for dynamic values

**tRPC Usage:**
- All API calls go through tRPC for type safety
- Routers are organized by feature domain
- Use Zod for input validation
- Superjson handles Date/Map/Set serialization

### Code Style

- TypeScript strict mode enabled
- React Server Components by default, `'use client'` when needed
- Functional components with hooks
- Plain language, no jargon (per UX brief)

## 📝 TODO / Roadmap

### Immediate
- [ ] Implement tRPC procedures with Prisma queries
- [ ] Add device discovery logic
- [ ] Implement map canvas with blueprint upload
- [ ] Add zone creation/editing
- [ ] Build rule engine
- [ ] Configure Auth.js

### Future
- [ ] Blueprint import (PDF/DXF/SVG)
- [ ] Blueprint alignment tools (scale, translate, rotate)
- [ ] Real-time device status updates
- [ ] Export functionality (CSV/Excel)
- [ ] Background task queue (Redis + workers)
- [ ] Multi-tenant support

## 🎯 Non-Goals

**Do not implement:**
- Energy savings charts
- Heatmaps / occupancy maps
- Analytics dashboards for store managers
- Legacy spec content about energy/analytics beyond what's defined

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io)
- [Prisma Documentation](https://www.prisma.io/docs)
- [react-konva Documentation](https://konvajs.org/docs/react/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

[Your License Here]

---

**Built with ❤️ for large-scale retail lighting deployments**

