# POV Manager Template

A Next.js application template for managing Proof of Value (POV) projects with comprehensive features including:
- User authentication and authorization
- POV lifecycle management
- Phase tracking
- Launch management
- Team collaboration
- KPI monitoring
- CRM integration

## Template Usage

1. Create a new repository from this template:
   - Click "Use this template" on GitHub
   - Select "Create a new repository"
   - Choose your repository name and settings

2. Clone your new repository:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

3. Install dependencies:

   **Linux/macOS:**
   ```bash
   npm install
   ```

   **Windows:**
   1. Install Node.js and npm
   2. Install Visual Studio Build Tools:
      - Download Visual Studio Build Tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/
      - Install "Desktop development with C++"
      - Ensure the following components are selected:
        * Windows 10/11 SDK
        * C++ CMake tools for Windows
        * MSVC - VS 2022 C++ x64/x86 build tools
   3. Install project dependencies:
      ```bash
      npm install
      ```

   Note: Make sure to restart your terminal after installing Visual Studio Build Tools.

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration values.

5. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

6. Create test users:
   ```bash
   node scripts/create-test-user.js
   ```
   This creates:
   - Admin user: admin@example.com / Admin123@
   - Test user: rika@example.com / Rika123@

7. Start the development server:
   ```bash
   npm run dev
   ```

## Features

### Authentication
- Email-based registration with verification
- JWT-based authentication
- Role-based access control
- Password reset functionality

### POV Management
- Create and track POVs
- Phase management
- Team assignment
- Resource allocation
- Launch validation

### Monitoring
- KPI tracking
- Progress reporting
- Team activity monitoring
- Resource utilization

### Integration
- CRM data synchronization
- Email notifications
- Customizable workflows

## Development

### Project Structure
```
├── app/                  # Next.js app directory
├── components/          # React components
├── lib/                 # Utility functions and services
├── prisma/             # Database schema and migrations
├── public/             # Static assets
└── scripts/            # Utility scripts
```

### Key Technologies
- Next.js 14
- React
- Prisma
- PostgreSQL
- TailwindCSS
- TypeScript

### Documentation
See the `cline_docs` directory for detailed documentation on:
- System architecture
- Component design
- API specifications
- Database schema
- Testing approach

## Security Considerations

1. Environment Variables:
   - Never commit `.env` files
   - Use `.env.example` as a template
   - Keep secrets secure

2. Authentication:
   - Update JWT secrets
   - Configure proper CORS settings
   - Set secure cookie options

3. Database:
   - Use strong passwords
   - Configure connection pooling
   - Set up proper backups

4. API Security:
   - Rate limiting enabled
   - Request validation
   - CORS protection

## Customization

1. Branding:
   - Update `app/layout.tsx` for layout changes
   - Modify theme in `tailwind.config.ts`
   - Replace logos in `public/`

2. Features:
   - Modify Prisma schema for data model changes
   - Update API routes in `app/api/`
   - Customize components in `components/`

3. Workflows:
   - Adjust phase templates
   - Modify validation rules
   - Customize email templates

## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## Deployment

1. Database Setup:
   ```bash
   # Production migration
   npx prisma migrate deploy
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Start:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
