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