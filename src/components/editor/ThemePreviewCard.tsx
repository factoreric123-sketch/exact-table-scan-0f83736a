import { Theme } from '@/lib/types/theme';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemePreviewCardProps {
  theme: Theme;
  isActive: boolean;
  onHover: () => void;
  onClick: () => void;
}

export const ThemePreviewCard = ({
  theme,
  isActive,
  onHover,
  onClick,
}: ThemePreviewCardProps) => {
  return (
    <button
      className={cn(
        'relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg',
        isActive
          ? 'border-primary shadow-md'
          : 'border-border hover:border-primary/50'
      )}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-left">{theme.name}</h3>

        {/* Color palette preview */}
        <div className="flex gap-1">
          <div
            className="w-8 h-8 rounded"
            style={{ background: `hsl(${theme.colors.background})` }}
            title="Background"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ background: `hsl(${theme.colors.primary})` }}
            title="Primary"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ background: `hsl(${theme.colors.accent})` }}
            title="Accent"
          />
          <div
            className="w-8 h-8 rounded"
            style={{ background: `hsl(${theme.colors.card})` }}
            title="Card"
          />
        </div>


        {/* Mode indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-3 h-3 rounded-full',
            theme.visual.mode === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
          )} />
          <span className="text-xs text-muted-foreground capitalize">
            {theme.visual.mode}
          </span>
        </div>
      </div>
    </button>
  );
};
