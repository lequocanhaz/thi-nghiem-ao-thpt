export function boundedPage(value,total){const n=Number(value);return Number.isFinite(n)?Math.max(1,Math.min(total,Math.trunc(n))):1;}
export function spreadPages(page,total,two=false){page=boundedPage(page,total);if(!two||page===1)return[page];const first=page%2===0?page:page-1;return first===total?[first]:[first,first+1];}
export function turnPage(page,total,two,direction){const visible=spreadPages(page,total,two);return boundedPage(direction>0?visible.at(-1)+1:visible[0]-1,total);}
export function pageImage(grade,page){return `books/${grade}/${String(page).padStart(3,'0')}.webp`;}
