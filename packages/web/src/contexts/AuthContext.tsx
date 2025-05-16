'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { updateUserProfile as apiUpdateUserProfile } from '@/services/api'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, name?: string, username?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: { name?: string; username?: string; avatar_url?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true)
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }
      
      // Debug session information
      console.log('Current session:', session)
      console.log('Current user:', session?.user)
      
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user || null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string, username?: string) => {
    try {
      setIsLoading(true)
      
      // Default username to email prefix if not provided
      const defaultUsername = username || email.split('@')[0]
      
      console.log('Attempting to sign up user with:', { 
        email, 
        name, 
        username: defaultUsername 
      })
      
      // Use a simpler sign-up approach with minimal metadata
      // This reduces the chance of database errors
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // Only include minimal metadata to avoid database errors
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        console.error('Supabase signup error details:', error)
        throw error
      }
      
      if (!data.user) {
        throw new Error('No user returned from signup')
      }
      
      // Debug user creation
      console.log('User created successfully with ID:', data.user.id)
      
      // After successful signup, update the user metadata separately
      // This approach is more reliable than setting metadata during signup
      if (data.user) {
        try {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              name,
              username: defaultUsername
            }
          })
          
          if (updateError) {
            console.warn('Could not update user metadata, but signup was successful:', updateError)
          } else {
            console.log('User metadata updated successfully')
          }
        } catch (updateError) {
          console.warn('Error updating user metadata, but signup was successful:', updateError)
        }
      }
      
      // Redirect to verification page or login
      router.push('/auth/verify')
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        throw error
      }
      
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // Redirect to home
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      
      if (error) {
        throw error
      }
      
      // Redirect to confirmation page
      router.push('/auth/reset-confirmation')
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserProfile = async (data: { name?: string; username?: string; avatar_url?: string }) => {
    try {
      setIsLoading(true)
      
      if (!user) {
        throw new Error('No user logged in')
      }
      
      // Get current user metadata
      const currentMetadata = user.user_metadata || {}
      
      // Default username to email prefix if not provided and not already set
      if (!data.username && !currentMetadata.username && user.email) {
        data.username = user.email.split('@')[0]
      }
      
      console.log('Updating user profile with data:', data)
      
      // First update the user profile in the database via API
      try {
        // Map the frontend field names to the backend field names
        const apiResult = await apiUpdateUserProfile({
          full_name: data.name,  // Convert 'name' to 'full_name' for the API
          username: data.username,
          avatar_url: data.avatar_url
        })
        console.log('API update result:', apiResult)
      } catch (apiError) {
        console.error('Error updating profile in API:', apiError)
        throw apiError
      }
      
      // Then update user metadata in Supabase Auth
      const { error, data: userData } = await supabase.auth.updateUser({
        data: {
          ...currentMetadata,
          name: data.name,
          username: data.username,
          avatar_url: data.avatar_url
        }
      })
      
      if (error) {
        console.error('Error updating Supabase Auth:', error)
        throw error
      }
      
      console.log('Auth update result:', userData)
      console.log('Profile updated successfully in both Auth and Database')
      
      // Refresh the session to get the updated user data
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
