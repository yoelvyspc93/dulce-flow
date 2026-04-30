const { spawn } = require("node:child_process");

const target = process.argv[2];
const args = ["expo", "start"];

if (target) {
  args.push(target);
}

const command = process.platform === "win32" ? "cmd.exe" : "npx";
const commandArgs =
  process.platform === "win32"
    ? ["/d", "/s", "/c", ["npx", ...args].join(" ")]
    : args;

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  env: {
    ...process.env,
    EXPO_PUBLIC_SEED_DEMO_DATABASE: "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
