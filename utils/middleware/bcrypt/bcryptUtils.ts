import bcrypt from "bcrypt";

export const generateSalt = (rounds: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(rounds, (err, salt) => {
      if (err) {
        reject(err);
      } else {
        resolve(salt);
      }
    });
  });
};

export const hashPassword = (
  password: string,
  salt: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};

export const comparePassword = (
  password: string,
  hash: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
