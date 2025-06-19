import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: "https://bc5294fddd1cc7cc817332bf2b98f2fd@o4509491592626176.ingest.us.sentry.io/4509491594854400",
  
  environment: import.meta.env.MODE,
  release: "travel-app@1.0.0",

  integrations: [
    Sentry.reactRouterTracingIntegration(),
  ],
  
  // Capture all errors and transactions
  tracesSampleRate: 1.0,
  
  // Error Monitoring
  beforeSend(event) {
    console.log("Sentry Event:", event);
    return event;
  },
  
  // Additional Configuration
  debug: true,
  sendDefaultPii: true,
});

const SentryErrorBoundary = Sentry.ErrorBoundary;

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <SentryErrorBoundary fallback={<p>An error has occurred</p>}>
        <HydratedRouter />
      </SentryErrorBoundary>
    </StrictMode>
  );
});
