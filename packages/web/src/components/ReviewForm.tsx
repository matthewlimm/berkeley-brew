'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createReview } from '../services/api';

// Define the API response type
type ApiReviewResponse = {
  review?: {
    id: string;
    content: string;
    grindability_score: number;
    student_friendliness_score: number;
    coffee_quality_score: number;
    vibe_score: number;
    golden_bear_score: number;
    user_id: string;
    cafe_id: string;
    created_at: string;
    updated_at: string;
  };
};

interface ReviewFormProps {
  cafeId: string;
  onSuccess?: (reviewData: { 
    grindability_score: number;
    student_friendliness_score: number;
    coffee_quality_score: number;
    vibe_score: number;
    content?: string;
    id?: string;
    // Include the complete review data from the server
    complete_review?: any;
  }) => void;
  onCancel?: () => void;
}

export function ReviewForm({ cafeId, onSuccess, onCancel }: ReviewFormProps) {
  const [grindabilityScore, setGrindabilityScore] = useState<number | null>(null);
  const [studentFriendlinessScore, setStudentFriendlinessScore] = useState<number | null>(null);
  const [coffeeQualityScore, setCoffeeQualityScore] = useState<number | null>(null);
  const [vibeScore, setVibeScore] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setError('');
    
    // Validate all ratings are selected (written review is optional)
    if (grindabilityScore === null || 
        studentFriendlinessScore === null || 
        coffeeQualityScore === null || 
        vibeScore === null) {
      setValidationError('Please rate all categories before submitting');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Content is optional (but API expects a string, so we use empty string if blank)
      const reviewData = { 
        content: content.trim() || '', // Allow empty content, convert to empty string if blank
        grindability_score: grindabilityScore,
        student_friendliness_score: studentFriendlinessScore,
        coffee_quality_score: coffeeQualityScore,
        vibe_score: vibeScore
      };
      
      // Send the review to the server and get the complete review data back
      const response = await createReview(cafeId, reviewData);
      console.log('Review submission response:', response);
      console.log('Review submission response type:', typeof response);
      console.log('Review submission response JSON:', JSON.stringify(response, null, 2));
      
      // Reset form
      setContent('');
      setGrindabilityScore(null);
      setStudentFriendlinessScore(null);
      setCoffeeQualityScore(null);
      setVibeScore(null);
      setValidationError('');
      
      // Extract the review data from the API response
      const reviewFromServer = response?.data?.review;
      console.log('Review from server:', reviewFromServer);
      
      // Create a complete review object with all necessary data
      const completeReviewData = {
        // Include the original review data
        ...reviewData,
        // Include the content
        content: content.trim() || '',
        // Include the review ID and other data from the server response
        id: reviewFromServer?.id || '',
        // Include the complete review object from the server
        complete_review: reviewFromServer || {},
        // Include the scores
        grindability_score: grindabilityScore,
        student_friendliness_score: studentFriendlinessScore,
        coffee_quality_score: coffeeQualityScore,
        vibe_score: vibeScore
      };
      
      console.log('Sending complete review data to parent:', completeReviewData);
      
      // Pass the complete review data to the onSuccess callback
      onSuccess?.(completeReviewData);
    } catch (err) {
      // Check for specific error message about already having reviewed the cafe
      if (err instanceof Error && err.message.includes('already reviewed this cafe')) {
        setError('You have already submitted a review for this cafe. You can edit your existing review instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit review');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  interface RatingInputProps {
    label: string;
    value: number | null;
    onChange: (value: number) => void;
    icon: React.ReactNode;
  }

  interface TooltipProps {
    content: string;
    isVisible: boolean;
    iconRef: React.RefObject<SVGSVGElement>;
  }
  
  // Tooltip component that uses React Portal
  const Tooltip = ({ content, isVisible, iconRef }: TooltipProps) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    
    useEffect(() => {
      if (iconRef.current && isVisible) {
        const rect = iconRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top,
          left: rect.right
        });
      }
    }, [isVisible, iconRef]);

    if (!isVisible) return null;

    return ReactDOM.createPortal(
      <div 
        className="w-64 bg-white p-2 rounded shadow-lg text-xs text-gray-700 border border-gray-200 z-[9999]"
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateY(-100%)',
        }}
      >
        {content}
      </div>,
      document.body
    );
  };

  // Emoji rating component
  const EmojiRating = ({ 
    value, 
    onChange, 
    icon, 
    label 
  }: RatingInputProps) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const iconRef = useRef<SVGSVGElement>(null);
    
    let tooltipContent = '';
    if (label === 'Grindability') {
      tooltipContent = 'How suitable the cafe is for studying or working. Consider factors like available seating, outlet access, WiFi quality, and noise level.';
    } else if (label === 'Vibe') {
      tooltipContent = 'The overall atmosphere and ambiance of the cafe. Includes decor, music, lighting, and the general feeling or energy of the space.';
    } else if (label === 'Coffee Quality') {
      tooltipContent = 'The taste, freshness, and overall quality of coffee and espresso drinks. Consider flavor profile, consistency, and variety of coffee options available.';
    } else if (label === 'Student-Friendliness') {
      tooltipContent = 'How welcoming the cafe is to students. Includes staff friendliness, policies on laptop use, time limits for seating, and overall attitude toward student customers.';
    }

    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg">
              {icon}
            </div>
            <div className="flex items-center">
              <label className="text-sm font-semibold text-gray-800">
                {label}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="inline-block ml-1.5 relative">
                <svg 
                  ref={iconRef}
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <Tooltip 
                  content={tooltipContent}
                  isVisible={showTooltip}
                  iconRef={iconRef}
                />
              </div>
            </div>
          </div>
          {value && (
            <div className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
              {value}/5
            </div>
          )}
        </div>
        
        <div className="flex justify-center space-x-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`
                relative p-2 rounded-lg transition-all duration-300 transform hover:scale-105
                ${star === value 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 shadow-md scale-105' 
                  : 'bg-gray-100 hover:bg-gray-200 shadow-sm'
                }
                ${value === null ? 'ring-1 ring-red-200 ring-opacity-50' : ''}
              `}
              aria-label={`Rate ${star} out of 5`}
            >
              <span className={`text-xl transition-all duration-200 ${
                star === value ? 'grayscale-0' : 'grayscale hover:grayscale-0'
              }`}>
                {getEmojiForRating(label, star)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get appropriate emoji for each rating category
  const getEmojiForRating = (category: React.ReactNode, value: number) => {
    const emojis = {
      'Grindability': ['😴', '📚', '📝', '💻', '🧠'],
      'Friendly': ['🚫', '👋', '🙌', '🎓', '🏆'],
      'Coffee': ['💧', '🍵', '☕', '🔥', '☄️'],
      'Vibe': ['👎', '😕', '😐', '🎵', '🎉']
    };
    
    // Get the category as a string
    const categoryStr = typeof category === 'string' ? category : 'Student-Friendliness';
    
    // Return the appropriate emoji or default to star
    return emojis[categoryStr as keyof typeof emojis]?.[value - 1] || '⭐';
  };

  return (
    <div className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 p-4 rounded-xl shadow-xl border border-gray-100/50 backdrop-blur-sm max-h-[85vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-md mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Rate Your Experience
          </h3>
          <p className="text-gray-600 text-xs font-medium">Share your thoughts and help other students</p>
        </div>

        {/* Rating Categories */}
        <div className="space-y-3">
        
        <EmojiRating 
          value={grindabilityScore} 
          onChange={setGrindabilityScore} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>}
          label="Grindability"
        />
        
        <EmojiRating 
          value={vibeScore} 
          onChange={setVibeScore} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>}
          label="Vibe"
        />
        
        <EmojiRating 
          value={coffeeQualityScore} 
          onChange={setCoffeeQualityScore} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21h16v-1a1 1 0 00-1-1H3a1 1 0 00-1 1v1zM20 8h-2V5a3 3 0 00-3-3H5a3 3 0 00-3 3v8a4 4 0 004 4h6a4 4 0 004-4V9h2a2 2 0 012 2v2a2 2 0 01-2 2h-1v1h1a3 3 0 003-3v-2a3 3 0 00-3-3z"/>
            <circle cx="6" cy="6" r="1"/>
            <circle cx="10" cy="6" r="1"/>
            <circle cx="14" cy="6" r="1"/>
          </svg>}
          label="Coffee"
        />
        
        <EmojiRating 
          value={studentFriendlinessScore} 
          onChange={setStudentFriendlinessScore} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
          </svg>}
          label="Friendly"
        />
        </div>

        {/* Written Review Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-md">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <label htmlFor="content" className="text-sm font-semibold text-gray-800">
              Your Review <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
          </div>
          <textarea
            id="content"
            rows={3}
            className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 resize-none bg-white/80 backdrop-blur-sm text-sm"
            placeholder="Share your experience at this cafe..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* Error Messages */}
        {(error || validationError) && (
          <div className="p-4 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium shadow-lg">
            {error ? (
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            ) : (
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{validationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-amber-50/80 px-3 py-1.5 rounded-full border border-amber-200/50">
              <span className="text-red-500 font-bold">*</span>
              <span className="font-medium">All ratings required</span>
            </div>
            
            <div className="flex space-x-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-xs font-semibold text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-lg shadow-md text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Submit Review
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
