#!/usr/bin/env node

process.on("SIGINT", () => {
  process.exit(0);
});

import "./server";
