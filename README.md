# DuckAPIClient

## Introduction

The DuckAPIClient is a TypeScript library designed to interact with the DuckPoweredAPI. It provides a comprehensive set of methods for handling user authentication, device management, friend interactions, notifications, and more. This README.md provides an overview of the library and demonstrates its usage with examples.

## Installation

To install the DuckPoweredAPIClient, you can use npm:

```
npm install duckapi-client
```

## Usage

First, import the DuckPoweredAPIClient into your TypeScript project:

```typescript
import { DuckPoweredAPIClient, DuckPoweredAPIAuthScope } from 'duck-powered-api-client';
```

Then, initialize a new instance of the DuckPoweredAPIClient with your preferred data source:

```typescript
const client = new DuckPoweredAPIClient(DuckPoweredAPIClientDataSource.LocalStorage);
```

## Contributing

To contribute to the DuckPoweredAPIClient, you can clone the repository and install the dependencies:

```bash
git clone https://github.com/IntegralPilot/DuckPoweredAPIClient
```

Then, install the dependencies:

```bash
npm install
```

You can run our unit tests to ensure that your changes do not break any existing functionality:

```bash
npm test
```

Note that you will need to have a local instance of the DuckPoweredAPI running to run the tests. You can find the DuckPoweredAPI repository [here](https://github.com/IntegralPilot/DuckAPI).

Any PRs which cause the tests to fail will not be accepted. You may edit the tests in the `test` directory to add new tests or modify existing ones (so they work with your proposed change).

## Examples

### Example: User Authentication

```typescript
// Create an account
const createAccountResult = await client.createAccount("username", "password123!");
console.log(createAccountResult);

// Log in
const loginResult = await client.login("username", "password123!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.DevicesRead]);
console.log(loginResult);

// Change password
const changePasswordResult = await client.changePassword("username", "password123!", "newPassword456!");
console.log(changePasswordResult);

// Log out
const logoutResult = await client.logout();
console.log(logoutResult);
```

### Example: Device Management

```typescript
// Create a device
const createDeviceResult = await client.createDevice("MyDevice");
console.log(createDeviceResult);

// Change device name
const changeDeviceNameResult = await client.changeDeviceName("deviceId123", "NewDeviceName");
console.log(changeDeviceNameResult);

// Contribute sample to power saving data
const contributeSampleResult = await client.contributeSampleToPowerSavingData("deviceId123", "W", 75);
console.log(contributeSampleResult);

// Delete device
const deleteDeviceResult = await client.deleteDevice("deviceId123");
console.log(deleteDeviceResult);
```

### Example: Friend Management

```typescript
// Add a friend
const addFriendResult = await client.addFriend("friendCode123");
console.log(addFriendResult);

// Remove a friend
const removeFriendResult = await client.removeFriend("friendCode123");
console.log(removeFriendResult);
```

### Example: Notifications

```typescript
// Generate a new notification
const generateNotificationResult = await client.generateNewNotification();
console.log(generateNotificationResult);

// Alter notification read status
const alterNotificationReadStatusResult = await client.alterNotificationReadStatus("notificationId123", true);
console.log(alterNotificationReadStatusResult);
```

### Example: User Information

```typescript
// Get self information
const selfInformationResult = await client.getSelfInformation();
console.log(selfInformationResult);
```

## Conclusion

The DuckPoweredAPIClient provides a robust set of functionalities for interacting with the DuckPoweredAPI. With its comprehensive methods, handling user authentication, device management, friend interactions, notifications, and user information becomes straightforward and efficient.

For more detailed documentation on each method and its parameters, refer to the TypeScript definitions or the inline JSDoc comments in the source code.
