'use client';

import React, { useState } from 'react';

interface CafePlaceIdFieldProps {
  cafeId: string;
  initialPlaceId?: string;
  onSave: (placeId: string) => Promise<void>;
}

export const CafePlaceIdField: React.FC<CafePlaceIdFieldProps> = ({ cafeId, initialPlaceId = '', onSave }) => {
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(placeId);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save Place ID');
      console.error('Error saving Place ID:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700">Google Place ID</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 text-xs text-gray-500">
          Find Place ID using the{' '}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
          >
            Google Places API
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center">
        <label className="block text-sm font-medium text-gray-700">Google Place ID:</label>
        <span className="ml-2 text-sm text-gray-500">{placeId || 'Not set'}</span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="ml-3 inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default CafePlaceIdField;
