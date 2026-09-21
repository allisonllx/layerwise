// Check the numerical teaching sequence against the independent model outputs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'layerwise-transitions-'));
try {
  for (const name of ['transformer', 'lesson-transitions']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'lessons', 'transformer', 'lib', name + '.ts'), 'utf8');
    fs.writeFileSync(path.join(temporary, name + '.js'), ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText);
  }
  const {runModel, examples, gelu} = require(path.join(temporary, 'transformer.js'));
  const {lessonOperations, operationCalculation} = require(path.join(temporary, 'lesson-transitions.js'));
  const near = (a,b) => assert.ok(a === b || Math.abs(a-b) < 1e-10, `${a} != ${b}`);
  let sequences = 0;
  for (const words of examples) {
    const model = runModel(words);
    for (let token=0;token<words.length;token++) for (let head=0;head<3;head++) for (const projection of ['q','k','v']) for (const mlp of ['n2','up','activated','down']) {
      for (const step of [0,1,2,6,8,9,10,11]) {
        const frames = lessonOperations(model,step,token,head,projection,mlp,words);
        const expected = ({0:model.x,1:model.n1,2:model[projection],6:model.attention[head],8:model.projected,9:model.residual,10:model[mlp],11:model.probabilities})[step][token];
        assert.deepEqual(frames.at(-1).output,expected);
        frames.forEach((frame,index)=>{
          if(index) assert.deepEqual(frame.input,frames[index-1].output,'Stage boundary must preserve the previous output');
          frame.output.forEach((result,f)=>{
            const x=frame.input[f];
            let calculated;
            switch(frame.kind){
              case 'add': calculated=x+frame.other[f];break;
              case 'norm': calculated=(x-frame.mean)/frame.divisor;break;
              case 'project': calculated=frame.input.reduce((s,v,i)=>s+v*frame.weights[i][f],0);break;
              case 'mask': calculated=f>token?-Infinity:x;break;
              case 'exp': calculated=Math.exp(x-frame.mean);break;
              case 'divide': calculated=x/frame.divisor;break;
              case 'gelu': calculated=gelu(x);break;
              case 'join': calculated=model.context[Math.floor(f/4)][token][f%4];break;
              default: assert.fail('Unknown operation');
            }
            near(calculated,result);
            assert.ok(!operationCalculation(frame,f).includes('NaN'));
          });
          if(frame.kind==='divide') near(frame.output.reduce((s,v)=>s+v,0),1);
        });
        sequences++;
      }
    }
  }
  console.log(`Verified ${sequences} sequences: every operation, stage boundary, final result, Q/K/V choice, MLP stage, head and example.`);
} finally { fs.rmSync(temporary, {recursive:true,force:true}); }
