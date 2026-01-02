/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

// Profile Fragments
export const PROFILE_FRAGMENT = `
	fragment ProfileFields on Profile {
		id
		handle {
			id
			fullHandle
			localName
			namespace
		}
		ownedBy {
			address
			chainId
		}
		metadata {
			displayName
			bio
			picture {
				... on ImageSet {
					raw {
						uri
						mimeType
					}
					optimized {
						uri
						mimeType
					}
				}
			}
			coverPicture {
				... on ImageSet {
					raw {
						uri
						mimeType
					}
					optimized {
						uri
						mimeType
					}
				}
			}
			attributes {
				key
				value
				type
			}
		}
		stats {
			followers
			following
			posts
			comments
			mirrors
			quotes
			publications
			reactions
			reacted
			countOpenActions
		}
		createdAt
	}
`;

// Publication Fragments
export const PUBLICATION_FRAGMENT = `
	fragment PublicationFields on AnyPublication {
		... on Post {
			id
			publishedOn {
				id
			}
			createdAt
			by {
				...ProfileFields
			}
			metadata {
				... on TextOnlyMetadataV3 {
					content
					locale
					tags
					contentWarning
					attributes {
						key
						value
						type
					}
				}
				... on ArticleMetadataV3 {
					content
					title
					locale
					tags
					contentWarning
					attributes {
						key
						value
						type
					}
				}
				... on ImageMetadataV3 {
					content
					title
					locale
					tags
					contentWarning
					attributes {
						key
						value
						type
					}
					asset {
						image {
							raw {
								uri
								mimeType
							}
						}
					}
				}
				... on VideoMetadataV3 {
					content
					title
					locale
					tags
					contentWarning
					attributes {
						key
						value
						type
					}
					asset {
						video {
							raw {
								uri
								mimeType
							}
						}
					}
				}
			}
			stats {
				comments
				mirrors
				quotes
				reactions
				countOpenActions
				bookmarks
			}
			operations {
				isNotInterested
				hasBookmarked
				hasReacted
				canComment
				canMirror
				canQuote
			}
		}
		... on Comment {
			id
			createdAt
			by {
				...ProfileFields
			}
			metadata {
				... on TextOnlyMetadataV3 {
					content
					locale
					tags
				}
			}
			stats {
				comments
				mirrors
				quotes
				reactions
				countOpenActions
				bookmarks
			}
			commentOn {
				... on Post {
					id
				}
			}
		}
		... on Mirror {
			id
			createdAt
			by {
				...ProfileFields
			}
			mirrorOn {
				... on Post {
					id
				}
			}
		}
		... on Quote {
			id
			createdAt
			by {
				...ProfileFields
			}
			metadata {
				... on TextOnlyMetadataV3 {
					content
					locale
					tags
				}
			}
			quoteOn {
				... on Post {
					id
				}
			}
		}
	}
`;

// Profile Queries
export const GET_PROFILE_BY_ID = `
	${PROFILE_FRAGMENT}
	query Profile($request: ProfileRequest!) {
		profile(request: $request) {
			...ProfileFields
		}
	}
`;

export const GET_PROFILE_BY_HANDLE = `
	${PROFILE_FRAGMENT}
	query Profile($request: ProfileRequest!) {
		profile(request: $request) {
			...ProfileFields
		}
	}
`;

export const GET_DEFAULT_PROFILE = `
	${PROFILE_FRAGMENT}
	query DefaultProfile($request: DefaultProfileRequest!) {
		defaultProfile(request: $request) {
			...ProfileFields
		}
	}
`;

export const SEARCH_PROFILES = `
	${PROFILE_FRAGMENT}
	query SearchProfiles($request: ProfileSearchRequest!) {
		searchProfiles(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const EXPLORE_PROFILES = `
	${PROFILE_FRAGMENT}
	query ExploreProfiles($request: ExploreProfilesRequest!) {
		exploreProfiles(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_RECOMMENDED_PROFILES = `
	${PROFILE_FRAGMENT}
	query ProfileRecommendations($request: ProfileRecommendationsRequest!) {
		profileRecommendations(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_PROFILES = `
	${PROFILE_FRAGMENT}
	query Profiles($request: ProfilesRequest!) {
		profiles(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Publication Queries
export const GET_PUBLICATION = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query Publication($request: PublicationRequest!) {
		publication(request: $request) {
			...PublicationFields
		}
	}
`;

export const GET_PUBLICATIONS = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query Publications($request: PublicationsRequest!) {
		publications(request: $request) {
			items {
				...PublicationFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Publication Mutations
export const CREATE_POST = `
	mutation CreateOnchainPostTypedData($request: OnchainPostRequest!) {
		createOnchainPostTypedData(request: $request) {
			id
			expiresAt
			typedData {
				types {
					Post {
						name
						type
					}
				}
				domain {
					name
					chainId
					version
					verifyingContract
				}
				value {
					nonce
					deadline
					profileId
					contentURI
					actionModules
					actionModulesInitDatas
					referenceModule
					referenceModuleInitData
				}
			}
		}
	}
`;

export const CREATE_COMMENT = `
	mutation CreateOnchainCommentTypedData($request: OnchainCommentRequest!) {
		createOnchainCommentTypedData(request: $request) {
			id
			expiresAt
			typedData {
				types {
					Comment {
						name
						type
					}
				}
				domain {
					name
					chainId
					version
					verifyingContract
				}
				value {
					nonce
					deadline
					profileId
					contentURI
					pointedProfileId
					pointedPubId
					referrerProfileIds
					referrerPubIds
					referenceModuleData
					actionModules
					actionModulesInitDatas
					referenceModule
					referenceModuleInitData
				}
			}
		}
	}
`;

export const CREATE_MIRROR = `
	mutation CreateOnchainMirrorTypedData($request: OnchainMirrorRequest!) {
		createOnchainMirrorTypedData(request: $request) {
			id
			expiresAt
			typedData {
				types {
					Mirror {
						name
						type
					}
				}
				domain {
					name
					chainId
					version
					verifyingContract
				}
				value {
					nonce
					deadline
					profileId
					pointedProfileId
					pointedPubId
					referrerProfileIds
					referrerPubIds
					referenceModuleData
				}
			}
		}
	}
`;

export const CREATE_QUOTE = `
	mutation CreateOnchainQuoteTypedData($request: OnchainQuoteRequest!) {
		createOnchainQuoteTypedData(request: $request) {
			id
			expiresAt
			typedData {
				types {
					Quote {
						name
						type
					}
				}
				domain {
					name
					chainId
					version
					verifyingContract
				}
				value {
					nonce
					deadline
					profileId
					contentURI
					pointedProfileId
					pointedPubId
					referrerProfileIds
					referrerPubIds
					referenceModuleData
					actionModules
					actionModulesInitDatas
					referenceModule
					referenceModuleInitData
				}
			}
		}
	}
`;

export const HIDE_PUBLICATION = `
	mutation HidePublication($request: HidePublicationRequest!) {
		hidePublication(request: $request)
	}
`;

// Follow Queries & Mutations
export const GET_FOLLOWERS = `
	${PROFILE_FRAGMENT}
	query Followers($request: FollowersRequest!) {
		followers(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_FOLLOWING = `
	${PROFILE_FRAGMENT}
	query Following($request: FollowingRequest!) {
		following(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const FOLLOW_PROFILE = `
	mutation Follow($request: FollowRequest!) {
		follow(request: $request) {
			... on RelaySuccess {
				txHash
				txId
			}
			... on LensProfileManagerRelayError {
				reason
			}
		}
	}
`;

export const UNFOLLOW_PROFILE = `
	mutation Unfollow($request: UnfollowRequest!) {
		unfollow(request: $request) {
			... on RelaySuccess {
				txHash
				txId
			}
			... on LensProfileManagerRelayError {
				reason
			}
		}
	}
`;

export const GET_FOLLOW_STATUS = `
	query FollowStatusBulk($request: FollowStatusBulkRequest!) {
		followStatusBulk(request: $request) {
			follower
			profileId
			status {
				value
				isFinalisedOnchain
			}
		}
	}
`;

export const GET_MUTUAL_FOLLOWERS = `
	${PROFILE_FRAGMENT}
	query MutualFollowers($request: MutualFollowersRequest!) {
		mutualFollowers(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Reaction Queries & Mutations
export const GET_REACTIONS = `
	${PROFILE_FRAGMENT}
	query WhoReactedPublication($request: WhoReactedPublicationRequest!) {
		whoReactedPublication(request: $request) {
			items {
				profile {
					...ProfileFields
				}
				reactions {
					reaction
					reactedAt
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const ADD_REACTION = `
	mutation AddReaction($request: ReactionRequest!) {
		addReaction(request: $request)
	}
`;

export const REMOVE_REACTION = `
	mutation RemoveReaction($request: ReactionRequest!) {
		removeReaction(request: $request)
	}
`;

// Collect Queries
export const GET_COLLECTS = `
	${PROFILE_FRAGMENT}
	query WhoActedOnPublication($request: WhoActedOnPublicationRequest!) {
		whoActedOnPublication(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const ACT_ON_PUBLICATION = `
	mutation ActOnOpenAction($request: ActOnOpenActionRequest!) {
		actOnOpenAction(request: $request) {
			... on RelaySuccess {
				txHash
				txId
			}
			... on LensProfileManagerRelayError {
				reason
			}
		}
	}
`;

// Feed Queries
export const GET_FEED = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query Feed($request: FeedRequest!) {
		feed(request: $request) {
			items {
				id
				root {
					...PublicationFields
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_HIGHLIGHTS = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query FeedHighlights($request: FeedHighlightsRequest!) {
		feedHighlights(request: $request) {
			items {
				...PublicationFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_EXPLORE_PUBLICATIONS = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query ExplorePublications($request: ExplorePublicationRequest!) {
		explorePublications(request: $request) {
			items {
				...PublicationFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Group Queries
export const GET_GROUP = `
	query Group($request: GroupRequest!) {
		group(request: $request) {
			id
			metadata {
				name
				description
				icon
			}
			timestamp
		}
	}
`;

export const GET_GROUPS = `
	query Groups($request: GroupsRequest!) {
		groups(request: $request) {
			items {
				id
				metadata {
					name
					description
					icon
				}
				timestamp
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Authentication Queries & Mutations
export const GET_CHALLENGE = `
	query Challenge($request: ChallengeRequest!) {
		challenge(request: $request) {
			id
			text
		}
	}
`;

export const AUTHENTICATE = `
	mutation Authenticate($request: SignedAuthChallenge!) {
		authenticate(request: $request) {
			accessToken
			refreshToken
			identityToken
		}
	}
`;

export const REFRESH_TOKEN = `
	mutation Refresh($request: RefreshRequest!) {
		refresh(request: $request) {
			accessToken
			refreshToken
			identityToken
		}
	}
`;

export const VERIFY_TOKEN = `
	query Verify($request: VerifyRequest!) {
		verify(request: $request)
	}
`;

export const REVOKE_TOKEN = `
	mutation RevokeAuthentication($request: RevokeAuthenticationRequest!) {
		revokeAuthentication(request: $request)
	}
`;

// Notification Queries
export const GET_NOTIFICATIONS = `
	${PROFILE_FRAGMENT}
	query Notifications($request: NotificationRequest!) {
		notifications(request: $request) {
			items {
				... on ReactionNotification {
					id
					publication {
						... on Post {
							id
						}
					}
					reactions {
						profile {
							...ProfileFields
						}
						reactions {
							reaction
							reactedAt
						}
					}
				}
				... on CommentNotification {
					id
					comment {
						id
						by {
							...ProfileFields
						}
					}
				}
				... on MirrorNotification {
					id
					mirrors {
						profile {
							...ProfileFields
						}
						mirrorId
						mirroredAt
					}
				}
				... on QuoteNotification {
					id
					quote {
						id
						by {
							...ProfileFields
						}
					}
				}
				... on ActedNotification {
					id
					actions {
						by {
							...ProfileFields
						}
						action {
							... on KnownCollectOpenActionResult {
								type
							}
							... on UnknownOpenActionResult {
								address
							}
						}
						actedAt
					}
				}
				... on FollowNotification {
					id
					followers {
						...ProfileFields
					}
				}
				... on MentionNotification {
					id
					publication {
						... on Post {
							id
							by {
								...ProfileFields
							}
						}
						... on Comment {
							id
							by {
								...ProfileFields
							}
						}
						... on Quote {
							id
							by {
								...ProfileFields
							}
						}
					}
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const MARK_NOTIFICATIONS_READ = `
	mutation MarkAllNotificationsAsRead {
		markAllNotificationsAsRead
	}
`;

// Module Queries
export const GET_ENABLED_CURRENCIES = `
	query EnabledCurrencies($request: PaginatedOffsetRequest!) {
		currencies(request: $request) {
			items {
				name
				symbol
				decimals
				contract {
					address
					chainId
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_FOLLOW_MODULES = `
	query ApprovedModuleAllowanceAmount($request: ApprovedModuleAllowanceAmountRequest!) {
		approvedModuleAllowanceAmount(request: $request) {
			moduleName
			moduleContract {
				address
				chainId
			}
			allowance {
				value
				asset {
					name
					symbol
					decimals
					contract {
						address
						chainId
					}
				}
			}
		}
	}
`;

export const GET_SUPPORTED_OPEN_ACTION_MODULES = `
	query SupportedOpenActionModules($request: SupportedModulesRequest!) {
		supportedOpenActionModules(request: $request) {
			items {
				moduleName
				contract {
					address
					chainId
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_SUPPORTED_REFERENCE_MODULES = `
	query SupportedReferenceModules($request: SupportedModulesRequest!) {
		supportedReferenceModules(request: $request) {
			items {
				moduleName
				contract {
					address
					chainId
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_SUPPORTED_FOLLOW_MODULES = `
	query SupportedFollowModules($request: SupportedModulesRequest!) {
		supportedFollowModules(request: $request) {
			items {
				moduleName
				contract {
					address
					chainId
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Search Queries
export const SEARCH_PUBLICATIONS = `
	${PROFILE_FRAGMENT}
	${PUBLICATION_FRAGMENT}
	query SearchPublications($request: PublicationSearchRequest!) {
		searchPublications(request: $request) {
			items {
				...PublicationFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

// Revenue Queries
export const GET_PROFILE_REVENUE = `
	query RevenueFromPublications($request: RevenueFromPublicationsRequest!) {
		revenueFromPublications(request: $request) {
			items {
				publication {
					... on Post {
						id
					}
				}
				revenue {
					total {
						value
						asset {
							name
							symbol
							decimals
							contract {
								address
								chainId
							}
						}
					}
				}
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const GET_PUBLICATION_REVENUE = `
	query RevenueFromPublication($request: RevenueFromPublicationRequest!) {
		revenueFromPublication(request: $request) {
			publication {
				... on Post {
					id
				}
			}
			revenue {
				total {
					value
					asset {
						name
						symbol
						decimals
						contract {
							address
							chainId
						}
					}
				}
			}
		}
	}
`;

export const GET_FOLLOW_REVENUES = `
	query FollowRevenues($request: FollowRevenueRequest!) {
		followRevenues(request: $request) {
			revenues {
				total {
					value
					asset {
						name
						symbol
						decimals
						contract {
							address
							chainId
						}
					}
				}
			}
		}
	}
`;

// Utility Queries
export const GET_PROFILES_MANAGED = `
	${PROFILE_FRAGMENT}
	query ProfilesManaged($request: ProfilesManagedRequest!) {
		profilesManaged(request: $request) {
			items {
				...ProfileFields
			}
			pageInfo {
				prev
				next
			}
		}
	}
`;

export const VALIDATE_HANDLE = `
	query HandleToAddress($request: HandleToAddressRequest!) {
		handleToAddress(request: $request)
	}
`;

export const PING = `
	query Ping {
		ping
	}
`;
