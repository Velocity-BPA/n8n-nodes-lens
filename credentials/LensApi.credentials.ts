/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LensApi implements ICredentialType {
	name = 'lensApi';
	displayName = 'Lens API';
	documentationUrl = 'https://docs.lens.xyz/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Testnet',
					value: 'testnet',
				},
			],
			default: 'mainnet',
			description: 'The Lens network to connect to',
		},
		{
			displayName: 'API Endpoint',
			name: 'apiEndpoint',
			type: 'string',
			default: 'https://api.lens.xyz/graphql',
			description: 'The Lens Protocol GraphQL API endpoint',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'JWT access token for authenticated operations (optional for read-only operations)',
		},
		{
			displayName: 'Refresh Token',
			name: 'refreshToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'JWT refresh token for renewing access tokens',
		},
		{
			displayName: 'Profile ID',
			name: 'profileId',
			type: 'string',
			default: '',
			description: 'The profile ID to use for authenticated operations (e.g., 0x01)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.accessToken ? "Bearer " + $credentials.accessToken : ""}}',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiEndpoint}}',
			method: 'POST',
			body: JSON.stringify({
				query: `
					query Ping {
						ping
					}
				`,
			}),
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
