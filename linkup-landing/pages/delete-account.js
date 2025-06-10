import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'

export default function DeleteAccount() {
  const [email, setEmail] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would send to your backend
    console.log('Account deletion request:', { email, reason })
    setSubmitted(true)
  }

  return (
    <div className="container">
      <Head>
        <title>Delete Account - Linkup</title>
        <meta name="description" content="Request to delete your Linkup account and all associated data" />
      </Head>

      <main className="main">
        <div className="header">
          <Link href="/">← Back to Home</Link>
          <h1>Delete Account</h1>
        </div>

        <div className="content">
          {!submitted ? (
            <>
              <div className="warning">
                <h2>⚠️ Account Deletion</h2>
                <p>Deleting your account will permanently remove:</p>
                <ul>
                  <li>Your profile and account information</li>
                  <li>All pins and meetups you've created</li>
                  <li>Your friend circles and connections</li>
                  <li>All app data associated with your account</li>
                </ul>
                <p><strong>This action cannot be undone.</strong></p>
              </div>

              <form onSubmit={handleSubmit} className="deletion-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your account email"
                    required
                  />
                  <small>Enter the email address associated with your Linkup account</small>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Deletion (Optional)</label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve by sharing why you're leaving"
                    rows="4"
                  />
                </div>

                <button type="submit" className="delete-button">
                  Request Account Deletion
                </button>
              </form>

              <div className="alternatives">
                <h3>Before you go...</h3>
                <p>Consider these alternatives:</p>
                <ul>
                  <li><strong>Take a break:</strong> You can simply log out and return anytime</li>
                  <li><strong>Privacy settings:</strong> Adjust what data you share</li>
                  <li><strong>Contact support:</strong> We're here to help with any issues</li>
                </ul>
                <p>Contact us: <a href="mailto:support@linkupapp.com">support@linkupapp.com</a></p>
              </div>
            </>
          ) : (
            <div className="success">
              <h2>✅ Deletion Request Submitted</h2>
              <p>We've received your account deletion request for <strong>{email}</strong>.</p>
              
              <div className="next-steps">
                <h3>What happens next:</h3>
                <ol>
                  <li>We'll verify your identity via email</li>
                  <li>Your account will be deleted within 30 days</li>
                  <li>You'll receive confirmation once complete</li>
                  <li>Some data may be retained for legal/safety purposes as outlined in our Privacy Policy</li>
                </ol>
              </div>

              <p>If you change your mind, contact us immediately at <a href="mailto:support@linkupapp.com">support@linkupapp.com</a></p>
            </div>
          )}
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

        .content {
          background: white;
          padding: 3rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .warning {
          background: #FFF3CD;
          border: 1px solid #FFEAA7;
          border-radius: 8px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .warning h2 {
          color: #856404;
          margin-bottom: 1rem;
        }

        .warning ul {
          margin: 1rem 0;
        }

        .warning li {
          margin-bottom: 0.5rem;
        }

        .deletion-form {
          margin-bottom: 3rem;
        }

        .form-group {
          margin-bottom: 2rem;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 1rem;
          border: 2px solid #E1E5E9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #007AFF;
        }

        .form-group small {
          display: block;
          color: #666;
          margin-top: 0.5rem;
          font-size: 0.9rem;
        }

        .delete-button {
          background: #DC3545;
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .delete-button:hover {
          background: #C82333;
        }

        .alternatives {
          background: #E8F5E8;
          border-radius: 8px;
          padding: 2rem;
        }

        .alternatives h3 {
          color: #155724;
          margin-bottom: 1rem;
        }

        .alternatives ul {
          margin: 1rem 0;
        }

        .alternatives li {
          margin-bottom: 0.5rem;
        }

        .alternatives a {
          color: #007AFF;
          text-decoration: none;
        }

        .alternatives a:hover {
          text-decoration: underline;
        }

        .success {
          text-align: center;
        }

        .success h2 {
          color: #28A745;
          margin-bottom: 1rem;
        }

        .next-steps {
          background: #F8F9FA;
          border-radius: 8px;
          padding: 2rem;
          margin: 2rem 0;
          text-align: left;
        }

        .next-steps h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .next-steps ol {
          line-height: 1.6;
        }

        .next-steps li {
          margin-bottom: 0.5rem;
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