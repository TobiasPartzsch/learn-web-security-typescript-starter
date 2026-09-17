import cors from "cors";
import express, { type Response } from "express";
import helmet from "helmet";
import { randomBytes } from "node:crypto";
import { validateRequestOrigin } from "./csrf.ts";
import type { Dependencies } from "./dependencies.ts";
import { errorHandler, sendErrorPage } from "./errors.ts";
import { createAccountRouter } from "./routes/account.ts";
import { createAdminRouter } from "./routes/admin.ts";
import { createApiRouter } from "./routes/api.ts";
import { createArchiveRouter } from "./routes/archive.ts";
import { createAssistantRouter } from "./routes/assistant.ts";
import { createAuthRouter } from "./routes/auth.ts";
import { createCartRouter } from "./routes/cart.ts";
import { createCheckoutRouter } from "./routes/checkout.ts";
import { createFilesRouter } from "./routes/files.ts";
import { createImagePreviewRouter } from "./routes/imagePreview.ts";
import { createOrdersRouter } from "./routes/orders.ts";
import { createPasskeyRouter } from "./routes/passkey.ts";
import { createPawPalRouter } from "./routes/pawpal.ts";
import { createProductsRouter } from "./routes/products.ts";
import { createStorefrontRouter } from "./routes/storefront.ts";
import { createSupportRouter } from "./routes/support.ts";
import { migrateSensitiveDataAtRest } from "./storage/migrations.ts";


export function createApp(deps: Dependencies): express.Express {
  migrateSensitiveDataAtRest(deps.db, deps.keyring);
  const app = express();
  app.set("trust proxy", deps.trustedProxyHops);

  app.use((_req, res, next) => {
    const cspNonce = randomBytes(16).toString("base64");
    res.locals.cspNonce = cspNonce;
    next();
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          scriptSrc: [
            "'self'",
            (_req, res) =>
              `'nonce-${String((res as Response).locals.cspNonce)}'`,
          ],
          styleSrc: ["'self'"],
          frameSrc: ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: false,
      xFrameOptions: { action: "sameorigin" },
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ ok: true, app: "bearly-secure" });
  });
  app.use(
    ["/shipping-widget.css", "/shipping-widget.js"],
    (_req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
  );
  app.use(express.static("public"));
  app.use(
    "/vendor/simplewebauthn",
    express.static("node_modules/@simplewebauthn/browser/dist/bundle"),
  );

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(createPawPalRouter(deps));
  app.use(validateRequestOrigin(deps.appOrigin));
  app.use(
    "/api/products",
    cors({
      origin: "*",
      credentials: false,
      methods: ["GET"],
      allowedHeaders: [],
    }),
  );
  app.use(createApiRouter(deps));

  app.use(createArchiveRouter(deps));
  app.use(createAssistantRouter(deps));
  app.use(createImagePreviewRouter(deps));

  app.use(createAuthRouter(deps));
  app.use(createPasskeyRouter(deps));
  app.use(createAccountRouter(deps));
  app.use(createCartRouter(deps));
  app.use(createCheckoutRouter(deps));
  app.use(createFilesRouter(deps));
  app.use(createOrdersRouter(deps));
  app.use(createProductsRouter(deps));
  app.use(createSupportRouter(deps));
  app.use(createAdminRouter(deps));
  app.use(createStorefrontRouter(deps));

  app.use((_req, res) => {
    sendErrorPage(
      res,
      404,
      "Page Not Found",
      "We couldn't find the page you requested.",
    );
  });
  app.use(errorHandler);

  return app;
}
