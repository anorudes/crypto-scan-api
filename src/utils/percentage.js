export function calcPercentage(numb1, numb2) {
  return numb1 && numb2
    ? Math.round(((numb1 / + numb2) - 1) * 100)
    : '';
}
