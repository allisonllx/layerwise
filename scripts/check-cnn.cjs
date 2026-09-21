// Independent fixtures: boundary placements, stride subsampling, signed outputs,
// and kernel orientation (CNN cross-correlation does not flip the weights).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const Module = require('node:module');
const filename = path.join(__dirname, '../lessons/cnn/model.ts');
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const loaded = new Module(filename); loaded._compile(source, filename);
const {convolve, contributions, image, kernels, outputSize} = loaded.exports;
const rounded = matrix => matrix.map(row => row.map(v => Math.abs(v) < 1e-10 ? 0 : Math.round(v * 1000) / 1000));
const ramp = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]];
assert.deepEqual(convolve(ramp,kernels[0].values), [[6,6],[6,6]]);
assert.deepEqual(convolve(ramp,kernels[1].values), [[24,24],[24,24]]);
assert.deepEqual(rounded(convolve(image,kernels[0].values)), [[0.1,2.1,2.2,0.1],[0.1,2.2,2.1,0],[-0.1,2.1,2.2,0.1],[0.1,2.1,2,0]]);
for (const kernel of kernels) {
 const full = convolve(image,kernel.values);
 assert.deepEqual(convolve(image,kernel.values,2), [[full[0][0],full[0][2]],[full[2][0],full[2][2]]]);
 const terms = contributions(image,kernel.values,3,3,1);
 assert.equal(terms[0].row,3); assert.equal(terms[0].col,3);
 assert.equal(terms[8].row,5); assert.equal(terms[8].col,5);
 assert.equal(terms.reduce((s,t)=>s+t.product,0),full[3][3]);
}
assert.equal(outputSize(6,2),2);
console.log('CNN fixtures passed: complete map, both kernel orientations, stride, and last valid patch.');

const {runCnn, examples, maxPool} = loaded.exports;
assert.deepEqual(maxPool([[1,9,2,3],[4,5,8,7],[6,0,1,2],[3,4,9,5]]), [[9,8],[6,9]]);
for(const stride of [1,2]) {
 const zero = runCnn(Array.from({length:6},()=>Array(6).fill(0.5)),stride);
 assert.deepEqual(zero.flattened,Array(stride===1?8:2).fill(0));
 assert.deepEqual(zero.logits,[0.1,-0.1]);
 assert.ok(Math.abs(zero.probabilities[0]-0.549833997312478)<1e-12);
 for(const example of examples) {
  const m=runCnn(example.values,stride);
  assert.equal(m.convolution.length,2);
  assert.equal(m.flattened.length,stride===1?8:2);
  assert.ok(m.activated.flat(2).every(v=>v>=0));
  assert.deepEqual(m.flattened,m.pooled[0].flat().concat(m.pooled[1].flat()));
  assert.ok(Math.abs(m.probabilities[0]+m.probabilities[1]-1)<1e-12);
  assert.ok(Math.abs(Math.log(m.probabilities[0]/m.probabilities[1])-(m.logits[0]-m.logits[1]))<1e-12);
 }
}
const stageFile=path.join(__dirname,'../lessons/cnn/stages.ts');
const stagesModule=new Module(stageFile);
stagesModule.require=()=>loaded.exports;
stagesModule._compile(ts.transpileModule(fs.readFileSync(stageFile,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,stageFile);
for(const example of examples) for(const stride of [1,2]) {
 const m=runCnn(example.values,stride);
 for(let step=0;step<7;step++) for(let channel=0;channel<2;channel++) for(let index=0;index<(step===0?36:m.convolution[0].length**2);index++) {
  const detail=stagesModule.exports.describeStage(m,step,channel,index);
  assert.ok(!detail.calculation.includes('NaN'));
 }
}
console.log('Full CNN checks passed: pooling fixture, constant-image forward pass, channel order, all examples/strides, stable softmax and every inspectable coordinate.');

// Scrubbing must keep highlighted operands and outputs in the same operation.
const focusFile=path.join(__dirname,'../lessons/cnn/stage-focus.ts');
const focusModule=new Module(focusFile);
focusModule.require=name=>name==='./stages'?stagesModule.exports:loaded.exports;
focusModule._compile(ts.transpileModule(fs.readFileSync(focusFile,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,focusFile);
for(const stride of [1,2]) {
 const m=runCnn(image,stride);
 for(const step of [0,2,3,4,5,6]) {
  const seen=new Set();
  for(let progress=0;progress<=100;progress++) {
   const f=focusModule.exports.stageFocus(m,step,0,1,1,1,progress);
   if(f.visible) {seen.add(f.output);assert.ok(f.order.slice(0,f.visible).includes(f.output));}
   if(step===2) assert.equal(Math.max(0,m.convolution[0].flat()[f.sources[0]]),m.activated[0].flat()[f.output]);
   if(step===3) assert.equal(Math.max(...f.sources.map(i=>m.activated[0].flat()[i])),m.pooled[0].flat()[f.output]);
   if(step===4) assert.equal(m.pooled[f.displayChannel].flat()[f.sources[0]],m.flattened[f.output]);
   if(step===6) assert.equal(f.sources[0],f.output);
  }
  assert.equal(seen.size,step===0?36:step===2?m.activated[0].flat().length:step===3?m.pooled[0].flat().length:step===4?m.flattened.length:2);
 }
}
console.log('Animation focus checks passed: every revealed output, pooling window, flatten channel and softmax class stays connected while scrubbing.');
