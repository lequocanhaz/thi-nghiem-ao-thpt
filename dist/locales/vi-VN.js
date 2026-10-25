import experiments from './experiments-vi-VN.js?v=54';
import {messagesFor} from './messages.js?v=54';
import {physicsGlossary} from './glossary.js?v=54';
export default {...messagesFor(0),physics:Object.fromEntries(physicsGlossary.map(term=>[term.key,term.vi])),experiments};
