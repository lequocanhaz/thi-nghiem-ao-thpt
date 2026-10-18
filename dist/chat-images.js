const raster=/^image\/(?:png|jpe?g|webp|gif|avif|heic|heif)$/i;
export function isImageFile(file){return !!file&&(raster.test(file.type)||(!file.type&&/\.(?:png|jpe?g|webp|gif|avif|heic|heif)$/i.test(file.name||'')));}
export const imageLimits={count:2,maxFileBytes:20*1024*1024,maxEdge:2000,maxDataLength:850000};
// Decode locally, preserve orientation via the browser, then send bounded JPEG data.
export async function prepareImage(file,{document=globalThis.document,ImageClass=globalThis.Image,url=globalThis.URL}={}){
 if(!isImageFile(file))throw Error('Chọn ảnh JPG, PNG, WebP hoặc ảnh chụp từ điện thoại.');
 if(!file.size||file.size>imageLimits.maxFileBytes)throw Error('Mỗi ảnh cần nhỏ hơn 20 MB. Hãy chọn ảnh khác hoặc chụp màn hình.');
 const source=url.createObjectURL(file),picture=new ImageClass();picture.decoding='async';
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Ảnh tải quá lâu. Hãy chọn lại ảnh.')),15000);picture.onload=()=>{clearTimeout(timer);resolve();};picture.onerror=()=>{clearTimeout(timer);reject(Error('Chưa đọc được ảnh này. Hãy dùng JPG, PNG, WebP hoặc chụp màn hình.'));};picture.src=source;});
  const originalWidth=picture.naturalWidth||picture.width,originalHeight=picture.naturalHeight||picture.height;
  if(!originalWidth||!originalHeight)throw Error('Ảnh không có kích thước hợp lệ.');
  const scale=Math.min(1,imageLimits.maxEdge/Math.max(originalWidth,originalHeight));let width=Math.max(1,Math.round(originalWidth*scale)),height=Math.max(1,Math.round(originalHeight*scale)),data;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Trình duyệt chưa xử lí được ảnh. Hãy thử lại.');
  const paint=(w,h)=>{canvas.width=w;canvas.height=h;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);ctx.drawImage(picture,0,0,w,h);};
  for(let attempt=0;attempt<5;attempt++){paint(width,height);data=canvas.toDataURL('image/jpeg',Math.max(.58,.86-attempt*.07));if(data.length<=imageLimits.maxDataLength)break;width=Math.max(1,Math.round(width*.8));height=Math.max(1,Math.round(height*.8));}
  if(!/^data:image\/jpeg;base64,/.test(data)||data.length>imageLimits.maxDataLength)throw Error('Ảnh còn quá lớn để gửi. Hãy cắt phần bài tập hoặc đồ thị cần hỏi.');
  const thumbScale=Math.min(1,280/Math.max(width,height));paint(Math.max(1,Math.round(width*thumbScale)),Math.max(1,Math.round(height*thumbScale)));const thumbnail=canvas.toDataURL('image/jpeg',.72);canvas.width=canvas.height=1;
  return {id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2),name:String(file.name||'Ảnh đã chọn').slice(0,160),url:data,thumbnail,width,height};
 }finally{picture.onload=picture.onerror=null;picture.src='';url.revokeObjectURL(source);}
}
export function imageHistory(thread,currentImages=0){
 let remaining=4-currentImages;const history=thread.slice(-10).map(m=>({role:m.role,content:m.content,images:[]}));
 for(let i=history.length-1;i>=0;i--){const pictures=thread.slice(-10)[i].images||[];history[i].images=pictures.slice(-remaining);if(!remaining)history[i].images=[];remaining-=history[i].images.length;}
 return history.map(m=>m.images.length?m:{role:m.role,content:m.content});
}
