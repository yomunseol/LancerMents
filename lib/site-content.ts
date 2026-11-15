export const PAYMENT_NOTE =
  "When paid plans begin, card payments will be handled by Stripe. LancerMents never stores raw card numbers.";

export const FOUNDER_NOTE = {
  eyebrow: "A note from the founder",
  heading:
    "I built LancerMents because running solo shouldn’t feel like a second job.",
  paragraphs: [
    "I got tired of duct-taping spreadsheets, timers, and clunky invoicing tools together just to get paid for client work. Most tools are bloated for massive agencies, so I built one calm workspace for freelancers to track tasks, manage clients, and send clean invoices without the busywork.",
    "It is still early and built by one person. Everything is free while we are in beta—if something feels missing, email me and I will actually read it.",
  ],
  signature: "— Yomunseol, founder",
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
