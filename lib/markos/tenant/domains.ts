// Phase 201 D-12 / D-13 / Phase 201.1 D-107: TypeScript dual-export. SOURCE OF TRUTH is domains.cjs.
const dCjs = require('./domains.cjs');
export const addCustomDomain = dCjs.addCustomDomain;
export const removeCustomDomain = dCjs.removeCustomDomain;
export const pollDomainStatus = dCjs.pollDomainStatus;
export const listDomainsForOrg = dCjs.listDomainsForOrg;
export const normaliseDomain = dCjs.normaliseDomain;
