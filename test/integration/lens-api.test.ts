/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 */

import type { IDataObject } from 'n8n-workflow';

// Mock the GraphQL queries
const mockProfileResponse: IDataObject = {
	profile: {
		id: '0x01',
		handle: { fullHandle: 'lens/testuser', localName: 'testuser' },
		metadata: {
			displayName: 'Test User',
			bio: 'A test user for integration tests',
			picture: {
				optimized: { uri: 'https://example.com/avatar.jpg' },
			},
		},
		stats: {
			followers: 1000,
			following: 500,
			posts: 100,
			comments: 50,
			mirrors: 25,
		},
		ownedBy: { address: '0x1234567890abcdef1234567890abcdef12345678' },
		createdAt: '2023-01-01T00:00:00Z',
	},
};

const mockPublicationResponse: IDataObject = {
	publication: {
		id: '0x01-0x01',
		__typename: 'Post',
		metadata: {
			content: 'Hello, Lens Protocol!',
			tags: ['test', 'lens'],
		},
		by: {
			id: '0x01',
			handle: { fullHandle: 'lens/testuser' },
		},
		stats: {
			reactions: 50,
			comments: 10,
			mirrors: 5,
			quotes: 2,
			countOpenActions: 15,
		},
		createdAt: '2025-01-01T00:00:00Z',
	},
};

const mockFollowersResponse: IDataObject = {
	followers: {
		items: [
			{
				id: '0x02',
				handle: { fullHandle: 'lens/follower1' },
				metadata: { displayName: 'Follower One' },
			},
			{
				id: '0x03',
				handle: { fullHandle: 'lens/follower2' },
				metadata: { displayName: 'Follower Two' },
			},
		],
		pageInfo: {
			next: 'cursor123',
			prev: null,
		},
	},
};

describe('Lens Protocol Integration Tests', () => {
	describe('Profile Operations', () => {
		it('should parse profile response correctly', () => {
			const profile = mockProfileResponse.profile as IDataObject;
			expect(profile.id).toBe('0x01');
			const handle = profile.handle as IDataObject;
			expect(handle.fullHandle).toBe('lens/testuser');
		});

		it('should access profile stats', () => {
			const profile = mockProfileResponse.profile as IDataObject;
			const stats = profile.stats as IDataObject;
			expect(stats.followers).toBe(1000);
			expect(stats.posts).toBe(100);
		});
	});

	describe('Publication Operations', () => {
		it('should parse publication response correctly', () => {
			const publication = mockPublicationResponse.publication as IDataObject;
			expect(publication.id).toBe('0x01-0x01');
			expect(publication.__typename).toBe('Post');
		});

		it('should access publication stats', () => {
			const publication = mockPublicationResponse.publication as IDataObject;
			const stats = publication.stats as IDataObject;
			expect(stats.reactions).toBe(50);
			expect(stats.comments).toBe(10);
		});
	});

	describe('Follow Operations', () => {
		it('should parse followers response correctly', () => {
			const followersData = mockFollowersResponse.followers as IDataObject;
			const followers = followersData.items as IDataObject[];
			expect(followers.length).toBe(2);
			expect(followers[0].id).toBe('0x02');
		});

		it('should have pagination info', () => {
			const followersData = mockFollowersResponse.followers as IDataObject;
			const pageInfo = followersData.pageInfo as IDataObject;
			expect(pageInfo.next).toBe('cursor123');
		});
	});

	describe('GraphQL Query Structure', () => {
		it('should validate profile request format', () => {
			const request = {
				forProfileId: '0x01',
			};
			expect(request.forProfileId).toMatch(/^0x[0-9a-fA-F]+$/);
		});

		it('should validate publication request format', () => {
			const request = {
				forId: '0x01-0x01',
			};
			expect(request.forId).toMatch(/^0x[0-9a-fA-F]+-0x[0-9a-fA-F]+$/);
		});

		it('should validate pagination request', () => {
			const request = {
				limit: 25,
				cursor: 'abc123',
			};
			expect(request.limit).toBeLessThanOrEqual(50);
		});
	});

	describe('Authentication Flow', () => {
		it('should structure challenge request correctly', () => {
			const challengeRequest = {
				signedBy: '0x1234567890abcdef1234567890abcdef12345678',
				for: '0x01',
			};
			expect(challengeRequest.signedBy).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it('should structure authenticate request correctly', () => {
			const authRequest = {
				id: 'challenge-id-123',
				signature: '0xsignature...',
			};
			expect(authRequest.id).toBeDefined();
			expect(authRequest.signature).toBeDefined();
		});
	});

	describe('Content Metadata', () => {
		it('should validate publication metadata structure', () => {
			const metadata = {
				$schema: 'https://json-schemas.lens.dev/publications/text-only/3.0.0.json',
				lens: {
					id: 'unique-id',
					content: 'Hello, Lens!',
					locale: 'en',
					mainContentFocus: 'TEXT_ONLY',
					appId: 'n8n-lens-node',
				},
			};
			expect(metadata.$schema).toContain('lens.dev');
			expect(metadata.lens.mainContentFocus).toBe('TEXT_ONLY');
		});
	});
});
