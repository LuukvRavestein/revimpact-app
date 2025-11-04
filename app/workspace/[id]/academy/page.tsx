"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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

// Helper function to parse date from various formats
function parseDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object (from Excel parsing)
    if (dateValue instanceof Date) {
      // Format as YYYY-MM-DD without timezone conversion
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Convert to string first
    const dateStr = String(dateValue).trim();
    if (!dateStr || dateStr === '') return null;
    
    // Handle DD-MM-YYYY format (most common in Dutch Excel files)
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);
      
      // Validate date
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
        // Format as YYYY-MM-DD directly (no timezone conversion)
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
    
    // Handle YYYY-MM-DD format
    const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (yyyymmddMatch) {
      return dateStr; // Already in correct format
    }
    
    // Handle Excel serial number (days since 1900-01-01)
    const serialNumber = parseFloat(dateStr);
    if (!isNaN(serialNumber) && serialNumber > 0 && serialNumber < 100000) {
      // Excel epoch starts on 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      // JavaScript Date epoch starts on 1970-01-01
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899 (Excel's epoch - 1 day offset)
      const jsDate = new Date(excelEpoch.getTime() + serialNumber * 24 * 60 * 60 * 1000);
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const day = String(jsDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Try standard Date parsing (but be careful with timezone)
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      // Extract date components in local timezone to avoid UTC conversion issues
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error('Error parsing date:', e, 'Value:', dateValue);
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
  const [fromDate, setFromDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  const itemsPerPage = 50;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const supabase = createSupabaseBrowserClient();

  const loadParticipantProgress = useCallback(async () => {
    try {
      // Load all records (Supabase has a default limit, so we need to handle pagination)
      let allData: ParticipantProgress[] = [];
      let from = 0;
      const limit = 1000; // Supabase default limit
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('academy_participant_progress')
          .select('*', { count: 'exact' })
          .eq('workspace_id', workspaceId)
          .order('participant_name', { ascending: true })
          .range(from, from + limit - 1);

        if (error) throw error;
        
        if (data) {
          allData = [...allData, ...data];
        }
        
        hasMore = data && data.length === limit;
        from += limit;
      }

      console.log(`Loaded ${allData.length} participant records`);
      setParticipants(allData);
    } catch (err) {
      console.error('Error loading participant progress:', err);
      setError('Fout bij laden van voortgang');
    }
  }, [supabase, workspaceId]);

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
  }, [supabase, router, workspaceId, loadParticipantProgress]);

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

      // Read Excel file with date handling options
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellDates: false, // Don't parse dates automatically - keep as strings/numbers
        cellNF: false,
        cellText: true // Get cell text instead of formatted values
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with raw cell values to preserve date formats
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Get formatted strings instead of raw values
        defval: '' // Default value for empty cells
      }) as any[];

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
      
      // Delete old participant progress data for this workspace before adding new data
      // This ensures we always have the latest snapshot without duplicates
      const { error: deleteError } = await supabase
        .from('academy_participant_progress')
        .delete()
        .eq('workspace_id', workspaceId);

      if (deleteError) {
        console.warn('Warning: Could not delete old data:', deleteError);
        // Continue anyway - we'll still add the new data
      } else {
        console.log('Old participant progress data deleted for workspace');
      }
      
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
        
        // Skip rows without essential data (name or email)
        if (!participantName && !participantEmail) {
          console.warn('Skipping row without participant name or email:', row);
          continue;
        }
        
        const startDateRaw = findColumn(row, ['Startdatum', 'startdatum', 'Startdatum']) || '';
        const completedOnRaw = findColumn(row, ['Voltooid op', 'voltooid op', 'Voltooid op', 'Voltooid op']) || '';
        
        // Debug: log first few dates to see what Excel returns
        if (progressRecords.length < 3) {
          console.log('Date parsing debug:', {
            rowIndex: progressRecords.length,
            startDateRaw: startDateRaw,
            startDateType: typeof startDateRaw,
            startDateValue: startDateRaw,
            parsedStartDate: parseDate(startDateRaw)
          });
        }
        
        const startDate = parseDate(startDateRaw);
        const completedOn = parseDate(completedOnRaw);
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
          participant_name: participantName || 'Onbekend',
          participant_email: participantEmail || '',
          customer_name: customerName,
          lesson_module: lessonModule || 'Onbekend',
          start_date: startDate,
          completed_on: completedOn,
          score: score ? parseFloat(score.toString()) : null,
          pass_threshold: passThreshold ? parseFloat(passThreshold.toString()) : null,
          progress_percentage: progress ? parseInt(progress.toString()) : null,
          duration_seconds: parseDuration(duration.toString()),
          is_external_user: isExternal,
          user_groups: userGroups,
          raw_data: row
        });
      }
      
      console.log(`Processed ${progressRecords.length} records from ${jsonData.length} rows`);

      // Insert progress records in batches
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < progressRecords.length; i += batchSize) {
        const batch = progressRecords.slice(i, i + batchSize);
        try {
          const { error: insertError } = await supabase
            .from('academy_participant_progress')
            .insert(batch);

          if (insertError) {
            console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
            errorCount += batch.length;
            errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`);
          } else {
            successCount += batch.length;
          }
        } catch (batchError: any) {
          console.error(`Exception inserting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          errorCount += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${batchError.message || 'Unknown error'}`);
        }
      }

      // Update upload status based on results
      if (successCount > 0 && errorCount === 0) {
        await supabase
          .from('academy_data_uploads')
          .update({ status: 'processed' })
          .eq('id', uploadRecord.id);
        setSuccess(`Bestand succesvol verwerkt! ${successCount} records toegevoegd.`);
      } else if (successCount > 0 && errorCount > 0) {
        await supabase
          .from('academy_data_uploads')
          .update({ status: 'processed' })
          .eq('id', uploadRecord.id);
        setSuccess(`Gedeeltelijk verwerkt: ${successCount} records toegevoegd, ${errorCount} records gefaald.`);
        if (errors.length > 0) {
          console.error('Batch errors:', errors);
        }
      } else {
        await supabase
          .from('academy_data_uploads')
          .update({ status: 'error' })
          .eq('id', uploadRecord.id);
        throw new Error(`Geen records konden worden toegevoegd. Errors: ${errors.join('; ')}`);
      }

      await loadWorkspaceData();
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(`Fout bij verwerken van bestand: ${err.message || 'Onbekende fout'}`);
      
      // Try to update status to error if upload record exists
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: lastUpload } = await supabase
            .from('academy_data_uploads')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('created_by', session.user.id)
            .order('upload_date', { ascending: false })
            .limit(1)
            .single();
          
          if (lastUpload) {
            await supabase
              .from('academy_data_uploads')
              .update({ status: 'error' })
              .eq('id', lastUpload.id);
          }
        }
      } catch (updateErr) {
        console.error('Error updating upload status:', updateErr);
      }
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Filter participants based on search and date
  const filteredParticipants = useMemo(() => {
    if (!participants || participants.length === 0) {
      return [];
    }
    
    const searchCustomerTrimmed = searchCustomer.trim();
    const searchPersonTrimmed = searchPerson.trim();
    
    const filtered = participants.filter(p => {
      // Customer name filter: check if search text appears in customer_name (case-insensitive)
      let matchesCustomer = true; // Default: show all if no search term
      
      if (searchCustomerTrimmed) {
        // Only match if customer_name exists, is a string, and contains the search term
        if (!p.customer_name) {
          matchesCustomer = false;
        } else {
          const customerNameStr = String(p.customer_name);
          const customerNameClean = customerNameStr.trim().toLowerCase();
          const searchTermClean = searchCustomerTrimmed.trim().toLowerCase();
          
          // Check if customer name contains the search term
          matchesCustomer = customerNameClean.includes(searchTermClean);
          
          // Debug logging for problematic cases
          if (searchTermClean && customerNameClean && !matchesCustomer && customerNameClean.includes('bentacera')) {
            // This shouldn't log if filter works correctly
          }
        }
      }
      
      // Person filter: check if search text appears in participant_name or participant_email (case-insensitive)
      let matchesPerson = true; // Default: show all if no search term
      
      if (searchPersonTrimmed) {
        const searchTermClean = searchPersonTrimmed.trim().toLowerCase();
        const nameClean = p.participant_name ? String(p.participant_name).trim().toLowerCase() : '';
        const emailClean = p.participant_email ? String(p.participant_email).trim().toLowerCase() : '';
        matchesPerson = nameClean.includes(searchTermClean) || emailClean.includes(searchTermClean);
      }
      
      // Filter by from date (start_date must be >= fromDate)
      const matchesDate = !fromDate || !p.start_date || 
        new Date(p.start_date) >= new Date(fromDate);
      
      // Only return true if ALL conditions are met
      const result = matchesCustomer && matchesPerson && matchesDate;
      
      return result;
    });
    
    // Debug: Log filter results and verify no Bentacera records
    if (searchCustomerTrimmed) {
      const uniqueCustomersInResults = new Set(filtered.map(p => p.customer_name));
      const bentaceraRecords = filtered.filter(p => {
        const customerName = String(p.customer_name || '').toLowerCase();
        return customerName.includes('bentacera');
      });
      
      console.log('Filter results:', {
        searchTerm: searchCustomerTrimmed,
        totalRecords: filtered.length,
        uniqueCustomers: Array.from(uniqueCustomersInResults),
        bentaceraCount: bentaceraRecords.length,
        bentaceraRecords: bentaceraRecords.map(p => ({
          id: p.id,
          customer: p.customer_name,
          participant: p.participant_name
        }))
      });
      
      // If Bentacera records are found but shouldn't be, log detailed info
      if (bentaceraRecords.length > 0) {
        console.error('BUG: Bentacera records in filtered results!', {
          searchTerm: searchCustomerTrimmed,
          records: bentaceraRecords.map(p => ({
            id: p.id,
            customer_name: p.customer_name,
            customer_name_type: typeof p.customer_name,
            participant_name: p.participant_name
          }))
        });
      }
    }
    
    return filtered;
  }, [participants, searchCustomer, searchPerson, fromDate]);

  // Sort participants - ensure we use filteredParticipants
  const sortedParticipants = useMemo(() => {
    return [...filteredParticipants].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case 'participant_name':
        aValue = a.participant_name || '';
        bValue = b.participant_name || '';
        break;
      case 'customer_name':
        aValue = a.customer_name || '';
        bValue = b.customer_name || '';
        break;
      case 'lesson_module':
        aValue = a.lesson_module || '';
        bValue = b.lesson_module || '';
        break;
      case 'start_date':
        aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
        bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
        break;
      case 'progress_percentage':
        aValue = a.progress_percentage ?? 0;
        bValue = b.progress_percentage ?? 0;
        break;
      case 'completed_on':
        aValue = a.completed_on ? new Date(a.completed_on).getTime() : 0;
        bValue = b.completed_on ? new Date(b.completed_on).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'nl')
        : bValue.localeCompare(aValue, 'nl');
    } else {
      return sortDirection === 'asc' 
        ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
        : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    }
    });
  }, [filteredParticipants, sortColumn, sortDirection]);

  // Paginate participants
  const totalPages = Math.ceil(sortedParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Ensure pagination uses sortedParticipants from filtered data
  const paginatedParticipants = useMemo(() => {
    const paginated = sortedParticipants.slice(startIndex, endIndex);
    
    // Debug: Verify paginated data matches filter
    if (searchCustomer.trim()) {
      const uniqueCustomersInPaginated = new Set(paginated.map(p => p.customer_name));
      const bentaceraInPaginated = paginated.filter(p => 
        String(p.customer_name || '').toLowerCase().includes('bentacera')
      );
      
      if (bentaceraInPaginated.length > 0) {
        console.error('BUG: Bentacera in paginatedParticipants!', {
          searchTerm: searchCustomer.trim(),
          paginatedLength: paginated.length,
          sortedLength: sortedParticipants.length,
          filteredLength: filteredParticipants.length,
          uniqueCustomers: Array.from(uniqueCustomersInPaginated),
          bentaceraRecords: bentaceraInPaginated.map(p => ({
            id: p.id,
            customer: p.customer_name
          }))
        });
      }
    }
    
    return paginated;
  }, [sortedParticipants, startIndex, endIndex, currentPage, itemsPerPage, searchCustomer, filteredParticipants.length]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchCustomer, searchPerson, fromDate]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-gray-400">↕</span>;
    }
    return (
      <span className="ml-1 text-impact-blue">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };


  // Get unique customers for statistics (based on filtered participants)
  const uniqueCustomers = new Set(filteredParticipants.map(p => p.customer_name)).size;
  const uniqueParticipants = new Set(filteredParticipants.map(p => p.participant_email)).size;
  const totalModules = filteredParticipants.length;

  // Calculate top 10 most active customers (by number of unique participants)
  const customerParticipants = filteredParticipants.reduce((acc, p) => {
    const customer = p.customer_name || 'Onbekend';
    if (!acc[customer]) {
      acc[customer] = new Set<string>();
    }
    // Add participant email to set (unique participants)
    if (p.participant_email) {
      acc[customer].add(p.participant_email);
    }
    return acc;
  }, {} as Record<string, Set<string>>);
  
  const top10Customers = Object.entries(customerParticipants)
    .map(([name, participantSet]) => ({ name, count: participantSet.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate top 10 most used lesson modules
  const moduleCounts = filteredParticipants.reduce((acc, p) => {
    const moduleName = p.lesson_module || 'Onbekend';
    acc[moduleName] = (acc[moduleName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const top10Modules = Object.entries(moduleCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

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

        {/* Upload Section - Moved to top and made more compact */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 className="text-lg font-semibold mb-3">Upload Excel Bestand</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-gray-500">
                <svg className="h-8 w-8" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <label htmlFor="academy-file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-gray-900">
                    {isUploading || isProcessing 
                      ? (isProcessing ? 'Bestand verwerken...' : 'Bestand uploaden...')
                      : 'Klik om Excel bestand te uploaden'}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    (.xlsx, .xls)
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
          
          {/* Upload History - Collapsible */}
          {uploads.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowUploadHistory(!showUploadHistory)}
                className="flex items-center justify-between w-full text-left text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span>Upload Geschiedenis ({uploads.length})</span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${showUploadHistory ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUploadHistory && (
                <div className="mt-2 space-y-1">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-xs font-medium text-gray-900">{upload.filename}</p>
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
              )}
            </div>
          )}
        </div>

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

        {/* Top 10 Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Meest Actieve Klanten</h3>
            {top10Customers.length > 0 ? (
              <div className="space-y-2">
                {top10Customers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-impact-blue">{customer.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Geen data beschikbaar</p>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Meest Gebruikte Lesmodules</h3>
            {top10Modules.length > 0 ? (
              <div className="space-y-2">
                {top10Modules.map((module, index) => (
                  <div key={module.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{module.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-impact-blue">{module.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Geen data beschikbaar</p>
            )}
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Zoeken & Filteren</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek op Klantnaam
              </label>
              <input
                type="text"
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                placeholder="Bijv. Equans"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zoek op Resource/Persoon
              </label>
              <input
                type="text"
                value={searchPerson}
                onChange={(e) => setSearchPerson(e.target.value)}
                placeholder="Bijv. Wim Hiensch"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vanaf Datum
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-impact-blue/20 focus:border-impact-blue transition-colors"
              />
              {fromDate && (
                <button
                  onClick={() => setFromDate("")}
                  className="mt-2 text-xs text-impact-blue hover:text-impact-blue/80 underline"
                >
                  Filter wissen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Voortgang Overzicht</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredParticipants.length} van {participants.length} records
                  {totalPages > 1 && ` • Pagina ${currentPage} van ${totalPages}`}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('participant_name')}
                  >
                    <div className="flex items-center">
                      Resource
                      <SortIndicator column="participant_name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('customer_name')}
                  >
                    <div className="flex items-center">
                      Klant
                      <SortIndicator column="customer_name" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('lesson_module')}
                  >
                    <div className="flex items-center">
                      Lesmodule
                      <SortIndicator column="lesson_module" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('start_date')}
                  >
                    <div className="flex items-center">
                      Startdatum
                      <SortIndicator column="start_date" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('progress_percentage')}
                  >
                    <div className="flex items-center">
                      Voortgang
                      <SortIndicator column="progress_percentage" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('completed_on')}
                  >
                    <div className="flex items-center">
                      Voltooid op
                      <SortIndicator column="completed_on" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {participants.length === 0 
                        ? 'Geen data beschikbaar. Upload een Excel bestand om te beginnen.'
                        : 'Geen resultaten gevonden voor de geselecteerde filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedParticipants.map((participant) => {
                    // Debug: Log if we see Bentacera in paginated results when searching for zonm
                    if (searchCustomer.trim().toLowerCase() === 'zonm' && 
                        String(participant.customer_name || '').toLowerCase().includes('bentacera')) {
                      console.error('BUG: Bentacera record in paginatedParticipants!', {
                        participant_id: participant.id,
                        customer_name: participant.customer_name,
                        participant_name: participant.participant_name,
                        filteredLength: filteredParticipants.length,
                        sortedLength: sortedParticipants.length,
                        paginatedLength: paginatedParticipants.length
                      });
                    }
                    return (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.participant_name}
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
                        {participant.completed_on 
                          ? new Date(participant.completed_on).toLocaleDateString('nl-NL')
                          : '-'}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vorige
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volgende
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Toont <span className="font-medium">{startIndex + 1}</span> tot{' '}
                    <span className="font-medium">{Math.min(endIndex, sortedParticipants.length)}</span> van{' '}
                    <span className="font-medium">{sortedParticipants.length}</span> resultaten
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Vorige</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-impact-blue border-impact-blue text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (page === currentPage - 3 || page === currentPage + 3) {
                        return (
                          <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Volgende</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

