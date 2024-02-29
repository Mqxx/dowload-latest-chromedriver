import { parseArgs } from "https://deno.land/std@0.217.0/cli/mod.ts";
import {
  BlobWriter,
  ZipReader
} from "https://deno.land/x/zipjs@v2.7.36/index.js";


const args = parseArgs<{
  name : string,
  destination : string,
}>(Deno.args)

args.name = args.name ?? 'chromedriver.exe';
args.destination = args.destination ?? './';

const path = `${args.destination}/${args.name}`

console.log('name=', args.name);
console.log('destination=', args.destination);
console.log(path);


const latestVersion = await fetch('https://googlechromelabs.github.io/chrome-for-testing/LATEST_RELEASE_STABLE').then(result => result.text()) as string;

const json = await fetch(`https://googlechromelabs.github.io/chrome-for-testing/${latestVersion}.json`).then(result => result.json());

const driver = json.downloads.chromedriver.filter((entry : any) => entry.platform == 'win64')[0].url

fetch(driver).then(response => response.blob()).then(blob => blob.stream()).then(async stream => {

  const zipReader = new ZipReader(stream, {useWebWorkers: false})
  const driver = (await zipReader.getEntries()).filter(({filename}) => filename === 'chromedriver-win64/chromedriver.exe')[0]
  zipReader.close();
  const writer = new BlobWriter();
  const exe = await driver.getData!(writer)
  
  Deno.mkdirSync(args.destination, {recursive: true})
  Deno.writeFileSync(path, new Uint8Array(await exe.arrayBuffer()))
})
