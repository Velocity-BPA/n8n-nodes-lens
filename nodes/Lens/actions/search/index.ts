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
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import { SEARCH_PROFILES, SEARCH_PUBLICATIONS } from '../../constants/queries';
import { simplifyProfile, simplifyPublication } from '../../utils/helpers';

// GraphQL query for trending tags (may need adjustment based on actual API)
const GET_TRENDING_TAGS = `
	query GetTrendingTags($request: TrendingTagsRequest) {
		trendingTags(request: $request) {
			tag
			total
		}
	}
`;

export const searchOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['search'],
			},
		},
		options: [
			{
				name: 'Search Profiles',
				value: 'searchProfiles',
				description: 'Search for profiles by query string',
				action: 'Search profiles',
			},
			{
				name: 'Search Publications',
				value: 'searchPublications',
				description: 'Search for publications by query string',
				action: 'Search publications',
			},
			{
				name: 'Search All',
				value: 'searchAll',
				description: 'Search both profiles and publications',
				action: 'Search all content',
			},
			{
				name: 'Get Trending Tags',
				value: 'getTrendingTags',
				description: 'Get popular hashtags and topics',
				action: 'Get trending tags',
			},
		],
		default: 'searchProfiles',
	},
];

export const searchFields: INodeProperties[] = [
	// Search query - used by multiple operations
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchProfiles', 'searchPublications', 'searchAll'],
			},
		},
		default: '',
		placeholder: 'e.g., blockchain, defi, web3',
		description: 'Search query string',
	},

	// Limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchProfiles', 'searchPublications', 'searchAll', 'getTrendingTags'],
			},
		},
		default: 25,
		typeOptions: {
			minValue: 1,
			maxValue: 50,
		},
		description: 'Maximum number of results to return',
	},

	// Cursor for pagination
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchProfiles', 'searchPublications'],
			},
		},
		default: '',
		description: 'Pagination cursor for fetching more results',
	},

	// Search Publications filters
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchPublications'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Publication Types',
				name: 'publicationTypes',
				type: 'multiOptions',
				options: [
					{ name: 'Post', value: 'POST' },
					{ name: 'Comment', value: 'COMMENT' },
					{ name: 'Mirror', value: 'MIRROR' },
					{ name: 'Quote', value: 'QUOTE' },
				],
				default: [],
				description: 'Filter by publication type',
			},
			{
				displayName: 'From Profile IDs',
				name: 'fromProfileIds',
				type: 'string',
				default: '',
				placeholder: '0x01, 0x02',
				description: 'Comma-separated list of profile IDs to filter by author',
			},
			{
				displayName: 'With Tags',
				name: 'withTags',
				type: 'string',
				default: '',
				placeholder: 'defi, nft, web3',
				description: 'Comma-separated tags to filter by',
			},
		],
	},

	// Simplify output
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchProfiles', 'searchPublications', 'searchAll'],
			},
		},
		default: true,
		description: 'Whether to return simplified response data',
	},
];

export async function executeSearchOperations(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: IDataObject | IDataObject[];

	if (operation === 'searchProfiles') {
		const query = this.getNodeParameter('query', index) as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;
		const cursor = this.getNodeParameter('cursor', index, '') as string;
		const simplify = this.getNodeParameter('simplify', index, true) as boolean;

		const variables: IDataObject = {
			request: {
				query,
				limit,
				...(cursor && { cursor }),
			},
		};

		const response = await lensApiRequest.call(this, SEARCH_PROFILES, variables);
		const searchData = response.searchProfiles as IDataObject | undefined;
		const profiles = (searchData?.items as IDataObject[]) || [];

		if (simplify) {
			responseData = profiles.map((profile: IDataObject) => simplifyProfile(profile));
		} else {
			responseData = {
				items: profiles,
				pageInfo: (searchData?.pageInfo as IDataObject) || {},
			};
		}
	} else if (operation === 'searchPublications') {
		const query = this.getNodeParameter('query', index) as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;
		const cursor = this.getNodeParameter('cursor', index, '') as string;
		const filters = this.getNodeParameter('filters', index, {}) as IDataObject;
		const simplify = this.getNodeParameter('simplify', index, true) as boolean;

		const request: IDataObject = {
			query,
			limit,
			...(cursor && { cursor }),
		};

		// Apply filters
		if (filters.publicationTypes && (filters.publicationTypes as string[]).length > 0) {
			request.publicationTypes = filters.publicationTypes;
		}

		if (filters.fromProfileIds) {
			const profileIds = (filters.fromProfileIds as string)
				.split(',')
				.map((id) => id.trim())
				.filter((id) => id);
			if (profileIds.length > 0) {
				request.where = { ...(request.where as IDataObject || {}), from: profileIds };
			}
		}

		if (filters.withTags) {
			const tags = (filters.withTags as string)
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag);
			if (tags.length > 0) {
				request.where = { ...(request.where as IDataObject || {}), withTags: tags };
			}
		}

		const response = await lensApiRequest.call(this, SEARCH_PUBLICATIONS, { request });
		const searchPubData = response.searchPublications as IDataObject | undefined;
		const publications = (searchPubData?.items as IDataObject[]) || [];

		if (simplify) {
			responseData = publications.map((pub: IDataObject) => simplifyPublication(pub));
		} else {
			responseData = {
				items: publications,
				pageInfo: (searchPubData?.pageInfo as IDataObject) || {},
			};
		}
	} else if (operation === 'searchAll') {
		const query = this.getNodeParameter('query', index) as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;
		const simplify = this.getNodeParameter('simplify', index, true) as boolean;

		// Search both profiles and publications in parallel
		const [profilesResponse, publicationsResponse] = await Promise.all([
			lensApiRequest.call(this, SEARCH_PROFILES, {
				request: { query, limit },
			}),
			lensApiRequest.call(this, SEARCH_PUBLICATIONS, {
				request: { query, limit },
			}),
		]);

		const profilesData = profilesResponse.searchProfiles as IDataObject | undefined;
		const publicationsData = publicationsResponse.searchPublications as IDataObject | undefined;
		const profiles = (profilesData?.items as IDataObject[]) || [];
		const publications = (publicationsData?.items as IDataObject[]) || [];

		if (simplify) {
			responseData = {
				profiles: profiles.map((profile: IDataObject) => simplifyProfile(profile)),
				publications: publications.map((pub: IDataObject) => simplifyPublication(pub)),
				totalProfiles: profiles.length,
				totalPublications: publications.length,
			};
		} else {
			responseData = {
				profiles: {
					items: profiles,
					pageInfo: (profilesData?.pageInfo as IDataObject) || {},
				},
				publications: {
					items: publications,
					pageInfo: (publicationsData?.pageInfo as IDataObject) || {},
				},
			};
		}
	} else if (operation === 'getTrendingTags') {
		const limit = this.getNodeParameter('limit', index, 25) as number;

		try {
			const response = await lensApiRequest.call(this, GET_TRENDING_TAGS, {
				request: { limit },
			});
			const tags = response.trendingTags as IDataObject[] | undefined;
			responseData = {
				tags: tags || [],
				count: tags?.length || 0,
			};
		} catch {
			// If trending tags endpoint is not available, return empty array with note
			responseData = {
				tags: [],
				note: 'Trending tags feature may not be available on this Lens API version',
			};
		}
	} else {
		throw new Error(`Unknown operation: ${operation}`);
	}

	return Array.isArray(responseData)
		? responseData.map((data) => ({ json: data }))
		: [{ json: responseData }];
}
