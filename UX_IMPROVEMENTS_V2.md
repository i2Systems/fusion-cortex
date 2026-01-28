# UX Improvements - Second Holistic Review

This document outlines 10 additional UX improvements identified through a deeper analysis of user flows, interactions, and system behavior.

## 1. Add Visual Feedback When Switching Sites

**Issue:** When users switch sites via the dropdown in `PageTitle`, there's no loading state or feedback. The context switches silently, which can be disorienting, especially if data is still loading.

**Impact:** Medium-High - Users may not realize the context has changed or may think the app is frozen

**Current State:**
- Site switching happens in `PageTitle.tsx` via `setActiveSite()`
- No loading indicator during site switch
- No toast notification confirming the switch
- Data contexts reload automatically but silently

**Recommendation:**
- Show a brief loading overlay or skeleton when switching sites
- Display a toast notification: "Switched to [Site Name]"
- Add a subtle animation to indicate context change
- Preserve scroll position and selections where appropriate
- Show a "Switching sites..." indicator in the status bar

**Files to Update:**
- `components/layout/PageTitle.tsx`
- `lib/SiteContext.tsx`

---

## 2. Improve Search Consistency and Discoverability

**Issue:** Search functionality is implemented differently across pages. Some use `SearchIsland`, others have inline search, and the search behavior varies (fuzzy vs. exact match, different fields searched).

**Impact:** Medium - Users expect consistent search behavior across the app

**Current State:**
- `SearchIsland` component exists but isn't used consistently
- Map page has search in `SearchIsland`
- Lookup page has its own search implementation
- Rules page uses different search logic
- Some pages have no search at all

**Recommendation:**
- Standardize on `SearchIsland` component across all pages
- Use consistent fuzzy search algorithm everywhere
- Add search shortcuts (Cmd+K / Ctrl+K) to open search
- Show search results count: "Found 12 devices matching 'abc'"
- Add search history/autocomplete consistently
- Highlight search terms in results

**Files to Update:**
- All page components to use `SearchIsland`
- `lib/fuzzySearch.ts` - ensure consistent usage
- `components/layout/SearchIsland.tsx` - add keyboard shortcut

---

## 3. Enhance Mobile/Tablet Experience

**Issue:** While responsive design exists, mobile interactions could be improved. Touch targets, gestures, and mobile-specific UX patterns need refinement.

**Impact:** Medium - Affects users on tablets and mobile devices

**Current State:**
- `ResizablePanel` has mobile detection and collapses by default
- Touch targets are set to 44px minimum
- Some interactions may be difficult on small screens
- Context panel slides in on mobile but may be hard to dismiss

**Recommendation:**
- Add swipe gestures to dismiss panels/drawers on mobile
- Improve touch feedback (haptic-like visual feedback)
- Add pull-to-refresh for data lists
- Optimize modal sizes for mobile screens
- Add bottom sheet pattern for mobile actions
- Improve drag-and-drop for touch devices (long-press to start)
- Add mobile-specific navigation patterns

**Files to Update:**
- `components/layout/ResizablePanel.tsx`
- `components/layout/ContextPanel.tsx`
- `components/layout/BottomDrawer.tsx`
- Add mobile gesture handlers

---

## 4. Add Auto-Save Indicators and Persistence Feedback

**Issue:** Users don't know when their work is being saved automatically. Some operations auto-save (zones, devices), but there's no visual feedback.

**Impact:** Medium - Users may worry about losing work or may not realize changes are saved

**Current State:**
- Zones and devices save to localStorage automatically
- Some operations save to database via tRPC
- No "Saving..." or "Saved" indicators
- No indication of unsaved changes

**Recommendation:**
- Add a subtle "Saving..." indicator in the status bar during saves
- Show "Saved" confirmation briefly after successful save
- Add "Unsaved changes" indicator when there are pending changes
- Show last saved timestamp in relevant views
- Add visual distinction between auto-saved and manually saved states
- Consider adding a "Save" button for manual saves (even if auto-save exists)

**Files to Update:**
- `components/layout/BottomDrawer.tsx` - add save status
- `app/(main)/zones/page.tsx` - add save indicators
- `app/(main)/map/page.tsx` - add save indicators
- Create `useAutoSave` hook for consistent behavior

---

## 5. Improve Context Panel Behavior and Discoverability

**Issue:** The context panel (right side panel) behavior is inconsistent. On some pages it's always visible, on others it only appears when something is selected. Users may not realize it exists or how to use it.

**Impact:** Medium - Users may miss important details or actions

**Current State:**
- `ContextPanel` component exists but seems underutilized
- Some pages use `ResizablePanel` instead
- Panel visibility logic varies by page
- No clear indication when panel has content

**Recommendation:**
- Add a subtle indicator when panel has content (badge, glow)
- Add keyboard shortcut to toggle panel (Cmd+B / Ctrl+B)
- Show panel preview/teaser when collapsed
- Add animation to draw attention when panel content changes
- Standardize panel behavior across all pages
- Add "Close panel" tooltip on first use
- Show panel state in URL or localStorage for persistence

**Files to Update:**
- `components/layout/ContextPanel.tsx`
- `components/layout/ResizablePanel.tsx`
- All pages using context panels

---

## 6. Persist Filter and View State Across Sessions

**Issue:** When users set filters, change view modes, or adjust panel widths, these preferences are lost when they refresh or return to the page.

**Impact:** Medium - Users have to reconfigure their preferred view every time

**Current State:**
- `ResizablePanel` saves width to localStorage (good)
- Filter states are not persisted
- View mode toggles (list/map) are not persisted
- Search queries are not persisted

**Recommendation:**
- Save filter states to localStorage (site-scoped)
- Persist view mode preferences (list vs. map, etc.)
- Remember last selected items where appropriate
- Save search queries in recent searches (already exists but could be improved)
- Add "Reset to defaults" option for filters
- Show saved filter count badge

**Files to Update:**
- `app/(main)/map/page.tsx` - persist filters
- `app/(main)/faults/page.tsx` - persist category filters
- `app/(main)/rules/page.tsx` - persist type filters
- Create `usePersistedState` hook

---

## 7. Add Breadcrumb Navigation for Deep Contexts

**Issue:** When users drill into details (e.g., device → component → part), there's no breadcrumb trail. Users can get lost in nested views.

**Impact:** Low-Medium - Affects navigation in complex views

**Current State:**
- `Breadcrumb` component exists in `components/shared/Breadcrumb.tsx`
- Not used consistently across the app
- Focused modals don't show breadcrumbs
- No indication of navigation depth

**Recommendation:**
- Add breadcrumbs to focused modals showing: Page > Item > Sub-item
- Show breadcrumbs in context panels when viewing nested data
- Make breadcrumbs clickable to navigate back
- Add keyboard shortcut (Cmd+Up / Ctrl+Up) to go up one level
- Show current location in page title area

**Files to Update:**
- `components/shared/FocusedObjectModal.tsx`
- `components/shared/ComponentModal.tsx`
- `components/lookup/DeviceFocusedContent.tsx`
- `components/layout/PageTitle.tsx`

---

## 8. Standardize Tooltip Usage and Improve Information Architecture

**Issue:** Tooltips are used inconsistently. Some buttons have helpful tooltips, others don't. Some information is only available in tooltips, making it hard to discover.

**Impact:** Low-Medium - Users may not discover features or understand controls

**Current State:**
- Map canvas has tooltips on hover (good)
- Some toolbar buttons have `title` attributes
- Not all interactive elements have tooltips
- No consistent tooltip component or pattern

**Recommendation:**
- Create a standardized `Tooltip` component
- Add tooltips to all icon-only buttons
- Add tooltips explaining what filters do
- Show keyboard shortcuts in tooltips
- Add "What's this?" help tooltips for complex features
- Use tooltips for truncated text (show full text on hover)
- Add tooltip delay to prevent accidental triggers

**Files to Update:**
- Create `components/ui/Tooltip.tsx`
- Update all icon buttons to use tooltip component
- `components/map/MapToolbar.tsx`
- `components/zones/ZoneToolbar.tsx`

---

## 9. Improve Drag and Drop Visual Feedback

**Issue:** While drag and drop works, the visual feedback could be more polished. Users may not always know what's draggable or where they can drop.

**Impact:** Low-Medium - Affects discoverability and confidence in drag operations

**Current State:**
- Drag and drop works on map canvas and device palette
- Some visual feedback exists (opacity, scale changes)
- Drop zones may not be clearly indicated
- No preview of what will happen on drop

**Recommendation:**
- Add "grab" cursor on draggable elements
- Show drop zone highlights more prominently
- Add ghost/preview image while dragging
- Show count of items being dragged
- Add drop zone indicators (dashed borders, glow)
- Show what action will occur on drop (tooltip: "Drop to add to zone")
- Add haptic-like feedback on successful drop
- Prevent accidental drags (require slight movement before drag starts)

**Files to Update:**
- `components/map/DevicePalette.tsx`
- `components/map/MapCanvas.tsx`
- `components/zones/ZonesListView.tsx`
- `app/styles/themes/dark.css` - enhance drag styles

---

## 10. Add Undo/Redo Visual Feedback and History

**Issue:** Undo/redo functionality exists but users may not realize it's available or what actions can be undone. No visual history or indication of what will be undone.

**Impact:** Low-Medium - Users may not use undo/redo or may be unsure about it

**Current State:**
- Undo/redo buttons exist in `MapToolbar`
- `useUndoable` hook provides undo/redo functionality
- No indication of what action will be undone
- No undo history visualization
- No keyboard shortcuts shown

**Recommendation:**
- Add tooltip showing what action will be undone: "Undo: Move 3 devices"
- Show undo/redo history in a dropdown (optional, advanced)
- Add visual feedback when undo/redo is performed (brief highlight)
- Show keyboard shortcuts in tooltips (Cmd+Z / Cmd+Shift+Z)
- Disable buttons with better visual feedback (not just opacity)
- Add "Can't undo" message when history is empty
- Consider adding undo/redo to more areas (not just map)

**Files to Update:**
- `components/map/MapToolbar.tsx`
- `lib/hooks/useUndoable.ts` - add action descriptions
- Add undo/redo to other pages where applicable

---

## Implementation Priority

1. **High Priority:**
   - Site switching feedback (#1)
   - Auto-save indicators (#4)
   - Search consistency (#2)

2. **Medium Priority:**
   - Context panel improvements (#5)
   - Filter persistence (#6)
   - Mobile enhancements (#3)

3. **Lower Priority:**
   - Breadcrumb navigation (#7)
   - Tooltip standardization (#8)
   - Drag feedback improvements (#9)
   - Undo/redo enhancements (#10)

---

## Quick Wins

These can be implemented quickly with high impact:

1. **Add site switch toast notification** - 30 minutes
2. **Add "Saving..." indicator to zones page** - 1 hour
3. **Add keyboard shortcut (Cmd+K) for search** - 1 hour
4. **Persist filter states to localStorage** - 2 hours

Total estimated time for quick wins: **4.5 hours**

---

## Cross-Cutting Improvements

These improvements would benefit multiple areas:

1. **Create `usePersistedState` hook** - Reusable for filters, view modes, etc.
2. **Create standardized `Tooltip` component** - Use everywhere for consistency
3. **Add `useAutoSave` hook** - Consistent auto-save behavior with indicators
4. **Create `useKeyboardShortcut` hook** - Easy keyboard shortcut management
