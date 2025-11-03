import PageLayout from "@/components/layouts/PageLayout";
import JobCard from "@/components/JobCard";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Heart, TrendingUp, Briefcase, GraduationCap, Coffee } from "lucide-react";

const Careers = () => {
  const benefits = [
    { icon: <Globe className="w-6 h-6" />, title: "Remote-First", description: "Work from anywhere in the world" },
    { icon: <Heart className="w-6 h-6" />, title: "Health & Wellness", description: "Comprehensive health insurance" },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Equity", description: "Stock options for all employees" },
    { icon: <Briefcase className="w-6 h-6" />, title: "Unlimited PTO", description: "Take time off when you need it" },
    { icon: <GraduationCap className="w-6 h-6" />, title: "Learning Budget", description: "$1,000/year for courses & books" },
    { icon: <Coffee className="w-6 h-6" />, title: "Flexible Schedule", description: "Work when you're most productive" }
  ];

  const openPositions = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Help us build the future of restaurant technology. We're looking for an experienced full-stack engineer who loves creating delightful user experiences.",
      responsibilities: [
        "Build and maintain core platform features using React, TypeScript, and Supabase",
        "Collaborate with designers to implement pixel-perfect UI components",
        "Optimize application performance and scalability",
        "Mentor junior engineers and contribute to engineering best practices"
      ],
      requirements: [
        "5+ years of professional software development experience",
        "Strong proficiency in React, TypeScript, and modern web technologies",
        "Experience with database design and optimization",
        "Excellent communication skills and ability to work remotely"
      ]
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description: "Design beautiful, intuitive experiences that restaurant owners and their customers will love. We're looking for a designer who sweats the details.",
      responsibilities: [
        "Design new features from concept to final implementation",
        "Create and maintain our design system",
        "Conduct user research and usability testing",
        "Collaborate closely with engineers to ensure perfect implementation"
      ],
      requirements: [
        "3+ years of product design experience",
        "Strong portfolio demonstrating UI/UX expertise",
        "Proficiency in Figma or similar design tools",
        "Understanding of front-end development constraints"
      ]
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      description: "Be the voice of our customers. Help restaurant owners succeed with TapMenu and ensure they're getting maximum value from our platform.",
      responsibilities: [
        "Onboard new restaurant customers and ensure smooth setup",
        "Provide ongoing support and training to customers",
        "Identify opportunities for upsells and expansion",
        "Gather customer feedback and work with product team on improvements"
      ],
      requirements: [
        "2+ years of customer success or account management experience",
        "Excellent communication and problem-solving skills",
        "Experience in SaaS or restaurant industry preferred",
        "Self-motivated and comfortable working remotely"
      ]
    },
    {
      title: "Marketing Lead",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      description: "Drive growth and brand awareness for TapMenu. We're looking for a creative marketer who can tell compelling stories and drive results.",
      responsibilities: [
        "Develop and execute marketing strategies across channels",
        "Create compelling content (blog posts, case studies, social media)",
        "Manage SEO, paid advertising, and email marketing campaigns",
        "Analyze marketing metrics and optimize for ROI"
      ],
      requirements: [
        "3+ years of marketing experience, preferably in B2B SaaS",
        "Proven track record of driving growth",
        "Strong writing and content creation skills",
        "Experience with marketing analytics and tools"
      ]
    },
    {
      title: "Sales Representative",
      department: "Sales",
      location: "Remote",
      type: "Full-time",
      description: "Help restaurants discover how TapMenu can transform their operations. We're looking for a motivated sales professional who believes in our mission.",
      responsibilities: [
        "Generate and qualify leads through outbound prospecting",
        "Conduct product demos and handle sales process end-to-end",
        "Build relationships with restaurant owners and decision-makers",
        "Meet and exceed monthly sales targets"
      ],
      requirements: [
        "2+ years of B2B sales experience",
        "Track record of meeting or exceeding quotas",
        "Excellent presentation and negotiation skills",
        "Experience with CRM tools (Salesforce, HubSpot, etc.)"
      ]
    }
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join Our Mission
          </h1>
          <p className="text-xl text-muted-foreground">
            Help us democratize restaurant technology and empower restaurants around the world.
          </p>
        </div>
      </section>

      {/* Culture */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">Why TapMenu?</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert text-center mb-12">
            <p>
              We're a small, passionate team building technology that makes a real difference for restaurant owners. We value craftsmanship, customer empathy, and moving fast without breaking things. If you love solving real problems with elegant solutions, you'll fit right in.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Benefits & Perks</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Open Positions</h2>
          <div className="space-y-4">
            {openPositions.map((job, index) => (
              <JobCard key={index} {...job} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don't See a Perfect Fit?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            We're always looking for talented people. Send us your resume and tell us why you'd be a great addition to the team.
          </p>
          <p className="opacity-90">
            <a href="mailto:careers@tapmenu.com" className="underline">
              careers@tapmenu.com
            </a>
          </p>
        </div>
      </section>
    </PageLayout>
  );
};

export default Careers;
