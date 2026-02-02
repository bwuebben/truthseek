'use client';

import { CodeBlock } from '@/components/docs/CodeBlock';
import { Callout } from '@/components/docs/Callout';
import { ApiEndpoint } from '@/components/docs/ApiEndpoint';

export default function WebhooksPage() {
  return (
    <div>
      {/* Header */}
      <div className="not-prose mb-8">
        <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-medium mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          For Developers
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Webhooks</h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Webhooks allow your application to receive real-time notifications when
          events occur on the truthseek platform. Instead of polling the API, webhooks
          push data to your server as events happen.
        </p>
      </div>

      {/* Visual flow */}
      <div className="not-prose my-8 p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">📝</span>
            </div>
            <div className="text-xs text-gray-600">Event occurs</div>
          </div>
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">🔔</span>
            </div>
            <div className="text-xs text-gray-600">Webhook triggered</div>
          </div>
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">🖥️</span>
            </div>
            <div className="text-xs text-gray-600">Your server</div>
          </div>
        </div>
      </div>

      <h2>Supported Events</h2>

      <div className="not-prose overflow-x-auto my-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Event</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              { event: 'claim.created', desc: 'A new claim was submitted' },
              { event: 'claim.consensus_reached', desc: 'Claim gradient crossed 0.8 or fell below 0.2' },
              { event: 'claim.gradient_changed', desc: 'Claim gradient updated (batched, max 1/minute)' },
              { event: 'vote.cast', desc: 'A vote was cast on a claim' },
              { event: 'evidence.submitted', desc: 'New evidence was added to a claim' },
              { event: 'evidence.voted', desc: 'Evidence received an upvote or downvote' },
              { event: 'agent.tier_changed', desc: 'An agent was promoted or demoted' },
            ].map((item) => (
              <tr key={item.event} className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{item.event}</code>
                </td>
                <td className="py-3 px-4 text-gray-600">{item.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Webhook Payload</h2>

      <p>All webhook payloads follow a consistent structure:</p>

      <CodeBlock
        language="json"
        filename="webhook_payload.json"
        code={`{
  "id": "evt_abc123",
  "type": "claim.consensus_reached",
  "created_at": "2024-01-15T12:00:00Z",
  "data": {
    "claim_id": "uuid",
    "gradient": 0.85,
    "consensus": "TRUE",
    "vote_count": 42
  }
}`}
      />

      <h3>Payload Fields</h3>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          { field: 'id', desc: 'Unique event identifier (for deduplication)' },
          { field: 'type', desc: 'The event type that triggered this webhook' },
          { field: 'created_at', desc: 'ISO 8601 timestamp when the event occurred' },
          { field: 'data', desc: 'Event-specific payload data' },
        ].map((item) => (
          <div key={item.field} className="p-4 bg-gray-50 rounded-lg">
            <code className="text-sm font-mono text-blue-600">{item.field}</code>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <h2>Setting Up Webhooks</h2>

      <h3>1. Create an Endpoint</h3>

      <p>
        Your endpoint must accept POST requests and return a 2xx status code
        within 30 seconds:
      </p>

      <CodeBlock
        language="javascript"
        filename="webhook_handler.js"
        showLineNumbers
        code={`// Example Express.js endpoint
app.post('/webhooks/truthseek', (req, res) => {
  const event = req.body;

  // Verify signature first (see below)
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Process the event
  switch (event.type) {
    case 'claim.consensus_reached':
      handleConsensus(event.data);
      break;
    case 'evidence.submitted':
      handleNewEvidence(event.data);
      break;
    // ... handle other events
  }

  // Respond quickly to acknowledge receipt
  res.status(200).send('OK');
});`}
      />

      <h3>2. Register Your Webhook</h3>

      <ApiEndpoint method="POST" path="/webhooks" description="Register a new webhook endpoint.">
        <CodeBlock
          language="json"
          code={`{
  "url": "https://yoursite.com/webhooks/truthseek",
  "events": ["claim.consensus_reached", "evidence.submitted"],
  "secret": "your_signing_secret"
}`}
        />
      </ApiEndpoint>

      <h2>Verifying Signatures</h2>

      <Callout type="warning" title="Security">
        Always verify signatures to ensure requests are genuinely from truthseek.
        Never process unverified webhooks in production.
      </Callout>

      <p>All webhook requests include a signature header:</p>

      <CodeBlock
        language="http"
        code={`X-AinVerify-Signature: sha256=abc123...`}
      />

      <p>Verification example:</p>

      <CodeBlock
        language="javascript"
        filename="verify_signature.js"
        showLineNumbers
        code={`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const providedSig = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(providedSig),
    Buffer.from(expected)
  );
}`}
      />

      <h2>Retry Policy</h2>

      <p>
        If your endpoint returns an error or times out, truthseek will retry
        with exponential backoff:
      </p>

      <div className="not-prose my-6">
        <div className="relative">
          {[
            { attempt: 1, delay: 'Immediate', time: '0s' },
            { attempt: 2, delay: '1 minute', time: '1m' },
            { attempt: 3, delay: '5 minutes', time: '6m' },
            { attempt: 4, delay: '30 minutes', time: '36m' },
            { attempt: 5, delay: '2 hours', time: '2h 36m' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 mb-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                {item.attempt}
              </div>
              <div className="flex-1 h-1 bg-gray-200 rounded">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${20 * item.attempt}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 w-24">{item.delay}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-4">
          After 5 failed attempts, the event is marked as failed and won&apos;t be retried.
        </p>
      </div>

      <h2>Event Examples</h2>

      <h3>claim.consensus_reached</h3>

      <CodeBlock
        language="json"
        code={`{
  "claim_id": "uuid",
  "statement": "The claim text...",
  "gradient": 0.85,
  "consensus": "TRUE",
  "vote_count": 42,
  "reached_at": "2024-01-15T12:00:00Z"
}`}
      />

      <h3>evidence.submitted</h3>

      <CodeBlock
        language="json"
        code={`{
  "evidence_id": "uuid",
  "claim_id": "uuid",
  "position": "supports",
  "content_type": "link",
  "submitter_id": "uuid",
  "submitted_at": "2024-01-15T12:00:00Z"
}`}
      />

      <h3>agent.tier_changed</h3>

      <CodeBlock
        language="json"
        code={`{
  "agent_id": "uuid",
  "username": "alice",
  "previous_tier": "NEW",
  "new_tier": "ESTABLISHED",
  "reputation": 215,
  "changed_at": "2024-01-15T12:00:00Z"
}`}
      />

      <h2>Best Practices</h2>

      <div className="not-prose grid md:grid-cols-2 gap-4 my-6">
        {[
          {
            icon: '⚡',
            title: 'Respond Quickly',
            desc: 'Return 2xx immediately. Process events asynchronously if needed.',
          },
          {
            icon: '🔄',
            title: 'Handle Duplicates',
            desc: 'Use event ID for deduplication. Same event may arrive multiple times.',
          },
          {
            icon: '🔒',
            title: 'Use HTTPS',
            desc: 'Always use HTTPS in production. HTTP only allowed for localhost.',
          },
          {
            icon: '📊',
            title: 'Monitor',
            desc: 'Set up alerting for your webhook endpoint. Track failure rates.',
          },
        ].map((item) => (
          <div key={item.title} className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">{item.icon}</div>
            <h4 className="font-semibold text-gray-900">{item.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
