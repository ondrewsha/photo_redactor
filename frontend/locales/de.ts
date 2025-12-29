
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
    promptPlaceholder: "Eine Katze im Raumanzug, die in einem Neon-Nebel schwebt...",
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
    styleNames: deStyleNames,
    sizeLabels: deSizeLabels
  },
  history: {
    title: "Generationsverlauf",
    empty: "Noch keine gespeicherten Generationen.",
    showMore: "Alle anzeigen",
    modalTitle: "Ihre Meisterwerke",
    modalClose: "Schließen",
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
};
