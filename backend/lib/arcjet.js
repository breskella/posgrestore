import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";
import dotenv from "dotenv";

dotenv.config();

const getArcjetResponse = (decision) => {
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return {
        status: 429,
        body: {
          success: false,
          message: "Too many password reset requests. Please try again later.",
        },
      };
    }

    if (decision.reason.isBot()) {
      return {
        status: 403,
        body: {
          success: false,
          message: "Bot access denied",
        },
      };
    }

    return {
      status: 403,
      body: {
        success: false,
        message: "Request blocked by security policy",
      },
    };
  }

  return null;
};

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: "LIVE",
      capacity: 10,
      refillRate: 5,
      interval: 10,
    }),
  ],
});

export const forgotPasswordArcjet = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: "LIVE",
      capacity: 3,
      refillRate: 1,
      interval: 60,
    }),
  ],
});

export const resetPasswordArcjet = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    tokenBucket({
      mode: "LIVE",
      capacity: 5,
      refillRate: 1,
      interval: 60,
    }),
  ],
});

export const protectWithArcjet = (arcjetInstance, customMessage = "Too many requests. Please try again later.") => {
  return async (req, res, next) => {
    try {
      const decision = await arcjetInstance.protect(req, { requested: 1 });
      const denial = getArcjetResponse(decision);

      if (denial) {
        if (denial.status === 429) {
          return res.status(429).json({
            success: false,
            message: customMessage,
          });
        }

        return res.status(denial.status).json(denial.body);
      }

      if (decision.results.some((result) => result.reason.isBot() && result.reason.isSpoofed())) {
        return res.status(403).json({
          success: false,
          message: "Spoofed bot detected",
        });
      }

      return next();
    } catch (error) {
      console.error("Arcjet protection error:", error);
      return res.status(500).json({
        success: false,
        message: "Security check failed. Please try again later.",
      });
    }
  };
};