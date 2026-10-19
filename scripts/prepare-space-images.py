"""Verify NASA downloads, remove repeated frames, and export proportional WebP images."""
import json, hashlib, math
from pathlib import Path
from PIL import Image, ImageOps, ImageStat

root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'tmp/nasa-library-downloads.json').read_text(encoding='utf-8'))
valid=[]; rejected=[]; fingerprints=[]; pixel_hashes=set(); source_hashes=set(); counts={}

def ahash(im):
    vals=list(im.convert('L').resize((16,16),Image.Resampling.LANCZOS).getdata())
    mean=sum(vals)/len(vals)
    return sum((v>mean)<<i for i,v in enumerate(vals))

def dhash(im):
    vals=list(im.convert('L').resize((17,16),Image.Resampling.LANCZOS).getdata())
    return sum((vals[y*17+x]>vals[y*17+x+1])<<(y*16+x) for y in range(16) for x in range(16))

for x in rows:
    try:
        if x.get('error'):raise ValueError(x['error'])
        cat=x['category']
        if counts.get(cat,0)>=60 and not x.get('landmark') and not x.get('existing'):continue
        p=root/x['raw']; raw=p.read_bytes(); sh=hashlib.sha256(raw).hexdigest()
        with Image.open(p) as original:
            original.load(); im=ImageOps.exif_transpose(original).convert('RGB')
        w,h=im.size
        if max(w,h)<550 or min(w,h)<160:raise ValueError('Insufficient resolution')
        if max(w,h)/min(w,h)>6:raise ValueError('Extreme aspect ratio')
        if sh in source_hashes:raise ValueError('Identical source image')
        thumb=im.copy();thumb.thumbnail((256,256))
        ph=hashlib.sha256(thumb.tobytes()).hexdigest()
        if ph in pixel_hashes:raise ValueError('Identical decoded image')
        a,d=ahash(im),dhash(im)
        duplicate=next((fid for fid,fc,fa,fd in fingerprints if (a^fa).bit_count()<=6 and (d^fd).bit_count()<=7),None)
        if duplicate and not x.get('existing') and not x.get('landmark'):raise ValueError('Repeated frame: '+duplicate)
        source_hashes.add(sh);pixel_hashes.add(ph);fingerprints.append((x['id'],cat,a,d))
        im.thumbnail((1600,1600),Image.Resampling.LANCZOS)
        full='assets/physics/'+x['id']+'.webp';small='assets/physics/'+x['id']+'-small.webp'
        if not x.get('existing'):
            im.save(root/full,'WEBP',quality=86,method=5)
            th=im.copy();th.thumbnail((640,640),Image.Resampling.LANCZOS);th.save(root/small,'WEBP',quality=82,method=5)
        else:
            with Image.open(root/full) as existing:im=existing.copy()
        x.update(local=full,thumbnail=small,width=im.width,height=im.height,sourceSha256=sh,originalWidth=w,originalHeight=h)
        valid.append(x);counts[cat]=counts.get(cat,0)+1
    except Exception as e:rejected.append({'id':x['id'],'category':x['category'],'reason':str(e)})

(root/'tmp/nasa-library-prepared.json').write_text(json.dumps(valid,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'tmp/nasa-library-rejected.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'counts':counts,'total':len(valid),'rejected':len(rejected)},ensure_ascii=False))
