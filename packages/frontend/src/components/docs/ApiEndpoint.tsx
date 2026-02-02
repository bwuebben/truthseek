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
  GET: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-100 text-blue-700 border-blue-200',
  PUT: 'bg-amber-100 text-amber-700 border-amber-200',
  PATCH: 'bg-orange-100 text-orange-700 border-orange-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
};

export function ApiEndpoint({ method, path, description, children }: ApiEndpointProps) {
  return (
    <div className="my-6 rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
        <span className={clsx(
          'px-2.5 py-1 text-xs font-bold rounded border',
          methodColors[method]
        )}>
          {method}
        </span>
        <code className="text-sm font-mono text-gray-800">{path}</code>
      </div>

      {/* Description */}
      {description && (
        <div className="px-4 py-3 text-sm text-gray-600 bg-white border-b border-gray-100">
          {description}
        </div>
      )}

      {/* Content (params, body, response) */}
      {children && (
        <div className="p-4 bg-white text-sm">
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
      {title && <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h5>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 pr-4 font-medium text-gray-600">Parameter</th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">Type</th>
              <th className="text-left py-2 font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((param) => (
              <tr key={param.name} className="border-b border-gray-50">
                <td className="py-2 pr-4">
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{param.name}</code>
                  {param.required && <span className="ml-1 text-red-500 text-xs">*</span>}
                </td>
                <td className="py-2 pr-4">
                  <span className="text-xs text-gray-500 font-mono">{param.type}</span>
                </td>
                <td className="py-2 text-gray-600">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
