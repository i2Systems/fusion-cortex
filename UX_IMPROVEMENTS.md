# UX Improvements - Holistic Codebase Review

This document outlines 10 key UX improvements identified through a comprehensive review of the codebase.

## 1. Replace Native `alert()` and `confirm()` with Custom Modals

**Status: ✅ DONE** — The codebase uses `useConfirm()` (from `lib/hooks/useConfirm.tsx`) and `ConfirmationModal` for all confirmations. Validation errors use `useToast()`. No native `alert()` or `confirm()` remain.

**Original Issue:** Native browser dialogs break the design system and are not accessible.

**Current State:**
- All confirmations use `useConfirm()` → `ConfirmationModal`
- Validation/errors use `useToast()` for non-blocking notifications

---

## 2. Improve Form Validation with Inline Feedback

**Status: ✅ DONE** — Inline validation added across key forms. Input component supports `errorMessage` prop for field-level feedback.

**Original Issue:** Form validation was inconsistent - some forms showed errors via toasts only.

**Current State:**
- `Input` component has `error` and `errorMessage` props for inline validation
- AddSiteModal, ZonesPanel, GroupsPanel, PeoplePanel, CreateFirmwareCampaignModal, EditDeviceModal all show inline error messages below invalid fields
- Errors clear when user corrects the field
- Validation runs on submit; errors display below fields

**Recommendation (completed):**
- Add inline validation messages below form fields
- Use the existing `Input` component's `error` prop consistently
- Show validation errors on blur, not just on submit
- Use toast notifications for submission errors, not alerts

---

## 3. Add Keyboard Shortcuts for Common Actions

**Issue:** Undo/redo functionality exists but requires clicking buttons. No keyboard shortcuts for power users.

**Impact:** Medium - Power users expect keyboard shortcuts for efficiency

**Current State:**
- Undo/redo buttons exist in `MapToolbar`
- `useUndoable` hook supports undo/redo
- No keyboard shortcuts (Cmd+Z/Cmd+Shift+Z)

**Recommendation:**
- Add global keyboard shortcut handler
- Cmd+Z / Ctrl+Z for undo
- Cmd+Shift+Z / Ctrl+Shift+Z for redo
- Cmd+S / Ctrl+S for save (with visual feedback)
- Escape to close modals (partially implemented)
- Add keyboard shortcut hints in tooltips

---

## 4. Standardize Save Feedback Across the Application

**Issue:** Inconsistent save feedback - some operations show toasts, others show custom DOM notifications, some show alerts.

**Impact:** Medium - Users don't know if their work is saved

**Examples:**
- `app/(main)/zones/page.tsx` - Creates custom DOM notification element
- `components/dashboard/AddSiteModal.tsx` - Uses toast notifications (good)
- Some operations have no feedback at all

**Recommendation:**
- Standardize on `useToast()` for all save operations
- Always show success toast after successful saves
- Show error toast if save fails
- Add "Saving..." state to buttons during async operations
- Consider adding a "Last saved" timestamp in relevant views

---

## 5. Add Loading States for All Async Operations

**Issue:** Some async operations show loading states, others don't, leaving users unsure if something is happening.

**Impact:** Medium - Users may click multiple times or think the app is frozen

**Examples:**
- `components/map/MapUpload.tsx` - Has good loading state with `isProcessing`
- `components/dashboard/AddSiteModal.tsx` - Has `isSubmitting` state
- Some mutations don't show loading states

**Recommendation:**
- Add `isLoading` prop to all async operations
- Use `Button` component's `isLoading` prop consistently
- Show skeleton loaders for data fetching
- Add loading indicators to list items during updates
- Disable interactive elements during async operations

---

## 6. Enhance Empty States with Actionable Guidance

**Issue:** Some empty states are good (e.g., `PanelEmptyState`), but others lack clear next steps or are too generic.

**Impact:** Medium - Users don't know what to do next

**Current Good Examples:**
- `components/shared/PanelEmptyState.tsx` - Well-designed component
- `components/faults/FaultList.tsx` - Good empty state with action button

**Areas for Improvement:**
- Some empty states don't have action buttons
- Some don't explain why the state is empty
- Missing contextual help or links to documentation

**Recommendation:**
- Always include a primary action button in empty states
- Add contextual help text explaining what the section does
- Link to relevant documentation or tutorials
- Show example data or previews when appropriate

---

## 7. Improve Destructive Action Confirmations

**Status: ✅ DONE** — All destructive actions use `useConfirm()` → `ConfirmationModal` with `variant="danger"`. No native `confirm()` remains.

**Original Issue:** Destructive actions need clear, accessible confirmations.

**Current State:**
- Firmware page, FaultDetailsPanel, AddSiteModal, lookup page, LibraryObjectModal all use `useConfirm()`
- Destructive actions use `variant="danger"` for clear visual distinction

**Recommendation (completed):**
- Replace all `confirm()` calls with `ConfirmationModal`
- Use `variant="danger"` for destructive actions
- Include clear descriptions of what will be deleted/affected
- Show count of items being deleted in bulk operations
- Add "Type to confirm" for critical actions (optional)

---

## 8. Improve Error Messages for Better User Understanding

**Issue:** Error messages are inconsistent - some are user-friendly, others are technical or generic.

**Impact:** Medium - Users can't fix problems if they don't understand the error

**Current State:**
- `lib/hooks/useErrorHandler.ts` - Good error parsing
- Some errors show technical messages
- Some errors don't provide actionable next steps

**Recommendation:**
- Always use `useErrorHandler` hook for error handling
- Provide actionable error messages (e.g., "Please check your internet connection" instead of "NetworkError")
- Include recovery suggestions in error messages
- Log technical details to console, show user-friendly messages in UI
- Add "Retry" buttons for transient errors

---

## 9. Add Progress Indicators for Long-Running Operations

**Issue:** Some operations (map upload, image processing) can take time but don't show progress.

**Impact:** Low-Medium - Users don't know how long operations will take

**Examples:**
- `components/map/MapUpload.tsx` - Shows loading spinner but no progress
- `components/dashboard/AddSiteModal.tsx` - Image compression has no progress indicator
- PDF processing operations have no progress feedback

**Recommendation:**
- Add progress bars for file uploads
- Show estimated time remaining for long operations
- Add percentage completion for image processing
- Use indeterminate progress for operations without known duration
- Allow cancellation of long-running operations

---

## 10. Enhance Keyboard Navigation and Accessibility

**Issue:** Keyboard navigation exists in some areas (map canvas, device lists) but is incomplete across the app.

**Impact:** Medium - Accessibility and power user experience

**Current State:**
- `components/map/MapCanvas.tsx` - Arrow keys for device navigation
- `components/lookup/DeviceList.tsx` - Arrow keys for list navigation
- `components/shared/FocusedModalTabs.tsx` - Good keyboard navigation
- `lib/hooks/useFocusTrap.ts` - Good focus trap implementation

**Areas for Improvement:**
- Not all lists support keyboard navigation
- Missing keyboard shortcuts for common actions
- Some modals don't trap focus properly
- Missing ARIA labels in some components

**Recommendation:**
- Add keyboard navigation to all lists (Arrow keys, Home, End)
- Add keyboard shortcuts for toolbar actions
- Ensure all modals properly trap focus
- Add ARIA labels to all interactive elements
- Add skip links for main content areas
- Test with screen readers

---

## Implementation Priority

1. **High Priority:**
   - Replace native alerts/confirms (#1)
   - Improve destructive action confirmations (#7)
   - Standardize save feedback (#4)

2. **Medium Priority:**
   - Form validation improvements (#2)
   - Loading states (#5)
   - Error message improvements (#8)
   - Keyboard shortcuts (#3)

3. **Lower Priority:**
   - Empty state enhancements (#6)
   - Progress indicators (#9)
   - Enhanced keyboard navigation (#10)

---

## Quick Wins

These can be implemented quickly with high impact:

1. **Replace all `alert()` with `useToast()`** - 1-2 hours
2. **Replace all `confirm()` with `ConfirmationModal`** - 2-3 hours
3. **Add keyboard shortcuts for undo/redo** - 1 hour
4. **Standardize save feedback to use toasts** - 2-3 hours

Total estimated time for quick wins: **6-9 hours**
