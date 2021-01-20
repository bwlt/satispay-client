import { Handler } from "express";

export const auth: (options: { redirectTo: string }) => Handler = ({
  redirectTo,
}) => (req, res, next) => {
  if (req.session.data === undefined) {
    res.redirect(redirectTo);
  } else {
    next();
  }
};
