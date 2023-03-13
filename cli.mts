#!/usr/bin/env node

import { execSync } from "child_process";
import http from "http";
import next from "next";
import path from "path";
import type net from "net";
import pkg from "./package.json" assert { type: "json" };

console.log(`${pkg.name}@${pkg.version}`);

const port = process.env["PORT"] ? parseInt(process.env["PORT"]) : undefined;

function getDir() {
  const url = new URL(import.meta.url);
  return path.dirname(url.pathname);
}

const app = next({ dir: getDir() });
const handle = app.getRequestHandler();

await app.prepare();
const server = http.createServer(handle);

server.once("error", (err) => {
  console.error(err);
  process.exit(1);
});

function isAddressInfo(
  a: ReturnType<http.Server["address"]>
): a is net.AddressInfo {
  return typeof a !== "string";
}

server.listen(port, () => {
  const address = server.address();
  if (!isAddressInfo(address)) throw new Error("Invalid address");
  const localUrl = `http://localhost:${address.port}`;
  console.log(`> Ready on ${localUrl}`);
  try {
    execSync(`open ${localUrl}`, { stdio: "ignore" });
  } catch (error) {
    //
  }
});
