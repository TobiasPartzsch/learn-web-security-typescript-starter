import type { RequestHandler } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { sendErrorPage } from "./errors.ts";

export function validateRequestOrigin(appOrigin: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    const origin = req.header("Origin");
    if (origin) {
      if (origin === appOrigin) {
        next();
        return;
      }

      sendErrorPage(
        res,
        403,
        "Forbidden",
        "This request did not come from Bearly Secure.",
      );
      return;
    }

    const referer = req.header("Referer");
    if (referer) {
      try {
        if (new URL(referer).origin === appOrigin) {
          next();
          return;
        }
      } catch {
        sendErrorPage(
          res,
          403,
          "Forbidden",
          "This request did not come from Bearly Secure.",
        );
        return;
      }
    }

    sendErrorPage(
      res,
      403,
      "Forbidden",
      "This request did not come from Bearly Secure.",
    );
  };
}

const sha256 = (value: string): Buffer =>
  createHash("sha256").update(value, "utf8").digest();

export function csrfTokensMatch(expected: string, actual: unknown): boolean {
  if (typeof actual !== "string") {
    return false;
  }
  return timingSafeEqual(sha256(expected), sha256(actual));
}
