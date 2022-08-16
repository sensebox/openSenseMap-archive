import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config({path: '.env'});

import fs from "node:fs";
import https from "node:https";

import { load } from "cheerio";
import dayjs from 'dayjs';
import { renderFile } from "pug";
import webdav from 'webdav';

const ARCHIVE_DATA_FOLDER = process.env.ARCHIVE_FOLDER;
const ARCHIVE_WEB_URL = "https://archive.opensensemap.org"

const INDEX_DATE = process.env.INDEX_DATE || new Date();
const date = dayjs(INDEX_DATE).format('YYYY-MM-DD');

/**
 * Send notification to mattermost if webhook env is specified
 * @param {*} date
 * @param {*} error
 */
const sendNotification = (date, error) => {
  if (process.env.MATTERMOST_HOOK_URL) {
    // Send out notification
    let data;
    if (error) {
      data = JSON.stringify({
        text: `:x: Error while running archive script: ${error}`
      })
    } else {
      data = JSON.stringify({
        text: `:white_check_mark: Successfully created archive for \`${date}\` :tada:`,
      });
    }

    const options = {
      hostname: process.env.MATTERMOST_HOOK_URL,
      port: 443,
      path: `/hooks/${process.env.MATTERMOST_HOOK_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options);
    req.write(data);
    req.end();
  }
}

/**
 * Main entrypoint
 */
async function run () {
  console.log(`Building index for ${date}`);

  // Create date folder
  if (!fs.existsSync(`./public/${date}`)) {
    fs.mkdirSync(`./public/${date}`);
  }


  try {
    const deviceSizes = [];

    // Create WebDAV client
    const client = webdav.createClient(process.env.WEBDAV_REMOTE_URL, {
      username: process.env.WEBDAV_USER,
      password: process.env.WEBDAV_PASSWORD,
    });

    // Get all date folders (WebDAV)
    const dateFolders = await client.getDirectoryContents(
      `${ARCHIVE_DATA_FOLDER}`
    );
    console.log(`Date count: ${dateFolders.length}`);

    // Get all device folders (WebDAV)
    const deviceFolders = await client.getDirectoryContents(
      `${ARCHIVE_DATA_FOLDER}/${date}`
    );
    console.log(`Folders count: ${deviceFolders.length}`);

    // Get all content
    const deviceFoldersContents = await client.getDirectoryContents(
      `${ARCHIVE_DATA_FOLDER}/${date}`,
      { deep: true, glob: "/**/*.{csv,json}" }
    );
    console.log(`Content count: ${deviceFoldersContents.length}`);

    for (const folder of deviceFolders) {
      // Create box folders
      if (!fs.existsSync(`./public/${date}/${folder.basename}`)) {
        fs.mkdirSync(`./public/${date}/${folder.basename}`);
      }

      // Filter content for folder
      const contents = deviceFoldersContents.filter((contents) =>
        contents.filename.includes(folder.basename)
      );
      // console.log(contents);

      const size = contents.reduce((prev, current) => prev + current.size, 0)
      deviceSizes.push(size);

      // Create device index file
      const deviceIndexFile = renderFile("./templates/box.pug", {
        date: date,
        deviceName: folder.basename,
        contents: contents,
        dayjs: dayjs,
      });
      fs.writeFileSync(
        `./public/${date}/${folder.basename}/index.html`,
        deviceIndexFile
      );
    }

    // Create date folder index
    const dateFolderIndex = renderFile("./templates/date.pug", {
      date: date,
      devices: deviceFolders,
      sizes: deviceSizes,
      dayjs: dayjs,
    });
    fs.writeFileSync(`./public/${date}/index.html`, dateFolderIndex);

    // Map for storing date folder sizes
    const dateFolderSizes = new Map();

    // Size of actual date
    const dateSize = deviceSizes.reduce((prev, current) => prev + current, 0);
    console.log(date, dateSize);
    dateFolderSizes.set(date,dateSize);

    if (process.env.PARSE_ARCHIVE_URL.toLowerCase() === 'true') {
      const response = await fetch(ARCHIVE_WEB_URL);
      if (response.ok) {
        const body = await response.text();
        const $ = load(body);
        const tableRows = $("table tbody tr:nth-child(n+3)");
        for (const tableRow of tableRows) {
          const date = $(tableRow).children("td:first-child");
          const size = $(tableRow).children("td:nth-child(3)");
          dateFolderSizes.set(date.text(), size.text());
        }
      }
    } else {
      // Check if ./public/index.html files exists to parse folder sizes
      if (fs.existsSync('./public/index.html')) {
        const $ = load(fs.readFileSync("./public/index.html"));
        const folderSizes = $('td[class=folder-size]');
        for (const folderSize of folderSizes) {
          const dataFolderSize = folderSize.attributes.filter(
            (attribute) => attribute.name === "data-folder-size"
          );
          const dataDate = folderSize.attributes.filter(
            (attribute) => attribute.name === "data-date"
          );
          if (dataDate[0].value !== date) {
            dateFolderSizes.set(dataDate[0].value, dataFolderSize[0].value);
          }
        }
      }
    }
    // console.log(dateFolderSizes)

    // Create root index
    const root = renderFile("./templates/root.pug", {
      dates: dateFolders.reverse(),
      sizes: dateFolderSizes,
      // size: dateSize,
      dayjs: dayjs,
    });
    fs.writeFileSync("./public/index.html", root);

    // Create README
    const readme = renderFile("./templates/readme.pug");
    fs.writeFileSync("./public/README.html", readme);

    // Create LICENSE
    const license = renderFile("./templates/license.pug");
    fs.writeFileSync("./public/LICENSE.html", license);

    sendNotification(date)

    console.log('Finished indexing!!!')

  } catch (error) {
    sendNotification(date, error)
  }
}

// Fire it up!
run()