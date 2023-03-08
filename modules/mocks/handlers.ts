import { rest } from "msw";

export const handlers = [
  rest.post("/api/authenticate", (req, res, ctx) =>
    res(ctx.delay(), ctx.status(200))
  ),
  // rest.post("/api/invoke", (req, res, ctx) =>
  //   res(ctx.delay(), ctx.status(200))
  // ),
];
