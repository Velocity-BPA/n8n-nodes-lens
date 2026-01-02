/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject, INodePropertyOptions } from 'n8n-workflow';

/**
 * Simplify profile data for output
 */
export function simplifyProfile(profile: IDataObject): IDataObject {
	if (!profile) return {};

	const handle = profile.handle as IDataObject;
	const metadata = profile.metadata as IDataObject;
	const stats = profile.stats as IDataObject;
	const ownedBy = profile.ownedBy as IDataObject;

	return {
		id: profile.id,
		handle: handle?.fullHandle || null,
		localName: handle?.localName || null,
		namespace: handle?.namespace || null,
		displayName: metadata?.displayName || null,
		bio: metadata?.bio || null,
		ownedBy: ownedBy?.address || null,
		followers: stats?.followers || 0,
		following: stats?.following || 0,
		posts: stats?.posts || 0,
		comments: stats?.comments || 0,
		mirrors: stats?.mirrors || 0,
		quotes: stats?.quotes || 0,
		createdAt: profile.createdAt || null,
	};
}

/**
 * Simplify publication data for output
 */
export function simplifyPublication(publication: IDataObject): IDataObject {
	if (!publication) return {};

	const by = publication.by as IDataObject;
	const metadata = publication.metadata as IDataObject;
	const stats = publication.stats as IDataObject;
	const operations = publication.operations as IDataObject;

	return {
		id: publication.id,
		type: getPublicationType(publication),
		content: metadata?.content || null,
		title: metadata?.title || null,
		locale: metadata?.locale || null,
		tags: metadata?.tags || [],
		authorId: by?.id || null,
		authorHandle: (by?.handle as IDataObject)?.fullHandle || null,
		comments: stats?.comments || 0,
		mirrors: stats?.mirrors || 0,
		quotes: stats?.quotes || 0,
		reactions: stats?.reactions || 0,
		collects: stats?.countOpenActions || 0,
		bookmarks: stats?.bookmarks || 0,
		hasReacted: operations?.hasReacted || false,
		hasBookmarked: operations?.hasBookmarked || false,
		createdAt: publication.createdAt || null,
	};
}

/**
 * Get publication type from publication object
 */
export function getPublicationType(publication: IDataObject): string {
	if (publication.commentOn) return 'COMMENT';
	if (publication.mirrorOn) return 'MIRROR';
	if (publication.quoteOn) return 'QUOTE';
	return 'POST';
}

/**
 * Simplify notification data for output
 */
export function simplifyNotification(notification: IDataObject): IDataObject {
	if (!notification) return {};

	return {
		id: notification.id,
		type: getNotificationType(notification),
		...notification,
	};
}

/**
 * Get notification type from notification object
 */
export function getNotificationType(notification: IDataObject): string {
	if (notification.followers) return 'FOLLOW';
	if (notification.reactions) return 'REACTION';
	if (notification.comment) return 'COMMENT';
	if (notification.mirrors) return 'MIRROR';
	if (notification.quote) return 'QUOTE';
	if (notification.actions) return 'ACTED';
	if (notification.publication) return 'MENTION';
	return 'UNKNOWN';
}

/**
 * Format ISO timestamp
 */
export function formatTimestamp(date?: Date | string): string {
	if (!date) {
		date = new Date();
	}
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return date.toISOString();
}

/**
 * Parse profile ID from various formats
 */
export function parseProfileId(input: string): string {
	// Remove 'lens/' prefix if present
	if (input.toLowerCase().startsWith('lens/')) {
		input = input.substring(5);
	}

	// If it's already a hex string, return as-is
	if (input.startsWith('0x')) {
		return input;
	}

	// Otherwise return the input (could be a handle local name)
	return input;
}

/**
 * Parse publication ID
 */
export function parsePublicationId(input: string): string {
	// Publication IDs are in format: profileId-pubId (e.g., 0x01-0x01)
	return input.trim();
}

/**
 * Build metadata content URI
 */
export function buildContentUri(content: string, metadata?: IDataObject): IDataObject {
	return {
		content,
		...metadata,
	};
}

/**
 * Options for profile explore order
 */
export function getProfileExploreOrderOptions(): INodePropertyOptions[] {
	return [
		{ name: 'Created On', value: 'CREATED_ON' },
		{ name: 'Most Followers', value: 'MOST_FOLLOWERS' },
		{ name: 'Latest Created', value: 'LATEST_CREATED' },
		{ name: 'Most Posts', value: 'MOST_POSTS' },
		{ name: 'Most Comments', value: 'MOST_COMMENTS' },
		{ name: 'Most Mirrors', value: 'MOST_MIRRORS' },
		{ name: 'Most Publications', value: 'MOST_PUBLICATION' },
		{ name: 'Most Collects', value: 'MOST_COLLECTS' },
	];
}

/**
 * Options for publication explore order
 */
export function getPublicationExploreOrderOptions(): INodePropertyOptions[] {
	return [
		{ name: 'Latest', value: 'LATEST' },
		{ name: 'Top Reacted', value: 'TOP_REACTED' },
		{ name: 'Top Commented', value: 'TOP_COMMENTED' },
		{ name: 'Top Mirrored', value: 'TOP_MIRRORED' },
		{ name: 'Top Collected', value: 'TOP_COLLECTED' },
	];
}

/**
 * Options for content focus types
 */
export function getContentFocusOptions(): INodePropertyOptions[] {
	return [
		{ name: 'Text Only', value: 'TEXT_ONLY' },
		{ name: 'Article', value: 'ARTICLE' },
		{ name: 'Image', value: 'IMAGE' },
		{ name: 'Video', value: 'VIDEO' },
		{ name: 'Audio', value: 'AUDIO' },
		{ name: 'Link', value: 'LINK' },
		{ name: 'Embed', value: 'EMBED' },
		{ name: 'Event', value: 'EVENT' },
		{ name: 'Mint', value: 'MINT' },
		{ name: 'Livestream', value: 'LIVESTREAM' },
		{ name: 'Short Video', value: 'SHORT_VIDEO' },
	];
}

/**
 * Options for notification types
 */
export function getNotificationTypeOptions(): INodePropertyOptions[] {
	return [
		{ name: 'All', value: 'ALL' },
		{ name: 'Followed', value: 'FOLLOWED' },
		{ name: 'Mentioned', value: 'MENTIONED' },
		{ name: 'Reacted', value: 'REACTED' },
		{ name: 'Commented', value: 'COMMENTED' },
		{ name: 'Mirrored', value: 'MIRRORED' },
		{ name: 'Quoted', value: 'QUOTED' },
		{ name: 'Collected', value: 'ACTED' },
	];
}

/**
 * Options for reaction types
 */
export function getReactionTypeOptions(): INodePropertyOptions[] {
	return [
		{ name: 'Upvote', value: 'UPVOTE' },
		{ name: 'Downvote', value: 'DOWNVOTE' },
	];
}

/**
 * Validate hex string (profile ID, publication ID)
 */
export function isValidHexId(id: string): boolean {
	return /^0x[0-9a-fA-F]+$/.test(id);
}

/**
 * Validate publication ID format (profileId-pubId)
 */
export function isValidPublicationId(id: string): boolean {
	const parts = id.split('-');
	if (parts.length !== 2) return false;
	return isValidHexId(parts[0]) && isValidHexId(parts[1]);
}

/**
 * Clean and validate handle
 */
export function cleanHandle(handle: string): string {
	// Remove @ if present
	handle = handle.replace(/^@/, '');

	// Ensure lens/ prefix
	if (!handle.includes('/')) {
		handle = `lens/${handle}`;
	}

	return handle.toLowerCase();
}

/**
 * Extract value from nested object safely
 */
export function getNestedValue(obj: IDataObject, path: string): unknown {
	const keys = path.split('.');
	let current: unknown = obj;

	for (const key of keys) {
		if (current === null || current === undefined) return undefined;
		if (typeof current !== 'object') return undefined;
		current = (current as IDataObject)[key];
	}

	return current;
}

/**
 * Build array of IDataObject from items
 */
export function toDataObjectArray(items: unknown[]): IDataObject[] {
	return items.map((item) => item as IDataObject);
}
