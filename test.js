const fs = require("fs");

for (let year = 2000; year < 2024; year++) {
  const directoryPath = `./reports/${year}`;
  const fileList = fs.readdirSync(directoryPath);
  // console.log(fileList);

  let deleted = 0;
  for (const file of fileList) {
    const path = `./reports/${year}/${file}`;
    const stat = fs.statSync(path);
    if (stat.isFile() && stat.size < 10000) {
      // console.log(`File ${path} is a file`, stat.size);
      deleted++;
      fs.unlinkSync(path);
    }
  }
  console.log(`Deleted ${deleted} files from ${year}`);
}
