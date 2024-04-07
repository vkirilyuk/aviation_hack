const htmlparser2 = require("htmlparser2");
const domutils = require("domutils");
const fs = require("node:fs/promises");
const fsSync = require("fs");
const querystring = require("querystring");

function queryBuilder(year) {
  return `
  {
    "ResultSetSize":5000,
    "ResultSetOffset":0,
    "QueryGroups":[
       {
          "QueryRules":[
             {
                "RuleType":"Simple",
                "Values":[
                   "${year}-01-01"
                ],
                "Columns":[
                   "Event.EventDate"
                ],
                "Operator":"is on or after",
                "overrideColumn":"",
                "selectedOption":{
                   "FieldName":"EventDate",
                   "DisplayText":"Event date",
                   "Columns":[
                      "Event.EventDate"
                   ],
                   "Selectable":true,
                   "InputType":"Date",
                   "RuleType":0,
                   "Options":null,
                   "TargetCollection":"cases",
                   "UnderDevelopment":true
                }
             },
             {
                "RuleType":"Simple",
                "Values":[
                   "${year}-12-31"
                ],
                "Columns":[
                   "Event.EventDate"
                ],
                "Operator":"is on or before",
                "selectedOption":{
                   "FieldName":"EventDate",
                   "DisplayText":"Event date",
                   "Columns":[
                      "Event.EventDate"
                   ],
                   "Selectable":true,
                   "InputType":"Date",
                   "RuleType":0,
                   "Options":null,
                   "TargetCollection":"cases",
                   "UnderDevelopment":true
                },
                "overrideColumn":""
             },
             {
                "RuleType":"Simple",
                "Values":[
                   "Aviation"
                ],
                "Columns":[
                   "Event.Mode"
                ],
                "Operator":"is",
                "selectedOption":{
                   "FieldName":"Mode",
                   "DisplayText":"Investigation mode",
                   "Columns":[
                      "Event.Mode"
                   ],
                   "Selectable":true,
                   "InputType":"Dropdown",
                   "RuleType":0,
                   "Options":null,
                   "TargetCollection":"cases",
                   "UnderDevelopment":true
                },
                "overrideColumn":""
             }
          ],
          "AndOr":"and",
          "inLastSearch":false,
          "editedSinceLastSearch":false
       }
    ],
    "AndOr":"and",
    "SortColumn":null,
    "SortDescending":true,
    "TargetCollection":"cases",
    "SessionId":707717
  }`;
}

async function downloadResort(docker) {
  // const reportUrl = `https://www.ntsb.gov/investigations/Pages/${docker}.aspx`;
  // const reportText = await fetch(reportUrl).then((res) => res.text());

  // const reportDom = htmlparser2.parseDocument(reportText);
  // console.log(reportDom);
  // const reportLinks = domutils.filter(
  //   (el) => {
  //     // if (el === undefined) return false;
  //     // console.log(el.name);
  //     // console.log(if );
  //     // if (el.name === "a") console.log(el.children[0].data);
  //     return el.name === "a" && el.children[0].data?.includes("final report");
  //   },
  //   reportDom,
  //   true
  // );
  await fs.mkdir(`./reports/${docker}`, { recursive: true });
  // if (reportLinks.length) {
  //   const link = reportLinks[0].attribs.href;
  //   console.log(link);
  //   const data = await fetch(link).then((res) => res.arrayBuffer());

  //   await fs.writeFile(
  //     `./reports/${docker}/final_report.pdf`,
  //     new Uint8Array(data)
  //   );
  // } else {
  //   console.log(`No final report found for ${docker}`);
  //   console.log(reportUrl);
  // }

  await fs.mkdir(`./reports/${docker}/files`, { recursive: true });
  const filesPage = `https://data.ntsb.gov/Docket/?NTSBNumber=${docker}`;
  const filesText = await fetch(filesPage).then((res) => res.text());
  const filesDom = htmlparser2.parseDocument(filesText);
  const filesLinks = domutils.filter(
    (el) => {
      // if (el === undefined) return false;
      // console.log(el.name);
      // console.log(if );
      // if (el.name === "a") console.log(el.children[0].data);
      return el.name === "a" && el.attribs.href.startsWith("/Docket/Document/");
    },
    filesDom,
    true
  );
  for (const el of filesLinks) {
    const href = el.attribs.href;
    const fullUrl = `https://data.ntsb.gov${href}`;
    const fileName = querystring.unescape(href.split("FileName=").pop());
    console.log(fullUrl, fileName);

    const header = await fetch(fullUrl, { method: "HEAD" });
    console.log(header.headers.get("content-length"));

    // const data = await fetch(fullUrl).then((res) => res.arrayBuffer());
    // await fs.writeFile(
    //   `./reports/${docker}/files/${fileName}`,
    //   new Uint8Array(data)
    // );
  }

  console.log(`Done with ${docker}`);
  // console.log(filesLinks);
}

async function downloadReports(year) {
  const queryBody = queryBuilder(year);
  const url = `https://data.ntsb.gov/carol-main-public/api/Query/Main`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: queryBody,
  });
  const text = await response.text();
  // console.log(text);
  let data;
  try {
    data = JSON.parse(text);
    console.log(year, data.Results.length);
  } catch (e) {
    console.log(year, text);
  }

  // if (data) {
  //   await fs.writeFile(`./reports/${year}.json`, JSON.stringify(data, null, 2));
  // }

  // return;
  // console.log(data);

  await fs.mkdir(`./reports/${year}`, { recursive: true });
  let index = 0;
  for (const result of data.Results) {
    const ntsb = result.Fields[0].Values[0];
    console.log(`Downloading ${ntsb} - ${index++} of ${data.Results.length}`);
    const status = result.Fields[1].Values[0];
    if (status === "N/A") {
      console.log(`Skipping ${ntsb} due to status`);
      continue;
    }
    const filename = `./reports/${year}/${ntsb}.pdf`;
    const exists = fsSync.existsSync(filename);
    if (exists) {
      const stat = await fs.stat(filename);
      if (stat.size > 10000) {
        console.log(`File ${filename} is already donloaded, skipping`);
        continue;
      }
    }

    const mkey = result.Fields[3].Values[0];
    const url = `https://data.ntsb.gov/carol-repgen/api/Aviation/ReportMain/GenerateNewestReport/${mkey}/pdf`;
    let bytes;
    let tries = 0;
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const response = await fetch(url);
      if (response.status === 404) {
        console.log(`${ntsb} does not exist ${url}`);
        break;
      }
      if (response.status === 503) {
        console.log(`Access denied, trying again ${url}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        break;
      }
      bytes = await response.arrayBuffer();
      if (bytes.byteLength > 10000) break;
      console.log(`Retrying ${ntsb} ${bytes.byteLength}`);
      tries++;
      if (tries > 5) {
        console.log(`Failed to download ${ntsb} ${url}`);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    if (bytes) await fs.writeFile(filename, new Uint8Array(bytes));
  }
}

async function doMagic() {
  // const years = [];
  const start = 2016;
  const end = 2023;
  for (let year = start; year < end; year++) {
    setTimeout(() => {
      downloadReports(year);
    }, 2000 * (year - start));
    // years.push(String(i));
  }
  // console.log(years);
  // const promises = years.map((year) => downloadReports(year));
  // await Promise.all(promises);
}

doMagic();

// const report = "DCA21FA085";
// downloadResort(report);

// console.log("Fuck yeah!");
