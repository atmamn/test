import jwt from "jsonwebtoken";

export const jwtGenerateToken = (email: string) => {
  const token = jwt.sign({ email }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};
