import Head from "next/head";
import Link from "next/link";

export default function Privacy() {
  return (
    <div className="container">
      <Head>
        <title>Privacy Policy - Linkup</title>
        <meta
          name="description"
          content="Linkup Privacy Policy - How we collect, use and protect your data"
        />
      </Head>

      <main className="main">
        <div className="header">
          <Link href="/">← Back to Home</Link>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 2025</p>
        </div>

        <div className="content">
          <section>
            <h2>1. Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
              <li>
                <strong>Contact Information:</strong> Your phone number, email
                address, and display name
              </li>
              <li>
                <strong>Profile Information:</strong> Profile photo and any
                information you choose to share
              </li>
              <li>
                <strong>Contacts:</strong> With your permission, we access your
                device contacts to help you find friends using Linkup
              </li>
            </ul>

            <h3>Location Information</h3>
            <ul>
              <li>
                <strong>Current Location:</strong> When you drop a pin or create
                a meetup, we collect your current location
              </li>
              <li>
                <strong>Important:</strong> We do NOT store your location
                history. Location data is only used temporarily for active pins
                and meetups
              </li>
              <li>
                <strong>Meetup Locations:</strong> Specific addresses you choose
                for scheduled meetups
              </li>
            </ul>

            <h3>Usage Information</h3>
            <ul>
              <li>App usage patterns and feature interactions</li>
              <li>
                Device information (device type, operating system version)
              </li>
              <li>Log data for troubleshooting and security purposes</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>
                <strong>Core Features:</strong> Enable pin dropping, meetup
                scheduling, and friend connections
              </li>
              <li>
                <strong>Notifications:</strong> Send push notifications about
                meetups and friend activities
              </li>
              <li>
                <strong>Friend Discovery:</strong> Help you find friends who are
                also using Linkup
              </li>
              <li>
                <strong>Safety:</strong> Prevent abuse, spam, and ensure
                platform security
              </li>
              <li>
                <strong>Improvement:</strong> Analyze usage patterns to improve
                the app (anonymized data only)
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing</h2>
            <p>
              <strong>We do NOT sell your personal information.</strong>
            </p>

            <h3>What We Share:</h3>
            <ul>
              <li>
                <strong>With Your Friends:</strong> Information you choose to
                share through pins and meetups
              </li>
              <li>
                <strong>Service Providers:</strong> Trusted third parties that
                help us operate the app (with strict privacy agreements)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect safety
              </li>
            </ul>

            <h3>What We Don't Share:</h3>
            <ul>
              <li>Your contact list with other users</li>
              <li>Your location history</li>
              <li>
                Private messages or personal information without your consent
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <ul>
              <li>End-to-end encryption for sensitive communications</li>
              <li>
                Secure data transmission using industry-standard protocols
              </li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data on a need-to-know basis</li>
            </ul>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <ul>
              <li>
                <strong>Active Pins:</strong> Automatically deleted after
                expiration (typically 24 hours)
              </li>
              <li>
                <strong>Meetup Data:</strong> Deleted 30 days after the meetup
                date
              </li>
              <li>
                <strong>Account Data:</strong> Retained while your account is
                active
              </li>
              <li>
                <strong>Deletion:</strong> You can delete your account and all
                associated data at any time
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct your information
              </li>
              <li>
                <strong>Deletion:</strong> Delete your account and personal data
              </li>
              <li>
                <strong>Opt-out:</strong> Disable notifications or certain
                features
              </li>
              <li>
                <strong>Data Portability:</strong> Export your data in a
                standard format
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Children's Privacy</h2>
            <p>
              Linkup is not intended for users under 13 years old. We do not
              knowingly collect personal information from children under 13. If
              we discover we have collected such information, we will delete it
              immediately.
            </p>
          </section>

          <section>
            <h2>8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you
              of significant changes through the app or email. Your continued
              use of Linkup after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2>9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or your data:</p>
            <ul>
              <li>Email: support@joinlinkup.app</li>
              <li>In-app support: Settings → Help & Support</li>
            </ul>
          </section>
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 2rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
          background: #fff8f0;
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
          color: #007aff;
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
          border-bottom: 2px solid #007aff;
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
  );
}
