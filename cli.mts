#!/usr/bin/env node

import { execSync } from "child_process";
import http from "http";
import next from "next";
import type net from "net";

const app = next({ dev: false });
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

server.listen(() => {
  const address = server.address();
  if (!isAddressInfo(address)) throw new Error("Invalid address");
  const localUrl = `http://localhost:${address.port}`;
  console.log(`> Ready on ${localUrl}`);
  try {
    execSync(`open ${localUrl}`);
  } catch (error) {
    //
  }
});
