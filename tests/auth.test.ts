import { DuckPoweredAPIAuthScope, DuckPoweredAPIClient } from "../src";

const loggedInClient = new DuckPoweredAPIClient();


// gen random 16 char string
const username = Math.random().toString(36).substring(2, 18);

test("creates a user account successfully", async () => {
    const client = new DuckPoweredAPIClient();
    const result = await client.createAccount(username, "validPassword193!");
    expect(result.success).toBeTruthy();
});

test("refuses to create a user account with a duplicate username", async () => {
    const client = new DuckPoweredAPIClient();
    const result = await client.createAccount(username, "validPassword194!");
    expect(result.success).toBeFalsy();
});

test("refuses to create a user accout with an invalid username", async () => {
    const client = new DuckPoweredAPIClient();
    const result = await client.createAccount("a", "validPassword193!");
    expect(result.success).toBeFalsy();
});

test("refuses to create a user accout with an invalid password", async () => {
    const client = new DuckPoweredAPIClient();
    // gen random 16 char string
    const username = Math.random().toString(36).substring(2, 18);
    const result = await client.createAccount(username, "invalid");
    expect(result.success).toBeFalsy();
});

test("logs in successfully", async () => {
    const result = await loggedInClient.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead]);
    expect(result.success).toBeTruthy();
});

test("refuses to log in with an invalid password", async () => {
    const client = new DuckPoweredAPIClient();
    const result = await client.login(username, "invalid2", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.CoreUserInfoWrite]);
    expect(result.success).toBeFalsy();
});

test("refuses to log in with no scopes", async () => {
    const client = new DuckPoweredAPIClient();
    const result = await client.login(username, "validPassword193!", []);
    expect(result.success).toBeFalsy();
});

test("changes the password successfully", async () => {
    const result = await loggedInClient.changePassword(username, "validPassword193!", "validPassword194!");
    expect(result.success).toBeTruthy();
});

test("declines to change the password with an invalid old password", async () => {
    const result = await loggedInClient.changePassword(username, "invalid", "validPassword195!");
    expect(result.success).toBeFalsy();
});

test("cannot change the password with an invalid new password", async () => {
    const result = await loggedInClient.changePassword(username, "validPassword194!", "invalid");
    expect(result.success).toBeFalsy();
});

test("cannot login with the old password", async () => {
    const result = await loggedInClient.login(username, "validPassword193!", [DuckPoweredAPIAuthScope.CoreUserInfoRead]);
    expect(result.success).toBeFalsy();
});

test("can login with the new password", async () => {
    const result = await loggedInClient.login(username, "validPassword194!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
    expect(result.success).toBeTruthy();
});

test("can logout successfully", async () => {
    const result = await loggedInClient.logout();
    expect(result.success).toBeTruthy();
});

test("can't make a request to an endpoint that requires authentication after logging out", async () => {
    const result = await loggedInClient.createDevice("testDevice");
    expect(result.success).toBeFalsy();
});

test("refuses to delete an account with a non-existent username", async () => {
    const result = await loggedInClient.deleteAccount("nonexistentUser", "validPassword194!");
    expect(result.success).toBeFalsy();
});

test("refuses to delete an account with an incorrect password", async () => {
    const result = await loggedInClient.deleteAccount(username, "invalid");
    expect(result.success).toBeFalsy();
});

test("deletes the account successfully", async () => {
    const result = await loggedInClient.deleteAccount(username, "validPassword194!");
    expect(result.success).toBeTruthy();
    // test that the account is actually deleted
    const client = new DuckPoweredAPIClient();
    const result2 = await client.login(username, "validPassword194!", [DuckPoweredAPIAuthScope.CoreUserInfoRead]);
    expect(result2.success).toBeFalsy();
});