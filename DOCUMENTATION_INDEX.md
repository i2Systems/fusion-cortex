# Documentation Index

> **Purpose**: Central navigation hub for all project documentation.  
> **For AI Assistants**: Start here to understand the documentation structure.

This index helps you quickly find the right documentation for your needs.

## 🚀 Quick Start

**New to the project?** Start here:
1. [README.md](./README.md) - Project overview and getting started
2. [AI_NOTES.md](./AI_NOTES.md) - AI-specific patterns and quick reference
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and data flow

## 📚 Documentation by Category

### Core Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](./README.md) | Project overview, features, getting started | Everyone |
| [AI_NOTES.md](./AI_NOTES.md) | AI assistant patterns, common code examples | AI Assistants |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data flow, patterns | Developers |

### Setup & Configuration

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [LOCAL_DB_SETUP.md](./LOCAL_DB_SETUP.md) | Local Docker database setup | First-time setup |
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Supabase cloud database & storage | Production setup |
| [SEEDING.md](./SEEDING.md) | Database seeding with demo data | After database setup |
| [EXPORT_DATA.md](./EXPORT_DATA.md) | Exporting zones/devices as seed data | Before deployment |

### Deployment

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment guide | Deploying to production |

### UX & Design

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md) | First UX review - 10 improvements | Planning UX work |
| [UX_IMPROVEMENTS_V2.md](./UX_IMPROVEMENTS_V2.md) | Second UX review - 10 more improvements | Planning UX work |

### Component Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| [app/styles/README.md](./app/styles/README.md) | Theme system architecture | `app/styles/` |
| [components/stories/README.md](./components/stories/README.md) | Storybook component stories | `components/stories/` |
| [lib/types/README.md](./lib/types/README.md) | Type system documentation | `lib/types/` |

### Quick Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [CODEBASE_QUICK_REFERENCE.md](./CODEBASE_QUICK_REFERENCE.md) | File locations and common patterns | Quick lookup |

## 🎯 Common Tasks → Documentation

### "I want to..."

- **Set up the project locally** → [README.md](./README.md) → [LOCAL_DB_SETUP.md](./LOCAL_DB_SETUP.md)
- **Deploy to production** → [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Understand the architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Add a new feature** → [AI_NOTES.md](./AI_NOTES.md) → "Common Patterns"
- **Set up Supabase** → [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- **Seed demo data** → [SEEDING.md](./SEEDING.md)
- **Understand state management** → [ARCHITECTURE.md](./ARCHITECTURE.md) → "State Management"
- **Find UX improvements** → [UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md) + [UX_IMPROVEMENTS_V2.md](./UX_IMPROVEMENTS_V2.md)

## 🤖 For AI Assistants

**Start here:**
1. Read [AI_NOTES.md](./AI_NOTES.md) first - contains critical patterns and rules
2. Reference [README.md](./README.md) for project context
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

**Key Patterns:**
- **State Management**: Use Zustand stores (`lib/stores/`) + hooks (`lib/hooks/use*.ts`)
- **Legacy Code**: Context files (`*Context.tsx`) are deprecated but kept for compatibility
- **Design Tokens**: Always use `var(--color-*)` from `app/globals.css`
- **Site-Aware**: All data is site-scoped via `activeSiteId`

**Common File Locations:**
- Stores: `lib/stores/*Store.ts`
- Sync Hooks: `lib/stores/use*Sync.ts`
- Data Hooks: `lib/hooks/use*.ts`
- Pages: `app/(main)/[section]/page.tsx`
- Components: `components/[feature]/`
- tRPC Routers: `server/trpc/routers/[feature].ts`

## 📝 Documentation Standards

All documentation files should:
- ✅ Include an "AI Note" header explaining purpose
- ✅ Have a table of contents for files > 200 lines
- ✅ Cross-reference related documents
- ✅ Mark deprecated patterns clearly (⚠️)
- ✅ Use consistent formatting and structure
- ✅ Include code examples where helpful

## 🔄 Documentation Updates

When updating documentation:
1. Update the relevant document
2. Update this index if structure changes
3. Check cross-references are still valid
4. Mark deprecated patterns clearly
5. Add "AI Note" headers for clarity

---

**Last Updated**: 2025-01-26  
**Maintained By**: Development team + AI assistants
