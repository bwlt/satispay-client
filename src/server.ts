import { exec } from "child_process";
import * as fromHttp from "./lib/http";
import { app } from "./app";

const { PORT } = process.env;

const port = PORT ? parseInt(PORT) : undefined;

const { getServerUrl } = fromHttp;

process.addListener("unhandledRejection", (err) => {
  console.error(err);
});

const server = app.listen(port, () => {
  const serverUrl = getServerUrl(server);
  exec(`open ${serverUrl}`);
});
