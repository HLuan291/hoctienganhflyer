import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createContext,runInContext} from 'node:vm';

const source=await readFile(new URL('../ui/app.js',import.meta.url),'utf8');
const bootstrapCode=source.slice(0,source.indexOf('function renderAccount()'));
const storage=new Map();
const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
const progress={name:'Bé',completed:{},history:[],cards:{},games:{},questionTurns:{},placement:{done:true,results:{},starts:{}},sound:true};
const profile={id:'123e4567-e89b-12d3-a456-426614174000',name:'Bé',revision:3,data:progress};

function app(fetch){
  const events={};let view='';
  const window={QUEST_PACKS:[],QUEST_TRACKS:[],addEventListener:(name,callback)=>{events[name]=callback}};
  const document={getElementById:()=>({textContent:'',title:'',setAttribute(){},classList:{toggle(){}}})};
  const context=createContext({window,document,localStorage,fetch,setView:name=>{view=name},console,Date,JSON,Number,Math,Map,Array,String,Boolean,Promise});
  runInContext(bootstrapCode,context);
  return {context,events,get view(){return view}};
}
const response=(body,status=200)=>({ok:status<400,status,json:async()=>body});
const online=app(async()=>response(profile));
await runInContext('bootstrapSolo()',online.context);
assert.equal(online.view,'home');
assert.ok(storage.has('english-quest-progress-v1:solo-profile'));
assert.ok(storage.has(`english-quest-progress-v1:${profile.id}`));

const offline=app(async()=>{throw Error('network unavailable')});
await runInContext('bootstrapSolo()',offline.context);
assert.equal(offline.view,'home');
assert.equal(runInContext('activeProfile.id',offline.context),profile.id);
await runInContext("data.name='Tên mới';persist()",offline.context);
assert.equal(storage.get(`english-quest-progress-v1:dirty:${profile.id}`),'1');
await new Promise(resolve=>setTimeout(resolve,0));

const puts=[];
offline.context.fetch=async(_path,options)=>{
  puts.push(JSON.parse(options.body));
  return response({revision:4});
};
await offline.events.online();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(puts.length,1);
assert.equal(puts[0].data.name,'Tên mới');
assert.equal(storage.has(`english-quest-progress-v1:dirty:${profile.id}`),false);
assert.equal(JSON.parse(storage.get(`english-quest-progress-v1:${profile.id}`)).name,'Tên mới');
offline.context.fetch=async()=>response({...profile,revision:5,data:{...progress,name:'Thiết bị khác'}});
await offline.events.online();
await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(runInContext('data.name',offline.context),'Thiết bị khác');
assert.equal(JSON.parse(storage.get(`english-quest-progress-v1:${profile.id}`)).name,'Thiết bị khác');
console.log('Offline reload, local edits, reconnect sync and remote refresh passed.');

