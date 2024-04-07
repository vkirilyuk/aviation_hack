const readPdfPages = require('pdf-text-reader');

const fs = require("fs");

// for (let year = 2000; year < 2024; year++) {
//   const directoryPath = `./reports/${year}`;
//   const fileList = fs.readdirSync(directoryPath);
//   // console.log(fileList);

//   let deleted = 0;
//   for (const file of fileList) {
//     const path = `./reports/${year}/${file}`;
//     const stat = fs.statSync(path);
//     if (stat.isFile() && stat.size < 10000) {
//       // console.log(`File ${path} is a file`, stat.size);
//       deleted++;
//       fs.unlinkSync(path);
//     }
//   }
//   console.log(`Deleted ${deleted} files from ${year}`);
// }


function findLocationLine(pages) {

  const oneLine = 'Latitude, Longitude:';
  const twoLine = 'Latitude, ';
  for (const page of pages) {
    for (const line of page.lines) {
      if (line.includes(oneLine)) {
        console.log(line);
        return line.split(oneLine);
      }
      if (line.includes(twoLine)) {
        console.log(line);
        return line.split(twoLine);
      }
    }
  }
  return null;
}

function findLocation(pages) {
  const line = findLocationLine(pages);
  if (!line) {
    console.warn('Could not find a location.');
    return null;
  }
  const [injuries, coordinates] = line;

  // console.log(line);
  // const [injuries, coordinates] = line.split('Latitude, Longitude:');
  const numbers = coordinates.trim().split('(')[0];
  const harmed = injuries.replace('Total Injuries: ', '');
  return [harmed, numbers.split(',').map(Number)];
}

async function main() {
  const data = [];
  for (let year = 2000; year < 2024; year++) {
    const directoryPath = `./reports/${year}`;
    const fileList = fs.readdirSync(directoryPath);
    // console.log(fileList);

    let deleted = 0;
    for (const file of fileList) {
      const path = `./reports/${year}/${file}`;
      const stat = fs.statSync(path);
      if (!stat.isFile()) continue;

      const pages = await readPdfPages.readPdfPages({url: path});
      const text = pages.map(page => page.lines.join('\n')).join('\n\n');

      fs.writeFileSync(path + '.txt', text);

      // console.log(text);
      continue;



      const result = findLocation(pages);
      if (result) {
        const [injuries, location] = result;
        data.push({
          path,
          injuries,
          latitude: location[0],
          longitude: location[1],
        })
        console.log(file, injuries, location);
      }
    }
  }
  // fs.writeFileSync('map.json', JSON.stringify(data, null, 2));
}

main();
