# IRLly Complete Setup Guide

This guide will help you set up the complete IRLly application with both frontend (React Native/Expo) and backend (Node.js/Supabase).

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account
- (Optional) Twilio account for SMS verification

## Backend Setup

### 1. Set up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to the SQL Editor
3. Copy and paste the entire contents of `irlly-backend/src/database/schema.sql`
4. Execute the SQL to create all tables and indexes
5. Go to Settings > API to get your project URL and service role key

### 2. Configure Backend Environment

1. Navigate to the backend directory:
   ```bash
   cd irlly-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and fill in your values:
   ```env
   # Replace with your actual Supabase credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   
   # Generate a secure random string
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   
   # Optional: For SMS verification (leave as-is for development)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # Server config
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:8081
   ```

### 3. Start Backend Server

```bash
npm run dev
```

The backend will be available at `http://localhost:3000`

You should see:
```
🚀 IRLly API server running on port 3000
📝 Environment: development
🔗 API endpoints available at http://localhost:3000/api
```

## Frontend Setup

### 1. Install Dependencies

1. Navigate to the frontend directory:
   ```bash
   cd irlly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 2. Update API Configuration (if needed)

If your backend is running on a different port or host, update the API base URL in `src/services/apiService.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

### 3. Start Frontend App

```bash
npm start
```

This will start the Expo development server. You can then:
- Scan the QR code with Expo Go app on your phone
- Press `w` to open in web browser
- Press `a` to open Android emulator
- Press `i` to open iOS simulator (macOS only)

## Testing the Complete App

### 1. Authentication Flow

1. Open the app - you should see the phone verification screen
2. Enter a phone number (e.g., +1234567890)
3. Tap "Send Verification Code"
4. Check the backend console - you'll see the verification code logged (since we're not using real SMS in development)
5. Enter the code from the console
6. You should be logged in and see the main app

### 2. Core Features to Test

**Create Circles:**
1. Go to the Circles tab
2. Tap the + button
3. Create a circle (e.g., "Close Friends")
4. Add some contacts if you have contacts permission

**Drop a Pin:**
1. Go to the "Drop Pin" tab
2. Allow location permissions when prompted
3. Enter a title (e.g., "Coffee at Starbucks")
4. Select the circle you created
5. Tap "Drop Pin"
6. Check that it appears in your feed

**Schedule a Meetup:**
1. Go to the "Plan" tab
2. Create a future meetup
3. Select circles and submit
4. Check that it appears in your feed

**RSVP to Events:**
1. Go to the Feed tab
2. Tap "I'm In" or "Can't Make It" on your events
3. The status should update

## Development Mode Notes

### SMS Verification
- Without Twilio credentials, verification codes are logged to the backend console
- Look for messages like: `[DEV MODE] SMS would be sent to +1234567890: Your IRLly verification code is 123456`

### Database
- All data is stored in your Supabase database
- You can view/edit data in the Supabase dashboard
- Row Level Security is enabled for data privacy

### API Testing
You can test the backend API directly using curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Send verification code
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify code (use the code from backend console)
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or change PORT in .env file
```

**Database connection issues:**
- Verify your Supabase URL and service key in `.env`
- Check that the database schema was created properly
- Ensure your Supabase project is active

### Frontend Issues

**Metro bundler issues:**
```bash
# Clear cache and restart
npm start -- --clear
```

**API connection issues:**
- Ensure backend is running on port 3000
- Check that API_BASE_URL in apiService.ts is correct
- For physical device testing, replace `localhost` with your computer's IP address

**Location permissions:**
- Ensure you allow location permissions when prompted
- On iOS simulator, you may need to set a custom location

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in environment
2. Use a secure JWT_SECRET
3. Set up real Twilio credentials for SMS
4. Deploy to platforms like:
   - Railway
   - Heroku
   - Vercel
   - AWS/GCP/Azure

### Frontend
1. Update API_BASE_URL to your production backend URL
2. Build and submit to app stores:
   ```bash
   expo build:android
   expo build:ios
   ```

## Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive data
- The JWT_SECRET should be a long, random string
- Enable Supabase Row Level Security (already configured)
- Consider rate limiting in production

## Support

If you encounter issues:
1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that Supabase database schema is properly created

The app is now fully functional with real backend integration! 🚀