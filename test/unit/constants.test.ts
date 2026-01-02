/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 */

import {
	LENS_API_MAINNET,
	LENS_API_TESTNET,
	LENS_CHAIN_ID,
	POLYGON_CHAIN_ID,
	DEFAULT_PAGE_SIZE,
	MAX_PAGE_SIZE,
	RESOURCES,
	PUBLICATION_TYPES,
	REACTION_TYPES,
	NOTIFICATION_TYPES,
	CONTENT_FOCUS,
	ERROR_MESSAGES,
} from '../../nodes/Lens/constants';

describe('Lens Constants', () => {
	describe('API Endpoints', () => {
		it('should have correct mainnet URL', () => {
			expect(LENS_API_MAINNET).toBe('https://api.lens.xyz/graphql');
		});

		it('should have correct testnet URL', () => {
			expect(LENS_API_TESTNET).toBe('https://api-v2-amoy.lens.dev/graphql');
		});
	});

	describe('Chain IDs', () => {
		it('should have correct Lens Chain ID', () => {
			expect(LENS_CHAIN_ID).toBe(37111);
		});

		it('should have correct Polygon chain ID', () => {
			expect(POLYGON_CHAIN_ID).toBe(137);
		});
	});

	describe('Pagination', () => {
		it('should have reasonable pagination defaults', () => {
			expect(DEFAULT_PAGE_SIZE).toBe(25);
			expect(MAX_PAGE_SIZE).toBe(50);
		});
	});

	describe('Resource Names', () => {
		it('should include all expected resources', () => {
			expect(RESOURCES.PROFILES).toBe('profiles');
			expect(RESOURCES.PUBLICATIONS).toBe('publications');
			expect(RESOURCES.FOLLOWS).toBe('follows');
			expect(RESOURCES.REACTIONS).toBe('reactions');
			expect(RESOURCES.COLLECTS).toBe('collects');
			expect(RESOURCES.FEEDS).toBe('feeds');
			expect(RESOURCES.GROUPS).toBe('groups');
			expect(RESOURCES.AUTHENTICATION).toBe('authentication');
			expect(RESOURCES.NOTIFICATIONS).toBe('notifications');
			expect(RESOURCES.MODULES).toBe('modules');
			expect(RESOURCES.SEARCH).toBe('search');
			expect(RESOURCES.METADATA).toBe('metadata');
			expect(RESOURCES.REVENUE).toBe('revenue');
			expect(RESOURCES.UTILITY).toBe('utility');
		});
	});

	describe('Publication Types', () => {
		it('should include all publication types', () => {
			expect(PUBLICATION_TYPES.POST).toBe('POST');
			expect(PUBLICATION_TYPES.COMMENT).toBe('COMMENT');
			expect(PUBLICATION_TYPES.MIRROR).toBe('MIRROR');
			expect(PUBLICATION_TYPES.QUOTE).toBe('QUOTE');
		});
	});

	describe('Reaction Types', () => {
		it('should include reaction types', () => {
			expect(REACTION_TYPES.UPVOTE).toBe('UPVOTE');
			expect(REACTION_TYPES.DOWNVOTE).toBe('DOWNVOTE');
		});
	});

	describe('Notification Types', () => {
		it('should include notification types', () => {
			expect(NOTIFICATION_TYPES.MENTIONED).toBe('MENTIONED');
			expect(NOTIFICATION_TYPES.FOLLOWED).toBe('FOLLOWED');
			expect(NOTIFICATION_TYPES.REACTED).toBe('REACTED');
			expect(NOTIFICATION_TYPES.COMMENTED).toBe('COMMENTED');
		});
	});

	describe('Content Focus', () => {
		it('should include content focus types', () => {
			expect(CONTENT_FOCUS.TEXT_ONLY).toBe('TEXT_ONLY');
			expect(CONTENT_FOCUS.IMAGE).toBe('IMAGE');
			expect(CONTENT_FOCUS.VIDEO).toBe('VIDEO');
			expect(CONTENT_FOCUS.AUDIO).toBe('AUDIO');
		});
	});

	describe('Error Messages', () => {
		it('should have required error messages', () => {
			expect(ERROR_MESSAGES.AUTHENTICATION_REQUIRED).toBeDefined();
			expect(ERROR_MESSAGES.PROFILE_NOT_FOUND).toBeDefined();
			expect(ERROR_MESSAGES.PUBLICATION_NOT_FOUND).toBeDefined();
			expect(ERROR_MESSAGES.INVALID_PROFILE_ID).toBeDefined();
		});
	});
});
