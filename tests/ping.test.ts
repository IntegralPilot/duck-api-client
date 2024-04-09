import { DuckPoweredAPIClient } from '../src';

test('pings the API correctly', async () => {
  const client = new DuckPoweredAPIClient();
  const result = await client.isConnectionWorking();
  expect(result).toBeTruthy();
});