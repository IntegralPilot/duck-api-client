import { DuckPoweredAPIAuthScope, DuckPoweredAPIClient } from "../src";

const clientWithWrite = new DuckPoweredAPIClient();
const clientWithoutWrite = new DuckPoweredAPIClient();

const username = Math.random().toString(36).substring(2, 18);

let deviceId = "";

test("logs in with device-related scopes successfully", async () => {
    await clientWithWrite.createAccount(username, "validPassword193!");
    const result = await clientWithWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithoutWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead]);
    expect(result2.success).toBeTruthy();
});

test("creates a device successfully", async () => {
    const result = await clientWithWrite.createDevice("testDevice");
    expect(result.success).toBeTruthy();
    deviceId = result.message;
});

test("refuses to create a device with a duplicate name", async () => {
    const result = await clientWithWrite.createDevice("testDevice");
    expect(result.success).toBeFalsy();
});

test("refuses to create a device if the client doesn't have the DevicesWrite scope", async () => {
    const result = await clientWithoutWrite.createDevice("testDevice");
    expect(result.success).toBeFalsy();
});

test("URL encodes the device name properly so that it can have spaces", async () => {
    const result = await clientWithWrite.createDevice("test Device");
    expect(result.success).toBeTruthy();
});

test("changes the name of a device successfully", async () => {
    const result = await clientWithWrite.changeDeviceName(deviceId, "newName");
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.devices[0].device_name).toBe("newName");
});

test("refuses to change the name of a device if the client doesn't have the DevicesWrite scope", async () => {
    const result = await clientWithoutWrite.changeDeviceName(deviceId, "newName2");
    expect(result.success).toBeFalsy();
});

test("refuses to change the name of a device if it would be a duplicate", async () => {
    const result = await clientWithWrite.changeDeviceName(deviceId, "test Device");
    expect(result.success).toBeFalsy();
});

test("refuses to change the name of a device if the device doesn't exist", async () => {
    const result = await clientWithWrite.changeDeviceName("nonexistentDevice", "newName3");
    expect(result.success).toBeFalsy();
});

test("contributes a sample to the power saving data successfully", async () => {
    const result = await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "M", 90);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.devices[0].line_graph_values[0]).toBe(90);
    expect(data.devices[0].line_graph_labels[0]).toBe("M");
});

test("refuses to contribute a sample to the power saving data if the client doesn't have the DevicesWrite scope", async () => {
    const result = await clientWithoutWrite.contributeSampleToPowerSavingData(deviceId, "M", 10);
    expect(result.success).toBeFalsy();
});

test("refuses to contribute a sample to the power saving data if the device doesn't exist", async () => {
    const result = await clientWithWrite.contributeSampleToPowerSavingData("nonexistentDevice", "M", 90);
    expect(result.success).toBeFalsy();
});

test("successfully combines samples for the same day", async () => {
    const result2 = await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "M", 100);
    expect(result2.success).toBeTruthy();
    const result3 = await clientWithWrite.getSelfInformation();
    expect(result3.success).toBeTruthy();
    const data = JSON.parse(result3.message);
    expect(data.devices[0].line_graph_values[0]).toBe(95);
    expect(data.devices[0].line_graph_labels[0]).toBe("M");
});

test("successfully combines samples for different days", async () => {
    const result = await clientWithWrite.createDevice("testDevice2");
    expect(result.success).toBeTruthy();
    const deviceId = result.message;
    const result2 = await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "Tu", 100);
    expect(result2.success).toBeTruthy();
    const result2_1 = await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "W", 100);
    expect(result2_1.success).toBeTruthy();
    const result2_2 = await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "W", 90);
    expect(result2_2.success).toBeTruthy();
    const result3 = await clientWithWrite.getSelfInformation();
    expect(result3.success).toBeTruthy();
    const data = JSON.parse(result3.message);
    // cleanup from this test
    await clientWithWrite.deleteDevice(deviceId);

    // assertations
    expect(data.devices[2].line_graph_values[0]).toBe(100);
    expect(data.devices[2].line_graph_labels[0]).toBe("Tu");
    expect(data.devices[2].line_graph_values[1]).toBe(95);
    expect(data.devices[2].line_graph_labels[1]).toBe("W");
});

test("refuses to delete a device if the client doesn't have the DevicesWrite scope", async () => {
    const result = await clientWithoutWrite.deleteDevice(deviceId);
    expect(result.success).toBeFalsy();
});

test("successfully deletes a device", async () => {
    const result = await clientWithWrite.deleteDevice(deviceId);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.devices).toHaveLength(1);
});

test("refuses to delete a device if the device doesn't exist", async () => {
    const result = await clientWithWrite.deleteDevice("nonexistentDevice");
    expect(result.success).toBeFalsy();
});