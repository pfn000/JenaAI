---
name: api-generator
description: Generate complete REST API code from a plain English description. Creates Express/Fastify endpoints with validation, error handling, and documentation. Triggers on "api", "endpoint", "rest", "backend", "server", "create route", "build api".
---

# API Generator Agent

Turn plain English into production-ready API code.

## Input
User describes what the API should do in natural language.
Example: "I need an API that takes a user's name and email, stores it, and lets me list all users"

## Output
Complete, runnable API code with:

### 1. Project Structure
```
/api
  /routes      - Route handlers
  /middleware  - Auth, validation, error handling
  /models      - Data models
  /utils       - Helpers
  server.js    - Entry point
  package.json - Dependencies
  README.md    - API documentation
```

### 2. Each Endpoint Includes
- Route definition (GET/POST/PUT/DELETE)
- Input validation (required fields, types, formats)
- Error handling (400, 404, 500 responses)
- Response format (consistent JSON structure)
- JSDoc comments

### 3. Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 4. Error Response
```json
{
  "success": false,
  "data": null,
  "error": "Description of what went wrong"
}
```

## Frameworks Supported
- Express.js (default)
- Fastify
- Hono (lightweight)

## Database Options
- In-memory (default, for prototyping)
- SQLite (file-based)
- PostgreSQL (production)

## Authentication Options
- None (default)
- API Key
- JWT Bearer Token
- OAuth2

Always include a README with:
- How to run
- API endpoints list
- Example requests/responses
- Environment variables needed
