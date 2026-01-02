/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 *
 * This file is licensed under the Business Source License 1.1 (BSL 1.1).
 * You may use this file for non-commercial or internal business purposes only.
 * Commercial use in production by for-profit organizations requires a
 * commercial license from Velocity BPA.
 *
 * See LICENSE, COMMERCIAL_LICENSE.md, and LICENSING_FAQ.md for details.
 */

import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';

import { lensApiRequest } from './transport/client';
import {
	GET_FOLLOWERS,
	GET_PUBLICATION,
	GET_NOTIFICATIONS,
	GET_REACTIONS,
} from './constants/queries';
import { simplifyProfile, simplifyPublication, simplifyNotification } from './utils/helpers';

// Query to get latest publications for a profile
const GET_LATEST_PUBLICATIONS = `
	query GetLatestPublications($request: PublicationsRequest!) {
		publications(request: $request) {
			items {
				... on Post {
					id
					createdAt
					by {
						id
						handle {
							fullHandle
						}
					}
					metadata {
						... on TextOnlyMetadataV3 {
							content
						}
						... on ArticleMetadataV3 {
							content
							title
						}
						... on ImageMetadataV3 {
							content
							title
						}
					}
					stats {
						reactions
						comments
						mirrors
						quotes
						collects
					}
				}
				... on Comment {
					id
					createdAt
					by {
						id
						handle {
							fullHandle
						}
					}
					commentOn {
						... on Post {
							id
						}
					}
					metadata {
						... on TextOnlyMetadataV3 {
							content
						}
					}
				}
				... on Mirror {
					id
					createdAt
					by {
						id
						handle {
							fullHandle
						}
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
						id
						handle {
							fullHandle
						}
					}
					quoteOn {
						... on Post {
							id
						}
					}
				}
			}
			pageInfo {
				next
			}
		}
	}
`;

// Query to get collects for a publication
const GET_PUBLICATION_COLLECTS = `
	query GetPublicationCollects($request: WhoActedOnPublicationRequest!) {
		whoActedOnPublication(request: $request) {
			items {
				id
				handle {
					fullHandle
				}
				ownedBy {
					address
				}
			}
			pageInfo {
				next
			}
		}
	}
`;

export class LensTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lens Trigger',
		name: 'lensTrigger',
		icon: 'file:lens.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on Lens Protocol events',
		defaults: {
			name: 'Lens Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'lensApi',
				required: false,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				options: [
					{
						name: 'New Follower',
						value: 'newFollower',
						description: 'Triggers when profile receives a new follower',
					},
					{
						name: 'New Publication',
						value: 'newPublication',
						description: 'Triggers when a profile creates a new publication',
					},
					{
						name: 'New Comment',
						value: 'newComment',
						description: 'Triggers when a publication receives a new comment',
					},
					{
						name: 'Publication Collected',
						value: 'publicationCollected',
						description: 'Triggers when a publication is collected',
					},
					{
						name: 'Profile Mentioned',
						value: 'profileMentioned',
						description: 'Triggers when profile is mentioned in a post',
					},
					{
						name: 'New Reaction',
						value: 'newReaction',
						description: 'Triggers when a publication receives a reaction',
					},
					{
						name: 'New Notification',
						value: 'newNotification',
						description: 'Triggers on any new notification',
					},
				],
				default: 'newFollower',
			},

			// Profile ID - used by multiple events
			{
				displayName: 'Profile ID',
				name: 'profileId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						event: [
							'newFollower',
							'newPublication',
							'profileMentioned',
							'newNotification',
						],
					},
				},
				default: '',
				placeholder: '0x01',
				description: 'The profile ID to monitor (hex format)',
			},

			// Publication ID - for comment and collect events
			{
				displayName: 'Publication ID',
				name: 'publicationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						event: ['newComment', 'publicationCollected', 'newReaction'],
					},
				},
				default: '',
				placeholder: '0x01-0x01',
				description: 'The publication ID to monitor (format: profileId-pubId)',
			},

			// Publication types filter
			{
				displayName: 'Publication Types',
				name: 'publicationTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						event: ['newPublication'],
					},
				},
				options: [
					{ name: 'Post', value: 'POST' },
					{ name: 'Comment', value: 'COMMENT' },
					{ name: 'Mirror', value: 'MIRROR' },
					{ name: 'Quote', value: 'QUOTE' },
				],
				default: ['POST'],
				description: 'Types of publications to trigger on',
			},

			// Notification types filter
			{
				displayName: 'Notification Types',
				name: 'notificationTypes',
				type: 'multiOptions',
				displayOptions: {
					show: {
						event: ['newNotification'],
					},
				},
				options: [
					{ name: 'Collected Post', value: 'COLLECTED_POST' },
					{ name: 'Commented', value: 'COMMENTED' },
					{ name: 'Followed', value: 'FOLLOWED' },
					{ name: 'Mentioned', value: 'MENTIONED' },
					{ name: 'Mirrored', value: 'MIRRORED' },
					{ name: 'Quoted', value: 'QUOTED' },
					{ name: 'Reacted', value: 'REACTED' },
				],
				default: [],
				description: 'Filter by notification types (empty = all)',
			},

			// Simplify output option
			{
				displayName: 'Simplify Output',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to return simplified response data',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const simplify = this.getNodeParameter('simplify', true) as boolean;

		// Get stored data from previous poll
		const webhookData = this.getWorkflowStaticData('node');
		const lastPollTime = webhookData.lastPollTime as string | undefined;
		const lastIds = (webhookData.lastIds as string[]) || [];

		// Update last poll time
		webhookData.lastPollTime = new Date().toISOString();

		const returnData: INodeExecutionData[] = [];

		try {
			if (event === 'newFollower') {
				const profileId = this.getNodeParameter('profileId') as string;

				const response = await lensApiRequest.call(
					this,
					GET_FOLLOWERS,
					{
						request: {
							of: profileId,
							limit: 25,
						},
					},
				);

				const followersData = response.followers as IDataObject | undefined;
				const followers = (followersData?.items as IDataObject[]) || [];
				const newFollowers: IDataObject[] = [];

				for (const follower of followers) {
					const followerId = follower.id as string;
					if (!lastIds.includes(followerId)) {
						newFollowers.push(follower);
					}
				}

				// Update stored IDs (keep last 100)
				const allIds = [...newFollowers.map((f) => f.id as string), ...lastIds];
				webhookData.lastIds = allIds.slice(0, 100);

				for (const follower of newFollowers) {
					returnData.push({
						json: simplify ? simplifyProfile(follower) : follower,
					});
				}
			} else if (event === 'newPublication') {
				const profileId = this.getNodeParameter('profileId') as string;
				const publicationTypes = this.getNodeParameter('publicationTypes', ['POST']) as string[];

				const response = await lensApiRequest.call(
					this,
					GET_LATEST_PUBLICATIONS,
					{
						request: {
							where: {
								from: [profileId],
								publicationTypes,
							},
							limit: 25,
						},
					},
				);

				const publicationsData = response.publications as IDataObject | undefined;
				const publications = (publicationsData?.items as IDataObject[]) || [];
				const newPubs: IDataObject[] = [];

				for (const pub of publications) {
					const pubId = pub.id as string;
					if (!lastIds.includes(pubId)) {
						// Check if publication is after last poll time
						if (!lastPollTime || new Date(pub.createdAt as string) > new Date(lastPollTime)) {
							newPubs.push(pub);
						}
					}
				}

				// Update stored IDs
				const allIds = [...newPubs.map((p) => p.id as string), ...lastIds];
				webhookData.lastIds = allIds.slice(0, 100);

				for (const pub of newPubs) {
					returnData.push({
						json: simplify ? simplifyPublication(pub) : pub,
					});
				}
			} else if (event === 'newComment') {
				const publicationId = this.getNodeParameter('publicationId') as string;

				const response = await lensApiRequest.call(
					this,
					GET_PUBLICATION,
					{
						request: {
							forId: publicationId,
						},
					},
				);

				// Get comments on the publication
				const publication = response.publication as IDataObject | undefined;
				const stats = publication?.stats as IDataObject | undefined;
				if (stats && (stats.comments as number) > 0) {
					// Fetch comments
					const commentsResponse = await lensApiRequest.call(
						this,
						GET_LATEST_PUBLICATIONS,
						{
							request: {
								where: {
									commentOn: {
										id: publicationId,
									},
								},
								limit: 25,
							},
						},
					);

					const commentsData = commentsResponse.publications as IDataObject | undefined;
					const comments = (commentsData?.items as IDataObject[]) || [];
					const newComments: IDataObject[] = [];

					for (const comment of comments) {
						const commentId = comment.id as string;
						if (!lastIds.includes(commentId)) {
							newComments.push(comment);
						}
					}

					// Update stored IDs
					const allIds = [...newComments.map((c) => c.id as string), ...lastIds];
					webhookData.lastIds = allIds.slice(0, 100);

					for (const comment of newComments) {
						returnData.push({
							json: simplify ? simplifyPublication(comment) : comment,
						});
					}
				}
			} else if (event === 'publicationCollected') {
				const publicationId = this.getNodeParameter('publicationId') as string;

				const response = await lensApiRequest.call(
					this,
					GET_PUBLICATION_COLLECTS,
					{
						request: {
							on: publicationId,
							limit: 25,
						},
					},
				);

				const collectorsData = response.whoActedOnPublication as IDataObject | undefined;
				const collectors = (collectorsData?.items as IDataObject[]) || [];
				const newCollectors: IDataObject[] = [];

				for (const collector of collectors) {
					const collectorId = collector.id as string;
					if (!lastIds.includes(collectorId)) {
						newCollectors.push(collector);
					}
				}

				// Update stored IDs
				const allIds = [...newCollectors.map((c) => c.id as string), ...lastIds];
				webhookData.lastIds = allIds.slice(0, 100);

				for (const collector of newCollectors) {
					returnData.push({
						json: {
							publicationId,
							collector: simplify ? simplifyProfile(collector) : collector,
							timestamp: new Date().toISOString(),
						},
					});
				}
			} else if (event === 'profileMentioned') {
				// profileId identifies the authenticated user context (retrieved for API authentication)
				const _profileContext = this.getNodeParameter('profileId') as string;
				void _profileContext;

				const response = await lensApiRequest.call(
					this,
					GET_NOTIFICATIONS,
					{
						request: {
							where: {
								notificationTypes: ['MENTIONED'],
							},
							limit: 25,
						},
					},
				);

				const notificationsData = response.notifications as IDataObject | undefined;
				const notifications = (notificationsData?.items as IDataObject[]) || [];
				const newMentions: IDataObject[] = [];

				for (const notification of notifications) {
					const notifId = notification.id as string;
					if (!lastIds.includes(notifId)) {
						newMentions.push(notification);
					}
				}

				// Update stored IDs
				const allIds = [...newMentions.map((n) => n.id as string), ...lastIds];
				webhookData.lastIds = allIds.slice(0, 100);

				for (const mention of newMentions) {
					returnData.push({
						json: simplify ? simplifyNotification(mention) : mention,
					});
				}
			} else if (event === 'newReaction') {
				const publicationId = this.getNodeParameter('publicationId') as string;

				const response = await lensApiRequest.call(
					this,
					GET_REACTIONS,
					{
						request: {
							for: publicationId,
							limit: 25,
						},
					},
				);

				const reactionsData = response.reactions as IDataObject | undefined;
				const reactions = (reactionsData?.items as IDataObject[]) || [];
				const storedCount = (webhookData.reactionCount as number) || 0;

				// Check if new reactions
				if (reactions.length > storedCount) {
					const newReactions = reactions.slice(0, reactions.length - storedCount);

					for (const reaction of newReactions) {
						const reactedByProfile = (reaction.by as IDataObject) || {};
						returnData.push({
							json: {
								publicationId,
								reaction: reaction.reaction,
								reactedBy: simplify
									? simplifyProfile(reactedByProfile)
									: reactedByProfile,
								timestamp: new Date().toISOString(),
							},
						});
					}
				}

				webhookData.reactionCount = reactions.length;
			} else if (event === 'newNotification') {
				// profileId identifies the authenticated user context (retrieved for API authentication)
				const _profileContext = this.getNodeParameter('profileId') as string;
				void _profileContext;
				const notificationTypes = this.getNodeParameter('notificationTypes', []) as string[];

				const request: IDataObject = {
					limit: 25,
				};

				if (notificationTypes.length > 0) {
					request.where = { notificationTypes };
				}

				const response = await lensApiRequest.call(
					this,
					GET_NOTIFICATIONS,
					{ request },
				);

				const notificationsData = response.notifications as IDataObject | undefined;
				const notifications = (notificationsData?.items as IDataObject[]) || [];
				const newNotifs: IDataObject[] = [];

				for (const notification of notifications) {
					const notifId = notification.id as string;
					if (!lastIds.includes(notifId)) {
						newNotifs.push(notification);
					}
				}

				// Update stored IDs
				const allIds = [...newNotifs.map((n) => n.id as string), ...lastIds];
				webhookData.lastIds = allIds.slice(0, 100);

				for (const notification of newNotifs) {
					returnData.push({
						json: simplify ? simplifyNotification(notification) : notification,
					});
				}
			}
		} catch (error) {
			// Log error but don't fail the trigger
			console.error(`Lens Trigger error: ${(error as Error).message}`);

			// Return empty if error occurs on first poll
			if (!lastPollTime) {
				return null;
			}
		}

		if (returnData.length === 0) {
			return null;
		}

		return [returnData];
	}
}
