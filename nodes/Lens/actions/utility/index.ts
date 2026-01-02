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
	PING,
	GET_PROFILES_MANAGED,
	VALIDATE_HANDLE,
	GET_ENABLED_CURRENCIES,
} from '../../constants/queries';
import { simplifyProfile } from '../../utils/helpers';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Check API Health',
				value: 'getApiHealth',
				description: 'Check if the Lens API is healthy',
				action: 'Check API health',
			},
			{
				name: 'Get Currencies',
				value: 'getCurrencies',
				description: 'Get supported payment currencies',
				action: 'Get supported currencies',
			},
			{
				name: 'Get Managed Profiles',
				value: 'getProfilesManaged',
				description: 'Get profiles managed by a wallet address',
				action: 'Get managed profiles',
			},
			{
				name: 'Validate Handle',
				value: 'validateHandle',
				description: 'Check if a handle is available',
				action: 'Validate handle availability',
			},
			{
				name: 'Get Protocol Stats',
				value: 'getProtocolStats',
				description: 'Get Lens Protocol statistics',
				action: 'Get protocol stats',
			},
		],
		default: 'getApiHealth',
	},
];

export const utilityFields: INodeProperties[] = [
	// Get Managed Profiles fields
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getProfilesManaged'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Ethereum wallet address to check',
	},
	{
		displayName: 'Include Owned By Me',
		name: 'includeOwnedByMe',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getProfilesManaged'],
			},
		},
		default: true,
		description: 'Whether to include profiles owned by this address',
	},

	// Validate Handle fields
	{
		displayName: 'Handle',
		name: 'handle',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateHandle'],
			},
		},
		default: '',
		placeholder: 'alice',
		description: 'Handle to check (without lens/ prefix)',
	},

	// Common options
	{
		displayName: 'Simplify Output',
		name: 'simplify',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getProfilesManaged'],
			},
		},
		default: true,
		description: 'Whether to return simplified response data',
	},
];

// Protocol stats query
const GET_PROTOCOL_STATS = `
	query GetProtocolStats {
		globalProtocolStats {
			totalProfiles
			totalPosts
			totalComments
			totalMirrors
			totalQuotes
			totalCollects
			totalFollows
			totalRevenue {
				value
				currency {
					symbol
					name
				}
			}
		}
	}
`;

export async function executeUtilityOperations(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: IDataObject;

	if (operation === 'getApiHealth') {
		const startTime = Date.now();

		try {
			const response = await lensApiRequest.call(this, PING, {});
			const latency = Date.now() - startTime;

			responseData = {
				healthy: response.ping === 'pong',
				response: response.ping,
				latencyMs: latency,
				timestamp: new Date().toISOString(),
				endpoint: 'Lens Protocol API',
			};
		} catch (error) {
			const latency = Date.now() - startTime;
			responseData = {
				healthy: false,
				error: (error as Error).message,
				latencyMs: latency,
				timestamp: new Date().toISOString(),
			};
		}
	} else if (operation === 'getCurrencies') {
		const response = await lensApiRequest.call(this, GET_ENABLED_CURRENCIES, {});

		const currencyData = response.currencies as IDataObject | undefined;
		const currencies = (currencyData?.items as IDataObject[]) || [];

		// Format currency data
		const formatted = currencies.map((currency) => ({
			symbol: currency.symbol,
			name: currency.name,
			decimals: currency.decimals,
			address: (currency.contract as IDataObject)?.address,
			isTestnet: currency.isTestnet || false,
		}));

		responseData = {
			currencies: formatted,
			count: formatted.length,
		};
	} else if (operation === 'getProfilesManaged') {
		const walletAddress = this.getNodeParameter('walletAddress', index) as string;
		const includeOwnedByMe = this.getNodeParameter('includeOwnedByMe', index, true) as boolean;
		const simplify = this.getNodeParameter('simplify', index, true) as boolean;

		const response = await lensApiRequest.call(this, GET_PROFILES_MANAGED, {
			request: {
				for: walletAddress,
				includeOwned: includeOwnedByMe,
			},
		});

		const profilesData = response.profilesManaged as IDataObject | undefined;
		const profiles = (profilesData?.items as IDataObject[]) || [];

		if (simplify) {
			responseData = {
				walletAddress,
				profiles: profiles.map((p: IDataObject) => simplifyProfile(p)),
				count: profiles.length,
			};
		} else {
			responseData = {
				walletAddress,
				profiles,
				pageInfo: (profilesData?.pageInfo as IDataObject) || {},
			};
		}
	} else if (operation === 'validateHandle') {
		const handle = this.getNodeParameter('handle', index) as string;

		// Clean the handle
		const cleanHandle = handle
			.toLowerCase()
			.replace(/^(lens\/|@)/, '')
			.trim();

		// Validate format first
		const handleRegex = /^[a-z0-9_]{5,26}$/;
		if (!handleRegex.test(cleanHandle)) {
			responseData = {
				handle: cleanHandle,
				valid: false,
				available: false,
				reason: 'Handle must be 5-26 characters, lowercase alphanumeric and underscores only',
			};
		} else {
			try {
				const response = await lensApiRequest.call(this, VALIDATE_HANDLE, {
					request: {
						handle: `lens/${cleanHandle}`,
					},
				});

				// Check if handle exists
				const handleExists = response.handleToAddress !== null;

				responseData = {
					handle: cleanHandle,
					fullHandle: `lens/${cleanHandle}`,
					valid: true,
					available: !handleExists,
					existingOwner: handleExists ? response.handleToAddress : null,
				};
			} catch {
				// If query fails, handle might be available
				responseData = {
					handle: cleanHandle,
					fullHandle: `lens/${cleanHandle}`,
					valid: true,
					available: true,
					note: 'Handle appears to be available (not found in registry)',
				};
			}
		}
	} else if (operation === 'getProtocolStats') {
		try {
			const response = await lensApiRequest.call(this, GET_PROTOCOL_STATS, {});

			const stats = (response.globalProtocolStats as IDataObject) || {};

			// Format revenue data
			const revenue = (stats.totalRevenue as IDataObject[]) || [];
			const formattedRevenue: IDataObject = {};
			for (const rev of revenue) {
				const currency = (rev.currency as IDataObject)?.symbol as string || 'UNKNOWN';
				formattedRevenue[currency] = rev.value;
			}

			responseData = {
				totalProfiles: stats.totalProfiles || 0,
				totalPosts: stats.totalPosts || 0,
				totalComments: stats.totalComments || 0,
				totalMirrors: stats.totalMirrors || 0,
				totalQuotes: stats.totalQuotes || 0,
				totalCollects: stats.totalCollects || 0,
				totalFollows: stats.totalFollows || 0,
				totalRevenue: formattedRevenue,
				retrievedAt: new Date().toISOString(),
			};
		} catch {
			// Stats endpoint might not be available
			responseData = {
				error: 'Protocol stats not available',
				note: 'This endpoint may not be supported on all Lens API versions',
				retrievedAt: new Date().toISOString(),
			};
		}
	} else {
		throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: responseData }];
}
