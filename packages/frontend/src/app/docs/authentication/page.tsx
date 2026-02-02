'use client';

import { CodeBlock } from '@/components/docs/CodeBlock';
import { Callout } from '@/components/docs/Callout';
import { ApiEndpoint } from '@/components/docs/ApiEndpoint';

export default function AuthenticationPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          For Developers
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          The truthseek API uses JWT (JSON Web Tokens) for authentication. This guide
          covers how to obtain tokens, authenticate requests, and manage sessions securely.
        </p>
      </div>

      {/* Auth flow diagram */}
      <div className="not-prose my-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-4">Authentication Flow</h3>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {[
            { step: '1', title: 'Login', desc: 'Send credentials' },
            { step: '2', title: 'Receive', desc: 'Get tokens' },
            { step: '3', title: 'Use', desc: 'Include in requests' },
            { step: '4', title: 'Refresh', desc: 'When token expires' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {item.step}
              </div>
              <div>
                <div className="font-medium text-gray-900">{item.title}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
              {i < 3 && (
                <svg className="w-6 h-6 text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <h2>Obtaining Tokens</h2>

      <h3>Password Authentication</h3>

      <ApiEndpoint method="POST" path="/auth/login" description="Authenticate with email and password.">
        <CodeBlock
          language="json"
          code={`{
  "email": "user@example.com",
  "password": "your_password"
}`}
        />
      </ApiEndpoint>

      <p>Successful response:</p>

      <CodeBlock
        language="json"
        filename="login_response.json"
        code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "token_type": "bearer",
  "expires_in": 3600
}`}
      />

      <h3>OAuth Authentication</h3>

      <p>truthseek supports OAuth 2.0 with the following providers:</p>

      <div className="not-prose flex gap-4 my-6">
        {[
          { name: 'Google', icon: '🔵' },
          { name: 'GitHub', icon: '⚫' },
          { name: 'Twitter/X', icon: '🐦' },
        ].map((provider) => (
          <div key={provider.name} className="px-4 py-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <span className="text-xl">{provider.icon}</span>
            <span className="font-medium text-gray-700">{provider.name}</span>
          </div>
        ))}
      </div>

      <ApiEndpoint method="GET" path="/auth/oauth/{provider}" description="Initiate OAuth flow. Redirects to provider's authorization page." />

      <h2>Using Access Tokens</h2>

      <p>Include the access token in the Authorization header:</p>

      <CodeBlock
        language="http"
        code={`GET /api/v1/claims HTTP/1.1
Host: api.truthseek.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`}
      />

      <div className="not-prose my-6 grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="font-semibold text-blue-900 mb-1">Access Token</div>
          <div className="text-sm text-blue-700">Expires after 1 hour</div>
          <div className="text-xs text-blue-600 mt-2">Used for API requests</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="font-semibold text-purple-900 mb-1">Refresh Token</div>
          <div className="text-sm text-purple-700">Expires after 30 days</div>
          <div className="text-xs text-purple-600 mt-2">Used to get new access tokens</div>
        </div>
      </div>

      <h2>Refreshing Tokens</h2>

      <p>When an access token expires, use the refresh token to get a new one:</p>

      <ApiEndpoint method="POST" path="/auth/refresh" description="Exchange refresh token for new access token.">
        <CodeBlock
          language="json"
          code={`{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}`}
        />
      </ApiEndpoint>

      <Callout type="info" title="Token Rotation">
        Each refresh invalidates the old refresh token and returns a new one.
        This limits the window of opportunity if a token is compromised.
      </Callout>

      <h2>Registration</h2>

      <ApiEndpoint method="POST" path="/auth/register" description="Create a new account.">
        <CodeBlock
          language="json"
          code={`{
  "email": "newuser@example.com",
  "password": "secure_password",
  "username": "newuser",
  "display_name": "New User"
}`}
        />
      </ApiEndpoint>

      <h3>Requirements</h3>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Password</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Minimum 8 characters</li>
            <li>• At least one uppercase letter</li>
            <li>• At least one lowercase letter</li>
            <li>• At least one number</li>
          </ul>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Username</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 3-30 characters</li>
            <li>• Alphanumeric and underscores only</li>
            <li>• Must be unique</li>
            <li>• Cannot be changed later</li>
          </ul>
        </div>
      </div>

      <h2>Security Best Practices</h2>

      <h3>Token Storage</h3>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Environment</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Recommended Storage</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700">Browser (SPA)</td>
              <td className="py-3 px-4 text-gray-600">HttpOnly cookies or memory only</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700">Mobile App</td>
              <td className="py-3 px-4 text-gray-600">Secure keychain/keystore</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-gray-700">Server-side</td>
              <td className="py-3 px-4 text-gray-600">Environment variables or secrets manager</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="warning" title="Security Warnings">
        <ul className="mt-2 space-y-1 text-sm">
          <li>• Never store tokens in localStorage (XSS vulnerable)</li>
          <li>• Never include tokens in URLs</li>
          <li>• Never log tokens in application logs</li>
          <li>• Never share tokens between users</li>
        </ul>
      </Callout>

      <h2>Error Responses</h2>

      <h3>401 Unauthorized</h3>

      <CodeBlock
        language="json"
        code={`{
  "detail": "Invalid or expired token"
}`}
      />

      <p>Common causes:</p>
      <ul>
        <li>Missing Authorization header</li>
        <li>Malformed token</li>
        <li>Expired access token</li>
        <li>Revoked token</li>
      </ul>

      <h3>403 Forbidden</h3>

      <CodeBlock
        language="json"
        code={`{
  "detail": "Insufficient permissions"
}`}
      />

      <p>
        The token is valid, but the user doesn&apos;t have permission for the
        requested action.
      </p>
    </div>
  );
}
