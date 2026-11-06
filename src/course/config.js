import {catalog,units,projectById,classicalProjects} from '../data/curriculum.js';
import {courseQuestionIndex} from '../data/question-index.js';
import {makeConfig} from './engine.js';
// Skills applied by each project, independent of the book used in a node's sample lesson.
const projectConcepts={
 'pride-prejudice':['social-setting','complex-relationships','irony-satire'],
 frankenstein:['frame-narrative','narrative-ethics','theme-interpretation'],
 'jane-eyre':['setting-character','point-of-view','protagonist-agency'],
 'great-expectations':['character-development','symbolism','narrative-distance'],
 awakening:['motivation','social-setting','epiphany'],
 'yellow-wallpaper':['limited-perspective','motif-recurrence','alternative-readings'],
 'poe-tales':['unreliable-narration','tension-suspense','gothic-uncanny'],
 hamlet:['dramatic-irony','soliloquy-aside','performance-adaptation'],
 'dolls-house':['dramatic-dialogue','power-social-order','open-endings'],
 'blake-songs':['poetic-speaker','symbolism','comparative-reading'],
 'dickinson-poems':['paradox-ambiguity','personification','qualified-interpretation'],
 'shakespeare-sonnets':['sonnet','shifts-volta','extended-metaphor'],
 'harlem-shadows':['poetic-speaker','imagery','form-tension'],
 'lyrical-ballads':['ballad-narrative-poetry','setting','poetic-speaker'],
 'keats-1820':['ode-elegy','apostrophe-address','imagery'],
 'browning-romances':['dramatic-monologue','unreliable-narration','dramatic-situation'],
 'gray-poems':['ode-elegy','poetic-speaker','historical-context'],
};
export const courseConfig=makeConfig({id:'ap-literature',label:'AP Literature',concepts:catalog,units,questions:courseQuestionIndex,projects:projectById,textProjects:classicalProjects.map(p=>({id:p.id,title:p.title,href:`#/project/${p.id}`,conceptIds:projectConcepts[p.book],minutes:1080}))});
