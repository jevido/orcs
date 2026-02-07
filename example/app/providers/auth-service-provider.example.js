/**
 * Authentication Service Provider (Example)
 *
 * This is an example of how to set up authentication in your application.
 * Copy this file to auth-service-provider.js and customize as needed.
 *
 * Then register it in bootstrap/providers.js:
 *   import { AuthServiceProvider } from "../app/providers/auth-service-provider.js";
 *   export default [AppServiceProvider, RouteServiceProvider, AuthServiceProvider];
 */

import { ServiceProvider } from "../../src/core/service-provider.js";
import { Authenticator } from "../../src/auth/authenticator.js";
import { JwtGuard } from "../../src/auth/guards/jwt-guard.js";
import { ApiTokenGuard } from "../../src/auth/guards/api-token-guard.js";
import { DB } from "../../src/database/query-builder.js";

export class AuthServiceProvider extends ServiceProvider {
  register() {
    const config = this.app.config.get("auth");

    // Create authenticator
    const authenticator = new Authenticator(config);

    // Register JWT guard
    const jwtGuard = new JwtGuard({
      secret: config.jwt.secret,
      algorithm: config.jwt.algorithm,

      // Optional: fetch full user record from database
      // If not provided, the JWT payload is used as the user
      userProvider: async (payload) => {
        // Fetch user from database
        const user = await DB("users").where("id", payload.userId).first();

        // Return null if user not found (token is valid but user deleted)
        if (!user) return null;

        // Remove sensitive fields
        delete user.password;

        return user;
      },
    });

    // Register API token guard
    const apiGuard = new ApiTokenGuard({
      tokenProvider: async (plainToken) => {
        // Hash the token to compare with database
        const hash = await ApiTokenGuard.hashToken(plainToken);

        // Look up token in database
        const tokenRecord = await DB("api_tokens")
          .where("token", hash)
          .where("expires_at", ">", new Date())
          .first();

        if (!tokenRecord) return null;

        // Fetch the associated user
        const user = await DB("users").where("id", tokenRecord.user_id).first();

        if (!user) return null;

        // Remove sensitive fields
        delete user.password;

        return user;
      },
    });

    // Register guards
    authenticator.registerGuard("jwt", jwtGuard);
    authenticator.registerGuard("api", apiGuard);

    // Attach authenticator to app
    this.app.authenticator = authenticator;

    // Register named middleware
    this.app.registerMiddleware({
      auth: async (ctx, next) => {
        const user = await authenticator.authenticate(ctx);
        if (!user) {
          return ctx.json({ error: "Unauthorized" }, 401);
        }
        ctx.user = user;
        ctx.authenticated = true;
        return await next();
      },

      "auth:optional": async (ctx, next) => {
        const user = await authenticator.authenticate(ctx);
        ctx.user = user;
        ctx.authenticated = user !== null;
        return await next();
      },
    });
  }
}
