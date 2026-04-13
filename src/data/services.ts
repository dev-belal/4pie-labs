import {
  Bot,
  Zap,
  TrendingUp,
  Shield,
  Cpu,
  MessageSquare,
  PenTool,
  Palette,
  Megaphone,
  Sparkles,
  Image as ImageIcon,
  Share2,
  Globe,
  Target,
  MousePointerClick,
  Mail,
  FileText,
  Magnet,
  type LucideIcon,
} from "lucide-react";

export type ServiceCategory = "AI Systems" | "Design Creatives" | "Digital Marketing";

export interface Service {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  category: ServiceCategory;
  details?: string;
  points: string[];
  seoDesc: string;
}

export const categories: ServiceCategory[] = [
  "AI Systems",
  "Design Creatives",
  "Digital Marketing",
];

/**
 * URL-safe slugs for each category. Used by the footer links and the
 * `/services?category=<slug>` query param so visitors can deep-link to
 * a pre-filtered catalog.
 */
export const SERVICE_CATEGORY_SLUGS = {
  "AI Systems": "ai-systems",
  "Design Creatives": "design",
  "Digital Marketing": "marketing",
} as const satisfies Record<ServiceCategory, string>;

export function categoryFromSlug(slug: string): ServiceCategory | null {
  for (const [cat, s] of Object.entries(SERVICE_CATEGORY_SLUGS)) {
    if (s === slug) return cat as ServiceCategory;
  }
  return null;
}

export const services: Service[] = [
  {
    title: "AI Operating Systems",
    desc: "Custom AI layers that sit on top of your existing workflows, automating every repetitive task.",
    icon: Bot,
    color: "from-blue-500 to-cyan-400",
    category: "AI Systems",
    details:
      "Full integration with your legacy tools. Secure, private, and managed by our team.",
    points: [
      "Seamlessly integrates with Slack, HubSpot, and Gmail",
      "Automates 80% of repetitive administrative tasks",
      "Proprietary AI filters for high-accuracy document routing",
      "Real-time conflict resolution and data synchronization",
      "Zero-downtime deployment on existing infrastructure",
    ],
    seoDesc:
      "Transform your agency with a custom AI Operating System. Our enterprise-grade solutions automate business logic, reduce manual data entry, and enable autonomous task execution across your entire tech stack.",
  },
  {
    title: "Workflow Automation",
    desc: "End-to-end automation for sales, finance, and operations. Scale without increasing headcount.",
    icon: Zap,
    color: "from-purple-500 to-pink-400",
    category: "AI Systems",
    details: "Eliminate bottleneck processes and reduce human error by up to 99%.",
    points: [
      "Advanced Zapier and Make.com architecture design",
      "Custom API connective tissue for disjointed tools",
      "Automated invoicing and expense tracking sequences",
      "Lead distribution logic and CRM auto-population",
      "Reduction in operational overhead by up to 45%",
    ],
    seoDesc:
      "Scalable workflow automation solutions designed for modern agencies. We build robust, error-free systems that handle complex business processes, allowing your team to focus on high-level growth and strategy.",
  },
  {
    title: "Data Intelligence",
    desc: "Turn your fragmented data into actionable insights with custom AI models and dashboards.",
    icon: TrendingUp,
    color: "from-orange-500 to-yellow-400",
    category: "AI Systems",
    details: "Predictive analytics for agency growth and performance forecasting.",
    points: [
      "Real-time visual dashboards with Looker and Tableau",
      "Predictive churn analysis and customer LTV modeling",
      "Automated reporting for stakeholders and clients",
      "Natural Language Processing for sentiment analysis",
      "Data cleansing and standardization pipelines",
    ],
    seoDesc:
      "Unlock the power of your data with AI-driven intelligence. Our custom models identify trends, predict outcomes, and provide the clarity needed for data-backed decision making in a competitive market.",
  },
  {
    title: "Autonomous Agents",
    desc: "Deploy AI agents that handle customer support, lead qualification, and document processing 24/7.",
    icon: Cpu,
    color: "from-green-500 to-emerald-400",
    category: "AI Systems",
    details: "Trained on your brand voice and data. Reliable high-performance execution.",
    points: [
      "24/7 lead qualification and meeting scheduling",
      "Context-aware customer support across multi-channels",
      "Automated document reading and data extraction",
      "Multilingual support with native-level fluency",
      "Smart escalation triggers for human intervention",
    ],
    seoDesc:
      "Deploy intelligent autonomous agents to handle the heavy lifting. From instant customer support to automated lead scoring, our AI agents provide consistent, high-quality performance around the clock.",
  },
  {
    title: "Secure AI Integration",
    desc: "Enterprise-grade security for your AI systems. We ensure your data stays yours.",
    icon: Shield,
    color: "from-red-500 to-rose-400",
    category: "AI Systems",
    details: "HIPAA and GDPR compliant deployments for sensitive agency data.",
    points: [
      "Private cloud deployments (AWS, Azure, GCP)",
      "End-to-end encryption for all data in transit and rest",
      "Granular access control and audit logging",
      "PII detection and automated data masking",
      "Compliance-first architecture for regulated industries",
    ],
    seoDesc:
      "Scalable and secure AI integrations for enterprise. We prioritize data privacy and security, ensuring your AI initiatives meet the highest global standards for compliance and protection.",
  },
  {
    title: "Cognitive Support",
    desc: "AI-driven support systems that understand context and resolve issues faster than humans.",
    icon: MessageSquare,
    color: "from-indigo-500 to-blue-400",
    category: "AI Systems",
    details: "Deep understanding of complex queries and sentiment analysis.",
    points: [
      "Human-like conversation flow and context memory",
      "Instant resolution for 70% of common support tickets",
      "Automated post-interaction summary and logging",
      "Seamless hand-off to human support teams",
      "Continuous learning from user feedback loops",
    ],
    seoDesc:
      "Revolutionize your customer experience with cognitive AI support. Our systems go beyond simple keywords, understanding intent and sentiment to provide helpful, accurate, and instant resolutions.",
  },
  {
    title: "Content Creation",
    desc: "High-end visual content tailored for your brand's voice and audience engagement.",
    icon: PenTool,
    color: "from-pink-500 to-rose-400",
    category: "Design Creatives",
    details: "Video, social, and print-ready assets at scale.",
    points: [
      "Stunning 3D renders and interactive visualizations",
      "Cinematic video editing and motion graphics",
      "High-engagement carousel and social designs",
      "Custom illustrations and brand-aligned assets",
      "Fast turnaround times without quality sacrifice",
    ],
    seoDesc:
      "Premium content creation services to amplify your brand. We combine high-end design principles with modern technology to deliver visual assets that capture attention and drive meaningful engagement.",
  },
  {
    title: "Brand Optimization",
    desc: "Refining your visual identity for maximum impact and cross-platform consistency.",
    icon: Palette,
    color: "from-amber-500 to-orange-400",
    category: "Design Creatives",
    details: "Visual guidelines and multi-channel style-books.",
    points: [
      "Comprehensive brand audit and gap analysis",
      "Modern typography and color palette refinement",
      "Scalable design systems for growing teams",
      "Consistent logo and asset usage guidelines",
      "Strategic visual positioning against competitors",
    ],
    seoDesc:
      "Elevate your brand with strategic visual optimization. We refine your identity to ensure consistency, professionalism, and impact across every touchpoint of your customer journey.",
  },
  {
    title: "Ad Creatives",
    desc: "High-converting ad designs optimized for social media and display networks.",
    icon: Megaphone,
    color: "from-blue-600 to-indigo-500",
    category: "Design Creatives",
    details: "Performance-focused creative that converts visitors into customers.",
    points: [
      "High-CTR thumbnail and banner designs",
      "A/B testing-ready creative variations",
      "Data-backed layout and copy structure",
      "Platform-specific optimization (FB, IG, TikTok)",
      "Scalable production for large-scale campaigns",
    ],
    seoDesc:
      "Performance-driven ad creatives that deliver ROI. Our designs aren't just beautiful—they're scientifically engineered to stop the scroll, increase click-through rates, and drive conversions.",
  },
  {
    title: "Content Optimisation",
    desc: "Enhancing existing assets for better performance and visual appeal.",
    icon: Sparkles,
    color: "from-cyan-500 to-blue-400",
    category: "Design Creatives",
    details: "Upscaling, retouching, and repurposing content using AI.",
    points: [
      "AI-driven upscaling and image enhancement",
      "Automated color correction and retouching",
      "Repurposing long-form content into short clips",
      "SEO-focused metadata and alt-text generation",
      "Batch processing for large content libraries",
    ],
    seoDesc:
      "Modernize your existing assets with AI content optimization. We breathe new life into your content library, improving quality and performance while maximizing the value of your existing work.",
  },
  {
    title: "AI Content Generation",
    desc: "Leveraging state-of-the-art AI to create unique assets at unprecedented scale.",
    icon: ImageIcon,
    color: "from-violet-500 to-purple-400",
    category: "Design Creatives",
    details: "Custom models for consistent character and style generation.",
    points: [
      "Custom stable diffusion and Midjourney pipelines",
      "Automated character and style consistency",
      "Prompt engineering for unique brand visuals",
      "Rapid ideation and mood board generation",
      "High-resolution output for print and web",
    ],
    seoDesc:
      "Scale your creative production with AI content generation. We build custom pipelines that generate unique, high-quality visuals on demand, perfectly aligned with your brand identity.",
  },
  {
    title: "Social Media Design",
    desc: "Dynamic social assets designed to stop the scroll and drive interaction.",
    icon: Share2,
    color: "from-emerald-500 to-teal-400",
    category: "Design Creatives",
    details: "Motion graphics and static designs for all major platforms.",
    points: [
      "Trend-aware social content strategy",
      "Engagement-focused story and reel designs",
      "Consistent community-building aesthetics",
      "Interactive and shareable mini-infographics",
      "Platform-native aspect ratio optimizations",
    ],
    seoDesc:
      "Stand out in a crowded feed with premium social media design. Our social-first approach ensures your brand stays relevant, engaging, and visually stunning across every platform.",
  },
  {
    title: "SEO Optimization",
    desc: "Dominating search results with data-driven on-page and technical SEO strategies.",
    icon: Globe,
    color: "from-blue-500 to-sky-400",
    category: "Digital Marketing",
    details: "Semantic SEO and AI-driven content clusters for rapid ranking.",
    points: [
      "Comprehensive technical SEO and site audits",
      "AI-powered keyword research and gap analysis",
      "High-authority backlink strategy and outreach",
      "On-page optimization for E-E-A-T standards",
      "Advanced Core Web Vitals performance tuning",
    ],
    seoDesc:
      "Dominate the search engine results pages with our advanced SEO optimization services. We use data-driven strategies and AI tools to increase visibility, drive organic traffic, and build long-term authority.",
  },
  {
    title: "PPC Management",
    desc: "Maximizing ROI with precision-targeted paid search and social advertising.",
    icon: Target,
    color: "from-rose-500 to-red-400",
    category: "Digital Marketing",
    details: "Automated bidding and real-time creative optimization.",
    points: [
      "Strategic campaign structure and budget scaling",
      "Automated bidding and script optimization",
      "Continuous ad copy and creative testing",
      "Advanced audience targeting and retargeting",
      "Transparent ROI and performance dashboards",
    ],
    seoDesc:
      "Accelerate your growth with expert PPC management. Our performance-first approach ensures every dollar is spent efficiently, delivering high-quality leads and measurable ROI across all paid channels.",
  },
  {
    title: "Social Media Marketing",
    desc: "Building communities and brand loyalty through strategic social presence.",
    icon: MousePointerClick,
    color: "from-indigo-500 to-violet-400",
    category: "Digital Marketing",
    details: "High-engagement campaigns and community management.",
    points: [
      "Strategic social media growth roadmaps",
      "Viral-potential campaign concepts and execution",
      "Active community management and interaction",
      "Influencer partnership and collab strategies",
      "Deep social listening and sentiment tracking",
    ],
    seoDesc:
      "Scale your digital footprint with strategic social media marketing. We go beyond simple posting, building active communities and high-engagement campaigns that turn followers into brand advocates.",
  },
  {
    title: "Email Marketing",
    desc: "High-conversion lifecycle marketing and automated nurture sequences.",
    icon: Mail,
    color: "from-orange-500 to-amber-400",
    category: "Digital Marketing",
    details: "Hyper-personalization through AI user profiling.",
    points: [
      "Advanced segmentation and lifecycle mapping",
      "High-converting automated nurture flows",
      "Dynamic personalization using AI insights",
      "A/B testing for subject lines and CTA layout",
      "Compliance-first list hygiene and deliverability",
    ],
    seoDesc:
      "Drive massive ROI with automated email marketing. Our lifecycle-focused strategies nurture leads through the funnel, delivering personalized value that increases lifetime customer value and retention.",
  },
  {
    title: "Content Strategy",
    desc: "Comprehensive roadmaps for multi-channel growth and authority building.",
    icon: FileText,
    color: "from-emerald-500 to-green-400",
    category: "Digital Marketing",
    details: "Long-term growth loops and virality-focused planning.",
    points: [
      "Content gap analysis and competitive auditing",
      "Multi-channel distribution and repurposing plan",
      "Voice-of-Customer-driven topical selection",
      "Long-term SEO and authority building roadmap",
      "Performance-based content ROI measurement",
    ],
    seoDesc:
      "Build a content engine that drives sustainable growth. Our holistic content strategies align your message with user intent, building trust and authority across every digital touchpoint.",
  },
  {
    title: "Conversion Optimization",
    desc: "Scientific A/B testing and UX refinements to turn visitors into customers.",
    icon: Magnet,
    color: "from-purple-500 to-indigo-400",
    category: "Digital Marketing",
    details: "Data-driven UI/UX changes to maximize conversion rates.",
    points: [
      "In-depth heatmapping and user session analysis",
      "Scientific A/B and Multivariate testing",
      "Checkout and landing page friction reduction",
      "Persuasive copywriting and psychological triggers",
      "Significant improvements in lower-funnel ROI",
    ],
    seoDesc:
      "Maximize every visitor with data-driven conversion rate optimization. We use scientific testing and psychological triggers to remove friction and turn more of your traffic into loyal, paying customers.",
  },
];
