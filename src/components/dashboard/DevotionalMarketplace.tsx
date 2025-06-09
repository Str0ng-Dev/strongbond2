import React, { useState } from 'react';
import { Search, Filter, Tag, DollarSign, Gift, Heart, Play, Eye, BookOpen } from 'lucide-react';
import { devotionalPlans } from '../../data/mockData';
import { DevotionalPlan } from '../../types';
import { supabase } from '../../lib/supabase';

interface DevotionalMarketplaceProps {
  onPlanStarted?: () => void;
}

const DevotionalMarketplace: React.FC<DevotionalMarketplaceProps> = ({ onPlanStarted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [startingPlan, setStartingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(devotionalPlans.flatMap(plan => plan.tags)));

  // Filter plans based on search and filters
  const filteredPlans = devotionalPlans.filter(plan => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plan.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || plan.tags.includes(selectedTag);
    const matchesType = !selectedType || plan.price_type === selectedType;
    
    return matchesSearch && matchesTag && matchesType;
  });

  const getPriceDisplay = (plan: DevotionalPlan) => {
    switch (plan.price_type) {
      case 'free':
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50' };
      case 'donation':
        return { text: 'Donation', icon: Heart, color: 'text-blue-600 bg-blue-50' };
      case 'paid':
        return { text: `$${plan.price}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50' };
      default:
        return { text: 'Free', icon: Gift, color: 'text-green-600 bg-green-50' };
    }
  };

  const handleStartPlan = async (planId: string) => {
    const userData = localStorage.getItem('onboarding_data');
    if (!userData) {
      setError('User data not found. Please log in again.');
      return;
    }

    const { user_id } = JSON.parse(userData);
    if (!user_id) {
      setError('User ID not found. Please log in again.');
      return;
    }

    const confirmStart = window.confirm('Starting a new plan will archive your current plan. Are you sure you want to continue?');
    if (!confirmStart) return;

    setStartingPlan(planId);
    setError(null);

    try {
      // Step 1: Archive current active plan (set is_active = false)
      const { error: archiveError } = await supabase
        .from('user_devotional_plan')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('is_active', true);

      if (archiveError) {
        throw new Error(`Failed to archive current plan: ${archiveError.message}`);
      }

      // Step 2: Check if a record already exists for this user and devotional
      const { data: existingPlan, error: checkError } = await supabase
        .from('user_devotional_plan')
        .select('id')
        .eq('user_id', user_id)
        .eq('devotional_id', planId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing plan: ${checkError.message}`);
      }

      if (existingPlan) {
        // Step 3a: Update existing record
        const { error: updateError } = await supabase
          .from('user_devotional_plan')
          .update({
            start_date: new Date().toISOString(),
            current_day: 1,
            is_active: true,
            completed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlan.id);

        if (updateError) {
          throw new Error(`Failed to restart plan: ${updateError.message}`);
        }
      } else {
        // Step 3b: Insert new record
        const { error: insertError } = await supabase
          .from('user_devotional_plan')
          .insert({
            user_id: user_id,
            devotional_id: planId,
            start_date: new Date().toISOString(),
            current_day: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw new Error(`Failed to start new plan: ${insertError.message}`);
        }
      }

      // Success! Show confirmation and trigger callback
      const selectedPlan = devotionalPlans.find(p => p.id === planId);
      alert(`🎉 Successfully started "${selectedPlan?.title}"! Your new devotional journey begins now.`);
      
      // Trigger callback to refresh dashboard
      if (onPlanStarted) {
        onPlanStarted();
      }

    } catch (err) {
      console.error('Error starting new plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to start new plan');
    } finally {
      setStartingPlan(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Start</h2>
            <p className="text-gray-600">Browse popular devotionals</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search devotionals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Types</option>
            <option value="free">Free</option>
            <option value="donation">Donation</option>
            <option value="paid">Paid</option>
          </select>

          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredPlans.slice(0, 4).map(plan => {
          const priceInfo = getPriceDisplay(plan);
          const PriceIcon = priceInfo.icon;
          const isStarting = startingPlan === plan.id;

          return (
            <div key={plan.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
              <div className="flex space-x-4">
                <img
                  src={plan.image}
                  alt={plan.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">{plan.title}</h3>
                      <p className="text-sm text-gray-600">by {plan.author}</p>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-lg ${priceInfo.color}`}>
                      <PriceIcon className="w-3 h-3 mr-1" />
                      <span className="text-xs font-medium">{priceInfo.text}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-gray-500 px-2 py-1">
                        {plan.duration_days} days
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        title="Preview plan details"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </button>
                      <button 
                        onClick={() => handleStartPlan(plan.id)}
                        disabled={isStarting}
                        className={`flex items-center px-3 py-1 text-sm rounded-lg font-medium transition-all duration-200 ${
                          isStarting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md transform hover:scale-105'
                        }`}
                      >
                        {isStarting ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 mr-1" />
                            Start Plan
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Explore More Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold">
          <BookOpen className="w-5 h-5 mr-3" />
          📚 Explore More Devotionals
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Browse our full marketplace with 50+ devotional plans
        </p>
      </div>

      {filteredPlans.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No devotional plans match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DevotionalMarketplace;