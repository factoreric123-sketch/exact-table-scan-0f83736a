# 📊 PREVIEW SYNC - DATA FLOW DIAGRAM

This document visualizes the data flow issues causing Preview/Live Menu desync.

---

## 🔄 CURRENT DATA FLOW (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CHANGES SETTING                     │
│                   (e.g., "Show Prices" = false)                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RestaurantSettingsDialog                      │
│                  updateRestaurant.mutate(...)                    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase UPDATE Query                        │
│         UPDATE restaurants SET show_prices = false ...          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
    ┌───────────────────────────┐  ┌───────────────────────────┐
    │   useRestaurantById       │  │    Cache Invalidation     │
    │   (Visual Editor uses)    │  │   - full-menu query       │
    │                           │  │   - localStorage          │
    │   staleTime: 0            │  │                           │
    │   ✅ Refetches instantly  │  │   queryClient.invalidate  │
    └───────────────┬───────────┘  └───────────┬───────────────┘
                    │                           │
                    │                           ▼
                    │              ┌───────────────────────────┐
                    │              │     useFullMenu Hook      │
                    │              │  (Preview & Live Menu)    │
                    │              │                           │
                    │              │  1. localStorage cleared  │
                    │              │  2. Invalidation fired    │
                    │              │  3. Background refetch... │
                    │              │     ⚠️ MAY BE SLOW        │
                    │              └───────────┬───────────────┘
                    │                           │
                    │                           ▼
                    │              ┌───────────────────────────┐
                    │              │  get_restaurant_full_menu │
                    │              │         RPC Call          │
                    │              │                           │
                    │              │  ⚠️ May return stale data │
                    │              │     from PG cache         │
                    │              └───────────┬───────────────┘
                    │                           │
                    ▼                           ▼
    ┌──────────────────────────────────────────────────────────┐
    │                    PREVIEW RENDERS                        │
    │                                                            │
    │  Uses TWO data sources:                                   │
    │  1. restaurant (from useRestaurantById) ✅ FRESH          │
    │  2. dishes (from fullMenuData)          ❌ MAY BE STALE   │
    │                                                            │
    │  Result: Settings updated, but may show old menu data     │
    └──────────────────────────────────────────────────────────┘
                                  │
                                  ▼
    ┌──────────────────────────────────────────────────────────┐
    │                   LIVE MENU RENDERS                       │
    │                                                            │
    │  Uses ONE data source:                                    │
    │  fullMenuData.restaurant ❌ STALE                          │
    │                                                            │
    │  Result: Shows OLD settings (cached)                      │
    └──────────────────────────────────────────────────────────┘
```

### The Problem:
- Preview uses `useRestaurantById()` → Fresh immediately
- Live Menu uses `fullMenuData.restaurant` → Stale from cache
- **They show different data!**

---

## ✅ CORRECT DATA FLOW (AFTER FIX)

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER CHANGES SETTING                     │
│                   (e.g., "Show Prices" = false)                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RestaurantSettingsDialog                      │
│                  updateRestaurant.mutate(...)                    │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase UPDATE Query                        │
│         UPDATE restaurants SET show_prices = false ...          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    onSuccess Handler                             │
│                                                                  │
│  1. queryClient.refetchQueries(['full-menu'])                   │
│     ✅ FORCE immediate refetch (don't wait for invalidation)    │
│                                                                  │
│  2. localStorage.removeItem('fullMenu:...')                     │
│     ✅ Clear cache                                              │
│                                                                  │
│  3. await refetch completes                                     │
│     ✅ Wait for fresh data                                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      useFullMenu Hook                            │
│                 (Both Preview & Live Menu)                       │
│                                                                  │
│  Refetch triggered by onSuccess handler                         │
│  ✅ Returns FRESH data from database                            │
│  ✅ No localStorage cache to interfere                          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  get_restaurant_full_menu RPC                    │
│                                                                  │
│  SELECT * FROM restaurants WHERE id = ...                       │
│  ✅ Fresh query (no cache)                                      │
│                                                                  │
│  Returns: { restaurant: {...}, categories: [...] }              │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
    ┌──────────────────────────┐  ┌──────────────────────────┐
    │    PREVIEW RENDERS       │  │   LIVE MENU RENDERS      │
    │                          │  │                          │
    │  Uses ONE data source:   │  │  Uses ONE data source:   │
    │  fullMenuData.restaurant │  │  fullMenuData.restaurant │
    │  ✅ FRESH                │  │  ✅ FRESH                │
    │                          │  │                          │
    │  Result: Correct!        │  │  Result: Correct!        │
    └──────────────────────────┘  └──────────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌──────────────────────────┐
                    │   BOTH VIEWS MATCH!      │
                    │   ✅ Synced perfectly    │
                    └──────────────────────────┘
```

### The Solution:
- Both Preview and Live Menu use `fullMenuData` (same source)
- Force immediate refetch on settings update (no cache)
- Consistent defaults everywhere
- **They show identical data!**

---

## 🔍 COMPONENT HIERARCHY

### Current (Broken)
```
Editor.tsx
├─ useRestaurantById() → restaurant ✅ Fresh
│  └─ Used by: Preview settings
│
├─ useFullMenu() → fullMenuData ❌ Can be stale
│  └─ Used by: Preview dishes
│
└─ Preview Mode
   ├─ EditableDishes
   │  ├─ Props: dishes (from fullMenuData) ❌ Stale
   │  └─ Props: restaurant (from useRestaurantById) ✅ Fresh
   │     └─ MenuGrid uses restaurant.show_prices ✅ Fresh
   │
   └─ Result: Inconsistent!

MenuShortDisplay.tsx
└─ useFullMenu() → fullMenuData
   └─ PublicMenuStatic
      └─ Props: fullMenuData.restaurant ❌ Stale
         └─ MenuGrid uses restaurant.show_prices ❌ Stale
```

### Fixed (Correct)
```
Editor.tsx
├─ useFullMenu() → fullMenuData ✅ Fresh (forced refetch)
│  └─ Used by: Both Preview dishes AND settings
│
└─ Preview Mode
   ├─ EditableDishes
   │  ├─ Props: dishes (from fullMenuData) ✅ Fresh
   │  └─ Props: restaurant (from fullMenuData) ✅ Fresh
   │     └─ MenuGrid uses restaurant.show_prices ✅ Fresh
   │
   └─ Result: Consistent!

MenuShortDisplay.tsx
└─ useFullMenu() → fullMenuData ✅ Fresh
   └─ PublicMenuStatic
      └─ Props: fullMenuData.restaurant ✅ Fresh
         └─ MenuGrid uses restaurant.show_prices ✅ Fresh
```

---

## 🎯 KEY CHANGES NEEDED

### 1. Editor.tsx (Line ~510)
```typescript
// BEFORE ❌
<EditableDishes
  restaurant={restaurant}  // ← From useRestaurantById
/>

// AFTER ✅
<EditableDishes
  restaurant={fullMenuData?.restaurant || restaurant}  // ← From useFullMenu
/>
```

### 2. useRestaurants.ts (Line ~268, onSuccess)
```typescript
// BEFORE ❌
onSuccess: (data) => {
  // Just invalidate
  queryClient.invalidateQueries({ queryKey: ["full-menu", data.id] });
}

// AFTER ✅
onSuccess: async (data) => {
  // Force immediate refetch (don't wait)
  await queryClient.refetchQueries({ 
    queryKey: ["full-menu", data.id],
    type: 'active',
  });
}
```

### 3. Create menuDefaults.ts (NEW FILE)
```typescript
// lib/constants/menuDefaults.ts
export const MENU_DISPLAY_DEFAULTS = {
  layout_density: 'compact',  // ← Single source of truth
  grid_columns: 2,
  image_size: 'compact',
  menu_font_size: 'medium',
  show_prices: true,
  show_images: true,
};
```

### 4. EditableDishes.tsx (Line ~155)
```typescript
// BEFORE ❌
layoutDensity={restaurant?.layout_density || 'spacious'}

// AFTER ✅
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';
layoutDensity={restaurant?.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
```

### 5. PublicMenuStatic.tsx (Lines ~386, 408)
```typescript
// BEFORE ❌
layoutDensity={restaurant.layout_density || 'compact'}

// AFTER ✅
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';
layoutDensity={restaurant.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
```

---

## 📝 TESTING FLOW

### Test Case 1: Toggle "Show Prices"
```
1. Open Editor → Preview Mode
2. Open Live Menu in another tab
3. Click Settings → Toggle "Show Prices" OFF
4. Wait 1 second
5. Check Preview: Prices should be HIDDEN ✅
6. Check Live Menu: Prices should be HIDDEN ✅
7. Both match! ✅
```

### Test Case 2: Change Grid Columns
```
1. Open Editor → Preview Mode
2. Open Live Menu in another tab
3. Click Settings → Change Grid to "3 Columns"
4. Wait 1 second
5. Check Preview: Should show 3 columns ✅
6. Check Live Menu: Should show 3 columns ✅
7. Both match! ✅
```

### Test Case 3: Change Layout Density
```
1. Open Editor → Preview Mode
2. Open Live Menu in another tab
3. Click Settings → Change to "Spacious"
4. Wait 1 second
5. Check Preview: Spacing should increase ✅
6. Check Live Menu: Spacing should increase ✅
7. Both match! ✅
```

---

## ⚡ PERFORMANCE CONSIDERATIONS

### Current Performance Impact:
- **Cache invalidation:** ~50-100ms
- **RPC refetch:** ~100-300ms
- **React re-render:** ~50ms
- **Total delay:** 200-450ms ✅ Acceptable

### After Fix:
- **Forced refetch:** ~100-300ms (same)
- **Single data source:** Reduces complexity
- **No localStorage:** Eliminates cache layer
- **Total delay:** 100-300ms ✅ Better!

---

## 🎨 VISUAL REPRESENTATION OF SYNC STATES

### Before Fix:
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Visual Editor   │  │     Preview      │  │    Live Menu     │
│                  │  │                  │  │                  │
│  Show Prices: ✅  │  │  Show Prices: ✅  │  │  Show Prices: ❌  │
│  Columns: 3      │  │  Columns: 3      │  │  Columns: 2      │
│  Density: Compact│  │  Density: Compact│  │  Density: Spacious│
│                  │  │                  │  │                  │
│  ✅ Fresh        │  │  ✅ Fresh        │  │  ❌ Stale        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
       ✅                    ✅                     ❌
    SYNCED              SYNCED              NOT SYNCED!
```

### After Fix:
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Visual Editor   │  │     Preview      │  │    Live Menu     │
│                  │  │                  │  │                  │
│  Show Prices: ✅  │  │  Show Prices: ✅  │  │  Show Prices: ✅  │
│  Columns: 3      │  │  Columns: 3      │  │  Columns: 3      │
│  Density: Compact│  │  Density: Compact│  │  Density: Compact│
│                  │  │                  │  │                  │
│  ✅ Fresh        │  │  ✅ Fresh        │  │  ✅ Fresh        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
       ✅                    ✅                     ✅
    SYNCED              SYNCED               SYNCED!
       └────────────────────┴──────────────────────┘
                  ALL THREE MATCH!
```

---

**Report Date:** December 10, 2025  
**Purpose:** Visual guide to understanding and fixing Preview/Live Menu sync issues
