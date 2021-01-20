import { Server } from "http";

export function getServerUrl(server: Server): undefined | string {
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Unexpected address");
  }
  if (address.family === "IPv6" && address.address === "::") {
    return `http://localhost:${address.port}`;
  }
  return `http://[${address.address}]:${address.port}`;
}
