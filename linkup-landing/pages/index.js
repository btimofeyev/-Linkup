import Head from 'next/head'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Linkup - Your Social Life, Reimagined</title>
        <meta name="description" content="Stop scrolling and start living. Linkup helps you connect with friends in real life through spontaneous hangouts and planned meetups." />
        <link rel="icon" href="/favicon.ico" />
        {/* Importing the 'Inter' font from Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <main className="main">
        <div className="hero">
          <Image
            src="/images/linkuplogo.png"
            alt="Linkup Logo"
            width={150}
            height={150}
            className="logo"
          />
          <h1 className="title">
            Stop scrolling. <br />
            Start living.
          </h1>
          <p className="tagline">Your social life, reimagined.</p>
          <p className="description">
            Tired of endless group chats that go nowhere? Linkup helps you take your friendships offline.
            Drop a pin for a spontaneous hangout or schedule the perfect meetup with your crew.
          </p>

          <div className="download-buttons">
            <a href="#" className="app-button ios-button">
              Download for iOS
            </a>
            <a href="#" className="app-button android-button">
              Get it on Android
            </a>
          </div>
        </div>

        <div className="features-container">
            <div className="feature">
                <div className="feature-icon">📍</div>
                <h3>Drop a Pin</h3>
                <p>Spur of the moment? Share your location and see who’s free to join.</p>
            </div>
            <div className="feature">
                <div className="feature-icon">🗓️</div>
                <h3>Schedule Meetups</h3>
                <p>Plan the perfect get-together and create lasting memories with your friends.</p>
            </div>
            <div className="feature">
                <div className="feature-icon">🎯</div>
                <h3>Friend Circles</h3>
                <p>Keep it personal. Share your plans with just the right group of people.</p>
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a202c 0%, #11151c 100%);
        }

        .main {
          flex: 1;
          padding: 5rem 0;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
        }

        .hero {
          text-align: center;
          margin-bottom: 6rem;
        }

        .logo {
          margin-bottom: 1.5rem;
          transition: transform 0.3s ease;
        }

        /* Keyframes for the bounce animation */
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        /* Correctly applies the animation on hover */
        .logo:hover {
          animation: bounce 0.6s ease-out;
          cursor: pointer;
        }

        .title {
          margin: 0 0 1rem 0;
          font-size: 4.5rem;
          font-weight: 800;
          color: #f7fafc;
          line-height: 1.1;
        }

        .tagline {
          font-size: 1.75rem;
          font-weight: 600;
          color: #a0aec0;
          margin-bottom: 2rem;
        }

        .description {
          font-size: 1.2rem;
          color: #cbd5e0;
          max-width: 650px;
          margin: 0 auto 3rem auto;
          line-height: 1.7;
        }

        .download-buttons {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .app-button {
          display: inline-block;
          padding: 1rem 2.5rem;
          text-decoration: none;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.2s ease-in-out;
          border: 2px solid transparent;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .app-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
        }

        .ios-button {
          background-image: linear-gradient(45deg, #6a11cb 0%, #2575fc 100%);
          color: white;
        }

        .android-button {
          background: transparent;
          color: white;
          border: 2px solid #4a5568;
        }
        
        .android-button:hover {
            background: #2d3748;
            border-color: #2d3748;
        }

        .features-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 4rem;
        }

        .feature {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-15px) scale(1.03);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }

        .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            color: #e2e8f0;
        }

        .feature h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }

        .feature p {
          color: #a0aec0;
          line-height: 1.6;
          font-size: 1rem;
        }

        .footer {
          padding: 3rem 0;
          text-align: center;
          margin-top: 4rem;
          border-top: 1px solid #2d3748;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: #a0aec0;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #f7fafc;
          text-decoration: underline;
        }

        .footer p {
          color: #718096;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 3.5rem;
          }
          .tagline {
            font-size: 1.5rem;
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