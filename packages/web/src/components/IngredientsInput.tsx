"use client";

import React, { useState } from "react";

interface IngredientsInputProps {
  ingredients: string[];
  onChange: (ingredients: string[]) => void;
}

export function IngredientsInput({ ingredients, onChange }: IngredientsInputProps) {
  const [newIngredient, setNewIngredient] = useState("");

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      onChange([...ingredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Ingredients
      </label>
      
      <div className="flex mb-2">
        <input
          type="text"
          value={newIngredient}
          onChange={(e) => setNewIngredient(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Add an ingredient"
        />
        <button
          type="button"
          onClick={handleAddIngredient}
          className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add
        </button>
      </div>
      
      {ingredients.length > 0 && (
        <ul className="space-y-2 mt-2">
          {ingredients.map((ingredient, index) => (
            <li 
              key={index} 
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
            >
              <span className="text-sm">{ingredient}</span>
              <button
                type="button"
                onClick={() => handleRemoveIngredient(index)}
                className="text-red-500 hover:text-red-700 focus:outline-none"
                aria-label="Remove ingredient"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 