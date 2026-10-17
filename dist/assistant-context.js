// Counts come from the same catalog used by search and experiment routes.
export function libraryContext(experiments){
 const countBy=key=>Array.from(new Set(experiments.map(e=>e[key]))).map(value=>({[key]:value,count:experiments.filter(e=>e[key]===value).length}));
 return {id:'library',title:'Thư viện thí nghiệm Vật lí THPT',totalExperiments:experiments.length,grades:countBy('grade'),topics:countBy('topic')};
}
