import { Navbar } from "@/components/section/navbar";
import { Hero } from "@/components/section/hero";
import { Problem } from "@/components/section/problem";
import { Features } from "@/components/section/features";
import { HowItWorks } from "@/components/section/how-it-works";
import { CodeShowcase } from "@/components/section/code-showcase";
import { ReviewPipeline } from "@/components/section/review-pipeline";
import { ReviewFindings } from "@/components/section/review-findings";
import { GitHubIntegration } from "@/components/section/github-integration";
import { FeatureGrid } from "@/components/section/feature-grid";
import { ArchitectureSection } from "@/components/section/architecture-section";
import { MetricsSection } from "@/components/section/metrics-section";
import { SecuritySection } from "@/components/section/security-section";
import { TeamWorkflow } from "@/components/section/team-workflow";
import PricingSection from "@/components/section/pricing-section";
import FAQSection from "@/components/section/faq-section";
import FinalCTA from "@/components/section/FinalCTA";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050506]">
      <Navbar />
      <Hero />
      <Problem />
      <Features />
      <HowItWorks />
      <CodeShowcase />
      <ReviewPipeline />
      <ReviewFindings />
      <GitHubIntegration />
      <FeatureGrid />
      <ArchitectureSection />
      <MetricsSection />
      <SecuritySection />
      <TeamWorkflow />
      <PricingSection />
      <FAQSection />
      <FinalCTA />

    </main>
  );
}