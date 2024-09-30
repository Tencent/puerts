import { mkdir } from "@puerts/shell-util";
import { existsSync, readFileSync, statSync } from "fs";
import { createRequire } from "module";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);
const require = createRequire(import.meta.url);
const tar = require('tar');

const rawAxios = require('axios');
const https = require('https');
const axios = rawAxios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

const ProgressBar = require('progress');

async function downloadAndExtractTarGz(url, outputDir) {
  const tempFilePath = path.join(outputDir, 'temp.tar.gz');
  
  const { headers } = await axios.head(url);
  const totalSize = parseInt(headers['content-length'], 10);
  
  const progressBar = new ProgressBar('Downloading [:bar] :percent :etas', {
    width: 40,
    complete: '=',
    incomplete: ' ',
    renderThrottle: 16,
    total: totalSize,
  });

  // Step 1: Download the tar.gz file
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  
  response.data.on('data', (chunk) => {
    progressBar.tick(chunk.length);
  });
  
  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 2: Save the tar.gz file to a temporary location
  await pipelineAsync(response.data, fs.createWriteStream(tempFilePath));

  // Step 3: Extract the tar.gz file
  await tar.x({
    file: tempFilePath,
    cwd: outputDir,
  });

  // Step 4: Clean up the temporary file
  fs.unlinkSync(tempFilePath);

  console.log(`Downloaded and extracted to ${outputDir}`);
}

export default async function downloadBackend(cwd, name, url = "") {
    if (!existsSync(join(cwd, "CMakeLists.txt"))) {
        throw new Error("invalid puerts native_src directory: " + cwd);
    }
    const backendDir = join(cwd, '../native_src/.backends');
    mkdir("-p", backendDir);
    if (existsSync(join(backendDir, name)) && statSync(join(backendDir, name)).isDirectory()) {
        console.log(`[Puer] download skip: ${name} already exists `);
        return;

    } else if (url) {
        console.log(`[Puer] downloading ${name} from ${url}`);
        await downloadAndExtractTarGz(url, backendDir);

    } else {
        const cfg = readBackendsConfig(cwd);
        if (!(name in cfg)) {
            throw new Error(`invalid backend: ${name}, available backends:${Object.keys(cfg).join(', ')}`);
        }
        url = cfg[name].url;
        if (url) {
            console.log(`[Puer] downloading ${name} from ${url}`);
            await downloadAndExtractTarGz(url, backendDir);

        } else {
            throw new Error(`invalid backend: ${name}, backend url not found`);
        }
    }
}

function readBackendsConfig(cwd) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const backendsJSONPath = join(__dirname, 'backends.json');
    if (existsSync(backendsJSONPath)) {
        return JSON.parse(readFileSync(backendsJSONPath, 'utf-8'));
    } else {
        return {};
    }
}
