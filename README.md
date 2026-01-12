# 🎨 Jotun Paint Management System | JPMS

A comprehensive paint inventory and stock management system built with React.js, Tailwind CSS, and Supabase.

## ✨ Features

### 🎨 **Core Functionality**
- **Inventory Management**: Track paint products with SKU, stock levels, and categories
- **Transaction Tracking**: Sales and purchase workflows with approval system
- **Supplier Management**: Manage paint suppliers and contact information
- **User Management**: Role-based access control (Admin, Store Manager, Viewer)
- **Dashboard Analytics**: KPIs, charts, and real-time insights
- **Reporting**: Exportable reports and analytics

### 🎨 **Paint-Specific Features**
- **Paint Categories**: Interior, Exterior, Primers, Floor Paints
- **Stock Units**: Liters (L) measurement system
- **Jotun Integration**: Brand-specific product management
- **Color Management**: Paint color tracking and organization

### 🎨 **User Interface**
- **Modern Design**: Clean, professional UI with dark/light mode
- **Responsive Layout**: Mobile-friendly interface
- **Interactive Components**: Search, filter, and export functionality
- **Toast Notifications**: Real-time feedback system
- **Animations**: Smooth transitions and hover effects

### 🎨 **Security & Access Control**
- **Role-Based Access**: Different permissions for different user types
- **Row Level Security**: Database-level security policies
- **Audit Logging**: Track all user actions and changes
- **Approval Workflows**: Multi-step approval for stock changes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd jotun-paint-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 **User Roles**

### 👑 **Admin**
- Full system access
- User management
- System configuration
- All reports and analytics

### 🏪 **Store Manager**
- Product management
- Transaction processing
- Supplier management
- Inventory reports

### 👁️ **Viewer**
- Read-only access
- View reports and analytics
- No modification permissions

## 🎨 **Database Schema**

The system uses PostgreSQL with the following key tables:

- **users**: User profiles and authentication
- **categories**: Paint product categories
- **products**: Paint inventory with SKU tracking
- **transactions**: Sales and purchase records
- **suppliers**: Supplier contact information
- **audit_logs**: User action tracking

## 🎨 **Tech Stack**

- **Frontend**: React.js 19, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL)
- **State Management**: Zustand + React Context
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Charts**: Recharts/Chart.js
- **Export**: xlsx npm package

## 🎨 **Key Components**

### 📊 **Dashboard**
- KPI cards with metrics
- Stock level charts
- Recent activity feed
- Quick action buttons

### 📦 **Products**
- Product listing with search
- Category filtering
- Stock level indicators
- Add/edit product forms

### 💰 **Transactions**
- Sales and purchase tracking
- Approval workflow
- Transaction history
- Export functionality

### 👥 **User Management**
- User listing and roles
- Admin-only access
- Role assignment
- User status management

## 🎨 **Styling System**

The project uses a comprehensive styling system with:

- **Custom CSS Variables**: Primary colors and theme variables
- **Component Classes**: Pre-built utility classes
- **Animation Classes**: Fade-in, slide-in animations
- **Status Badges**: Active, pending, inactive states
- **Role Badges**: Admin, manager, viewer roles
- **Responsive Design**: Mobile-first approach

## 🎨 **Development**

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Input, etc.)
│   ├── dashboard/      # Dashboard-specific components
│   ├── products/       # Product management components
│   ├── transactions/   # Transaction components
│   ├── suppliers/      # Supplier management components
│   └── userManagement/ # User management components
├── contexts/           # React Context providers
├── pages/              # Page components
├── services/           # API and external services
└── utils/              # Utility functions
```

## 🎨 **Deployment**

### Production Build
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy automatically

## 🎨 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🎨 **License**

This project is licensed under the MIT License.

---

**🎨 Built with ❤️ for the Jotun Paint Management System**
