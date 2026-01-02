/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_CHALLENGE,
	AUTHENTICATE,
	REFRESH_TOKEN,
	VERIFY_TOKEN,
	REVOKE_TOKEN,
} from '../../constants/queries';

export const authenticationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['authentication'],
			},
		},
		options: [
			{
				name: 'Get Challenge',
				value: 'challenge',
				description: 'Get authentication challenge',
				action: 'Get challenge',
			},
			{
				name: 'Authenticate',
				value: 'authenticate',
				description: 'Sign challenge and get tokens',
				action: 'Authenticate',
			},
			{
				name: 'Refresh Token',
				value: 'refreshToken',
				description: 'Renew access token',
				action: 'Refresh token',
			},
			{
				name: 'Verify Token',
				value: 'verifyToken',
				description: 'Check token validity',
				action: 'Verify token',
			},
			{
				name: 'Revoke Token',
				value: 'revokeToken',
				description: 'Invalidate token',
				action: 'Revoke token',
			},
		],
		default: 'challenge',
	},
];

export const authenticationFields: INodeProperties[] = [
	// Wallet Address (for challenge)
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['challenge'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The Ethereum wallet address to authenticate',
	},
	// Profile ID (for challenge)
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['challenge'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The Lens profile ID to authenticate with (optional)',
	},
	// Challenge ID (for authenticate)
	{
		displayName: 'Challenge ID',
		name: 'challengeId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['authenticate'],
			},
		},
		default: '',
		description: 'The challenge ID from the challenge request',
	},
	// Signature (for authenticate)
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['authenticate'],
			},
		},
		default: '',
		description: 'The signed challenge message (EIP-712 signature)',
	},
	// Refresh Token (for refresh)
	{
		displayName: 'Refresh Token',
		name: 'refreshTokenValue',
		type: 'string',
		required: true,
		typeOptions: {
			password: true,
		},
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['refreshToken'],
			},
		},
		default: '',
		description: 'The refresh token to use for renewal',
	},
	// Access Token (for verify and revoke)
	{
		displayName: 'Access Token',
		name: 'accessToken',
		type: 'string',
		required: true,
		typeOptions: {
			password: true,
		},
		displayOptions: {
			show: {
				resource: ['authentication'],
				operation: ['verifyToken', 'revokeToken'],
			},
		},
		default: '',
		description: 'The access token to verify or revoke',
	},
];

export async function executeAuthenticationOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject = {};

	switch (operation) {
		case 'challenge': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const profileId = this.getNodeParameter('profileId', i, '') as string;

			const request: IDataObject = {
				signedBy: walletAddress,
			};

			if (profileId) {
				request.for = profileId;
			}

			const variables = { request };
			const response = await lensApiRequest.call(this, GET_CHALLENGE, variables);
			const challenge = response.challenge as IDataObject;

			responseData = {
				id: challenge?.id,
				text: challenge?.text,
				message: 'Sign this message with your wallet to authenticate',
				instructions: [
					'1. Use your wallet (MetaMask, etc.) to sign the challenge text',
					'2. Pass the signature to the Authenticate operation',
					'3. You will receive access and refresh tokens',
				],
			};
			break;
		}

		case 'authenticate': {
			const challengeId = this.getNodeParameter('challengeId', i) as string;
			const signature = this.getNodeParameter('signature', i) as string;

			const variables = {
				request: {
					id: challengeId,
					signature,
				},
			};
			const response = await lensApiRequest.call(this, AUTHENTICATE, variables);
			const auth = response.authenticate as IDataObject;

			responseData = {
				accessToken: auth?.accessToken,
				refreshToken: auth?.refreshToken,
				identityToken: auth?.identityToken,
				message: 'Authentication successful. Store these tokens securely.',
				instructions: [
					'1. Add the access token to your Lens API credentials',
					'2. Use the refresh token when the access token expires',
					'3. Access tokens typically expire in 30 minutes',
				],
			};
			break;
		}

		case 'refreshToken': {
			const refreshTokenValue = this.getNodeParameter('refreshTokenValue', i) as string;

			const variables = {
				request: {
					refreshToken: refreshTokenValue,
				},
			};
			const response = await lensApiRequest.call(this, REFRESH_TOKEN, variables);
			const refresh = response.refresh as IDataObject;

			responseData = {
				accessToken: refresh?.accessToken,
				refreshToken: refresh?.refreshToken,
				identityToken: refresh?.identityToken,
				message: 'Token refresh successful',
			};
			break;
		}

		case 'verifyToken': {
			const accessToken = this.getNodeParameter('accessToken', i) as string;

			const variables = {
				request: {
					accessToken,
				},
			};
			const response = await lensApiRequest.call(this, VERIFY_TOKEN, variables);
			const isValid = response.verify as boolean;

			responseData = {
				valid: isValid,
				accessToken: isValid ? '***' : accessToken,
				message: isValid ? 'Token is valid' : 'Token is invalid or expired',
			};
			break;
		}

		case 'revokeToken': {
			const accessToken = this.getNodeParameter('accessToken', i) as string;

			const variables = {
				request: {
					authorizationId: accessToken,
				},
			};
			await lensApiRequest.call(this, REVOKE_TOKEN, variables, true);

			responseData = {
				success: true,
				message: 'Token has been revoked',
			};
			break;
		}
	}

	return responseData;
}
