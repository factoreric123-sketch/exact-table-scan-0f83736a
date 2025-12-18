import { useParams } from 'react-router-dom';
import { MenuDataProvider, useMenuData } from '@/contexts/MenuDataContext';
import { UnifiedMenuRenderer } from '@/components/menu/UnifiedMenuRenderer';
import RestaurantHeader from '@/components/RestaurantHeader';
import { useThemePreview } from '@/hooks/useThemePreview';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const PublicMenuContent = () => {
  const { data, isLoading, error } = useMenuData();
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Apply theme
  useThemePreview(data?.restaurant?.theme as any, !!data?.restaurant);

  // Set initial category
  useEffect(() => {
    if (data?.categories?.length && !activeCategory) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data?.categories, activeCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-muted/30 animate-skeleton-pulse border-b border-border" />
        <div className="h-64 md:h-80 bg-muted/50 animate-skeleton-pulse" />
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-full animate-skeleton-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-square bg-muted rounded-2xl animate-skeleton-pulse" />
                <div className="h-4 bg-muted rounded animate-skeleton-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Found</h1>
          <p className="text-muted-foreground">This menu doesn't exist or has been removed.</p>
          <Button onClick={() => window.location.href = '/'}>Return Home</Button>
        </div>
      </div>
    );
  }

  if (!data.restaurant.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Menu Not Available</h1>
          <p className="text-muted-foreground">This menu hasn't been published yet.</p>
          <Button onClick={() => window.location.href = '/'}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RestaurantHeader
        name={data.restaurant.name}
        tagline={data.restaurant.tagline || ''}
        heroImageUrl={data.restaurant.hero_image_url}
      />
      <UnifiedMenuRenderer
        mode="live"
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </div>
  );
};

interface PublicMenuProps {
  slugOverride?: string;
}

const PublicMenu = ({ slugOverride }: PublicMenuProps = {}) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || urlSlug;

  // For now, we need restaurant ID - fetch it from slug first
  // This is a simplified version - the full implementation would resolve slug to ID
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Loading menu for: {slug}</p>
      </div>
    </div>
  );
};

export default PublicMenu;
