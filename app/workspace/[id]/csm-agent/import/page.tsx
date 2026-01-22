'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import type { BeamerCSVRow, ImportPreview } from '@/lib/types/nps';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setPreview(null);

    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as BeamerCSVRow[];

          // Validate and count
          let validRows = 0;
          let invalidRows = 0;
          let detractorsCount = 0;

          rows.forEach((row) => {
            const score = typeof row.score === 'string' ? parseInt(row.score) : row.score;

            if (row.user_email && score >= 0 && score <= 10) {
              validRows++;
              if (score <= 6) detractorsCount++;
            } else {
              invalidRows++;
            }
          });

          setPreview({
            total_rows: rows.length,
            valid_rows: validRows,
            invalid_rows: invalidRows,
            detractors_count: detractorsCount,
            new_responses: validRows, // Will be updated by server
            duplicate_responses: 0, // Will be updated by server
            rows: rows.slice(0, 5), // Preview first 5 rows
          });
        } catch (err) {
          setError('Fout bij het parsen van CSV. Controleer of het bestand correct is geformatteerd.');
          console.error(err);
        }
      },
      error: (err) => {
        setError(`CSV parse error: ${err.message}`);
      },
    });
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/csm-agent/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setSuccess(true);
      setPreview(null);
      setFile(null);

      // Show success message
      alert(`✅ Import succesvol!\n\n${result.imported} responses geïmporteerd\n${result.emails_sent} emails verzonden naar detractors`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">NPS Data Importeren</h1>
        <p className="mt-2 text-gray-600">
          Upload een CSV export vanuit Beamer/Looker Studio om NPS responses te importeren en automatisch emails te versturen naar detractors.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecteer CSV Bestand
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>Upload een bestand</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv"
                      className="sr-only"
                      onChange={handleFileSelect}
                      disabled={importing}
                    />
                  </label>
                  <p className="pl-1">of sleep het hierheen</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV tot 10MB
                </p>
                {file && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-green-600">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CSV Format Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Verwachte CSV Kolommen:
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <code className="bg-white px-2 py-1 rounded">cli_name</code> - Naam van klant organisatie
              <br />
              <code className="bg-white px-2 py-1 rounded">date</code> - Datum van NPS response (bijv. "20 Oct 2025")
              <br />
              <code className="bg-white px-2 py-1 rounded">week</code> - Week nummer (optioneel)
              <br />
              <code className="bg-white px-2 py-1 rounded">user_email</code> - Email adres van respondent
              <br />
              <code className="bg-white px-2 py-1 rounded">user_first_name</code> - Voornaam
              <br />
              <code className="bg-white px-2 py-1 rounded">user_last_name</code> - Achternaam
              <br />
              <code className="bg-white px-2 py-1 rounded">feedback</code> - Vrije tekst feedback (optioneel)
              <br />
              <code className="bg-white px-2 py-1 rounded">score</code> - NPS score (0-10)
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Preview Import
                </h3>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {preview.total_rows}
                  </p>
                  <p className="text-sm text-gray-600">Totaal Rows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {preview.valid_rows}
                  </p>
                  <p className="text-sm text-gray-600">Valide</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {preview.detractors_count}
                  </p>
                  <p className="text-sm text-gray-600">Detractors (≤6)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {preview.invalid_rows}
                  </p>
                  <p className="text-sm text-gray-600">Invalide</p>
                </div>
              </div>

              {/* Sample Rows */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Klant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Naam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.rows.map((row, idx) => {
                      const score = typeof row.score === 'string' ? parseInt(row.score) : row.score;
                      const isDetractor = score <= 6;

                      return (
                        <tr key={idx} className={isDetractor ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.cli_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.user_first_name} {row.user_last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.user_email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isDetractor
                                  ? 'bg-red-100 text-red-800'
                                  : score >= 9
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {row.date}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {preview.rows.length < preview.total_rows && (
                <div className="bg-gray-50 px-6 py-3 text-sm text-gray-600 text-center border-t border-gray-200">
                  ... en {preview.total_rows - preview.rows.length} meer rows
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Fout bij importeren</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Import succesvol!</h3>
                <p className="text-sm text-green-700 mt-1">
                  NPS data is geïmporteerd en emails zijn verzonden naar detractors.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setFile(null);
                setPreview(null);
                setError(null);
                setSuccess(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={importing}
            >
              Reset
            </button>

            <button
              onClick={handleImport}
              disabled={!preview || importing || preview.valid_rows === 0}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Importeren & Emails Versturen...
                </>
              ) : (
                <>
                  <Upload className="-ml-1 mr-2 h-5 w-5" />
                  Importeer & Verstuur Emails
                  {preview && preview.detractors_count > 0 && (
                    <span className="ml-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-sm">
                      {preview.detractors_count} detractor{preview.detractors_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          {/* Warning */}
          {preview && preview.detractors_count > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Let op: Bij importeren worden automatisch <strong>{preview.detractors_count} emails</strong> verzonden
                naar detractors vanuit <strong>luuk.van.ravestein@timewax.com</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
