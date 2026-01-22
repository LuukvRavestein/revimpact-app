import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  Users,
  Mail,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData(workspaceId: string) {
  const supabase = createServerComponentClient({ cookies });

  // Get dashboard stats - for now showing all data
  // TODO: Add workspace_id filtering when we add workspace support to tables
  const { data: stats } = await supabase
    .from('nps_dashboard_stats')
    .select('*')
    .single();

  // Get recent detractors
  const { data: recentDetractors } = await supabase
    .from('detractors_overview')
    .select('*')
    .order('response_date', { ascending: false })
    .limit(5);

  // Get urgent tasks
  const { data: urgentTasks } = await supabase
    .from('csm_tasks')
    .select(`
      *,
      nps_outreach (
        nps_response_id,
        nps_responses (
          cli_name,
          user_first_name,
          user_last_name
        )
      )
    `)
    .in('status', ['open', 'in_progress'])
    .in('priority', ['high', 'urgent'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(5);

  return {
    stats: stats || null,
    recentDetractors: recentDetractors || [],
    urgentTasks: urgentTasks || [],
  };
}

export default async function CSMAgentDashboard({
  params,
}: {
  params: { id: string };
}) {
  const { stats, recentDetractors, urgentTasks } = await getDashboardData(params.id);

  const statCards = [
    {
      name: 'Total Detractors',
      value: stats?.total_detractors || 0,
      subtext: 'Laatste 90 dagen',
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'Emails Verzonden',
      value: stats?.detractors_emailed || 0,
      subtext: `${stats?.total_detractors ? Math.round((stats.detractors_emailed / stats.total_detractors) * 100) : 0}% coverage`,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Responses',
      value: stats?.detractors_responded || 0,
      subtext: `${stats?.response_rate_percent || 0}% response rate`,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Resolved',
      value: stats?.detractors_resolved || 0,
      subtext: 'Afgehandeld',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">
          Welkom bij je CSM Agent 👋
        </h2>
        <p className="text-blue-100 text-lg">
          Automatische NPS detractor opvolging en analyse. Start met het{' '}
          <Link href={`/workspace/${params.id}/csm-agent/import`} className="underline font-semibold hover:text-white">
            importeren van NPS data
          </Link>
          .
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.subtext}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Detractors */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Recente Detractors
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDetractors && recentDetractors.length > 0 ? (
              recentDetractors.map((detractor: any) => (
                <Link
                  key={detractor.id}
                  href={`/workspace/${params.id}/csm-agent/detractors/${detractor.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {detractor.cli_name}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Score: {detractor.score}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {detractor.user_first_name} {detractor.user_last_name}
                      </p>
                      {detractor.feedback && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {detractor.feedback}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {detractor.outreach_status === 'not_sent' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Nog niet gemaild
                        </span>
                      )}
                      {detractor.outreach_status === 'sent' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📧 Verzonden
                        </span>
                      )}
                      {detractor.response_received_at && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          💬 Response
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(detractor.response_date).toLocaleDateString('nl-NL')}
                    </span>
                    {detractor.open_tasks > 0 && (
                      <span className="text-xs text-orange-600 font-medium">
                        {detractor.open_tasks} open {detractor.open_tasks === 1 ? 'taak' : 'taken'}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Geen detractors
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Importeer NPS data om te beginnen.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/workspace/${params.id}/csm-agent/import`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Import CSV
                  </Link>
                </div>
              </div>
            )}
          </div>
          {recentDetractors && recentDetractors.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href={`/workspace/${params.id}/csm-agent/detractors`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Bekijk alle detractors →
              </Link>
            </div>
          )}
        </div>

        {/* Urgent Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Urgente Taken
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {urgentTasks && urgentTasks.length > 0 ? (
              urgentTasks.map((task: any) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {task.priority === 'urgent' && (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          task.priority === 'urgent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mt-2">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          Due: {new Date(task.due_date).toLocaleDateString('nl-NL')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Geen urgente taken
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Goed bezig! Alles onder controle.
                </p>
              </div>
            )}
          </div>
          {urgentTasks && urgentTasks.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <Link
                href={`/workspace/${params.id}/csm-agent/tasks`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Bekijk alle taken →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Snelle Acties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/workspace/${params.id}/csm-agent/import`}
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Import NPS Data</p>
              <p className="text-sm text-gray-500">Nieuwe CSV uploaden</p>
            </div>
          </Link>

          <Link
            href={`/workspace/${params.id}/csm-agent/detractors`}
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Bekijk Detractors</p>
              <p className="text-sm text-gray-500">Alle detractors lijst</p>
            </div>
          </Link>

          <Link
            href={`/workspace/${params.id}/csm-agent/tasks`}
            className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Taken Beheren</p>
              <p className="text-sm text-gray-500">Open taken bekijken</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
