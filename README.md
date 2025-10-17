# Payment Management API

A complete REST API for payment management with authentication, authorization, and CRUD operations.

## Features

- User authentication using JWT
- Role-based authorization
- Complete CRUD operations for all entities
- PostgreSQL database with Sequelize ORM
- Input validation using express-validator
- Error handling
- Environment-based configuration

## Data Model

The API implements the following data model:

1. **Clientes**: Store customer information
2  **Transacciones**: Payment transactions linked to payment orders
5. **Estados de transacciones**: Transaction state history
6. **Usuario**: System users with roles
7. **Roles**: User roles for authorization

## Requirements

- Node.js (v14 or higher)
- PostgreSQL database

## Installation

1. Clone this repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory (use `.env.example` as a template):
   ```
   PORT=3000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=payment_management
   DB_USER=postgres
   DB_PASSWORD=postgres

   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=1d
   ```

4. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE payment_management;
   ```

5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/login`: User login
- `GET /api/auth/profile`: Get current user profile

### Clientes

- `GET /api/clientes`: Get all clients
- `GET /api/clientes/:id`: Get client by ID
- `POST /api/clientes`: Create a new client
- `PUT /api/clientes/:id`: Update a client
- `DELETE /api/clientes/:id`: Delete a client

### Transacciones

- `GET /api/transacciones`: Get all transactions
- `GET /api/transacciones/:id`: Get transaction by ID
- `GET /api/transacciones/:id/estados`: Get transaction states history
- `POST /api/transacciones`: Create a new transaction
- `PUT /api/transacciones/:id/estado`: Update transaction state
- `DELETE /api/transacciones/:id`: Delete a transaction

### Estados de Transacciones

- `GET /api/estados-transacciones`: Get all transaction states
- `GET /api/estados-transacciones/:id`: Get transaction state by ID

### Usuarios

- `GET /api/usuarios`: Get all users
- `GET /api/usuarios/:id`: Get user by ID
- `POST /api/usuarios`: Create a new user
- `PUT /api/usuarios/:id`: Update a user
- `DELETE /api/usuarios/:id`: Delete a user

### Roles

- `GET /api/roles`: Get all roles
- `GET /api/roles/:id`: Get role by ID
- `POST /api/roles`: Create a new role
- `PUT /api/roles/:id`: Update a role
- `DELETE /api/roles/:id`: Delete a role

## Initial Setup

When you first run the application, you'll need to create initial roles and an admin user:

1. Create roles (admin and user):
   ```
   POST /api/roles
   {
     "nombre": "ADMIN"
   }
   ```
   
   ```
   POST /api/roles
   {
     "nombre": "USER"
   }
   ```

2. Create an admin user (assuming ADMIN role has ID 1):
   ```
   POST /api/usuarios
   {
     "nombre": "admin",
     "password": "admin123",
     "rol": 1
   }
   ```

3. Login with the admin user:
   ```
   POST /api/auth/login
   {
     "nombre": "admin",
     "password": "admin123"
   }
   ```

## Development

For development, use:

```
npm run dev
```

## Production

For production, use:

```
npm start
```

## License

MIT