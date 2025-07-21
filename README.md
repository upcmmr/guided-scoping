# Guided Scoping & Estimation Tool

A React-based application for project scoping and development time estimation. Streamlines the process of defining project scope through pre-configured templates and provides accurate development hour estimates.

## ✨ Features

- **Template-Based Scoping**: Choose from pre-built project templates (B2B, B2C Commerce, B2C SFRA)
- **Profile Selection**: Small, Medium, or Large project profiles for quick scope definition
- **Interactive Customization**: Fine-tune scope items, hours, and project details
- **Real-time Estimation**: Dynamic calculation of development hours and project summaries
- **Project Management**: Save and load project configurations
- **Admin Panel**: Create and manage project templates
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Built With

- **React** - UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/guided-scoping.git
   cd guided-scoping
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Usage

### For End Users

1. **Start with Template**: Choose a pre-configured project template
2. **Select Profile**: Pick Small, Medium, or Large based on project complexity
3. **Review Details**: See automatically selected scope items
4. **Customize (Optional)**: Fine-tune scope items, hours, and details
5. **Save Project**: Export your project configuration for future use

### For Administrators

- Switch to **Admin Panel** to create and manage project templates
- Configure scope items with Small/Medium/Large complexity flags
- Set default hours and organize items into sections

## 📁 Project Structure

```
src/
├── components/
│   ├── AdminApp.tsx       # Admin interface for template management
│   ├── UserApp.tsx        # User interface for project scoping
│   └── TemplateSelector.tsx # Template selection component
├── utils/
│   ├── dataManager.ts     # Admin data management
│   ├── projectManager.ts  # User project file operations
│   └── templateScanner.ts # Template loading utilities
├── MainApp.tsx           # Main application router
└── main.tsx             # Application entry point

project_templates/        # Pre-built project templates
projects/                # User-generated project files (git-ignored)
```

## 🎯 Key Workflows

### Template-Based Flow
1. Select template → Choose profile size → Review scope → Customize → Save

### Project File Flow
1. Load existing project → Review/edit scope → Save changes

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔧 Configuration

### Adding New Templates

1. Switch to Admin Panel
2. Configure project settings and scope sections
3. Add scope items with appropriate size flags (Small/Medium/Large)
4. Save the template

### Custom Project Types

Templates support various project types including:
- B2B Commerce platforms
- B2C E-commerce solutions
- SFRA (Storefront Reference Architecture) projects
- Custom enterprise applications

---

**Built with ❤️ for streamlined project scoping and accurate development estimation.** 