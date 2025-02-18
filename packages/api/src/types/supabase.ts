export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AmenityType = 'low' | 'medium' | 'high'

export interface Database {
  public: {
    Tables: {
      post: {
        Row: {
          id: string
          title: string
          content: string
          type: 'recipe' | 'guide'
          author_id: string
          brew_method: string
          difficulty_level: number
          prep_time: number
          ingredients: string[] | null
          likes_count: number
          comments_count: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type: 'recipe' | 'guide'
          author_id: string
          brew_method: string
          difficulty_level: number
          prep_time: number
          ingredients?: string[] | null
          likes_count?: number
          comments_count?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'recipe' | 'guide'
          author_id?: string
          brew_method?: string
          difficulty_level?: number
          prep_time?: number
          ingredients?: string[] | null
          likes_count?: number
          comments_count?: number
          updated_at?: string
          created_at?: string
        }
      }
      cafes: {
        Row: {
          id: string
          name: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          cafe_id: string
          user_id: string
          content: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          cafe_id: string
          user_id: string
          content: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          cafe_id?: string
          user_id?: string
          content?: string
          rating?: number
          created_at?: string
        }
      }
      cafes_realtime_data: {
        Row: {
          id: string
          cafe_id: string
          user_id: string
          wifi_availability: AmenityType
          outlet_availability: AmenityType
          seating: AmenityType
        }
        Insert: {
          id?: string
          cafe_id: string
          user_id: string
          wifi_availability: AmenityType
          outlet_availability: AmenityType
          seating: AmenityType
        }
        Update: {
          id?: string
          cafe_id?: string
          user_id?: string
          wifi_availability?: AmenityType
          outlet_availability?: AmenityType
          seating?: AmenityType
        }
      }
      users: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
        }
      }
    }
    Enums: {
      amenity_type: AmenityType
    }
  }
}