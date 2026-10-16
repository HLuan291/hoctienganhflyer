import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
const root=resolve(import.meta.dirname,'..'),ui=resolve(root,'ui'),out=resolve(root,'dist');
const files={};
async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await scan(path);else if(entry.isFile())files[relative(ui,path).split(sep).join('/')]=await readFile(path,'utf8')}}
await scan(ui);if(!files['index.html'])throw Error('Missing ui/index.html');
await mkdir(out,{recursive:true});
const worker=await readFile(resolve(root,'worker/index.js'),'utf8');
await writeFile(resolve(out,'index.js'),`const ASSETS = ${JSON.stringify(files)};\n${worker}`);
console.log(`Packed ${Object.keys(files).length} assets`);

