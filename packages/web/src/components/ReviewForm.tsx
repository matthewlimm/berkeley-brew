'use client';

'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { createReview } from '../services/api';
import { 
  GrindabilityTooltip, 
  VibeTooltip, 
  CoffeeQualityTooltip, 
  StudentFriendlyTooltip 
} from './MetricTooltips';

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
  onSuccess?: (reviewData: any) => void;
  onClose: () => void;
}

export function ReviewForm({ cafeId, onSuccess, onClose }: ReviewFormProps) {
  // Helper to get colors based on the rating category
  const getRatingColors = (category: string) => {
    switch (category) {
      case 'Grindability':
        return { selectedBg: 'bg-blue-200', text: 'text-blue-800', ring: 'ring-blue-200' };
      case 'Vibe':
        return { selectedBg: 'bg-pink-200', text: 'text-pink-800', ring: 'ring-pink-200' };
            case 'Coffee Quality':
        return { selectedBg: 'bg-yellow-300', text: 'text-yellow-800', ring: 'ring-yellow-300' };
      case 'Student Friendly':
        return { selectedBg: 'bg-green-200', text: 'text-green-800', ring: 'ring-green-200' };
      default:
        return { selectedBg: 'bg-gray-200', text: 'text-gray-800', ring: 'ring-gray-200' };
    }
  };
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
  }

  // Emoji rating component
  // Helper function to get appropriate emoji for each rating category
  const getEmojiForRating = (category: string, value: number | null) => {
    const emojis: { [key: string]: string[] } = {
      'Grindability': ['😴', '📚', '📝', '💻', '🧠'],
      'Student Friendly': ['🚫', '👋', '🙌', '🎓', '🏆'],
      'Coffee Quality': ['💧', '🍵', '☕', '🔥', '☄️'],
      'Vibe': ['👎', '😕', '😐', '🎵', '🎉']
    };

    if (value !== null && value >= 1 && value <= 5) {
      return emojis[category]?.[value - 1] || '⭐';
    }

    // Return a default, non-rating icon if no value is selected
    switch (category) {
      case 'Grindability':
        return '📚';
      case 'Student Friendly':
        return '🎓';
      case 'Coffee Quality':
        return '☕';
      case 'Vibe':
        return '🎵';
      default:
        return '⭐';
    }
  };

    const EmojiRating = ({ 
    value, 
    onChange, 
    label 
  }: RatingInputProps) => {
    const { selectedBg, text, ring } = getRatingColors(label);
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <span className="text-xl">{getEmojiForRating(label, value)}</span>
            </div>
            <div className="flex items-center">
              <label className="text-sm font-semibold text-gray-800 tracking-wide flex items-center">
                {label}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              {label === 'Grindability' && <GrindabilityTooltip />}
              {label === 'Vibe' && <VibeTooltip />}
              {label === 'Coffee Quality' && <CoffeeQualityTooltip />}
              {label === 'Student Friendly' && <StudentFriendlyTooltip />}
            </div>
          </div>
          {value && (
                        <div className={`px-2 py-0.5 ${selectedBg} ${text} text-xs font-bold rounded-full`}>
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
                  ? `${selectedBg} shadow-md scale-105` 
                  : 'bg-gray-100 hover:bg-gray-200 shadow-sm'
                }
                ${value === null ? `ring-1 ${ring} ring-opacity-50` : ''}
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

  return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-lg mx-auto relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="Close review form"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
                              <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-xl shadow-md mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
                    <h3 className="text-xl font-bold text-gray-800">
            Rate Your Experience
          </h3>
          <p className="text-gray-600 text-xs font-medium">Share your thoughts and help other students</p>
        </div>

        {/* Rating Categories */}
        <div className="space-y-3">
          <EmojiRating
            label="Grindability"
            value={grindabilityScore}
            onChange={setGrindabilityScore}
          />
          <EmojiRating
            label="Vibe"
            value={vibeScore}
            onChange={setVibeScore}
          />
          <EmojiRating
            label="Coffee Quality"
            value={coffeeQualityScore}
            onChange={setCoffeeQualityScore}
          />
          <EmojiRating
            label="Student Friendly"
            value={studentFriendlinessScore}
            onChange={setStudentFriendlinessScore}
          />
        </div>

        {/* Written Review Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-md">
          <div className="flex items-center space-x-2 mb-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 resize-none bg-white/80 backdrop-blur-sm text-sm"
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              <span className="text-red-500 font-bold">*</span>
              <span className="font-medium">All ratings required</span>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Review
                </span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
