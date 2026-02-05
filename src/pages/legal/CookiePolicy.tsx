import LegalPageLayout from "@/components/layouts/LegalPageLayout";

const CookiePolicy = () => {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      lastUpdated="March 1, 2024"
      icon="cookie"
    >
      <section>
        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device when you visit a website. They help websites remember your preferences, track your activity, and improve your experience. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain until deleted or expired).
        </p>
      </section>

      <section>
        <h2>2. Types of Cookies We Use</h2>
        
        <h3>Essential Cookies (Required)</h3>
        <p>
          These cookies are necessary for our website to function properly. They enable core functionality such as:
        </p>
        <ul>
          <li>User authentication and account access</li>
          <li>Session management</li>
          <li>Security features</li>
          <li>Load balancing</li>
        </ul>
        <p>
          You cannot disable these cookies as they are essential for the service to work. These cookies do not track your activity across other websites.
        </p>

        <h3>Analytics Cookies (Optional)</h3>
        <p>
          These cookies help us understand how visitors use our website by collecting anonymous information about:
        </p>
        <ul>
          <li>Pages visited and time spent on each page</li>
          <li>How you arrived at our site</li>
          <li>Browser and device information</li>
          <li>General location (country/city level only)</li>
        </ul>
        <p>
          This data is aggregated and anonymized. It helps us improve our service and identify technical issues.
        </p>

        <h3>Preference Cookies (Optional)</h3>
        <p>
          These cookies remember your preferences and settings, such as:
        </p>
        <ul>
          <li>Theme selection (light/dark mode)</li>
          <li>Language preferences</li>
          <li>Layout customizations</li>
          <li>Display settings</li>
        </ul>
      </section>

      <section>
        <h2>3. Cookie Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border px-4 py-2 text-left">Cookie Name</th>
                <th className="border border-border px-4 py-2 text-left">Type</th>
                <th className="border border-border px-4 py-2 text-left">Purpose</th>
                <th className="border border-border px-4 py-2 text-left">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border px-4 py-2">sb-access-token</td>
                <td className="border border-border px-4 py-2">Essential</td>
                <td className="border border-border px-4 py-2">User authentication</td>
                <td className="border border-border px-4 py-2">1 hour</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">sb-refresh-token</td>
                <td className="border border-border px-4 py-2">Essential</td>
                <td className="border border-border px-4 py-2">Session renewal</td>
                <td className="border border-border px-4 py-2">30 days</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">theme-preference</td>
                <td className="border border-border px-4 py-2">Preference</td>
                <td className="border border-border px-4 py-2">Remember theme choice</td>
                <td className="border border-border px-4 py-2">1 year</td>
              </tr>
              <tr>
                <td className="border border-border px-4 py-2">_ga</td>
                <td className="border border-border px-4 py-2">Analytics</td>
                <td className="border border-border px-4 py-2">Anonymous usage tracking</td>
                <td className="border border-border px-4 py-2">2 years</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>4. Third-Party Cookies</h2>
        <p>
          Some cookies are set by third-party services we use:
        </p>
        <ul>
          <li><strong>Supabase:</strong> For authentication and database services</li>
          <li><strong>Analytics Providers:</strong> For anonymous usage statistics (if enabled)</li>
        </ul>
        <p>
          These third parties have their own cookie policies. We carefully vet all third-party services to ensure they respect user privacy.
        </p>
      </section>

      <section>
        <h2>5. How to Manage Cookies</h2>
        
        <h3>Browser Settings</h3>
        <p>
          Most browsers allow you to control cookies through their settings. You can:
        </p>
        <ul>
          <li>Block all cookies</li>
          <li>Block third-party cookies only</li>
          <li>Delete cookies after each session</li>
          <li>View and delete existing cookies</li>
        </ul>
        <p>
          Here's how to manage cookies in popular browsers:
        </p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
          <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies and site permissions</li>
        </ul>

        <h3>Impact of Disabling Cookies</h3>
        <p>
          If you disable cookies, some features may not work properly:
        </p>
        <ul>
          <li>You may need to log in each time you visit</li>
          <li>Your preferences won't be remembered</li>
          <li>Some interactive features may not function</li>
        </ul>
        <p>
          Essential cookies cannot be disabled as they are necessary for the service to function.
        </p>
      </section>

      <section>
        <h2>6. Do Not Track</h2>
        <p>
          Some browsers have a "Do Not Track" (DNT) feature that signals websites not to track your activity. Currently, there is no industry standard for how to respond to DNT signals. We do not track users across third-party websites for advertising purposes.
        </p>
      </section>

      <section>
        <h2>7. Updates to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology or legal requirements. The "Last updated" date at the top of this page indicates when changes were last made. Continued use of our services constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2>8. Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please visit our <a href="/contact">Contact page</a>.
        </p>
        <p>
          See our <a href="/privacy">Privacy Policy</a> for more information on data handling.
        </p>
      </section>
    </LegalPageLayout>
  );
};

export default CookiePolicy;
