const { test, expect } = require('@playwright/test');

test.describe('User Registration with Mocked Responses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should handle successful registration with mocked response', async ({ page }) => {
    // Mock successful GraphQL response
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        const postData = JSON.parse(route.request().postData());
        if (postData.query.includes('registerUser')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                registerUser: {
                  success: true,
                  message: 'ユーザー登録が完了しました',
                  user: {
                    id: '123',
                    name: postData.variables.input.name,
                    email: postData.variables.input.email,
                    createdAt: new Date().toISOString()
                  }
                }
              }
            })
          });
        }
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Mock Success User');
    await page.fill('input[name="email"]', 'mocksuccess@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show success page
    await expect(page.locator('h1')).toContainText('登録完了');
    await expect(page.locator('text=名前: Mock Success User')).toBeVisible();
    await expect(page.locator('text=メールアドレス: mocksuccess@example.com')).toBeVisible();
  });

  test('should handle duplicate email error with mocked response', async ({ page }) => {
    // Mock error GraphQL response for duplicate email
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        const postData = JSON.parse(route.request().postData());
        if (postData.query.includes('registerUser')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                registerUser: {
                  success: false,
                  message: 'このメールアドレスは既に登録されています',
                  user: null
                }
              }
            })
          });
        }
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Duplicate Email User');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=このメールアドレスは既に登録されています')).toBeVisible();
    
    // Should stay on registration form
    await expect(page.locator('h1')).toContainText('ユーザー登録');
  });

  test('should handle network error with mocked response', async ({ page }) => {
    // Mock network error
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        await route.abort('failed');
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Network Error User');
    await page.fill('input[name="email"]', 'networkerror@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show generic error message
    await expect(page.locator('text=登録中にエラーが発生しました')).toBeVisible();
  });

  test('should send correct GraphQL mutation', async ({ page }) => {
    // Track GraphQL requests
    const graphqlRequests = [];
    page.on('request', request => {
      if (request.url().includes('/query') && request.method() === 'POST') {
        graphqlRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData(),
          headers: request.headers()
        });
      }
    });

    // Mock successful response
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              registerUser: {
                success: true,
                message: 'ユーザー登録が完了しました',
                user: {
                  id: '123',
                  name: 'GraphQL Test User',
                  email: 'graphql@example.com',
                  createdAt: new Date().toISOString()
                }
              }
            }
          })
        });
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'GraphQL Test User');
    await page.fill('input[name="email"]', 'graphql@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Wait for request to be made
    await expect(page.locator('h1')).toContainText('登録完了');
    
    // Verify GraphQL request was made correctly
    expect(graphqlRequests.length).toBeGreaterThan(0);
    
    const request = graphqlRequests[0];
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/query');
    
    // Verify the mutation structure
    const postData = JSON.parse(request.postData);
    expect(postData.query).toContain('mutation RegisterUser');
    expect(postData.query).toContain('registerUser(input: $input)');
    expect(postData.variables.input.name).toBe('GraphQL Test User');
    expect(postData.variables.input.email).toBe('graphql@example.com');
    expect(postData.variables.input.password).toBe('password123');
  });

  test('should navigate correctly after successful registration', async ({ page }) => {
    // Mock successful response
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              registerUser: {
                success: true,
                message: 'ユーザー登録が完了しました',
                user: {
                  id: '123',
                  name: 'Navigation Test User',
                  email: 'navigation@example.com',
                  createdAt: new Date().toISOString()
                }
              }
            }
          })
        });
      }
    });

    // Register user
    await page.fill('input[name="name"]', 'Navigation Test User');
    await page.fill('input[name="email"]', 'navigation@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for success page
    await expect(page.locator('h1')).toContainText('登録完了');
    
    // Click "新しいユーザーを登録" button
    await page.click('button:has-text("新しいユーザーを登録")');
    
    // Should return to registration form
    await expect(page.locator('h1')).toContainText('ユーザー登録');
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });

  test('should handle malformed server response', async ({ page }) => {
    // Mock malformed response
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        });
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Malformed Response User');
    await page.fill('input[name="email"]', 'malformed@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show generic error message
    await expect(page.locator('text=登録中にエラーが発生しました')).toBeVisible();
  });

  test('should handle server error response', async ({ page }) => {
    // Mock server error
    await page.route('/query', async route => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      });
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Server Error User');
    await page.fill('input[name="email"]', 'servererror@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Should show error message and remain functional
    await expect(page.locator('text=登録中にエラーが発生しました')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled();
  });
});
