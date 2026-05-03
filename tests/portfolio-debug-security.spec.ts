import { test, expect } from '@playwright/test';

test.describe('portfolio-debug security', () => {
  test('POST /api/dashboard/portfolio-debug stays hidden without auth', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/dashboard/portfolio-debug', {
      headers: { 'Content-Type': 'application/json' },
      data: { timeframe: '1W', source: 'test', pointCount: 0 },
    });
    expect(response.status()).toBe(404);
  });
});
