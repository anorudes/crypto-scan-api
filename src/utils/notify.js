export default (res, str) => {
  console.log(str);
  res.write(`\r\n${str}`);
}
