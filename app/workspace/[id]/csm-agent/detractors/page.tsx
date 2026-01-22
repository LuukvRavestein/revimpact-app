import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Search, Filter, Calendar, TrendingDown } from 'lucide-react';
import type { DetractorOverview } from '@/lib/types/nps';

export const dynamic = 'force-dynamic';

async function getDetractors() {
  const supabase = createServerComponentClient({ cookies });

  const { data: detractors, error } = await supabase
    .from('detractors_overview')
    .select('*')
    .order('response_date', { ascending: false });

  if (error) {
    console.error('Error fetching detractors:', error);
    return [];
  }

  return detractors as DetractorOverview[];
}

function getStatusBadge(status: string, hasResponse: boolean) {
  if (hasResponse) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        💬 Response
      </span>
    );
  }

  switch (status) {
    case 'not_sent':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Niet verzonden
        </span>
      );
    case 'sent':
    case 'delivered':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          📧 Verzonden
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ❌ Mislukt
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
  }
}

function getUrgencyBadge(urgency: string | null) {
  if (!urgency) return null;

  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[urgency as keyof typeof colors]}`}>
      {urgency.toUpperCase()}
    </span>
  );
}

export default async function DetractorsPage() {
  const detractors = await getDetractors();

  // Calculate stats
  const totalDetractors = detractors.length;
  const sentEmails = detractors.filter(d => d.outreach_status !== 'not_sent').length;
  const gotResponses = detractors.filter(d => d.response_received_at).length;
  const avgScore = detractors.length > 0
    ? (detractors.reduce((sum, d) => sum + d.score, 0) / detractors.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detractors</h1>
          <p className="mt-1 text-sm text-gray-600">
            Alle NPS detractors (score ≤ 6) en hun status
          </p>
        </div>
        <Link
          href="/csm-agent/import"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Import Nieuwe Data
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalDetractors}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold text-gray-900">{sentEmails}</p>
              <p className="text-xs text-gray-500">
                {totalDetractors > 0 ? Math.round((sentEmails / totalDetractors) * 100) : 0}% coverage
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Got Responses</p>
              <p className="text-2xl font-bold text-gray-900">{gotResponses}</p>
              <p className="text-xs text-gray-500">
                {sentEmails > 0 ? Math.round((gotResponses / sentEmails) * 100) : 0}% response rate
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{avgScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detractors Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Alle Detractors ({totalDetractors})
            </h2>
            <div className="flex space-x-2">
              {/* Search - disabled for now, can be added later */}
              {/* <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Search className="w-4 h-4 mr-2" />
                Zoeken
              </button> */}
            </div>
          </div>
        </div>

        {detractors.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Geen detractors</h3>
            <p className="mt-1 text-sm text-gray-500">
              Importeer NPS data om detractors te zien.
            </p>
            <div className="mt-6">
              <Link
                href="/csm-agent/import"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Import CSV
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgentie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taken
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detractors.map((detractor) => (
                  <tr key={detractor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {detractor.cli_name}
                      </div>
                      {detractor.feedback && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {detractor.feedback}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {detractor.user_first_name} {detractor.user_last_name}
                      </div>
                      <div className="text-sm text-gray-500">{detractor.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {detractor.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(detractor.response_date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(
                        detractor.outreach_status,
                        !!detractor.response_received_at
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUrgencyBadge(detractor.response_urgency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {detractor.open_tasks > 0 ? (
                        <span className="text-orange-600 font-medium">
                          {detractor.open_tasks} open
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/csm-agent/detractors/${detractor.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
