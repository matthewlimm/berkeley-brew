"use client";

import React, { useState } from "react";
import { createPost } from "../services/api";
import type { Database } from "@berkeley-brew/api/src/db";
import { calculateSizeAdjustValues } from "next/dist/server/font-utils";
import { IngredientsInput } from "./IngredientsInput";

type Post = Database["public"]["Tables"]["posts"]["Row"];

interface PostProp {
  title: string;
  content: string;
  type: string;
  brew_method: string;
  difficulty_level: number;
  prep_time: number;
  ingredients: string[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PostCreator({ onSuccess, onCancel }: PostProp) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"recipe" | "guide">("recipe");
  const [brew_method, setBrewMethod] = useState("");
  const [difficulty_level, setDifficultyLevel] = useState(5);
  const [prep_time, setPrepTime] = useState(10);
  const [ingredients, setIngredients] = useState<string[]>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await createPost({
        title,
        content,
        type,
        brew_method,
        difficulty_level,
        prep_time,
        ingredients,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          rows={1}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Write your thoughts here..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "recipe" | "guide")}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="recipe">Recipe</option>
          <option value="guide">Guide</option>
        </select>
      </div>

      {/* <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          value = {type}
          onChange={(e) => setType()}

        ></select>
        <
      <div> */}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brew Method
        </label>
        <textarea
          value={brew_method}
          onChange={(e) => setBrewMethod(e.target.value)}
          required
          rows={4}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Brew method here."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty Level
        </label>
        <select
          value={difficulty_level}
          onChange={(e) => setDifficultyLevel(Number(e.target.value))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? "star" : "stars"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prep Time
        </label>
        <input
          value={prep_time}
          type="number"
          onChange={(e) => setPrepTime(Number(e.target.value))}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        ></input>
      </div>

      <IngredientsInput ingredients={ingredients} onChange={setIngredients} />

      {error && <p className="text-sm tect-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
