import type { Request } from "express";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { getUserById } from "../../user/user-repository.ts";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const cookieExtractor = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.token ?? null;
};

const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      cookieExtractor,
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: JWT_SECRET,
  },
  (jwtPayload: { userId: number }, done) => {
    getUserById(jwtPayload.userId)
      .then((user) => {
        if (!user) {
          done(null, false);
          return;
        }
        done(null, user);
        return;
      })
      .catch((err: unknown) => {
        console.error(err);
        done(err);
        return;
      });
  },
);

export { jwtStrategy };
