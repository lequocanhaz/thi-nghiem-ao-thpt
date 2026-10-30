// Export the visible SVG with resolved styles; never capture a hidden model.
export async function linkedImage(svg){
 if(!svg)throw new Error('Missing linked diagram');
 const copy=svg.cloneNode(true),source=[svg,...svg.querySelectorAll('*')],target=[copy,...copy.querySelectorAll('*')];
 const properties=['paint-order','fill','stroke','stroke-width','stroke-dasharray','stroke-linecap','stroke-linejoin','font-family','font-size','font-weight','text-anchor','display','opacity','marker-start','marker-end'];
 for(let i=0;i<source.length;i++){
  const style=getComputedStyle(source[i]);
  for(const property of properties){const value=style.getPropertyValue(property).replace(/url\(["']?[^#)]*#([^"')]+)["']?\)/g,'url(#$1)');target[i].style.setProperty(property,value);}
 }
 const box=svg.viewBox.baseVal,scale=2;
 copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',box.width*scale);copy.setAttribute('height',box.height*scale);
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml;charset=utf-8'}));
 try{
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=box.width*scale;canvas.height=box.height*scale;
  const context=canvas.getContext('2d');if(!context)throw new Error('Canvas unavailable');
  context.fillStyle=getComputedStyle(svg.closest('.shm-circle')).backgroundColor;context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
  return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image export failed')),'image/png'));
 }finally{URL.revokeObjectURL(url);}
}
