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
import {
	GET_ENABLED_CURRENCIES,
	GET_FOLLOW_MODULES,
	GET_SUPPORTED_OPEN_ACTION_MODULES,
	GET_SUPPORTED_REFERENCE_MODULES,
} from '../../constants/queries';

export const moduleOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['modules'],
			},
		},
		options: [
			{
				name: 'Get Currencies',
				value: 'getCurrencies',
				description: 'Get supported payment currencies/tokens',
				action: 'Get supported currencies',
			},
			{
				name: 'Get Follow Modules',
				value: 'getFollowModules',
				description: 'Get available follow module configurations',
				action: 'Get follow modules',
			},
			{
				name: 'Get Open Action Modules',
				value: 'getOpenActionModules',
				description: 'Get available open action modules',
				action: 'Get open action modules',
			},
			{
				name: 'Get Reference Modules',
				value: 'getReferenceModules',
				description: 'Get available reference modules for comments/mirrors',
				action: 'Get reference modules',
			},
			{
				name: 'Get Enabled Modules',
				value: 'getEnabledModules',
				description: 'Get all enabled modules for the protocol',
				action: 'Get enabled modules',
			},
		],
		default: 'getCurrencies',
	},
];

export const moduleFields: INodeProperties[] = [
	// Get Currencies fields
	{
		displayName: 'Include Test Currencies',
		name: 'includeTestCurrencies',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['modules'],
				operation: ['getCurrencies'],
			},
		},
		default: false,
		description: 'Whether to include test currencies in the results',
	},

	// Get Follow Modules fields
	{
		displayName: 'Cursor',
		name: 'cursor',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['modules'],
				operation: ['getFollowModules', 'getOpenActionModules', 'getReferenceModules'],
			},
		},
		default: '',
		description: 'Pagination cursor for fetching more results',
	},

	// Get Open Action Modules fields
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['modules'],
				operation: ['getFollowModules', 'getOpenActionModules', 'getReferenceModules'],
			},
		},
		default: 25,
		typeOptions: {
			minValue: 1,
			maxValue: 50,
		},
		description: 'Maximum number of modules to return',
	},
];

export async function executeModuleOperations(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: IDataObject | IDataObject[];

	if (operation === 'getCurrencies') {
		const includeTestCurrencies = this.getNodeParameter('includeTestCurrencies', index, false) as boolean;

		const response = await lensApiRequest.call(this, GET_ENABLED_CURRENCIES, {});

		const currencies = (response.currencies as IDataObject)?.items as IDataObject[] || [];

		// Filter out test currencies if not requested
		if (!includeTestCurrencies) {
			responseData = currencies.filter((c: IDataObject) => !c.isTestnet);
		} else {
			responseData = currencies;
		}
	} else if (operation === 'getFollowModules') {
		const cursor = this.getNodeParameter('cursor', index, '') as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;

		const variables: IDataObject = {
			request: {
				limit,
				...(cursor && { cursor }),
			},
		};

		const response = await lensApiRequest.call(this, GET_FOLLOW_MODULES, variables);
		responseData = response.followModules as IDataObject || {};
	} else if (operation === 'getOpenActionModules') {
		const cursor = this.getNodeParameter('cursor', index, '') as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;

		const variables: IDataObject = {
			request: {
				limit,
				...(cursor && { cursor }),
			},
		};

		const response = await lensApiRequest.call(this, GET_SUPPORTED_OPEN_ACTION_MODULES, variables);
		responseData = response.openActionModules as IDataObject || {};
	} else if (operation === 'getReferenceModules') {
		const cursor = this.getNodeParameter('cursor', index, '') as string;
		const limit = this.getNodeParameter('limit', index, 25) as number;

		const variables: IDataObject = {
			request: {
				limit,
				...(cursor && { cursor }),
			},
		};

		const response = await lensApiRequest.call(this, GET_SUPPORTED_REFERENCE_MODULES, variables);
		responseData = response.referenceModules as IDataObject || {};
	} else if (operation === 'getEnabledModules') {
		// Get all module types
		const [currencies, followModules, openActionModules, referenceModules] = await Promise.all([
			lensApiRequest.call(this, GET_ENABLED_CURRENCIES, {}),
			lensApiRequest.call(this, GET_FOLLOW_MODULES, { request: { limit: 50 } }),
			lensApiRequest.call(this, GET_SUPPORTED_OPEN_ACTION_MODULES, { request: { limit: 50 } }),
			lensApiRequest.call(this, GET_SUPPORTED_REFERENCE_MODULES, { request: { limit: 50 } }),
		]);

		responseData = {
			currencies: (currencies.currencies as IDataObject)?.items || [],
			followModules: (followModules.followModules as IDataObject)?.items || [],
			openActionModules: (openActionModules.openActionModules as IDataObject)?.items || [],
			referenceModules: (referenceModules.referenceModules as IDataObject)?.items || [],
		};
	} else {
		throw new Error(`Unknown operation: ${operation}`);
	}

	return Array.isArray(responseData)
		? responseData.map((data) => ({ json: data }))
		: [{ json: responseData }];
}
