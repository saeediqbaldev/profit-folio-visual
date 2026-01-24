# Trading Journal App - Complete Clone Specification

Build an **exact clone** of this trading journal application. Follow all specifications precisely.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Node.js/Express API
- **Database**: MySQL (replace Supabase)
- **Authentication**: Custom JWT-based auth (bcrypt for passwords)
- **Charts**: Recharts library
- **Icons**: Lucide React
- **Date handling**: date-fns
- **Form validation**: Zod + React Hook Form
- **State management**: TanStack React Query

---

## 📁 Database Schema (MySQL)

### Table: `users`
```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Table: `profiles`
```sql
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255),
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  share_enabled BOOLEAN DEFAULT FALSE,
  strategies JSON DEFAULT '["Strategy 1", "Strategy 2", "Strategy 3"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table: `trades` (Forex Trading)
```sql
CREATE TABLE trades (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sno INT AUTO_INCREMENT UNIQUE,
  user_id CHAR(36) NOT NULL,
  strategy VARCHAR(100),
  asset_pair VARCHAR(50),
  entry VARCHAR(50) NOT NULL,
  sl VARCHAR(50),
  tp TEXT,
  rr VARCHAR(50),
  result ENUM('WIN', 'LOSS', 'BE') DEFAULT NULL,
  reason TEXT,
  learning TEXT,
  screenshot_url TEXT,
  after_trade_screenshot_url TEXT,
  trade_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table: `psx_trades` (Pakistan Stock Exchange)
```sql
CREATE TABLE psx_trades (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sno INT AUTO_INCREMENT UNIQUE,
  user_id CHAR(36) NOT NULL,
  strategy VARCHAR(100),
  stock_symbol VARCHAR(50) NOT NULL,
  shares_purchased INT NOT NULL,
  entry_price DECIMAL(15, 4) NOT NULL,
  tp_exit_price DECIMAL(15, 4),
  profit_loss DECIMAL(15, 4) GENERATED ALWAYS AS ((tp_exit_price - entry_price) * shares_purchased) STORED,
  result VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN tp_exit_price IS NULL THEN 'PENDING'
      WHEN tp_exit_price > entry_price THEN 'WIN'
      WHEN tp_exit_price < entry_price THEN 'LOSS'
      ELSE 'BREAKEVEN'
    END
  ) STORED,
  trade_logic TEXT,
  trade_date DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table: `user_roles`
```sql
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL UNIQUE,
  role ENUM('admin', 'moderator', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Table: `activity_logs`
```sql
CREATE TABLE activity_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🎨 Design System (CSS Variables)

Create these CSS custom properties in your global CSS:

```css
:root {
  /* Base colors */
  --background: 240 10% 98%;
  --foreground: 240 10% 8%;
  
  /* Cards and surfaces */
  --card: 0 0% 100%;
  --card-foreground: 240 10% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 8%;
  
  /* Primary brand colors - Professional purple */
  --primary: 270 80% 60%;
  --primary-foreground: 0 0% 100%;
  --primary-glow: 280 90% 70%;
  
  /* Secondary colors */
  --secondary: 214 32% 91%;
  --secondary-foreground: 240 10% 8%;
  
  /* Muted colors */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  
  /* Accent colors */
  --accent: 210 40% 96%;
  --accent-foreground: 240 10% 8%;
  
  /* Trading specific colors - CRITICAL */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --success-glow: 142 71% 60%;
  
  --danger: 0 84% 60%;
  --danger-foreground: 0 0% 100%;
  --danger-glow: 0 84% 75%;
  
  /* System colors */
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  
  /* Borders and inputs */
  --border: 214 32% 88%;
  --input: 214 32% 91%;
  --ring: 216 95% 53%;
  --radius: 0.75rem;
  
  /* Sidebar */
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-border: 220 13% 91%;
}

.dark {
  --background: 240 10% 4%;
  --foreground: 240 5% 96%;
  --card: 240 6% 6%;
  --card-foreground: 240 5% 96%;
  --popover: 240 6% 6%;
  --popover-foreground: 240 5% 96%;
  --primary: 270 80% 65%;
  --primary-foreground: 240 10% 4%;
  --primary-glow: 280 90% 75%;
  --secondary: 240 4% 16%;
  --secondary-foreground: 240 5% 96%;
  --muted: 240 4% 14%;
  --muted-foreground: 215 20% 65%;
  --accent: 240 4% 16%;
  --accent-foreground: 240 5% 96%;
  --success: 142 76% 45%;
  --success-glow: 142 71% 70%;
  --danger: 0 84% 60%;
  --danger-glow: 0 84% 80%;
  --destructive: 0 84% 65%;
  --destructive-foreground: 240 10% 4%;
  --border: 240 4% 18%;
  --input: 240 4% 16%;
  --ring: 216 95% 65%;
  --sidebar-background: 240 5.9% 10%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-border: 240 3.7% 15.9%;
}
```

---

## 🔐 Authentication System

### Sign Up Requirements:
- **Email**: Required, unique, real-time availability check
- **Username**: Required, 3+ chars, alphanumeric + underscore only, unique, real-time check
- **Phone**: Required, unique, real-time check
- **Full Name**: Required
- **Password**: 6-10 characters, must contain:
  - 1 uppercase letter
  - 1 lowercase letter
  - 1 number
  - 1 special character (!@#$%^&*(),.?":{}|<>)
- **Confirm Password**: Must match
- **Email verification required** before login

### Sign In:
- Login via email OR username
- Remember me option
- Password visibility toggle (shown by default)
- "Forgot Password" link with email reset flow

### Password Fields:
- All password fields have eye icon toggle
- Default state: password VISIBLE (not hidden)

---

## 📱 Application Pages & Navigation

### Sidebar Navigation (Collapsible Categories):

**Forex Section:**
1. Add Trades (Journal) - `/journal`
2. Stats / Analytics - `/dashboard`
3. Trading History - `/history`
4. Overview (Calendar) - `/overview`

**PSX Stocks Section:**
1. Add Trades - `/psx/journal`
2. Stats / Analytics - `/psx/dashboard`
3. Trading History - `/psx/history`
4. Overview - `/psx/overview`

**Account Section:**
- Profile - `/profile`

**Avatar Dropdown Menu (Top Right):**
- Admin Panel (if admin role)
- Sign Out

---

## 📄 Page Specifications

### 1. Landing Page (Unauthenticated)
- Hero section with gradient title "Trading Journal"
- TrendingUp icon in gradient container
- "Track your trades, improve your strategy" tagline
- Sign In / Sign Up call-to-action

### 2. Auth Page
- Card with tabs: "Sign In" / "Sign Up"
- Real-time validation icons:
  - Spinner (checking)
  - Green checkmark (available)
  - Red X (taken)
- Password requirements listed with checkmarks
- Forgot password dialog

### 3. Journal Page (Add Trades - Forex)
**Two-column form layout:**

Left Column:
- Strategy (dropdown from user's saved strategies)
- Asset Pair (dropdown: XAUUSD, BTCUSD, ETHUSD, USOIL, SILVER, EURUSD, GBPJPY)
- Trade Date (optional, date picker)
- Entry Price (text input)
- Stop Loss (text input)
- Risk Reward R/R (text input)
- Take Profits (line-numbered textarea for multiple TPs)

Right Column:
- Trade Logic/Reason (textarea)
- Trade Result (dropdown: WIN, LOSS, BE)
- Learning Outcome (textarea)

Bottom Row (side-by-side):
- Setup Screenshot (upload button, 5MB max, PNG/JPG/WEBP)
- After Trade Screenshot (upload button)

Submit button: 25% width on desktop, gradient primary color

### 4. Dashboard Page (Stats/Analytics)
**Filters:** Strategy dropdown, Time period (Daily/Weekly/Monthly/Quarterly/Yearly)

**Stats Cards:** Total Trades, Wins, Losses, Win Rate

**Charts:**
1. Performance Trends - Line/Bar/Area chart selector with zoom controls
2. Win/Loss Distribution - Pie chart with zoom
3. Win Rate Over Time - Area chart with zoom

All charts use:
- Success color for wins
- Danger color for losses
- Muted-foreground for breakeven

### 5. Trading History Page
- Strategy filter dropdown
- Trades list with individual cards showing:
  - Trade number, date, asset pair, strategy
  - Entry, SL, TP, R/R
  - Result badge (color-coded)
  - Edit / Delete / View buttons
- Bulk selection with "Select All" / "Deselect All"
- Bulk delete with confirmation dialog
- Edit modal with all trade fields

### 6. Overview Page (Calendar)
**Stats summary:** Total, Wins, Losses in cards

**3-column layout:**
1. Strategy Filter with stats breakdown
2. Pie chart (Win/Loss distribution)
3. Line chart (Performance over time)

**Custom Calendar Grid:**
- Tradezilla-inspired large day boxes
- Each day shows: T: X, W: X, L: X, BE: X
- Color coding: Green tint for profitable days, Red tint for losing days
- Desktop: 7 columns
- Mobile: 3 columns with horizontal scroll
- Navigation arrows for month switching

### 7. PSX Journal Page
Form fields:
- Strategy (dropdown)
- Stock Symbol (text input)
- Shares Purchased (number)
- Entry Price (decimal)
- TP/Exit Price (decimal, optional)
- Trade Logic (textarea)

**Auto-calculated:**
- P&L = (Exit Price - Entry Price) × Shares
- Result: WIN if profit, LOSS if loss, BREAKEVEN if equal, PENDING if no exit

### 8. PSX Dashboard/History/Overview
- Mirror Forex pages but use `psx_trades` data
- Show P&L instead of R/R

### 9. Profile Page
**3-column layout:**

**Column 1 - Profile Picture:**
- Avatar upload (circular)
- Click to upload new photo
- Stored in file system

**Column 2-3 - Personal Information:**
- Full Name, Username, Email, Phone
- Save Changes button

**Trading Strategies Card:**
- List of user's strategies (max 5)
- Add new strategy input
- Remove strategy (X button)
- Min 1 strategy required

**Public Sharing Card:**
- Toggle switch to enable/disable
- Copy share link button
- Link format: `/share/{userId}`

**Change Password Card:**
- New Password (with visibility toggle)
- Confirm Password (with visibility toggle)
- Update Password button

**Danger Zone Card:**
- Delete Account button (red)
- Confirmation dialog

### 10. Admin Page (Admin Role Only)
**User Management Table:**
- Name, Email, Phone, Avatar
- Total Trades count
- Storage Used
- Delete User button

**Quick Actions:**
- Links to database management
- System logs viewer

### 11. Public Share Page (`/share/:userId`)
- Read-only trading statistics
- Strategy filter dropdown
- Stats cards: Total, Wins, Losses, Win Rate
- Strategy Performance grid
- Trade History table (no edit/delete)
- NO personal data (name, email, phone hidden)
- Shows only if user has `share_enabled = true`

---

## 🧩 Key UI Components

### CandleLoader
Custom animated loader showing 5 candles of varying heights with wave animation. Used during all loading states.

```jsx
// 5 bars with staggered animation, alternating colors (success, danger, primary, success, danger)
```

### ProgressToast
Fixed bottom-right toast showing:
- Title (e.g., "Loading trades...")
- Progress bar (0-100%)
- Status icon (loading spinner / check / X)
- Message text
- Optional: X loaded / Y total count

### Lightbox
Image viewer overlay at 70% scale on desktop, full-screen on mobile. Click outside or X to close.

### Line Numbers Textarea
Textarea with line numbers on the left side for multi-line TP inputs.

---

## 📊 Progressive Loading Pattern

All data-heavy pages implement:
1. Show CandleLoader initially
2. Fetch count first
3. Fetch all data
4. Render in batches (10 at a time) using requestAnimationFrame
5. Show ProgressToast with real-time progress
6. Cache results for 60 seconds

---

## 🔒 Security Requirements

### Input Validation (Zod Schemas):
- Entry price: numeric only, max 50 chars
- Reason/Learning: min 10, max 2000 chars
- TP: max 500 chars
- SL: numeric only, max 50 chars
- R/R: max 20 chars
- File uploads: 5MB max, PNG/JPG/WEBP only

### API Security:
- JWT tokens with expiration
- Rate limiting on auth endpoints
- Password hashing with bcrypt (10+ rounds)
- CORS configuration
- SQL injection prevention (parameterized queries)

### Data Access:
- Users can only CRUD their own data
- Admin can view all users (not their trades)
- Public share exposes only trades (not personal info)

---

## 📱 Responsive Design

### Mobile Breakpoints:
- `md`: 768px (tablet)
- `sm`: 640px (mobile)

### Mobile Adaptations:
- Sidebar becomes off-canvas drawer with X close button
- Auto-close sidebar on navigation
- Calendar shows 3 columns
- Forms stack vertically
- Tables become scrollable
- Action buttons wrap

---

## 🎭 Animations

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
```

Trade cards render with staggered fade-in: `animationDelay: ${index * 30}ms`

---

## 📦 Required NPM Packages

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.3.0",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-select": "^2.2.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-switch": "^1.2.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.2.0",
    "@tanstack/react-query": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^4.1.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "lucide-react": "^0.462.0",
    "mysql2": "^3.6.0",
    "multer": "^1.4.5",
    "next-themes": "^0.4.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-hook-form": "^7.61.0",
    "react-router-dom": "^6.30.0",
    "recharts": "^2.12.0",
    "sonner": "^1.7.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.0",
    "zod": "^3.25.0"
  }
}
```

---

## 🚀 API Endpoints

### Auth
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `POST /api/auth/reset-password` - Request reset
- `PUT /api/auth/update-password` - Update password
- `GET /api/auth/check-availability` - Check username/email/phone

### Profiles
- `GET /api/profiles/me` - Get current user profile
- `PUT /api/profiles/me` - Update profile
- `DELETE /api/profiles/me` - Delete account

### Trades (Forex)
- `GET /api/trades` - List user's trades
- `POST /api/trades` - Create trade
- `PUT /api/trades/:id` - Update trade
- `DELETE /api/trades/:id` - Delete trade
- `DELETE /api/trades/bulk` - Bulk delete

### PSX Trades
- `GET /api/psx-trades` - List user's PSX trades
- `POST /api/psx-trades` - Create trade
- `PUT /api/psx-trades/:id` - Update trade
- `DELETE /api/psx-trades/:id` - Delete trade
- `DELETE /api/psx-trades/bulk` - Bulk delete

### Public
- `GET /api/public/trades/:userId` - Get shared trades (if enabled)

### Admin
- `GET /api/admin/users` - List all users (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)

---

## 📝 Additional Notes

1. **Theme Toggle**: Support light/dark mode with `next-themes`
2. **Toast Notifications**: Use `sonner` for success/error messages
3. **File Storage**: Store screenshots in `/uploads/{userId}/` directory
4. **Date Format**: Display as "MMM dd, yyyy" (e.g., "Jan 24, 2026")
5. **Currency Format**: No currency symbols, just numbers
6. **Result Matching**: Case-insensitive (WIN, win, Win all match)

---

## ✅ Checklist

Before deploying, verify:
- [ ] All forms validate input properly
- [ ] File uploads are size/type restricted
- [ ] Passwords are hashed before storage
- [ ] JWT tokens expire appropriately
- [ ] Users can only access their own data
- [ ] Public share hides personal information
- [ ] Dark mode works correctly
- [ ] Mobile responsive on all pages
- [ ] Charts render with correct colors
- [ ] Calendar shows trade statistics per day
- [ ] Progressive loading works smoothly
- [ ] Admin panel restricted to admin role

---

This specification provides everything needed to build an exact clone. Follow the design system colors, implement all features as described, and ensure the MySQL schema matches the relationships defined.
