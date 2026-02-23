import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { AuthenticationResult, EventMessage, EventType } from "@azure/msal-browser";
import App from "./App";
import "./index.css";
import { applyAccessibilityPreferences, readAccessibilityPreferences } from "./accessibility/preferences";
import { validateStoredAppSession } from "./auth/appSession";
import { msalInstance } from "./auth/msal";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Unable to find root element.");
}

const root = ReactDOM.createRoot(rootElement);
applyAccessibilityPreferences(readAccessibilityPreferences());

function setInitialAccount(): void {
  if (!msalInstance.getActiveAccount()) {
    const account = msalInstance.getAllAccounts()[0];
    if (account) {
      msalInstance.setActiveAccount(account);
    }
  }
}

function renderApp(): void {
  root.render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  );
}

msalInstance
  .initialize()
  .then(async () => {
    const redirectResult = await msalInstance.handleRedirectPromise();
    if (redirectResult?.account) {
      msalInstance.setActiveAccount(redirectResult.account);
    } else {
      setInitialAccount();
    }
    await validateStoredAppSession();

    msalInstance.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
      ) {
        const authResult = event.payload as AuthenticationResult;
        if (authResult.account) {
          msalInstance.setActiveAccount(authResult.account);
        }
      }
    });

    renderApp();
  })
  .catch((error) => {
    console.error("MSAL initialization failed", error);
    renderApp();
  });
