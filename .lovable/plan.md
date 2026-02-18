

## Changes Overview

Two changes to the menu editor:

### 1. Replace "Export" with "Example Import Format"

In the SpreadsheetView component, the "Export" button will be changed to "Example Import" -- instead of exporting current menu data, it will download an empty Excel template showing the expected column format (Category, Subcategory, Name, Description, Price, etc.). This helps users understand the correct format before importing.

### 2. Remove "Table View" Toggle

The Table View toggle button will be removed from the EditorTopBar (both desktop and mobile layouts). The Import/Example Import buttons live inside the SpreadsheetView, so the table view will still be accessible if navigated to, but the toggle to switch between grid/table will be removed from the top bar.

---

### Technical Details

**File: `src/components/editor/SpreadsheetView.tsx`**
- Rename `handleExport` to `handleExampleImport`
- Change it to generate an empty template Excel file with correct column headers and 1-2 example rows showing expected data format
- Update button label from "Export" to "Example Import" on both desktop and mobile toolbars
- Change icon from `Download` to something like `FileDown` or keep `Download`

**File: `src/components/editor/EditorTopBar.tsx`**
- Remove the Table View/Grid View toggle button from the desktop layout (lines 660-679)
- Remove the "Switch to Table/Grid View" button from the mobile menu sheet (lines 518-530)
- Remove `Table2` from icon imports if no longer used
- Remove `viewMode` and `onViewModeChange` from props (or keep but unused)

**File: `src/pages/Editor.tsx`**
- Remove `viewMode` / `onViewModeChange` props from `EditorTopBar` usage (cleanup)
- The `viewMode` state and `SpreadsheetView` rendering can remain for now since the table is still accessible internally
