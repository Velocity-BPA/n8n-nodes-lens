/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IDataObject,
	IHttpRequestMethods,
	IRequestOptions,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { LENS_API_MAINNET, LENS_API_TESTNET } from '../constants';
import type { LensApiResponse, LensApiError } from '../utils/types';

export interface GraphQLRequest {
	query: string;
	variables?: IDataObject;
	operationName?: string;
}

export interface LensCredentials {
	network: 'mainnet' | 'testnet';
	apiEndpoint: string;
	accessToken?: string;
	refreshToken?: string;
	profileId?: string;
}

/**
 * Get the appropriate API endpoint based on credentials
 */
export function getApiEndpoint(credentials: LensCredentials): string {
	if (credentials.apiEndpoint && credentials.apiEndpoint !== LENS_API_MAINNET) {
		return credentials.apiEndpoint;
	}
	return credentials.network === 'testnet' ? LENS_API_TESTNET : LENS_API_MAINNET;
}

/**
 * Execute a GraphQL query/mutation against the Lens API
 */
export async function lensApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
	query: string,
	variables: IDataObject = {},
	requiresAuth = false,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('lensApi') as unknown as LensCredentials;
	const endpoint = getApiEndpoint(credentials);

	if (requiresAuth && !credentials.accessToken) {
		throw new NodeOperationError(
			this.getNode(),
			'Authentication required. Please provide an access token in credentials.',
		);
	}

	const headers: IDataObject = {
		'Content-Type': 'application/json',
	};

	if (credentials.accessToken) {
		headers.Authorization = `Bearer ${credentials.accessToken}`;
	}

	const requestOptions: IRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		uri: endpoint,
		headers,
		body: {
			query,
			variables,
		},
		json: true,
	};

	try {
		const response = await this.helpers.request(requestOptions) as LensApiResponse<IDataObject>;

		if (response.errors && response.errors.length > 0) {
			const error = response.errors[0] as LensApiError;
			throw new NodeApiError(this.getNode(), {
				message: error.message,
				description: `GraphQL Error: ${error.message}`,
			});
		}

		return response.data || {};
	} catch (error) {
		if (error instanceof NodeApiError || error instanceof NodeOperationError) {
			throw error;
		}

		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		throw new NodeApiError(this.getNode(), {
			message: errorMessage,
			description: 'Failed to execute Lens API request',
		});
	}
}

/**
 * Execute a paginated GraphQL query
 */
export async function lensApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
	query: string,
	variables: IDataObject = {},
	dataKey: string,
	requiresAuth = false,
	limit?: number,
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let cursor: string | undefined;
	let hasMore = true;

	while (hasMore) {
		const currentVariables = {
			...variables,
			request: {
				...(variables.request as IDataObject || {}),
				cursor,
			},
		};

		const response = await lensApiRequest.call(this, query, currentVariables, requiresAuth);
		const data = response[dataKey] as IDataObject | undefined;

		if (data) {
			const items = (data.items as IDataObject[]) || [];
			results.push(...items);

			const pageInfo = data.pageInfo as IDataObject | undefined;
			cursor = pageInfo?.next as string | undefined;
			hasMore = !!cursor;

			// Check if we've reached the limit
			if (limit && results.length >= limit) {
				return results.slice(0, limit);
			}
		} else {
			hasMore = false;
		}
	}

	return results;
}

/**
 * Helper to build profile request variables
 */
export function buildProfileRequest(
	profileId?: string,
	handle?: string,
	address?: string,
): IDataObject {
	if (profileId) {
		return { forProfileId: profileId };
	}
	if (handle) {
		// Handle format: lens/username
		const formattedHandle = handle.includes('/') ? handle : `lens/${handle}`;
		return { forHandle: formattedHandle };
	}
	if (address) {
		return { forAddress: address };
	}
	throw new Error('Profile ID, handle, or address is required');
}

/**
 * Helper to build publication request variables
 */
export function buildPublicationRequest(publicationId: string): IDataObject {
	return { forId: publicationId };
}

/**
 * Helper to build pagination request variables
 */
export function buildPaginationRequest(
	cursor?: string,
	limit?: number,
): IDataObject {
	const request: IDataObject = {};
	if (cursor) {
		request.cursor = cursor;
	}
	if (limit) {
		request.limit = Math.min(limit, 50); // Max 50 per page
	}
	return request;
}

/**
 * Helper to format Lens handle
 */
export function formatHandle(handle: string): string {
	if (handle.includes('/')) {
		return handle;
	}
	return `lens/${handle}`;
}

/**
 * Helper to extract profile ID from handle or return as-is
 */
export function normalizeProfileIdentifier(identifier: string): IDataObject {
	// Check if it's a profile ID (hex format)
	if (identifier.startsWith('0x')) {
		return { forProfileId: identifier };
	}
	// Otherwise treat as handle
	return { forHandle: formatHandle(identifier) };
}
