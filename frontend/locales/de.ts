
import { TranslationSchema } from '../types';
import { deStyleNames, deSizeLabels } from './styleNames';

export const de: TranslationSchema = {
  common: {
    generate: "Generieren",
    cancel: "Abbrechen",
    reset: "Zurücksetzen",
    download: "Herunterladen",
    login: "Anmelden",
    register: "Registrieren",
    logout: "Abmelden",
    profile: "Profil",
    settings: "Einstellungen",
    loading: "Laden...",
    error: "Fehler",
    success: "Erfolg",
    close: "Schließen",
    back: "Zurück",
    more: "Mehr",
    done: "Fertig",
    // Fix: Added missing tryAgain key
    tryAgain: "Erneut versuchen"
  },
  hero: {
    title: "Entfessle deine Kreativität mit KI",
    subtitle: "Verwandle einfache Worte in atemberaubende Bilder. Die Zukunft der Bilderzeugung ist da, vereinfacht für alle.",
    cta: "Jetzt anfangen",
    // Fix: Added missing badge and learnMore keys
    badge: "Einführung der Gen-V Engine",
    learnMore: "Mehr erfahren"
  },
  // Fix: Added missing features section
  features: {
    tag: "Der Prozess",
    title: "Für Kunst entwickelt",
    description: "Vom Konzept zum Meisterwerk in Sekunden. Unsere Cloud-Architektur übernimmt die Komplexität, während Sie die kreative Kontrolle behalten.",
    step1Title: "Beschreiben",
    step1Desc: "Nutzen Sie natürliche Sprache, um der KI genau zu sagen, was Sie sich vorstellen.",
    step2Title: "Verfeinern",
    step2Desc: "Optimieren Sie jedes Pixel mit unserer umfangreichen Stilbibliothek und Presets.",
    step3Title: "Exportieren",
    step3Desc: "Laden Sie Ihre Kreation in hoher Auflösung herunter und teilen Sie sie mit der Welt.",
  },
  generator: {
    promptPlaceholder: "Geben Sie hier Ihre Beschreibung dessen ein, was Sie sehen möchten, zum Beispiel: „Stilvoller Damenrucksack aus schwarzem Leder, auf einem Marmorpodest platziert, Studiobeleuchtung, Platz für Text oben lassen“ …",
    helperText: "Beschreibe in einfachen Worten, was du sehen möchtest.",
    styles: "Stile",
    size: "Größe",
    photos: "Fotos",
    aspectRatio: "Seitenverhältnis",
    quality: "Qualität",
    popularStyles: "Beliebt",
    openLibrary: "Stilbibliothek",
    uploadPhoto: "Foto hochladen",
    photoLimit: "Max. {limit} Fotos",
    photoInstructions: "Lade ein Foto hoch, um es als Referenz zu verwenden.",
    photoUnavailable: "Die aktuelle Engine unterstützt keine Foto-Uploads.",
    // Fix: Added missing generator control keys
    initializing: "Engine wird initialisiert...",
    readyTitle: "Bereit zur Visualisierung?",
    crafting: "Erstellen Ihrer Vision",
    outOfBalance: "Keine Generationen mehr übrig. Bitte laden Sie Ihr Guthaben auf.",
    searchStyles: "Stile suchen...",
    noStylesFound: "Keine Stile gefunden",
    defaultStyle: "Kein Stil",
    newGeneration: "Neue Generation",
    styleNames: deStyleNames,
    sizeLabels: deSizeLabels
  },
  history: {
    title: "Generationsverlauf",
    empty: "Noch keine gespeicherten Generationen.",
    showMore: "Alle anzeigen",
    modalTitle: "Ihre Meisterwerke",
    modalClose: "Schließen",
    pageLabel: "Seite",
    prev: "Zurück",
    next: "Weiter",
    promptLabel: "Anfrage",
    stylesLabel: "Stile",
    download: "Herunterladen",
    delete: "Löschen",
    open: "Öffnen",
    deleteConfirm: "Eintrag aus der Historie entfernen?"
  },
  profile: {
    balance: "Guthaben",
    refill: "Generationen hinzufügen",
    verified: "E-Mail verifiziert",
    notVerified: "E-Mail nicht verifiziert",
    resendEmail: "Bestätigung erneut senden",
    changePassword: "Passwort ändern",
    buyGenerations: "Paket kaufen",
    unitPrice: "Preis pro Stück",
    totalPrice: "Gesamt",
    pay: "Bezahlen",
    // Fix: Added missing currency key
    currency: "€",
    units: "Stück",
    historyTitle: "Transaktionsverlauf",
    historyEmpty: "Noch keine Käufe.",
    historyButton: "Transaktionshistorie",
    historyDefaultComment: "Paket mit Generationen",
    historyKinds: {
      purchase: "Aufladung",
      trial: "Bonus",
      refund: "Rückerstattung",
      generation: "Abbuchung"
    }
    ,
    historyDescriptions: {
      purchase: "Paket mit Generationen",
      trial: "Bonus",
      refund: "Rückerstattung",
      generation: "Abbuchung von Generationen"
    },
    historyAmountLabel: "Betrag",
    changePasswordTitle: "Passwort ändern",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmPassword: "Neues Passwort wiederholen",
    changePasswordSubmit: "Passwort aktualisieren",
    passwordMismatch: "Passwörter stimmen nicht überein.",
    passwordChangeSuccess: "Passwort aktualisiert.",
    passwordChangeError: "Passwort konnte nicht geändert werden."
  },
  auth: {
    loginTitle: "Willkommen zurück",
    registerTitle: "NanoVisual beitreten",
    loginSubtitle: "Melde dich an, um fortzufahren.",
    registerSubtitle: "Erstelle ein Konto und erhalte Bonus-Generationen.",
    email: "E-Mail-Adresse",
    password: "Passwort (min. 8 Zeichen)",
    noAccount: "Kein Konto?",
    haveAccount: "Bereits ein Konto?",
    // Fix: Added missing or key
    or: "Oder"
  }
  ,
  footer: {
    brand: "NanoVisual AI",
    privacy: "Datenschutz",
    terms: "Nutzungsbedingungen",
    docs: "Dokumentation",
    support: "Support"
    ,
    supportTitle: "Brauchen Sie Hilfe?",
    supportDescription: "Kontaktieren Sie uns per E-Mail – wir helfen schnell bei Fragen.",
    supportEmailLabel: "E-Mail",
    supportEmail: "support@nanovisual.ai",
    supportClose: "Schließen"
  },
  promo: {
    tagline: "Schließe dich heute 10.000+ Kreativen an",
    subtext: "Die KI-Plattform für schnelle, beeindruckende Bilder."
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
      jobRerun: "Job neu gestartet",
      jobCancel: "Job abgebrochen"
    },
    jobsTab: "Jobs",
    metricsTab: "Metriken",
    jobsTable: {
      title: "Generierungsjobs",
      jobId: "Job / Reservierung",
      statusLabel: "Status",
      userEmail: "Benutzer",
      created: "Erstellt",
      updated: "Aktualisiert",
      actions: {
        rerun: "Erneut starten",
        cancel: "Abbrechen"
      },
      empty: "Keine Jobs"
    },
    billing: {
      title: "Transaktionen",
      filters: {
        kind: "Typ"
      },
      totalAmount: "Summe",
      totalCount: "Einträge",
      kindLabel: "Typ",
      userLabel: "Email",
      deltaLabel: "Delta",
      amountLabel: "Betrag",
      createdLabel: "Datum",
      currency: "RUB",
      empty: "Keine Transaktionen"
    },
    metrics: {
      title: "Insights",
      tagline: "Live-Metriken",
      dailyGens: "Generierungen / Tag",
      dailyRevenue: "Umsatz / Tag",
      totalLabel: "Wochensumme",
      apiErrors: "API-Fehler",
      failureRate: "Fehlerquote",
      backlogTitle: "Backlog",
      reload: "Aktualisiert"
    }
  },
};
