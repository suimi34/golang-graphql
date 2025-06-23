# Playwright Tests for User Registration

This directory contains comprehensive end-to-end tests for the user registration functionality using Playwright.

## Test Structure

### 1. Basic Registration Tests (`register.spec.js`)

- Form display and element presence
- Loading states during submission
- Successful registration flow
- Navigation between pages
- Success page functionality

### 2. Form Validation Tests (`register-validation.spec.js`)

- Empty field validation
- Password mismatch validation
- Short password validation
- Duplicate email validation
- HTML5 email format validation
- Form state preservation

### 3. GraphQL Integration Tests (`register-graphql.spec.js`)

- Correct GraphQL mutation structure
- Request/response handling
- Error response handling
- Network error handling
- Malformed response handling
- Request headers verification
- Timeout handling

### 4. Error Handling & Edge Cases (`register-error-handling.spec.js`)

- Long input values
- Special characters and XSS prevention
- Unicode character support
- Rapid form submissions
- Server downtime handling
- Malformed email addresses
- Browser navigation scenarios
- Page refresh handling
- Slow network conditions
- Mobile device testing

## Setup

1. Install dependencies:

   ```bash
   cd tests
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## Running Tests

### Prerequisites

- Build the frontend: `./build-frontend.sh`
- Ensure the Go server binary exists: `go build -o ./bin/server .`
- Database should be running (for real API tests)

### Commands

```bash
# Run all tests
npm test

# Run tests with browser UI
npm run test:headed

# Run tests with Playwright UI mode
npm run test:ui

# Run specific test file
npx playwright test register.spec.js

# Run tests in debug mode
npm run test:debug

# Generate and view test report
npm run report
```

## Test Configuration

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:8080`
- **Parallel Execution**: Enabled for faster test runs
- **Retries**: 2 retries on CI, 0 locally
- **Tracing**: Enabled on first retry for debugging

## Test Data Strategy

Tests use timestamp-based unique data to avoid conflicts:

- Email: `test{timestamp}@example.com`
- Name: `Test User {timestamp}`

## Mocking Strategy

Tests include both real API integration and mocked responses:

- Real API tests verify actual GraphQL functionality
- Mocked tests verify error handling and edge cases
- Network interception for testing various scenarios

## Coverage Areas

✅ **UI Elements**

- Form presence and labels
- Button states and interactions
- Success/error message display

✅ **Form Validation**

- Client-side validation
- Server-side validation
- HTML5 validation

✅ **GraphQL Integration**

- Mutation structure
- Request/response flow
- Error handling

✅ **User Experience**

- Loading states
- Form state preservation
- Navigation flows

✅ **Error Scenarios**

- Network failures
- Server errors
- Invalid input handling

✅ **Security**

- XSS prevention
- Input sanitization

✅ **Performance**

- Slow network handling
- Rapid submissions

✅ **Cross-browser**

- Desktop browsers
- Mobile devices
- Different viewports

## Adding New Tests

1. Create test file in `/e2e` directory
2. Follow naming convention: `register-{feature}.spec.js`
3. Use descriptive test names
4. Include both positive and negative test cases
5. Add appropriate waits and assertions
6. Document any special setup requirements
