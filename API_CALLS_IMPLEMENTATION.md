# API Calls Implementation in the App

This document explains how API calls are implemented in the app, focusing on authentication, usage of custom JWT tokens, request structure, error handling, and best practices.

---

## 1. **Authentication and Custom JWT**

- The app uses [Clerk](https://clerk.dev/) for authentication.
- For secure backend access, a **custom JWT** is generated using Clerk's JWT template (e.g., `driver_app_token`).
- This custom JWT contains all required claims (e.g., `firstName`, `lastName`, `phoneNumber`, `userType`, etc.) and is validated by the backend using Clerk's JWKS.

**How to get a custom JWT:**

```js
const customToken = await getToken({ template: "driver_app_token" });
```

---

## 2. **Making API Calls**

### Example: Registering a Driver

- **Endpoint:** `POST /drivers/createDrivers`
- **URL:** `https://roqet-production.up.railway.app/drivers/createDrivers`
- **Content-Type:** `multipart/form-data`
- **Headers:**
  - `Authorization: Bearer <custom JWT>`
- **Form Data:**
  - `token`: `<custom JWT>`
  - `firstName`, `lastName`, `phoneNumber`, `userType`, etc.
  - (Optional) `profileImage`, `licenseImage`

**Sample Code:**

```js
const customToken = await getToken({ template: "driver_app_token" });
const formData = new FormData();
formData.append("token", customToken);
formData.append("firstName", user.firstName || "");
formData.append("lastName", user.lastName || "");
formData.append("phoneNumber", user.phoneNumbers?.[0]?.phoneNumber || "");
formData.append("userType", "driver");
// Add files if needed

const response = await fetch(
  "https://roqet-production.up.railway.app/drivers/createDrivers",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${customToken}`,
      // Do NOT set Content-Type for multipart/form-data
    },
    body: formData,
  }
);
```

---

## 3. **Error Handling**

- All API calls include detailed `console.log` statements for each step (request start, data preparation, response, errors).
- If the backend returns an error (e.g., 401/403), the error and response body are logged for debugging.
- The app only parses the response as JSON if there is content, to avoid parse errors.

**Example:**

```js
if (response.ok && data?.data?.clerkDriverId) {
  // Success logic
} else if (response.status === 403) {
  console.error(
    "403 Forbidden. Check your custom JWT and backend permissions."
  );
} else {
  console.error("Backend error or missing clerkDriverId:", data);
}
```

---

## 4. **Best Practices**

- **Always use the custom JWT** for protected endpoints.
- **Send the JWT in both the Authorization header and the token form field** if required by backend security.
- **Do not manually set the Content-Type** for `multipart/form-data` requests; let the browser/React Native set it.
- **Log all steps** for easier debugging and maintenance.
- **Store important IDs** (e.g., `clerkDriverId`) in local storage for later use.

---

## 5. **Summary of API Call Flow**

1. Authenticate user with Clerk.
2. Obtain a custom JWT using Clerk's template.
3. Prepare form data and include the custom JWT in both the header and form field.
4. Make the API call using `fetch`.
5. Handle the response and errors with detailed logging.
6. Store any important data (e.g., IDs) as needed.

---

For more details, see the implementation in `src/screens/home/HomeScreen.tsx` and related files.
