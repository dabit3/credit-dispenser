export function getAppName() {
  return process.env.IS_DEVIN === "true"
    ? "Devin Vending Machine"
    : "Vending Machine";
}
