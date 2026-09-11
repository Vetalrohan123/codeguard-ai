export interface Feature {
  number: string;
  title: string;
  description: string;
}

export interface Step {
  number: string;
  title: string;
  description: string;
}

export interface PricingTier {
  name: string;
  description: string;
  price: string;
  period?: string;
  features: string[];
  featured?: boolean;
  cta: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export const siteContent = {
  productName: "ReviewAI",

  navigation: [
    { label: "Product", href: "#product" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],

  hero: {
    eyebrow: "AI CODE REVIEW",
    title: "Review the code. Understand the system.",
    description:
      "ReviewAI reads beyond changed lines to understand the files, functions, callers, and dependencies that give every change its meaning.",
    primaryCta: "Review a PR",
    secondaryCta: "See how it works",
  },

  trust: [
    "GitHub",
    "GitLab",
    "TypeScript",
    "JavaScript",
    "Python",
    "React",
  ],

  features: [
    {
      number: "01",
      title: "Understand full context",
      description:
        "Review changes together with the surrounding files and functions that determine whether a change is actually safe.",
    },
    {
      number: "02",
      title: "Trace what the code touches",
      description:
        "Follow callers, dependencies, and data flow to uncover issues that are invisible when you only inspect the diff.",
    },
    {
      number: "03",
      title: "Explain what matters",
      description:
        "Get focused findings with severity, reasoning, affected code, and practical suggestions instead of noisy comments.",
    },
  ] satisfies Feature[],

  steps: [
    {
      number: "01",
      title: "Connect your repository",
      description:
        "Connect your GitHub repository and choose the pull requests you want reviewed.",
    },
    {
      number: "02",
      title: "Build the context",
      description:
        "ReviewAI examines the change and traces the relevant code around it before forming a conclusion.",
    },
    {
      number: "03",
      title: "Review the findings",
      description:
        "See actionable findings directly alongside the code with the reasoning behind each one.",
    },
  ] satisfies Step[],

  testimonial: {
    quote:
      "It caught a bug that looked completely fine when I reviewed the diff by itself.",
    name: "Alex Morgan",
    role: "Staff Software Engineer",
    company: "Northstar",
  } satisfies Testimonial,

  pricing: [
    {
      name: "Free",
      description: "For trying context-aware review.",
      price: "$0",
      features: [
        "5 PR reviews / month",
        "GitHub integration",
        "Basic findings",
      ],
      cta: "Start free",
    },
    {
      name: "Pro",
      description: "For developers shipping every week.",
      price: "$19",
      period: "/ month",
      features: [
        "Unlimited private reviews",
        "Full repository context",
        "Call-path analysis",
        "Suggested fixes",
      ],
      featured: true,
      cta: "Start reviewing",
    },
    {
      name: "Team",
      description: "For teams that want safer releases.",
      price: "$49",
      period: "/ developer / month",
      features: [
        "Everything in Pro",
        "Team review policies",
        "Shared configuration",
        "Review analytics",
      ],
      cta: "Talk to us",
    },
  ] satisfies PricingTier[],

  cta: {
    title: "Ship with more confidence.",
    description:
      "Let every pull request be reviewed with the context your code actually needs.",
    button: "Review your first PR",
  },
} as const;