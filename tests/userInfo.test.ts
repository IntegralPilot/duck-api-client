import { DuckPoweredAPIAuthScope, DuckPoweredAPIClient } from "../src";

const username = Math.random().toString(36).substring(2, 18);
const password = "validPassword193!";

const username2 = Math.random().toString(36).substring(2, 18);
const password2 = "validPassword194!";



const cuiw: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const cuir: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const cuirDr: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const cuirDrFr: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const cuirDrFrNr: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const cuirDrFrnNr: DuckPoweredAPIClient = new DuckPoweredAPIClient();

const friendClient: DuckPoweredAPIClient = new DuckPoweredAPIClient();
const stagingClient: DuckPoweredAPIClient = new DuckPoweredAPIClient();

beforeAll(async () => {
    await stagingClient.createAccount(username, password);
    await stagingClient.createAccount(username2, password2);
    await friendClient.login(username2, password2, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    const friendCode = JSON.parse((await friendClient.getSelfInformation()).message).friend_code;
    const deviceId2 = await friendClient.createDevice("testDevice");
    await friendClient.contributeSampleToPowerSavingData(deviceId2.message, "W", 75)
    await friendClient.logout();
    await stagingClient.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.FriendsWrite, DuckPoweredAPIAuthScope.DevicesWrite, DuckPoweredAPIAuthScope.NotificationsWrite]);
    await stagingClient.addFriend(friendCode);
    const deviceId = (await stagingClient.createDevice("testDevice")).message;
    await stagingClient.contributeSampleToPowerSavingData(deviceId, "W", 75);
    await stagingClient.generateNewNotification();
    await stagingClient.logout();
});

test("logs in with cui-releated scopes successfully ", async () => {
    const result2 = await cuiw.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoWrite]);
    expect(result2.success).toBeTruthy();
    const result3 = await cuir.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead]);
    expect(result3.success).toBeTruthy();
    const result4 = await cuirDr.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead]);
    expect(result4.success).toBeTruthy();
    const result5 = await cuirDrFr.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.FriendsRead]);
    expect(result5.success).toBeTruthy();
    const result6 = await cuirDrFrNr.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.FriendsRead, DuckPoweredAPIAuthScope.NotificationsRead]);
    expect(result6.success).toBeTruthy();
    const result7 = await cuirDrFrnNr.login(username, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.FriendsReadNames, DuckPoweredAPIAuthScope.NotificationsRead]);
    expect(result7.success).toBeTruthy();
});

test("a client lacking the CoreUserInfoRead scope cannot get username/pfp/friendCode", async () => {
    const result = await cuiw.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.username).toBeFalsy();
    expect(data.pfp).toBeFalsy();
    expect(data.friend_code).toBeFalsy();
});

test("a client with the CoreUserInfoRead scope can get username/pfp/friendCode", async () => {
    const result = await cuirDr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.username).toBeTruthy();
    expect(data.pfp).toBeTruthy();
    expect(data.friend_code).toBeTruthy();
});

test("a client with the FriendsRead scope can get full friend info", async () => {
    const result = await cuirDrFr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.friends).toBeTruthy();
    expect(data.friends[0].username).toBeTruthy();
    expect(data.friends[0].friend_code).toBeTruthy();
    expect(data.friends[0].pfp).toBeTruthy();
    expect(data.friends[0].devices.length).toBe(1);
});

test("a client with the FriendsReadNames scope can only get friend names/pfps", async () => {
    const result = await cuirDrFrnNr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.friends).toBeTruthy();
    expect(data.friends[0].username).toBeTruthy();
    expect(data.friends[0].pfp).toBeTruthy();
    expect(data.friends[0].friend_code).toBeFalsy();
    expect(data.friends[0].devices).toStrictEqual([]);
});

test("a client without the DevicesRead scope cannot get device info", async () => {
    const result = await cuir.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.devices).toStrictEqual([]);
});

test("a client with the DevicesRead scope can get device info", async () => {
    const result = await cuirDr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.devices).toBeTruthy();
    expect(data.devices[0].device_name).toBe("testDevice");
    expect(data.devices[0].line_graph_labels).toStrictEqual(["W"]);
    expect(data.devices[0].line_graph_values).toStrictEqual([75]);
});

test("a client with the NotificationsRead scope can get notifications", async () => {
    const result = await cuirDrFrNr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.notifications.length).toBe(1);
    expect(data.notifications[0].title).toBeTruthy();
});

test("a client without the NotificationsRead scope cannot get notifications", async () => {
    const result = await cuirDrFr.getSelfInformation();
    expect(result.success).toBeTruthy();
    const data = JSON.parse(result.message);
    expect(data.notifications).toStrictEqual([]);
});

test("a client with the CoreUserInfoWrite scope can change their username to a valid username", async () => {
    const newUsername = Math.random().toString(36).substring(2, 18);
    const result = await cuiw.changeUsername(newUsername);
    expect(result.success).toBeTruthy();
    const result2 = await cuir.login(newUsername, password, [DuckPoweredAPIAuthScope.CoreUserInfoRead]);
    expect(result2.success).toBeTruthy();
});

test("a client with the CoreUserInfoWrite scope cannot change their username to an invalid username", async () => {
    const result = await cuiw.changeUsername("a");
    expect(result.success).toBeFalsy();
});

test("a client without the CoreUserInfoWrite scope cannot change their username", async () => {
    const newUsername = Math.random().toString(36).substring(2, 18);
    const result = await cuir.changeUsername(newUsername);
    expect(result.success).toBeFalsy();
});

test("a client with the CoreUserInfoWrite scope can change their pfp", async () => {
    const result = await cuiw.changePfp("plane");
    expect(result.success).toBeTruthy();
    const result2 = await cuir.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.pfp).toBe("plane");
});

test("a client without the CoreUserInfoWrite scope cannot change their pfp", async () => {
    const result = await cuir.changePfp("plane");
    expect(result.success).toBeFalsy();
});


