import Head from 'next/head'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Linkup - Real connections, real moments</title>
        <meta name="description" content="Connect with friends in real life. Drop pins, plan meetups, and make real connections happen." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <div className="hero">
          <Image 
            src="/images/linkuplogo.png" 
            alt="Linkup Logo" 
            width={200} 
            height={200} 
            className="logo"
          />
          <h1 className="title">Linkup</h1>
          <p className="tagline">Real connections, real moments</p>
          <p className="description">
            Drop pins for spontaneous hangouts or schedule meetups with your circles. 
            Connect with friends in real life, not just online.
          </p>
          
          <div className="download-buttons">
            <a href="#" className="app-button ios-button">
              📱 Download for iOS
            </a>
            <a href="#" className="app-button android-button">
              🤖 Download for Android
            </a>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <h3>📍 Drop a Pin</h3>
            <p>Share your location instantly and invite friends to join you spontaneously</p>
          </div>
          <div className="feature">
            <h3>📅 Schedule Meetups</h3>
            <p>Plan ahead with friends and create memorable experiences together</p>
          </div>
          <div className="feature">
            <h3>👥 Friend Circles</h3>
            <p>Organize your social groups and share with the right people</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/delete-account">Delete Account</a>
          <a href="mailto:support@linkupapp.com">Contact</a>
        </div>
        <p>&copy; 2025 Linkup. All rights reserved.</p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 2rem;
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #FFF8F0;
        }

        .main {
          flex: 1;
          padding: 4rem 0;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .hero {
          text-align: center;
          margin-bottom: 4rem;
        }

        .logo {
          margin-bottom: 2rem;
        }

        .title {
          margin: 0 0 1rem 0;
          font-size: 4rem;
          font-weight: 700;
          color: #333;
        }

        .tagline {
          font-size: 1.5rem;
          color: #666;
          margin-bottom: 2rem;
        }

        .description {
          font-size: 1.2rem;
          color: #555;
          max-width: 600px;
          margin: 0 auto 3rem auto;
          line-height: 1.6;
        }

        .download-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .app-button {
          display: inline-block;
          padding: 1rem 2rem;
          background: #007AFF;
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .app-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
        }

        .android-button {
          background: #34A853;
        }

        .android-button:hover {
          box-shadow: 0 8px 25px rgba(52, 168, 83, 0.3);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .feature {
          text-align: center;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .feature h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .feature p {
          color: #666;
          line-height: 1.6;
        }

        .footer {
          border-top: 1px solid #eee;
          padding: 2rem 0;
          text-align: center;
          margin-top: 4rem;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: #007AFF;
          text-decoration: none;
        }

        .footer-links a:hover {
          text-decoration: underline;
        }

        .footer p {
          color: #666;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 3rem;
          }
          
          .download-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .footer-links {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}