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
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';

// Import operations and fields from all resources
import {
	profileOperations,
	profileFields,
	executeProfileOperations,
} from './actions/profiles';

import {
	publicationOperations,
	publicationFields,
	executePublicationOperations,
} from './actions/publications';

import {
	followOperations,
	followFields,
	executeFollowOperations,
} from './actions/follows';

import {
	reactionOperations,
	reactionFields,
	executeReactionOperations,
} from './actions/reactions';

import {
	collectOperations,
	collectFields,
	executeCollectOperations,
} from './actions/collects';

import {
	feedOperations,
	feedFields,
	executeFeedOperations,
} from './actions/feeds';

import {
	groupOperations,
	groupFields,
	executeGroupOperations,
} from './actions/groups';

import {
	authenticationOperations,
	authenticationFields,
	executeAuthenticationOperations,
} from './actions/authentication';

import {
	notificationOperations,
	notificationFields,
	executeNotificationOperations,
} from './actions/notifications';

import {
	moduleOperations,
	moduleFields,
	executeModuleOperations,
} from './actions/modules';

import {
	searchOperations,
	searchFields,
	executeSearchOperations,
} from './actions/search';

import {
	metadataOperations,
	metadataFields,
	executeMetadataOperations,
} from './actions/metadata';

import {
	revenueOperations,
	revenueFields,
	executeRevenueOperations,
} from './actions/revenue';

import {
	utilityOperations,
	utilityFields,
	executeUtilityOperations,
} from './actions/utility';

// Emit licensing notice once on node load
const LICENSING_NOTICE_EMITTED = Symbol.for('n8n-nodes-lens-license-notice');
if (!(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_EMITTED]) {
	console.warn(`[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);
	(globalThis as Record<symbol, boolean>)[LICENSING_NOTICE_EMITTED] = true;
}

export class Lens implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Lens',
		name: 'lens',
		icon: 'file:lens.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Lens Protocol - the decentralized social graph',
		defaults: {
			name: 'Lens',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'lensApi',
				required: false,
				displayOptions: {
					show: {
						resource: [
							'publications',
							'follows',
							'reactions',
							'collects',
							'groups',
							'authentication',
							'notifications',
							'metadata',
						],
					},
				},
			},
		],
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Authentication',
						value: 'authentication',
						description: 'Manage authentication and tokens',
					},
					{
						name: 'Collect',
						value: 'collects',
						description: 'Manage publication collects',
					},
					{
						name: 'Feed',
						value: 'feeds',
						description: 'Get personalized and explore feeds',
					},
					{
						name: 'Follow',
						value: 'follows',
						description: 'Manage follows and followers',
					},
					{
						name: 'Group',
						value: 'groups',
						description: 'Manage groups and memberships',
					},
					{
						name: 'Metadata',
						value: 'metadata',
						description: 'Create and validate metadata',
					},
					{
						name: 'Module',
						value: 'modules',
						description: 'Query available modules',
					},
					{
						name: 'Notification',
						value: 'notifications',
						description: 'Get notifications and alerts',
					},
					{
						name: 'Profile',
						value: 'profiles',
						description: 'Manage Lens profiles',
					},
					{
						name: 'Publication',
						value: 'publications',
						description: 'Create and manage posts, comments, mirrors',
					},
					{
						name: 'Reaction',
						value: 'reactions',
						description: 'Manage likes and reactions',
					},
					{
						name: 'Revenue',
						value: 'revenue',
						description: 'Track earnings and revenue',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search profiles and publications',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility functions and API health',
					},
				],
				default: 'profiles',
			},

			// Profile operations and fields
			...profileOperations,
			...profileFields,

			// Publication operations and fields
			...publicationOperations,
			...publicationFields,

			// Follow operations and fields
			...followOperations,
			...followFields,

			// Reaction operations and fields
			...reactionOperations,
			...reactionFields,

			// Collect operations and fields
			...collectOperations,
			...collectFields,

			// Feed operations and fields
			...feedOperations,
			...feedFields,

			// Group operations and fields
			...groupOperations,
			...groupFields,

			// Authentication operations and fields
			...authenticationOperations,
			...authenticationFields,

			// Notification operations and fields
			...notificationOperations,
			...notificationFields,

			// Module operations and fields
			...moduleOperations,
			...moduleFields,

			// Search operations and fields
			...searchOperations,
			...searchFields,

			// Metadata operations and fields
			...metadataOperations,
			...metadataFields,

			// Revenue operations and fields
			...revenueOperations,
			...revenueFields,

			// Utility operations and fields
			...utilityOperations,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[] = [];
				const operation = this.getNodeParameter('operation', i) as string;

				// Helper to convert IDataObject to INodeExecutionData[]
				const toNodeData = (data: IDataObject | IDataObject[]): INodeExecutionData[] => {
					if (Array.isArray(data)) {
						return data.map((d) => ({ json: d }));
					}
					return [{ json: data }];
				};

				switch (resource) {
					case 'profiles': {
						const data = await executeProfileOperations.call(this, i);
						result = data;
						break;
					}
					case 'publications': {
						const data = await executePublicationOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'follows': {
						const data = await executeFollowOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'reactions': {
						const data = await executeReactionOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'collects': {
						const data = await executeCollectOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'feeds': {
						const data = await executeFeedOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'groups': {
						const data = await executeGroupOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'authentication': {
						const data = await executeAuthenticationOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'notifications': {
						const data = await executeNotificationOperations.call(this, operation, i);
						result = toNodeData(data);
						break;
					}
					case 'modules':
						result = await executeModuleOperations.call(this, i);
						break;
					case 'search':
						result = await executeSearchOperations.call(this, i);
						break;
					case 'metadata':
						result = await executeMetadataOperations.call(this, i);
						break;
					case 'revenue':
						result = await executeRevenueOperations.call(this, i);
						break;
					case 'utility':
						result = await executeUtilityOperations.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: {
							item: i,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
