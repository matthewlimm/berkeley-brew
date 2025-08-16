'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { getUserProfile, updateUserProfile as apiUpdateUserProfile } from '@/services/api'

type UserProfile = {
  id: string
  full_name?: string
  username?: string
  avatar_url?: string
  email?: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  isLoading: boolean
  signUp: (email: string, password: string, name?: string, username?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: { name?: string; username?: string; avatar_url?: string }) => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to fetch user profile from database
  const refreshUserProfile = async () => {
    if (!user) {
      setUserProfile(null)
      return
    }
    
    try {
      const response = await getUserProfile()
      if (response.data && response.data.user) {
        setUserProfile(response.data.user)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fall back to auth metadata if database fetch fails
      if (user.user_metadata) {
        setUserProfile({
          id: user.id,
          full_name: user.user_metadata.name,
          username: user.user_metadata.username,
          avatar_url: user.user_metadata.avatar_url,
          email: user.email
        })
      }
    }
  }

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

  // Fetch user profile when user changes
  useEffect(() => {
    if (user) {
      refreshUserProfile()
    } else {
      setUserProfile(null)
    }
  }, [user])

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
      
      // Sign up with Supabase Auth
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            name,
            username: defaultUsername
          },
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
      console.log('User metadata:', data.user.user_metadata)
      
      // Create user profile in database via API
      // This ensures the user record exists in our users table
      if (data.user && name && defaultUsername) {
        try {
          console.log('Creating user profile in database...')
          
          // Call our API to create the user profile
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session?.access_token}`
            },
            body: JSON.stringify({
              full_name: name,
              username: defaultUsername
            })
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.warn('Failed to create user profile in database:', errorData)
            // Don't throw error here - signup was successful, profile creation can be done later
          } else {
            const profileData = await response.json()
            console.log('User profile created in database:', profileData)
          }
        } catch (profileError) {
          console.warn('Error creating user profile in database:', profileError)
          // Don't throw error here - signup was successful, profile creation can be done later
        }
      }
      
      // Redirect to verification page
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
      // If this fails, the error will immediately propagate and skip all subsequent operations
      const apiResult = await apiUpdateUserProfile({
        full_name: data.name,  // Convert 'name' to 'full_name' for the API
        username: data.username,
        avatar_url: data.avatar_url
      })
      console.log('API update result:', apiResult)
      
      // Only continue if API update was successful
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
      
      // Only refresh the user profile from database if update was successful
      await refreshUserProfile()
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
    userProfile,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    refreshUserProfile,
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
