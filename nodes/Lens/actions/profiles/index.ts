/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties, INodeExecutionData } from 'n8n-workflow';
import { lensApiRequest, buildProfileRequest } from '../../transport/client';
import {
	GET_PROFILE_BY_ID,
	GET_PROFILE_BY_HANDLE,
	GET_DEFAULT_PROFILE,
	SEARCH_PROFILES,
	EXPLORE_PROFILES,
	GET_RECOMMENDED_PROFILES,
	GET_PROFILES,
} from '../../constants/queries';
import { simplifyProfile, getProfileExploreOrderOptions } from '../../utils/helpers';

export const profileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['profiles'],
			},
		},
		options: [
			{
				name: 'Get by ID',
				value: 'getProfileByID',
				description: 'Get profile details by profile ID',
				action: 'Get profile by ID',
			},
			{
				name: 'Get by Handle',
				value: 'getProfileByHandle',
				description: 'Lookup profile by username',
				action: 'Get profile by handle',
			},
			{
				name: 'Get by Address',
				value: 'getProfileByAddress',
				description: 'Find profile by wallet address',
				action: 'Get profile by address',
			},
			{
				name: 'Get Default Profile',
				value: 'getDefaultProfile',
				description: 'Get primary profile for address',
				action: 'Get default profile',
			},
			{
				name: 'Search',
				value: 'searchProfiles',
				description: 'Find profiles by query',
				action: 'Search profiles',
			},
			{
				name: 'Get Stats',
				value: 'getProfileStats',
				description: 'Get followers/posts statistics',
				action: 'Get profile stats',
			},
			{
				name: 'Explore',
				value: 'exploreProfiles',
				description: 'Discover profiles by criteria',
				action: 'Explore profiles',
			},
			{
				name: 'Get Recommended',
				value: 'getRecommendedProfiles',
				description: 'Get follow suggestions',
				action: 'Get recommended profiles',
			},
		],
		default: 'getProfileByID',
	},
];

export const profileFields: INodeProperties[] = [
	// Profile ID field
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['profiles'],
				operation: ['getProfileByID', 'getProfileStats', 'getRecommendedProfiles'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The Lens profile ID (hex format)',
	},
	// Handle field
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['profiles'],
				operation: ['getProfileByHandle'],
			},
		},
		default: '',
		placeholder: 'lens/alice',
		description: 'The Lens handle (e.g., lens/alice or just alice)',
	},
	// Wallet Address field
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['profiles'],
				operation: ['getProfileByAddress', 'getDefaultProfile'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Ethereum wallet address',
	},
	// Search Query field
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['profiles'],
				operation: ['searchProfiles'],
			},
		},
		default: '',
		description: 'Search term to find profiles',
	},
	// Explore Options
	{
		displayName: 'Order By',
		name: 'orderBy',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['profiles'],
				operation: ['exploreProfiles'],
			},
		},
		options: getProfileExploreOrderOptions(),
		default: 'MOST_FOLLOWERS',
		description: 'How to order the results',
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
				resource: ['profiles'],
				operation: ['searchProfiles', 'exploreProfiles', 'getRecommendedProfiles'],
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
		],
	},
	// Simplify Output
	{
		displayName: 'Simplify Output',
		name: 'simplifyOutput',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['profiles'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeProfileOperations(
	this: IExecuteFunctions,
	i: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', i) as string;
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getProfileByID': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const variables = { request: buildProfileRequest(profileId) };
			const response = await lensApiRequest.call(this, GET_PROFILE_BY_ID, variables);
			responseData = response.profile as IDataObject;
			break;
		}

		case 'getProfileByHandle': {
			const handle = this.getNodeParameter('handle', i) as string;
			const variables = { request: buildProfileRequest(undefined, handle) };
			const response = await lensApiRequest.call(this, GET_PROFILE_BY_HANDLE, variables);
			responseData = response.profile as IDataObject;
			break;
		}

		case 'getProfileByAddress': {
			const address = this.getNodeParameter('walletAddress', i) as string;
			const variables = {
				request: {
					where: { ownedBy: [address] },
				},
			};
			const response = await lensApiRequest.call(this, GET_PROFILES, variables);
			const profiles = response.profiles as IDataObject;
			const items = (profiles?.items as IDataObject[]) || [];
			responseData = items.length > 0 ? items[0] : {};
			break;
		}

		case 'getDefaultProfile': {
			const address = this.getNodeParameter('walletAddress', i) as string;
			const variables = { request: { for: address } };
			const response = await lensApiRequest.call(this, GET_DEFAULT_PROFILE, variables);
			responseData = response.defaultProfile as IDataObject;
			break;
		}

		case 'searchProfiles': {
			const query = this.getNodeParameter('searchQuery', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					query,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, SEARCH_PROFILES, variables);
			const searchProfiles = response.searchProfiles as IDataObject;
			responseData = (searchProfiles?.items as IDataObject[]) || [];
			break;
		}

		case 'getProfileStats': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const variables = { request: buildProfileRequest(profileId) };
			const response = await lensApiRequest.call(this, GET_PROFILE_BY_ID, variables);
			const profile = response.profile as IDataObject;
			responseData = profile?.stats as IDataObject || {};
			break;
		}

		case 'exploreProfiles': {
			const orderBy = this.getNodeParameter('orderBy', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					orderBy,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, EXPLORE_PROFILES, variables);
			const exploreProfiles = response.exploreProfiles as IDataObject;
			responseData = (exploreProfiles?.items as IDataObject[]) || [];
			break;
		}

		case 'getRecommendedProfiles': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					for: profileId,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_RECOMMENDED_PROFILES, variables);
			const recommendations = response.profileRecommendations as IDataObject;
			responseData = (recommendations?.items as IDataObject[]) || [];
			break;
		}
	}

	// Simplify output if requested
	if (simplifyOutput && responseData) {
		if (Array.isArray(responseData)) {
			responseData = responseData.map(simplifyProfile);
		} else {
			responseData = simplifyProfile(responseData);
		}
	}

	// Convert to INodeExecutionData[]
	if (Array.isArray(responseData)) {
		return responseData.map((data) => ({ json: data }));
	}
	return [{ json: responseData }];
}
