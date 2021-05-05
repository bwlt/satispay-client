import express from "express";
import * as routes from "./routes";
import * as path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import * as middlewares from "./middlewares";

export const app = express()
  .set("view engine", "pug")
  .set("views", path.join(__dirname, '../views'))
  .use(
    session({ resave: false, secret: "keyboard snek", saveUninitialized: true })
  )

  .get("/activate", routes.activate.get)
  .post(
    "/activate",
    bodyParser.urlencoded({ extended: false }),
    routes.activate.post
  )

  .get("/__views/:viewName", routes.views.get)
  .use(middlewares.auth({ redirectTo: "/activate" }))

  .get("/", routes.home.get)

  .get("/api-create-payment", routes.apiCreatePayment.get)
  .post(
    "/api-create-payment",
    bodyParser.urlencoded({ extended: false }),
    routes.apiCreatePayment.post
  )

  .get("/api-create-authorization", routes.apiCreateAuthorization.get)
  .post(
    "/api-create-authorization",
    bodyParser.urlencoded({ extended: false }),
    routes.apiCreateAuthorization.post
  )

  .get("*", (_req, res) => res.redirect("/"));
