import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <Settings className="mx-auto h-16 w-16 text-gray-400" />
      <h1 className="mt-4 text-3xl font-bold text-gray-900">Instellingen</h1>
      <p className="mt-2 text-gray-600">
        Deze pagina wordt binnenkort toegevoegd. Hier kun je email templates beheren en andere instellingen aanpassen.
      </p>
      <div className="mt-8 p-6 bg-blue-50 rounded-lg text-left">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Geplande Features:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>Email templates beheren (onderwerp en body)</li>
          <li>Template variabelen configureren</li>
          <li>Test emails versturen</li>
          <li>Email signature instellen</li>
          <li>Notificatie voorkeuren</li>
        </ul>
      </div>
    </div>
  );
}
