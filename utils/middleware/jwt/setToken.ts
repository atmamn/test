import { Request, Response } from "express";
export const setToken = (_: Request, res: Response, token: string) => {
  const cookie = res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  });

  return cookie;
};
