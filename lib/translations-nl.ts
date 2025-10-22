export const nlTranslations = {
  // Common
  loading: 'Laden...',
  error: 'Fout',
  save: 'Opslaan',
  cancel: 'Annuleren',
  delete: 'Verwijderen',
  edit: 'Bewerken',
  back: 'Terug',
  next: 'Volgende',
  previous: 'Vorige',
  close: 'Sluiten',
  confirm: 'Bevestigen',
  
  // Navigation
  navSignIn: 'Inloggen',
  navSignOut: 'Uitloggen',
  navDashboard: 'Dashboard',
  navWorkspace: 'Workspace',
  navData: 'Data',
  navQbr: 'QBR',
  
  // Marketing Page
  marketing: {
    hero: {
      title: 'Maak Klantimpact meetbaar',
      subtitle: 'AI die klantdata omzet in actiegerichte inzichten en meetbare impact voor je bedrijf.',
      ctaPrimary: 'Start Gratis Proefperiode',
      ctaSecondary: 'Bekijk Demo'
    },
    features: {
      title: 'Alles wat je nodig hebt om klantimpact te meten',
      subtitle: 'Van data upload tot actiegerichte inzichten, RevImpact helpt je klantensucces begrijpen en verbeteren.',
      smartUpload: {
        title: 'Slimme Data Upload',
        description: 'Upload Excel of CSV bestanden en laat onze AI automatisch je klantdata velden mappen.'
      },
      aiQbr: {
        title: 'AI-Gestuurde QBR\'s',
        description: 'Genereer uitgebreide Quarterly Business Reviews automatisch vanuit je klantdata.'
      },
      impactAnalytics: {
        title: 'Impact Analytics',
        description: 'Volg klantensucces metrics en identificeer kansen voor groei en retentie.'
      }
    },
    howItWorks: {
      title: 'Hoe het werkt',
      subtitle: 'Begin in minuten, niet maanden',
      step1: {
        title: 'Upload je Data',
        description: 'Importeer je klantdata vanuit Excel of CSV bestanden. Ons systeem detecteert en mapt automatisch je data velden.'
      },
      step2: {
        title: 'Genereer QBR\'s',
        description: 'Creëer uitgebreide Quarterly Business Reviews met AI-gestuurde inzichten en aanbevelingen.'
      },
      step3: {
        title: 'Volg Impact',
        description: 'Monitor klantensucces metrics en maak data-gedreven beslissingen om retentie en groei te verbeteren.'
      }
    },
    cta: {
      title: 'Klaar om klantimpact meetbaar te maken?',
      subtitle: 'Sluit je aan bij vooruitstrevende bedrijven die RevImpact al gebruiken om klantensucces te stimuleren.',
      button: 'Start Gratis'
    },
    footer: {
      product: 'Product',
      company: 'Bedrijf',
      support: 'Ondersteuning',
      features: 'Functies',
      pricing: 'Prijzen',
      api: 'API',
      about: 'Over ons',
      blog: 'Blog',
      careers: 'Carrières',
      helpCenter: 'Helpcentrum',
      contact: 'Contact',
      status: 'Status',
      copyright: '© 2024 RevImpact. Alle rechten voorbehouden.'
    }
  },
  
  // Sign In Page
  signInPage: {
    title: 'Sign in to RevImpact',
    subtitle: 'Ontvang een magic link per e-mail.',
    emailPlaceholder: 'jij@bedrijf.com',
    sendButton: 'Send magic link',
    successMessage: 'Check je mail voor de magic link ✉️',
    errorMessage: 'Login error'
  },
  
  // Dashboard
  dashboard: {
    welcome: 'Welkom bij je workspace',
    workspace: 'Workspace',
    uploadData: 'Upload Customer Data (stap 1)',
    qbrGenerator: 'QBR Generator (stap 2)',
    workspaceSettings: 'Workspace Settings'
  },
  
  // Data Upload
  dataUpload: {
    title: 'Customer Data Management',
    subtitle: 'Upload and map your customer data for QBR and Dashboard',
    uploadTitle: 'Upload Customer Data',
    uploadSubtitle: 'Upload Excel (.xlsx) or CSV files with your customer data',
    dragDrop: 'Click to upload or drag and drop',
    fileTypes: 'Excel (.xlsx) or CSV files up to 10MB',
    selectedFile: 'Selected',
    columnMapping: 'Data Preview & Column Mapping',
    columnMappingSubtitle: 'Map your columns to RevImpact data fields',
    dataPreview: 'Data Preview (first 10 rows)',
    saveMapping: 'Save Data Mapping',
    uploadNew: 'Upload New File',
    nextSteps: 'Next Steps',
    generateQbr: 'Generate QBR',
    viewDashboard: 'View Dashboard',
    qbrDescription: 'Create Quarterly Business Reviews using your mapped data',
    dashboardDescription: 'See analytics and insights from your customer data'
  },
  
  // QBR Generator
  qbrGenerator: {
    title: 'QBR Generator',
    subtitle: 'Generate AI-powered Quarterly Business Reviews',
    noDataTitle: 'No Customer Data Found',
    noDataMessage: 'Upload your customer data first to generate QBR reports automatically.',
    uploadDataButton: 'Upload Customer Data',
    customerInfo: 'Customer Information',
    customerName: 'Customer Name',
    email: 'Email',
    company: 'Company',
    mrr: 'Monthly Recurring Revenue',
    churnRisk: 'Churn Risk',
    lastActivity: 'Last Activity',
    supportTickets: 'Support Tickets (Last Quarter)',
    featureUsage: 'Feature Usage Notes',
    generateButton: 'Generate QBR',
    generating: 'Generating QBR...',
    reportTitle: 'Generated QBR Report',
    generateNew: 'Generate New',
    download: 'Download'
  },
  
  // Workspace
  workspace: {
    title: 'Workspace Settings',
    subtitle: 'Manage your team and workspace',
    workspaceInfo: 'Workspace Information',
    workspaceName: 'Workspace Name',
    created: 'Created',
    inviteTeam: 'Invite Team Members',
    inviteSubtitle: 'Add new users to your workspace',
    emailPlaceholder: 'Enter email address',
    sendInvite: 'Send Invite',
    sending: 'Sending...',
    teamMembers: 'Team Members',
    membersCount: 'member',
    rolePermissions: 'Role Permissions',
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    ownerDesc: 'Full workspace access, manage team members, delete workspace, all admin permissions',
    adminDesc: 'Upload and manage data, generate QBR reports, invite new members, view all analytics',
    memberDesc: 'View data and reports, generate QBR reports, basic analytics access, limited permissions'
  }
}
