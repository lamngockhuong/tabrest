export function createState(total) {
  if (!Number.isInteger(total) || total < 1) {
    throw new Error("createState: total must be a positive integer");
  }

  let stepIndex = 0;

  return {
    get stepIndex() {
      return stepIndex;
    },
    get total() {
      return total;
    },
    isFirst() {
      return stepIndex === 0;
    },
    isLast() {
      return stepIndex === total - 1;
    },
    advance() {
      if (stepIndex < total - 1) stepIndex += 1;
      return stepIndex;
    },
    retreat() {
      if (stepIndex > 0) stepIndex -= 1;
      return stepIndex;
    },
  };
}
