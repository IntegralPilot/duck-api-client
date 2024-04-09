import { DuckPoweredAPIClient, DuckPoweredAPIClientUpdateStatus } from "../src";

test("reports that a client requires an update successfully", async () => {
  const client = new DuckPoweredAPIClient();
  client.userAgent = "DuckPowered/1/Snap";
  const result = await client.getUpdateStatus();
  expect(result).toBe(DuckPoweredAPIClientUpdateStatus.updateRequired);
});

test("reports that a client is up to date successfully", async () => {
  const client = new DuckPoweredAPIClient();
  client.userAgent = "DuckPowered/65535/Snap";
  const result = await client.getUpdateStatus();
  expect(result).toBe(DuckPoweredAPIClientUpdateStatus.upToDate);
});