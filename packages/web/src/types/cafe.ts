import type { Database } from '@berkeley-brew/api/src/types/database.types';
import { Json } from '@berkeley-brew/api/src/types/database.types';

// Base Cafe type from the database
type BaseCafe = Database['public']['Tables']['cafes']['Row'];

// Business hours interface
export interface BusinessHours {
  open_now?: boolean;
  periods?: {
    open?: {
      day: number;
      time: string;
    };
    close?: {
      day: number;
      time: string;
    };
  }[];
  weekday_text?: string[];
}

// Extended Cafe type with additional properties used in the frontend
export interface ExtendedCafe extends BaseCafe {
  business_hours?: BusinessHours;
  average_rating?: number;
  place_id?: string;
  location?: {
    lat: number;
    lng: number;
  };
  price_level?: number;
  website?: string;
  phone?: string;
  types?: string[];
}
