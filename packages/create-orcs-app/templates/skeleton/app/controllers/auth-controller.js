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

    // TODO: Implement authentication logic
    // - Verify user credentials against database
    // - Check password hash
    // - Generate JWT token

    // Example:
    // const user = await User.where('email', email).first();
    // if (!user || !(await Bun.password.verify(password, user.password))) {
    //   return ctx.abort(401, 'Invalid credentials');
    // }

    const user = {
      id: 1,
      email,
      name: "User",
    };

    const guard = new JwtGuard();
    const token = await guard.generateToken(user);

    return ctx.json({ token, user });
  }

  /**
   * Get authenticated user
   */
  static async me(ctx) {
    // User is available via auth middleware
    return ctx.json({ user: ctx.user });
  }

  /**
   * User logout
   */
  static async logout(ctx) {
    // TODO: Implement logout logic (invalidate token if using token blacklist)
    return ctx.json({ message: "Logged out successfully" });
  }
}
