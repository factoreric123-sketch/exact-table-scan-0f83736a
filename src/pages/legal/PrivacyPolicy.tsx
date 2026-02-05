import LegalPageLayout from "@/components/layouts/LegalPageLayout";

const PrivacyPolicy = () => {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="March 1, 2024"
      icon="shield"
    >
      <section>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an account, use our services, or communicate with us. This includes:
        </p>
        <ul>
          <li>Account information (name, email address, password)</li>
          <li>Restaurant information (name, description, menu items, images)</li>
          <li>Usage data (pages visited, features used, time spent)</li>
          <li>Device information (browser type, operating system, IP address)</li>
        </ul>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve our services</li>
          <li>Process your transactions and send related information</li>
          <li>Send you technical notices, updates, and support messages</li>
          <li>Respond to your comments and questions</li>
          <li>Analyze usage patterns to improve user experience</li>
          <li>Detect, prevent, and address technical issues and fraudulent activity</li>
        </ul>
      </section>

      <section>
        <h2>3. Data Storage and Security</h2>
        <p>
          Your data is stored securely using industry-standard encryption. We use Supabase for our backend infrastructure, which provides enterprise-grade security, automatic backups, and GDPR compliance. All data is encrypted both in transit and at rest.
        </p>
        <p>
          While we implement reasonable security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.
        </p>
      </section>

      <section>
        <h2>4. Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to collect information about your browsing activities. This helps us:
        </p>
        <ul>
          <li>Remember your preferences and settings</li>
          <li>Understand how you use our services</li>
          <li>Improve our services and user experience</li>
          <li>Provide relevant content and advertising</li>
        </ul>
        <p>
          You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our service.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>
          We use third-party services to help us operate and improve our platform:
        </p>
        <ul>
          <li><strong>Supabase:</strong> Database and authentication infrastructure</li>
          <li><strong>Analytics Services:</strong> To understand usage patterns (anonymized data)</li>
          <li><strong>Payment Processors:</strong> For subscription billing (we never store credit card data)</li>
        </ul>
        <p>
          These third parties have their own privacy policies governing their use of your information.
        </p>
      </section>

      <section>
        <h2>6. Your Rights (GDPR Compliance)</h2>
        <p>
          If you are located in the European Economic Area (EEA), you have certain rights under the GDPR:
        </p>
        <ul>
          <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
          <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
          <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
          <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
          <li><strong>Right to Restrict Processing:</strong> Request restriction of processing</li>
        </ul>
        <p>
          To exercise these rights, please visit our <a href="/contact">Contact page</a>. We will respond within 30 days.
        </p>
      </section>

      <section>
        <h2>7. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. When you delete your account, we will delete or anonymize your personal information within 90 days, except where we are required by law to retain it longer.
        </p>
      </section>

      <section>
        <h2>8. Children's Privacy</h2>
        <p>
          Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us and we will delete such information.
        </p>
      </section>

      <section>
        <h2>9. Changes to Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Continued use of our services after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>10. Contact Information</h2>
        <p>
          If you have questions or concerns about this Privacy Policy or our data practices, please visit our <a href="/contact">Contact page</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default PrivacyPolicy;
