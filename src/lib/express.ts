import { Handler, Response } from "express";
import { HttpResponse } from "./request";

export function wrapAsyncHandler(handler: Handler): Handler {
  return (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch((err) => next(err));
}

export function render(
  res: Response,
  view: "api-create-payment",
  options: { body: string; httpResponse?: HttpResponse }
): void;
export function render(res: Response, view: string, options: {}): void {
  return res.render(view, options);
}
