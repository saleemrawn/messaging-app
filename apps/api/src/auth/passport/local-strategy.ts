import { Strategy as LocalStrategy } from "passport-local";
import { getUserByUsername } from "../../user/user-repository.ts";
import bcrypt from "bcrypt";

const localStrategy = new LocalStrategy((username, password, done) => {
  getUserByUsername(username)
    .then((user) => {
      if (!user) {
        done(null, false, {
          message: "Incorrect username or password, please try again!",
        });
        return;
      }

      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          done(null, false, {
            message: "Incorrect username or password, please try again!",
          });
          return;
        }

        done(null, user);
        return;
      });
    })
    .catch((err: unknown) => {
      console.error(err);
      done(err);
      return;
    });
});

export { localStrategy };
