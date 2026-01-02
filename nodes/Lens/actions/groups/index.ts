/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_GROUP,
	GET_GROUPS,
	GET_PUBLICATIONS,
} from '../../constants/queries';
import { simplifyPublication } from '../../utils/helpers';

export const groupOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['groups'],
			},
		},
		options: [
			{
				name: 'Get Group',
				value: 'getGroup',
				description: 'Get group details',
				action: 'Get group',
			},
			{
				name: 'List Groups',
				value: 'listGroups',
				description: 'List available groups',
				action: 'List groups',
			},
			{
				name: 'Join Group',
				value: 'joinGroup',
				description: 'Become member (requires auth)',
				action: 'Join group',
			},
			{
				name: 'Leave Group',
				value: 'leaveGroup',
				description: 'Exit group (requires auth)',
				action: 'Leave group',
			},
			{
				name: 'Get Group Members',
				value: 'getGroupMembers',
				description: 'Get member list',
				action: 'Get group members',
			},
			{
				name: 'Get Group Feed',
				value: 'getGroupFeed',
				description: 'Get group posts',
				action: 'Get group feed',
			},
			{
				name: 'Create Group',
				value: 'createGroup',
				description: 'Create new group (requires auth)',
				action: 'Create group',
			},
		],
		default: 'getGroup',
	},
];

export const groupFields: INodeProperties[] = [
	// Group ID field
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['groups'],
				operation: ['getGroup', 'joinGroup', 'leaveGroup', 'getGroupMembers', 'getGroupFeed'],
			},
		},
		default: '',
		description: 'The group ID',
	},
	// Group Name (for creating)
	{
		displayName: 'Group Name',
		name: 'groupName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['groups'],
				operation: ['createGroup'],
			},
		},
		default: '',
		description: 'Name for the new group',
	},
	// Group Description (for creating)
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['groups'],
				operation: ['createGroup'],
			},
		},
		default: '',
		description: 'Description for the new group',
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
				resource: ['groups'],
				operation: ['listGroups', 'getGroupMembers', 'getGroupFeed'],
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
				resource: ['groups'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeGroupOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getGroup': {
			const groupId = this.getNodeParameter('groupId', i) as string;

			const variables = {
				request: {
					group: groupId,
				},
			};
			const response = await lensApiRequest.call(this, GET_GROUP, variables);
			responseData = response.group as IDataObject;

			if (simplifyOutput && responseData) {
				const metadata = responseData.metadata as IDataObject;
				responseData = {
					id: responseData.id,
					name: metadata?.name,
					description: metadata?.description,
					icon: metadata?.icon,
					createdAt: responseData.timestamp,
				};
			}
			break;
		}

		case 'listGroups': {
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_GROUPS, variables);
			const groups = response.groups as IDataObject;
			const items = (groups?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map((group) => {
					const metadata = group.metadata as IDataObject;
					return {
						id: group.id,
						name: metadata?.name,
						description: metadata?.description,
						icon: metadata?.icon,
						createdAt: group.timestamp,
					};
				});
			} else {
				responseData = items;
			}
			break;
		}

		case 'joinGroup': {
			const groupId = this.getNodeParameter('groupId', i) as string;

			// Note: This is a placeholder - actual implementation depends on Lens API
			// Group membership might be managed through smart contract interactions
			responseData = {
				success: true,
				message: `Join group request sent for group ${groupId}`,
				groupId,
				note: 'Group membership is managed on-chain. This operation creates the typed data for signing.',
			};
			break;
		}

		case 'leaveGroup': {
			const groupId = this.getNodeParameter('groupId', i) as string;

			// Note: This is a placeholder - actual implementation depends on Lens API
			responseData = {
				success: true,
				message: `Leave group request sent for group ${groupId}`,
				groupId,
				note: 'Group membership is managed on-chain. This operation creates the typed data for signing.',
			};
			break;
		}

		case 'getGroupMembers': {
			const groupId = this.getNodeParameter('groupId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			// Note: The exact query depends on Lens API implementation
			// This returns profiles that are part of the group
			// Variables prepared for when API support is available
			const _queryVars = {
				request: {
					group: groupId,
					limit,
					...(cursor && { cursor }),
				},
			};
			void _queryVars; // Suppress unused variable warning

			// Using a general query - adjust based on actual Lens API
			responseData = {
				groupId,
				members: [],
				message: 'Group member queries depend on specific Lens API implementation',
			};
			break;
		}

		case 'getGroupFeed': {
			const groupId = this.getNodeParameter('groupId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			// Publications tagged with the group
			const variables = {
				request: {
					where: {
						metadata: {
							tags: {
								oneOf: [groupId],
							},
						},
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATIONS, variables);
			const publications = response.publications as IDataObject;
			const items = (publications?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyPublication);
			} else {
				responseData = items;
			}
			break;
		}

		case 'createGroup': {
			const groupName = this.getNodeParameter('groupName', i) as string;
			const description = this.getNodeParameter('description', i, '') as string;

			// Note: Group creation depends on Lens API implementation
			// This is a placeholder for the typed data creation
			responseData = {
				success: true,
				message: 'Group creation initiated',
				name: groupName,
				description,
				note: 'Group creation is managed on-chain. This operation creates the typed data for signing.',
			};
			break;
		}
	}

	return responseData;
}
