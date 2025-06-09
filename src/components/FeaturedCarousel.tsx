import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Eye, Gift, Heart, DollarSign, Star, Flame, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PlanPreviewModal from './PlanPreviewModal';

interface FeaturedDevotional {
  id: string;
  title: string;
  author: string;
  description: string;
  price_type: 'free' | 'donation' | 'paid';
  price?: number;
  image_url?: string;
  tags: string[];
  duration_days: number;
  is_featured?: boolean;
}

interface FeaturedCarouselProps {
  onPreview?: (devotional: FeaturedDevotional) => void;
  onPlanStarted?: () => void;
  onExploreMore?: () => void;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ onPreview, onPlanStarted, onExploreMore }) => {
  const [featuredDevotionals, setFeaturedDevotionals] = useState<FeaturedDevotional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDevotional, setSelectedDevotional] = useState<FeaturedDevotional | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadFeaturedDevotionals();
  }, []);

  const loadFeaturedDevotionals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Query Supabase for featured devotionals with exact fields specified
      const { data, error: fetchError } = await supabase
        .from('devotional_marketplace')
        .select('id, title, author, tags, image_url, price_type, description, duration_days')
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to load featured devotionals: ${fetchError.message}`);
      }

      // If no featured devotionals found, fall back to first 6 devotionals for demo
      if (!data || data.length === 0) {
        console.log('No featured devotionals found, falling back to first 6 devotionals');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('devotional_marketplace')
          .select('id, title, author, tags, image_url, price_type, description, duration_days')
          .limit(6)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          throw new Error(`Failed to load devotionals: ${fallbackError.message}`);
        }

        // Mark fallback data as featured for display purposes
        const fallbackFeatured = (fallbackData || []).map(devotional => ({
          ...devotional,
          is_featured: true
        }));

        setFeaturedDevotionals(fallbackFeatured);
      } else {
        // Use actual featured devotionals
        const featured = data.map(devotional => ({
          ...devotional,
          is_featured: true
        }));

        setFeaturedDevotionals(featured);
      }
    } catch (err) {
      console.error('Error loading featured devotionals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load featured devotionals');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriceDisplay = (devotional: FeaturedDevotional) => {
    switch (devotional.price_type) {
      case 'free':
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50 border-green-200' };
      case 'donation':
        return { text: 'Donation', icon: Heart, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'paid':
        return { text: `$${devotional.price}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50 border-purple-200' };
      default:
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50 border-green-200' };
    }
  };

  const handlePreview = (devotional: FeaturedDevotional) => {
    setSelectedDevotional(devotional);
    setShowPreviewModal(true);
    
    if (onPreview) {
      onPreview(devotional);
    }
  };

  const handlePlanStarted = (planId: string) => {
    setShowPreviewModal(false);
    setSelectedDevotional(null);
    
    if (onPlanStarted) {
      onPlanStarted();
    }
  };

  const scrollToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const scrollLeft = () => {
    setCurrentIndex(prev => 
      prev === 0 ? featuredDevotionals.length - 1 : prev - 1
    );
  };

  const scrollRight = () => {
    setCurrentIndex(prev => 
      prev === featuredDevotionals.length - 1 ? 0 : prev + 1
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading featured devotionals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Featured Content</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadFeaturedDevotionals}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (featuredDevotionals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Featured Devotionals</h3>
        <p className="text-gray-600">Check back soon for new featured content!</p>
      </div>
    );
  }

  return (
    <>
      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Arrows - Desktop */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Handpicked for You</h3>
              <p className="text-sm text-gray-600">{featuredDevotionals.length} featured devotionals</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={scrollLeft}
              className="p-2 bg-white bg-opacity-80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-opacity-100 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              aria-label="Previous devotional"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-2 bg-white bg-opacity-80 backdrop-blur-sm text-gray-700 rounded-full hover:bg-opacity-100 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              aria-label="Next devotional"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Track */}
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / Math.min(featuredDevotionals.length, 3))}%)`,
            }}
          >
            {featuredDevotionals.map((devotional, index) => {
              const priceInfo = getPriceDisplay(devotional);
              const PriceIcon = priceInfo.icon;

              return (
                <div
                  key={devotional.id}
                  className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-2"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden border border-gray-100">
                    {/* Image Section */}
                    <div className="relative h-40 bg-gradient-to-br from-blue-500 to-indigo-600 overflow-hidden">
                      {devotional.image_url ? (
                        <img
                          src={devotional.image_url}
                          alt={devotional.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Star className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      <div className="absolute top-3 left-3">
                        <div className="flex items-center px-2 py-1 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-full text-xs font-bold shadow-lg">
                          <Flame className="w-3 h-3 mr-1" />
                          FEATURED
                        </div>
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3">
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priceInfo.color}`}>
                          <PriceIcon className="w-3 h-3 mr-1" />
                          {priceInfo.text}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">
                          {devotional.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">by {devotional.author}</p>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                          {devotional.description}
                        </p>
                      </div>

                      {/* Tags & Duration */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-wrap gap-1">
                          {devotional.tags && devotional.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {devotional.duration_days} days
                        </span>
                      </div>

                      {/* Preview Button */}
                      <button
                        onClick={() => handlePreview(devotional)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {featuredDevotionals.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 w-6'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden justify-center mt-4 space-x-4">
          <button
            onClick={scrollLeft}
            className="flex items-center px-4 py-2 bg-white bg-opacity-80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-opacity-100 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <button
            onClick={scrollRight}
            className="flex items-center px-4 py-2 bg-white bg-opacity-80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-opacity-100 transition-all duration-200"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Explore More Button */}
        <div className="mt-8 text-center">
          <button
            onClick={onExploreMore}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-bold text-lg"
          >
            <BookOpen className="w-6 h-6 mr-3" />
            📚 Explore More Devotionals
          </button>
          <p className="text-center text-sm text-gray-500 mt-3">
            Browse our full marketplace with 50+ devotional plans
          </p>
        </div>
      </div>

      {/* Preview Modal */}
      <PlanPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedDevotional(null);
        }}
        devotional={selectedDevotional}
        onStartPlan={handlePlanStarted}
      />
    </>
  );
};

export default FeaturedCarousel;