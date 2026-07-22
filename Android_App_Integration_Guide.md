# Transport Employee Android App - Integration Guide

This guide details how to integrate the new Transport Employee Android application with the NM-Dyeing Convex backend. It covers the architecture, authentication flow, real-time data fetching, and API endpoints.

## Architecture Overview

1.  **Backend:** Convex (Serverless Database & Functions)
2.  **Authentication:** Custom Token-Based Session Auth managed within Convex.
3.  **Real-Time Data:** Convex inherently provides real-time WebSockets.
4.  **Admin Control:** The NM-Dyeing admin dashboard is responsible for creating employees and assigning their `loginId` and `password`.

## Setting up Convex in Android

To connect your Android app to the backend, you should use the official Convex Kotlin/Java SDK.

> [!IMPORTANT]
> Include the Convex SDK in your `build.gradle`:
> ```gradle
> implementation("dev.convex:convex-android:0.1.0") // Check for the latest version
> ```

Initialize the Convex client in your `Application` class or DI module:

```kotlin
val convexClient = ConvexClient("https://<YOUR_CONVEX_URL>.convex.cloud")
```

## Authentication Flow

Since we are using custom authentication controlled by the project admin, the flow works as follows:

1.  **Admin Sets Credentials:** The admin creates a Transport Employee in the dashboard and sets a `loginId` and `password`.
2.  **App Login:** The employee opens the app, enters their `loginId` and `password`, and the app calls the `androidAuth:login` mutation.
3.  **Session Token:** If successful, Convex returns a secure `token`. **You must save this `token` securely on the device** (e.g., using EncryptedSharedPreferences).
4.  **Authenticated Requests:** Every subsequent request to fetch data MUST include this `token` as an argument.

### 1. Login

Endpoint: `androidAuth:login`
Type: `Mutation`

**Arguments:**
- `loginId` (String): The user ID provided by the admin.
- `password` (String): The password.
- `deviceInfo` (String, optional): E.g., "Pixel 7 Pro - Android 14".
- `fcmToken` (String, optional): Firebase Cloud Messaging token for push notifications.

**Returns:**
```json
{
  "token": "a1b2c3d4...", 
  "employeeId": "jd1...", 
  "name": "Abul Kashem", 
  "vehicleType": "Power Ven - 35W"
}
```

### 2. Validate Session (App Startup)

When the app starts, check if the saved token is still valid.

Endpoint: `androidAuth:validateSession`
Type: `Query`

**Arguments:**
- `token` (String)

**Returns:**
`{ "employeeId": "jd1..." }` or `null` if expired/invalid. If `null`, log the user out and show the login screen.

### 3. Logout

Endpoint: `androidAuth:logout`
Type: `Mutation`

**Arguments:**
- `token` (String)

**Returns:** `{ "success": true }`

---

## Data Fetching (Real-Time APIs)

To show up-to-date, real-time data, use Convex `subscribe` instead of one-off fetching. When the data changes in the database (e.g., the admin assigns a new order), the UI will automatically update.

### 1. Get Employee Profile

Fetches the logged-in user's profile details.

Endpoint: `androidApi:getProfile`
Type: `Query`

**Arguments:**
- `token` (String)

**Returns:** Employee object (excluding the password).

**Kotlin Example:**
```kotlin
convexClient.subscribe("androidApi:getProfile", mapOf("token" to savedToken)) { result ->
    result.onSuccess { profile ->
        // Update UI with profile data
    }.onFailure { error ->
        // Handle error (e.g., Invalid Token)
    }
}
```

### 2. Get Assigned Orders

Fetches all transport orders assigned to the employee, ordered by newest first.

Endpoint: `androidApi:getMyOrders`
Type: `Query`

**Arguments:**
- `token` (String)

**Returns:** Array of `transportOrders` objects.

### 3. Get Billing History

Fetches all billing records and statuses for the employee.

Endpoint: `androidApi:getMyBills`
Type: `Query`

**Arguments:**
- `token` (String)

**Returns:** Array of `transportEmployeeBills` objects.

### 4. Update FCM Token

If the Firebase Cloud Messaging token refreshes in the background, send it to the server.

Endpoint: `androidApi:updateFCMToken`
Type: `Mutation`

**Arguments:**
- `token` (String)
- `fcmToken` (String)

---

## Real-Time Push Notifications

1.  Integrate Firebase Cloud Messaging (FCM) into the Android app.
2.  On login, pass the initial `fcmToken`.
3.  Whenever the `onNewToken` callback triggers in your `FirebaseMessagingService`, call the `androidApi:updateFCMToken` mutation.
4.  The backend (in the future) can use this stored `fcmToken` to send push notifications via Firebase Admin SDK when an order is created or a bill is paid.
