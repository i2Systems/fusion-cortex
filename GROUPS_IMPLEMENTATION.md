# Groups Implementation Guide

## Overview

Groups now support **both People and Devices** with many-to-many relationships. This allows:
- People to be in multiple groups (e.g., "Management" + "Technicians")
- Devices to be in multiple groups (e.g., "Series A Lights" + "On Order")
- Filtering and layering by groups on maps and tables

## What's Been Implemented

### 1. Database Schema
- ✅ Added `GroupPerson` junction table for many-to-many between Group and Person
- ✅ Updated `Group` model to include `GroupPerson[]` relation
- ✅ Updated `Person` model to include `GroupPerson[]` relation

### 2. API Updates
- ✅ Group router now handles `personIds` in create/update operations
- ✅ Group queries return both `deviceIds` and `personIds`
- ✅ All CRUD operations support people assignment

### 3. Store Updates
- ✅ `Group` interface now includes `personIds: string[]`

## Migration Required

Run the migration to add the `GroupPerson` table:

```bash
# Option 1: Run the SQL file directly
psql -d your_database -f prisma/migrations/add_group_person.sql

# Option 2: Use Prisma migrate (interactive)
npx prisma migrate dev --name add_group_person
```

## Usage Examples

### Creating a Group with People and Devices

```typescript
const group = await trpc.group.create.mutate({
  name: "Management Team",
  description: "Store management personnel",
  color: "#4c7dff",
  siteId: activeSiteId,
  personIds: ["person-1", "person-2"], // People in the group
  deviceIds: ["device-1", "device-2"],  // Devices in the group (optional)
})
```

### Updating Group Membership

```typescript
await trpc.group.update.mutate({
  id: groupId,
  personIds: ["person-1", "person-2", "person-3"], // Update people
  deviceIds: ["device-1"], // Update devices
})
```

### Filtering by Groups

Groups can be used for filtering similar to how zones work. Here's how to add group filtering to the map:

## Adding Group Filtering to Map (Example)

### 1. Update MapFilters Interface

```typescript
// In components/map/MapFiltersPanel.tsx
export interface MapFilters {
  // ... existing filters
  selectedGroups: string[] // Add this
}
```

### 2. Add Group Filter Section to MapFiltersPanel

Add a "Groups" section similar to the "Zones" section:

```typescript
{/* Groups Filters Section */}
<div>
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-sm font-semibold text-[var(--color-text)]">Groups</h4>
    <div className="flex items-center gap-2">
      <button onClick={handleSelectAllGroups} className="text-xs text-[var(--color-primary)] hover:underline">
        Select All
      </button>
      <span className="text-[var(--color-text-muted)]">|</span>
      <button onClick={handleClearGroups} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:underline">
        Clear
      </button>
    </div>
  </div>
  <div className="space-y-1 max-h-48 overflow-y-auto">
    {availableGroups.map((group) => (
      <label key={group.id} htmlFor={`map-filter-group-${group.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--color-surface-subtle)] cursor-pointer transition-colors">
        <input
          id={`map-filter-group-${group.id}`}
          type="checkbox"
          checked={filters.selectedGroups.includes(group.id)}
          onChange={() => handleToggleGroup(group.id)}
          className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-primary)]"
        />
        <div className="w-3 h-3 rounded" style={{ backgroundColor: group.color }} />
        <span className="text-sm text-[var(--color-text)] flex-1">{group.name}</span>
      </label>
    ))}
  </div>
</div>
```

### 3. Filter Devices by Groups

In `app/(main)/map/page.tsx`, add group filtering to `filteredDevices`:

```typescript
// Get devices in selected groups
if (filters.selectedGroups.length > 0) {
  const groupDeviceIds = new Set<string>()
  groups
    .filter(g => filters.selectedGroups.includes(g.id))
    .forEach(g => g.deviceIds.forEach(id => groupDeviceIds.add(id)))
  
  filtered = filtered.filter(device => {
    // Always include unplaced devices
    if (device.x === undefined || device.y === undefined) return true
    return groupDeviceIds.has(device.id)
  })
}
```

### 4. Filter People by Groups

Similarly for people on the People map:

```typescript
if (filters.selectedGroups.length > 0) {
  const groupPersonIds = new Set<string>()
  groups
    .filter(g => filters.selectedGroups.includes(g.id))
    .forEach(g => g.personIds.forEach(id => groupPersonIds.add(id)))
  
  filteredPeople = filteredPeople.filter(person => 
    groupPersonIds.has(person.id)
  )
}
```

## Table Filtering Example

For table views (like device lookup, faults, etc.), add group filters:

```typescript
// In your table component
const filteredData = useMemo(() => {
  let filtered = data

  // Group filter
  if (selectedGroupIds.length > 0) {
    const groupIds = new Set<string>()
    groups
      .filter(g => selectedGroupIds.includes(g.id))
      .forEach(g => {
        // For devices
        g.deviceIds.forEach(id => groupIds.add(id))
        // For people
        g.personIds.forEach(id => groupIds.add(id))
      })
    
    filtered = filtered.filter(item => groupIds.has(item.id))
  }

  return filtered
}, [data, selectedGroupIds, groups])
```

## Group Types / Use Cases

Groups are flexible and can represent:

### People Groups
- **Roles**: Management, Technicians, Sales, Contractors
- **Teams**: Day Shift, Night Shift, Maintenance Crew
- **Departments**: Operations, IT, Facilities

### Device Groups
- **Status**: Broken, On Order, Installed, Pending
- **Series**: Series A Lights, Series B Lights
- **Location**: Front of Store, Back of Store, Parking Lot
- **Type**: Emergency Lights, Exit Signs, Task Lighting

### Mixed Groups
- **Projects**: "Store Remodel Q1" (includes both people and devices)
- **Assignments**: "John's Installation" (person + their assigned devices)

## Next Steps

1. **Run the migration** to add `GroupPerson` table
2. **Update UI components** to show/edit `personIds` in group forms
3. **Add group filtering** to map views (see examples above)
4. **Add group filtering** to table views
5. **Consider group-based layers** - show/hide groups as map layers (similar to zones)

## Architecture Notes

- Groups are **site-scoped** (like zones, devices, people)
- Groups support **many-to-many** for both people and devices
- Groups have a **color** property for visual distinction
- Groups can be used for **filtering, layering, and organization**
- Groups are **independent of zones** - a device can be in both a zone and multiple groups
