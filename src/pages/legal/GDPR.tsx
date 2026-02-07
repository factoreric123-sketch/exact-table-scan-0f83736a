import LegalPageLayout from "@/components/layouts/LegalPageLayout";
import { Link } from "react-router-dom";

const GDPR = () => {
  return (
    <LegalPageLayout
      title="GDPR Compliance"
      lastUpdated="March 1, 2024"
      icon="shield"
    >
      <section>
        <h2>Our Commitment to GDPR Compliance</h2>
        <p>
          We are fully committed to complying with the General Data Protection Regulation (GDPR) and protecting the privacy rights of individuals in the European Economic Area (EEA). This page explains your rights under GDPR and how we handle your personal data.
        </p>
      </section>

      <section>
        <h2>Your Rights Under GDPR</h2>
        <p>
          If you are located in the EEA, you have the following rights regarding your personal data:
        </p>

        <h3>1. Right to Access</h3>
        <p>
          You have the right to request a copy of all personal data we hold about you. This includes:
        </p>
        <ul>
          <li>Account information (name, email)</li>
          <li>Restaurant data (menu items, images, descriptions)</li>
          <li>Usage logs and analytics data</li>
          <li>Communication history</li>
        </ul>
        <p>
          We will provide this information in a commonly used, machine-readable format within 30 days of your request.
        </p>

        <h3>2. Right to Rectification</h3>
        <p>
          You have the right to correct inaccurate or incomplete personal data. You can update most information directly through your account settings. For data you cannot update yourself, please visit our <a href="/contact">Contact page</a>.
        </p>

        <h3>3. Right to Erasure ("Right to be Forgotten")</h3>
        <p>
          You have the right to request deletion of your personal data in certain circumstances:
        </p>
        <ul>
          <li>The data is no longer necessary for the purpose it was collected</li>
          <li>You withdraw consent (where consent was the basis for processing)</li>
          <li>You object to processing and there are no overriding legitimate grounds</li>
          <li>The data was unlawfully processed</li>
          <li>The data must be erased to comply with a legal obligation</li>
        </ul>
        <p>
          Upon request, we will delete your data within 30 days, except where we have a legal obligation to retain it (e.g., tax records, fraud prevention).
        </p>

        <h3>4. Right to Data Portability</h3>
        <p>
          You have the right to receive your personal data in a structured, commonly used, and machine-readable format. You can also request that we transfer this data directly to another service provider where technically feasible.
        </p>
        <p>
          We provide data export functionality in your account dashboard. Exported data includes:
        </p>
        <ul>
          <li>Restaurant information (JSON format)</li>
          <li>Menu data (CSV and JSON)</li>
          <li>Images (downloadable ZIP file)</li>
          <li>Account settings</li>
        </ul>

        <h3>5. Right to Object</h3>
        <p>
          You have the right to object to processing of your personal data where:
        </p>
        <ul>
          <li>We're processing data based on legitimate interests</li>
          <li>The processing is for direct marketing purposes</li>
          <li>The processing is for scientific/historical research or statistical purposes</li>
        </ul>
        <p>
          Upon objection, we will stop processing unless we can demonstrate compelling legitimate grounds that override your interests.
        </p>

        <h3>6. Right to Restrict Processing</h3>
        <p>
          You have the right to request restriction of processing in certain circumstances:
        </p>
        <ul>
          <li>You contest the accuracy of the data (restriction until accuracy is verified)</li>
          <li>Processing is unlawful but you don't want erasure</li>
          <li>We no longer need the data but you need it for legal claims</li>
          <li>You've objected to processing pending verification of legitimate grounds</li>
        </ul>

        <h3>7. Right to Withdraw Consent</h3>
        <p>
          Where we process your data based on consent, you have the right to withdraw that consent at any time. This will not affect the lawfulness of processing before withdrawal.
        </p>

        <h3>8. Right to Lodge a Complaint</h3>
        <p>
          You have the right to lodge a complaint with your local data protection authority if you believe we've violated your data protection rights. However, we encourage you to contact us first so we can address your concerns directly.
        </p>
      </section>

      <section>
        <h2>How to Exercise Your Rights</h2>
        <p>
          To exercise any of these rights, you can:
        </p>
        <ul>
          <li>Use the self-service tools in your account dashboard</li>
          <li>Submit a request through our <a href="/contact">Contact page</a></li>
        </ul>
        <p>
          We will respond to all requests within 30 days. In some cases, we may need to verify your identity before processing your request.
        </p>
      </section>

      <section>
        <h2>Legal Basis for Processing</h2>
        <p>
          We process your personal data under the following legal bases:
        </p>
        <ul>
          <li><strong>Contract Performance:</strong> Processing necessary to provide our services</li>
          <li><strong>Consent:</strong> Where you've given explicit consent (e.g., marketing emails)</li>
          <li><strong>Legitimate Interests:</strong> For analytics, security, and service improvement</li>
          <li><strong>Legal Obligation:</strong> Where required by law (e.g., tax records)</li>
        </ul>
      </section>

      <section>
        <h2>Data Storage and Transfers</h2>
        <p>
          Your data is stored in secure data centers within the European Union. In some cases, data may be transferred to countries outside the EEA for technical support or service provision. When this occurs, we ensure adequate safeguards are in place:
        </p>
        <ul>
          <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
          <li>Adequacy decisions recognizing equivalent data protection standards</li>
          <li>Encryption and security measures for data in transit and at rest</li>
        </ul>
      </section>

      <section>
        <h2>Data Protection Officer</h2>
        <p>
          For questions about GDPR compliance or to exercise your rights, please visit our <a href="/contact">Contact page</a>.
        </p>
      </section>


      <section>
        <h2>Data Breach Notification</h2>
        <p>
          In the event of a data breach that poses a risk to your rights and freedoms, we will:
        </p>
        <ul>
          <li>Notify the appropriate supervisory authority within 72 hours</li>
          <li>Notify affected individuals without undue delay</li>
          <li>Provide clear information about the breach and steps we're taking</li>
          <li>Offer guidance on protecting yourself from potential harm</li>
        </ul>
      </section>

      <section>
        <h2>Updates to GDPR Compliance</h2>
        <p>
          We regularly review and update our GDPR compliance measures. Any material changes will be communicated via email and reflected in this document. The "Last updated" date at the top indicates the most recent revision.
        </p>
      </section>

      <section>
        <h2>Additional Resources</h2>
        <p>
          For more information about our data practices, please review:
        </p>
        <ul>
          <li><Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link></li>
          <li><Link to="/cookies" className="text-accent hover:underline">Cookie Policy</Link></li>
          <li><Link to="/terms" className="text-accent hover:underline">Terms of Service</Link></li>
        </ul>
      </section>
    </LegalPageLayout>
  );
};

export default GDPR;
