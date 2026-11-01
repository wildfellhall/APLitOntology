import {project} from '../content-helpers.js';
export function studio(id,title,artifact,brief,topics,stages,focus){
 const [interpretation,creation,visual,analysis,test,reflection]=focus;
 return project(id,title,artifact,brief,topics,stages,[
  ['Reading & interpretation',interpretation,'The reading is defensible and uses relevant details, but one important qualification or connection remains unexplained.','The account relies on plot summary, inaccurate quotation, or claims too broad for its evidence.'],
  ['Creative composition',creation,'The required form is complete and some choices develop the intended tension; other choices remain predictable or inconsistent.','The artifact is incomplete, imitates the source without transformation, or uses the central constraint only decoratively.'],
  ['Visual argument',visual,'The visual is legible and connected to the work, but some relationships are decorative or insufficiently explained.','The visual is absent in substance, difficult to read, or unrelated to the interpretation.'],
  ['Analysis & argument',analysis,'The argument has a defensible thesis and relevant evidence, but commentary or self-analysis does not consistently explain effects.','The commentary labels techniques or reports intentions without demonstrating their effects through evidence.'],
  ['Testing & revision',test,'Reader feedback and a substantive revision are documented, but the relationship between the two is only partly explained.','Revision is limited to proofreading, or feedback is collected without informing a decision.'],
  ['Reflection & attribution',reflection,'The reflection identifies a learning point and credits sources, but its explanation of transfer or limitation is general.','The reflection is chiefly a completion report, or source and creative contributions are not clearly distinguished.'],
 ]);
}
export const stage=(title,instructions,submit)=>({title,instructions,submit});
