export function isDevin() {
  return process.env.IS_DEVIN === "true";
}

export function getAppName() {
  return isDevin() ? "Devin Vending Machine" : "Vending Machine";
}
