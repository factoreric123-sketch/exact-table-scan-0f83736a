import PageLayout from "@/components/layouts/PageLayout";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, Phone } from "lucide-react";

const Contact = () => {
  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "General Inquiries",
      description: "For general questions and information",
      contact: "hello@taptab.com"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Customer Support",
      description: "Need help with your account?",
      contact: "support@taptab.com"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Sales",
      description: "Interested in Enterprise plans?",
      contact: "sales@taptab.com"
    }
  ];

  return (
    <PageLayout>
      {/* Hero */}
      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground">
            Have a question? We'd love to hear from you. Send us a message and we'll respond within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
              <ContactForm />
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Other Ways to Reach Us</h2>
              {contactMethods.map((method, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        {method.icon}
                      </div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                    </div>
                    <p className="text-black">{method.description}</p>
                  </CardHeader>
                  <CardContent>
                    <a href={`mailto:${method.contact}`} className="text-accent hover:underline font-medium">
                      {method.contact}
                    </a>
                  </CardContent>
                </Card>
              ))}

              {/* Response Time */}
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-white">
                    <span className="font-semibold ">Average response time:</span> We typically respond to all inquiries within 24 hours during business days (Monday-Friday, 9am-6pm EST).
                  </p>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Location</CardTitle>
                  <p className="text-black">We're a fully remote team</p>
                </CardHeader>
                <CardContent>
                  <p className="text-black">
                    Our distributed team works from around the world, allowing us to provide support across multiple time zones.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
