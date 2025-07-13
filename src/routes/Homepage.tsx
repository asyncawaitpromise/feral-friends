import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Zap, Users, Map } from 'react-feather';

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Game Title */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            <span className="block">Feral</span>
            <span className="block text-green-600">Friends</span>
          </h1>
          
          {/* Tagline */}
          <p className="mt-6 text-xl text-gray-600 sm:text-2xl max-w-3xl mx-auto">
            Discover, befriend, and train wild animals in a magical world where patience and kindness unlock incredible bonds.
          </p>
          
          {/* Play Button */}
          <div className="mt-10">
            <Link
              to="/game"
              className="inline-flex items-center px-8 py-4 text-xl font-medium text-white bg-green-600 border border-transparent rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Zap className="w-6 h-6 mr-2" />
              Start Playing
            </Link>
          </div>
        </div>
      </section>

      {/* Game Features */}
      <section className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              A World of Wonder Awaits
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Experience the joy of connecting with nature through gentle gameplay
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Befriend Animals</h3>
              <p className="mt-2 text-gray-600">
                Build trust with wild creatures through patience and understanding
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Learn Tricks</h3>
              <p className="mt-2 text-gray-600">
                Teach your companions amazing tricks through fun mini-games
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-purple-100 rounded-full">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Compete Together</h3>
              <p className="mt-2 text-gray-600">
                Show off your bond in friendly competitions and performances
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full">
                <Map className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">Explore Worlds</h3>
              <p className="mt-2 text-gray-600">
                Discover diverse biomes and hidden secrets in beautiful landscapes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots/Concept Section */}
      <section className="py-16 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-8">
              Experience the Magic
            </h2>
            
            {/* Placeholder for screenshots */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gradient-to-br from-green-200 to-green-300 rounded-lg h-48 flex items-center justify-center">
                <p className="text-green-800 font-medium">Animal Discovery</p>
              </div>
              <div className="bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg h-48 flex items-center justify-center">
                <p className="text-blue-800 font-medium">Trick Training</p>
              </div>
              <div className="bg-gradient-to-br from-purple-200 to-purple-300 rounded-lg h-48 flex items-center justify-center sm:col-span-2 lg:col-span-1">
                <p className="text-purple-800 font-medium">World Exploration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="py-16 bg-green-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Begin Your Adventure?
          </h2>
          <p className="mt-4 text-xl text-green-100">
            Step into a world where every creature has a story to tell
          </p>
          
          <div className="mt-8">
            <Link
              to="/game"
              className="inline-flex items-center px-8 py-4 text-xl font-medium text-green-600 bg-white border border-transparent rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Enter Feral Friends
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Feral Friends. Made with ❤️ for nature lovers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;