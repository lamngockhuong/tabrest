export function decideAction({ action, state }) {
  switch (action) {
    case "next":
      if (state.isLast()) return { effect: "none" };
      return { effect: "advance", persist: true };
    case "skip":
      if (state.isLast()) return { effect: "none" };
      return { effect: "advance", persist: false };
    case "back":
      if (state.isFirst()) return { effect: "none" };
      return { effect: "retreat" };
    case "skip-all":
      return { effect: "close" };
    case "finish":
      if (!state.isLast()) return { effect: "none" };
      return { effect: "close" };
    default:
      return { effect: "none" };
  }
}
