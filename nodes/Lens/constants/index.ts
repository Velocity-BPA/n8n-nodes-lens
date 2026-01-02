/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// API Endpoints
export const LENS_API_MAINNET = 'https://api.lens.xyz/graphql';
export const LENS_API_TESTNET = 'https://api-v2-amoy.lens.dev/graphql';

// Chain IDs
export const LENS_CHAIN_ID = 37111;
export const POLYGON_CHAIN_ID = 137;
export const POLYGON_AMOY_CHAIN_ID = 80002;

// Default Pagination
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 50;

// Resource Names
export const RESOURCES = {
	PROFILES: 'profiles',
	PUBLICATIONS: 'publications',
	FOLLOWS: 'follows',
	REACTIONS: 'reactions',
	COLLECTS: 'collects',
	FEEDS: 'feeds',
	GROUPS: 'groups',
	AUTHENTICATION: 'authentication',
	NOTIFICATIONS: 'notifications',
	MODULES: 'modules',
	SEARCH: 'search',
	METADATA: 'metadata',
	REVENUE: 'revenue',
	UTILITY: 'utility',
} as const;

// Publication Types
export const PUBLICATION_TYPES = {
	POST: 'POST',
	COMMENT: 'COMMENT',
	MIRROR: 'MIRROR',
	QUOTE: 'QUOTE',
} as const;

// Reaction Types
export const REACTION_TYPES = {
	UPVOTE: 'UPVOTE',
	DOWNVOTE: 'DOWNVOTE',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
	ALL: 'ALL',
	FOLLOWED: 'FOLLOWED',
	MENTIONED: 'MENTIONED',
	REACTED: 'REACTED',
	COMMENTED: 'COMMENTED',
	MIRRORED: 'MIRRORED',
	QUOTED: 'QUOTED',
	ACTED: 'ACTED',
	COLLECTED: 'COLLECTED',
} as const;

// Module Types
export const MODULE_TYPES = {
	FOLLOW: 'FOLLOW',
	COLLECT: 'COLLECT',
	REFERENCE: 'REFERENCE',
	OPEN_ACTION: 'OPEN_ACTION',
} as const;

// Explore Order By
export const EXPLORE_ORDER_BY = {
	LATEST: 'LATEST',
	TOP_REACTED: 'TOP_REACTED',
	TOP_COMMENTED: 'TOP_COMMENTED',
	TOP_MIRRORED: 'TOP_MIRRORED',
	TOP_COLLECTED: 'TOP_COLLECTED',
} as const;

// Profile Explore Order By
export const PROFILE_EXPLORE_ORDER_BY = {
	CREATED_ON: 'CREATED_ON',
	MOST_FOLLOWERS: 'MOST_FOLLOWERS',
	LATEST_CREATED: 'LATEST_CREATED',
	MOST_POSTS: 'MOST_POSTS',
	MOST_COMMENTS: 'MOST_COMMENTS',
	MOST_MIRRORS: 'MOST_MIRRORS',
	MOST_PUBLICATION: 'MOST_PUBLICATION',
	MOST_COLLECTS: 'MOST_COLLECTS',
} as const;

// Content Focus
export const CONTENT_FOCUS = {
	TEXT_ONLY: 'TEXT_ONLY',
	ARTICLE: 'ARTICLE',
	IMAGE: 'IMAGE',
	VIDEO: 'VIDEO',
	AUDIO: 'AUDIO',
	LINK: 'LINK',
	EMBED: 'EMBED',
	CHECKING_IN: 'CHECKING_IN',
	EVENT: 'EVENT',
	MINT: 'MINT',
	TRANSACTION: 'TRANSACTION',
	LIVESTREAM: 'LIVESTREAM',
	SHORT_VIDEO: 'SHORT_VIDEO',
	SPACE: 'SPACE',
	STORY: 'STORY',
} as const;

// Follow Module Types
export const FOLLOW_MODULE_TYPES = {
	FEE_FOLLOW_MODULE: 'FeeFollowModule',
	REVERT_FOLLOW_MODULE: 'RevertFollowModule',
	FREE_FOLLOW_MODULE: 'FreeFollowModule',
} as const;

// Reference Module Types
export const REFERENCE_MODULE_TYPES = {
	FOLLOWER_ONLY_REFERENCE_MODULE: 'FollowerOnlyReferenceModule',
	DEGREES_OF_SEPARATION_REFERENCE_MODULE: 'DegreesOfSeparationReferenceModule',
} as const;

// Open Action Module Types
export const OPEN_ACTION_MODULE_TYPES = {
	SIMPLE_COLLECT_OPEN_ACTION_MODULE: 'SimpleCollectOpenActionModule',
	MULTIRECIPIENT_FEE_COLLECT_OPEN_ACTION_MODULE: 'MultirecipientFeeCollectOpenActionModule',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
	AUTHENTICATION_REQUIRED: 'Authentication required for this operation',
	PROFILE_NOT_FOUND: 'Profile not found',
	PUBLICATION_NOT_FOUND: 'Publication not found',
	INVALID_PROFILE_ID: 'Invalid profile ID format',
	INVALID_PUBLICATION_ID: 'Invalid publication ID format',
	INVALID_HANDLE: 'Invalid handle format',
	RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
	NETWORK_ERROR: 'Network error occurred',
	GRAPHQL_ERROR: 'GraphQL error occurred',
} as const;

// Handle Namespace
export const HANDLE_NAMESPACE = 'lens';
