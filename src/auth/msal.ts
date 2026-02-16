import { Configuration, LogLevel, PublicClientApplication } from "@azure/msal-browser";

const rawClientId = import.meta.env.VITE_AZURE_CLIENT_ID as string | undefined;
const tenantId = (import.meta.env.VITE_AZURE_TENANT_ID as string | undefined) || "common";
const redirectUri =
  (import.meta.env.VITE_AZURE_REDIRECT_URI as string | undefined) || window.location.origin;

export const hasMsalConfig = Boolean(rawClientId && rawClientId.trim().length > 0);

const config: Configuration = {
  auth: {
    clientId: hasMsalConfig
      ? (rawClientId as string)
      : "00000000-0000-0000-0000-000000000000",
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: false
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }

        if (level === LogLevel.Error) {
          console.error(message);
        }
      }
    }
  }
};

export const msalInstance = new PublicClientApplication(config);

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"]
};
