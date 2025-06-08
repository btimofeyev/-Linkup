# Linkup Backend API

A Node.js/Express backend for the Linkup social meetup app, built with Supabase for data persistence and real-time features.

## Features

- 📱 Phone number authentication with SMS verification
- 👥 Contact sync and circle management
- 📍 Location-based pin dropping (spontaneous meetups)
- 📅 Scheduled meetup planning
- ✅ RSVP system for all events
- 📱 Real-time feed of relevant meetups
- 🔒 Row-level security with Supabase
- 🚀 RESTful API with comprehensive validation

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key
- `JWT_SECRET`: Secret for JWT token signing
- `TWILIO_ACCOUNT_SID`: Twilio account SID (optional, for SMS)
- `TWILIO_AUTH_TOKEN`: Twilio auth token (optional, for SMS)
- `TWILIO_PHONE_NUMBER`: Twilio phone number (optional, for SMS)

### 3. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL in `src/database/schema.sql` in your Supabase SQL editor
3. Update your `.env` file with the Supabase credentials

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send SMS verification code
- `POST /api/auth/verify` - Verify code and login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Contacts
- `POST /api/contacts/sync` - Sync user contacts
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/registered` - Get registered contacts only

### Circles
- `POST /api/circles` - Create a new circle
- `GET /api/circles` - Get user's circles
- `PUT /api/circles/:id` - Update circle
- `DELETE /api/circles/:id` - Delete circle
- `POST /api/circles/:id/contacts` - Add contacts to circle
- `DELETE /api/circles/:id/contacts/:contactId` - Remove contact from circle

### Pins (Spontaneous Meetups)
- `POST /api/pins` - Create a new pin
- `GET /api/pins` - Get accessible pins
- `PUT /api/pins/:id` - Update pin
- `DELETE /api/pins/:id` - Delete pin

### Scheduled Meetups
- `POST /api/meetups` - Create a scheduled meetup
- `GET /api/meetups` - Get accessible meetups
- `PUT /api/meetups/:id` - Update meetup
- `DELETE /api/meetups/:id` - Delete meetup

### RSVPs
- `POST /api/rsvp` - Create or update RSVP
- `GET /api/rsvp?meetupId=X&meetupType=Y` - Get RSVPs for meetup
- `GET /api/rsvp/:meetupId?meetupType=Y` - Get user's RSVP
- `DELETE /api/rsvp/:meetupId?meetupType=Y` - Delete user's RSVP

### Feed
- `GET /api/feed` - Get personalized feed

## Development

### Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
```

### Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic and external services
├── types/           # TypeScript type definitions
├── database/        # Database schema and migrations
└── index.ts         # Main application entry point
```

## Database Schema

The app uses the following main tables:
- `users` - User accounts and profiles
- `contacts` - User's imported contacts
- `circles` - Friend groups/circles
- `circle_members` - Junction table for circle membership
- `pins` - Spontaneous meetups
- `scheduled_meetups` - Planned future meetups
- `pin_circles` / `meetup_circles` - Visibility settings
- `rsvps` - User responses to meetups
- `verification_codes` - SMS verification codes

## Security

- All routes except auth are protected with JWT authentication
- Row-level security enforced at the database level
- Rate limiting on authentication endpoints
- Input validation on all endpoints
- CORS configured for frontend domains

## SMS Integration

The app supports SMS verification via Twilio. If Twilio credentials are not provided, verification codes will be logged to the console for development.

## Error Handling

All endpoints return consistent JSON responses:

```json
{
  "success": true|false,
  "data": {...},      // On success
  "error": "...",     // On error
  "message": "..."    // Optional message
}
```

## Deployment

1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, Railway, Vercel, etc.)
4. Ensure your Supabase database is accessible from production

## Testing

API endpoints can be tested using tools like:
- Postman
- cURL
- HTTPie
- Your favorite API testing tool

Example curl request:

```bash
# Send verification code
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify and login
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "code": "123456"}'
```