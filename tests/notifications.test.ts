import { DuckPoweredAPIAuthScope, DuckPoweredAPIClient } from "../src";

const clientWithWrite = new DuckPoweredAPIClient();
const clientWithoutWrite = new DuckPoweredAPIClient();

const friendClient = new DuckPoweredAPIClient();

const username = Math.random().toString(36).substring(2, 18);
const friendUsername = Math.random().toString(36).substring(2, 18);

let notificationId = "";

beforeAll(async () => {
    await clientWithWrite.createAccount(username, "validPassword193!");
    await clientWithWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.NotificationsRead, DuckPoweredAPIAuthScope.NotificationsWrite, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    await clientWithoutWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.NotificationsRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    await friendClient.createAccount(friendUsername, "validPassword194!");
    await friendClient.login(friendUsername, "validPassword194!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.FriendsRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    // make the users friends
    const friendCode = JSON.parse((await friendClient.getSelfInformation()).message).friend_code;
    await clientWithWrite.addFriend(friendCode);

    // make a device + set inital data for both users
    const deviceId = (await clientWithWrite.createDevice("testDevice")).message;
    await clientWithWrite.contributeSampleToPowerSavingData(deviceId, "W", 75);
    const friendDeviceId = (await friendClient.createDevice("testDevice")).message;
    await friendClient.contributeSampleToPowerSavingData(friendDeviceId, "W", 75);
});

test("refuse to make a new notification if the client doesn't have the NotificationsWrite scope", async () => {
    const result = await clientWithoutWrite.generateNewNotification();
    expect(result.success).toBeFalsy();
});

test("make a new notification successfully", async () => {
    const result = await clientWithWrite.generateNewNotification();
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.notifications.length).toBe(1);
    notificationId = data.notifications[0].uid;
});

test("refuses to mark a notification as read if the client doesn't have the NotificationsWrite scope", async () => {
    const result = await clientWithoutWrite.alterNotificationReadStatus(notificationId, true);
    expect(result.success).toBeFalsy();
});

test("refuses to mark a notification as read if the notification doesn't exist", async () => {
    const result = await clientWithWrite.alterNotificationReadStatus("nonexistentNotification", true);
    expect(result.success).toBeFalsy();
});

test("mark a notification as read successfully", async () => {
    const result = await clientWithWrite.alterNotificationReadStatus(notificationId, true);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.notifications[0].read).toBeTruthy();
});

test("refuses to mark a notification as unread if the client doesn't have the NotificationsWrite scope", async () => {
    const result = await clientWithoutWrite.alterNotificationReadStatus(notificationId, false);
    expect(result.success).toBeFalsy();
});

test("refuses to mark a notification as unread if the notification doesn't exist", async () => {
    const result = await clientWithWrite.alterNotificationReadStatus("nonexistentNotification", false);
    expect(result.success).toBeFalsy();
});

test("mark a notification as unread successfully", async () => {
    const result = await clientWithWrite.alterNotificationReadStatus(notificationId, false);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.notifications[0].read).toBeFalsy();
});

