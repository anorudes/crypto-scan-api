export function calcPercentage(numb1, numb2) {
  return numb1 && numb2
    ? (((numb1 / numb2) - 1) * 100).toFixed(1)
    : '';
}
