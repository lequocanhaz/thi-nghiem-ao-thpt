import experiments from './experiments-en-US.js?v=54';
import {messagesFor} from './messages.js?v=54';
import {physicsGlossary} from './glossary.js?v=54';
export default {...messagesFor(1),physics:Object.fromEntries(physicsGlossary.map(term=>[term.key,term.en])),experiments};
