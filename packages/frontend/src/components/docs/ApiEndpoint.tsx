import { ReactNode } from 'react';
import clsx from 'clsx';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiEndpointProps {
  method: HttpMethod;
  path: string;
  description?: string;
  children?: ReactNode;
}

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  POST: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  DELETE: 'bg-accent-coral/10 text-accent-coral border-accent-coral/30',
};

export function ApiEndpoint({ method, path, description, children }: ApiEndpointProps) {
  return (
    <div className="my-6 rounded-lg border border-subtle overflow-hidden">
      {/* Header */}
      <div className="bg-dark-700 px-4 py-3 flex items-center gap-3 border-b border-subtle">
        <span className={clsx(
          'px-2.5 py-1 text-xs font-bold rounded border',
          methodColors[method]
        )}>
          {method}
        </span>
        <code className="text-sm font-mono text-text-primary">{path}</code>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 text-sm text-text-secondary bg-dark-800 border-b border-subtle">
          {description}
        </div>
      )}

      {/* Content (params, body, response) */}
      {children && (
        <div className="p-4 bg-dark-800 text-sm">
          {children}
        </div>
      )}
    </div>
  );
}

interface ParamTableProps {
  title?: string;
  params: Array<{
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }>;
}

export function ParamTable({ title, params }: ParamTableProps) {
  return (
    <div className="my-4">
      {title && <h5 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{title}</h5>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-subtle">
              <th className="text-left py-2 pr-4 font-medium text-text-secondary">Parameter</th>
              <th className="text-left py-2 pr-4 font-medium text-text-secondary">Type</th>
              <th className="text-left py-2 font-medium text-text-secondary">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((param) => (
              <tr key={param.name} className="border-b border-subtle">
                <td className="py-2 pr-4">
                  <code className="text-xs bg-dark-700 px-1.5 py-0.5 rounded text-accent-coral">{param.name}</code>
                  {param.required && <span className="ml-1 text-accent-coral text-xs">*</span>}
                </td>
                <td className="py-2 pr-4">
                  <span className="text-xs text-text-muted font-mono">{param.type}</span>
                </td>
                <td className="py-2 text-text-secondary">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
