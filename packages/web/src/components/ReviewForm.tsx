'use client';

import React, { useState } from 'react';
import { createReview } from '../services/api';

interface ReviewFormProps {
  cafeId: string;
  onSuccess?: (reviewData: { 
    grindability_score: number;
    student_friendliness_score: number;
    coffee_quality_score: number;
    vibe_score: number;
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
      await createReview(cafeId, { 
        content: content.trim() || '', // Allow empty content, convert to empty string if blank
        grindability_score: grindabilityScore,
        student_friendliness_score: studentFriendlinessScore,
        coffee_quality_score: coffeeQualityScore,
        vibe_score: vibeScore
      });
      
      // Reset form
      setContent('');
      setGrindabilityScore(null);
      setStudentFriendlinessScore(null);
      setCoffeeQualityScore(null);
      setVibeScore(null);
      setValidationError('');
      onSuccess?.({
        grindability_score: grindabilityScore,
        student_friendliness_score: studentFriendlinessScore,
        coffee_quality_score: coffeeQualityScore,
        vibe_score: vibeScore
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Emoji rating component
  const EmojiRating = ({ 
    value, 
    onChange, 
    icon, 
    label 
  }: { 
    value: number | null; 
    onChange: (value: number) => void; 
    icon: React.ReactNode;
    label: React.ReactNode;
  }) => {
    return (
      <div className="mb-5">
        <div className="flex items-center mb-2">
          <span className="mr-2 text-lg">{icon}</span>
          <label className="text-sm font-medium text-gray-700">
            {label}
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
        <div className="flex space-x-3 justify-center bg-white p-2 rounded-full shadow-sm border-2 transition-all duration-200 ease-in-out" 
          style={{ borderColor: value === null ? 'rgb(239 68 68 / 0.2)' : 'transparent' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`text-2xl transition-all duration-200 ${star === value ? 'scale-125' : 'scale-100'}`}
              style={{
                opacity: value === null ? 0.5 : (star === value ? 1 : 0.6),
                filter: star === value ? 'none' : 'grayscale(30%)',
                transform: `scale(${star === value ? 1.25 : 1})`,
              }}
              aria-label={`Rate ${star} out of 5`}
            >
              {getEmojiForRating(label, star)}
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
      'Student-Friendliness': ['😠', '😐', '🙂', '😊', '😁'],
      'Friendliness': ['😠', '😐', '🙂', '😊', '😁'], // Added to match page.tsx label change
      'Coffee Quality': ['🤮', '🫤', '☕', '😋', '🤤'],
      'Vibe': ['👎', '😕', '😐', '🎵', '🎉']
    };
    
    // Get the category as a string
    const categoryStr = typeof category === 'string' ? category : 'Student-Friendliness';
    
    // Return the appropriate emoji or default to star
    return emojis[categoryStr as keyof typeof emojis]?.[value - 1] || '⭐';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-lg shadow-inner">
        <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Rate Your Experience
        </h3>
        
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
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Cup body */}
            <path d="M17 7H3v8a4 4 0 004 4h6a4 4 0 004-4V7z" fill="currentColor" />
            {/* Cup handle */}
            <path d="M17 7h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" fill="none" />
            {/* Steam */}
            <path d="M7 3s.5-1 2-1 2 1 2 1" fill="none" />
            <path d="M11 3s.5-1 2-1 2 1 2 1" fill="none" />
          </svg>}
          label="Coffee Quality"
        />
        
        <EmojiRating 
          value={studentFriendlinessScore} 
          onChange={setStudentFriendlinessScore} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd" />
          </svg>}
          label="Student-Friendliness"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          Your Review
          <span className="text-xs text-gray-500 ml-2">(optional)</span>
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border-amber-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 bg-amber-50/30 p-3"
          placeholder="Share your thoughts about this cafe..."
        />
      </div>

      {(error || validationError) && (
        <div className="p-3 mb-4 text-sm bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error || validationError}
        </div>
      )}

      <div className="mt-8">
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-full border border-amber-100 mb-4 inline-block">
          <span className="text-red-500 font-bold">*</span> All ratings are required
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end w-full gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-full shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 border-0 rounded-full shadow-md hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105 hover:shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Review'}
            </button>
        </div>
      </div>
    </form>
  );
}
