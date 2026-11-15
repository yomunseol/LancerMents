export const PAYMENT_NOTE =
  "When paid plans begin, card payments will be handled by Stripe. LancerMents never stores raw card numbers.";

export const FOUNDER_NOTE = {
  heading: "Why I built LancerMents",
  paragraphs: [
    "I built LancerMents because running a one-person studio meant stitching together a project manager, a notes app, a spreadsheet, and an invoicing tool.",
    "Every tab switch cost me focus, and every late invoice cost me real money.",
    "This workspace keeps the daily grid, client notes, and billing in one place, with fewer clicks and less upkeep.",
    "It is still early and built by one person. If something is missing, email me and I will read it.",
  ],
  signature: "Yomunseol, founder",
};

export type PolicySection = {
  id: string;
  title: string;
  updated: string;
  paragraphs: string[];
  bullets?: string[];
};

export const POLICY_SECTIONS: PolicySection[] = [
  {
    id: "security",
    title: "Security & Data Protection",
    updated: "Last Updated: November 2026",
    paragraphs: [
      "Your account, workspace, task, client, deal, invoice, and spreadsheet records are sent over HTTPS/TLS and stored in Supabase.",
      "Access is scoped to your authenticated account and active workspace. Session records show device, browser, operating system, approximate location, IP address, and last activity so you can revoke access you do not recognize.",
    ],
    bullets: [
      "During the free beta there are no card payments. When paid plans begin, card payments will be processed by Stripe. LancerMents never receives or stores raw card numbers.",
      "You can request an export or deletion of your data at any time by emailing support@lancerments.online. We aim to reply within five business days.",
    ],
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    updated: "Last Updated: November 2026",
    paragraphs: [
      "We collect the email and password credentials you sign up with, your profile details such as display name, business type, plan, and language, and the workspace data you create: tasks, notes, clients, deals, invoices, and spreadsheets.",
      "We also store session metadata, including device, browser, operating system, approximate location, IP address, and last activity, to support two-factor authentication and session revocation.",
      "We do not sell your data, and we do not use client data for advertising.",
    ],
    bullets: [
      "Data inquiries, exports, and deletion requests: support@lancerments.online.",
    ],
  },
  {
    id: "terms",
    title: "Terms of Use",
    updated: "Last Updated: November 2026",
    paragraphs: [
      "LancerMents is free to use during the public beta. No payment method is required, and no charges are made during this period.",
      "Before any paid billing begins, we will give clear notice and show the price and billing period inside the product. Nothing will be charged automatically without your agreement.",
      "Use the service lawfully. Do not attempt to access another user's workspace, disrupt the service, or upload malicious code.",
      "The beta is provided as-is while features are still changing. You can stop using it at any time and request deletion of your data.",
    ],
  },
];
