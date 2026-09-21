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
