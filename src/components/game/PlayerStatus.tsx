import React, { useState, useEffect } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { 
  User, 
  MapPin, 
  Package, 
  Heart, 
  Zap, 
  Star, 
  Users, 
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'react-feather';
import { useFadeIn } from '../../hooks/useAnimation';

interface PlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  totalPlayTime: number; // in seconds
}

interface PlayerProgress {
  animalsDiscovered: number;
  animalsTamed: number;
  tricksLearned: number;
  mapsExplored: number;
  itemsCollected: number;
  achievementsUnlocked: number;
}

interface PlayerLocation {
  currentMap: string;
  region: string;
  coordinates: { x: number; y: number };
  biome: string;
}

interface PlayerStatusProps {
  playerName: string;
  stats: PlayerStats;
  progress: PlayerProgress;
  location: PlayerLocation;
  companionCount: number;
  inventoryCount: number;
  maxInventorySlots: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showDetailed?: boolean;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({
  playerName,
  stats,
  progress,
  location,
  companionCount,
  inventoryCount,
  maxInventorySlots,
  isCollapsed = false,
  onToggleCollapse,
  showDetailed = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed);
  const [showAllStats, setShowAllStats] = useState(false);

  // Animation hooks
  const fadeInStyle = useFadeIn(true);
  const expandAnimation = useSpring({
    height: isExpanded ? 'auto' : '60px',
    opacity: isExpanded ? 1 : 0.8,
    config: { tension: 300, friction: 30 }
  });

  const experiencePercentage = (stats.experience / stats.experienceToNext) * 100;
  const energyPercentage = (stats.energy / stats.maxEnergy) * 100;
  const healthPercentage = (stats.health / stats.maxHealth) * 100;

  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCoordinates = (coords: { x: number; y: number }): string => {
    return `${Math.round(coords.x)}, ${Math.round(coords.y)}`;
  };

  const getEnergyColor = (): string => {
    if (energyPercentage >= 75) return 'bg-green-500';
    if (energyPercentage >= 50) return 'bg-yellow-500';
    if (energyPercentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthColor = (): string => {
    if (healthPercentage >= 75) return 'bg-green-500';
    if (healthPercentage >= 50) return 'bg-yellow-500';
    if (healthPercentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    onToggleCollapse?.();
  };

  const ProgressBar: React.FC<{
    current: number;
    max: number;
    color: string;
    backgroundColor?: string;
    height?: string;
    showText?: boolean;
  }> = ({ 
    current, 
    max, 
    color, 
    backgroundColor = 'bg-gray-200', 
    height = 'h-2',
    showText = false 
  }) => {
    const percentage = Math.min((current / max) * 100, 100);
    
    return (
      <div className="relative">
        <div className={`w-full ${height} ${backgroundColor} rounded-full overflow-hidden`}>
          <div 
            className={`${height} ${color} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
            {current}/{max}
          </div>
        )}
      </div>
    );
  };

  const StatItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color?: string;
    subtext?: string;
  }> = ({ icon, label, value, color = 'text-gray-600', subtext }) => (
    <div className="flex items-center gap-2 min-w-0">
      <div className={color}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">{label}</div>
        <div className="text-xs text-gray-600">
          {value}
          {subtext && <span className="ml-1 text-gray-500">({subtext})</span>}
        </div>
      </div>
    </div>
  );

  return (
    <animated.div 
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      style={fadeInStyle}
    >
      {/* Header - Always Visible */}
      <div 
        className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-blue-800">{playerName}</h3>
              <div className="flex items-center gap-4 text-xs text-blue-600">
                <span className="flex items-center gap-1">
                  <Star size={12} />
                  Level {stats.level}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {location.currentMap}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="text-right text-xs text-gray-600 hidden sm:block">
              <div className="flex items-center gap-1 justify-end">
                <Zap size={12} className="text-yellow-500" />
                {stats.energy}/{stats.maxEnergy}
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Users size={12} className="text-purple-500" />
                {companionCount}
              </div>
            </div>
            
            {onToggleCollapse && (
              <button className="text-blue-600 hover:text-blue-800 transition-colors">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <animated.div style={expandAnimation} className="overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Experience Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Experience</span>
              <span className="text-xs text-gray-500">
                {stats.experience}/{stats.experienceToNext} XP
              </span>
            </div>
            <ProgressBar
              current={stats.experience}
              max={stats.experienceToNext}
              color="bg-blue-500"
              height="h-3"
            />
          </div>

          {/* Vital Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Zap size={14} className="text-yellow-500" />
                  Energy
                </span>
                <span className="text-xs text-gray-500">
                  {stats.energy}/{stats.maxEnergy}
                </span>
              </div>
              <ProgressBar
                current={stats.energy}
                max={stats.maxEnergy}
                color={getEnergyColor()}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Heart size={14} className="text-red-500" />
                  Health
                </span>
                <span className="text-xs text-gray-500">
                  {stats.health}/{stats.maxHealth}
                </span>
              </div>
              <ProgressBar
                current={stats.health}
                max={stats.maxHealth}
                color={getHealthColor()}
              />
            </div>
          </div>

          {/* Core Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatItem
              icon={<Users size={16} />}
              label="Companions"
              value={companionCount}
              color="text-purple-500"
            />
            
            <StatItem
              icon={<Package size={16} />}
              label="Inventory"
              value={`${inventoryCount}/${maxInventorySlots}`}
              color="text-amber-500"
            />
            
            <StatItem
              icon={<MapPin size={16} />}
              label="Location"
              value={location.region}
              color="text-green-500"
              subtext={formatCoordinates(location.coordinates)}
            />
          </div>

          {/* Progress Stats - Collapsible */}
          {showDetailed && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Progress Statistics</h4>
                <button
                  onClick={() => setShowAllStats(!showAllStats)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {showAllStats ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showAllStats ? 'Hide' : 'Show'} Details
                </button>
              </div>
              
              <div className={`grid grid-cols-2 gap-3 ${showAllStats ? 'sm:grid-cols-3' : ''}`}>
                <StatItem
                  icon={<Eye size={16} />}
                  label="Discovered"
                  value={progress.animalsDiscovered}
                  color="text-blue-500"
                  subtext="animals"
                />
                
                <StatItem
                  icon={<Heart size={16} />}
                  label="Tamed"
                  value={progress.animalsTamed}
                  color="text-pink-500"
                  subtext="animals"
                />
                
                {showAllStats && (
                  <>
                    <StatItem
                      icon={<Star size={16} />}
                      label="Tricks"
                      value={progress.tricksLearned}
                      color="text-yellow-500"
                      subtext="learned"
                    />
                    
                    <StatItem
                      icon={<MapPin size={16} />}
                      label="Maps"
                      value={progress.mapsExplored}
                      color="text-green-500"
                      subtext="explored"
                    />
                    
                    <StatItem
                      icon={<Package size={16} />}
                      label="Items"
                      value={progress.itemsCollected}
                      color="text-orange-500"
                      subtext="collected"
                    />
                    
                    <StatItem
                      icon={<Award size={16} />}
                      label="Achievements"
                      value={progress.achievementsUnlocked}
                      color="text-purple-500"
                      subtext="unlocked"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                Play time: {formatPlayTime(stats.totalPlayTime)}
              </div>
              <div>
                Biome: {location.biome}
              </div>
            </div>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
};

export default PlayerStatus;