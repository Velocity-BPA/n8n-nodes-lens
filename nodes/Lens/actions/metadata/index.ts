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

// Metadata upload typically uses a separate service (like IPFS or Lens-specific storage)
const UPLOAD_METADATA = `
	mutation UploadMetadata($request: OnchainSetProfileMetadataRequest!) {
		setProfileMetadata(request: $request) {
			... on RelaySuccess {
				txHash
				txId
			}
			... on LensProfileManagerRelayError {
				reason
			}
		}
	}
`;

const VALIDATE_PUBLICATION_METADATA = `
	query ValidatePublicationMetadata($request: ValidatePublicationMetadataRequest!) {
		validatePublicationMetadata(request: $request) {
			valid
			reason
		}
	}
`;

export const metadataOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['metadata'],
			},
		},
		options: [
			{
				name: 'Create Publication Metadata',
				value: 'createPublicationMetadata',
				description: 'Generate publication metadata JSON',
				action: 'Create publication metadata',
			},
			{
				name: 'Create Profile Metadata',
				value: 'createProfileMetadata',
				description: 'Generate profile metadata JSON',
				action: 'Create profile metadata',
			},
			{
				name: 'Validate Publication Metadata',
				value: 'validatePublicationMetadata',
				description: 'Validate metadata format before upload',
				action: 'Validate publication metadata',
			},
			{
				name: 'Set Profile Metadata',
				value: 'setProfileMetadata',
				description: 'Update profile metadata on-chain (requires auth)',
				action: 'Set profile metadata',
			},
		],
		default: 'createPublicationMetadata',
	},
];

export const metadataFields: INodeProperties[] = [
	// Create Publication Metadata fields
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createPublicationMetadata'],
			},
		},
		default: '',
		description: 'The text content of the publication',
	},
	{
		displayName: 'Publication Type',
		name: 'publicationType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createPublicationMetadata'],
			},
		},
		options: [
			{ name: 'Text Only', value: 'TEXT_ONLY' },
			{ name: 'Article', value: 'ARTICLE' },
			{ name: 'Image', value: 'IMAGE' },
			{ name: 'Video', value: 'VIDEO' },
			{ name: 'Audio', value: 'AUDIO' },
			{ name: 'Link', value: 'LINK' },
			{ name: 'Embed', value: 'EMBED' },
		],
		default: 'TEXT_ONLY',
		description: 'The type of publication content',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createPublicationMetadata'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title for the publication',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'web3, defi, lens',
				description: 'Comma-separated tags for the publication',
			},
			{
				displayName: 'App ID',
				name: 'appId',
				type: 'string',
				default: 'n8n-lens-node',
				description: 'Application identifier',
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: 'en',
				description: 'Content language locale (e.g., en, es, fr)',
			},
			{
				displayName: 'External URL',
				name: 'externalUrl',
				type: 'string',
				default: '',
				description: 'External link associated with the publication',
			},
			{
				displayName: 'Image URL',
				name: 'imageUrl',
				type: 'string',
				default: '',
				description: 'URL to the main image (for IMAGE type)',
			},
			{
				displayName: 'Video URL',
				name: 'videoUrl',
				type: 'string',
				default: '',
				description: 'URL to the video content (for VIDEO type)',
			},
			{
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				default: '',
				description: 'URL to the audio content (for AUDIO type)',
			},
		],
	},

	// Create Profile Metadata fields
	{
		displayName: 'Display Name',
		name: 'displayName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createProfileMetadata', 'setProfileMetadata'],
			},
		},
		default: '',
		description: 'Display name for the profile',
	},
	{
		displayName: 'Bio',
		name: 'bio',
		type: 'string',
		typeOptions: {
			rows: 3,
		},
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createProfileMetadata', 'setProfileMetadata'],
			},
		},
		default: '',
		description: 'Profile biography/description',
	},
	{
		displayName: 'Profile Fields',
		name: 'profileFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['createProfileMetadata', 'setProfileMetadata'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Profile Picture URL',
				name: 'picture',
				type: 'string',
				default: '',
				description: 'URL to profile picture',
			},
			{
				displayName: 'Cover Picture URL',
				name: 'coverPicture',
				type: 'string',
				default: '',
				description: 'URL to cover/banner image',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				description: 'Personal website URL',
			},
			{
				displayName: 'Twitter Handle',
				name: 'twitter',
				type: 'string',
				default: '',
				placeholder: '@username',
				description: 'Twitter/X handle',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				description: 'Geographic location',
			},
			{
				displayName: 'App ID',
				name: 'appId',
				type: 'string',
				default: 'n8n-lens-node',
				description: 'Application identifier',
			},
		],
	},

	// Validate Metadata fields
	{
		displayName: 'Metadata JSON',
		name: 'metadataJson',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['validatePublicationMetadata'],
			},
		},
		default: '{}',
		description: 'The metadata JSON to validate',
	},

	// Set Profile Metadata fields
	{
		displayName: 'Metadata URI',
		name: 'metadataUri',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['metadata'],
				operation: ['setProfileMetadata'],
			},
		},
		default: '',
		description: 'URI of the uploaded metadata (IPFS hash or URL). If not provided, metadata will be generated from fields.',
	},
];

export async function executeMetadataOperations(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: IDataObject;

	if (operation === 'createPublicationMetadata') {
		const content = this.getNodeParameter('content', index) as string;
		const publicationType = this.getNodeParameter('publicationType', index) as string;
		const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;

		// Generate Lens metadata v3 format
		const metadata: IDataObject = {
			$schema: 'https://json-schemas.lens.dev/publications/text-only/3.0.0.json',
			lens: {
				id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				content,
				locale: additionalFields.locale || 'en',
				mainContentFocus: publicationType,
				appId: additionalFields.appId || 'n8n-lens-node',
			},
		};

		// Add optional fields
		if (additionalFields.title) {
			(metadata.lens as IDataObject).title = additionalFields.title;
		}

		if (additionalFields.tags) {
			const tags = (additionalFields.tags as string)
				.split(',')
				.map((tag) => tag.trim())
				.filter((tag) => tag);
			if (tags.length > 0) {
				(metadata.lens as IDataObject).tags = tags;
			}
		}

		if (additionalFields.externalUrl) {
			(metadata.lens as IDataObject).externalUrl = additionalFields.externalUrl;
		}

		// Add media based on type
		if (publicationType === 'IMAGE' && additionalFields.imageUrl) {
			(metadata.lens as IDataObject).image = {
				item: additionalFields.imageUrl,
				type: 'image/jpeg', // Default, could be detected
			};
		}

		if (publicationType === 'VIDEO' && additionalFields.videoUrl) {
			(metadata.lens as IDataObject).video = {
				item: additionalFields.videoUrl,
				type: 'video/mp4',
			};
		}

		if (publicationType === 'AUDIO' && additionalFields.audioUrl) {
			(metadata.lens as IDataObject).audio = {
				item: additionalFields.audioUrl,
				type: 'audio/mpeg',
			};
		}

		responseData = {
			metadata,
			metadataJson: JSON.stringify(metadata, null, 2),
			instructions: 'Upload this metadata to IPFS or Arweave, then use the resulting URI to create a publication.',
		};
	} else if (operation === 'createProfileMetadata') {
		const displayName = this.getNodeParameter('displayName', index, '') as string;
		const bio = this.getNodeParameter('bio', index, '') as string;
		const profileFields = this.getNodeParameter('profileFields', index, {}) as IDataObject;

		// Generate profile metadata
		const metadata: IDataObject = {
			$schema: 'https://json-schemas.lens.dev/profile/2.0.0.json',
			lens: {
				id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				name: displayName,
				bio,
				appId: profileFields.appId || 'n8n-lens-node',
			},
		};

		// Add optional fields
		if (profileFields.picture) {
			(metadata.lens as IDataObject).picture = profileFields.picture;
		}

		if (profileFields.coverPicture) {
			(metadata.lens as IDataObject).coverPicture = profileFields.coverPicture;
		}

		const attributes: IDataObject[] = [];

		if (profileFields.website) {
			attributes.push({
				key: 'website',
				value: profileFields.website,
				type: 'String',
			});
		}

		if (profileFields.twitter) {
			attributes.push({
				key: 'twitter',
				value: profileFields.twitter,
				type: 'String',
			});
		}

		if (profileFields.location) {
			attributes.push({
				key: 'location',
				value: profileFields.location,
				type: 'String',
			});
		}

		if (attributes.length > 0) {
			(metadata.lens as IDataObject).attributes = attributes;
		}

		responseData = {
			metadata,
			metadataJson: JSON.stringify(metadata, null, 2),
			instructions: 'Upload this metadata to IPFS or Arweave, then use setProfileMetadata to update your profile.',
		};
	} else if (operation === 'validatePublicationMetadata') {
		const metadataJson = this.getNodeParameter('metadataJson', index) as string;

		let parsedMetadata: IDataObject;
		try {
			parsedMetadata = JSON.parse(metadataJson) as IDataObject;
		} catch {
			return [{
				json: {
					valid: false,
					reason: 'Invalid JSON format',
				},
			}];
		}

		// Try to validate via API if available
		try {
			const response = await lensApiRequest.call(this, VALIDATE_PUBLICATION_METADATA, {
				request: {
					metadatav3: parsedMetadata,
				},
			});

			responseData = (response.validatePublicationMetadata as IDataObject) || {
				valid: false,
				reason: 'Unknown validation error',
			};
		} catch {
			// Perform basic local validation
			const errors: string[] = [];

			if (!parsedMetadata.$schema) {
				errors.push('Missing $schema field');
			}

			if (!parsedMetadata.lens) {
				errors.push('Missing lens metadata object');
			} else {
				const lens = parsedMetadata.lens as IDataObject;
				if (!lens.content && !lens.image && !lens.video && !lens.audio) {
					errors.push('Must have content, image, video, or audio');
				}
				if (!lens.mainContentFocus) {
					errors.push('Missing mainContentFocus field');
				}
			}

			responseData = {
				valid: errors.length === 0,
				reason: errors.length > 0 ? errors.join('; ') : null,
				localValidation: true,
				note: 'API validation unavailable, performed local validation',
			};
		}
	} else if (operation === 'setProfileMetadata') {
		const metadataUri = this.getNodeParameter('metadataUri', index, '') as string;

		// If no URI provided, note that metadata needs to be uploaded first
		if (!metadataUri) {
			const displayName = this.getNodeParameter('displayName', index, '') as string;
			const bio = this.getNodeParameter('bio', index, '') as string;
			const profileFields = this.getNodeParameter('profileFields', index, {}) as IDataObject;

			// Generate metadata for reference
			const metadata: IDataObject = {
				$schema: 'https://json-schemas.lens.dev/profile/2.0.0.json',
				lens: {
					id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					name: displayName,
					bio,
					appId: profileFields.appId || 'n8n-lens-node',
				},
			};

			return [{
				json: {
					error: 'Metadata URI required',
					generatedMetadata: metadata,
					instructions: [
						'1. Upload the generated metadata to IPFS or Arweave',
						'2. Get the resulting URI (e.g., ipfs://Qm...)',
						'3. Provide the URI in the Metadata URI field',
						'4. Run this operation again',
					],
				},
			}];
		}

		const response = await lensApiRequest.call(this, UPLOAD_METADATA, {
			request: {
				metadataURI: metadataUri,
			},
		});

		const setMetadataResult = response.setProfileMetadata as IDataObject | undefined;
		if (setMetadataResult?.txHash) {
			responseData = {
				success: true,
				txHash: setMetadataResult.txHash,
				txId: setMetadataResult.txId,
			};
		} else {
			responseData = {
				success: false,
				error: (setMetadataResult?.reason as string) || 'Failed to set profile metadata',
			};
		}
	} else {
		throw new Error(`Unknown operation: ${operation}`);
	}

	return [{ json: responseData }];
}
