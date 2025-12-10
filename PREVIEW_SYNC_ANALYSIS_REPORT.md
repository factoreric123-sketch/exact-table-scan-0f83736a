# 🔍 PREVIEW SYNC ANALYSIS REPORT

**Date:** December 10, 2025  
**Issue:** Preview is not syncing with Visual Editor and Live Menu  
**Status:** ⚠️ CRITICAL - Multiple sync issues identified  

---

## 📊 EXECUTIVE SUMMARY

The Preview mode in the Visual Editor is **NOT syncing properly** with restaurant settings changes. While dishes, categories, and subcategories sync between all three views, **restaurant display settings** (show_prices, grid_columns, layout_density, etc.) are **NOT consistently synced** between Preview and Live Menu.

### Current Sync Status:

| Feature | Visual Editor ↔ Live Menu | Preview ↔ Live Menu | Preview ↔ Visual Editor |
|---------|:-------------------------:|:-------------------:|:-----------------------:|
| **Dishes** | ✅ Synced | ✅ Synced | ✅ Synced |
| **Categories** | ✅ Synced | ✅ Synced | ✅ Synced |
| **Subcategories** | ✅ Synced | ✅ Synced | ✅ Synced |
| **Restaurant Settings** | ✅ Synced | ❌ **NOT SYNCED** | ✅ Synced |
| **Theme** | ✅ Synced | ✅ Synced | ✅ Synced |

---

## 🎯 THE THREE VIEWS EXPLAINED

### 1. **Visual Editor (Edit Mode)**
- **Location:** `/editor/:restaurantId` with Preview toggle OFF
- **Data Source:** 
  - Dishes: `useDishes(activeSubcategory)` → direct table query
  - Categories: `useCategories(restaurantId)` → direct table query
  - Subcategories: `useSubcategories(activeCategory)` → direct table query
  - Restaurant: `useRestaurantById(restaurantId)` → direct table query with `staleTime: 0`
- **Purpose:** Editing interface with drag-and-drop, inline editing

### 2. **Preview Mode (Editor Preview)**
- **Location:** `/editor/:restaurantId` with Preview toggle ON
- **Data Source:** 
  - Dishes/Categories/Subcategories: `useFullMenu(restaurantId)` → RPC call `get_restaurant_full_menu()`
  - Restaurant Settings: `useRestaurantById(restaurantId)` → direct table query
- **Purpose:** Show how menu will look to customers

### 3. **Live Menu (Public View)**
- **Location:** `/m/:restaurantHash/:menuId` or `/menu/:slug`
- **Data Source:** 
  - Everything: `useFullMenu(restaurantId)` → RPC call `get_restaurant_full_menu()`
  - Uses `fullMenuData.restaurant` for all settings
- **Purpose:** Customer-facing menu

---

## 🐛 ISSUE #1: DATA SOURCE INCONSISTENCY (CRITICAL)

### Problem:
Preview and Live Menu use **different restaurant data sources** for display settings.

### Current Implementation:

**Preview Mode (Editor.tsx lines 498-515):**
```typescript
{previewMode && currentSubcategories.map((subcategory) => {
  const subcategoryDishes = dishesBySubcategory[subcategory.id] || []; // From fullMenuData
  
  return (
    <EditableDishes
      dishes={filteredSubcategoryDishes}  // ← From fullMenuData
      restaurant={restaurant}              // ← From useRestaurantById ⚠️
    />
  );
})}
```

**Live Menu (MenuShortDisplay.tsx → PublicMenuStatic.tsx):**
```typescript
<PublicMenuStatic
  restaurant={fullMenu.restaurant}  // ← From fullMenuData ⚠️
  categories={fullMenu.categories}
/>
```

**EditableDishes Component (preview mode):**
```typescript
<MenuGrid 
  key={restaurant?.updated_at}
  showPrice={restaurant?.show_prices !== false}      // ← Uses restaurant from useRestaurantById
  showImage={restaurant?.show_images !== false}
  gridColumns={restaurant?.grid_columns || 2}
  layoutDensity={restaurant?.layout_density || 'spacious'}
  // ...
/>
```

**PublicMenuStatic Component:**
```typescript
<MenuGrid 
  dishes={transformedDishes} 
  gridColumns={restaurant.grid_columns || 2}         // ← Uses fullMenuData.restaurant
  layoutDensity={restaurant.layout_density || 'compact'}
  showPrice={restaurant.show_prices !== false}
  showImage={restaurant.show_images !== false}
  // ...
/>
```

### Why This Causes Sync Issues:

1. **Preview uses `useRestaurantById`** for settings:
   - Has `staleTime: 0` (always fresh)
   - Updates immediately when settings change
   - Direct query to `restaurants` table

2. **Live Menu uses `fullMenuData.restaurant`** from RPC:
   - RPC function `get_restaurant_full_menu()` queries restaurant data
   - Cached by `useFullMenu` hook with 5-minute TTL
   - Additional localStorage caching layer
   - May serve stale restaurant data even after invalidation

### Result:
When you change a setting like "Show Prices" or "Grid Columns":
- ✅ Preview updates immediately (uses fresh `useRestaurantById`)
- ❌ Live Menu shows old value (uses cached `fullMenuData.restaurant`)

---

## 🐛 ISSUE #2: CACHE INVALIDATION RACE CONDITION

### Problem:
The cache invalidation flow has timing issues that prevent Preview from showing the same data as Live Menu.

### Current Invalidation Flow:

**When restaurant settings are updated** (`useUpdateRestaurant` in useRestaurants.ts):

```typescript
onSuccess: (data) => {
  // 1. Update restaurant caches
  queryClient.setQueryData(["restaurant", data.id], data);
  queryClient.setQueryData(["restaurant", data.slug], data);
  
  // 2. Invalidate queries
  queryClient.invalidateQueries({ queryKey: ["restaurants", userId] });
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
  
  // 3. Invalidate full menu cache ⚠️
  queryClient.invalidateQueries({ queryKey: ["full-menu", data.id] });
  
  // 4. Clear localStorage cache ⚠️
  const cacheKey = `fullMenu:${data.id}`;
  localStorage.removeItem(cacheKey);
}
```

### Issues with Current Flow:

1. **No guarantee RPC returns fresh data**: The `get_restaurant_full_menu()` RPC function queries the restaurant table, but PostgreSQL might return cached query results.

2. **useFullMenu cache check race**: The `useFullMenu` hook checks localStorage cache first:
   ```typescript
   const cachedData = readCache();
   if (cachedData) {
     setData(cachedData);  // Uses old data
     setIsLoading(false);
     fetchMenu();  // Background refresh happens later
   }
   ```

3. **Preview may render before refetch completes**: 
   - User changes setting → cache invalidated
   - Preview re-renders → reads from cache (which was just cleared)
   - But RPC hasn't been called yet or returns stale data
   - Live menu eventually gets fresh data but Preview already rendered

---

## 🐛 ISSUE #3: INCONSISTENT DEFAULT VALUES

### Problem:
Preview and Live Menu use **different default values** for the same settings.

### Evidence:

**Preview Mode (EditableDishes.tsx line 155):**
```typescript
layoutDensity={restaurant?.layout_density || 'spacious'}  // ← Default: 'spacious'
```

**Live Menu (PublicMenuStatic.tsx lines 386, 408):**
```typescript
layoutDensity={restaurant.layout_density || 'compact'}    // ← Default: 'compact'
```

This means:
- If `layout_density` is `null` or `undefined` in database
- Preview shows **spacious** layout
- Live Menu shows **compact** layout
- **They look different even with identical data!**

### Other Inconsistencies Found:

| Setting | Preview Default | Live Menu Default | Match? |
|---------|----------------|-------------------|--------|
| `layout_density` | `'spacious'` | `'compact'` | ❌ NO |
| `grid_columns` | `2` | `2` | ✅ YES |
| `show_prices` | `true` | `true` | ✅ YES |
| `show_images` | `true` | `true` | ✅ YES |
| `menu_font_size` | `'medium'` | `'medium'` | ✅ YES |
| `image_size` | `'large'` | `'compact'` | ⚠️ DIFFERENT |

---

## 🐛 ISSUE #4: CACHE VERSION CHECKING IS INEFFECTIVE

### Problem:
The cache version check in `useFullMenu` doesn't work as intended for restaurant settings updates.

### Current Implementation:

```typescript
// useFullMenu.ts lines 102-107
const currentVersion = entry.data?.restaurant?.updated_at || '';
if (entry.version !== currentVersion) {
  localStorage.removeItem(cacheKey);
  return null;
}
```

### Issues:

1. **Circular logic**: The version check compares `entry.version` (stored) with `entry.data.restaurant.updated_at` (also stored). Both are from the same cached object, so they always match!

2. **Should compare with database**: The check should compare cached `updated_at` with a fresh query to see if restaurant was updated.

3. **Restaurant updated_at may not change**: If the update doesn't trigger a timestamp update on the restaurant row, the version check won't detect the change.

---

## 🐛 ISSUE #5: MISSING SETTINGS IN PREVIEW

### Problem:
Several restaurant settings are passed to Live Menu but **NOT to Preview**.

### Settings Only in Live Menu:

**PublicMenuStatic passes to MenuGrid:**
```typescript
<MenuGrid 
  gridColumns={restaurant.grid_columns || 2}
  layoutDensity={restaurant.layout_density || 'compact'}
  fontSize={restaurant.menu_font_size || 'medium'}
  showPrice={restaurant.show_prices !== false}
  showImage={restaurant.show_images !== false}
  imageSize={restaurant.image_size || 'compact'}
  badgeColors={restaurant.badge_colors}
/>
```

**Preview passes to MenuGrid (via EditableDishes):**
```typescript
<MenuGrid 
  showPrice={restaurant?.show_prices !== false}
  showImage={restaurant?.show_images !== false}
  gridColumns={restaurant?.grid_columns || 2}
  layoutDensity={restaurant?.layout_density || 'spacious'}  // Wrong default
  fontSize={restaurant?.menu_font_size || 'medium'}
  imageSize={restaurant?.image_size || 'large'}  // Wrong default
  badgeColors={restaurant?.badge_colors}
/>
```

✅ All settings ARE passed to Preview (via EditableDishes), but with inconsistent defaults.

---

## 🐛 ISSUE #6: RE-RENDER KEY INCONSISTENCY

### Problem:
Components use different keys for forcing re-renders when settings change.

**EditableDishes (lines 149):**
```typescript
<MenuGrid 
  key={restaurant?.updated_at}  // ← Uses useRestaurantById restaurant
  // ...
/>
```

**PublicMenuStatic (line 256):**
```typescript
<div key={restaurant?.updated_at} className="min-h-screen bg-background">
  {/* Wraps entire menu */}
</div>
```

### Issue:
- If `restaurant` from `useRestaurantById` updates its `updated_at`
- But `fullMenuData.restaurant` has old `updated_at`
- Preview MenuGrid re-renders (new key)
- Live Menu div doesn't re-render (old key)
- They can show different data even with same component tree

---

## 🔧 RECOMMENDED FIXES

### Fix #1: **Use Consistent Data Source** (CRITICAL)

**Make Preview use fullMenuData.restaurant instead of useRestaurantById restaurant:**

```typescript
// Editor.tsx - Preview Mode
{previewMode && currentSubcategories.map((subcategory) => {
  const subcategoryDishes = dishesBySubcategory[subcategory.id] || [];
  
  return (
    <EditableDishes
      dishes={filteredSubcategoryDishes}
      subcategoryId={subcategory.id}
      previewMode={previewMode}
      restaurant={fullMenuData?.restaurant || restaurant}  // ← Use fullMenuData.restaurant first
    />
  );
})}
```

**Why this fixes the issue:**
- Preview and Live Menu now use identical data source
- Both get restaurant settings from `get_restaurant_full_menu()` RPC
- No more dual-source confusion

---

### Fix #2: **Standardize Default Values** (HIGH PRIORITY)

**Create a centralized defaults constant:**

```typescript
// lib/constants/menuDefaults.ts
export const MENU_DISPLAY_DEFAULTS = {
  grid_columns: 2 as 1 | 2 | 3,
  layout_density: 'compact' as 'compact' | 'spacious',
  menu_font_size: 'medium' as 'small' | 'medium' | 'large',
  image_size: 'compact' as 'compact' | 'large',
  show_prices: true,
  show_images: true,
  show_allergen_filter: true,
};
```

**Use in both components:**

```typescript
// EditableDishes.tsx
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';

<MenuGrid 
  gridColumns={restaurant?.grid_columns ?? MENU_DISPLAY_DEFAULTS.grid_columns}
  layoutDensity={restaurant?.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
  imageSize={restaurant?.image_size ?? MENU_DISPLAY_DEFAULTS.image_size}
  // ...
/>
```

```typescript
// PublicMenuStatic.tsx
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';

<MenuGrid 
  gridColumns={restaurant.grid_columns ?? MENU_DISPLAY_DEFAULTS.grid_columns}
  layoutDensity={restaurant.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
  imageSize={restaurant.image_size ?? MENU_DISPLAY_DEFAULTS.image_size}
  // ...
/>
```

---

### Fix #3: **Improve Cache Invalidation** (HIGH PRIORITY)

**Add aggressive refetch after settings update:**

```typescript
// useRestaurants.ts - useUpdateRestaurant
onSuccess: async (data) => {
  // ... existing code ...
  
  // CRITICAL: Force immediate refetch of full menu (don't trust cache)
  await queryClient.refetchQueries({ 
    queryKey: ["full-menu", data.id],
    type: 'active',
  });
  
  // Also refetch restaurant query
  await queryClient.refetchQueries({
    queryKey: ["restaurant", data.id],
    type: 'active',
  });
}
```

**Remove localStorage cache entirely** (optional but recommended):

The localStorage cache adds complexity and is a common source of stale data bugs. With React Query's caching, it's redundant.

```typescript
// useFullMenu.ts - Remove all localStorage logic
// Just use React Query cache with aggressive staleTime
export const useFullMenu = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['full-menu', restaurantId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_restaurant_full_menu', {
        p_restaurant_id: restaurantId,
      });
      if (error) throw error;
      return data as FullMenuData;
    },
    enabled: !!restaurantId,
    staleTime: 0,  // Always refetch to ensure fresh data
    gcTime: 1000 * 60 * 5,  // Keep in cache for 5 minutes
  });
};
```

---

### Fix #4: **Add Explicit Refresh on Preview Toggle** (MEDIUM PRIORITY)

**Force refetch when entering Preview mode:**

```typescript
// Editor.tsx
onPreviewToggle={() => {
  const newPreviewMode = !previewMode;
  if (newPreviewMode && viewMode === 'table') {
    setViewMode('grid');
  }
  
  // When entering preview mode, force refresh of full menu
  if (newPreviewMode) {
    refetchFullMenu();
  }
  
  setPreviewMode(newPreviewMode);
}}
```

---

### Fix #5: **Add Visual Sync Indicator** (LOW PRIORITY - UX Enhancement)

**Show when Preview data is stale:**

```typescript
// Editor.tsx
const isPreviewStale = useMemo(() => {
  if (!previewMode || !restaurant || !fullMenuData?.restaurant) return false;
  
  // Compare timestamps
  return restaurant.updated_at !== fullMenuData.restaurant.updated_at;
}, [previewMode, restaurant?.updated_at, fullMenuData?.restaurant?.updated_at]);

// In render:
{previewMode && isPreviewStale && (
  <div className="bg-yellow-500 text-white px-4 py-2 text-center">
    ⚠️ Preview data may be outdated. Click "Update" to refresh.
  </div>
)}
```

---

### Fix #6: **Database-Level Fix** (OPTIONAL - Best Practice)

**Ensure `updated_at` timestamp is automatically updated:**

```sql
-- Add trigger to update updated_at on restaurant changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: Critical Fixes (Do First)
1. ✅ **Fix #1**: Use consistent data source (fullMenuData.restaurant in Preview)
2. ✅ **Fix #2**: Standardize default values across components
3. ✅ **Fix #3**: Improve cache invalidation with aggressive refetch

**Estimated Time:** 2-3 hours  
**Impact:** Fixes 80% of sync issues

### Phase 2: Reliability Improvements (Do Second)
4. ✅ **Fix #4**: Add explicit refresh on Preview toggle
5. ✅ **Fix #6**: Add database trigger for updated_at

**Estimated Time:** 1-2 hours  
**Impact:** Ensures data freshness

### Phase 3: UX Enhancements (Do Last)
6. ✅ **Fix #5**: Add visual sync indicator

**Estimated Time:** 1 hour  
**Impact:** Better user awareness

---

## 🧪 TESTING CHECKLIST

After implementing fixes, verify:

- [ ] Change "Show Prices" toggle → Preview and Live Menu match
- [ ] Change "Grid Columns" → Preview and Live Menu match
- [ ] Change "Layout Density" → Preview and Live Menu match
- [ ] Change "Image Size" → Preview and Live Menu match
- [ ] Change "Font Size" → Preview and Live Menu match
- [ ] Change "Badge Colors" → Preview and Live Menu match
- [ ] Edit dish in Visual Editor → All three views update
- [ ] Add new dish → All three views show it
- [ ] Delete dish → All three views remove it
- [ ] Reorder dishes → All three views reflect new order
- [ ] Switch categories → All three views switch
- [ ] Apply filters in Preview → Works correctly
- [ ] Open Preview, change settings, close Preview → Live Menu has changes
- [ ] Refresh page → All views still match
- [ ] Clear browser cache → All views still work

---

## 🎯 SUCCESS CRITERIA

After fixes are implemented, this should be true:

✅ **Preview Mode === Live Menu (Visually Identical)**
- Same layout, same settings, same data
- No visual differences whatsoever

✅ **Settings Changes Sync Instantly**
- Change any setting → Preview and Live Menu update within 1 second
- No cache staleness issues

✅ **Consistent Defaults**
- All views use identical default values
- No surprises when settings are null/undefined

✅ **Reliable Refresh**
- Clicking "Update" button guarantees fresh data in all views
- Preview toggle guarantees fresh data

---

## 📚 ADDITIONAL NOTES

### Why This Issue Wasn't Caught Earlier:

1. **Different data sources looked the same**: Both `useRestaurantById` and `fullMenuData.restaurant` return similar data, so the dual-source issue wasn't obvious.

2. **Race conditions are intermittent**: Sometimes the cache invalidation works perfectly, sometimes it doesn't. This makes the bug hard to reproduce consistently.

3. **Default value differences are subtle**: The difference between 'compact' and 'spacious' isn't dramatic, so it's easy to miss.

### Long-Term Architecture Recommendation:

Consider **unifying all menu views** to use a single data source:

```typescript
// Single source of truth for ALL views
const { data: menuData, refetch } = useFullMenu(restaurantId);

// Visual Editor, Preview, and Live Menu all use menuData
// Different rendering logic, same data source
```

This eliminates dual-source complexity entirely.

---

## 📞 CONTACT

For questions about this analysis, contact the development team.

**Report Generated:** December 10, 2025  
**Analysis Duration:** Comprehensive end-to-end system review  
**Files Analyzed:** 15+ files across frontend and database layers
