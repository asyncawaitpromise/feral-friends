import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'react-feather';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  tagline?: string;
  ctaText?: string;
  ctaLink?: string;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = "Feral Friends",
  subtitle = "",
  tagline = "Discover, befriend, and train wild animals in a magical world where patience and kindness unlock incredible bonds.",
  ctaText = "Start Playing",
  ctaLink = "/game",
  className = ""
}) => {
  return (
    <section className={`relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 ${className}`}>
      <div className="text-center">
        {/* Game Title */}
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          {title.includes("Feral") ? (
            <>
              <span className="block">Feral</span>
              <span className="block text-green-600">Friends</span>
            </>
          ) : (
            <span className="block">{title}</span>
          )}
          {subtitle && (
            <span className="block text-2xl sm:text-3xl lg:text-4xl text-gray-600 font-normal mt-2">
              {subtitle}
            </span>
          )}
        </h1>
        
        {/* Tagline */}
        <p className="mt-6 text-xl text-gray-600 sm:text-2xl max-w-3xl mx-auto leading-relaxed">
          {tagline}
        </p>
        
        {/* Key Features Preview */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm sm:text-base">
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
            🐰 Befriend Animals
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
            ⚡ Learn Tricks
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
            🏆 Compete Together
          </span>
        </div>
        
        {/* Call to Action Button */}
        <div className="mt-10">
          <Link
            to={ctaLink}
            className="inline-flex items-center px-8 py-4 text-xl font-medium text-white bg-green-600 border border-transparent rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 shadow-lg active:scale-95"
            style={{ minHeight: '44px', minWidth: '44px' }} // Mobile touch target
          >
            <Zap className="w-6 h-6 mr-2" />
            {ctaText}
          </Link>
        </div>
        
        {/* Mobile-specific hint */}
        <p className="mt-4 text-sm text-gray-500 sm:hidden">
          Tap to start your adventure!
        </p>
      </div>
    </section>
  );
};

export default HeroSection;