import { CheckCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <CheckCircle className="mx-auto h-16 w-16 text-gray-400" />
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Taken Beheer</h1>
      <p className="mt-2 text-gray-600">
        Deze pagina wordt binnenkort toegevoegd. Hier kun je alle CSM taken bekijken en beheren.
      </p>
      <div className="mt-8 p-6 bg-blue-50 rounded-lg text-left">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Geplande Features:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Overzicht van alle taken (open, in progress, completed)</li>
          <li>Filteren op prioriteit en status</li>
          <li>Nieuwe taken aanmaken</li>
          <li>Taken koppelen aan detractors</li>
          <li>Due date tracking en reminders</li>
        </ul>
      </div>
    </div>
  );
}
