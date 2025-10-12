# Firebase Authentication & Organization System

## Implementation Complete

This document outlines the authentication and organization management system that has been implemented.

---

## Key Features

### 1. Firebase Authentication
- Email/password authentication
- Secure token-based session management
- Automatic session persistence
- Protected API routes

### 2. Organization Management
- Users can create new organizations during signup
- First user becomes organization admin
- Invite code system for adding members (framework in place)
- Organization-level settings and data isolation

### 3. Role-Based Access Control
- **Regular Users**: Can create PRIVATE scenarios (visible only to them)
- **Organization Admins**: Can create ORGANIZATION scenarios (visible to all org members) + all regular user permissions
- Both can optionally create PUBLIC scenarios (visible to everyone)

### 4. Scenario Visibility System
- **PRIVATE**: Only the creator can see and use
- **ORGANIZATION**: All members of the organization can see and use (admin-created)
- **PUBLIC**: Anyone can see and use (shareable globally)

---

## Database Schema

### User Model
- `id`: Firebase UID (primary key)
- `email`: Unique email address
- `name`: User's full name
- `role`: trainee | trainer | admin
- `isOrgAdmin`: Boolean flag for organization admin privileges
- `organizationId`: Reference to their organization

### Organization Model
- `id`: Unique identifier
- `name`: Organization name
- `type`: hotel | restaurant | resort | spa | other
- `inviteCode`: Optional code for inviting members
- Relationships to users, scenarios, and training sessions

### Scenario Model (Enhanced)
- `visibility`: PUBLIC | ORGANIZATION | PRIVATE
- `createdById`: Firebase UID of creator
- `organizationId`: Organization reference (for org scenarios)
- Indexed for performance

---

## API Endpoints

### Authentication
- `POST /api/auth/sync` - Sync Firebase user to database after signup
- `GET /api/users/[id]` - Get user profile by Firebase UID

### Organizations
- `GET /api/organizations` - Get user's organization with members
- `POST /api/organizations/[id]/members` - Add member (admin only)
- `PATCH /api/organizations/[id]/members` - Update member role (admin only)

### Scenarios (Enhanced)
- `GET /api/scenarios` - Get scenarios visible to user (filtered by access)
- `POST /api/scenarios` - Create scenario (requires auth)
- `GET /api/scenarios/[id]` - Get scenario (checks permissions)
- `PATCH /api/scenarios/[id]` - Update scenario (checks permissions)
- `DELETE /api/scenarios/[id]` - Delete scenario (checks permissions)

---

## User Flows

### New User Registration
1. Visit `/signup`
2. Enter email, password, name
3. Create organization (name and type)
4. Firebase creates auth account
5. Backend syncs to database (creates User + Organization)
6. User becomes org admin automatically
7. Redirect to dashboard

### Login
1. Visit `/login`
2. Enter email and password
3. Firebase authenticates
4. AuthContext fetches user profile from database
5. Redirect to dashboard

### Creating Scenarios

**Regular User:**
- Can create PRIVATE scenarios (only they see it)
- Can optionally make scenarios PUBLIC

**Organization Admin:**
- Can create PRIVATE scenarios
- Can create ORGANIZATION scenarios (all org members see it)
- Can optionally make scenarios PUBLIC

The scenario builder at `/scenarios/create` shows visibility options based on user role.

---

## Frontend Components

### Updated Pages
- `/login` - Firebase email/password authentication
- `/signup` - New user registration with org creation
- `/scenarios/create` - Scenario builder with visibility controls

### Updated Context
- `AuthContext` - Uses Firebase auth state + database user profile
  - `user` - Database user profile with org info
  - `firebaseUser` - Firebase auth user
  - `token` - Firebase ID token for API calls
  - `isAuthenticated` - Boolean
  - `logout()` - Sign out function
  - `refreshUser()` - Refresh user profile

### Middleware
- `lib/middleware/auth.ts` - Verify Firebase tokens, load user
- `lib/middleware/permissions.ts` - Check scenario access/edit permissions

---

## Security Features

- Firebase handles password hashing and storage
- JWT tokens for API authentication
- Row-level access control for scenarios
- Permission checks on all mutations
- Organization-level data isolation

---

## Next Steps

To use the system:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Create your first account:**
   - Go to `http://localhost:3000/signup`
   - Create an account with email/password
   - Set up your organization
   - You'll be the first admin

3. **Create scenarios:**
   - As an admin, you can create org-wide scenarios
   - Choose visibility: Private, Organization, or Public
   - All org members will see organization scenarios

4. **Invite team members (future):**
   - Share your organization's invite code
   - Members can join during signup
   - Promote members to admin via organization settings

---

## Technical Notes

- Firebase config is in `/firebase.ts`
- Auth helpers in `/lib/firebase/auth.ts`
- API middleware uses Firebase ID token verification (simplified for now)
- Production: Should use firebase-admin for server-side token verification
- Database: SQLite (dev) - can migrate to PostgreSQL/MySQL for production

---

## Files Modified/Created

### Core Auth
- `firebase.ts` - Firebase initialization
- `lib/firebase/auth.ts` - Auth helper functions
- `lib/contexts/AuthContext.tsx` - React auth context with Firebase

### Backend
- `prisma/schema.prisma` - Updated with new fields
- `lib/middleware/auth.ts` - Auth middleware
- `lib/middleware/permissions.ts` - Permission checks
- `app/api/auth/sync/route.ts` - User sync endpoint
- `app/api/users/[id]/route.ts` - User profile endpoint
- `app/api/organizations/route.ts` - Org management
- `app/api/organizations/[id]/members/route.ts` - Member management
- `app/api/scenarios/route.ts` - Enhanced with auth
- `app/api/scenarios/[id]/route.ts` - Enhanced with permissions

### Frontend
- `app/signup/page.tsx` - New signup page
- `app/login/page.tsx` - Updated for Firebase
- `app/scenarios/create/page.tsx` - Enhanced with visibility controls

---

## Support

If you encounter issues:
1. Check Firebase console for auth errors
2. Verify .env.local has correct Firebase config
3. Check browser console for client-side errors
4. Check terminal for server-side errors
5. Ensure database schema is up to date (`npx prisma db push`)
