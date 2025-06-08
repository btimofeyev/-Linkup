# Linkup - Social Meetup App

Linkup is a social meetup app that makes it easy to connect with friends and organize spontaneous or planned gatherings. Drop a pin to share what you're doing right now, or schedule future meetups with your circles.

## 🚀 Features

- **📱 Phone Authentication** - Secure SMS-based login
- **📍 Drop a Pin** - Share spontaneous activities with friends
- **📅 Schedule Meetups** - Plan future gatherings
- **👥 Circle Management** - Organize contacts into friend groups
- **📱 Real-time Feed** - See what friends are up to
- **✅ RSVP System** - Quick responses to invitations
- **🔒 Privacy Controls** - Share with specific circles only

## 🏗️ Architecture

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **AsyncStorage** for local data
- **Expo Location** for GPS integration

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Supabase** (PostgreSQL) for database
- **JWT** for authentication
- **Twilio** for SMS verification
- **Row Level Security** for data privacy

## 📁 Project Structure

```
linkup/
├── linkup/                  # React Native frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Contacts, Circles)
│   │   ├── navigation/     # Navigation configuration
│   │   ├── screens/        # App screens
│   │   ├── services/       # API service layer
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── linkup-backend/          # Node.js backend
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── database/       # Database schema
│   └── package.json
├── CLAUDE.md              # Development execution plan
├── SETUP.md               # Complete setup instructions
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Expo CLI
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/linkup.git
cd linkup
```

### 2. Backend Setup
```bash
cd linkup-backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd linkup
npm install
npm start
```

### 4. Database Setup
1. Create a Supabase project
2. Run the SQL from `linkup-backend/src/database/schema.sql`
3. Update `.env` with your Supabase credentials

For detailed setup instructions, see [SETUP.md](SETUP.md).

## 📱 App Flow

1. **Onboarding** - Enter phone number and verify with SMS code
2. **Contacts** - Optionally sync contacts and create circles
3. **Drop Pin** - Share current activity with selected circles
4. **Schedule** - Plan future meetups with date/time
5. **Feed** - View and RSVP to friends' activities

## 🔐 Security

- **Row Level Security** - Database-level access controls
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - All endpoints validate input
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Secure cross-origin requests

## 🛠️ Development

### Backend Development
```bash
cd linkup-backend
npm run dev          # Start development server
npm run build        # Build TypeScript
npm start           # Start production server
```

### Frontend Development
```bash
cd linkup
npm start           # Start Expo development server
npm run android     # Open on Android
npm run ios         # Open on iOS (macOS only)
npm run web         # Open in web browser
```

### API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Send verification code
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## 📊 API Endpoints

- `POST /api/auth/send-code` - Send SMS verification
- `POST /api/auth/verify` - Verify code and login
- `GET /api/feed` - Get personalized feed
- `POST /api/pins` - Create spontaneous meetup
- `POST /api/meetups` - Create scheduled meetup
- `POST /api/circles` - Create friend circle
- `POST /api/rsvp` - RSVP to event

See [Backend README](linkup-backend/README.md) for complete API documentation.

## 🌍 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
PORT=3000
NODE_ENV=development
```

## 🚀 Deployment

### Backend
- Railway, Heroku, Vercel, AWS, GCP, Azure
- Set production environment variables
- Ensure Supabase database is accessible

### Frontend
- Expo EAS Build for app stores
- Update API_BASE_URL for production
- Configure app store metadata

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For setup help or questions, check:
- [SETUP.md](SETUP.md) for detailed setup instructions
- [Backend README](linkup-backend/README.md) for API documentation
- Issues tab for known problems

## 🔮 Roadmap

- [ ] Push notifications with FCM
- [ ] Group chat integration
- [ ] Calendar sync
- [ ] Maps integration for navigation
- [ ] Photo sharing
- [ ] Event analytics
- [ ] Social features (followers, public events)

---

Built with ❤️ using React Native, Node.js, and Supabase