'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, session, updateUserProfile } = useAuth();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorMessageRef = useRef('');
  
  // Custom error setter that persists the message using direct DOM manipulation
  const setErrorMessagePersistent = (message: string) => {
    errorMessageRef.current = message;
    setErrorMessage(message);
    
    // If message is not empty, force display using multiple approaches
    if (message) {
      // Approach 1: Force re-render with a small delay
      setTimeout(() => {
        // Force re-render by setting state again
        if (errorMessageRef.current === message) {
          setErrorMessage(message);
        }
      }, 10);
      
      // Approach 2: DOM manipulation backup
      setTimeout(() => {
        const errorContainer = document.querySelector('[data-error-banner]');
        if (errorContainer) {
          errorContainer.classList.remove('hidden');
          const errorText = errorContainer.querySelector('[data-error-text]');
          if (errorText) {
            errorText.textContent = message;
          }
        } else {
          // Try one more time to set the state
          if (errorMessageRef.current === message) {
            setErrorMessage(message);
          }
        }
      }, 100);
    }
  };
  const [successMessage, setSuccessMessage] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // Track active tab
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preventProfileReloadRef = useRef(false);

  useEffect(() => {
    // Check if user just verified their email
    const verified = searchParams.get('verified');
    if (verified === 'true' && user) {
      // Only show banner for users who signed up recently (within last 1 second)
      // This prevents showing the banner for existing users who are just re-verifying
      const userCreatedAt = new Date(user.created_at);
      const now = new Date();
      const timeDifference = now.getTime() - userCreatedAt.getTime();
      const oneSecondInMs = 1000; // 1 second in milliseconds
      
      if (timeDifference <= oneSecondInMs) {
        setShowVerificationBanner(true);
        // Auto-hide banner after 8 seconds
        setTimeout(() => {
          setShowVerificationBanner(false);
        }, 8000);
      }
    }
  }, [searchParams, user]);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          // First try to get profile data from the API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/user/profile`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token || ''}`
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            const profile = profileData.data?.user;
            
            if (profile) {
              setName(profile.full_name || '');
              setUsername(profile.username || '');
              setAvatarUrl(profile.avatar_url || '');
              return;
            }
          }
        } catch (error) {
          console.warn('Failed to load profile from API, using metadata:', error);
        }
        
        // Fallback to user metadata if API call fails
        setName(user.user_metadata?.name || '');
        setUsername(user.user_metadata?.username || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');
      }
    };
    
    // Don't reload profile if there's an error being displayed or if we're preventing reloads
    if (!errorMessage && !preventProfileReloadRef.current) {
      loadUserProfile();
    }
  }, [user, session, errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProfileUpdated(false);

    try {
      const result = await updateUserProfile({ 
        name,
        username, 
        avatar_url: avatarUrl 
      });
      
      setSuccessMessage('Profile updated successfully!');
      setProfileUpdated(true);
      
      setTimeout(() => {
        setSuccessMessage('');
        setProfileUpdated(false);
      }, 5000);
    } catch (error) {
      console.error('Profile update failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a username conflict error
      if (errorMessage.includes('Username already taken') || errorMessage.includes('already taken')) {
        const conflictMessage = 'Username already taken. Please choose a different username.';
        setErrorMessagePersistent(conflictMessage);
        preventProfileReloadRef.current = true; // Prevent profile reloads
      } else {
        const genericMessage = `Failed to update profile: ${errorMessage}`;
        setErrorMessagePersistent(genericMessage);
        preventProfileReloadRef.current = true; // Prevent profile reloads
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setErrorMessage('');
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (PNG, JPG, etc.)');
      }
      
      // Check if file size is reasonable (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }
      
      // Create a path that includes the user ID in the folder structure for RLS policies
      // Using the format userId/avatar (no extension) as per the app's storage structure
      const filePath = `${user?.id}/avatar`;
      
      try {
        // First, list all existing avatars for this user
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(user?.id as string);
        
        // Delete any existing avatar files
        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map(file => `${user?.id}/${file.name}`);
          
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove(filesToDelete);
            
          if (deleteError) {
            console.warn('Error deleting existing avatars:', deleteError.message);
          }
        }
      } catch (error) {
        console.warn('Error checking for existing avatars:', error);
      }
      
      // Upload the file to the avatars bucket with improved options
      const timestamp = Date.now();
      const filePathWithExt = `${filePath}-${timestamp}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePathWithExt, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if file exists
          contentType: file.type, // Explicitly set the content type
          duplex: 'half' // Fix for potential streaming issues
        });
        
      if (uploadError) {
        console.error('Upload error details:', uploadError);
        
        // Provide more specific error messages based on the error code
        if (uploadError.message.includes('storage/unauthorized') || uploadError.message.includes('row-level security')) {
          setErrorMessage('Failed to upload image: You are not authorized to upload to this location. This may be due to a Row Level Security policy.');
          console.error('This might be a RLS policy issue. Make sure the storage policy allows users to upload to their own folder.');
        } else if (uploadError.message.includes('storage/object-too-large')) {
          setErrorMessage('Failed to upload image: File size exceeds the maximum limit');
        } else {
          setErrorMessage(`Failed to upload image: ${uploadError.message}`);
        }
        
        // Log additional debugging information
        console.log('User ID:', user?.id);
        console.log('File path:', filePath);
        console.log('Error message:', uploadError.message);
        
        setUploading(false);
        return;
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePathWithExt);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        setErrorMessage('Failed to get public URL for the uploaded image');
        setUploading(false);
        return;
      }
      
      // Add a strong cache-busting parameter with a unique ID to ensure the browser loads the new image
      const uniqueId = `${Math.floor(Date.now()/1000)}-${Math.random().toString(36).substring(2, 10)}`;
      const cacheBustedUrl = `${publicUrlData.publicUrl}?v=${uniqueId}`;
      
      // Update user metadata with the new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrlData.publicUrl }
      });
      
      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        setErrorMessage(`Failed to update profile: ${updateError.message}`);
        setUploading(false);
        return;
      }
      
      // Set the avatar URL in the component state
      setAvatarUrl(cacheBustedUrl);
      
      // Update profile immediately with the new avatar URL
      if (user) {
        try {
          const result = await updateUserProfile({
            name,
            username,
            avatar_url: publicUrlData.publicUrl // Store the clean URL in the database
          });
          
          // Show success message
          setSuccessMessage('Profile picture updated successfully!');
          setProfileUpdated(true);
          
          // Auto-hide success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
            setProfileUpdated(false);
          }, 5000);
        } catch (updateError) {
          console.error('Error updating profile with avatar:', updateError);
          throw new Error('Avatar uploaded but profile update failed. Please try again.');
        }
      }
    } catch (error) {
      setErrorMessage(`${error instanceof Error ? error.message : 'An error occurred during upload'}`);
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Email Verification Success Banner */}
      {showVerificationBanner && (
        <div className="mb-8 rounded-md bg-green-50 border border-green-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Email verified successfully!
              </h3>
              <div className="mt-1 text-sm text-green-700">
                Welcome to Berkeley Brew! Your account is now fully activated and you can start exploring cafes, writing reviews, and bookmarking your favorites.
              </div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowVerificationBanner(false)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pb-6 border-b border-gray-200 mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-amber-600 border-amber-600 font-semibold' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('quickAccess')}
            className={`whitespace-nowrap py-4 px-4 border-b-2 text-sm font-medium transition-colors ${activeTab === 'quickAccess' ? 'text-amber-600 border-amber-600 font-semibold' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
          >
            Quick Access
          </button>
        </nav>
      </div>
      
      {/* Profile Section */}
      {activeTab === 'profile' && (
      <div className="md:grid md:grid-cols-3 md:gap-8 mb-10">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-xl font-bold leading-6 text-gray-800">Profile</h3>
            <p className="mt-2 text-sm text-gray-600">
              This information will be displayed publicly so be careful what you share.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow-md rounded-xl overflow-hidden border border-gray-100">
              <div className="px-6 pt-2 pb-6 bg-white space-y-4 sm:px-8 sm:pt-3 sm:pb-8">
                {/* Success message */}
                {(successMessage || profileUpdated) && (
                  <div id="success-message-container" className="rounded-md p-4 bg-green-100 border border-green-400 mb-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">
                        {successMessage || 'Profile updated successfully!'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Error message - Always rendered but conditionally visible */}
                <div 
                  data-error-banner 
                  className={`rounded-md p-4 bg-red-100 border border-red-400 mb-4 ${
                    (!errorMessage && !errorMessageRef.current) ? 'hidden' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p data-error-text className="text-sm font-medium text-red-800">
                      {errorMessage || errorMessageRef.current}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <div className="mt-2 flex items-center space-x-5">
                    <div 
                      onClick={handleAvatarClick}
                      className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity ring-4 ring-amber-50"
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 128px"
                          priority
                          unoptimized={true}
                          onError={(e) => {
                            console.error('Image failed to load:', avatarUrl);
                            // Fall back to placeholder on error
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('bg-gray-100');
                              parent.innerHTML = `
                                <svg class="h-10 w-10 text-gray-300 m-auto" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                              `;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-amber-100 text-amber-700 font-medium text-4xl">
                          {(username || user?.user_metadata?.username || user?.email)?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={uploadAvatar}
                      className="hidden"
                    />
                    <div className="flex flex-col space-y-2">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="text-sm text-amber-600 hover:text-amber-500 font-medium"
                        disabled={uploading}
                      >
                        {uploading ? 'Uploading...' : 'Change'}
                      </button>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setUploading(true);
                              setErrorMessage('');
                              
                              // List all existing avatars for this user
                              const { data: existingFiles } = await supabase.storage
                                .from('avatars')
                                .list(user?.id as string);
                              
                              // Delete any existing avatar files
                              if (existingFiles && existingFiles.length > 0) {
                                const filesToDelete = existingFiles.map(file => `${user?.id}/${file.name}`);
                                
                                const { error: deleteError } = await supabase.storage
                                  .from('avatars')
                                  .remove(filesToDelete);
                                  
                                if (deleteError) {
                                  console.warn('Error deleting existing avatars:', deleteError.message);
                                  setErrorMessage(`Failed to delete profile picture: ${deleteError.message}`);
                                  return;
                                }
                              }
                              
                              // Update user metadata to remove avatar URL
                              const { error: updateError } = await supabase.auth.updateUser({
                                data: { avatar_url: null }
                              });
                              
                              if (updateError) {
                                console.error('Error updating user metadata:', updateError);
                                setErrorMessage(`Failed to update profile: ${updateError.message}`);
                                return;
                              }
                              
                              // Update profile with the removed avatar URL
                              await updateUserProfile({
                                name,
                                username,
                                avatar_url: '' // Use empty string instead of null
                              });
                              
                              // Clear avatar URL in component state
                              setAvatarUrl('');
                              
                              // Show success message
                              setSuccessMessage('Profile picture removed successfully!');
                              setProfileUpdated(true);
                              
                              // Auto-hide success message after 5 seconds
                              setTimeout(() => {
                                setSuccessMessage('');
                                setProfileUpdated(false);
                              }, 5000);
                              
                            } catch (error) {
                              setErrorMessage(`${error instanceof Error ? error.message : 'An error occurred while removing profile picture'}`);
                            } finally {
                              setUploading(false);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-500 font-medium"
                          disabled={uploading}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Click on the avatar to upload a new image or use the remove button to delete it.</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="email"
                      id="email"
                      className="focus:ring-amber-500 focus:border-amber-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 bg-gray-100 py-2.5"
                      value={user.email || ''}
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Your email cannot be changed.</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="focus:ring-amber-500 focus:border-amber-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      name="username"
                      id="username"
                      className="focus:ring-amber-500 focus:border-amber-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      placeholder="Your username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        // Clear error when user changes username
                        if (errorMessage) {
                          setErrorMessage('');
                          preventProfileReloadRef.current = false;
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">This will be displayed on your reviews and posts.</p>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}
      
      {/* Dashboard Navigation Cards */}
      {activeTab === 'quickAccess' && (
      <div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Reviews Card */}
          <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">My Reviews</h3>
              </div>
              <div className="text-sm text-gray-500 mb-5">
                View and manage your cafe reviews and ratings
              </div>
              <Link
                href="/dashboard/reviews"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                View Reviews
              </Link>
            </div>
          </div>
          
          {/* Bookmarks Card */}
          <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">My Bookmarks</h3>
              </div>
              <div className="text-sm text-gray-500 mb-5">
                Access your saved cafes and favorite spots
              </div>
              <Link
                href="/dashboard/bookmarks"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                View Bookmarks
              </Link>
            </div>
          </div>
          
          {/* Home Card */}
          <div className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl border border-gray-100">
            <div className="px-6 py-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Explore Cafes</h3>
              </div>
              <div className="text-sm text-gray-500 mb-5">
                Discover new cafes around Berkeley campus
              </div>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              >
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
