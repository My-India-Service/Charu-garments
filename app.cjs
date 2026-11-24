/** cPanel / Passenger startup: load CommonJS entry, then ESM app. */
import("./server.js").catch((err) => {
  console.error(err);
  process.exit(1);
});
