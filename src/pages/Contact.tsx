import PageLayout from "@/components/layouts/PageLayout";
import ContactForm from "@/components/ContactForm";

const Contact = () => {
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

      {/* Contact Form */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Send us a Message</h2>
          <ContactForm />
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;
