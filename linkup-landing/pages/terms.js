import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <div className="container">
      <Head>
        <title>Terms of Service - Linkup</title>
        <meta name="description" content="Linkup Terms of Service - Rules and guidelines for using our app" />
      </Head>

      <main className="main">
        <div className="header">
          <Link href="/">← Back to Home</Link>
          <h1>Terms of Service</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By downloading, installing, or using Linkup ("the App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.</p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>Linkup is a mobile application that enables users to:</p>
            <ul>
              <li>Share their current location with friends through "pins"</li>
              <li>Schedule meetups and events with selected friend groups</li>
              <li>Organize contacts into social circles</li>
              <li>Receive notifications about friends' activities and meetups</li>
            </ul>
          </section>

          <section>
            <h2>3. User Accounts and Eligibility</h2>
            <ul>
              <li>You must be at least 13 years old to use Linkup</li>
              <li>You must provide accurate and complete information when creating your account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You may not create multiple accounts or share your account with others</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <h3>You agree to use Linkup only for lawful purposes and in accordance with these Terms. You agree NOT to:</h3>
            <ul>
              <li>Use the App to harass, bully, or intimidate other users</li>
              <li>Share false, misleading, or inappropriate content</li>
              <li>Violate any local, state, national, or international laws</li>
              <li>Attempt to gain unauthorized access to the App or other users' accounts</li>
              <li>Use the App to spam or send unsolicited communications</li>
              <li>Share or distribute malicious software or harmful content</li>
              <li>Impersonate another person or entity</li>
              <li>Use the App for commercial purposes without our written consent</li>
            </ul>
          </section>

          <section>
            <h2>5. Location Services and Privacy</h2>
            <ul>
              <li>Linkup requires access to your device's location services to function properly</li>
              <li>Location data is only collected when you actively use location-based features</li>
              <li>We do not store your location history permanently</li>
              <li>You can control location sharing through your device settings</li>
              <li>See our Privacy Policy for detailed information about data collection and use</li>
            </ul>
          </section>

          <section>
            <h2>6. Content and Intellectual Property</h2>
            <ul>
              <li>You retain ownership of content you create and share through Linkup</li>
              <li>By sharing content, you grant us a license to display and distribute it within the App</li>
              <li>You are responsible for ensuring you have the right to share any content you post</li>
              <li>Linkup and its original content, features, and functionality are owned by us and protected by intellectual property laws</li>
            </ul>
          </section>

          <section>
            <h2>7. Safety and Security</h2>
            <ul>
              <li>Always use caution when meeting people in person</li>
              <li>Meet in public places and inform trusted friends about your plans</li>
              <li>Trust your instincts and leave any situation that feels unsafe</li>
              <li>Report any suspicious or inappropriate behavior through the App</li>
              <li>We are not responsible for in-person meetings or interactions facilitated through the App</li>
            </ul>
          </section>

          <section>
            <h2>8. Prohibited Activities</h2>
            <p>The following activities are strictly prohibited:</p>
            <ul>
              <li>Creating fake pins or meetups</li>
              <li>Using the App to stalk or track other users without consent</li>
              <li>Sharing inappropriate or offensive content</li>
              <li>Attempting to reverse engineer or hack the App</li>
              <li>Using automated tools or bots to interact with the App</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2>9. Termination</h2>
            <ul>
              <li>You may delete your account at any time through the App settings</li>
              <li>We may suspend or terminate your account for violations of these Terms</li>
              <li>Upon termination, your access to the App will cease immediately</li>
              <li>We may retain certain information as required by law or for legitimate business purposes</li>
            </ul>
          </section>

          <section>
            <h2>10. Disclaimers and Limitation of Liability</h2>
            <ul>
              <li>Linkup is provided "as is" without warranties of any kind</li>
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability shall not exceed the amount paid by you for the App (if any)</li>
              <li>Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you</li>
            </ul>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Linkup and its affiliates from any claims, damages, or expenses arising from your use of the App or violation of these Terms.</p>
          </section>

          <section>
            <h2>12. Changes to Terms</h2>
            <p>We may update these Terms periodically. We will notify you of material changes through the App or email. Your continued use after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved in the courts of [Your Jurisdiction].</p>
          </section>

          <section>
            <h2>14. Contact Information</h2>
            <p>If you have questions about these Terms:</p>
            <ul>
              <li>Email: legal@linkupapp.com</li>
              <li>In-app support: Settings → Help & Support</li>
            </ul>
          </section>

          <section>
            <h2>15. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue to be valid and enforceable.</p>
          </section>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #FFF8F0;
        }

        .main {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 0;
        }

        .header {
          margin-bottom: 3rem;
        }

        .header a {
          color: #007AFF;
          text-decoration: none;
          font-size: 1.1rem;
        }

        .header a:hover {
          text-decoration: underline;
        }

        .header h1 {
          font-size: 2.5rem;
          color: #333;
          margin: 1rem 0 0.5rem 0;
        }

        .last-updated {
          color: #666;
          font-style: italic;
        }

        .content {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        section {
          margin-bottom: 2.5rem;
        }

        h2 {
          color: #333;
          font-size: 1.5rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #007AFF;
          padding-bottom: 0.5rem;
        }

        h3 {
          color: #444;
          font-size: 1.2rem;
          margin: 1.5rem 0 0.5rem 0;
        }

        ul {
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        li {
          margin-bottom: 0.5rem;
        }

        strong {
          color: #333;
        }

        p {
          line-height: 1.6;
          color: #555;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .content {
            padding: 2rem 1rem;
          }
          
          .header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
}