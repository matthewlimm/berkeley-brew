"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReviews = exports.updateUserProfile = exports.getCurrentUser = void 0;
const db_1 = require("../db");
const appError_1 = require("../utils/appError");
/**
 * Get the current user's profile
 */
const getCurrentUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return next(new appError_1.AppError('Authentication required', 401));
        }
        // Get user profile from database using service role client to bypass RLS
        const { data, error } = yield db_1.serviceRoleClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        // If user profile doesn't exist in the database, create it automatically
        if (error || !data) {
            console.log('User profile not found in database, creating it now for user ID:', user.id);
            // Extract data from auth user
            const username = ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.username) || ((_b = user.email) === null || _b === void 0 ? void 0 : _b.split('@')[0]) || null;
            const fullName = ((_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.name) || null;
            const avatarUrl = ((_d = user.user_metadata) === null || _d === void 0 ? void 0 : _d.avatar_url) || null;
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
            // Try to insert the user profile
            const { data: newUser, error: insertError } = yield db_1.serviceRoleClient
                .from('users')
                .upsert(insertData)
                .select()
                .single();
            if (insertError) {
                console.error('Failed to create user profile:', insertError);
                return next(new appError_1.AppError('Failed to create user profile: ' + insertError.message, 500));
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
    }
    catch (err) {
        next(err);
    }
});
exports.getCurrentUser = getCurrentUser;
/**
 * Update the current user's profile
 */
const updateUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        console.log('Update profile request received for user:', user === null || user === void 0 ? void 0 : user.id);
        console.log('Request body:', req.body);
        if (!user) {
            return next(new appError_1.AppError('Authentication required', 401));
        }
        // Extract fields from request body, handling both name and full_name
        let { username, full_name, avatar_url, name } = req.body;
        // If name is provided but full_name is not, use name for full_name
        if (name && !full_name) {
            full_name = name;
            console.log('Using name field for full_name:', full_name);
        }
        if (!username && !full_name && !avatar_url) {
            return next(new appError_1.AppError('No update data provided', 400));
        }
        // First, try to directly update the user record
        // This will succeed if the user exists, fail if they don't
        console.log('Attempting direct update for user ID:', user.id);
        // Prepare update data
        const updateData = {
            updated_at: new Date().toISOString()
        };
        if (username)
            updateData.username = username;
        if (full_name)
            updateData.full_name = full_name;
        if (avatar_url)
            updateData.avatar_url = avatar_url;
        console.log('Update data:', updateData);
        const { data: updatedUser, error: updateError } = yield db_1.serviceRoleClient
            .from('users')
            .update(updateData)
            .eq('id', user.id)
            .select()
            .single();
        // If update succeeded, user exists
        if (!updateError) {
            console.log('User updated successfully:', updatedUser);
            // Also update user metadata in auth
            const { error: authError } = yield db_1.serviceRoleClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    username: username || ((_a = user.user_metadata) === null || _a === void 0 ? void 0 : _a.username),
                    name: full_name || ((_b = user.user_metadata) === null || _b === void 0 ? void 0 : _b.name),
                    avatar_url: avatar_url || ((_c = user.user_metadata) === null || _c === void 0 ? void 0 : _c.avatar_url)
                }
            });
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
        const { data: existingUser, error: checkError } = yield db_1.serviceRoleClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        if (checkError) {
            console.log('User not found in users table, creating record');
            console.log('Error details:', checkError);
            // User doesn't exist, we need to create them
            console.log('Creating new user record');
            // Prepare insert data
            const insertData = {
                id: user.id,
                username: username || ((_d = user.email) === null || _d === void 0 ? void 0 : _d.split('@')[0]) || null,
                full_name: full_name || null,
                avatar_url: avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            console.log('Insert data:', insertData);
            // Try to insert the user
            const { data: newUser, error: createError } = yield db_1.serviceRoleClient
                .from('users')
                .insert(insertData)
                .select()
                .single();
            if (createError) {
                console.error('Failed to create user record:', createError);
                // One more attempt - try upsert instead
                console.log('Attempting upsert as a fallback');
                const { data: upsertUser, error: upsertError } = yield db_1.serviceRoleClient
                    .from('users')
                    .upsert(insertData)
                    .select()
                    .single();
                if (upsertError) {
                    console.error('Failed to upsert user record:', upsertError);
                    return next(new appError_1.AppError('Failed to create or update user profile: ' + upsertError.message, 500));
                }
                console.log('User upserted successfully:', upsertUser);
                // Also update user metadata in auth
                const { error: authError } = yield db_1.supabase.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        username: username || ((_e = user.email) === null || _e === void 0 ? void 0 : _e.split('@')[0]) || ((_f = user.user_metadata) === null || _f === void 0 ? void 0 : _f.username),
                        name: full_name || ((_g = user.user_metadata) === null || _g === void 0 ? void 0 : _g.name),
                        avatar_url: avatar_url || ((_h = user.user_metadata) === null || _h === void 0 ? void 0 : _h.avatar_url)
                    }
                });
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
            const { error: authError } = yield db_1.serviceRoleClient.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    username: username || ((_j = user.email) === null || _j === void 0 ? void 0 : _j.split('@')[0]) || ((_k = user.user_metadata) === null || _k === void 0 ? void 0 : _k.username),
                    name: full_name || ((_l = user.user_metadata) === null || _l === void 0 ? void 0 : _l.name),
                    avatar_url: avatar_url || ((_m = user.user_metadata) === null || _m === void 0 ? void 0 : _m.avatar_url)
                }
            });
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
        // Try upsert as a more reliable approach
        const upsertData = {
            id: user.id,
            username: username || existingUser.username,
            full_name: full_name || existingUser.full_name,
            avatar_url: avatar_url || existingUser.avatar_url,
            updated_at: new Date().toISOString()
        };
        console.log('Upsert data:', upsertData);
        const { data: upsertedUser, error: upsertError } = yield db_1.serviceRoleClient
            .from('users')
            .upsert(upsertData)
            .select()
            .single();
        if (upsertError) {
            console.error('Failed to upsert user profile:', upsertError);
            return next(new appError_1.AppError('Failed to update user profile: ' + upsertError.message, 500));
        }
        console.log('User upserted successfully:', upsertedUser);
        // Also update user metadata in auth
        const { error: authError } = yield db_1.serviceRoleClient.auth.admin.updateUserById(user.id, {
            user_metadata: {
                username: username || ((_o = user.user_metadata) === null || _o === void 0 ? void 0 : _o.username),
                name: full_name || ((_p = user.user_metadata) === null || _p === void 0 ? void 0 : _p.name),
                avatar_url: avatar_url || ((_q = user.user_metadata) === null || _q === void 0 ? void 0 : _q.avatar_url)
            }
        });
        if (authError) {
            console.error('Failed to update auth metadata:', authError);
            // Continue anyway since the database was updated successfully
        }
        return res.status(200).json({
            status: 'success',
            data: { user: upsertedUser }
        });
    }
    catch (err) {
        console.error('Error in updateUserProfile:', err);
        next(err);
    }
});
exports.updateUserProfile = updateUserProfile;
/**
 * Get user reviews
 */
const getUserReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user) {
            return next(new appError_1.AppError('Authentication required', 401));
        }
        console.log('Fetching reviews for user:', user.id);
        // Get user reviews from database
        const { data, error } = yield db_1.serviceRoleClient
            .from('reviews')
            .select(`
                *,
                cafes:cafe_id (id, name, address)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching user reviews:', error);
            return next(new appError_1.AppError('Failed to fetch user reviews: ' + error.message, 500));
        }
        // Transform the data to match the expected format
        const transformedReviews = data.map(review => {
            var _a;
            return (Object.assign(Object.assign({}, review), { cafe_name: ((_a = review.cafes) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Cafe', 
                // Use existing score fields or default to null
                golden_bear_score: review.golden_bear_score, grindability_score: review.grindability_score, student_friendliness_score: review.student_friendliness_score, coffee_quality_score: review.coffee_quality_score, vibe_score: review.vibe_score }));
        });
        console.log(`Found ${transformedReviews.length} reviews for user`);
        return res.status(200).json({
            status: 'success',
            results: transformedReviews.length,
            data: { reviews: transformedReviews }
        });
    }
    catch (err) {
        console.error('Unexpected error in getUserReviews:', err);
        next(err);
    }
});
exports.getUserReviews = getUserReviews;
