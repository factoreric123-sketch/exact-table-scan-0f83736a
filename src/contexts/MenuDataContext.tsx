import React, { createContext, useContext, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generateTempId } from '@/lib/utils/uuid';
import { getErrorMessage } from '@/lib/errorUtils';

// Types
export interface DishData {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_new: boolean;
  is_special: boolean;
  is_popular: boolean;
  is_chef_recommendation: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_spicy: boolean;
  allergens: string[] | null;
  calories: number | null;
  has_options: boolean;
  order_index: number;
  subcategory_id: string;
  options?: Array<{ id: string; name: string; price: string; order_index: number }>;
  modifiers?: Array<{ id: string; name: string; price: string; order_index: number }>;
}

export interface SubcategoryData {
  id: string;
  name: string;
  order_index: number;
  category_id: string;
  dishes: DishData[];
}

export interface CategoryData {
  id: string;
  name: string;
  order_index: number;
  restaurant_id: string;
  subcategories: SubcategoryData[];
}

export interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  hero_image_url: string | null;
  published: boolean;
  theme: any;
  show_prices: boolean;
  show_images: boolean;
  show_allergen_filter: boolean;
  grid_columns: number;
  layout_density: string;
  menu_font_size: string;
  image_size: string;
  badge_colors: any;
  allergen_filter_order: string[] | null;
  dietary_filter_order: string[] | null;
  badge_display_order: string[] | null;
  editor_view_mode: string;
  owner_id: string;
}

export interface MenuData {
  restaurant: RestaurantData;
  categories: CategoryData[];
}

interface MenuDataContextValue {
  data: MenuData | null;
  isLoading: boolean;
  error: Error | null;
  
  // Dish mutations - instant updates
  updateDish: (dishId: string, updates: Partial<DishData>) => void;
  addDish: (subcategoryId: string, dish?: Partial<DishData>) => void;
  deleteDish: (dishId: string) => void;
  reorderDishes: (subcategoryId: string, orderedIds: string[]) => void;
  
  // Restaurant mutations
  updateRestaurant: (updates: Partial<RestaurantData>) => void;
  
  // Refetch from DB
  refetch: () => Promise<void>;
}

const MenuDataContext = createContext<MenuDataContextValue | null>(null);

interface MenuDataProviderProps {
  restaurantId: string;
  children: React.ReactNode;
}

export const MenuDataProvider: React.FC<MenuDataProviderProps> = ({ restaurantId, children }) => {
  const [data, setData] = useState<MenuData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  
  // Ref to track pending mutations for optimistic updates
  const pendingMutations = useRef<Set<string>>(new Set());

  // Initial fetch
  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setIsLoading(true);
      const { data: menuData, error: rpcError } = await supabase.rpc('get_restaurant_full_menu', {
        p_restaurant_id: restaurantId,
      });

      if (rpcError) throw rpcError;
      
      const parsed = menuData as unknown as MenuData;
      setData(parsed);
      setError(null);
      
      // Also sync to React Query cache for components that still use it
      queryClient.setQueryData(['full-menu', restaurantId], parsed);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch menu'));
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, queryClient]);

  // Initial load
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // INSTANT dish update - mutates in-memory data directly
  const updateDish = useCallback((dishId: string, updates: Partial<DishData>) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        categories: prevData.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(subcategory => ({
            ...subcategory,
            dishes: subcategory.dishes.map(dish =>
              dish.id === dishId ? { ...dish, ...updates } : dish
            )
          }))
        }))
      };
    });
    
    // Persist to DB in background (fire and forget with retry)
    const mutationKey = `update-${dishId}-${Date.now()}`;
    pendingMutations.current.add(mutationKey);
    
    // Normalize price
    const payload: Partial<DishData> = { ...updates };
    if (typeof updates.price === 'string') {
      let normalizedPrice = updates.price.replace(/[^0-9.]/g, '');
      if (normalizedPrice && !normalizedPrice.includes('.')) {
        normalizedPrice += '.00';
      } else if (normalizedPrice.split('.')[1]?.length === 1) {
        normalizedPrice += '0';
      }
      payload.price = normalizedPrice || '0.00';
    }
    
    supabase
      .from('dishes')
      .update(payload)
      .eq('id', dishId)
      .then(({ error }) => {
        pendingMutations.current.delete(mutationKey);
        if (error) {
          console.error('Failed to persist dish update:', error);
        }
      });
  }, []);

  // INSTANT dish add
  const addDish = useCallback((subcategoryId: string, dishData?: Partial<DishData>) => {
    const tempId = generateTempId();
    
    setData(prevData => {
      if (!prevData) return prevData;
      
      // Find the subcategory to get the correct order_index
      let maxOrderIndex = 0;
      prevData.categories.forEach(cat => {
        cat.subcategories.forEach(sub => {
          if (sub.id === subcategoryId) {
            maxOrderIndex = Math.max(...sub.dishes.map(d => d.order_index), -1) + 1;
          }
        });
      });
      
      const newDish: DishData = {
        id: tempId,
        subcategory_id: subcategoryId,
        name: dishData?.name || 'New Dish',
        description: dishData?.description || 'Add description',
        price: dishData?.price || '0.00',
        image_url: dishData?.image_url || null,
        is_new: dishData?.is_new || false,
        is_special: dishData?.is_special || false,
        is_popular: dishData?.is_popular || false,
        is_chef_recommendation: dishData?.is_chef_recommendation || false,
        is_vegetarian: dishData?.is_vegetarian || false,
        is_vegan: dishData?.is_vegan || false,
        is_spicy: dishData?.is_spicy || false,
        allergens: dishData?.allergens || null,
        calories: dishData?.calories || null,
        has_options: dishData?.has_options || false,
        order_index: maxOrderIndex,
        options: [],
        modifiers: []
      };
      
      return {
        ...prevData,
        categories: prevData.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(subcategory => {
            if (subcategory.id === subcategoryId) {
              return {
                ...subcategory,
                dishes: [...subcategory.dishes, newDish]
              };
            }
            return subcategory;
          })
        }))
      };
    });
    
    // Persist to DB and replace temp ID with real ID
    supabase
      .from('dishes')
      .insert([{
        subcategory_id: subcategoryId,
        name: dishData?.name || 'New Dish',
        description: dishData?.description || 'Add description',
        price: dishData?.price || '0.00',
        order_index: 999, // Will be fixed
        is_new: dishData?.is_new || false,
      }])
      .select()
      .single()
      .then(({ data: createdDish, error }) => {
        if (error) {
          toast.error(`Failed to create dish: ${getErrorMessage(error)}`);
          // Remove optimistic dish
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              categories: prev.categories.map(cat => ({
                ...cat,
                subcategories: cat.subcategories.map(sub => ({
                  ...sub,
                  dishes: sub.dishes.filter(d => d.id !== tempId)
                }))
              }))
            };
          });
        } else if (createdDish) {
          // Replace temp ID with real ID
          setData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              categories: prev.categories.map(cat => ({
                ...cat,
                subcategories: cat.subcategories.map(sub => ({
                  ...sub,
                  dishes: sub.dishes.map(d => 
                    d.id === tempId ? { ...d, ...createdDish } : d
                  )
                }))
              }))
            };
          });
          toast.success('Dish added');
        }
      });
  }, []);

  // INSTANT dish delete
  const deleteDish = useCallback((dishId: string) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        categories: prevData.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(subcategory => ({
            ...subcategory,
            dishes: subcategory.dishes.filter(dish => dish.id !== dishId)
          }))
        }))
      };
    });
    
    // Persist to DB
    supabase
      .from('dishes')
      .delete()
      .eq('id', dishId)
      .then(({ error }) => {
        if (error) {
          toast.error(`Failed to delete dish: ${getErrorMessage(error)}`);
          // Refetch to restore state
          fetchMenu();
        } else {
          toast.success('Dish deleted');
        }
      });
  }, [fetchMenu]);

  // INSTANT reorder dishes
  const reorderDishes = useCallback((subcategoryId: string, orderedIds: string[]) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        categories: prevData.categories.map(category => ({
          ...category,
          subcategories: category.subcategories.map(subcategory => {
            if (subcategory.id !== subcategoryId) return subcategory;
            
            // Reorder dishes based on orderedIds
            const dishMap = new Map(subcategory.dishes.map(d => [d.id, d]));
            const reordered = orderedIds
              .map((id, index) => {
                const dish = dishMap.get(id);
                return dish ? { ...dish, order_index: index } : null;
              })
              .filter((d): d is DishData => d !== null);
            
            return {
              ...subcategory,
              dishes: reordered
            };
          })
        }))
      };
    });
    
    // Persist to DB
    const updates = orderedIds.map((id, index) => ({ id, order_index: index }));
    supabase.rpc('batch_update_order_indexes_optimized', {
      table_name: 'dishes',
      updates
    }).then(({ error }) => {
      if (error) {
        toast.error(`Failed to reorder dishes: ${getErrorMessage(error)}`);
        fetchMenu();
      }
    });
  }, [fetchMenu]);

  // INSTANT restaurant update
  const updateRestaurant = useCallback((updates: Partial<RestaurantData>) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        restaurant: { ...prevData.restaurant, ...updates }
      };
    });
    
    // Persist to DB
    supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to persist restaurant update:', error);
        }
      });
  }, [restaurantId]);

  const refetch = useCallback(async () => {
    await fetchMenu();
  }, [fetchMenu]);

  const value = useMemo<MenuDataContextValue>(() => ({
    data,
    isLoading,
    error,
    updateDish,
    addDish,
    deleteDish,
    reorderDishes,
    updateRestaurant,
    refetch
  }), [data, isLoading, error, updateDish, addDish, deleteDish, reorderDishes, updateRestaurant, refetch]);

  return (
    <MenuDataContext.Provider value={value}>
      {children}
    </MenuDataContext.Provider>
  );
};

export const useMenuData = (): MenuDataContextValue => {
  const context = useContext(MenuDataContext);
  if (!context) {
    throw new Error('useMenuData must be used within a MenuDataProvider');
  }
  return context;
};

// Hook for components that only need to READ menu data (no mutations)
export const useMenuDataReadOnly = () => {
  const { data, isLoading, error } = useMenuData();
  return { data, isLoading, error };
};
