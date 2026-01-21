import Link from 'next/link';
import { LayoutDashboard, Upload, Users, CheckSquare, Settings } from 'lucide-react';

export default function CSMAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    {
      name: 'Dashboard',
      href: '/csm-agent',
      icon: LayoutDashboard,
    },
    {
      name: 'Import CSV',
      href: '/csm-agent/import',
      icon: Upload,
    },
    {
      name: 'Detractors',
      href: '/csm-agent/detractors',
      icon: Users,
    },
    {
      name: 'Taken',
      href: '/csm-agent/tasks',
      icon: CheckSquare,
    },
    {
      name: 'Instellingen',
      href: '/csm-agent/settings',
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
                Automatische NPS detractor opvolging voor Timewax
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Luuk van Ravestein
              </span>
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
