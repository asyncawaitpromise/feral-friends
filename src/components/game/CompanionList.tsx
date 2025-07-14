import React, { useState } from 'react';
import { animated } from '@react-spring/web';
import { 
  Users, 
  Heart, 
  Star, 
  Play, 
  Gift,
  ChevronRight,
  Calendar,
  Activity,
  X,
  Search,
  Filter
} from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';

export interface CompanionData {
  id: string;
  name: string;
  species: string;
  type: string; // 'rabbit', 'bird', etc.
  trustLevel: number;
  maxTrust: number;
  energy: number;
  maxEnergy: number;
  happiness: number;
  bondLevel: number; // 1-5 stars
  personality: string;
  dateCompanioned: number; // timestamp
  lastInteraction: number; // timestamp
  favoriteFood?: string;
  favoriteActivity?: string;
  knownTricks: string[];
  stats: {
    tricksPerformed: number;
    gamesPlayed: number;
    foodsEaten: number;
    daysAsCompanion: number;
  };
  status: 'active' | 'resting' | 'playing' | 'eating' | 'learning';
  location?: string;
  isAvailable: boolean; // Can be interacted with
}

interface CompanionListProps {
  isOpen: boolean;
  onClose: () => void;
  companions: CompanionData[];
  onSelectCompanion?: (companion: CompanionData) => void;
  onInteractWithCompanion?: (companionId: string, action: string) => void;
  onFeedCompanion?: (companionId: string) => void;
  onPlayWithCompanion?: (companionId: string) => void;
  onTrainCompanion?: (companionId: string) => void;
  showEmptyState?: boolean;
}

type SortMode = 'name' | 'species' | 'trust' | 'bond' | 'recent';
type FilterMode = 'all' | 'available' | 'resting' | 'playing';

const SPECIES_EMOJIS: Record<string, string> = {
  rabbit: '🐰',
  bird: '🐦',
  squirrel: '🐿️',
  fox: '🦊',
  deer: '🦌',
  butterfly: '🦋',
  frog: '🐸',
  turtle: '🐢',
  cat: '🐱',
  dog: '🐕'
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  resting: 'bg-blue-100 text-blue-800',
  playing: 'bg-purple-100 text-purple-800',
  eating: 'bg-orange-100 text-orange-800',
  learning: 'bg-yellow-100 text-yellow-800'
};

const PERSONALITY_TRAITS: Record<string, { color: string; icon: string }> = {
  playful: { color: 'text-purple-500', icon: '🎈' },
  curious: { color: 'text-blue-500', icon: '🔍' },
  shy: { color: 'text-pink-500', icon: '😊' },
  energetic: { color: 'text-orange-500', icon: '⚡' },
  calm: { color: 'text-green-500', icon: '🧘' },
  friendly: { color: 'text-yellow-500', icon: '😄' },
  independent: { color: 'text-gray-500', icon: '🎭' }
};

export const CompanionList: React.FC<CompanionListProps> = ({
  isOpen,
  onClose,
  companions,
  onSelectCompanion,
  onInteractWithCompanion,
  onFeedCompanion,
  onPlayWithCompanion,
  onTrainCompanion,
  showEmptyState = true
}) => {
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionData | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { playButtonClick, playSuccess } = useSound();

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'left');
  const fadeInStyle = useFadeIn(isOpen);

  // Filter and sort companions
  const filteredCompanions = companions
    .filter(companion => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!companion.name.toLowerCase().includes(query) && 
            !companion.species.toLowerCase().includes(query) &&
            !companion.personality.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      switch (filterMode) {
        case 'available':
          return companion.isAvailable;
        case 'resting':
          return companion.status === 'resting';
        case 'playing':
          return companion.status === 'playing';
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortMode) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'species':
          return a.species.localeCompare(b.species);
        case 'trust':
          return b.trustLevel - a.trustLevel;
        case 'bond':
          return b.bondLevel - a.bondLevel;
        case 'recent':
          return b.lastInteraction - a.lastInteraction;
        default:
          return 0;
      }
    });

  const staggeredCompanions = useStagger(filteredCompanions, 100);

  const handleCompanionClick = (companion: CompanionData) => {
    setSelectedCompanion(companion);
    onSelectCompanion?.(companion);
    playButtonClick();
  };

  const handleAction = (companionId: string, action: string) => {
    playSuccess();
    switch (action) {
      case 'feed':
        onFeedCompanion?.(companionId);
        break;
      case 'play':
        onPlayWithCompanion?.(companionId);
        break;
      case 'train':
        onTrainCompanion?.(companionId);
        break;
      default:
        onInteractWithCompanion?.(companionId, action);
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getTrustColor = (trust: number, maxTrust: number): string => {
    const percentage = (trust / maxTrust) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderBondStars = (bondLevel: number): React.ReactNode => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < bondLevel ? 'text-yellow-500 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const renderCompanionCard = (companion: CompanionData) => {
    const isSelected = selectedCompanion?.id === companion.id;
    const speciesEmoji = SPECIES_EMOJIS[companion.type] || '🐾';
    const personality = PERSONALITY_TRAITS[companion.personality] || PERSONALITY_TRAITS.friendly;

    return (
      <div
        className={`
          p-4 border rounded-lg cursor-pointer transition-all duration-200
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
          ${!companion.isAvailable ? 'opacity-75' : ''}
        `}
        onClick={() => handleCompanionClick(companion)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-2xl">
              {speciesEmoji}
            </div>
            {!companion.isAvailable && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-semibold text-gray-800 truncate">{companion.name}</h4>
              <div className="flex items-center gap-1">
                {renderBondStars(companion.bondLevel)}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">{companion.species}</span>
              <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[companion.status]}`}>
                {companion.status}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Trust</span>
                  <span>{companion.trustLevel}/{companion.maxTrust}</span>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-1 ${getTrustColor(companion.trustLevel, companion.maxTrust)} transition-all duration-300`}
                    style={{ width: `${(companion.trustLevel / companion.maxTrust) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Energy</span>
                  <span>{companion.energy}/{companion.maxEnergy}</span>
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-1 bg-yellow-500 transition-all duration-300"
                    style={{ width: `${(companion.energy / companion.maxEnergy) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Personality and Tricks */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className={personality.color}>{personality.icon}</span>
                <span>{companion.personality}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={10} />
                <span>{companion.knownTricks.length} tricks</span>
              </div>
            </div>

            {/* Last Interaction */}
            <div className="text-xs text-gray-400 mt-1">
              Last seen: {formatTimeAgo(companion.lastInteraction)}
            </div>
          </div>

          {/* Actions Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Could open action menu
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-4 border-purple-200"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="text-purple-600" size={24} />
              <h2 className="text-xl font-bold text-purple-800">Companions</h2>
              <span className="text-sm text-purple-600">
                ({companions.length} total)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-purple-200 text-purple-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter size={16} />
              </button>
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search companions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              {/* Filter by Status */}
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="resting">Resting</option>
                <option value="playing">Playing</option>
              </select>
              
              {/* Sort by */}
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="recent">Recently Seen</option>
                <option value="name">Name</option>
                <option value="species">Species</option>
                <option value="trust">Trust Level</option>
                <option value="bond">Bond Level</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {filteredCompanions.length === 0 ? (
            <div className="text-center py-8">
              {companions.length === 0 ? (
                showEmptyState && (
                  <>
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                      No companions yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Explore the world and befriend animals to build your companion collection!
                    </p>
                    <Button
                      variant="primary"
                      onClick={onClose}
                    >
                      Start Exploring
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Search className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    No companions found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {staggeredCompanions((style, companion: CompanionData) => (
                <animated.div key={companion.id} style={style}>
                  {renderCompanionCard(companion)}
                </animated.div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Companion Details */}
        {selectedCompanion && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="text-3xl">
                {SPECIES_EMOJIS[selectedCompanion.type] || '🐾'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{selectedCompanion.name}</h3>
                  <div className="flex items-center gap-1">
                    {renderBondStars(selectedCompanion.bondLevel)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    {selectedCompanion.stats.daysAsCompanion} days together
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={12} />
                    {selectedCompanion.stats.tricksPerformed} tricks performed
                  </div>
                  <div className="flex items-center gap-1">
                    <Play size={12} />
                    {selectedCompanion.stats.gamesPlayed} games played
                  </div>
                  <div className="flex items-center gap-1">
                    <Gift size={12} />
                    {selectedCompanion.stats.foodsEaten} treats eaten
                  </div>
                </div>

                {selectedCompanion.favoriteFood && (
                  <p className="text-xs text-gray-500 mb-2">
                    Favorite food: {selectedCompanion.favoriteFood}
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {selectedCompanion.isAvailable && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Heart size={14} />}
                      onClick={() => handleAction(selectedCompanion.id, 'feed')}
                    >
                      Feed
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Play size={14} />}
                      onClick={() => handleAction(selectedCompanion.id, 'play')}
                    >
                      Play
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Star size={14} />}
                      onClick={() => handleAction(selectedCompanion.id, 'train')}
                    >
                      Train
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </animated.div>
    </animated.div>
  );
};

export default CompanionList;