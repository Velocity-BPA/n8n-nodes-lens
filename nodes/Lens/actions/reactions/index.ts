/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_REACTIONS,
	ADD_REACTION,
	REMOVE_REACTION,
	GET_PUBLICATION,
} from '../../constants/queries';
import { getReactionTypeOptions, simplifyProfile } from '../../utils/helpers';

export const reactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['reactions'],
			},
		},
		options: [
			{
				name: 'Get Reactions',
				value: 'getReactions',
				description: 'Get publication reactions',
				action: 'Get reactions',
			},
			{
				name: 'Add Reaction',
				value: 'addReaction',
				description: 'Like/upvote (requires auth)',
				action: 'Add reaction',
			},
			{
				name: 'Remove Reaction',
				value: 'removeReaction',
				description: 'Unlike (requires auth)',
				action: 'Remove reaction',
			},
			{
				name: 'Get Reaction Count',
				value: 'getReactionCount',
				description: 'Get reaction statistics',
				action: 'Get reaction count',
			},
			{
				name: 'Check Reacted',
				value: 'checkReacted',
				description: 'Check if user reacted',
				action: 'Check if reacted',
			},
		],
		default: 'getReactions',
	},
];

export const reactionFields: INodeProperties[] = [
	// Publication ID field
	{
		displayName: 'Publication ID',
		name: 'publicationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['getReactions', 'addReaction', 'removeReaction', 'getReactionCount', 'checkReacted'],
			},
		},
		default: '',
		placeholder: '0x01-0x01',
		description: 'The publication ID (profileId-pubId format)',
	},
	// Reaction Type field
	{
		displayName: 'Reaction Type',
		name: 'reactionType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['reactions'],
				operation: ['addReaction', 'removeReaction', 'getReactions'],
			},
		},
		options: getReactionTypeOptions(),
		default: 'UPVOTE',
		description: 'The type of reaction',
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
				resource: ['reactions'],
				operation: ['getReactions'],
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
				resource: ['reactions'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeReactionOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getReactions': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const reactionType = this.getNodeParameter('reactionType', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					for: publicationId,
					where: {
						anyOf: [{ reaction: reactionType }],
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_REACTIONS, variables);
			const reactions = response.whoReactedPublication as IDataObject;
			const items = (reactions?.items as IDataObject[]) || [];

			// Transform to simpler format
			responseData = items.map((item) => {
				const profile = item.profile as IDataObject;
				const reactionsData = item.reactions as IDataObject[];
				return {
					profile: simplifyOutput ? simplifyProfile(profile) : profile,
					reactions: reactionsData,
				};
			});
			break;
		}

		case 'addReaction': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const reactionType = this.getNodeParameter('reactionType', i) as string;

			const variables = {
				request: {
					for: publicationId,
					reaction: reactionType,
				},
			};
			await lensApiRequest.call(this, ADD_REACTION, variables, true);
			responseData = {
				success: true,
				publicationId,
				reaction: reactionType,
			};
			break;
		}

		case 'removeReaction': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const reactionType = this.getNodeParameter('reactionType', i) as string;

			const variables = {
				request: {
					for: publicationId,
					reaction: reactionType,
				},
			};
			await lensApiRequest.call(this, REMOVE_REACTION, variables, true);
			responseData = {
				success: true,
				publicationId,
				reaction: reactionType,
			};
			break;
		}

		case 'getReactionCount': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const variables = {
				request: { forId: publicationId },
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATION, variables);
			const publication = response.publication as IDataObject;
			const stats = publication?.stats as IDataObject;
			responseData = {
				publicationId,
				reactions: stats?.reactions || 0,
				upvotes: stats?.upvotes || stats?.reactions || 0,
				downvotes: stats?.downvotes || 0,
			};
			break;
		}

		case 'checkReacted': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const variables = {
				request: { forId: publicationId },
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATION, variables);
			const publication = response.publication as IDataObject;
			const operations = publication?.operations as IDataObject;
			responseData = {
				publicationId,
				hasReacted: operations?.hasReacted || false,
			};
			break;
		}
	}

	return responseData;
}
