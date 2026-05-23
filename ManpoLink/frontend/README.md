# Employee Management System - Frontend

Vite + React 18 + TypeScript frontend for the Employee Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

The app expects the Django backend at `http://localhost:8000/api`

### Build

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── api/              # API service with axios
├── components/       # Reusable UI components
├── context/          # Zustand stores for auth & UI state
├── constants/        # API endpoints, colors, query keys
├── hooks/            # Custom React hooks (auth, queries, etc)
├── pages/            # Role-based dashboard pages
│   ├── admin/       # Admin dashboard
│   ├── hr/          # HR dashboard
│   ├── employee/    # Employee dashboard
│   └── auth/        # Login page
├── styles/          # Global styles & Tailwind
├── utils/           # Helper functions
├── App.tsx          # Main app with routing
└── main.tsx         # Entry point
```

## 🔑 Key Features

- ✅ **Role-Based Dashboards**: Admin, HR, Employee
- ✅ **Authentication**: Login with token-based auth
- ✅ **Data Visualization**: Charts (bar, pie, line)
- ✅ **Employee Management**: View, create, update employees
- ✅ **Attendance Tracking**: Clock in/out with images
- ✅ **Dark/Light Theme**: Toggle theme support
- ✅ **Responsive Design**: Mobile-first, works on all devices
- ✅ **Real-time Updates**: React Query for data fetching
- ✅ **Type Safety**: Full TypeScript support

## 🛠️ Technologies

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Axios + React Query
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Environment Variables

Create `.env.local` file:

```env
VITE_API_URL=http://localhost:8000/api
```

## 🔄 API Integration

All API calls go through `src/api/apiService.ts`. The service handles:

- Token management
- Request/response interceptors
- Error handling
- Automatic redirects on 401

Example API endpoints configured:
- `/api/login/` - User authentication
- `/api/employees/` - Employee management
- `/api/attendance/` - Attendance tracking
- `/api/payroll/` - Payroll data
- `/api/edit-requests/` - Employee edit requests
- `/api/activity-logs/` - Activity logging
- `/api/security-alerts/` - Security alerts

## 🎨 Design System

Colors are defined in `src/constants/colors.ts`:
- Primary: #C41E3A (Red)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

## 🚦 State Management

- **Auth State**: Zustand + localStorage
- **UI State**: Zustand (sidebar, selected items)
- **Server State**: React Query (API data)

## 📊 Data Fetching

React Query hooks are used throughout the app:

```typescript
const { data, isLoading, error } = useGetEmployees();
const mutation = useUpdateEmployee(id);
```

See `src/hooks/useQueries.ts` for all available hooks.

## 🧪 Development Tips

1. **Hot Reload**: Changes auto-reload in dev mode
2. **DevTools**: Browser DevTools with React/Redux extensions
3. **Logging**: Console logs for debugging
4. **Error Handling**: Global error boundaries recommended

## 📝 Notes

- All employee data uses exact field names from Django models
- Same API endpoints as mobile app
- Supports the same business logic and workflows
- Dashboard layouts match the mobile UX pattern

## 🤝 Contributing

Follow the existing code structure and TypeScript conventions.

## 📄 License

Proprietary - For internal use only
