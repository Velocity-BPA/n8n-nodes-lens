/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_FEED,
	GET_HIGHLIGHTS,
	GET_EXPLORE_PUBLICATIONS,
	GET_PUBLICATIONS,
} from '../../constants/queries';
import { simplifyPublication, getPublicationExploreOrderOptions } from '../../utils/helpers';

export const feedOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
			},
		},
		options: [
			{
				name: 'Get Feed',
				value: 'getFeed',
				description: 'Get personalized feed',
				action: 'Get feed',
			},
			{
				name: 'Get Highlights',
				value: 'getHighlights',
				description: 'Get top posts',
				action: 'Get highlights',
			},
			{
				name: 'Get Explore Feed',
				value: 'getExploreFeed',
				description: 'Get discovery feed',
				action: 'Get explore feed',
			},
			{
				name: 'Get Profile Feed',
				value: 'getProfileFeed',
				description: "Get user's publications",
				action: 'Get profile feed',
			},
			{
				name: 'Get Comment Feed',
				value: 'getCommentFeed',
				description: 'Get replies to publication',
				action: 'Get comment feed',
			},
		],
		default: 'getFeed',
	},
];

export const feedFields: INodeProperties[] = [
	// Profile ID field (for personalized feed)
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getFeed', 'getHighlights', 'getProfileFeed'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The Lens profile ID',
	},
	// Publication ID (for comment feed)
	{
		displayName: 'Publication ID',
		name: 'publicationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getCommentFeed'],
			},
		},
		default: '',
		placeholder: '0x01-0x01',
		description: 'The publication ID to get comments for',
	},
	// Explore Order By
	{
		displayName: 'Order By',
		name: 'orderBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['feeds'],
				operation: ['getExploreFeed'],
			},
		},
		options: getPublicationExploreOrderOptions(),
		default: 'LATEST',
		description: 'How to order the explore results',
	},
	// Additional Options
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['feeds'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				default: 25,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor for fetching next page',
			},
			{
				displayName: 'Content Focus',
				name: 'contentFocus',
				type: 'multiOptions',
				options: [
					{ name: 'Text Only', value: 'TEXT_ONLY' },
					{ name: 'Article', value: 'ARTICLE' },
					{ name: 'Image', value: 'IMAGE' },
					{ name: 'Video', value: 'VIDEO' },
					{ name: 'Audio', value: 'AUDIO' },
					{ name: 'Link', value: 'LINK' },
				],
				default: [],
				description: 'Filter by content type',
			},
		],
	},
	// Simplify Output
	{
		displayName: 'Simplify Output',
		name: 'simplifyOutput',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['feeds'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeFeedOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
	const limit = additionalOptions.limit as number || 25;
	const cursor = additionalOptions.cursor as string;
	const contentFocus = additionalOptions.contentFocus as string[];

	switch (operation) {
		case 'getFeed': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: {
					where: {
						for: profileId,
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_FEED, variables);
			const feed = response.feed as IDataObject;
			const items = (feed?.items as IDataObject[]) || [];

			// Extract root publications from feed items
			responseData = items.map((item) => item.root as IDataObject).filter(Boolean);
			break;
		}

		case 'getHighlights': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: {
					where: {
						for: profileId,
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_HIGHLIGHTS, variables);
			const highlights = response.feedHighlights as IDataObject;
			responseData = (highlights?.items as IDataObject[]) || [];
			break;
		}

		case 'getExploreFeed': {
			const orderBy = this.getNodeParameter('orderBy', i) as string;

			const where: IDataObject = {};
			if (contentFocus && contentFocus.length > 0) {
				where.metadata = {
					mainContentFocus: contentFocus,
				};
			}

			const variables = {
				request: {
					orderBy,
					...(Object.keys(where).length > 0 && { where }),
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_EXPLORE_PUBLICATIONS, variables);
			const explore = response.explorePublications as IDataObject;
			responseData = (explore?.items as IDataObject[]) || [];
			break;
		}

		case 'getProfileFeed': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: {
					where: {
						from: [profileId],
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATIONS, variables);
			const publications = response.publications as IDataObject;
			responseData = (publications?.items as IDataObject[]) || [];
			break;
		}

		case 'getCommentFeed': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const variables = {
				request: {
					where: {
						commentOn: {
							id: publicationId,
						},
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATIONS, variables);
			const publications = response.publications as IDataObject;
			responseData = (publications?.items as IDataObject[]) || [];
			break;
		}
	}

	// Simplify output if requested
	if (simplifyOutput && Array.isArray(responseData)) {
		responseData = responseData.map(simplifyPublication);
	}

	return responseData;
}
