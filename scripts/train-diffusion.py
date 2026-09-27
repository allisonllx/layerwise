"""Reproduce Layerwise's recorded DDPM calculations (CPU, fixed seed).
Requires torch, numpy and scikit-learn. No model/data download: load_digits is bundled.
Run: python3 scripts/train-diffusion.py --steps 4000
Weights are optional local output; the browser uses exported calculation traces.
"""
import argparse, hashlib, json, math, time
from pathlib import Path
import numpy as np
import torch
from torch import nn
from torch.nn import functional as F
from sklearn.datasets import load_digits

class TinyUNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.encoder = nn.Sequential(nn.Conv2d(2,16,3,padding=1),nn.SiLU(),nn.Conv2d(16,16,3,padding=1),nn.SiLU())
        self.middle = nn.Sequential(nn.Conv2d(16,32,3,padding=1),nn.SiLU(),nn.Conv2d(32,32,3,padding=1),nn.SiLU())
        self.decoder = nn.Sequential(nn.Conv2d(48,16,3,padding=1),nn.SiLU(),nn.Conv2d(16,16,3,padding=1),nn.SiLU())
        self.output = nn.Conv2d(16,1,1)
    def forward(self,x,t,trace=False):
        time_plane = (t.float()/100).view(-1,1,1,1).expand(-1,1,8,8)
        enc = self.encoder(torch.cat([x,time_plane],dim=1))
        down = F.avg_pool2d(enc,2)
        middle = self.middle(down)
        up = F.interpolate(middle,scale_factor=2,mode='nearest')
        joined = torch.cat([up,enc],dim=1)
        dec = self.decoder(joined)
        out = self.output(dec)
        return (out,[enc,down,middle,up,joined,dec]) if trace else out

def flat(x): return np.round(x.detach().cpu().numpy().reshape(-1),7).tolist()
def channels(x): return [flat(c) for c in x[0]]

def main():
    args=argparse.ArgumentParser();args.add_argument('--steps',type=int,default=4000);args.add_argument('--checkpoint',default='/tmp/layerwise-ddpm.pt');args.add_argument('--export-only',action='store_true');a=args.parse_args()
    torch.set_num_threads(4);torch.manual_seed(27);np.random.seed(27)
    digits=load_digits()
    # Fixed disjoint split, labels only select display examples, never model inputs.
    order=np.random.default_rng(27).permutation(len(digits.images));train_ids=order[:1500];test_ids=order[1500:]
    data=torch.tensor(digits.images/8-1,dtype=torch.float32).unsqueeze(1)
    train=data[train_ids];test=data[test_ids]
    steps=100
    curve=torch.cos((torch.arange(steps+1)/steps+.008)/1.008*math.pi/2)**2
    beta=torch.zeros(steps+1);beta[1:]=torch.clamp(1-curve[1:]/curve[:-1],max=.999)
    alpha=1-beta;abar=torch.cumprod(alpha,0)
    def noisy(x,t,noise): return abar[t,None,None,None].sqrt()*x+(1-abar[t,None,None,None]).sqrt()*noise
    model=TinyUNet();opt=torch.optim.Adam(model.parameters(),lr=.001)
    eval_gen=torch.Generator().manual_seed(991)
    eval_t=torch.randint(1,101,(len(test),),generator=eval_gen);eval_noise=torch.randn(test.shape,generator=eval_gen)
    eval_x=noisy(test,eval_t,eval_noise)
    history=[]
    def measure(step):
        with torch.no_grad(): loss=float(F.mse_loss(model(eval_x,eval_t),eval_noise))
        history.append({'step':step,'loss':loss});print(f'update {step}: fixed held-out noise MSE {loss:.5f}',flush=True)
    measure(0);started=time.time()
    if a.export_only:
        model.load_state_dict(torch.load(a.checkpoint,weights_only=True))
        previous=Path(__file__).resolve().parents[1]/'lessons/diffusion/recording.json'
        history=json.loads(previous.read_text())['history']
    for i in range(1,1 if a.export_only else a.steps+1):
        x=train[torch.randint(len(train),(128,))];t=torch.randint(1,101,(128,));eps=torch.randn_like(x)
        loss=F.mse_loss(model(noisy(x,t,eps),t),eps)
        opt.zero_grad();loss.backward();opt.step()
        if i%250==0 or i==a.steps:measure(i)
    if not a.export_only: torch.save(model.state_dict(),a.checkpoint)
    model.eval()
    payload={'meta':{'dataset':'scikit-learn / UCI optical recognition handwritten digits','trainingCount':1500,'heldOutCount':297,'trainingSeed':27,'updates':a.steps,'batchSize':128,'optimizer':'Adam','learningRate':.001,'timesteps':100,'schedule':'cosine, offset 0.008; beta capped at 0.999','parameters':sum(p.numel() for p in model.parameters()),'torchVersion':torch.__version__,'checkpointSha256':hashlib.sha256(Path(a.checkpoint).read_bytes()).hexdigest()},'beta':beta.tolist(),'alphaBar':abar.tolist(),'history':history,'examples':[],'samples':[]}
    with torch.no_grad():
        for label in [0,3,7]:
            idx=next(int(i) for i in test_ids if digits.target[i]==label);x=data[idx:idx+1]
            gen=torch.Generator().manual_seed(300+label);eps=torch.randn(x.shape,generator=gen)
            # Coupled marginal views use the same epsilon across t, not a Markov path.
            xt=torch.cat([noisy(x,torch.tensor([t]),eps) for t in range(1,101)])
            pred=model(xt,torch.arange(1,101))
            t=40;out,trace=model(xt[t-1:t],torch.tensor([t]),True)
            payload['examples'].append({'label':label,'datasetIndex':idx,'clean':flat(x),'noise':flat(eps),'predictions':[flat(p) for p in pred],'traces':{str(t):[channels(v) for v in model(xt[t-1:t],torch.tensor([t]),True)[1]] for t in [10,40,80]}})
        for seed in [41,42,43]:
            gen=torch.Generator().manual_seed(seed);x=torch.randn((1,1,8,8),generator=gen)
            frames=[flat(x)];predictions=[];innovations=[];means=[]
            for t in range(100,0,-1):
                pred=model(x,torch.tensor([t]));predictions.append(flat(pred))
                # Clipped clean estimate and DDPM posterior mean; no ground-truth image.
                x0=((x-(1-abar[t]).sqrt()*pred)/abar[t].sqrt()).clamp(-1,1)
                coef1=abar[t-1].sqrt()*beta[t]/(1-abar[t])
                coef2=alpha[t].sqrt()*(1-abar[t-1])/(1-abar[t])
                mean=coef1*x0+coef2*x;means.append(flat(mean))
                variance=beta[t]*(1-abar[t-1])/(1-abar[t])
                z=torch.randn(x.shape,generator=gen) if t>1 else torch.zeros_like(x)
                innovations.append(flat(z));x=mean+variance.sqrt()*z;frames.append(flat(x))
            payload['samples'].append({'seed':seed,'frames':frames,'predictions':predictions,'innovations':innovations,'means':means})
    out=Path(__file__).resolve().parents[1]/'lessons/diffusion/recording.json'
    out.write_text(json.dumps(payload,separators=(',',':')))
    from PIL import Image
    board=Image.new('L',(8*3,8))
    for i,s in enumerate(payload['samples']):
        arr=np.clip((np.array(s['frames'][-1]).reshape(8,8)+1)*127.5,0,255).astype(np.uint8)
        board.paste(Image.fromarray(arr),(i*8,0))
    board.resize((480,160),Image.Resampling.NEAREST).save('/tmp/layerwise-ddpm-samples.png')
    print(f'Exported {out.stat().st_size} bytes in {time.time()-started:.1f}s',flush=True)
if __name__=='__main__':main()
