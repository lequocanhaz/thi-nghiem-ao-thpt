// English navigation metadata for the existing Vietnamese textbooks.
// These are manually edited labels, not replacement scans, textbook translations,
// or a modification of the existing catalog's page/printedPage/lesson metadata.
import {getLocale} from './i18n.js?v=54';
const english={
 10:{
  chapters:[
   'Introduction','Kinematics','Dynamics','Energy, work and power',
   'Momentum','Circular motion','Deformation of solids and fluid pressure'
  ],
  lessons:[
   'Introduction to physics',
   'Safety rules in the physics laboratory',
   'Practical: Estimating measurement uncertainty and recording results',
   'Displacement and distance traveled',
   'Speed and velocity',
   'Practical: Measuring the speed of a moving object',
   'Displacement–time graphs',
   'Changing velocity and acceleration',
   'Motion with constant acceleration',
   'Free fall',
   'Practical: Measuring acceleration due to gravity',
   'Projectile motion',
   'Force addition and resolution; force equilibrium',
   "Newton's first law",
   "Newton's second law",
   "Newton's third law",
   'Gravitational force and tension',
   'Frictional force',
   'Drag and lift',
   'Worked problems in dynamics',
   'Torque and the equilibrium of rigid bodies',
   'Practical: Adding forces',
   'Energy and mechanical work',
   'Power',
   'Kinetic and potential energy',
   'Mechanical energy and conservation of mechanical energy',
   'Efficiency',
   'Momentum',
   'Conservation of momentum',
   'Practical: Momentum before and after a collision',
   'Kinematics of uniform circular motion',
   'Centripetal force and centripetal acceleration',
   'Deformation of solids',
   'Density and fluid pressure'
  ]
 },
 11:{
  chapters:['Oscillations','Waves','Electric fields','Electric current and circuits'],
  lessons:[
   'Simple harmonic motion',
   'Describing simple harmonic motion',
   'Velocity and acceleration in simple harmonic motion',
   'Exercises on simple harmonic motion',
   'Kinetic energy, potential energy and energy transformations in simple harmonic motion',
   'Damped oscillations, forced oscillations and resonance',
   'Exercises on energy transformations in simple harmonic motion',
   'Describing waves',
   'Transverse and longitudinal waves; energy transfer by mechanical waves',
   'Practical: Measuring sound-wave frequency',
   'Electromagnetic waves',
   'Wave interference',
   'Standing waves',
   'Exercises on waves',
   'Practical: Measuring the speed of sound',
   'Electrostatic force between two charges',
   'Introduction to electric fields',
   'Uniform electric fields',
   'Electric potential energy',
   'Electric potential',
   'Capacitors',
   'Electric current',
   "Electrical resistance and Ohm's law",
   'Sources of electromotive force',
   'Electrical energy and electric power',
   'Practical: Measuring the emf and internal resistance of an electrochemical cell'
  ]
 },
 12:{
  chapters:['Thermal physics','Ideal gases','Magnetic fields','Nuclear physics'],
  lessons:[
   'Structure of matter and changes of state',
   'Internal energy and the first law of thermodynamics',
   'Temperature, temperature scales and thermometers',
   'Specific heat capacity',
   'Specific latent heat of fusion',
   'Specific latent heat of vaporization',
   'Exercises on thermal physics',
   'Kinetic molecular model of gases',
   "Boyle's law",
   "Charles's law",
   'The ideal-gas equation of state',
   'Gas pressure in kinetic theory; molecular kinetic energy and temperature',
   'Exercises on ideal gases',
   'Magnetic fields',
   'Magnetic force on a current-carrying conductor; magnetic flux density',
   'Magnetic flux and electromagnetic induction',
   'Alternating-current generators',
   'Applications of electromagnetic induction',
   'Electromagnetic fields and the electromagnetic-wave model',
   'Exercises on magnetic fields',
   'Nuclear structure',
   'Nuclear reactions and binding energy',
   'Radioactive decay',
   'The nuclear industry',
   'Exercises on nuclear physics'
  ]
 }
};
export const bookEnglishMetadata=Object.freeze(english);
export const bookIsEnglish=()=>getLocale()==='en-US';
export const localizedBookTitle=book=>bookIsEnglish()?'Physics '+book.grade:book.title;
export const localizedChapterTitle=(book,index)=>bookIsEnglish()?(english[book.grade]?.chapters[index]||book.chapters[index]?.title):book.chapters[index]?.title;
export const localizedLessonTitle=(book,lesson)=>bookIsEnglish()?(english[book.grade]?.lessons[lesson.number-1]||lesson.title):lesson.title;
export const localizedBookString=(vi,en)=>bookIsEnglish()?en:vi;
export function checkBookMetadata(book){
 const match=english[book.grade];
 return Boolean(match&&book.chapters.length===match.chapters.length&&book.lessons.length===match.lessons.length
  &&match.chapters.every(Boolean)&&match.lessons.every(Boolean)
  &&book.lessons.every((item,i)=>item.number===i+1));
}
export function pageStatusText(book,numbers){
 return bookIsEnglish()?localizedBookTitle(book)+', page '+numbers.join(' and ')+' of '+book.pages:
 book.title+', trang '+numbers.join(' và ')+' trên '+book.pages;
}
export function bookChapterOptionGroups(book,escape){
 const label=(vi,en)=>localizedBookString(vi,en);
 const before=[
  '<option value="0">'+label('Chọn bài học','Select a lesson')+'</option>',
  '<option value="1">'+label('Bìa sách','Cover')+'</option>',
  '<option value="'+book.contentsPage+'">'+label('Mục lục sách','Contents')+'</option>'
 ].join('');
 return before+book.chapters.map((chapter,i)=>
  '<optgroup label="'+escape(localizedChapterTitle(book,i))+'">'+
  '<option value="'+chapter.page+'">'+label('Mở đầu chương · tr. ','Chapter overview · p. ')+chapter.printedPage+'</option>'+
  book.lessons.filter(l=>l.page>=chapter.page&&l.page<(book.chapters[i+1]?.page||Infinity))
  .map(l=>'<option value="'+l.page+'">'+label('Bài ','Lesson ')+l.number+'. '+escape(localizedLessonTitle(book,l))+
    label(' · tr. ',' · p. ')+l.printedPage+'</option>').join('')+
  '</optgroup>').join('');
}
export function bookShelfCards(catalog,escape){
 return catalog.map(b=>{
  const title=escape(localizedBookTitle(b));
  const read=localizedBookString('Đọc sách','Read book');
  const sample=localizedBookString('Bản mẫu','Sample edition');
  const cover=localizedBookString('Bìa ','Cover: ');
  const pages=localizedBookString(' trang',' pages');
  return '<a class="textbook-card" href="books.html?grade='+b.grade+'" aria-label="'+read+' '+title+'">'+
   '<div class="textbook-cover"><img src="books/'+b.grade+'/cover.webp" width="340" height="480" alt="'+cover+title+'" decoding="async"></div>'+
   '<div><div class="textbook-meta"><h2>'+title+'</h2><span>'+b.pages+pages+'</span></div>'+
   (b.sample?'<div class="textbook-edition">'+sample+'</div>':'')+'</div>'+
   '<span class="textbook-open">'+read+' <span aria-hidden="true">↗</span></span></a>';
 }).join('');
}
