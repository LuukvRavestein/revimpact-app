import { CheckSquare } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <CheckSquare className="mx-auto h-16 w-16 text-gray-400" />
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Taken Beheren</h1>
      <p className="mt-2 text-gray-600">
        Deze pagina wordt binnenkort toegevoegd. Hier kun je CSM taken beheren die voortkomen uit NPS detractor responses.
      </p>
      <div className="mt-8 p-6 bg-blue-50 rounded-lg text-left">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Geplande Features:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Overzicht van alle open taken</li>
          <li>Prioriteit en urgentie filtering</li>
          <li>Koppeling naar detractor responses</li>
          <li>Status updates (open, in progress, completed)</li>
          <li>Due date tracking</li>
          <li>Notificaties voor overdue taken</li>
        </ul>
      </div>
    </div>
  );
}
