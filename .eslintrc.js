/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 */

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
		project: './tsconfig.json',
	},
	plugins: ['@typescript-eslint', 'n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/community',
		'prettier',
	],
	env: {
		node: true,
		es2021: true,
	},
	ignorePatterns: [
		'dist/**',
		'node_modules/**',
		'*.js',
		'gulpfile.js',
	],
	rules: {
		// TypeScript rules
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error',
			{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
		],
		'@typescript-eslint/no-non-null-assertion': 'warn',

		// n8n-specific rules
		'n8n-nodes-base/node-param-description-boolean-without-whether': 'off',
		'n8n-nodes-base/node-param-placeholder-miscased-id': 'off',
		'n8n-nodes-base/node-param-description-missing-final-period': 'off',

		// General rules
		'no-console': ['warn', { allow: ['warn', 'error'] }],
		'prefer-const': 'error',
		'no-var': 'error',
		'eqeqeq': ['error', 'always'],
	},
	overrides: [
		{
			files: ['**/*.test.ts', '**/test/**/*.ts'],
			env: {
				jest: true,
			},
			rules: {
				'@typescript-eslint/no-explicit-any': 'off',
			},
		},
	],
};
