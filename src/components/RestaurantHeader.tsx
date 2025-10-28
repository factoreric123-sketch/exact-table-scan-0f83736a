import heroImage from "@/assets/restaurant-hero.jpg";

interface RestaurantHeaderProps {
  name: string;
  tagline?: string;
  heroImageUrl?: string | null;
}

const RestaurantHeader = ({ name, tagline, heroImageUrl }: RestaurantHeaderProps) => {
  return (
    <div className="relative h-64 overflow-hidden">
      <img 
        src={heroImageUrl || heroImage} 
        alt="Restaurant interior" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
      <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
        <h1 className="text-4xl font-bold text-white mb-1 drop-shadow-lg">{name}</h1>
        {tagline && <p className="text-sm text-white/90 drop-shadow-md">{tagline}</p>}
      </div>
    </div>
  );
};

export default RestaurantHeader;
