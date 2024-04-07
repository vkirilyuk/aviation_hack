const htmlparser2 = require("htmlparser2");
const domutils = require("domutils");
const fs = require("node:fs/promises");
const fsSync = require("fs");
const querystring = require("querystring");

const page = "https://www.liveatc.net/recordings.php";

const forbidden = /[\\\/:*?"<>|]/g;

async function getRecordings() {
  const page = await fetch("https://www.liveatc.net/recordings.php").then(
    (res) => res.text()
  );
  const dom = htmlparser2.parseDocument(page);

  await fs.mkdir(`./recordings`, { recursive: true });
  const links = domutils.filter(
    (el) => {
      // if (el === undefined) return false;
      // console.log(el.name);
      // console.log(if );
      // if (el.name === "a") console.log(el.children[0].data);
      return (
        el.name === "a" &&
        el.attribs.href.startsWith(
          "https://forums.liveatc.net/index.php?action=dlattach;"
        )
      );
    },
    dom,
    true
  );
  let i = 0;
  for (const link of links) {
    const url = link.attribs.href;
    const text = link.children[0].data;
    const filename = text.replaceAll(forbidden, "_") + ".mp3";
    console.log(`(${i++}/${links.length}) - ${filename}`);
    const response = await fetch(url);
    const data = await response.arrayBuffer();
    if (data.byteLength > 10000) {
      await fs.writeFile(`./recordings/${filename}`, new Uint8Array(data));
    } else {
      console.log(`File ${filename} is too small. Skipping`);
    }
  }
}

getRecordings();
