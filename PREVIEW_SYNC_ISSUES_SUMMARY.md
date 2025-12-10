# 🔥 PREVIEW SYNC ISSUES - QUICK SUMMARY

**Status:** ⚠️ Preview is NOT syncing with Live Menu for restaurant settings  
**Root Cause:** Inconsistent data sources and cache invalidation issues  

---

## 🎯 THE PROBLEM

When you change restaurant settings (Show Prices, Grid Columns, Layout Density, etc.):
- ✅ **Visual Editor** updates immediately
- ✅ **Preview** updates immediately  
- ❌ **Live Menu** shows OLD values (cached data)

**Result:** Preview and Live Menu look DIFFERENT even though they should be identical.

---

## 🔍 ROOT CAUSES

### Issue #1: Different Data Sources
- **Preview:** Uses `useRestaurantById()` for settings → Always fresh
- **Live Menu:** Uses `fullMenuData.restaurant` from RPC → Cached, can be stale

### Issue #2: Cache Invalidation Doesn't Work Properly
- Cache is invalidated, but RPC may return stale data
- localStorage cache adds another layer of staleness
- Race condition between invalidation and refetch

### Issue #3: Inconsistent Default Values
```typescript
// Preview Default
layoutDensity={restaurant?.layout_density || 'spacious'}

// Live Menu Default  
layoutDensity={restaurant.layout_density || 'compact'}
```
Different defaults = different appearance!

---

## 🔧 THE FIXES (In Order of Priority)

### 1. Use Same Data Source Everywhere ⚠️ CRITICAL
```typescript
// Editor.tsx - Change Preview to use fullMenuData.restaurant
<EditableDishes
  restaurant={fullMenuData?.restaurant || restaurant}  // ← Use fullMenuData first
/>
```

### 2. Standardize Default Values ⚠️ CRITICAL
```typescript
// Create lib/constants/menuDefaults.ts
export const MENU_DISPLAY_DEFAULTS = {
  layout_density: 'compact',  // ← Single source of truth
  grid_columns: 2,
  image_size: 'compact',
  // ...
};

// Use everywhere:
layoutDensity={restaurant?.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
```

### 3. Force Refetch After Settings Update 🔴 HIGH
```typescript
// useRestaurants.ts - useUpdateRestaurant onSuccess
await queryClient.refetchQueries({ 
  queryKey: ["full-menu", data.id],
  type: 'active',
});
```

### 4. Refresh on Preview Toggle 🟡 MEDIUM
```typescript
// Editor.tsx
onPreviewToggle={() => {
  if (newPreviewMode) {
    refetchFullMenu();  // ← Force fresh data
  }
  setPreviewMode(newPreviewMode);
}}
```

### 5. Remove localStorage Cache (Optional)
```typescript
// useFullMenu.ts - Simplify to just React Query
staleTime: 0,  // Always refetch
```

---

## 📊 WHAT'S CURRENTLY SYNCED vs NOT SYNCED

| Feature | Preview ↔ Live Menu |
|---------|:-------------------:|
| Dishes | ✅ Synced |
| Categories | ✅ Synced |
| Subcategories | ✅ Synced |
| Theme | ✅ Synced |
| **Show Prices** | ❌ NOT SYNCED |
| **Grid Columns** | ❌ NOT SYNCED |
| **Layout Density** | ❌ NOT SYNCED |
| **Image Size** | ❌ NOT SYNCED |
| **Font Size** | ❌ NOT SYNCED |
| **Badge Colors** | ❌ NOT SYNCED |

---

## 🧪 TEST AFTER FIXES

1. Change "Show Prices" → Check Preview AND Live Menu
2. Change "Grid Columns" → Check Preview AND Live Menu
3. Change "Layout Density" → Check Preview AND Live Menu
4. All three should match exactly!

---

## 📁 FILES TO MODIFY

1. `src/pages/Editor.tsx` (Line ~510) - Use fullMenuData.restaurant in Preview
2. `src/components/editor/EditableDishes.tsx` (Line ~155) - Fix default values
3. `src/pages/PublicMenuStatic.tsx` (Lines ~386, 408) - Fix default values
4. `src/hooks/useRestaurants.ts` (Line ~268) - Add refetch
5. `src/lib/constants/menuDefaults.ts` (NEW) - Create defaults constant

---

## ⏱️ ESTIMATED FIX TIME

- **Critical Fixes (1, 2, 3):** 2-3 hours
- **Medium Priority (4):** 1 hour
- **Optional (5):** 1 hour

**Total:** 3-4 hours for complete fix

---

## ✅ SUCCESS CRITERIA

After implementing fixes:
- Preview looks **EXACTLY** like Live Menu
- Changing any setting updates **ALL THREE VIEWS** instantly
- No cache staleness
- No visual differences

---

## 📄 DETAILED ANALYSIS

See `PREVIEW_SYNC_ANALYSIS_REPORT.md` for:
- Complete technical analysis
- Code examples for all issues
- Step-by-step implementation guide
- Testing checklist
- Architecture recommendations

---

**Report Date:** December 10, 2025  
**Priority:** ⚠️ HIGH - Affects user experience and testing workflow
