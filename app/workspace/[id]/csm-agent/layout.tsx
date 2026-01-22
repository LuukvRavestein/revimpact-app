import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard, Upload, Users, CheckSquare, Settings } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function CSMAgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/signin');
  }

  // Check if user has access to this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (!membership) {
    redirect('/dashboard');
  }

  // Get workspace name
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('name')
    .eq('id', params.id)
    .single();

  const workspaceName = workspace?.name || 'Workspace';

  const navItems = [
    {
      name: 'Dashboard',
      href: `/workspace/${params.id}/csm-agent`,
      icon: LayoutDashboard,
    },
    {
      name: 'Import CSV',
      href: `/workspace/${params.id}/csm-agent/import`,
      icon: Upload,
    },
    {
      name: 'Detractors',
      href: `/workspace/${params.id}/csm-agent/detractors`,
      icon: Users,
    },
    {
      name: 'Taken',
      href: `/workspace/${params.id}/csm-agent/tasks`,
      icon: CheckSquare,
    },
    {
      name: 'Instellingen',
      href: `/workspace/${params.id}/csm-agent/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 CSM Agent - NPS Automation
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {workspaceName} • Automatische NPS detractor opvolging
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/workspace/${params.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ← Terug naar Workspace
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 px-3 py-4 text-sm font-medium text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
