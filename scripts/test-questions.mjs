import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';

const load=async path=>readFile(new URL(path,import.meta.url),'utf8');
const context={window:{},data:{questionTurns:{}},persist(){}};
for(const path of ['../ui/data.js','../ui/usage.js','../ui/question-bank.js','../ui/question-bank-more.js'])runInNewContext(await load(path),context);
const app=await load('../ui/app.js');
const start=app.indexOf('function shuffleOptions('),end=app.indexOf('function openLesson(');
assert.ok(start>=0&&end>start);
runInNewContext(app.slice(start,end),context);

const {QUEST_PACKS:packs,QUEST_QUESTION_BANK:bank,QUEST_QUESTION_BANK_MORE:moreBank,QUEST_USAGE:usage}=context.window;
assert.equal(packs.length,12);
assert.equal(Object.keys(bank).length,12);
assert.equal(Object.keys(moreBank).length,12);
const signature=questions=>questions.map(q=>`${q.text}|${q.audio||''}|${q.context||''}`).join('~');
let checked=0,newQuestions=0;
const missingEvidence=[];
for(const pack of packs){
  assert.equal(pack.words.length,8);
  assert.equal(usage[pack.id].length,8);
  for(let i=0;i<8;i++){const blank=context.blankUsage(pack,i);assert.ok(blank.includes('_____'),`Missing target word in example for level ${pack.id}, word ${i+1}`);assert.ok(!new RegExp(`\\b${pack.words[i][0]}\\b`,'i').test(blank));}
  for(const track of ['listening','reading']){
    const extra=bank[pack.id][track];
    assert.equal(extra.questions.length,2);
    assert.ok((extra.audio||extra.context).length>40);
    for(const row of extra.questions){assert.ok(row[0].length>8);assert.equal(row[2].length,3);assert.equal(new Set(row[2]).size,3);assert.ok(row[2].includes(row[1]));}
    const blocks=moreBank[pack.id][track];assert.equal(blocks.length,2);
    for(const block of blocks){
      const passage=block.audio||block.context;assert.ok(passage.length>90);assert.equal(block.questions.length,4);
      for(const row of block.questions){
        newQuestions++;
        assert.ok(row[0].length>8);assert.equal(row[2].length,3);assert.equal(new Set(row[2]).size,3);assert.ok(row[2].includes(row[1]));
        if(!passage.toLowerCase().replace(/[’]/g,"'").includes(row[1].toLowerCase().replace(/[’]/g,"'")))missingEvidence.push(`${pack.id}/${track}: ${row[0]} => ${row[1]}`);
      }
    }
    const seen=new Set(),rounds=[];for(let turn=0;turn<13;turn++){const questions=context.comprehensionQuestions(track,pack,turn);rounds.push(questions);for(const q of questions)seen.add(`${q.text}|${q.audio||q.context}`);}
    assert.equal(seen.size,13,`${track} level ${pack.id} should cover all passage questions`);
    assert.ok(rounds.flat().some(q=>q.kind==='input'),`${track} level ${pack.id} needs short written answers`);
    for(let turn=1;turn<13;turn++){const prior=new Set(rounds[turn-1].map(q=>`${q.text}|${q.audio||q.context}`));assert.ok(rounds[turn].every(q=>!prior.has(`${q.text}|${q.audio||q.context}`)),`${track} level ${pack.id} repeated a question immediately`);}
  }
  for(const track of ['vocab','listening','reading','writing','speaking']){
    const q0=context.questionsFor(track,pack,0),q1=context.questionsFor(track,pack,1);
    assert.equal(q0.length,track==='vocab'?8:track==='speaking'?1:6);
    assert.notEqual(signature(q0),signature(q1),`${track} level ${pack.id} must change on retry`);
    if(track!=='speaking')assert.notEqual(signature(q0.slice(0,3)),signature(q1.slice(0,3)),`${track} placement level ${pack.id} must change`);
    for(const questions of [q0,q1])for(const q of questions){
      if(q.kind==='choice'){assert.ok(q.options.includes(q.answer));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.options.length>=3);}
      if(q.kind==='input')assert.ok(q.answer);
      if(q.kind==='speaking')assert.ok(q.model.length>20);
      checked++;
    }
  }
  for(const track of ['vocab','listening','reading']){
    const q0=context.skipQuestionsFor(track,pack,0),q1=context.skipQuestionsFor(track,pack,1);
    assert.equal(q0.length,track==='vocab'?12:11);
    assert.notEqual(signature(q0),signature(q1),`${track} skip level ${pack.id} must change`);
    for(const q of q0)if(q.kind==='choice')assert.ok(q.options.includes(q.answer));
  }
}
assert.deepEqual(missingEvidence,[]);
assert.equal(newQuestions,192);
assert.equal(context.nextQuestionTurn('skip','vocab',1),0);
assert.equal(context.nextQuestionTurn('lesson','vocab',1),1);
assert.equal(context.nextQuestionTurn('placement','vocab',1),2);
console.log(`Question bank: 12 levels, 312 listening/reading questions, ${checked} generated questions checked.`);

