# Design Document

## Overview

The Sock Matcher application is a full-stack web application consisting of a React frontend and a Node.js/Express backend with a simple in-memory database. Users can register lost socks by providing color and size information, and the system will find potential matches by comparing these attributes across all registered socks.

The architecture follows a client-server model with clear separation between presentation (frontend) and business logic (backend). The frontend handles user interaction and display, while the backend manages data storage and matching logic.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         HTTP/REST        ┌─────────────────┐
│                 │ ◄────────────────────────►│                 │
│  React Frontend │                           │  Express Backend│
│                 │         JSON              │                 │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   In-Memory     │
                                              │   Database      │
                                              └─────────────────┘
```

### Technology Stack

**Frontend:**
- React for UI components
- Fetch API for HTTP requests
- Basic CSS for styling

**Backend:**
- Node.js runtime
- Express.js web framework
- In-memory array for data storage (simple start, can be replaced with a real database later)

## Components and Interfaces

### Frontend Components

**SockForm Component**
- Renders input fields for color and size
- Handles form submission
- Calls backend API to register sock
- Displays success/error messages

**MatchList Component**
- Displays a list of matching socks
- Fetches matches from backend API
- Shows color and size for each match

**App Component**
- Main container component
- Manages routing between registration and match views
- Coordinates child components

### Backend API Endpoints

**POST /api/socks**
- Request body: `{ color: string, size: string }`
- Response: `{ id: string, color: string, size: string }`
- Creates a new sock entry and returns it with a unique ID

**GET /api/socks/:id/matches**
- Response: `[{ id: string, color: string, size: string }, ...]`
- Returns all socks that match the color and size of the specified sock
- Excludes the requesting sock itself from results

### Backend Services

**SockService**
- `createSock(color, size)`: Creates and stores a new sock, returns sock with ID
- `findMatches(sockId)`: Finds all socks matching the color and size of the given sock

**SockRepository**
- `save(sock)`: Stores a sock in the database
- `findById(id)`: Retrieves a sock by ID
- `findByColorAndSize(color, size)`: Retrieves all socks matching color and size
- `getAll()`: Retrieves all socks

## Data Models

### Sock

```typescript
interface Sock {
  id: string;          // Unique identifier (UUID)
  color: string;       // Color of the sock (e.g., "red", "blue", "black")
  size: string;        // Size of the sock (e.g., "small", "medium", "large")
  createdAt: Date;     // Timestamp when sock was registered
}
```

### API Request/Response Models

**CreateSockRequest**
```typescript
{
  color: string;
  size: string;
}
```

**SockResponse**
```typescript
{
  id: string;
  color: string;
  size: string;
}
```

**MatchListResponse**
```typescript
{
  matches: SockResponse[];
}
```
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Sock storage persistence**
*For any* valid sock with color and size attributes, when stored in the system, retrieving it by its returned ID should return a sock with the same color and size.
**Validates: Requirements 1.1**

**Property 2: ID uniqueness**
*For any* collection of stored socks, all returned IDs should be unique - no two socks should have the same ID.
**Validates: Requirements 1.2**

**Property 3: Match filtering correctness**
*For any* sock in the system, when requesting matches, all returned socks should have the same color AND size as the original sock, and the original sock should not be included in the results.
**Validates: Requirements 2.1**

**Property 4: Form submission integration**
*For any* valid sock data submitted through the frontend form, the backend should receive a request with the correct color and size, and the frontend should display the returned sock ID.
**Validates: Requirements 3.2**

## Error Handling

### Frontend Error Handling
- Network errors: Display user-friendly message when backend is unreachable
- Invalid responses: Handle malformed JSON gracefully
- Empty states: Show appropriate messages when no matches are found

### Backend Error Handling
- Invalid input: Return 400 Bad Request for missing or invalid color/size
- Not found: Return 404 when requesting matches for non-existent sock ID
- Server errors: Return 500 with generic error message, log details server-side

### Validation Rules
- Color: Required, non-empty string
- Size: Required, non-empty string
- ID: Must be valid UUID format when querying

## Testing Strategy

### Unit Testing
We will use Jest for unit testing both frontend and backend components.

**Frontend Unit Tests:**
- Test that SockForm renders input fields correctly (example test for Requirement 3.1)
- Test that MatchList displays sock data correctly
- Test form validation logic

**Backend Unit Tests:**
- Test SockService.createSock with specific examples
- Test SockRepository CRUD operations
- Test API endpoint responses with specific inputs
- Test edge case: empty match list when no matches exist (Requirement 2.2)

### Property-Based Testing
We will use fast-check for property-based testing in JavaScript/TypeScript.

**Configuration:**
- Each property test should run a minimum of 100 iterations
- Each property-based test must include a comment tag referencing the correctness property from this design document
- Tag format: `// Feature: sock-matcher, Property {number}: {property_text}`

**Property Tests to Implement:**

1. **Storage Round-Trip Property** (Property 1)
   - Generate random socks with various colors and sizes
   - Store each sock and retrieve it by ID
   - Verify color and size match the original
   - **Feature: sock-matcher, Property 1: Sock storage persistence**

2. **ID Uniqueness Property** (Property 2)
   - Generate and store multiple random socks
   - Collect all returned IDs
   - Verify all IDs are unique
   - **Feature: sock-matcher, Property 2: ID uniqueness**

3. **Match Filtering Property** (Property 3)
   - Generate a random target sock
   - Generate a collection of random socks (some matching, some not)
   - Store all socks
   - Request matches for target sock
   - Verify all returned socks have matching color and size
   - Verify target sock is not in results
   - **Feature: sock-matcher, Property 3: Match filtering correctness**

4. **Form Integration Property** (Property 4)
   - Generate random sock data
   - Submit through frontend form
   - Verify backend receives correct data
   - Verify frontend displays returned ID
   - **Feature: sock-matcher, Property 4: Form submission integration**

### Integration Testing
- Test complete flow: register sock via frontend → backend stores → retrieve matches
- Test API endpoints with real HTTP requests
- Verify frontend and backend communicate correctly

## Implementation Notes

### Development Approach
1. Start with backend API and data layer
2. Implement and test matching logic
3. Build frontend components
4. Integrate frontend with backend
5. Add error handling and validation

### Future Enhancements (Out of Scope for Initial Implementation)
- User authentication and ownership of socks
- More sophisticated matching algorithms (fuzzy matching, pattern recognition)
- Image upload for visual matching
- Real database (PostgreSQL, MongoDB)
- Deployment configuration
