/**
 * n8n-nodes-lens
 * Copyright (c) 2025 Velocity BPA
 * Licensed under the Business Source License 1.1 (BSL 1.1)
 */

const { src, dest } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.svg')
		.pipe(dest('dist/nodes/'));
}

exports['build:icons'] = buildIcons;
