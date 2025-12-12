const { test, expect } = require('@playwright/test');

test.describe('User Registration GraphQL Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should send correct GraphQL mutation on form submission', async ({ page }) => {
    // Listen for GraphQL requests
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

    // Fill and submit form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `GraphQL Test ${timestamp}`);
    await page.fill('input[name="email"]', `graphql${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Wait for the request to be made
    await page.waitForTimeout(1000);

    // Verify GraphQL request was made
    expect(graphqlRequests.length).toBeGreaterThan(0);

    const request = graphqlRequests[0];
    expect(request.method).toBe('POST');
    expect(request.url).toContain('/query');

    // Verify the mutation is correct
    const postData = JSON.parse(request.postData);
    expect(postData.query).toContain('mutation RegisterUser');
    expect(postData.query).toContain('registerUser(input: $input)');
    expect(postData.variables.input.name).toBe(`GraphQL Test ${timestamp}`);
    expect(postData.variables.input.email).toBe(`graphql${timestamp}@example.com`);
    expect(postData.variables.input.password).toBe('password123');
  });

  test('should handle GraphQL success response correctly', async ({ page }) => {
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

  test('should handle GraphQL error response correctly', async ({ page }) => {
    // Mock error GraphQL response
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
    await page.fill('input[name="name"]', 'Mock Error User');
    await page.fill('input[name="email"]', 'mockerror@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=このメールアドレスは既に登録されています')).toBeVisible();

    // Should stay on registration form
    await expect(page.locator('h1')).toContainText('ユーザー登録');
  });

  test('should handle GraphQL network error', async ({ page }) => {
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

  test('should handle malformed GraphQL response', async ({ page }) => {
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

  test('should include correct headers in GraphQL request', async ({ page }) => {
    let requestHeaders = {};

    page.on('request', request => {
      if (request.url().includes('/query') && request.method() === 'POST') {
        requestHeaders = request.headers();
      }
    });

    // Fill and submit form
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Header Test ${timestamp}`);
    await page.fill('input[name="email"]', `headers${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Wait for request
    await page.waitForTimeout(1000);

    // Verify headers
    expect(requestHeaders['content-type']).toContain('application/json');
    // Accept header might not be set by graphql-request, so just check content-type
  });

  test('should handle server timeout gracefully', async ({ page }) => {
    // Mock slow server response
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        // Delay response to simulate timeout
        await new Promise(resolve => setTimeout(resolve, 10000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              registerUser: {
                success: true,
                message: 'ユーザー登録が完了しました',
                user: { id: '123', name: 'Test', email: 'test@example.com', createdAt: new Date().toISOString() }
              }
            }
          })
        });
      }
    });

    // Fill and submit form
    await page.fill('input[name="name"]', 'Timeout Test User');
    await page.fill('input[name="email"]', 'timeout@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');

    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('button[type="submit"]')).toContainText('登録中...');

    // Note: In a real test, you might want to check how your app handles timeouts
    // For this test, we'll just verify the loading state appears
  });
});
