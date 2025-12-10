# ✅ PREVIEW SYNC FIX - IMPLEMENTATION CHECKLIST

Use this checklist to implement the fixes step-by-step.

---

## 🎯 PHASE 1: CRITICAL FIXES (Do First)

### [ ] Step 1: Create Menu Defaults Constant (15 min)

**File:** `src/lib/constants/menuDefaults.ts` (NEW FILE)

```typescript
export const MENU_DISPLAY_DEFAULTS = {
  grid_columns: 2 as 1 | 2 | 3,
  layout_density: 'compact' as 'compact' | 'spacious',
  menu_font_size: 'medium' as 'small' | 'medium' | 'large',
  image_size: 'compact' as 'compact' | 'large',
  show_prices: true,
  show_images: true,
  show_allergen_filter: true,
} as const;
```

**Test:**
- [ ] File compiles without errors
- [ ] Can import in other files

---

### [ ] Step 2: Fix Preview Data Source (30 min)

**File:** `src/pages/Editor.tsx`

**Location:** Lines ~498-515

**Change FROM:**
```typescript
<EditableDishes
  dishes={filteredSubcategoryDishes}
  subcategoryId={subcategory.id}
  previewMode={previewMode}
  restaurant={restaurant}  // ← Uses useRestaurantById
/>
```

**Change TO:**
```typescript
<EditableDishes
  dishes={filteredSubcategoryDishes}
  subcategoryId={subcategory.id}
  previewMode={previewMode}
  restaurant={fullMenuData?.restaurant || restaurant}  // ← Use fullMenuData first
/>
```

**Test:**
- [ ] Preview mode loads without errors
- [ ] Can still edit dishes in edit mode
- [ ] Preview shows menu correctly

---

### [ ] Step 3: Fix Default Values in EditableDishes (20 min)

**File:** `src/components/editor/EditableDishes.tsx`

**Location:** Lines ~148-159

**Change FROM:**
```typescript
<MenuGrid 
  key={restaurant?.updated_at}
  dishes={dishCards} 
  sectionTitle=""
  showPrice={restaurant?.show_prices !== false}
  showImage={restaurant?.show_images !== false}
  gridColumns={restaurant?.grid_columns || 2}
  layoutDensity={restaurant?.layout_density || 'spacious'}  // ❌ Wrong default
  fontSize={restaurant?.menu_font_size || 'medium'}
  imageSize={restaurant?.image_size || 'large'}  // ❌ Wrong default
  badgeColors={restaurant?.badge_colors}
/>
```

**Change TO:**
```typescript
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';

<MenuGrid 
  key={restaurant?.updated_at}
  dishes={dishCards} 
  sectionTitle=""
  showPrice={restaurant?.show_prices ?? MENU_DISPLAY_DEFAULTS.show_prices}
  showImage={restaurant?.show_images ?? MENU_DISPLAY_DEFAULTS.show_images}
  gridColumns={restaurant?.grid_columns ?? MENU_DISPLAY_DEFAULTS.grid_columns}
  layoutDensity={restaurant?.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
  fontSize={restaurant?.menu_font_size ?? MENU_DISPLAY_DEFAULTS.menu_font_size}
  imageSize={restaurant?.image_size ?? MENU_DISPLAY_DEFAULTS.image_size}
  badgeColors={restaurant?.badge_colors}
/>
```

**Test:**
- [ ] Preview renders correctly
- [ ] Default values match Live Menu
- [ ] No TypeScript errors

---

### [ ] Step 4: Fix Default Values in PublicMenuStatic (20 min)

**File:** `src/pages/PublicMenuStatic.tsx`

**Location:** Lines ~382-415 (two MenuGrid instances)

**Change FROM (First instance at line ~382):**
```typescript
<MenuGrid 
  dishes={transformedDishes} 
  sectionTitle={subcategory.name}
  gridColumns={restaurant.grid_columns || 2}
  layoutDensity={restaurant.layout_density || 'compact'}
  fontSize={restaurant.menu_font_size || 'medium'}
  showPrice={restaurant.show_prices !== false}
  showImage={restaurant.show_images !== false}
  imageSize={restaurant.image_size || 'compact'}
  badgeColors={restaurant.badge_colors}
/>
```

**Change TO:**
```typescript
import { MENU_DISPLAY_DEFAULTS } from '@/lib/constants/menuDefaults';

<MenuGrid 
  dishes={transformedDishes} 
  sectionTitle={subcategory.name}
  gridColumns={restaurant.grid_columns ?? MENU_DISPLAY_DEFAULTS.grid_columns}
  layoutDensity={restaurant.layout_density ?? MENU_DISPLAY_DEFAULTS.layout_density}
  fontSize={restaurant.menu_font_size ?? MENU_DISPLAY_DEFAULTS.menu_font_size}
  showPrice={restaurant.show_prices ?? MENU_DISPLAY_DEFAULTS.show_prices}
  showImage={restaurant.show_images ?? MENU_DISPLAY_DEFAULTS.show_images}
  imageSize={restaurant.image_size ?? MENU_DISPLAY_DEFAULTS.image_size}
  badgeColors={restaurant.badge_colors}
/>
```

**Repeat for second MenuGrid instance at line ~404**

**Test:**
- [ ] Live Menu renders correctly
- [ ] Default values match Preview
- [ ] No TypeScript errors

---

### [ ] Step 5: Force Refetch on Settings Update (30 min)

**File:** `src/hooks/useRestaurants.ts`

**Location:** Lines ~255-291 (useUpdateRestaurant mutation)

**Change onSuccess FROM:**
```typescript
onSuccess: (data) => {
  // Update all restaurant caches
  queryClient.setQueryData(["restaurant", data.id], data);
  queryClient.setQueryData(["restaurant", data.slug], data);
  
  // Invalidate list queries
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ["restaurants", userId] });
  }
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
  
  // CRITICAL: Invalidate full menu cache for public menu updates
  queryClient.invalidateQueries({ queryKey: ["full-menu", data.id] });
  
  // CRITICAL: Clear localStorage cache for instant public menu updates
  const cacheKey = `fullMenu:${data.id}`;
  try {
    localStorage.removeItem(cacheKey);
  } catch (err) {
    console.warn('Failed to clear menu cache:', err);
  }
  
  // Invalidate all-dishes-for-category for editor preview
  queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
  
  toast.success("Settings updated");
}
```

**Change TO:**
```typescript
onSuccess: async (data) => {
  // Update all restaurant caches
  queryClient.setQueryData(["restaurant", data.id], data);
  queryClient.setQueryData(["restaurant", data.slug], data);
  
  // Invalidate list queries
  if (userId) {
    queryClient.invalidateQueries({ queryKey: ["restaurants", userId] });
  }
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.id] });
  queryClient.invalidateQueries({ queryKey: ["restaurant", data.slug] });
  
  // CRITICAL: Clear localStorage cache FIRST
  const cacheKey = `fullMenu:${data.id}`;
  try {
    localStorage.removeItem(cacheKey);
  } catch (err) {
    console.warn('Failed to clear menu cache:', err);
  }
  
  // CRITICAL: Force immediate refetch (don't wait for invalidation)
  try {
    await queryClient.refetchQueries({ 
      queryKey: ["full-menu", data.id],
      type: 'active',
    });
  } catch (err) {
    console.warn('Failed to refetch full menu:', err);
  }
  
  // Invalidate all-dishes-for-category for editor preview
  queryClient.invalidateQueries({ queryKey: ["all-dishes-for-category"] });
  
  toast.success("Settings updated");
}
```

**Test:**
- [ ] Changing settings triggers refetch
- [ ] No console errors
- [ ] Settings update successfully

---

## 🟡 PHASE 2: RELIABILITY IMPROVEMENTS (Do Second)

### [ ] Step 6: Refresh on Preview Toggle (15 min)

**File:** `src/pages/Editor.tsx`

**Location:** Lines ~421-427

**Change FROM:**
```typescript
onPreviewToggle={() => {
  const newPreviewMode = !previewMode;
  if (newPreviewMode && viewMode === 'table') {
    setViewMode('grid');
  }
  setPreviewMode(newPreviewMode);
}}
```

**Change TO:**
```typescript
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

**Test:**
- [ ] Toggling to Preview refreshes data
- [ ] Preview shows latest changes
- [ ] No performance issues

---

### [ ] Step 7: Simplify useFullMenu (Optional, 30 min)

**File:** `src/hooks/useFullMenu.ts`

**Option A: Remove localStorage cache entirely**

**Change FROM:** (Lines 1-129, complex caching logic)

**Change TO:**
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FullMenuData {
  restaurant: any;
  categories: any[];
}

interface UseFullMenuReturn {
  data: FullMenuData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useFullMenu = (restaurantId: string | undefined): UseFullMenuReturn => {
  const query = useQuery({
    queryKey: ['full-menu', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;
      
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

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch as () => Promise<void>,
  };
};
```

**Test:**
- [ ] Full menu loads correctly
- [ ] No localStorage errors
- [ ] Performance is acceptable

---

## 🧪 PHASE 3: TESTING

### [ ] Test Case 1: Show Prices Toggle
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another browser tab
3. [ ] Change Settings → Toggle "Show Prices" OFF
4. [ ] Wait 1 second
5. [ ] Verify Preview: Prices should be HIDDEN
6. [ ] Verify Live Menu: Prices should be HIDDEN
7. [ ] Both match ✅

### [ ] Test Case 2: Grid Columns
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Select "3 Columns"
4. [ ] Wait 1 second
5. [ ] Verify Preview: Shows 3 columns
6. [ ] Verify Live Menu: Shows 3 columns
7. [ ] Both match ✅

### [ ] Test Case 3: Layout Density
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Select "Spacious"
4. [ ] Wait 1 second
5. [ ] Verify Preview: Increased spacing
6. [ ] Verify Live Menu: Increased spacing
7. [ ] Both match ✅

### [ ] Test Case 4: Image Size
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Select "Large"
4. [ ] Wait 1 second
5. [ ] Verify Preview: Larger images
6. [ ] Verify Live Menu: Larger images
7. [ ] Both match ✅

### [ ] Test Case 5: Font Size
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Select "Large"
4. [ ] Wait 1 second
5. [ ] Verify Preview: Larger text
6. [ ] Verify Live Menu: Larger text
7. [ ] Both match ✅

### [ ] Test Case 6: Badge Colors
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Change "New Addition" color to "255, 0, 0"
4. [ ] Wait 1 second
5. [ ] Verify Preview: Red badge
6. [ ] Verify Live Menu: Red badge
7. [ ] Both match ✅

### [ ] Test Case 7: Show Images Toggle
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Change Settings → Toggle "Show Images" OFF
4. [ ] Wait 1 second
5. [ ] Verify Preview: No images shown
6. [ ] Verify Live Menu: No images shown
7. [ ] Both match ✅

### [ ] Test Case 8: Multiple Rapid Changes
1. [ ] Open Editor → Switch to Preview Mode
2. [ ] Open Live Menu in another tab
3. [ ] Rapidly change: Columns → Density → Font Size → Show Prices
4. [ ] Wait 2 seconds for all updates to settle
5. [ ] Verify Preview: All changes applied
6. [ ] Verify Live Menu: All changes applied
7. [ ] Both match ✅

### [ ] Test Case 9: Browser Refresh
1. [ ] Make several setting changes
2. [ ] Refresh browser
3. [ ] Open Editor → Preview Mode
4. [ ] Open Live Menu
5. [ ] Verify both show latest settings
6. [ ] Both match ✅

### [ ] Test Case 10: Clear Cache Test
1. [ ] Make setting changes
2. [ ] Clear browser cache (Ctrl+Shift+Del)
3. [ ] Reload page
4. [ ] Open Editor → Preview Mode
5. [ ] Open Live Menu
6. [ ] Verify both show correct settings
7. [ ] Both match ✅

---

## 📊 SUCCESS CRITERIA

After implementing all fixes, verify:

- [ ] **Visual Identity**: Preview and Live Menu look EXACTLY the same
- [ ] **Instant Sync**: Settings changes appear in both views within 1 second
- [ ] **Consistent Defaults**: Null/undefined settings render identically
- [ ] **No Cache Issues**: Refreshing page shows latest data
- [ ] **No Console Errors**: Clean console during all operations
- [ ] **Performance**: No noticeable lag when toggling Preview
- [ ] **Reliability**: 10/10 setting changes sync correctly

---

## 🎯 COMPLETION CHECKLIST

### Phase 1 (Critical) - 2-3 hours
- [ ] Step 1: Create defaults constant
- [ ] Step 2: Fix Preview data source
- [ ] Step 3: Fix EditableDishes defaults
- [ ] Step 4: Fix PublicMenuStatic defaults
- [ ] Step 5: Force refetch on update

### Phase 2 (Reliability) - 1-2 hours
- [ ] Step 6: Refresh on Preview toggle
- [ ] Step 7: Simplify useFullMenu (optional)

### Phase 3 (Testing) - 1-2 hours
- [ ] All 10 test cases pass

### Total Time: 4-7 hours

---

## 🚀 DEPLOYMENT

Before deploying to production:

1. [ ] All test cases pass
2. [ ] Code review completed
3. [ ] No TypeScript errors
4. [ ] No console errors
5. [ ] Performance is acceptable (< 500ms for updates)
6. [ ] Documentation updated
7. [ ] Stakeholders approve changes

---

## 📝 POST-DEPLOYMENT MONITORING

After deployment, monitor for:

- [ ] Cache invalidation working correctly
- [ ] No reports of stale data
- [ ] Performance metrics within acceptable range
- [ ] User feedback positive
- [ ] No increase in error rates

---

## 🆘 ROLLBACK PLAN

If issues arise:

1. [ ] Document the issue
2. [ ] Revert commits in this order:
   - Step 7 (if implemented)
   - Step 6
   - Step 5
   - Steps 2-4 (as a group)
   - Step 1
3. [ ] Clear production caches
4. [ ] Verify system returns to previous state
5. [ ] Analyze root cause
6. [ ] Re-implement with fixes

---

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**Status:** Ready for Implementation
