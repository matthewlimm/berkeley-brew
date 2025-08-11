import { Request, Response, NextFunction } from 'express';
import { supabase, serviceRoleClient } from '../db';
import { AppError } from '../utils/appError';

/**
 * Get the current user's profile
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        
        if (!user) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Get user profile from database using service role client to bypass RLS
        const { data, error } = await serviceRoleClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
        // If user profile doesn't exist in the database, create it automatically
        if (error || !data) {
            console.log('User profile not found in database, creating it now for user ID:', user.id);
            
            // Extract data from auth user
            const username = user.user_metadata?.username || user.email?.split('@')[0] || null;
            const fullName = user.user_metadata?.name || null;
            const avatarUrl = user.user_metadata?.avatar_url || null;
            
            // Create user profile
            const insertData = {
                id: user.id,
                username,
                full_name: fullName,
                avatar_url: avatarUrl,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('Creating user profile with data:', insertData);
            
            // Try to insert the user profile using service role client
            const { data: newUser, error: insertError } = await serviceRoleClient
                .from('users')
                .upsert(insertData)
                .select()
                .single();
                
            if (insertError) {
                console.error('Failed to create user profile:', insertError);
                return next(new AppError('Failed to create user profile: ' + insertError.message, 500));
            }
            
            console.log('User profile created successfully:', newUser);
            
            return res.status(200).json({
                status: 'success',
                data: { user: newUser }
            });
        }
        
        return res.status(200).json({
            status: 'success',
            data: { user: data }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Update the current user's profile
 */
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        
        console.log('Update profile request received for user:', user?.id);
        console.log('Request body:', req.body);
        
        if (!user) {
            return next(new AppError('Authentication required', 401));
        }
        
        // Extract fields from request body, handling both name and full_name
        let { username, full_name, avatar_url, name } = req.body;
        
        // If name is provided but full_name is not, use name for full_name
        if (name && !full_name) {
            full_name = name;
            console.log('Using name field for full_name:', full_name);
        }
        
        if (username === undefined && full_name === undefined && avatar_url === undefined) {
            return next(new AppError('No update data provided', 400));
        }
        
        // First, try to directly update the user record using service role client
        // This will succeed if the user exists, fail if they don't
        console.log('Attempting direct update for user ID:', user.id);
        
        // Prepare update data
        const updateData: { username?: string; full_name?: string; avatar_url?: string; updated_at: string } = {
            updated_at: new Date().toISOString()
        };
        
        if (username) updateData.username = username;
        if (full_name) updateData.full_name = full_name;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url; // Allow empty string
        
        console.log('Update data:', updateData);
        console.log('Avatar URL value:', avatar_url);
        console.log('Avatar URL type:', typeof avatar_url);
        
        const { data: updatedUser, error: updateError } = await serviceRoleClient
            .from('users')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();
            
        // If update succeeded, user exists
        if (!updateError) {
            console.log('User updated successfully:', updatedUser);
            
            // Also update user metadata in auth using service role client
            const { error: authError } = await serviceRoleClient.auth.admin.updateUserById(
                user.id,
                {
                    user_metadata: {
                        username: username || user.user_metadata?.username,
                        name: full_name || user.user_metadata?.name,
                        avatar_url: avatar_url || user.user_metadata?.avatar_url
                    }
                }
            );
            
            if (authError) {
                console.error('Failed to update auth metadata:', authError);
                // Continue anyway since the database was updated successfully
            }
            
            return res.status(200).json({
                status: 'success',
                data: { user: updatedUser }
            });
        }
        
        // If we get here, update failed - check if user exists
        console.log('Update failed, checking if user exists in users table with ID:', user.id);
        console.log('Update error:', updateError);
        
        const { data: existingUser, error: checkError } = await serviceRoleClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
        if (checkError) {
            console.log('User not found in users table, creating record');
            console.log('Error details:', checkError);
            
            // User doesn't exist, we need to create them
            console.log('Creating new user record');
            
            // Prepare insert data with all required fields
            const insertData = {
                id: user.id,
                username: username || user.user_metadata?.username || user.email?.split('@')[0] || null,
                full_name: full_name || user.user_metadata?.name || null,
                avatar_url: avatar_url !== undefined ? avatar_url : (user.user_metadata?.avatar_url || null),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            console.log('Insert data:', insertData);
            
            // Use upsert instead of insert to handle race conditions
            const { data: newUser, error: createError } = await serviceRoleClient
                .from('users')
                .upsert(insertData, { onConflict: 'id' })
                .select()
                .single();
                
            if (createError) {
                console.error('Failed to create user record:', createError);
                
                // One more attempt - try upsert instead
                console.log('Attempting upsert as a fallback');
                const { data: upsertUser, error: upsertError } = await serviceRoleClient
                    .from('users')
                    .upsert(insertData)
                    .select()
                    .single();
                    
                if (upsertError) {
                    console.error('Failed to upsert user record:', upsertError);
                    return next(new AppError('Failed to create or update user profile: ' + upsertError.message, 500));
                }
                
                console.log('User upserted successfully:', upsertUser);
                
                // Also update user metadata in auth
                const { error: authError } = await serviceRoleClient.auth.admin.updateUserById(
                    user.id,
                    {
                        user_metadata: {
                            username: username || user.email?.split('@')[0] || user.user_metadata?.username,
                            name: full_name || user.user_metadata?.name,
                            avatar_url: avatar_url || user.user_metadata?.avatar_url
                        }
                    }
                );
                
                if (authError) {
                    console.error('Failed to update auth metadata:', authError);
                    // Continue anyway since the database was updated successfully
                }
                
                return res.status(200).json({
                    status: 'success',
                    data: { user: upsertUser }
                });
            }
            
            console.log('New user created successfully:', newUser);
            
            // Also update user metadata in auth
            const { error: authError } = await serviceRoleClient.auth.admin.updateUserById(
                user.id,
                {
                    user_metadata: {
                        username: username || user.email?.split('@')[0] || user.user_metadata?.username,
                        name: full_name || user.user_metadata?.name,
                        avatar_url: avatar_url || user.user_metadata?.avatar_url
                    }
                }
            );
            
            if (authError) {
                console.error('Failed to update auth metadata:', authError);
                // Continue anyway since the database was updated successfully
            }
            
            return res.status(201).json({
                status: 'success',
                data: { user: newUser }
            });
        }
        
        // User exists, update the record
        console.log('User exists but update failed, trying again with a different approach');
        
        // Try upsert as a more reliable approach with service role client
        const upsertData = {
            id: user.id,
            username: username !== undefined ? username : existingUser.username,
            full_name: full_name !== undefined ? full_name : existingUser.full_name,
            avatar_url: avatar_url !== undefined ? avatar_url : existingUser.avatar_url,
            updated_at: new Date().toISOString()
        };
        
        console.log('Upsert data:', upsertData);
        
        // Use service role client to bypass RLS policies
        const { data: upsertedUser, error: upsertError } = await serviceRoleClient
            .from('users')
            .upsert(upsertData, {
                onConflict: 'id'
            })
            .select()
            .single();
            
        if (upsertError) {
            console.error('Failed to upsert user profile:', upsertError);
            return next(new AppError('Failed to update user profile: ' + upsertError.message, 500));
        }
        
        console.log('User upserted successfully:', upsertedUser);
        
        // Also update user metadata in auth
        const { error: authError } = await serviceRoleClient.auth.admin.updateUserById(
            user.id,
            {
                user_metadata: {
                    username: username || user.user_metadata?.username,
                    name: full_name || user.user_metadata?.name,
                    avatar_url: avatar_url || user.user_metadata?.avatar_url
                }
            }
        );
        
        if (authError) {
            console.error('Failed to update auth metadata:', authError);
            // Continue anyway since the database was updated successfully
        }
        
        return res.status(200).json({
            status: 'success',
            data: { user: upsertedUser }
        });
    } catch (err) {
        console.error('Error in updateUserProfile:', err);
        next(err);
    }
};

/**
 * Get user reviews
 */
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        
        if (!user) {
            return next(new AppError('Authentication required', 401));
        }
        
        console.log('Fetching reviews for user:', user.id);
        
        // Get user reviews from database using service role client
        const { data, error } = await serviceRoleClient
            .from('reviews')
            .select(`
                *,
                cafes:cafe_id (id, name, address)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching user reviews:', error);
            return next(new AppError('Failed to fetch user reviews: ' + error.message, 500));
        }
        
        // Transform the data to match the expected format
        const transformedReviews = data.map((review: any) => ({
            ...review,
            cafe_name: review.cafes?.name || 'Unknown Cafe',
            // Use existing score fields or default to null
            golden_bear_score: review.golden_bear_score,
            grindability_score: review.grindability_score,
            student_friendliness_score: review.student_friendliness_score,
            coffee_quality_score: review.coffee_quality_score,
            vibe_score: review.vibe_score
        }));
        
        console.log(`Found ${transformedReviews.length} reviews for user`);
        
        return res.status(200).json({
            status: 'success',
            results: transformedReviews.length,
            data: { reviews: transformedReviews }
        });
    } catch (err) {
        console.error('Unexpected error in getUserReviews:', err);
        next(err);
    }
};
