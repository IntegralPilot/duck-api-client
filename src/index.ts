import { invoke } from "@tauri-apps/api/core"


/**
 * DuckPoweredAPIAuthScope is an enum that represents the scopes that can be requested by the client.
 */
export enum DuckPoweredAPIAuthScope {
  CoreUserInfoRead = "cui.r",
  CoreUserInfoWrite = "cui.w",
  DevicesRead = "d.r",
  DevicesWrite = "d.w",
  FriendsReadNames = "f.r-lim",
  FriendsRead = "f.r",
  FriendsWrite = "f.w",
  NotificationsRead = "n.r",
  NotificationsWrite = "n.w",
}

/**
 * DuckPoweredAPIClientDataSource is an enum that represents the data sources that the client can use for persistence.
 */
export enum DuckPoweredAPIClientDataSource {
  TauriHarness,
  LocalStorage,
  NoPersistence,
}

/**
 * DuckPoweredAPIClientLogLevel is an enum that represents the log levels that the client can use.
 */
export enum DuckPoweredAPIClientLogLevel {
  None,
  ErrorsOnly,
  All
}


interface TauriRequestReturn {
  success: boolean;
  data: string;
}

/**
 * DuckPoweredAPIClientUpdateStatus is an enum that represents the possible update statuses that can be returned by the `getUpdateStatus` method.
 */
export enum DuckPoweredAPIClientUpdateStatus {
  updateRequired = "Update Required",
  updateRecommended = "Update Recommended",
  upToDate = "Up to date"
}

/**
 * DuckPoweredAPIClient is the main class that represents the client that interacts with the DuckPoweredAPI.
 */
export class DuckPoweredAPIClient {
  private refreshToken: string = "";
  private accessToken: string = "";
  userAgent: string = "DuckPoweredAPIClient/100/TypeScript";
  logLevel: DuckPoweredAPIClientLogLevel = DuckPoweredAPIClientLogLevel.None;
  dataSource: DuckPoweredAPIClientDataSource = DuckPoweredAPIClientDataSource.NoPersistence;
  prefix: string = "http://localhost:8000"

  /**
   * Stores a key-value pair in the persistent key-value store.
   * @param key The key to store the value under
   * @param value The value to store
   * @returns void
   * @example
   * ```typescript
   * client.setPersistentKVValue("refresh_token", "myRefreshToken");
   * ```
   */
  setPersistentKVValue = (key: string, value: string) => {
    if (this.dataSource === DuckPoweredAPIClientDataSource.LocalStorage) {
      localStorage.setItem(key, value);
    }
    if (this.dataSource === DuckPoweredAPIClientDataSource.TauriHarness) {
      invoke<TauriRequestReturn>("keybag_setitem", { key, value }).then((result) => {
        if (!result.success) {
          console.error(`Couldn't set keybag item: ${result.data}`)
        }
    });
  }
  }

  /**
   * The constructor for the DuckPoweredAPIClient class.
   * @param dataSource The data source to use for persistence, a `DuckPoweredAPIClientDataSource` enum. Defaults to `DuckPoweredAPIClientDataSource.NoPersistence`.
   * @example
   * ```typescript
   * const client = new DuckPoweredAPIClient(DuckPoweredAPIClientDataSource.LocalStorage);
   * ```
   */
  constructor (dataSource: DuckPoweredAPIClientDataSource = DuckPoweredAPIClientDataSource.NoPersistence) {
    this.dataSource = dataSource;
    if (dataSource === DuckPoweredAPIClientDataSource.TauriHarness) {
      invoke<TauriRequestReturn>("keybag_getitem", { key: "refresh_token" }).then((result) => {
        if (result.success) {
          this.refreshToken = result.data;
        } else {
          this.refreshToken == "";
          console.warn(`Couldn't get refresh token from keybag. User is likely pre-login: ${result.data}`)
        }
        invoke<TauriRequestReturn>("keybag_getitem", { key: "access_token" }).then((result) => {
          if (result.success) {
            this.accessToken = result.data;
          } else {
            this.accessToken == "";
            if (this.logLevel === DuckPoweredAPIClientLogLevel.All) {
              console.warn(`Couldn't get access token from keybag. User is likely pre-login: ${result.data}`)
            }
          }
          invoke<TauriRequestReturn>("assemble_useragent").then((result) => {
            if (result.success) {
              this.userAgent = result.data;
            } else {
              this.userAgent = "DuckPoweredAPIClient/100/TypeScript";
              if (this.logLevel === DuckPoweredAPIClientLogLevel.ErrorsOnly) {
                console.error(`Couldn't get user agent from Tauri: ${result.data}`)
              }
            }
          });
      });
    });
    } else if (dataSource === DuckPoweredAPIClientDataSource.LocalStorage) {
      this.refreshToken = localStorage.getItem("refreshToken") || "";
      this.accessToken = localStorage.getItem("accessToken") || "";
    } else {
      if (this.logLevel === DuckPoweredAPIClientLogLevel.All) {
        console.warn("No persistence method selected, not loading tokens.");
      }
    }
  }


  /**
   * Checks if the connection to the DuckPoweredAPI is working.
   * @returns A promise that resolves to a boolean, true if the connection is working, false if it isn't.
   * @example
   * ```typescript
   * const result = await client.isConnectionWorking();
   * ```
   */
  isConnectionWorking = async (): Promise<boolean> => {
    const result  = await fetch(`${this.prefix}/api/v1/ping`, {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
      },
    });
    if (result.ok) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the current update status of the DuckPoweredAPI.
   * @returns A promise that resolves to a `DuckPoweredAPIClientUpdateStatus` enum.
   * @example
   * ```typescript
   * const result = await client.getUpdateStatus();
   * ```
   */
  getUpdateStatus = async (): Promise<DuckPoweredAPIClientUpdateStatus> => {
    const result  = await fetch(`${this.prefix}/api/v1/updateStatus`, {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
      },
    });
    if (result.ok || result.status === 426) {
      const json = await result.json();
      return json["message"] as DuckPoweredAPIClientUpdateStatus;
    } else {
      throw new Error("Couldn't get update status. Failed with code: " + result.status);
    }
  }

  /**
   * Create an account with the DuckPowered API.
   * @param username The username to create the account with. Must be between 3 and 16 characters long, consisting only of letters, numbers, and underscores.
   * @param password The password to create the account with. Must be at least 8 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.createAccount("Hello", "World123!");
   * ```
   */
  createAccount = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    const result  = await fetch(`${this.prefix}/api/v1/auth/createAccount`, {
      method: "POST",
      headers: {
        "User-Agent": this.userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    if (result.ok) {
      return { success: true, message: "Account created successfully" };
    } else {
      const json = await result.json();
      return { success: false, message: json["message"] };
    }
  }

  /**
   * 
   * @param username The username to log in with.
   * @param password The password to log in with.
   * @param requestedScopes An array of `DuckPoweredAPIAuthScope` enums that represent the authentication scopes that the client is requesting.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.login("Hello", "World123!", [DuckPoweredAPIAuthScope.CoreUserInfoRead, DuckPoweredAPIAuthScope.NotificationsRead, DuckPoweredAPIAuthScope.NotificationsWrite, DuckPoweredAPIAuthScope.DevicesRead, DuckPoweredAPIAuthScope.DevicesWrite]);
   * ```
   */
  login = async (username: string, password: string, requestedScopes: Array<DuckPoweredAPIAuthScope>): Promise<{success: boolean, message: string}> => {
    if (requestedScopes.length === 0) {
      return { success: false, message: "No scopes requested" };
    }
    const result  = await fetch(`${this.prefix}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "User-Agent": this.userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, requested_scopes: requestedScopes }),
    });
    if (result.ok) {
      const json = await result.json();
      this.refreshToken = json["message"];
      this.setPersistentKVValue("refresh_token", json["message"]);
      // now get the access token
      const result2  = await fetch(`${this.prefix}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "User-Agent": this.userAgent,
          "Authorization": `Bearer ${this.refreshToken}`,
        },
      });
      if (result2.ok) {
        const json2 = await result2.json();
        this.accessToken = json2["message"];
        return { success: true, message: "Login successful" };
      } else {
        const json2 = await result2.json();
        this.setPersistentKVValue("access_token", json2["message"]);
        return { success: false, message: json2["message"] };
      }
    } else {
      const json = await result.json();
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Changes the password of the currently logged in user.
   * @param username The username of the currently logged in user.
   * @param oldPassword The old password of the currently logged in user.
   * @param newPassword The new password to change to.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.changePassword("Hello", "World123!", "World124!");
   * ```
   */
  changePassword = async (username: string, oldPassword: string, newPassword: string): Promise<{success: boolean, message: string}> => {
    const result  = await fetch(`${this.prefix}/api/v1/auth/changePassword`, {
      method: "POST",
      headers: {
        "User-Agent": this.userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, old_password: oldPassword, new_password: newPassword }),
    });
    if (result.ok) {
      return { success: true, message: "Password changed successfully" };
    } else {
      const json = await result.json();
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Logs out the currently logged in user.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.logout();
   * ```
   */
  logout = async (): Promise<{success: boolean, message: string}> => {
    this.accessToken = "";
    this.refreshToken = "";
    this.setPersistentKVValue("access_token", "");
    this.setPersistentKVValue("refresh_token", "");
    return { success: true, message: "Logged out successfully" };
  }

  /**
   * Creates a device with the DuckPoweredAPI. Requires the `DevicesWrite` scope and a logged in user.
   * @param deviceName The name of the device to create.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` string contains the ID of the new device (if successful), otherwise, it is a friendly string that can be displayed to the user to show the error.
   * @example
   * ```typescript
   * const result = await client.createDevice("testDevice");
   * ```
   */
  createDevice = async (deviceName: string): Promise<{success: boolean, message: string}> => {
    const result  = await fetch(`${this.prefix}/api/v1/device/byname/${deviceName}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Changes the name of a device with the DuckPoweredAPI. Requires the `DevicesWrite` scope and a logged in user.
   * @param deviceId The ID of the device to change the name of.
   * @param newName The new name to change the device to.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.changeDeviceName("1234", "newName");
   * ```
   */
  changeDeviceName = async (deviceId: string, newName: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/device/${deviceId}/name/${newName}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Contributes a sample to the power saving data of a device with the DuckPoweredAPI. Requires the `DevicesWrite` scope and a logged in user.
   * @param deviceId The ID of the device to contribute the sample to.
   * @param day The day to contribute the sample to, one of `"M"`, `"Tu"`, `"W"`, `"Th"`, `"F"`, `"Sa"`, `"Su"`.
   * @param sample The sample to contribute to the power saving data.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.contributeSampleToPowerSavingData("1234", "W", 75);
   * ```
   */
  contributeSampleToPowerSavingData = async (deviceId: string, day: string, sample: number): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/device/${deviceId}/byday/${day}/${sample}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Deletes a device with the DuckPoweredAPI. Requires the `DevicesWrite` scope and a logged in user.
   * @param deviceId The ID of the device to delete.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.deleteDevice("1234");
   * ```
   */
  deleteDevice = async (deviceId: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/device/${deviceId}`, {
      method: "DELETE",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Gets the information of the currently logged in user. Requires no scopes, however, information will be redacted depending on the `*Read` scopes that the client has. Requires a logged in user.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. If successful, the `message` value will be a stringified JSON object that contains the user information in JSON format. You can call `JSON.parse` on this string to get the user information. However, if the request is not successful, the `message` will contain a friendly string that can be displayed to the user to show the error.
   * @example
   * ```typescript
   * const result = await client.getSelfInformation();
   * const userInfo = JSON.parse(result.message);
   * ```
   */
  getSelfInformation = async (): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/userInfo/self`, {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Deletes the currently logged in user's account. Requires the `CoreUserInfoWrite` scope and a logged in user.
   * @param username The username of the currently logged in user.
   * @param password The password of the currently logged in user.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.deleteAccount("Hello", "World123!");
   * ```
   */
  deleteAccount = async (username: string, password: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/userInfo/self`, {
      method: "DELETE",
      headers: {
        "User-Agent": this.userAgent,
        "Content-Type": "application/json",
      } ,
      body: JSON.stringify({ username, password })
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Adds a new friend to the currently logged in user. Requires the `FriendsWrite` scope and a logged in user.
   * @param friendCode The friend code of the user to add as a friend.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.addFriend("1234");
   * ```
   */
  addFriend = async (friendCode: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/friend/${friendCode}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Removes a friend from the currently logged in user. Requires the `FriendsWrite` scope and a logged in user.
   * @param friendCode The friend code of the user to remove as a friend.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.removeFriend("1234");
   * ```
   */
  removeFriend = async (friendCode: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/friend/${friendCode}`, {
      method: "DELETE",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
      },
    });
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Generates a new notification for the currently logged in user. Requires the `NotificationsWrite` scope and a logged in user.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.generateNewNotification();
   * ```
   */
  generateNewNotification = async(): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/notification/new`, {
      method: "GET",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
    }});
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Changes the username of the currently logged in user. Requires the `CoreUserInfoWrite` scope and a logged in user.
   * @param newUsername The new username to change to. Must be between 3 and 16 characters long, consisting only of letters, numbers, and underscores.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.changeUsername("newUsername");
   * ```
   */
  changeUsername = async(newUsername: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/userInfo/self/username/${newUsername}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
    }});
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Changes the profile picture of the currently logged in user. Requires the `CoreUserInfoWrite` scope and a logged in user.
   * @param newPfp The new profile picture to change to. Must be a string that represents a valid profile picture.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.changePfp("plane");
   * ```
   */
  changePfp = async(newPfp: string): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/userInfo/self/pfp/${newPfp}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
    }});
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

  /**
   * Alters the read status of a notification. Requires the `NotificationsWrite` scope and a logged in user.
   * @param notificationId The ID of the notification to alter the read status of.
   * @param readStatus The new read status to change to, a boolean.
   * @returns A promise that resolves to an object with a `success` boolean and a `message` string. The `message` is a friendly string that can be displayed to the user to show the result of the operation.
   * @example
   * ```typescript
   * const result = await client.getNotifications();
   * const notifications = JSON.parse(result.message);
   * ```
   */
  alterNotificationReadStatus = async(notificationId: string, readStatus: boolean): Promise<{success: boolean, message: string}> => {
    const result = await fetch(`${this.prefix}/api/v1/notification/${notificationId}/readStatus/${readStatus}`, {
      method: "PUT",
      headers: {
        "User-Agent": this.userAgent,
        "Authorization": `Bearer ${this.accessToken}`,
    }});
    const json = await result.json();
    if (result.ok) {
      return { success: true, message: json["message"] };
    } else {
      return { success: false, message: json["message"] };
    }
  }

}