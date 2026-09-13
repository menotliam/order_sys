# Super Admin UI/UX Refinement & Operations Dashboard Bug Fix

This plan addresses both the architectural UI/UX polish across the Super Admin dashboard (based on our `/grill-me` alignment) and the critical infinite loop bug on the Operations Dashboard.

## Goal
- Refine the Admin dashboard to have a softer, more premium "tactical" aesthetic (glassmorphism, fewer harsh borders, spacious layout).
- Convert central popups into right-side slide-out Sheets (Drawers) to maintain dashboard context when inspecting data.
- Resolve the infinite loop of POST requests to `getOperationsOverviewAction()` on the `/admin/operations` page.

## User Review Required
> [!IMPORTANT]
> Please review the proposed changes below. Once approved, I will execute these updates.

## Open Questions
None at this moment. The direction has been clearly established from the `/grill-me` session.

## Proposed Changes

---

### UI/UX Refinement: Softened Grid & Right-Side Sheets

#### [MODIFY] `src/app/admin/page.tsx`
- **Layout & Borders**: Remove unnecessary rigid borders (`border-[#333333]`) from panels and log rows. Utilize `bg-[#141414]` and `bg-[#1A1A1A]` with subtle glassmorphic styling and extra padding to separate content blocks naturally.
- **Data Inspector Modal**: Modify the `<Drawer.Root>` from Vaul to use `direction="right"`. Adjust the `<Drawer.Content>` classes to anchor it to the right edge (`fixed inset-y-0 right-0 w-[450px] h-full`), transforming it from a centered popup into a professional command center Sheet. Add a subtle backdrop blur.

#### [MODIFY] `src/app/admin/operations/page.tsx`
- **Layout & Borders**: Apply the same softened structural styling to the top KPI matrix, cashflow chart panel, and the tactical node map.
- **Table Control Modal**: Convert the table unlocking modal into a right-side Sheet (`direction="right"`), matching the design language of the main dashboard.

---

### Bug Fix: Operations Dashboard Infinite Loop

#### [MODIFY] `src/app/admin/operations/page.tsx`
- **Root Cause Analysis**: The infinite loop is caused by a state synchronization anti-pattern. Currently, `selectedTable` stores a full object. When `loadData()` fetches new background data, it attempts to manually sync `selectedTable` with the new object reference (`setSelectedTable(updated)`). This manual sync during a `useTransition` causes React and the Vaul Drawer to enter a continuous re-render and unmount loop (due to Vaul's layout shift detection firing `onOpenChange`).
- **Fix**: Replace the duplicated `selectedTable` object state with a simple `selectedTableId` string state.
- **Implementation**: 
  - Change `useState<CafeTable | null>(null)` to `useState<string | null>(null)`.
  - Derive the selected table during render: `const selectedTable = tables.find(t => t.id === selectedTableId) || null;`.
  - Remove `selectedTableRef` and the manual `setSelectedTable(updated)` synchronization logic entirely from `loadData`.
  - This guarantees a single source of truth and completely eliminates the loop.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. Navigate to `/admin/operations` and click on a table node. Verify that the right-side Sheet opens smoothly and no infinite loop or freezing occurs.
2. Wait for the 5-second polling interval and verify that the Drawer stays open and updates its internal data without flickering or looping.
3. Check `/admin` to verify that the JSON Inspector opens as a right-side Sheet and that the overall layout feels softer and more premium.
