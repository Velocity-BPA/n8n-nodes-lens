/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IDataObject } from 'n8n-workflow';

// Profile Types
export interface LensProfile extends IDataObject {
	id: string;
	handle: LensHandle;
	ownedBy: string;
	metadata?: ProfileMetadata;
	stats?: ProfileStats;
	followModule?: FollowModule;
	isFollowedByMe?: boolean;
	isFollowingMe?: boolean;
	createdAt?: string;
}

export interface LensHandle extends IDataObject {
	id: string;
	fullHandle: string;
	localName: string;
	namespace: string;
	linkedTo?: LensProfile;
}

export interface ProfileMetadata extends IDataObject {
	displayName?: string;
	bio?: string;
	picture?: MediaSet;
	coverPicture?: MediaSet;
	attributes?: Attribute[];
}

export interface ProfileStats extends IDataObject {
	followers: number;
	following: number;
	posts: number;
	comments: number;
	mirrors: number;
	quotes: number;
	publications: number;
	reactions: number;
	reacted: number;
	countOpenActions: number;
}

// Publication Types
export interface LensPublication extends IDataObject {
	id: string;
	publishedOn?: string;
	createdAt: string;
	by: LensProfile;
	metadata: PublicationMetadata;
	stats?: PublicationStats;
	operations?: PublicationOperations;
	root?: LensPublication;
	commentOn?: LensPublication;
	quoteOn?: LensPublication;
	mirrorOn?: LensPublication;
}

export interface PublicationMetadata extends IDataObject {
	content?: string;
	title?: string;
	locale?: string;
	tags?: string[];
	contentWarning?: string;
	mainContentFocus?: string;
	marketplace?: MarketplaceMetadata;
	encryptedWith?: EncryptedMetadata;
	attributes?: Attribute[];
	attachments?: MediaAttachment[];
}

export interface PublicationStats extends IDataObject {
	comments: number;
	mirrors: number;
	quotes: number;
	reactions: number;
	countOpenActions: number;
	bookmarks: number;
}

export interface PublicationOperations extends IDataObject {
	isNotInterested: boolean;
	hasBookmarked: boolean;
	hasReacted: boolean;
	canComment: string;
	canMirror: string;
	canQuote: string;
	hasCollected: boolean;
	hasActed: boolean;
	actedOn: OpenActionResult[];
	canDecrypt: boolean;
}

// Follow Types
export interface LensFollow extends IDataObject {
	follower: LensProfile;
	following: LensProfile;
	followedAt: string;
}

export interface FollowModule extends IDataObject {
	type: string;
	amount?: Amount;
	recipient?: string;
	contract?: NetworkAddress;
}

export interface FollowStatus extends IDataObject {
	follower: string;
	following: string;
	isFollowing: boolean;
	isFollowedBy: boolean;
}

// Reaction Types
export interface LensReaction extends IDataObject {
	profile: LensProfile;
	reaction: ReactionType;
	reactedAt: string;
}

export type ReactionType = 'UPVOTE' | 'DOWNVOTE';

// Collect Types
export interface LensCollect extends IDataObject {
	collector: LensProfile;
	publication: LensPublication;
	collectedAt: string;
	nftTokenId?: string;
}

export interface CollectModule extends IDataObject {
	type: string;
	amount?: Amount;
	collectLimit?: number;
	referralFee?: number;
	followerOnly?: boolean;
	endTimestamp?: string;
	recipient?: string;
	recipients?: RecipientData[];
}

// Feed Types
export interface FeedItem extends IDataObject {
	id: string;
	root: LensPublication;
	mirrors?: LensPublication[];
	reactions?: LensReaction[];
	comments?: LensPublication[];
	acted?: LensProfile[];
}

// Group Types
export interface LensGroup extends IDataObject {
	id: string;
	name: string;
	description?: string;
	members: number;
	metadata?: GroupMetadata;
	owner: LensProfile;
	createdAt: string;
	rules?: GroupRule[];
}

export interface GroupMetadata extends IDataObject {
	name: string;
	description?: string;
	icon?: string;
	coverPicture?: MediaSet;
}

export interface GroupRule extends IDataObject {
	type: string;
	config?: IDataObject;
}

// Authentication Types
export interface AuthChallenge extends IDataObject {
	id: string;
	text: string;
}

export interface AuthTokens extends IDataObject {
	accessToken: string;
	refreshToken: string;
}

export interface AuthResult extends IDataObject {
	accessToken: string;
	refreshToken: string;
	identityToken?: string;
}

// Notification Types
export interface LensNotification extends IDataObject {
	id: string;
	type: NotificationType;
	publication?: LensPublication;
	profile?: LensProfile;
	notifiedAt: string;
	isRead: boolean;
}

export type NotificationType =
	| 'FOLLOWED'
	| 'MENTIONED'
	| 'REACTED'
	| 'COMMENTED'
	| 'MIRRORED'
	| 'QUOTED'
	| 'ACTED'
	| 'COLLECTED';

// Module Types
export interface LensModule extends IDataObject {
	moduleName: string;
	contract: NetworkAddress;
	metadata?: ModuleMetadata;
	type: ModuleType;
}

export type ModuleType = 'FOLLOW' | 'COLLECT' | 'REFERENCE' | 'OPEN_ACTION';

export interface ModuleMetadata extends IDataObject {
	name: string;
	description?: string;
	authors?: string[];
}

// Revenue Types
export interface LensRevenue extends IDataObject {
	total: Amount[];
	byPublication?: PublicationRevenue[];
}

export interface PublicationRevenue extends IDataObject {
	publication: LensPublication;
	revenue: Amount[];
}

// Common Types
export interface Amount extends IDataObject {
	asset: Erc20;
	value: string;
}

export interface Erc20 extends IDataObject {
	name: string;
	symbol: string;
	decimals: number;
	contract: NetworkAddress;
}

export interface NetworkAddress extends IDataObject {
	address: string;
	chainId: number;
}

export interface MediaSet extends IDataObject {
	raw: Media;
	optimized?: Media;
	transformed?: Media;
}

export interface Media extends IDataObject {
	url: string;
	mimeType?: string;
	width?: number;
	height?: number;
}

export interface MediaAttachment extends IDataObject {
	type: string;
	item: string;
	altTag?: string;
	cover?: string;
	license?: string;
}

export interface Attribute extends IDataObject {
	key: string;
	value: string;
	type: string;
}

export interface MarketplaceMetadata extends IDataObject {
	description?: string;
	externalURL?: string;
	name?: string;
	animationUrl?: string;
	image?: string;
	attributes?: Attribute[];
}

export interface EncryptedMetadata extends IDataObject {
	encryptionKey: string;
	encryptedFields: string[];
	accessCondition: IDataObject;
}

export interface OpenActionResult extends IDataObject {
	module: LensModule;
	acted: boolean;
	actedAt?: string;
}

export interface RecipientData extends IDataObject {
	recipient: string;
	split: number;
}

// Pagination Types
export interface PaginatedResult<T> extends IDataObject {
	items: T[];
	pageInfo: PageInfo;
}

export interface PageInfo extends IDataObject {
	prev?: string;
	next?: string;
	totalCount?: number;
}

// Search Types
export interface SearchResult extends IDataObject {
	profiles?: LensProfile[];
	publications?: LensPublication[];
}

export interface TrendingTag extends IDataObject {
	tag: string;
	count: number;
}

// Metadata Upload Types
export interface MetadataUploadResult extends IDataObject {
	id: string;
	uri: string;
	status: MetadataStatus;
}

export type MetadataStatus = 'PENDING' | 'INDEXED' | 'FAILED';

// Currency Types
export interface Currency extends IDataObject {
	name: string;
	symbol: string;
	decimals: number;
	address: string;
	chainId: number;
}

// API Response Types
export interface LensApiResponse<T> {
	data?: T;
	errors?: LensApiError[];
	[key: string]: T | LensApiError[] | undefined;
}

export interface LensApiError extends IDataObject {
	message: string;
	locations?: Array<{ line: number; column: number }>;
	path?: string[];
	extensions?: IDataObject;
}

// Request Input Types
export interface ProfileRequest {
	profileId?: string;
	handle?: string;
	address?: string;
}

export interface PublicationRequest {
	publicationId?: string;
	txHash?: string;
}

export interface PaginationRequest {
	cursor?: string;
	limit?: number;
}

export interface SearchRequest {
	query: string;
	limit?: number;
	cursor?: string;
}

// Explore Types
export interface ExploreRequest extends PaginationRequest {
	orderBy?: ExploreOrderBy;
	where?: ExploreWhere;
}

export type ExploreOrderBy = 'LATEST' | 'TOP_REACTED' | 'TOP_COMMENTED' | 'TOP_MIRRORED' | 'TOP_COLLECTED';

export interface ExploreWhere {
	since?: string;
	publicationTypes?: string[];
	metadata?: PublicationMetadataFilters;
}

export interface PublicationMetadataFilters {
	mainContentFocus?: string[];
	tags?: { oneOf?: string[]; all?: string[] };
	locale?: string;
}

// Transaction Types
export interface TransactionResult extends IDataObject {
	txHash?: string;
	txId?: string;
	reason?: string;
}

// Trigger Types
export interface TriggerState extends IDataObject {
	lastTimestamp?: string;
	lastIds?: string[];
}
