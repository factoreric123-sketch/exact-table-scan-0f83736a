import PageLayout from "@/components/layouts/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Target, Zap, Heart, DollarSign } from "lucide-react";

const AboutUs = () => {
  const values = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast",
      description: "We believe technology should be instant. No loading screens, no waiting, no friction."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Simple",
      description: "Complex solutions create complex problems. We keep things beautifully simple."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Beautiful",
      description: "Design matters. Every pixel, every interaction, every detail is crafted with care."
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Affordable",
      description: "Great technology shouldn't break the bank. We're priced for every restaurant."
    }
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Democratizing Restaurant Technology
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            We're on a mission to make beautiful, powerful digital menus accessible to every restaurant – from corner cafes to fine dining establishments.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p>
              TAPTAB was born from a simple observation: most restaurants were stuck using outdated paper menus or expensive, clunky digital solutions that required technical expertise to manage.
            </p>
            <p>
              We saw talented chefs and restaurant owners spending hours manually updating menus, dealing with printing costs, and watching customers struggle with hard-to-read laminated pages. Meanwhile, the few digital menu solutions available were either prohibitively expensive or looked like they were designed in the early 2000s.
            </p>
            <p>
              We knew there had to be a better way. So we built TAPTAB – a modern, beautiful, and affordable digital menu platform that anyone can use, regardless of technical skill.
            </p>
            <p>
              Today, we're proud to serve over 1,000 restaurants across 15 countries, helping them create stunning digital experiences that their customers love.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">1,000+</div>
              <div className="text-muted-foreground">Restaurants</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">15</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">50K+</div>
              <div className="text-muted-foreground">Monthly Scans</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">12</div>
              <div className="text-muted-foreground">Team Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent text-accent-foreground py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Thousands of Restaurants
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Transform your menu experience today. No credit card required.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth?signup=true">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default AboutUs;
