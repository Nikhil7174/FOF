# Sport Sync Space

A sports management application for organizing and managing sports events, participants, volunteers, and communities.

## Project Structure

```
.
├── client/          # React frontend (Vite + TypeScript)
├── server/          # Backend API (Express + TypeScript + Prisma + PostgreSQL)
└── README.md        # This file
```

## Quick Start

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database (choose one):
   - **Supabase** (Recommended): [supabase.com](https://supabase.com) - Free tier available
   - **Neon**: [neon.tech](https://neon.tech) - Serverless PostgreSQL
   - **Railway**: [railway.app](https://railway.app) - $5 free credit/month
   - **Local PostgreSQL**: Install and run locally

4. Create `.env` file in `server/` directory:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

5. Set up database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

6. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `client/` directory (optional):
```env
VITE_API_URL=http://localhost:3000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or port 8080 as configured)

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Admin**: `admin` / `admin`
- **Community Admin 1**: `commadmin1` / `community`
- **Community Admin 2**: `commadmin2` / `community`
- **Sports Admin (Football)**: `footballadmin` / `football`
- **Sports Admin (Basketball)**: `basketballadmin` / `basketball`
- **Volunteer Admin**: `voladmin` / `voladmin`
- **Volunteer**: `volunteer` / `volunteer`
- **User**: `user` / `user`

## Features

- **User Management**: Multiple roles (admin, community_admin, sports_admin, volunteer_admin, volunteer, user)
- **Participant Registration**: Register participants for sports events
- **Volunteer Management**: Manage volunteers and assign them to sports
- **Sports Management**: Hierarchical sports structure (parent-child relationships)
- **Community Management**: Manage communities and their participants
- **Calendar**: View and manage sports events calendar
- **Settings**: Configure application settings

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui components

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing

## Development

### Backend Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed     # Seed database
npm run prisma:studio   # Open Prisma Studio (database GUI)
```

### Frontend Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Deployment

### Backend Deployment

The backend can be deployed to:
- **Railway**: Easy deployment with PostgreSQL included
- **Render**: Free tier available with PostgreSQL
- **Heroku**: Traditional PaaS option
- **AWS/GCP/Azure**: For enterprise deployments

### Frontend Deployment

The frontend can be deployed to:
- **Vercel**: Recommended for React apps
- **Netlify**: Easy static site hosting
- **GitHub Pages**: Free hosting option
- **AWS S3 + CloudFront**: For enterprise deployments

### Environment Variables

Make sure to set the following environment variables in production:

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong random secret for JWT tokens
- `NODE_ENV` - Set to "production"
- `FRONTEND_URL` - Your frontend URL for CORS

**Frontend:**
- `VITE_API_URL` - Your backend API URL

## Database Schema

The application uses PostgreSQL with the following main entities:

- **User**: System users with roles
- **Participant**: Sports participants
- **Volunteer**: Event volunteers
- **Community**: Communities
- **Sport**: Sports with hierarchical support
- **Department**: Volunteer departments
- **CalendarItem**: Calendar events
- **Settings**: Application settings
- **Email**: Email outbox

See `server/prisma/schema.prisma` for the complete schema.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC



