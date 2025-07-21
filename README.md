
Built by https://www.blackbox.ai

---

# Project Name

## Project Overview

This project is a React-based web application that utilizes various libraries and technologies such as React, Wouter for routing, and Tanstack React Query for state management. It provides a structured environment for managing, reporting, and scheduling various user roles within a complex system. The application includes features for user authentication, presence management, and notifications for specific roles such as Admin, Supervisor, and Dispatcher.

## Installation

To get started with this project, you will need to have Node.js and npm installed on your machine. Follow these steps to set up the project locally:

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/your-project.git
   cd your-project
   ```

2. Install the dependencies using npm:

   ```bash
   npm install
   ```

3. Set up your environment variables. Ensure you have a `.env` file containing your database connection string as follows:

   ```
   DATABASE_URL=your_database_url
   ```

4. Once everything is set, run the application:

   ```bash
   npm start
   ```

## Usage

After successfully starting the application, you can navigate to `http://localhost:3000` in your web browser. 

### Available Routes

- **Public Routes:**
  - `/login` - User login page.
  - `/logout` - User logout page.
  - `/` - Home page.
  - `/map-view` - Map view page.
  - `/mobile/login` - Mobile login page.

- **Protected Routes:** 
  - `/dashboard` - User dashboard.
  - `/alarms` - Alarm management (Admin/Dispatcher roles).
  - `/dispatch` - Dispatch management (Dispatcher role).
  - `/reports` - Reporting page (Admin role).
  - `/settings` - Settings (Admin role).
  
Access to these routes is managed through a `ProtectedRoute` component that checks the user's authentication and role.

## Features

- **User Authentication:** Secure login/logout functionality.
- **Dynamic Role-Based Access Control:** Different routes and features based on user roles (Admin, Supervisor, Dispatcher).
- **Notification System:** An integrated notification manager for real-time alerts.
- **Responsive Design:** Adaptive UI for both web and mobile interfaces.
- **Data Management:** Utilizing React Query for API data fetching and caching.

## Dependencies

This project relies on several npm packages. Below are the key dependencies listed in `package.json`:

- `@tanstack/react-query`: ^5.60.5
- `wouter`: ^3.3.5
- `axios`: ^1.9.0
- `leaflet`: ^1.9.4
- `express`: ^4.21.2
- `drizzle-orm`: ^0.40.1
- `react`: ^18.3.1
- `tailwindcss`: ^3.4.17
- `react-dom`: ^18.3.1

(For a full list of dependencies, refer to the `package.json` file.)

## Project Structure

Here's a brief overview of the project's structure:

```
/project-root
├── src
│   ├── components         # UI Components
│   ├── context            # React Context API
│   ├── hooks              # Custom React Hooks
│   ├── lib                # Library Utilities (e.g., constants, query client)
│   ├── pages              # Page Components (e.g., Dashboard, Reports)
│   ├── App.tsx            # Main Application Component
│   ├── index.tsx          # Entry point
│   └── index.css          # Global CSS styles
├── package.json           # Project dependencies and scripts
└── README.md              # Project documentation
```

## Contributing

If you would like to contribute to the project, please fork the repository and submit a pull request with your changes and improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.