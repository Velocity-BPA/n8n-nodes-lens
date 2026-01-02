/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_FOLLOWERS,
	GET_FOLLOWING,
	FOLLOW_PROFILE,
	UNFOLLOW_PROFILE,
	GET_FOLLOW_STATUS,
	GET_MUTUAL_FOLLOWERS,
	GET_PROFILE_BY_ID,
} from '../../constants/queries';
import { simplifyProfile } from '../../utils/helpers';

export const followOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['follows'],
			},
		},
		options: [
			{
				name: 'Get Followers',
				value: 'getFollowers',
				description: 'Get profile followers with pagination',
				action: 'Get followers',
			},
			{
				name: 'Get Following',
				value: 'getFollowing',
				description: 'Get profiles followed',
				action: 'Get following',
			},
			{
				name: 'Follow Profile',
				value: 'followProfile',
				description: 'Create follow (requires auth)',
				action: 'Follow profile',
			},
			{
				name: 'Unfollow Profile',
				value: 'unfollowProfile',
				description: 'Remove follow (requires auth)',
				action: 'Unfollow profile',
			},
			{
				name: 'Check Follow Status',
				value: 'checkFollowStatus',
				description: 'Check if following',
				action: 'Check follow status',
			},
			{
				name: 'Get Mutual Follows',
				value: 'getMutualFollows',
				description: 'Get mutual connections',
				action: 'Get mutual follows',
			},
			{
				name: 'Get Follow Module',
				value: 'getFollowModule',
				description: 'Get follow rules/requirements',
				action: 'Get follow module',
			},
		],
		default: 'getFollowers',
	},
];

export const followFields: INodeProperties[] = [
	// Profile ID field
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing', 'followProfile', 'unfollowProfile', 'getFollowModule'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The Lens profile ID',
	},
	// Follower Profile ID (for check status)
	{
		displayName: 'Follower Profile ID',
		name: 'followerProfileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['checkFollowStatus'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The profile ID of the follower',
	},
	// Following Profile ID (for check status)
	{
		displayName: 'Following Profile ID',
		name: 'followingProfileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['checkFollowStatus'],
			},
		},
		default: '',
		placeholder: '0x02',
		description: 'The profile ID being followed',
	},
	// Observer Profile ID (for mutual follows)
	{
		displayName: 'Observer Profile ID',
		name: 'observerProfileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getMutualFollows'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'Your profile ID',
	},
	// Viewing Profile ID (for mutual follows)
	{
		displayName: 'Viewing Profile ID',
		name: 'viewingProfileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['follows'],
				operation: ['getMutualFollows'],
			},
		},
		default: '',
		placeholder: '0x02',
		description: 'The profile ID to check mutual follows with',
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
				resource: ['follows'],
				operation: ['getFollowers', 'getFollowing', 'getMutualFollows'],
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
				resource: ['follows'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeFollowOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getFollowers': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					of: profileId,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_FOLLOWERS, variables);
			const followers = response.followers as IDataObject;
			responseData = (followers?.items as IDataObject[]) || [];
			break;
		}

		case 'getFollowing': {
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
			const response = await lensApiRequest.call(this, GET_FOLLOWING, variables);
			const following = response.following as IDataObject;
			responseData = (following?.items as IDataObject[]) || [];
			break;
		}

		case 'followProfile': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: {
					follow: [{ profileId }],
				},
			};
			const response = await lensApiRequest.call(this, FOLLOW_PROFILE, variables, true);
			responseData = response.follow as IDataObject;
			break;
		}

		case 'unfollowProfile': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: {
					unfollow: [profileId],
				},
			};
			const response = await lensApiRequest.call(this, UNFOLLOW_PROFILE, variables, true);
			responseData = response.unfollow as IDataObject;
			break;
		}

		case 'checkFollowStatus': {
			const followerProfileId = this.getNodeParameter('followerProfileId', i) as string;
			const followingProfileId = this.getNodeParameter('followingProfileId', i) as string;

			const variables = {
				request: {
					followInfos: [
						{
							follower: followerProfileId,
							profileId: followingProfileId,
						},
					],
				},
			};
			const response = await lensApiRequest.call(this, GET_FOLLOW_STATUS, variables);
			const statusBulk = response.followStatusBulk as IDataObject[];
			responseData = statusBulk && statusBulk.length > 0 ? statusBulk[0] : {};
			break;
		}

		case 'getMutualFollows': {
			const observerProfileId = this.getNodeParameter('observerProfileId', i) as string;
			const viewingProfileId = this.getNodeParameter('viewingProfileId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					observer: observerProfileId,
					viewing: viewingProfileId,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_MUTUAL_FOLLOWERS, variables);
			const mutualFollowers = response.mutualFollowers as IDataObject;
			responseData = (mutualFollowers?.items as IDataObject[]) || [];
			break;
		}

		case 'getFollowModule': {
			const profileId = this.getNodeParameter('profileId', i) as string;

			const variables = {
				request: { forProfileId: profileId },
			};
			const response = await lensApiRequest.call(this, GET_PROFILE_BY_ID, variables);
			const profile = response.profile as IDataObject;
			responseData = profile?.followModule as IDataObject || { type: 'FreeFollowModule' };
			break;
		}
	}

	// Simplify output if requested
	if (simplifyOutput && responseData) {
		if (Array.isArray(responseData)) {
			responseData = responseData.map(simplifyProfile);
		}
	}

	return responseData;
}
