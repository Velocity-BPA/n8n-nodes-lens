/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest, buildPublicationRequest } from '../../transport/client';
import {
	GET_PUBLICATION,
	GET_PUBLICATIONS,
	CREATE_POST,
	CREATE_COMMENT,
	CREATE_MIRROR,
	CREATE_QUOTE,
	HIDE_PUBLICATION,
} from '../../constants/queries';
import { simplifyPublication, getContentFocusOptions } from '../../utils/helpers';

export const publicationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['publications'],
			},
		},
		options: [
			{
				name: 'Get Publication',
				value: 'getPublication',
				description: 'Get single post/comment/mirror',
				action: 'Get publication',
			},
			{
				name: 'Get Publications',
				value: 'getPublications',
				description: 'Get multiple publications',
				action: 'Get publications',
			},
			{
				name: 'Create Post',
				value: 'createPost',
				description: 'Create new publication (requires auth)',
				action: 'Create post',
			},
			{
				name: 'Create Comment',
				value: 'createComment',
				description: 'Reply to publication (requires auth)',
				action: 'Create comment',
			},
			{
				name: 'Create Mirror',
				value: 'createMirror',
				description: 'Repost/share publication (requires auth)',
				action: 'Create mirror',
			},
			{
				name: 'Create Quote',
				value: 'createQuote',
				description: 'Quote publication (requires auth)',
				action: 'Create quote',
			},
			{
				name: 'Delete Publication',
				value: 'deletePublication',
				description: 'Remove publication (requires auth)',
				action: 'Delete publication',
			},
			{
				name: 'Hide Publication',
				value: 'hidePublication',
				description: 'Hide from feed (requires auth)',
				action: 'Hide publication',
			},
		],
		default: 'getPublication',
	},
];

export const publicationFields: INodeProperties[] = [
	// Publication ID field
	{
		displayName: 'Publication ID',
		name: 'publicationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['publications'],
				operation: ['getPublication', 'createComment', 'createMirror', 'createQuote', 'deletePublication', 'hidePublication'],
			},
		},
		default: '',
		placeholder: '0x01-0x01',
		description: 'The publication ID (profileId-pubId format)',
	},
	// Profile ID for fetching publications
	{
		displayName: 'Profile ID',
		name: 'profileId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['publications'],
				operation: ['getPublications', 'createPost', 'createComment', 'createMirror', 'createQuote'],
			},
		},
		default: '',
		placeholder: '0x01',
		description: 'The profile ID to fetch publications for or create with',
	},
	// Content field for creating publications
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
				resource: ['publications'],
				operation: ['createPost', 'createComment', 'createQuote'],
			},
		},
		default: '',
		description: 'The content of the publication',
	},
	// Content Focus Type
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['publications'],
				operation: ['createPost', 'createComment', 'createQuote'],
			},
		},
		options: getContentFocusOptions(),
		default: 'TEXT_ONLY',
		description: 'The type of content being published',
	},
	// Publication Types filter
	{
		displayName: 'Publication Types',
		name: 'publicationTypes',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['publications'],
				operation: ['getPublications'],
			},
		},
		options: [
			{ name: 'Post', value: 'POST' },
			{ name: 'Comment', value: 'COMMENT' },
			{ name: 'Mirror', value: 'MIRROR' },
			{ name: 'Quote', value: 'QUOTE' },
		],
		default: ['POST'],
		description: 'Types of publications to fetch',
	},
	// Additional Options for publications
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['publications'],
				operation: ['getPublications', 'createPost', 'createComment', 'createQuote'],
			},
		},
		options: [
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title for the publication (optional)',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				description: 'Comma-separated list of tags',
			},
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
				resource: ['publications'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executePublicationOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getPublication': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const variables = { request: buildPublicationRequest(publicationId) };
			const response = await lensApiRequest.call(this, GET_PUBLICATION, variables);
			responseData = response.publication as IDataObject;
			break;
		}

		case 'getPublications': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const publicationTypes = this.getNodeParameter('publicationTypes', i) as string[];
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const variables = {
				request: {
					where: {
						from: [profileId],
						publicationTypes,
					},
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_PUBLICATIONS, variables);
			const publications = response.publications as IDataObject;
			responseData = (publications?.items as IDataObject[]) || [];
			break;
		}

		case 'createPost': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const content = this.getNodeParameter('content', i) as string;
			const contentType = this.getNodeParameter('contentType', i) as string;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

			const tags = additionalOptions.tags
				? (additionalOptions.tags as string).split(',').map(t => t.trim())
				: [];

			const variables = {
				request: {
					profileId,
					contentURI: `data:application/json,${encodeURIComponent(JSON.stringify({
						$schema: 'https://json-schemas.lens.dev/publications/text-only/3.0.0.json',
						lens: {
							id: crypto.randomUUID(),
							content,
							locale: 'en',
							mainContentFocus: contentType,
							...(additionalOptions.title && { title: additionalOptions.title }),
							...(tags.length > 0 && { tags }),
						},
					}))}`,
				},
			};
			const response = await lensApiRequest.call(this, CREATE_POST, variables, true);
			responseData = response.createOnchainPostTypedData as IDataObject;
			break;
		}

		case 'createComment': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const content = this.getNodeParameter('content', i) as string;
			const contentType = this.getNodeParameter('contentType', i) as string;
			// Additional options reserved for future use
			void this.getNodeParameter('additionalOptions', i, {});

			const [pointedProfileId, pointedPubId] = publicationId.split('-');

			const variables = {
				request: {
					profileId,
					pointedProfileId,
					pointedPubId,
					contentURI: `data:application/json,${encodeURIComponent(JSON.stringify({
						$schema: 'https://json-schemas.lens.dev/publications/text-only/3.0.0.json',
						lens: {
							id: crypto.randomUUID(),
							content,
							locale: 'en',
							mainContentFocus: contentType,
						},
					}))}`,
				},
			};
			const response = await lensApiRequest.call(this, CREATE_COMMENT, variables, true);
			responseData = response.createOnchainCommentTypedData as IDataObject;
			break;
		}

		case 'createMirror': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const publicationId = this.getNodeParameter('publicationId', i) as string;

			const [pointedProfileId, pointedPubId] = publicationId.split('-');

			const variables = {
				request: {
					profileId,
					pointedProfileId,
					pointedPubId,
				},
			};
			const response = await lensApiRequest.call(this, CREATE_MIRROR, variables, true);
			responseData = response.createOnchainMirrorTypedData as IDataObject;
			break;
		}

		case 'createQuote': {
			const profileId = this.getNodeParameter('profileId', i) as string;
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const content = this.getNodeParameter('content', i) as string;
			const contentType = this.getNodeParameter('contentType', i) as string;
			// Additional options reserved for future use
			void this.getNodeParameter('additionalOptions', i, {});

			const [pointedProfileId, pointedPubId] = publicationId.split('-');

			const variables = {
				request: {
					profileId,
					pointedProfileId,
					pointedPubId,
					contentURI: `data:application/json,${encodeURIComponent(JSON.stringify({
						$schema: 'https://json-schemas.lens.dev/publications/text-only/3.0.0.json',
						lens: {
							id: crypto.randomUUID(),
							content,
							locale: 'en',
							mainContentFocus: contentType,
						},
					}))}`,
				},
			};
			const response = await lensApiRequest.call(this, CREATE_QUOTE, variables, true);
			responseData = response.createOnchainQuoteTypedData as IDataObject;
			break;
		}

		case 'deletePublication':
		case 'hidePublication': {
			const publicationId = this.getNodeParameter('publicationId', i) as string;
			const variables = {
				request: {
					for: publicationId,
				},
			};
			const response = await lensApiRequest.call(this, HIDE_PUBLICATION, variables, true);
			responseData = { success: response.hidePublication === null };
			break;
		}
	}

	// Simplify output if requested
	if (simplifyOutput && responseData && !Array.isArray(responseData) && !responseData.success && !responseData.typedData) {
		responseData = simplifyPublication(responseData);
	} else if (simplifyOutput && Array.isArray(responseData)) {
		responseData = responseData.map(simplifyPublication);
	}

	if (Array.isArray(responseData)) { return responseData.map((data) => ({ json: data })); } return [{ json: responseData }];
}
