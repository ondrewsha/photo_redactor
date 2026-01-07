
import { TranslationSchema } from '../types';
import { enStyleNames, enSizeLabels } from './styleNames';

export const en: TranslationSchema = {
  common: {
    generate: "Generate",
    cancel: "Cancel",
    reset: "Reset",
    download: "Download",
    login: "Log In",
    register: "Sign Up",
    logout: "Log Out",
    profile: "Profile",
    settings: "Settings",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    close: "Close",
    back: "Back",
    more: "More",
    done: "Done",
    tryAgain: "Try Again"
  },
  hero: {
    title: "Unleash Your Creativity with AI",
    subtitle: "Turn simple words into breathtaking visuals. The future of image generation is here, simplified for everyone.",
    cta: "Start Creating Now",
    badge: "Introducing Gen-V Engine",
    learnMore: "Learn more"
  },
  features: {
    tag: "The Process",
    title: "Engineered for Art",
    description: "From concept to masterpiece in seconds. Our cloud architecture handles the complexity, while you stay in control of the creative direction.",
    step1Title: "Describe",
    step1Desc: "Use natural language to tell the AI exactly what you imagine.",
    step2Title: "Refine",
    step2Desc: "Fine-tune every pixel using our advanced style library and presets.",
    step3Title: "Export",
    step3Desc: "Download your creation in high resolution and share it with the world.",
  },
  generator: {
    promptPlaceholder: "A cat in a space suit floating in a neon nebula...",
    helperText: "Describe what you want to see in simple words.",
    styles: "Styles",
    size: "Size",
    photos: "Photos",
    aspectRatio: "Aspect Ratio",
    quality: "Quality",
    popularStyles: "Popular",
    openLibrary: "Style Library",
    uploadPhoto: "Upload Photo",
    photoLimit: "Max {limit} photos",
    photoInstructions: "Upload a photo to use as a reference for your generation.",
    photoUnavailable: "The current engine doesn’t support photo uploads.",
    initializing: "Initializing Engine...",
    readyTitle: "Ready to visualize?",
    crafting: "Crafting your vision",
    outOfBalance: "Out of generations. Please refill your balance.",
    searchStyles: "Search styles...",
    noStylesFound: "No styles found",
    defaultStyle: "No style",
    styleNames: enStyleNames,
    sizeLabels: enSizeLabels
  },
  history: {
    title: "Generation history",
    empty: "No saved generations yet.",
    showMore: "Show all",
    modalTitle: "Your masterpieces",
    modalClose: "Close",
    pageLabel: "Page",
    prev: "Prev",
    next: "Next",
    promptLabel: "Request",
    stylesLabel: "Styles",
    download: "Download",
    delete: "Delete",
    open: "Open",
    deleteConfirm: "Remove this entry from history?"
  },
  profile: {
    balance: "Balance",
    refill: "Add Generations",
    verified: "Email Verified",
    notVerified: "Email not verified",
    resendEmail: "Resend Verification",
    changePassword: "Change Password",
    buyGenerations: "Purchase Generations",
    unitPrice: "Price per unit",
    totalPrice: "Total",
    pay: "Complete Payment",
    currency: "RUB",
    units: "pcs",
    historyTitle: "Transaction history",
    historyEmpty: "No purchases yet.",
    historyButton: "View transaction history",
    historyDefaultComment: "Generation package",
    historyKinds: {
      purchase: "Top-up",
      trial: "Bonus",
      refund: "Refund",
      generation: "Debit"
    }
    ,
    historyDescriptions: {
      purchase: "Generation package",
      trial: "Welcome bonus",
      refund: "Refund",
      generation: "Generation debit"
    },
    historyAmountLabel: "Amount",
    changePasswordTitle: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Repeat new password",
    changePasswordSubmit: "Update password",
    passwordMismatch: "New passwords do not match.",
    passwordChangeSuccess: "Password updated.",
    passwordChangeError: "Could not change password."
  },
  auth: {
    loginTitle: "Welcome Back",
    registerTitle: "Join NanoVisual",
    loginSubtitle: "Sign in to continue your creative journey.",
    registerSubtitle: "Create an account and get free generations.",
    email: "Email address",
    password: "Password (min. 8 characters)",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    or: "Or"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "Privacy",
    terms: "Terms",
    docs: "Docs",
    support: "Support"
    ,
    supportTitle: "Need help?",
    supportDescription: "Our team is ready to answer questions and guide you through any issue.",
    supportEmailLabel: "Email",
    supportEmail: "support@nanovisual.ai",
    supportClose: "Close"
  },
  promo: {
    tagline: "Join 10,000+ creators today",
    subtext: "The AI studio built for fast, beautiful visuals."
  }
  ,
  admin: {
    title: "Admin dashboard",
    subtitle: "Monitor users, balances, and transactions in one place.",
    usersTab: "Users",
    transactionsTab: "Transactions",
    filters: {
      email: "Email",
      role: "Role",
      status: "Status",
      search: "Search users",
      reset: "Clear filters"
    },
    headings: {
      email: "Email",
      balance: "Balance",
      role: "Role",
      status: "Status",
      actions: "Actions",
      created: "Created"
    },
    actions: {
      adjustBalance: "Adjust balance",
      toggleActive: "Disable",
      toggleInactive: "Enable",
      changeBalancePrompt: "Enter amount to add/subtract"
    },
    status: {
      active: "Active",
      inactive: "Suspended"
    },
    prompts: {
      balanceAmount: "Enter balance adjustment (+/-)",
      statusConfirm: "Confirm status change?"
    },
    pagination: {
      prev: "Prev",
      next: "Next",
      page: "Page"
    },
    notifications: {
      balanceUpdated: "Balance updated",
      statusUpdated: "Status updated",
      jobRerun: "Task requeued",
      jobCancel: "Task cancelled"
    }
    ,
    jobsTab: "Jobs",
    metricsTab: "Metrics",
    jobsTable: {
      title: "Generation jobs",
      jobId: "Job / Reservation",
      statusLabel: "Status",
      userEmail: "User",
      created: "Created",
      updated: "Updated",
      actions: {
        rerun: "Rerun",
        cancel: "Cancel"
      },
      empty: "No jobs found"
    },
    billing: {
      title: "Transactions",
      filters: {
        kind: "Transaction type"
      },
      totalAmount: "Amount",
      totalCount: "Records",
      kindLabel: "Kind",
      userLabel: "Email",
      deltaLabel: "Delta",
      amountLabel: "Amount",
      createdLabel: "Date",
      currency: "RUB",
      empty: "No transactions yet"
    },
    metrics: {
      title: "Insights",
      tagline: "Live performance",
      dailyGens: "Generations / day",
      dailyRevenue: "Revenue / day",
      totalLabel: "Weekly total",
      apiErrors: "API errors",
      failureRate: "Failure rate",
      backlogTitle: "Backlog",
      reload: "Auto-refreshing"
    }
  },
};
