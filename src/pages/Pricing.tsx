import PageLayout from "@/components/layouts/PageLayout";
import PricingCard from "@/components/PricingCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Pricing = () => {
  const pricingPlans = [
    {
      title: "Basic",
      price: "$0",
      description: "Perfect for trying out our software",
      features: [
        "Unlimited menu creation",
        "Unlimited dishes & categories",
        "Full drag & drop visual editor",
        "30+ color schemes",
        "Preview mode"
      ],
      limitations: [],
      ctaText: "Get Started Free",
      ctaLink: "/auth?signup=true"
    },
    {
      title: "Premium",
      price: "$10",
      description: "For restaurants ready to go live",
      features: [
        "All Basic features",
        "QR code generation",
        "Publish menus publicly",
        "Shareable menu links",
        "Real-time live menu updates",
        "Priority email support"
      ],
      ctaText: "Start 14 Day Free Trial",
      ctaLink: "/auth?signup=true",
      popular: true
    }
  ];

  const faqs = [
    {
      question: "Is the free plan really free forever?",
      answer: "Yes! The free plan lets you create unlimited menus and use the full visual editor forever. No credit card required, no time limits. Upgrade to Premium only when you're ready to publish."
    },
    {
      question: "Can I cancel my Premium subscription anytime?",
      answer: "Absolutely. Cancel anytime with one click from your dashboard. Your menus will remain published until the end of your billing period, then automatically revert to the free plan."
    },
    {
      question: "What happens to my published menus if I cancel Premium?",
      answer: "When you cancel, your menus will be unpublished at the end of your billing period. Your menu data remains safe and accessible in the editor. Upgrade again anytime to republish."
    },
    {
      question: "Can I create multiple restaurants on the free plan?",
      answer: "Yes! The free plan includes unlimited restaurants. You can create and edit as many menus as you want. Premium is only required to publish menus and generate QR codes."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover) securely processed through Stripe."
    },
    {
      question: "Do you offer refunds?",
      answer: "If you cancel within the first 30 days, we'll provide a full refund, no questions asked. After that, you can cancel anytime and your access continues until the end of your billing period."
    }
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-foreground/70">
            Start free, upgrade when you need more. No credit card required.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-lg px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Create your digital menu in minutes. No credit card required.
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Pricing;
