'use strict';

const LINEAR_URL = 'https://api.linear.app/graphql';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class LinearSetupError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LinearSetupError';
    this.code = code;
  }
}

function getApiKey() {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new LinearSetupError('LINEAR_API_KEY_MISSING', 'Missing LINEAR_API_KEY. Configure it in .env before calling /linear/sync.');
  }
  return apiKey.trim();
}

async function graphqlRequest(query, variables = {}) {
  const apiKey = getApiKey();
  const response = await fetch(LINEAR_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Linear request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  if (payload.errors && payload.errors.length > 0) {
    const message = payload.errors.map((entry) => entry.message).join(' | ');
    throw new Error(`Linear GraphQL error: ${message}`);
  }

  return payload.data || {};
}

async function getTeamId(teamKeyOrId) {
  if (!teamKeyOrId || !String(teamKeyOrId).trim()) {
    throw new LinearSetupError('LINEAR_TEAM_NOT_CONFIGURED', 'Missing LINEAR_TEAM_KEY (or LINEAR_TEAM_ID) configuration for /linear/sync.');
  }

  const value = String(teamKeyOrId).trim();
  if (UUID_RE.test(value)) {
    return value;
  }

  const query = `
    query TeamByKey($key: String!) {
      teams(filter: { key: { eq: $key } }, first: 1) {
        nodes {
          id
          key
          name
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { key: value.toUpperCase() });
  const team = data.teams?.nodes?.[0];
  if (!team) {
    throw new LinearSetupError('LINEAR_TEAM_NOT_FOUND', `Linear team key not found: ${value}`);
  }

  return team.id;
}

async function getUserId(userKeyOrEmailOrId) {
  if (!userKeyOrEmailOrId) return null;
  const value = String(userKeyOrEmailOrId).trim();
  if (!value) return null;

  if (UUID_RE.test(value)) {
    return value;
  }

  const byEmailQuery = `
    query UserByEmail($email: String!) {
      users(filter: { email: { eq: $email } }, first: 1) {
        nodes {
          id
          email
          name
        }
      }
    }
  `;

  const byNameQuery = `
    query UserByName($name: String!) {
      users(filter: { name: { eq: $name } }, first: 1) {
        nodes {
          id
          email
          name
        }
      }
    }
  `;

  let data;
  if (value.includes('@')) {
    data = await graphqlRequest(byEmailQuery, { email: value });
  } else {
    data = await graphqlRequest(byNameQuery, { name: value });
  }

  const user = data.users?.nodes?.[0];
  if (!user) {
    throw new LinearSetupError('LINEAR_ASSIGNEE_NOT_FOUND', `Linear user not found: ${value}`);
  }

  return user.id;
}

async function createIssue(input) {
  const mutation = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const data = await graphqlRequest(mutation, { input });
  const issueCreate = data.issueCreate;
  if (!issueCreate?.success || !issueCreate.issue) {
    throw new Error('Linear issue creation failed without a concrete error payload.');
  }

  return issueCreate.issue;
}

module.exports = {
  LinearSetupError,
  getTeamId,
  getUserId,
  createIssue,
};
