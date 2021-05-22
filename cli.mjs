#!/usr/bin/env node

// @ts-check

import { execSync } from "child_process";
import net from "net";
import http from "http";
import path from "path";
import next from "next";

function getDir() {
  const url = new URL(
    // @ts-expect-error
    import.meta.url
  );
  return path.dirname(url.pathname);
}

const port = parseInt(process.env.PORT) || 0;
const app = next({ dev: false, dir: getDir() });
const handle = app.getRequestHandler();

/**
 * @param {string | net.AddressInfo} a
 * @returns {a is net.AddressInfo}
 */
function isAddressInfo(a) {
  return typeof a !== "string";
}

async function main() {
  await app.prepare();
  const server = http.createServer(handle);
  await new Promise((resolve) => {
    server.listen(port, () => resolve());
  });
  const address = server.address();
  if (!isAddressInfo(address)) throw new Error("Invalid address");
  const localUrl = `http://localhost:${address.port}`;
  console.log(`> Server listening on ${localUrl}`);
  execSync(`open ${localUrl}`);
}

main();
