/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_COLLECTS,
	ACT_ON_PUBLICATION,
	GET_PUBLICATION,
	GET_PUBLICATION_REVENUE,
} from '../../constants/queries';
import { simplifyProfile } from '../../utils/helpers';

export const collectOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['collects'],
			},
		},
		options: [
			{
				name: 'Get Collects',
				value: 'getCollects',
				description: 'Get collection history for publication',
				action: 'Get collects',
			},
			{
				name: 'Collect Publication',
				value: 'collectPublication',
				description: 'Mint collect NFT (requires auth)',
				action: 'Collect publication',
			},
			{
				name: 'Get Collect Module',
				value: 'getCollectModule',
				description: 'Get collect rules (price, limit, etc.)',
				action: 'Get collect module',
			},
			{
				name: 'Get Collectors',
				value: 'getCollectors',
				description: 'Get list of collectors',
				action: 'Get collectors',
			},
			{
				name: 'Get Revenue',
				value: 'getRevenue',
				description: 'Get collect earnings',
				action: 'Get revenue',
			},
		],
		default: 'getCollects',
	},
];

export const collectFields: INodeProperties[] = [
	// Publication ID field
	{
		displayName: 'Publication ID',
		name: 'publicationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['collects'],
				operation: ['getCollects', 'collectPublication', 'getCollectModule', 'getCollectors', 'getRevenue'],
			},
		},
		default: '',
		placeholder: '0x01-0x01',
		description: 'The publication ID (profileId-pubId format)',
	},
	// Collect Module Address (for collecting)
	{
		displayName: 'Module Address',
		name: 'moduleAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['collects'],
				operation: ['collectPublication'],
			},
		},
		default: '',
		description: 'The collect module address (optional, will auto-detect if not provided)',
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
				resource: ['collects'],
				operation: ['getCollects', 'getCollectors'],
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
				resource: ['collects'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeCollectOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getCollects':
		case 'getCollectors': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					on: publicationId,
					where: {
						anyOf: [{ category: 'COLLECT' }],
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_COLLECTS, variables);
			const acted = response.whoActedOnPublication as IDataObject;
			const items = (acted?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyProfile);
			} else {
				responseData = items;
			}
			break;
		}

		case 'collectPublication': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const moduleAddress = this.getNodeParameter('moduleAddress', i, '') as string;

			const actOn: IDataObject = {};

			if (moduleAddress) {
				actOn.unknownOpenAction = {
					address: moduleAddress,
					data: '0x',
				};
			} else {
				actOn.simpleCollectOpenAction = true;
			}

			const variables = {
				request: {
					for: publicationId,
					actOn,
				},
			};
			const response = await lensApiRequest.call(this, ACT_ON_PUBLICATION, variables, true);
			responseData = response.actOnOpenAction as IDataObject;
			break;
		}

		case 'getCollectModule': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const variables = {
				request: { forId: publicationId },
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATION, variables);
			const publication = response.publication as IDataObject;

			// Extract open action modules which include collect modules
			const openActionModules = publication?.openActionModules as IDataObject[];
			if (openActionModules && openActionModules.length > 0) {
				// Find the collect module (SimpleCollect or MultirecipientFeeCollect)
				const collectModule = openActionModules.find((m) =>
					m.type === 'SimpleCollectOpenActionModule' ||
					m.type === 'MultirecipientFeeCollectOpenActionModule' ||
					(m as IDataObject).__typename?.toString().includes('Collect'),
				);
				responseData = collectModule || { type: 'none', message: 'No collect module configured' };
			} else {
				responseData = { type: 'none', message: 'No collect module configured' };
			}
			break;
		}

		case 'getRevenue': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const variables = {
				request: { for: publicationId },
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATION_REVENUE, variables);
			const revenueData = response.revenueFromPublication as IDataObject;

			if (revenueData) {
				const revenue = revenueData.revenue as IDataObject;
				const total = revenue?.total as IDataObject[];
				responseData = {
					publicationId,
					revenue: total || [],
					totalEarnings: total?.map((t) => ({
						amount: t.value,
						symbol: (t.asset as IDataObject)?.symbol,
						decimals: (t.asset as IDataObject)?.decimals,
					})) || [],
				};
			} else {
				responseData = {
					publicationId,
					revenue: [],
					totalEarnings: [],
				};
			}
			break;
		}
	}

	return responseData;
}
