/**
 * Authentication Controller
 *
 * Handles user authentication with JWT tokens.
 */
import { JwtGuard } from "@jevido/orcs";

export class AuthController {
  /**
   * User login
   */
  static async login(ctx) {
    const { email, password } = ctx.body;

    // In a real app, verify password hash
    // const user = await User.where('email', email).first();
    // const valid = await Bun.password.verify(password, user.password);

    // Mock user for example
    const user = {
      id: 1,
      email,
      name: "Example User",
    };

    // Generate JWT token
    const guard = new JwtGuard();
    const token = await guard.generateToken(user);

    return ctx.json({
      token,
      user,
    });
  }

  /**
   * Get authenticated user
   */
  static async me(ctx) {
    // User is available via auth middleware
    return ctx.json({
      user: ctx.user,
    });
  }

  /**
   * User logout (client should discard token)
   */
  static async logout(ctx) {
    return ctx.json({
      message: "Logged out successfully",
    });
  }
}
