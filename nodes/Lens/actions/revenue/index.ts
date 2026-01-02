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
	GET_PROFILE_REVENUE,
	GET_PUBLICATION_REVENUE,
	GET_FOLLOW_REVENUES,
} from '../../constants/queries';

export const revenueOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['revenue'],
			},
		},
		options: [
			{
				name: 'Get Profile Revenue',
				value: 'getProfileRevenue',
				description: 'Get total revenue earned by a profile',
				action: 'Get profile revenue',
			},
			{
				name: 'Get Publication Revenue',
				value: 'getPublicationRevenue',
				description: 'Get revenue from a specific publication',
				action: 'Get publication revenue',
			},
			{
				name: 'Get Follow Revenue',
				value: 'getFollowRevenue',
				description: 'Get revenue from follow fees',
				action: 'Get follow revenue',
			},
			{
				name: 'Get Revenue Summary',
				value: 'getRevenueSummary',
				description: 'Get comprehensive revenue summary for profile',
				action: 'Get revenue summary',
			},
		],
		default: 'getProfileRevenue',
	},
];

export const revenueFields: INodeProperties[] = [
	// Profile ID - used by multiple operations
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['revenue'],
				operation: ['getProfileRevenue', 'getFollowRevenue', 'getRevenueSummary'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The profile ID (hex format)',
	},

	// Publication ID
	{
		displayName: 'Publication ID',
		name: 'publicationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['revenue'],
				operation: ['getPublicationRevenue'],
			},
		},
		default: '',
		placeholder: '0x01-0x01',
		description: 'The publication ID (format: profileId-pubId)',
	},

	// Filter options for profile revenue
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['revenue'],
				operation: ['getProfileRevenue'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 25,
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				description: 'Maximum number of revenue records to return',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor',
			},
			{
				displayName: 'For Publication IDs',
				name: 'forPublicationIds',
				type: 'string',
				default: '',
				placeholder: '0x01-0x01, 0x01-0x02',
				description: 'Comma-separated list of publication IDs to filter by',
			},
		],
	},

	// Options for follow revenue
	{
		displayName: 'Options',
		name: 'followOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['revenue'],
				operation: ['getFollowRevenue'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 25,
				typeOptions: {
					minValue: 1,
					maxValue: 50,
				},
				description: 'Maximum number of revenue records to return',
			},
			{
				displayName: 'Cursor',
				name: 'cursor',
				type: 'string',
				default: '',
				description: 'Pagination cursor',
			},
		],
	},

	// Include breakdown option
	{
		displayName: 'Include Breakdown',
		name: 'includeBreakdown',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['revenue'],
				operation: ['getRevenueSummary'],
			},
		},
		default: true,
		description: 'Whether to include detailed breakdown by currency and source',
	},
];

export async function executeRevenueOperations(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: IDataObject;

	if (operation === 'getProfileRevenue') {
		const profileId = this.getNodeParameter('profileId', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		const request: IDataObject = {
			for: profileId,
			limit: options.limit || 25,
		};

		if (options.cursor) {
			request.cursor = options.cursor;
		}

		if (options.forPublicationIds) {
			const pubIds = (options.forPublicationIds as string)
				.split(',')
				.map((id) => id.trim())
				.filter((id) => id);
			if (pubIds.length > 0) {
				request.publishedOn = pubIds;
			}
		}

		const response = await lensApiRequest.call(this, GET_PROFILE_REVENUE, {
			request,
		});

		const revenueData = response.revenueFromPublications as IDataObject | undefined;
		const revenueItems = (revenueData?.items as IDataObject[]) || [];

		// Calculate totals by currency
		const totals: IDataObject = {};
		for (const item of revenueItems) {
			const amount = (item.revenue as IDataObject[]) || [];
			for (const rev of amount) {
				const currency = (rev.currency as IDataObject)?.symbol as string || 'UNKNOWN';
				const value = parseFloat(rev.value as string) || 0;
				totals[currency] = ((totals[currency] as number) || 0) + value;
			}
		}

		responseData = {
			items: revenueItems,
			totals,
			pageInfo: (revenueData?.pageInfo as IDataObject) || {},
		};
	} else if (operation === 'getPublicationRevenue') {
		const publicationId = this.getNodeParameter('publicationId', index) as string;

		const response = await lensApiRequest.call(this, GET_PUBLICATION_REVENUE, {
			request: {
				for: publicationId,
			},
		});

		const revenue = (response.revenueFromPublication as IDataObject) || {};

		// Format the revenue data
		const revenueArray = (revenue.revenue as IDataObject[]) || [];
		const formatted: IDataObject[] = revenueArray.map((rev) => ({
			currency: (rev.currency as IDataObject)?.symbol as string || 'UNKNOWN',
			currencyAddress: ((rev.currency as IDataObject)?.contract as IDataObject)?.address,
			amount: rev.value,
			amountUsd: rev.valueUsd,
		}));

		responseData = {
			publicationId,
			publication: (revenue.publication as IDataObject) || {},
			revenue: formatted,
			totalEntries: formatted.length,
		};
	} else if (operation === 'getFollowRevenue') {
		const profileId = this.getNodeParameter('profileId', index) as string;
		const options = this.getNodeParameter('followOptions', index, {}) as IDataObject;

		const request: IDataObject = {
			for: profileId,
			limit: options.limit || 25,
		};

		if (options.cursor) {
			request.cursor = options.cursor;
		}

		const response = await lensApiRequest.call(this, GET_FOLLOW_REVENUES, {
			request,
		});

		const followRevenueData = response.followRevenues as IDataObject | undefined;
		const followRevenue = (followRevenueData?.items as IDataObject[]) || [];

		// Calculate totals
		const totals: IDataObject = {};
		for (const item of followRevenue) {
			const amount = (item.amount as IDataObject) || {};
			const currency = (amount.currency as IDataObject)?.symbol as string || 'UNKNOWN';
			const value = parseFloat(amount.value as string) || 0;
			totals[currency] = ((totals[currency] as number) || 0) + value;
		}

		responseData = {
			profileId,
			items: followRevenue,
			totals,
			pageInfo: (followRevenueData?.pageInfo as IDataObject) || {},
		};
	} else if (operation === 'getRevenueSummary') {
		const profileId = this.getNodeParameter('profileId', index) as string;
		const includeBreakdown = this.getNodeParameter('includeBreakdown', index, true) as boolean;

		// Fetch all revenue types in parallel
		const [publicationRevenue, followRevenue] = await Promise.all([
			lensApiRequest.call(this, GET_PROFILE_REVENUE, {
				request: { for: profileId, limit: 50 },
			}),
			lensApiRequest.call(this, GET_FOLLOW_REVENUES, {
				request: { for: profileId, limit: 50 },
			}),
		]);

		// Process publication revenue
		const pubRevenueData = publicationRevenue.revenueFromPublications as IDataObject | undefined;
		const pubItems = (pubRevenueData?.items as IDataObject[]) || [];
		const publicationTotals: IDataObject = {};
		for (const item of pubItems) {
			const revenueList = (item.revenue as IDataObject[]) || [];
			for (const rev of revenueList) {
				const currency = (rev.currency as IDataObject)?.symbol as string || 'UNKNOWN';
				const value = parseFloat(rev.value as string) || 0;
				publicationTotals[currency] = ((publicationTotals[currency] as number) || 0) + value;
			}
		}

		// Process follow revenue
		const followRevenueData = followRevenue.followRevenues as IDataObject | undefined;
		const followItems = (followRevenueData?.items as IDataObject[]) || [];
		const followTotals: IDataObject = {};
		for (const item of followItems) {
			const amount = (item.amount as IDataObject) || {};
			const currency = (amount.currency as IDataObject)?.symbol as string || 'UNKNOWN';
			const value = parseFloat(amount.value as string) || 0;
			followTotals[currency] = ((followTotals[currency] as number) || 0) + value;
		}

		// Combine totals
		const combinedTotals: IDataObject = {};
		for (const [currency, value] of Object.entries(publicationTotals)) {
			combinedTotals[currency] = ((combinedTotals[currency] as number) || 0) + (value as number);
		}
		for (const [currency, value] of Object.entries(followTotals)) {
			combinedTotals[currency] = ((combinedTotals[currency] as number) || 0) + (value as number);
		}

		responseData = {
			profileId,
			totalRevenue: combinedTotals,
			publicationRevenueCount: pubItems.length,
			followRevenueCount: followItems.length,
		};

		if (includeBreakdown) {
			responseData.breakdown = {
				publications: publicationTotals,
				follows: followTotals,
			};
			responseData.recentPublicationRevenue = pubItems.slice(0, 10);
			responseData.recentFollowRevenue = followItems.slice(0, 10);
		}
	} else {
		throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: responseData }];
}
