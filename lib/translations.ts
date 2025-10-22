export type Language = 'nl' | 'en'

export interface Translations {
  // Common
  loading: string
  error: string
  save: string
  cancel: string
  delete: string
  edit: string
  back: string
  next: string
  previous: string
  close: string
  confirm: string
  
  // Navigation
  navSignIn: string
  navSignOut: string
  navDashboard: string
  navWorkspace: string
  navData: string
  navQbr: string
  
  // Marketing Page
  marketing: {
    hero: {
      title: string
      subtitle: string
      ctaPrimary: string
      ctaSecondary: string
    }
    features: {
      title: string
      subtitle: string
      smartUpload: {
        title: string
        description: string
      }
      aiQbr: {
        title: string
        description: string
      }
      impactAnalytics: {
        title: string
        description: string
      }
    }
    howItWorks: {
      title: string
      subtitle: string
      step1: {
        title: string
        description: string
      }
      step2: {
        title: string
        description: string
      }
      step3: {
        title: string
        description: string
      }
    }
    cta: {
      title: string
      subtitle: string
      button: string
    }
    footer: {
      product: string
      company: string
      support: string
      features: string
      pricing: string
      api: string
      about: string
      blog: string
      careers: string
      helpCenter: string
      contact: string
      status: string
      copyright: string
    }
  }
  
  // Sign In Page
  signInPage: {
    title: string
    subtitle: string
    emailPlaceholder: string
    passwordPlaceholder: string
    signInButton: string
    signUpLink: string
    signUpButton: string
    errorMessage: string
    successMessage: string
  }

  // Sign Up Page
  signUpPage: {
    title: string
    subtitle: string
    confirmPasswordPlaceholder: string
    createButton: string
    signInLink: string
    signInButton: string
    checkEmail: string
    emailSent: string
    clickLink: string
    backToSignIn: string
    passwordMismatch: string
    passwordTooShort: string
    signUpError: string
  }

  // Chatbot Analytics Page
  chatbot: {
    title: string
    subtitle: string
    uploadTitle: string
    uploadSubtitle: string
    dragDrop: string
    fileTypes: string
    processing: string
    fileSelected: string
    errorProcessing: string
    totalQuestions: string
    uniqueCustomers: string
    selfResolved: string
    forwarded: string
    satisfaction: string
    weeklyTrends: string
    topCustomers: string
    customer: string
    questions: string
    selfResolvedPct: string
    forwardedPct: string
    satisfactionScore: string
    topTopics: string
    forwardedTickets: string
    uploadNew: string
  }
  
  // Dashboard
  dashboard: {
    welcome: string
    workspace: string
    uploadData: string
    qbrGenerator: string
    workspaceSettings: string
  }
  
  // Data Upload
  dataUpload: {
    title: string
    subtitle: string
    uploadTitle: string
    uploadSubtitle: string
    dragDrop: string
    fileTypes: string
    selectedFile: string
    columnMapping: string
    columnMappingSubtitle: string
    dataPreview: string
    saveMapping: string
    uploadNew: string
    nextSteps: string
    generateQbr: string
    viewDashboard: string
    qbrDescription: string
    dashboardDescription: string
  }
  
  // QBR Generator
  qbrGenerator: {
    title: string
    subtitle: string
    noDataTitle: string
    noDataMessage: string
    uploadDataButton: string
    customerInfo: string
    customerName: string
    email: string
    company: string
    mrr: string
    churnRisk: string
    lastActivity: string
    supportTickets: string
    featureUsage: string
    generateButton: string
    generating: string
    reportTitle: string
    generateNew: string
    download: string
  }
  
  // Workspace
  workspace: {
    title: string
    subtitle: string
    workspaceInfo: string
    workspaceName: string
    created: string
    inviteTeam: string
    inviteSubtitle: string
    emailPlaceholder: string
    sendInvite: string
    sending: string
    teamMembers: string
    membersCount: string
    rolePermissions: string
    owner: string
    admin: string
    member: string
    ownerDesc: string
    adminDesc: string
    memberDesc: string
  }
}

import { nlTranslations } from './translations-nl'

export const translations: Record<Language, Translations> = {
  nl: nlTranslations as Translations,
  
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    close: 'Close',
    confirm: 'Confirm',
    
    // Navigation
    navSignIn: 'Sign In',
    navSignOut: 'Sign Out',
    navDashboard: 'Dashboard',
    navWorkspace: 'Workspace',
    navData: 'Data',
    navQbr: 'QBR',
    
    // Marketing Page
    marketing: {
      hero: {
        title: 'Make Customer Impact measurable',
        subtitle: 'AI that turns customer data into actionable insights and measurable impact for your business.',
        ctaPrimary: 'Start Free Trial',
        ctaSecondary: 'Watch Demo'
      },
      features: {
        title: 'Everything you need to measure customer impact',
        subtitle: 'From data upload to actionable insights, RevImpact helps you understand and improve customer success.',
        smartUpload: {
          title: 'Smart Data Upload',
          description: 'Upload Excel or CSV files and let our AI automatically map your customer data fields.'
        },
        aiQbr: {
          title: 'AI-Powered QBRs',
          description: 'Generate comprehensive Quarterly Business Reviews automatically from your customer data.'
        },
        impactAnalytics: {
          title: 'Impact Analytics',
          description: 'Track customer success metrics and identify opportunities for growth and retention.'
        }
      },
      howItWorks: {
        title: 'How it works',
        subtitle: 'Get started in minutes, not months',
        step1: {
          title: 'Upload Your Data',
          description: 'Import your customer data from Excel or CSV files. Our system automatically detects and maps your data fields.'
        },
        step2: {
          title: 'Generate QBRs',
          description: 'Create comprehensive Quarterly Business Reviews with AI-powered insights and recommendations.'
        },
        step3: {
          title: 'Track Impact',
          description: 'Monitor customer success metrics and make data-driven decisions to improve retention and growth.'
        }
      },
      cta: {
        title: 'Ready to make customer impact measurable?',
        subtitle: 'Join forward-thinking companies that are already using RevImpact to drive customer success.',
        button: 'Get Started Free'
      },
      footer: {
        product: 'Product',
        company: 'Company',
        support: 'Support',
        features: 'Features',
        pricing: 'Pricing',
        api: 'API',
        about: 'About',
        blog: 'Blog',
        careers: 'Careers',
        helpCenter: 'Help Center',
        contact: 'Contact',
        status: 'Status',
        copyright: '© 2024 RevImpact. All rights reserved.'
      }
    },
    
    // Sign In Page
    signInPage: {
      title: 'Sign in to RevImpact',
      subtitle: 'Enter your email address and password.',
      emailPlaceholder: 'you@company.com',
      passwordPlaceholder: 'Your password',
      signInButton: 'Sign In',
      signUpLink: 'Don\'t have an account?',
      signUpButton: 'Sign Up',
      errorMessage: 'Invalid login credentials',
      successMessage: 'Successfully signed in!'
    },

    // Sign Up Page
    signUpPage: {
      title: 'Create Account',
      subtitle: 'Enter your details to create your RevImpact account',
      confirmPasswordPlaceholder: 'Confirm password',
      createButton: 'Create Account',
      signInLink: 'Already have an account?',
      signInButton: 'Sign In',
      checkEmail: 'Check your email',
      emailSent: 'We\'ve sent you a confirmation link at',
      clickLink: 'Click the link in the email to complete your registration.',
      backToSignIn: 'Back to Sign In',
      passwordMismatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters',
      signUpError: 'An error occurred during sign up'
    },
    
    // Dashboard
    dashboard: {
      welcome: 'Welcome to your workspace',
      workspace: 'Workspace',
      uploadData: 'Upload Customer Data (step 1)',
      qbrGenerator: 'QBR Generator (step 2)',
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
    },

    // Chatbot Analytics Page
    chatbot: {
      title: 'Chatbot Analytics',
      subtitle: 'Upload chatbot data and get instant performance insights',
      uploadTitle: 'Upload Chatbot Data',
      uploadSubtitle: 'Upload your Excel file with chatbot conversations to automatically generate a dashboard',
      dragDrop: 'Click to upload or drag files here',
      fileTypes: 'Excel (.xlsx, .xls) or CSV files up to 10MB',
      processing: 'Processing data...',
      fileSelected: 'File selected:',
      errorProcessing: 'Error processing Excel file. Please check the format.',
      totalQuestions: 'Total Questions',
      uniqueCustomers: 'Unique Customers',
      selfResolved: 'Self Resolved',
      forwarded: 'Forwarded',
      satisfaction: 'Satisfaction',
      weeklyTrends: 'Trend Over Time',
      topCustomers: 'Top Customers',
      customer: 'Customer',
      questions: 'Questions',
      selfResolvedPct: 'Self Resolved',
      forwardedPct: 'Forwarded',
      satisfactionScore: 'Satisfaction',
      topTopics: 'Top Topics',
      forwardedTickets: 'Forwarded Tickets',
      uploadNew: 'Upload New File'
    }
  }
}
