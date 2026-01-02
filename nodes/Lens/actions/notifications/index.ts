/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { IExecuteFunctions, IDataObject, INodeProperties } from 'n8n-workflow';
import { lensApiRequest } from '../../transport/client';
import {
	GET_NOTIFICATIONS,
	MARK_NOTIFICATIONS_READ,
} from '../../constants/queries';
import { getNotificationTypeOptions, simplifyNotification } from '../../utils/helpers';

export const notificationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['notifications'],
			},
		},
		options: [
			{
				name: 'Get Notifications',
				value: 'getNotifications',
				description: 'Get user alerts',
				action: 'Get notifications',
			},
			{
				name: 'Get Mention Notifications',
				value: 'getMentionNotifications',
				description: 'Get mentions',
				action: 'Get mention notifications',
			},
			{
				name: 'Get Follow Notifications',
				value: 'getFollowNotifications',
				description: 'Get new followers',
				action: 'Get follow notifications',
			},
			{
				name: 'Get Reaction Notifications',
				value: 'getReactionNotifications',
				description: 'Get likes',
				action: 'Get reaction notifications',
			},
			{
				name: 'Mark as Read',
				value: 'markAsRead',
				description: 'Clear notifications',
				action: 'Mark as read',
			},
		],
		default: 'getNotifications',
	},
];

export const notificationFields: INodeProperties[] = [
	// Notification Type filter
	{
		displayName: 'Notification Types',
		name: 'notificationTypes',
		type: 'multiOptions',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications'],
			},
		},
		options: getNotificationTypeOptions(),
		default: ['ALL'],
		description: 'Types of notifications to fetch',
	},
	// High Signal Only
	{
		displayName: 'High Signal Only',
		name: 'highSignalOnly',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['notifications'],
				operation: ['getNotifications', 'getMentionNotifications', 'getFollowNotifications', 'getReactionNotifications'],
			},
		},
		default: false,
		description: 'Whether to only show high-signal notifications (from profiles you follow)',
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
				resource: ['notifications'],
				operation: ['getNotifications', 'getMentionNotifications', 'getFollowNotifications', 'getReactionNotifications'],
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
				resource: ['notifications'],
			},
		},
		default: true,
		description: 'Whether to return a simplified version of the response',
	},
];

export async function executeNotificationOperations(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	let responseData: IDataObject | IDataObject[] = {};
	const simplifyOutput = this.getNodeParameter('simplifyOutput', i, true) as boolean;

	switch (operation) {
		case 'getNotifications': {
			const notificationTypes = this.getNodeParameter('notificationTypes', i) as string[];
			const highSignalOnly = this.getNodeParameter('highSignalOnly', i, false) as boolean;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const where: IDataObject = {};
			if (!notificationTypes.includes('ALL') && notificationTypes.length > 0) {
				where.notificationTypes = notificationTypes;
			}
			if (highSignalOnly) {
				where.highSignalFilter = true;
			}

			const variables = {
				request: {
					...(Object.keys(where).length > 0 && { where }),
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_NOTIFICATIONS, variables, true);
			const notifications = response.notifications as IDataObject;
			const items = (notifications?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyNotification);
			} else {
				responseData = items;
			}
			break;
		}

		case 'getMentionNotifications': {
			const highSignalOnly = this.getNodeParameter('highSignalOnly', i, false) as boolean;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const where: IDataObject = {
				notificationTypes: ['MENTIONED'],
			};
			if (highSignalOnly) {
				where.highSignalFilter = true;
			}

			const variables = {
				request: {
					where,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_NOTIFICATIONS, variables, true);
			const notifications = response.notifications as IDataObject;
			const items = (notifications?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyNotification);
			} else {
				responseData = items;
			}
			break;
		}

		case 'getFollowNotifications': {
			const highSignalOnly = this.getNodeParameter('highSignalOnly', i, false) as boolean;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const where: IDataObject = {
				notificationTypes: ['FOLLOWED'],
			};
			if (highSignalOnly) {
				where.highSignalFilter = true;
			}

			const variables = {
				request: {
					where,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_NOTIFICATIONS, variables, true);
			const notifications = response.notifications as IDataObject;
			const items = (notifications?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyNotification);
			} else {
				responseData = items;
			}
			break;
		}

		case 'getReactionNotifications': {
			const highSignalOnly = this.getNodeParameter('highSignalOnly', i, false) as boolean;
			const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;
			const limit = additionalOptions.limit as number || 25;
			const cursor = additionalOptions.cursor as string;

			const where: IDataObject = {
				notificationTypes: ['REACTED'],
			};
			if (highSignalOnly) {
				where.highSignalFilter = true;
			}

			const variables = {
				request: {
					where,
					limit,
					...(cursor && { cursor }),
				},
			};
			const response = await lensApiRequest.call(this, GET_NOTIFICATIONS, variables, true);
			const notifications = response.notifications as IDataObject;
			const items = (notifications?.items as IDataObject[]) || [];

			if (simplifyOutput) {
				responseData = items.map(simplifyNotification);
			} else {
				responseData = items;
			}
			break;
		}

		case 'markAsRead': {
			await lensApiRequest.call(this, MARK_NOTIFICATIONS_READ, {}, true);
			responseData = {
				success: true,
				message: 'All notifications marked as read',
			};
			break;
		}
	}

	return responseData;
}
