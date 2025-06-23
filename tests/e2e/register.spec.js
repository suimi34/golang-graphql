const { test, expect } = require('@playwright/test');

test.describe('User Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to register page before each test
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle('ユーザー登録');
    
    // Check if all form elements are present
    await expect(page.locator('h1')).toContainText('ユーザー登録');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check form labels
    await expect(page.locator('label[for="name"]')).toContainText('名前');
    await expect(page.locator('label[for="email"]')).toContainText('メールアドレス');
    await expect(page.locator('label[for="password"]')).toContainText('パスワード');
    await expect(page.locator('label[for="confirmPassword"]')).toContainText('パスワード確認');
  });

  test('should show loading state during submission', async ({ page }) => {
    // Mock a slow response to ensure loading state is visible
    await page.route('/query', async route => {
      if (route.request().method() === 'POST') {
        // Add delay to make loading state visible
        await new Promise(resolve => setTimeout(resolve, 1000));
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
                  name: 'Test User',
                  email: 'test@example.com',
                  createdAt: new Date().toISOString()
                }
              }
            }
          })
        });
      }
    });

    // Fill the form with valid data
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check if loading state is shown
    await expect(page.locator('button[type="submit"]')).toContainText('登録中...');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Wait for completion
    await expect(page.locator('h1')).toContainText('登録完了');
  });

  test('should handle successful registration', async ({ page }) => {
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

    // Fill the form with unique data
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test User ${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('h1')).toContainText('登録完了');
    await expect(page.locator('text=ユーザー登録が正常に完了しました。')).toBeVisible();
    
    // Check if user info is displayed
    await expect(page.locator(`text=名前: Test User ${timestamp}`)).toBeVisible();
    await expect(page.locator(`text=メールアドレス: test${timestamp}@example.com`)).toBeVisible();
    
    // Check if buttons are present
    await expect(page.locator('button:has-text("新しいユーザーを登録")')).toBeVisible();
    await expect(page.locator('a[href="/query"]')).toBeVisible();
  });

  test('should allow creating another user after successful registration', async ({ page }) => {
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

    // Complete a registration first
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test User ${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for success page
    await expect(page.locator('h1')).toContainText('登録完了');
    
    // Click "新しいユーザーを登録" button
    await page.click('button:has-text("新しいユーザーを登録")');
    
    // Should return to registration form
    await expect(page.locator('h1')).toContainText('ユーザー登録');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });

  test('should navigate to GraphQL endpoint from success page', async ({ page }) => {
    // Mock successful response only for POST requests
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
                  name: 'Link Test User',
                  email: 'link@example.com',
                  createdAt: new Date().toISOString()
                }
              }
            }
          })
        });
      } else {
        // Let GET requests through to the actual server
        route.continue();
      }
    });

    // Complete a registration first
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `Test User ${timestamp}`);
    await page.fill('input[name="email"]', `test${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for success page
    await expect(page.locator('h1')).toContainText('登録完了');
    
    // Click GraphQL endpoint link
    await page.click('a[href="/query"]');
    
    // Should navigate to GraphQL endpoint (this might show an error page or GraphQL interface)
    await expect(page.url()).toContain('/query');
  });
});
