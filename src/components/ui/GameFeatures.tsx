import React from 'react';
import { Heart, Zap, Users, Map, Eye, Gift, Star, Compass } from 'react-feather';

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

interface GameFeaturesProps {
  className?: string;
  showTitle?: boolean;
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'list';
}

const GameFeatures: React.FC<GameFeaturesProps> = ({
  className = "",
  showTitle = true,
  title = "A World of Wonder Awaits",
  subtitle = "Experience the joy of connecting with nature through gentle gameplay",
  layout = 'grid'
}) => {
  const features: Feature[] = [
    {
      icon: Eye,
      title: "Discover Animals",
      description: "Explore diverse habitats and encounter over 20 unique species, each with their own behaviors and personalities waiting to be discovered.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: Heart,
      title: "Build Trust",
      description: "Use patience and understanding to slowly gain the trust of wild creatures. Every animal requires a different approach and rewards gentle persistence.",
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      icon: Zap,
      title: "Teach Tricks",
      description: "Once bonded, teach your animal friends amazing tricks through fun, intuitive mini-games designed perfectly for mobile play.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Users,
      title: "Compete & Perform",
      description: "Show off the special bond with your companions in friendly competitions and performances that celebrate your achievements together.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Map,
      title: "Explore Biomes",
      description: "Journey through lush forests, peaceful meadows, rushing streams, and mysterious caves, each home to different creatures.",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      icon: Gift,
      title: "Collect & Share",
      description: "Gather natural treats and items to help in your taming journey. Share discoveries with friends and build your collection.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      icon: Star,
      title: "Progress & Achieve",
      description: "Unlock new areas, advanced tricks, and rare animals as you grow from a novice to a master animal friend.",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      icon: Compass,
      title: "Play Anywhere",
      description: "Designed for mobile-first play with offline support. Continue your adventure whether you're at home or exploring the real outdoors.",
      color: "text-teal-600",
      bgColor: "bg-teal-100"
    }
  ];

  const gridClasses = layout === 'grid' 
    ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    : "space-y-6";

  return (
    <section className={`py-16 ${className}`}>
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {showTitle && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className={`mt-16 ${gridClasses}`}>
          {features.map(({ icon: Icon, title, description, color, bgColor }, index) => (
            <div 
              key={title}
              className={`text-center p-6 rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                layout === 'list' ? 'flex items-start space-x-4 text-left' : ''
              }`}
            >
              <div className={`flex items-center justify-center w-16 h-16 ${
                layout === 'list' ? 'flex-shrink-0' : 'mx-auto'
              } ${bgColor} rounded-full`}>
                <Icon className={`w-8 h-8 ${color}`} />
              </div>
              
              <div className={layout === 'list' ? 'flex-1' : ''}>
                <h3 className={`${layout === 'list' ? 'mt-0' : 'mt-4'} text-xl font-semibold text-gray-900`}>
                  {title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile-specific encouragement */}
        <div className="mt-12 text-center sm:hidden">
          <p className="text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
            🎮 Optimized for mobile • 📱 Touch-friendly controls • 🔄 Works offline
          </p>
        </div>
      </div>
    </section>
  );
};

export default GameFeatures;