'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// TODO: fix profile updated sucess message banner 

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false); // Add a flag to track updates
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      // Set initial values from user data if available
      setName(user.user_metadata?.name || '');
      setUsername(user.user_metadata?.username || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
      
      // Debug user metadata
      console.log('User metadata:', user.user_metadata);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProfileUpdated(false);
    console.log('Form submission started');

    try {
      // Debug the data being sent
      console.log('Updating profile with:', { name, username, avatar_url: avatarUrl });
      
      // Make sure to use the correct field names
      const result = await updateUserProfile({ 
        name,  // This will be converted to full_name in the API service
        username, 
        avatar_url: avatarUrl 
      });
      
      console.log('Profile update result:', result);
      
      // Show success message using both approaches
      console.log('Setting success message');
      setSuccessMessage('Profile updated successfully!');
      setProfileUpdated(true); // Set the flag to true
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        console.log('Auto-hiding success message');
        setSuccessMessage('');
        setProfileUpdated(false);
      }, 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
      
      // Log file details for debugging
      console.log('File selected for upload:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        extension: fileExt
      });
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (PNG, JPG, etc.)');
      }
      
      // Check if file size is reasonable (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }
      
      // Create a path that includes the user ID in the folder structure for RLS policies
      // Always use the same filename regardless of extension to ensure only one avatar exists
      const filePath = `${user?.id}/avatar`;
      
      console.log('Uploading avatar to path:', filePath);
      
      try {
        // First, list all existing avatars for this user
        const { data: existingFiles } = await supabase.storage
          .from('avatars')
          .list(user?.id as string);
        
        console.log('Existing files:', existingFiles);
        
        // Delete any existing avatar files
        if (existingFiles && existingFiles.length > 0) {
          const filesToDelete = existingFiles.map(file => `${user?.id}/${file.name}`);
          console.log('Deleting existing avatar files:', filesToDelete);
          
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove(filesToDelete);
            
          if (deleteError) {
            console.warn('Error deleting existing avatars:', deleteError.message);
            // Continue with upload even if delete fails
          }
        }
      } catch (error) {
        console.warn('Error checking for existing avatars:', error);
        // Continue with upload even if this fails
      }
      
      // Skip bucket check - we'll just try to upload directly
      console.log('Attempting direct upload to avatars bucket');
      
      // Upload the file to the avatars bucket with improved options
      // Include a timestamp and file extension in the path to ensure uniqueness and proper content type
      // This ensures that each upload creates a new file, preventing caching issues
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
        
      console.log('Upload options:', {
        filePath: filePathWithExt,
        contentType: file.type,
        size: file.size
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
      
      console.log('Upload successful:', uploadData);
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePathWithExt);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        setErrorMessage('Failed to get public URL for the uploaded image');
        setUploading(false);
        return;
      }
      
      console.log('Public URL:', publicUrlData.publicUrl);
      
      // Add a strong cache-busting parameter with a unique ID to ensure the browser loads the new image
      // Using a combination of timestamp and random string for better cache busting
      const uniqueId = `${Math.floor(Date.now()/1000)}-${Math.random().toString(36).substring(2, 10)}`;
      const cacheBustedUrl = `${publicUrlData.publicUrl}?v=${uniqueId}`;
      console.log('Cache-busted URL:', cacheBustedUrl);
      
      // Update user metadata with the new avatar URL
      // Store the base URL without cache busting for persistence
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrlData.publicUrl }
      });
      
      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        setErrorMessage(`Failed to update profile: ${updateError.message}`);
        setUploading(false);
        return;
      }
      
      console.log('User metadata updated with avatar URL:', publicUrlData.publicUrl);
      
      // Set the avatar URL in the component state
      setAvatarUrl(cacheBustedUrl);
      
      // Update profile immediately with the new avatar URL
      if (user) {
        console.log('Updating profile with new avatar URL:', cacheBustedUrl);
        
        try {
          const result = await updateUserProfile({
            name,
            username,
            avatar_url: publicUrlData.publicUrl // Store the clean URL in the database
          });
          
          console.log('Profile update result:', result);
          
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
      console.error('Error uploading avatar:', error);
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('storage/bucket-not-found')) {
          setErrorMessage('The avatar storage bucket does not exist. Please contact the administrator.');
        } else if (error.message.includes('storage/unauthorized')) {
          setErrorMessage('You do not have permission to upload files. Please log out and log back in.');
        } else if (error.message.includes('storage/quota-exceeded')) {
          setErrorMessage('Storage quota exceeded. Please contact the administrator.');
        } else {
          // Use the error message directly for other types of errors
          setErrorMessage(`Error uploading avatar: ${error.message}`);
        }
      } else {
        setErrorMessage('Error uploading avatar. Please try again.');
      }
    } finally {
      setUploading(false);
      
      // Reset the file input so the user can try again with the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <p className="text-center text-gray-600">
              Please <Link href="/auth/login" className="text-amber-600 hover:text-amber-500">log in</Link> to view your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile</h3>
            <p className="mt-1 text-sm text-gray-600">
              Update your personal information and how others see you on Berkeley Brew.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Success message - using both conditions for maximum reliability */}
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
                
                {/* Error message */}
                {errorMessage && (
                  <div className="rounded-md p-4 bg-red-100 border border-red-400 mb-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-red-800">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                  <div className="mt-2 flex items-center space-x-5">
                    <div 
                      onClick={handleAvatarClick}
                      className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 128px"
                          priority
                          unoptimized={true} // Bypass Next.js image optimization to avoid caching issues
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
                        <div className="flex items-center justify-center h-full bg-amber-50 text-amber-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
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
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="text-sm text-amber-600 hover:text-amber-500"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Change'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Click on the avatar to upload a new image.</p>
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
                      className="focus:ring-amber-500 focus:border-amber-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 bg-gray-100"
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
                      onChange={(e) => setUsername(e.target.value)}
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
    </div>
  );
}
