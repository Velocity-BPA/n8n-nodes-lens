/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 */

import {
	simplifyProfile,
	simplifyPublication,
	simplifyNotification,
	formatTimestamp,
	parseProfileId,
	parsePublicationId,
	isValidHexId,
	isValidPublicationId,
} from '../../nodes/Lens/utils/helpers';

describe('Lens Helpers', () => {
	describe('simplifyProfile', () => {
		it('should simplify a profile object', () => {
			const profile = {
				id: '0x01',
				handle: { fullHandle: 'lens/testuser' },
				metadata: {
					displayName: 'Test User',
					bio: 'Test bio',
					picture: { optimized: { uri: 'https://example.com/pic.jpg' } },
				},
				stats: {
					followers: 100,
					following: 50,
					posts: 25,
				},
				ownedBy: { address: '0xabc123' },
			};

			const result = simplifyProfile(profile);

			expect(result.id).toBe('0x01');
			expect(result.handle).toBe('lens/testuser');
			expect(result.displayName).toBe('Test User');
			expect(result.bio).toBe('Test bio');
			expect(result.followers).toBe(100);
			expect(result.following).toBe(50);
			expect(result.posts).toBe(25);
		});

		it('should handle missing fields gracefully', () => {
			const profile = {
				id: '0x02',
			};

			const result = simplifyProfile(profile);

			expect(result.id).toBe('0x02');
			expect(result.handle).toBeNull();
		});

		it('should return empty object for null input', () => {
			const result = simplifyProfile(null as any);
			expect(result).toEqual({});
		});
	});

	describe('simplifyPublication', () => {
		it('should simplify a publication object', () => {
			const publication = {
				id: '0x01-0x01',
				metadata: {
					content: 'Hello world',
				},
				by: {
					id: '0x01',
					handle: { fullHandle: 'lens/author' },
				},
				stats: {
					reactions: 10,
					comments: 5,
					mirrors: 2,
					quotes: 1,
				},
				createdAt: '2025-01-01T00:00:00Z',
			};

			const result = simplifyPublication(publication);

			expect(result.id).toBe('0x01-0x01');
			expect(result.type).toBe('POST');
			expect(result.content).toBe('Hello world');
			expect(result.reactions).toBe(10);
			expect(result.comments).toBe(5);
		});

		it('should detect comment type', () => {
			const publication = {
				id: '0x01-0x02',
				commentOn: { id: '0x01-0x01' },
				metadata: { content: 'A comment' },
			};

			const result = simplifyPublication(publication);
			expect(result.type).toBe('COMMENT');
		});
	});

	describe('simplifyNotification', () => {
		it('should simplify a notification object', () => {
			const notification = {
				id: 'notif-123',
				publication: { id: '0x01-0x01' },
				createdAt: '2025-01-01T00:00:00Z',
			};

			const result = simplifyNotification(notification);

			expect(result.id).toBe('notif-123');
			expect(result.type).toBe('MENTION');
		});

		it('should detect follow notification', () => {
			const notification = {
				id: 'notif-456',
				followers: [{ id: '0x01' }],
			};

			const result = simplifyNotification(notification);
			expect(result.type).toBe('FOLLOW');
		});
	});

	describe('formatTimestamp', () => {
		it('should format a timestamp string', () => {
			const result = formatTimestamp('2025-01-01T00:00:00.000Z');
			expect(result).toBe('2025-01-01T00:00:00.000Z');
		});

		it('should return current time for undefined input', () => {
			const result = formatTimestamp(undefined);
			// Should be a valid ISO string
			expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
		});

		it('should format Date object', () => {
			const date = new Date('2025-06-15T12:00:00Z');
			const result = formatTimestamp(date);
			expect(result).toBe('2025-06-15T12:00:00.000Z');
		});
	});

	describe('parseProfileId', () => {
		it('should parse a hex profile ID', () => {
			expect(parseProfileId('0x01')).toBe('0x01');
		});

		it('should return non-hex input as-is', () => {
			expect(parseProfileId('123')).toBe('123');
		});

		it('should strip lens/ prefix', () => {
			expect(parseProfileId('lens/testuser')).toBe('testuser');
		});
	});

	describe('parsePublicationId', () => {
		it('should parse a publication ID', () => {
			const result = parsePublicationId('0x01-0x01');
			expect(result).toBe('0x01-0x01');
		});

		it('should trim whitespace', () => {
			const result = parsePublicationId('  0x01-0x01  ');
			expect(result).toBe('0x01-0x01');
		});
	});

	describe('isValidHexId', () => {
		it('should validate hex IDs', () => {
			expect(isValidHexId('0x01')).toBe(true);
			expect(isValidHexId('0xABCDEF')).toBe(true);
			expect(isValidHexId('invalid')).toBe(false);
			expect(isValidHexId('')).toBe(false);
		});
	});

	describe('isValidPublicationId', () => {
		it('should validate publication IDs', () => {
			expect(isValidPublicationId('0x01-0x01')).toBe(true);
			expect(isValidPublicationId('0xAB-0xCD')).toBe(true);
			expect(isValidPublicationId('invalid')).toBe(false);
			expect(isValidPublicationId('0x01')).toBe(false);
		});
	});
});
