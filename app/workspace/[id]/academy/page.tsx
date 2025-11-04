"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import * as XLSX from 'xlsx';

interface Workspace {
  id: string;
  name: string;
}

interface AcademyUpload {
  id: string;
  filename: string;
  upload_date: string;
  status: string;
}

interface ParticipantProgress {
  id: string;
  participant_name: string;
  participant_email: string;
  customer_name: string;
  lesson_module: string;
  start_date: string | null;
  completed_on: string | null;
  score: number | null;
  pass_threshold: number | null;
  progress_percentage: number | null;
  duration_seconds: number | null;
  is_external_user: boolean;
  user_groups: string[];
}

// Helper function to extract customer name from email domain
function extractCustomerName(email: string): string {
  if (!email || !email.includes('@')) {
    return 'Onbekend';
  }
  const domain = email.split('@')[1];
  // Remove common TLDs and get the main domain name
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    // Take the second-to-last part (e.g., 'innax' from 'innax.nl')
    return domainParts[domainParts.length - 2].charAt(0).toUpperCase() + 
           domainParts[domainParts.length - 2].slice(1);
  }
  return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
}

// Helper function to convert H:MM:SS to seconds
function parseDuration(duration: string): number {
  if (!duration || duration === '0:00:00') return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Helper function to parse date from DD-MM-YYYY format
function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    // Handle DD-MM-YYYY format
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    // Try standard ISO format
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Error parsing date:', e);
  }
  return null;
}

export default function AcademyMonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [uploads, setUploads] = useState<AcademyUpload[]>([]);
  const [participants, setParticipants] = useState<ParticipantProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchPerson, setSearchPerson] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadWorkspaceData = useCallback(async () => {
    try {
      // Check if user has access to workspace
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/signin');
        return;
      }

      // Get workspace info
      const { data: workspaceData, error: workspaceError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (workspaceError) throw workspaceError;
      
      // Check if this is a Timewax workspace
      const workspaceNameLower = (workspaceData.name || "").toLowerCase();
      if (!workspaceNameLower.includes('timewax')) {
        setError('Deze functionaliteit is alleen beschikbaar voor Timewax workspaces');
        setLoading(false);
        return;
      }

      setWorkspace(workspaceData);

      // Check workspace membership
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError || !membership) {
        router.push('/workspace');
        return;
      }

      // Load uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('academy_data_uploads')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('upload_date', { ascending: false });

      if (uploadsError) throw uploadsError;
      setUploads(uploadsData || []);

      // Load participant progress
      await loadParticipantProgress();

      setLoading(false);
    } catch (err) {
      console.error('Error loading workspace data:', err);
      setError('Fout bij laden van workspace data');
      setLoading(false);
    }
  }, [supabase, router, workspaceId]);

  const loadParticipantProgress = async () => {
    try {
      let query = supabase
        .from('academy_participant_progress')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('participant_name', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setParticipants(data || []);
    } catch (err) {
      console.error('Error loading participant progress:', err);
      setError('Fout bij laden van voortgang');
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Geen actieve sessie');
        return;
      }

      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        setError('Het Excel bestand bevat geen data');
        setIsUploading(false);
        return;
      }

      // Create upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('academy_data_uploads')
        .insert({
          workspace_id: workspaceId,
          filename: file.name,
          file_type: 'xlsx',
          file_size: file.size,
          created_by: session.user.id,
          status: 'processing'
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Process the data
      setIsProcessing(true);
      
      const progressRecords: any[] = [];
      
      // Helper function to find column value (case-insensitive)
      const findColumn = (row: any, possibleNames: string[]): any => {
        for (const name of possibleNames) {
          if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
            return row[name];
          }
        }
        // Try case-insensitive match
        const rowKeys = Object.keys(row);
        for (const key of rowKeys) {
          for (const name of possibleNames) {
            if (key.toLowerCase() === name.toLowerCase()) {
              return row[key];
            }
          }
        }
        return '';
      };
      
      for (const row of jsonData) {
        // Map Excel columns to our data structure (flexible column matching)
        const participantName = findColumn(row, ['Gebruiker', 'gebruiker', 'Gebruiker']) || '';
        const participantEmail = findColumn(row, ['E-mail', 'e-mail', 'E-mail', 'Email', 'email']) || '';
        const lessonModule = findColumn(row, ['Lesmodule', 'lesmodule', 'Lesmodule']) || '';
        const startDate = findColumn(row, ['Startdatum', 'startdatum', 'Startdatum']) || '';
        const completedOn = findColumn(row, ['Voltooid op', 'voltooid op', 'Voltooid op', 'Voltooid op']) || '';
        const score = findColumn(row, ['Score', 'score']) || null;
        const passThreshold = findColumn(row, ['Slaagdrempel voor score', 'slaagdrempel voor score']) || null;
        const progress = findColumn(row, ['Voortgang', 'voortgang']) || null;
        const duration = findColumn(row, ['Tijdsduur', 'tijdsduur']) || '0:00:00';
        const externalUser = findColumn(row, ['Externe gebruiker', 'externe gebruiker']) || 'Nee';
        const isExternal = (externalUser.toString().toLowerCase() === 'ja' || externalUser.toString().toLowerCase() === 'yes');
        const userGroupsStr = findColumn(row, ['Gebruikersgroepen', 'gebruikersgroepen']) || '';
        const userGroups = userGroupsStr
          .toString()
          .split(',')
          .map((g: string) => g.trim())
          .filter((g: string) => g.length > 0);

        const customerName = extractCustomerName(participantEmail);

        progressRecords.push({
          workspace_id: workspaceId,
          upload_id: uploadRecord.id,
          participant_name: participantName,
          participant_email: participantEmail,
          customer_name: customerName,
          lesson_module: lessonModule,
          start_date: parseDate(startDate),
          completed_on: parseDate(completedOn),
          score: score ? parseFloat(score.toString()) : null,
          pass_threshold: passThreshold ? parseFloat(passThreshold.toString()) : null,
          progress_percentage: progress ? parseInt(progress.toString()) : null,
          duration_seconds: parseDuration(duration.toString()),
          is_external_user: isExternal,
          user_groups: userGroups,
          raw_data: row
        });
      }

      // Insert progress records in batches
      const batchSize = 100;
      for (let i = 0; i < progressRecords.length; i += batchSize) {
        const batch = progressRecords.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('academy_participant_progress')
          .insert(batch);

        if (insertError) {
          console.error('Error inserting batch:', insertError);
          throw insertError;
        }
      }

      // Update upload status
      await supabase
        .from('academy_data_uploads')
        .update({ status: 'processed' })
        .eq('id', uploadRecord.id);

      setSuccess(`Bestand succesvol verwerkt! ${progressRecords.length} records toegevoegd.`);
      await loadWorkspaceData();
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(`Fout bij verwerken van bestand: ${err.message || 'Onbekende fout'}`);
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter participants based on search
  const filteredParticipants = participants.filter(p => {
    const matchesCustomer = !searchCustomer || 
      (p.customer_name && p.customer_name.toLowerCase().includes(searchCustomer.toLowerCase()));
    const matchesPerson = !searchPerson || 
      p.participant_name.toLowerCase().includes(searchPerson.toLowerCase()) ||
      p.participant_email.toLowerCase().includes(searchPerson.toLowerCase());
    return matchesCustomer && matchesPerson;
  });

  // Get unique customers for statistics
  const uniqueCustomers = new Set(participants.map(p => p.customer_name)).size;
  const uniqueParticipants = new Set(participants.map(p => p.participant_email)).size;
  const totalModules = participants.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-impact-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace niet gevonden</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/workspace')}
            className="bg-impact-blue text-white px-6 py-2 rounded-lg hover:bg-impact-blue/90 transition-colors"
          >
            Terug naar Workspaces
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-impact-light via-white to-impact-light">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-impact-blue to-impact-lime rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-impact-dark">Timewax Academy Monitoring</h1>
                  <p className="text-gray-600">{workspace.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href={`/workspace/${workspaceId}`}
                className="text-impact-blue hover:text-impact-blue/80 text-sm font-medium transition-colors"
              >
                ← Terug naar Workspace
              </Link>
              <LanguageSwitcher />
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Totaal Modules</h3>
            <p className="text-3xl font-bold text-impact-blue">{totalModules}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Unieke Deelnemers</h3>
            <p className="text-3xl font-bold text-impact-blue">{uniqueParticipants}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Klanten</h3>
            <p className="text-3xl font-bold text-impact-blue">{uniqueCustomers}</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Excel Bestand</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="space-y-4">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <label htmlFor="academy-file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {isUploading || isProcessing 
                      ? (isProcessing ? 'Bestand verwerken...' : 'Bestand uploaden...')
                      : 'Klik om Excel bestand te uploaden'}
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    .xlsx, .xls bestanden
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="academy-file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={isUploading || isProcessing}
                />
              </div>
            </div>
          </div>
          
          {/* Upload History */}
          {uploads.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Upload Geschiedenis</h3>
              <div className="space-y-2">
                {uploads.slice(0, 5).map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{upload.filename}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(upload.upload_date).toLocaleString('nl-NL')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      upload.status === 'processed' 
                        ? 'bg-green-100 text-green-800'
                        : upload.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {upload.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Zoeken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek op Klantnaam
              </label>
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Bijv. Innax"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek op Persoon
              </label>
              <input
                type="text"
                value={searchPerson}
                onChange={(e) => setSearchPerson(e.target.value)}
                placeholder="Bijv. Wim Hiensch"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Voortgang Overzicht</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredParticipants.length} van {participants.length} records
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deelnemer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-mail
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lesmodule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startdatum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voortgang
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tijdsduur
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {participants.length === 0 
                        ? 'Geen data beschikbaar. Upload een Excel bestand om te beginnen.'
                        : 'Geen resultaten gevonden voor de geselecteerde filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.participant_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.participant_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {participant.lesson_module}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.start_date 
                          ? new Date(participant.start_date).toLocaleDateString('nl-NL')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.progress_percentage !== null ? (
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-impact-blue h-2 rounded-full" 
                                style={{ width: `${participant.progress_percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-700">{participant.progress_percentage}%</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.score !== null 
                          ? `${participant.score}${participant.pass_threshold ? ` / ${participant.pass_threshold}` : ''}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.duration_seconds 
                          ? `${Math.floor(participant.duration_seconds / 3600)}:${Math.floor((participant.duration_seconds % 3600) / 60).toString().padStart(2, '0')}:${(participant.duration_seconds % 60).toString().padStart(2, '0')}`
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

