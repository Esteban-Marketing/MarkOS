'use strict';

const impl = require('./url-validator.cjs');

export const validateWebhookUrl = impl.validateWebhookUrl;
export const resolvePinnedAgent = impl.resolvePinnedAgent;
export const resolvePinnedHttpAgent = impl.resolvePinnedHttpAgent;
export const DEFAULT_MAX_REDIRECTS = impl.DEFAULT_MAX_REDIRECTS;
export const BLOCKED_V4 = impl.BLOCKED_V4;
export const BLOCKED_V6 = impl.BLOCKED_V6;
export const DENIED_PROTOCOLS = impl.DENIED_PROTOCOLS;

export default impl;
