import { DuckPoweredAPIAuthScope, DuckPoweredAPIClient } from "../src";

const clientWithWrite = new DuckPoweredAPIClient();
const clientWithoutWrite = new DuckPoweredAPIClient();

const friendClient = new DuckPoweredAPIClient();

const username = Math.random().toString(36).substring(2, 18);
const friendUsername = Math.random().toString(36).substring(2, 18);

let friendCode = "";
let selfFriendCode = "";

test("logs in with friend-related scopes successfully", async () => {
    await clientWithWrite.createAccount(username, "validPassword193!");
    const result = await clientWithWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.FriendsRead, DuckPoweredAPIAuthScope.FriendsWrite]);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithoutWrite.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.FriendsRead]);
    expect(result2.success).toBeTruthy();
    const result3 = await friendClient.createAccount(friendUsername, "validPassword194!");
    expect(result3.success).toBeTruthy();
    selfFriendCode = JSON.parse((await clientWithWrite.getSelfInformation()).message).friend_code;
    const result4 = await friendClient.login(friendUsername, "validPassword194!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.FriendsRead]);
    expect(result4.success).toBeTruthy();
    friendCode = JSON.parse((await friendClient.getSelfInformation()).message).friend_code;
});

test("refuses to add a friend if the client doesn't have the FriendsWrite scope", async () => {
    const result = await clientWithoutWrite.addFriend(friendCode);
    expect(result.success).toBeFalsy();
});

test("refuses to add a friend if the friend doesn't exist", async () => {
    const result = await clientWithWrite.addFriend("nonexistentFriendCode");
    expect(result.success).toBeFalsy();
});

test("adds a friend successfully", async () => {
    const result = await clientWithWrite.addFriend(friendCode);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.friends[0].friend_code).toBe(friendCode);
    const result3 = await friendClient.getSelfInformation();
    expect(result3.success).toBeTruthy();
    const data2 = JSON.parse(result3.message);
    expect(data2.friends[0].friend_code).toBe(selfFriendCode);
});

test("refuses to add a friend twice", async () => {
    const result = await clientWithWrite.addFriend(friendCode);
    expect(result.success).toBeFalsy();
});

test("refuses to add oneself as a friend", async () => {
    const result = await clientWithWrite.addFriend(selfFriendCode);
    expect(result.success).toBeFalsy();
});

test("refuses to remove a friend if the client doesn't have the FriendsWrite scope", async () => {
    const result = await clientWithoutWrite.removeFriend(friendCode);
    expect(result.success).toBeFalsy();
});

test("refuses to remove a friend if the friend doesn't exist", async () => {
    const result = await clientWithWrite.removeFriend("nonexistentFriendCode");
    expect(result.success).toBeFalsy();
});

test("removes a friend successfully", async () => {
    const result = await clientWithWrite.removeFriend(friendCode);
    expect(result.success).toBeTruthy();
    const result2 = await clientWithWrite.getSelfInformation();
    expect(result2.success).toBeTruthy();
    const data = JSON.parse(result2.message);
    expect(data.friends).toStrictEqual([]);
    const result3 = await friendClient.getSelfInformation();
    expect(result3.success).toBeTruthy();
    const data2 = JSON.parse(result3.message);
    expect(data2.friends).toStrictEqual([]);
    const result4 = await friendClient.getSelfInformation();
    expect(result4.success).toBeTruthy();
    const data3 = JSON.parse(result4.message);
    expect(data3.friends).toStrictEqual([]);
});

