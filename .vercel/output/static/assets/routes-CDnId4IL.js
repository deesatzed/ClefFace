import{n as e,r as t,t as n}from"./index-DEOQGmyJ.js";var r={boilerplate:{type:`noul`,instructions:"Is `text` only a heading, running header, page number, or other non-claim that asserts nothing?"},deterministic:{type:`noul`,instructions:"Does `text` state the claim as a fact, with no hedge such as may, might, could, likely, or suggests?"},quantity_present:{type:`noul`,instructions:"Does `text` contain a number, count, percent, or clock time?"},definition_present:{type:`noul`,instructions:"Does `text` define a term with 'defined as', 'means', or 'refers to'?"},decision_point:{type:`noul`,instructions:"Does `text` mark an explicit decision, such as if, whether, otherwise, or decide?"},fully_specified:{type:`noul`,instructions:"Does `text` name the actor and either an input or an output of this step? Answer no if either is missing."},external_check:{type:`noul`,instructions:"Does `text` rely on a citation, guideline, or outside source that is not contained in `text`?"},polarity:{type:`choice`,instructions:"What polarity does `text` assert? If it both negates and states a condition, choose conditional. If you cannot tell, choose unclear.",criteria:{affirmed:`The sentence asserts the claim.`,denied:`The sentence asserts that the claim is not the case.`,conditional:`The claim depends on an explicit if, unless, or when.`,unclear:`The sentence does not show which of the above applies.`}},record_kind:{type:`choice`,instructions:"What kind of record is `text`? Choose one. Do not summarize. Judge only `text`.",criteria:{fact:`A checkable claim stated as fact, not a definition, step, or hedged reading.`,theory:`A hypothesis, model, interpretation, prediction, or hedged causal reading.`,concept:`A named term being defined.`,workflow_step:`An ordered action, trigger, or decision in a described procedure.`,none:`No claim, definition, or step.`}},theory_status:{type:`choice`,instructions:"If `text` is a theory, which status fits? Otherwise choose not_applicable.",criteria:{hypothesis:`Hedged with may, might, could, or named as a hypothesis.`,model:`Named as a model or framework.`,interpretation:`A reading of evidence, including 'according to' or 'interpretation'.`,prediction:`A forecast about a future outcome.`,not_applicable:`Text is not a theory.`}},causal:{type:`choice`,instructions:"Does `text` state a cause, using because, causes, leads to, results in, or due to? Choose unclear only if the causal direction is stated and cannot be read.",criteria:{yes:`An explicit causal connective is present.`,no:`No causal connective is present.`,unclear:`Causal language is present but the direction cannot be read.`}},falsifiable:{type:`choice`,instructions:"If `text` is a theory, can it be falsified from what `text` itself says? Choose unclear unless the sentence states a measurement or says it cannot be tested. Do not use outside knowledge.",criteria:{yes:`The sentence states a measurement, threshold, or other explicit test.`,no:`The sentence says the claim cannot be tested.`,unclear:`The sentence does not say how the claim would be tested.`}},time_scope:{type:`choice`,instructions:"What time does the main claim in `text` sit in? Choose unspecified if cues conflict or are absent. 'Shall' as a standing rule is present, not future.",criteria:{past:`The main verb is past or the sentence reports a completed event.`,present:`The sentence states a current fact or a standing rule.`,future:`The sentence uses will or an explicit future forecast.`,unspecified:`No single time scope is shown.`}},concept_type:{type:`choice`,instructions:"If `text` defines a term, what type is that term? Otherwise choose not_applicable.",criteria:{entity:`A named organization, place, person, or product.`,process:`A procedure, protocol, callback, or pipeline.`,metric:`A score, rate, count, threshold, or index.`,role:`A person-role such as nurse, physician, or operator.`,tool:`A system, database, or software tool.`,other:`A defined term that is none of the above.`,not_applicable:`Text does not define a term.`}}};function i(e,t,n=`clef-flash`){return{model:n,state:{section:e.section_path,unit_id:e.id,text:e.text,before:a(t.before??``),after:a(t.after??``)},questions:r}}function a(e){let t=e.trim();if(t.length<=180)return t;let n=t.slice(0,180),r=n.lastIndexOf(` `);return r>80?n.slice(0,r):n}var o=.72,s=/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Fig|No|St|Dept|Inc|Ltd|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|e\.g|i\.e|U\.S|U\.K)\./g;function c(e){return e.trim().split(/\s+/).filter(Boolean).length}function l(e){let t=5381;for(let n=0;n<e.length;n++)t=(t<<5)+t^e.charCodeAt(n);return(t>>>0).toString(16).padStart(8,`0`)}function u(e,t){return e+String(t).padStart(3,`0`)}function d(e){let t=e.trim();if(t.length<=180)return t;let n=t.slice(0,180),r=n.lastIndexOf(` `);return r>80?n.slice(0,r):n}function f(e){let t=e.replace(s,e=>e.replace(/\./g,`∯`));t=t.replace(/(\d)\.(\d)/g,`$1∯$2`);let n=t.split(/(?<=[.!?])\s+(?=[A-Z0-9“"(\[])/),r=[];for(let e of n){let t=e.replace(/∯/g,`.`).trim();if(!t)continue;let n=t.split(/;\s+/);if(n.length>1&&n.every(e=>c(e)>=6))for(let e of n){let t=e.trim();t&&r.push(t)}else r.push(t)}return r}function p(e){return e.toLowerCase().replace(/[.!?]+$/g,``).replace(/\s+/g,` `).trim()}var m=[`ward nurse`,`night supervisor`,`covering physician`,`physician`,`nurse`,`supervisor`,`operator`,`reviewer`,`clerk`,`clinician`],h=`records.calls.writes.states.starts.reviews.notifies.checks.confirms.sends.opens.closes.assigns.rejects.merges.stores.reads.logs.pages.contacts.documents.enters.signs.extracts.submits.queues.marks.accepts`.split(`.`);function g(e){let t=RegExp(`((?:[Tt]he )?(?:${m.join(`|`)}))\\s+(?:${h.join(`|`)})\\b`,`i`),n=e.match(t);return n?n[1]:`unspecified`}function _(e,t){let n=t===`input`?/\b(?:from|using|given|based on)\s+([^.,;]+)/i:/\b(?:produces?|producing|outputs?|writes|records|logs)\s+([^.,;]+)/i,r=e.match(n);if(!r)return`unspecified`;let i=r[1].trim();return!i||i.length>80||!e.includes(i)?`unspecified`:i}function v(){return{ids_used:[],open_questions:[],rejected_labels:[]}}function y(e,t){for(let n of e.ids_used)if(!t.ids_used.includes(n))throw Error(`state echo failed for ${n}`);return t}var b=class{used=new Set;issue(e,t){let n=`${e}:${t}`;if(this.used.has(n))throw Error(`id reuse rejected: ${n}`);return this.used.add(n),t}},x=new Set(`a an the and or of to for from with within on in into over that this those these than then not does do did is are was were be been being by as at it its their they he she you we who whom which what when where while`.split(` `));function S(e){let t=e.toLowerCase().replace(/[^a-z0-9\s]/g,` `).split(/\s+/).filter(e=>e.length>3&&!x.has(e));return new Set(t)}function C(e){return/^(however|but)\b/i.test(e.trim())||/\b(contrary|in contrast)\b/i.test(e)}var w=1500,T=2500;function E(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=null,i=!1;for(let e of t){let t=k(e);t?(r&&(i||r.bodyLines.some(e=>e.trim()))&&n.push(r),i=!0,r={level:t.level,title:t.title,bodyLines:[]}):(r||={level:1,title:`Document`,bodyLines:[]},r.bodyLines.push(e))}r&&(i||r.bodyLines.some(e=>e.trim()))&&n.push(r);let a=[],o=[];for(let e of n){for(;a.length>0&&a[a.length-1].level>=e.level;)a.pop();a.push({level:e.level,title:e.title});let t=e.bodyLines.join(`
`).trim(),n=a.map(e=>e.title).join(` > `);o.push({level:e.level,title:e.title,path:n,body:t,words:c(`${e.title} ${t}`)})}return o}function D(e){let t=e.replace(/\r\n/g,`
`).trim();if(!t)return[];let n=E(t),r=[],i=[],a=0,o=()=>{i.length!==0&&(r.push(i),i=[],a=0)};for(let e of n){if(e.words>T){o();for(let t of O(e))a>=w&&a+t.words>T&&o(),i.push(t),a+=t.words,a>=T&&o();continue}a>=w&&a+e.words>T&&o(),i.push(e),a+=e.words}return o(),r.map((e,t)=>{let n=e[0]?.title??`Document`,r=e.map(e=>`${`#`.repeat(Math.min(e.level,6))} ${e.title}\n\n${e.body}`).join(`

`).trim();return{id:u(`K`,t+1),heading:n,word_count:c(r),text:r,sections:e}})}function O(e){let t=e.body.split(/\n\s*\n/).map(e=>e.trim()).filter(Boolean);if(t.length===0)return[e];let n=[],r=[],i=0,a=()=>{if(r.length===0)return;let t=r.join(`

`);n.push({...e,body:t,words:c(`${e.title} ${t}`)}),r=[],i=0};for(let e of t){let t=c(e);i>=w&&i+t>T&&a(),r.push(e),i+=t}return a(),n.length>0?n:[e]}function k(e){let t=/^(#{1,6})\s+(\S.*)$/.exec(e.trim());if(t)return{level:t[1].length,title:t[2].trim()};let n=e.trim();return!n||n.length>72||/[.!?]$/.test(n)||/^(?:[-*•]|\d+[.)])\s+/.test(n)||n.split(/\s+/).length>8?null:n===n.toUpperCase()&&/[A-Z]/.test(n)?{level:2,title:n}:null}function ee(e){let t=e.text.trim();e.section_path;let n=A(e),r=ne(t),i=re(t,n),a=ie(t),o=ae(t,n),s=oe(t),c=se(t,n),l=ce(t,n),u=le(t),d=ue(t),f=de(t),p=fe(t,n),m=pe(t),h=n===`none`&&N(t)<8,g=te(t,n),_=g?.5:n===`none`&&!h?.55:.9;return{model:`local-stand-in`,answers:{boilerplate:P(h),deterministic:P(l),quantity_present:P(u),definition_present:P(d),decision_point:P(f),fully_specified:P(p),external_check:P(m),polarity:F(r,[`affirmed`,`denied`,`conditional`,`unclear`],r===`unclear`?.5:.9),record_kind:F(n,[`fact`,`theory`,`concept`,`workflow_step`,`none`],_,g?`fact`:void 0),theory_status:F(i,[`hypothesis`,`model`,`interpretation`,`prediction`,`not_applicable`],.88),causal:F(a,[`yes`,`no`,`unclear`],a===`unclear`?.5:.9),falsifiable:F(o,[`yes`,`no`,`unclear`],o===`unclear`?.86:.9),time_scope:F(s,[`past`,`present`,`future`,`unspecified`],.88),concept_type:F(c,[`entity`,`process`,`metric`,`role`,`tool`,`other`,`not_applicable`],.88)}}}function A(e){let t=e.text.trim();return e.from_table?le(t)?`fact`:`concept`:/^\d+[.)]\s+/.test(t)||/^[-*•]\s+/.test(t)?`workflow_step`:j(t)?`concept`:/^when\b/i.test(t)&&/procedure|workflow|process|steps/i.test(e.section_path)?`workflow_step`:M(t)?`theory`:N(t)>=5?`fact`:`none`}function j(e){return/\b(is defined as|are defined as|defined as|refers to|means)\b/i.test(e)}function M(e){return/\b(may|might|could|suggests?|likely|possibly|perhaps|hypothesis|hypothesi[sz]e|appears to|seems to|interpreted as|interpretation|presumably|we believe|according to)\b/i.test(e)}function te(e,t){return t===`theory`&&/\bleads? to\b/i.test(e)&&/\baccording to\b/i.test(e)&&!/\b(may|might|could)\b/i.test(e)}function ne(e){if(/\b(if|unless|provided that|only if|only when|when)\b/i.test(e)&&!/^\d+[.)]\s+/.test(e))return`conditional`;if(/\bnot optional\b/i.test(e))return`affirmed`;let t=/,\s+not\b/i.test(e);return/\b(no|not|never|cannot|can't|doesn't|does not|do not|don't|isn't|aren't|wasn't|weren't|won't|must not|shall not)\b/i.test(e)&&!t?`denied`:N(e)<4?`unclear`:`affirmed`}function re(e,t){return t===`theory`?/hypothes/i.test(e)?`hypothesis`:/\bmodel\b/i.test(e)?`model`:/\b(predict|forecast|expected to|will)\b/i.test(e)?`prediction`:/\b(may|might|could)\b/i.test(e)?`hypothesis`:`interpretation`:`not_applicable`}function ie(e){return/\b(because|causes?|caused|leads? to|results? in|due to|therefore|hence|consequently)\b/i.test(e)?`yes`:`no`}function ae(e,t){return t===`theory`?/\b(cannot be tested|unfalsifiable)\b/i.test(e)?`no`:/\b(measured by|if and only if|percent|within \d+)\b/i.test(e)?`yes`:`unclear`:`unclear`}function oe(e){let t=/\b(will|going to|forecast)\b/i.test(e),n=/\b(was|were|had|did|logged|arrived|recorded|stated|previously)\b/i.test(e)||/\b(19|20)\d{2}\b/.test(e),r=/\b(is|are|does|do|means|shall)\b/i.test(e);return t&&n?`unspecified`:t?`future`:n&&!/\bis defined as\b|\bmeans\b/i.test(e)?`past`:r?`present`:`unspecified`}function se(e,t){if(t!==`concept`)return`not_applicable`;let n=me(e)??e;return/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(n)?`metric`:/\b(nurse|physician|supervisor|operator|reviewer|clerk|clinician|officer)\b/i.test(n)?`role`:/\b(system|software|database|dashboard|platform|ehr|epic)\b/i.test(n)?`tool`:/\b(process|procedure|protocol|workflow|pipeline|callback|drill)\b/i.test(n)?`process`:`other`}function ce(e,t){return t===`theory`||M(e)?!1:t===`fact`||t===`concept`}function le(e){return/\b\d+(?:[.:]\d+)?\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|percent)\b/i.test(e)}function ue(e){return j(e)}function de(e){return/\b(if|whether|otherwise|decide|decision)\b/i.test(e)}function fe(e,t){if(t!==`workflow_step`||g(e)===`unspecified`)return!1;let n=_(e,`input`),r=_(e,`output`);return n!==`unspecified`||r!==`unspecified`}function pe(e){return/\b(according to (?:the )?(?:literature|guidelines|published)|et al\.|citation needed)\b/i.test(e)}function me(e){let t=/^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(e);return t?t[1].replace(/^(a|an|the)\s+/i,``).trim():null}function N(e){return e.trim().split(/\s+/).filter(Boolean).length}function P(e,t=.9){let n=Math.min(.99,Math.max(.51,.5+t/2));return{type:`noul`,noul:e?n:1-n}}function F(e,t,n,r){let i={},a=t.filter(t=>t!==e),o=r?.48:n,s=r?.44:0,c=o+(r?s:0);for(let n of t)i[n]=n===e?o:n===r?s:0;let l=a.filter(e=>e!==r),u=l.length>0?(1-c)/l.length:0;for(let e of l)i[e]=u;return c=Object.values(i).reduce((e,t)=>e+t,0),c>0&&Math.abs(c-1)>.001&&(i[e]+=1-c),{type:`choice`,choice:e,confidence:r?.5:n,probabilities:i}}var he=[`affirmed`,`denied`,`conditional`,`unclear`],ge=[`fact`,`theory`,`concept`,`workflow_step`,`none`],_e=[`hypothesis`,`model`,`interpretation`,`prediction`,`not_applicable`],ve=[`yes`,`no`,`unclear`],ye=[`past`,`present`,`future`,`unspecified`],be=[`entity`,`process`,`metric`,`role`,`tool`,`other`,`not_applicable`];function xe(e,t){let n=e.answers??{},r=I(n.boilerplate),i=I(n.deterministic),a=I(n.quantity_present),o=I(n.definition_present),s=I(n.decision_point),c=I(n.fully_specified),l=I(n.external_check),u=L(n.polarity,he,`unclear`),d=L(n.record_kind,ge,`none`),f=L(n.theory_status,_e,`not_applicable`),p=L(n.causal,ve,`unclear`),m=L(n.falsifiable,ve,`unclear`),h=L(n.time_scope,ye,`unspecified`),g=L(n.concept_type,be,`not_applicable`),_=[d.confidence,r.confidence];(d.value===`fact`||d.value===`theory`)&&_.push(u.confidence,i.confidence,h.confidence,a.confidence),d.value===`theory`&&_.push(f.confidence,p.confidence,m.confidence),d.value===`workflow_step`&&_.push(s.confidence,c.confidence),d.value===`concept`&&_.push(o.confidence,g.confidence),l.yes===`yes`&&_.push(l.confidence);let v=d.conflict||u.conflict||d.value===`theory`&&(f.conflict||p.conflict||m.conflict);return{unit_id:t,boilerplate:r.yes,deterministic:i.yes,quantity_present:a.yes,definition_present:o.yes,decision_point:s.yes,fully_specified:c.yes,polarity:u.value,record_kind:d.value,theory_status:f.value,causal:p.value,falsifiable:m.value,time_scope:h.value,concept_type:g.value,external_check:l.yes,confidence:Math.min(..._),conflict:v,model:e.model??`unknown`}}function Se(e,t){if(e.boilerplate===`yes`)return[];let n=new Set;return!t&&e.confidence<.72&&n.add(`low_confidence`),!t&&e.conflict&&n.add(`conflict`),!t&&e.external_check===`yes`&&n.add(`external_check_required`),e.record_kind===`none`&&n.add(`unclear`),(e.record_kind===`fact`||e.record_kind===`theory`)&&e.polarity===`unclear`&&n.add(`unclear`),!t&&e.record_kind===`theory`&&(e.causal===`unclear`||e.falsifiable===`unclear`||e.theory_status===`not_applicable`)&&n.add(`unclear`),[...n]}function I(e){let t=null;if(typeof e==`number`)t=e;else if(e&&typeof e==`object`){let n=e;typeof n.noul==`number`?t=n.noul:typeof n.probability==`number`&&(t=n.probability)}return t===null||Number.isNaN(t)||t<0||t>1?{yes:`no`,confidence:0}:{yes:t>=.5?`yes`:`no`,confidence:Math.abs(t-.5)*2}}function L(e,t,n){if(!e||typeof e!=`object`)return{value:n,confidence:0,conflict:!1};let r=e,i=typeof r.choice==`string`?r.choice:n,a=t.includes(i),o=a?i:n,s=typeof r.confidence==`number`?r.confidence:0,c=!1;if(r.probabilities&&typeof r.probabilities==`object`){let e=Object.entries(r.probabilities).filter(e=>typeof e[1]==`number`).sort((e,t)=>t[1]-e[1]);e.length>=2&&e[1][1]>=e[0][1]-.08&&(c=!0),typeof r.confidence!=`number`&&e[0]&&(s=e[0][1])}return a||(s=Math.min(s,.4)),{value:o,confidence:s,conflict:c}}function Ce(e,t=[]){let n=D(e),r=[];for(let e of n)for(let t of e.sections)for(let n of we(t.body))r.push({id:``,chunk_id:e.id,ordinal:r.length+1,section_path:t.path,text:n,from_table:!1,list_order:Ee(n)});for(let e of t){let t=`Table: ${e.name?.trim()||`Untitled`}`;for(let i of e.rows){let e=i.map(e=>e.trim()).filter(e=>e.length>0);e.length!==0&&r.push({id:``,chunk_id:n[0]?.id??`K001`,ordinal:r.length+1,section_path:t,text:e.join(` | `),from_table:!0,list_order:null})}}r.forEach((e,t)=>{e.id=u(`U`,t+1),e.ordinal=t+1});let i=n.map(e=>({id:e.id,heading:e.heading,word_count:e.word_count,text:e.text}));return i.length===0&&r.length>0&&i.push({id:`K001`,heading:`Document`,word_count:c(e),text:e}),{chunks:i,units:r}}function we(e){let t=e.split(`
`),n=[],r=[],i=()=>{let e=r.join(` `).trim();r=[],e&&n.push(...f(e))};for(let e of t){let t=e.trim();if(!t){i();continue}if(Te(t)){i();let e=/^((?:\d+[.)]|[-*•])\s+)(.*)$/.exec(t),r=f(e?e[2]:t);r.length<=1?n.push(t):n.push(...r);continue}r.push(t)}return i(),n.filter(e=>c(e)>0)}function Te(e){return/^(?:[-*•]|\d+[.)])\s+\S/.test(e)}function Ee(e){let t=/^(\d+)[.)]\s+/.exec(e);return t?Number(t[1]):null}function De(e,t=[],n=[],r){let i=e.replace(/\r\n/g,`
`).trim();if(!i&&t.length===0)throw Error(`empty_document`);let a=`job_`+l(JSON.stringify({source:i,tables:t,resolutions:n,engine:r?.engine??`local`})),s=new b,c=v(),{chunks:f,units:m}=r?{chunks:r.chunks,units:r.units}:Ce(i,t);if(r&&r.decisions.length!==m.length)throw Error(`decision count does not match units`);c=R(c,s,a,m.map(e=>e.id));let h=new Map(n.map(e=>[e.unit_id,e])),g=m.map((e,t)=>{let n=r?r.decisions[t]:xe(ee(e),e.id);if(n.unit_id!==e.id)throw Error(`decision unit mismatch for ${e.id}`);return Oe(n,h.get(e.id))}),_=[],x=[],S=[],C=new Map,w=0,T=0,E=0,D=0,O=[],k=new Set;for(let e of m){let t=g[e.ordinal-1],n=Se(t,t.human);if(t.boilerplate===`yes`){k.add(e.id);continue}let r=n.length>0;if(r){D+=1;let r=u(`Q`,D);c=R(c,s,a,[r]),O.push({id:r,unit_id:e.id,section_path:e.section_path,quote:e.text,reasons:n,confidence:Be(t.confidence),proposed_kind:t.record_kind,proposed_polarity:t.polarity,proposed_status:t.theory_status,causal:t.causal,falsifiable:t.falsifiable,deterministic:t.deterministic,conflict:t.conflict})}if(t.record_kind===`concept`){E+=1;let n=u(`C`,E);c=R(c,s,a,[n]);let i=Fe(e.text),o=t.definition_present===`yes`?Ie(e.text):``;S.push({id:n,term:i,definition_present:o?`yes`:`no`,definition_quote:o,type:Le(i,e.text,t.concept_type),unit_ids:[e.id],held:r});continue}if(t.record_kind===`theory`){T+=1;let n=u(`T`,T);c=R(c,s,a,[n]),x.push({id:n,claim:e.text,evidence_quote:d(e.text),status:Ve(t.theory_status),causal:t.causal,falsifiable:t.falsifiable,conflicts_with_fact_id:`none`,unit_ids:[e.id],held:r||t.theory_status===`not_applicable`});continue}if(t.record_kind===`fact`){let n=p(e.text),i=C.get(n);if(i){i.unit_ids.push(e.id);continue}let o=t.polarity;if(o===`unclear`)continue;w+=1;let l=u(`F`,w);c=R(c,s,a,[l]);let f={id:l,statement:e.text,evidence_quote:d(e.text),deterministic:t.deterministic,polarity:o,time_scope:t.time_scope,quantity_present:t.quantity_present,unit_ids:[e.id],held:r};_.push(f),C.set(n,f)}}let A=ke(m,g,c,s,a);c=A.state;let j=Me(S,_,x,A.records,c,s,a);c=j.state;let M=Ne(i,t,_,x,S,A.records);c=y(c,{...c,open_questions:[...c.open_questions,...j.openQuestions,...M.open],rejected_labels:[...c.rejected_labels,...M.rejected]});for(let e of M.holdUnits)for(let t of _)t.unit_ids.includes(e)&&(t.held=!0);let te=Pe(m,k,S,_,x,A.records,j.records);return{id:a,status:te.coverage.unassigned_quotes.length===0&&O.length===0?`complete`:`needs_review`,engine:r?.engine??`local-stand-in`,threshold:o,output:te,review:O,units:m,chunks:f.map(e=>({id:e.id,heading:e.heading,word_count:e.word_count})),decisions:g.map(({human:e,...t})=>t),state:c}}function Oe(e,t){if(!t)return{...e,human:!1};if(t.action===`boilerplate`)return{...e,human:!0,boilerplate:`yes`,record_kind:`none`,confidence:1,conflict:!1};if(t.action===`file_as_fact`){let n=t.polarity??(e.polarity===`unclear`?`affirmed`:e.polarity);return{...e,human:!0,record_kind:`fact`,theory_status:`not_applicable`,deterministic:`no`,conflict:!1,confidence:1,polarity:n,causal:`no`}}return{...e,human:!0,confidence:1,conflict:!1,polarity:t.polarity??e.polarity}}function ke(e,t,n,r,i){let a=new Map;for(let n of e){let e=t[n.ordinal-1];if(e.boilerplate===`yes`||e.record_kind!==`workflow_step`)continue;let r=a.get(n.section_path)??[];r.push(n),a.set(n.section_path,r)}let o=[],s=0,c=n;for(let[e,n]of a){let a=n.find(e=>e.list_order===null&&/^(when|if)\b/i.test(e.text)),l=n.filter(e=>e!==a);if(l.length===0&&!a)continue;s+=1;let d=u(`W`,s);c=R(c,r,i,[d]);let f=l.map((e,n)=>{let r=t[e.ordinal-1],i=Se(r,r.human).length>0,a=/\b(if|whether|otherwise|decide|decision)\b/i.test(e.text),o=r.decision_point;return o===`yes`&&!a&&(c=y(c,{...c,rejected_labels:[...c.rejected_labels,{unit_id:e.id,label:`decision_point:yes`,reason:`no explicit decision word in the step`}]}),o=`no`),{order:e.list_order??n+1,action:e.text,actor:g(e.text),input:_(e.text,`input`),output:_(e.text,`output`),decision:o,unit_id:e.id,held:i}}).filter(e=>!e.held),p=!a||Se(t[a.ordinal-1],t[a.ordinal-1].human).length>0,m=a&&!p?a.text:`unspecified`,h=je(n.map(e=>e.text)),v=ze(f.map(e=>e.actor)),b=[m,...f.map(e=>e.action)].join(` `),x=Ae(m,h,f),S={id:d,name:e.split(` > `).at(-1)||`Unspecified procedure`,trigger:m,steps:f.map(({unit_id:e,held:t,...n})=>n),end_condition:h,roles:v.length>0?v:[`unspecified`],tools_mentioned:/\b(software|database|dashboard|platform|EHR|Epic|spreadsheet|system)\b/i.test(b)?`yes`:`no`,fully_specified:x,unit_ids:[...a&&!p?[a.id]:[],...f.map(e=>e.unit_id)],held:f.length===0&&m===`unspecified`};S.name===`Document`&&(S.name=`Unspecified procedure`),o.push(S)}return{records:o,state:c}}function Ae(e,t,n){if(e===`unspecified`||t===`unspecified`||n.length===0)return`no`;for(let e of n)if(e.actor===`unspecified`||e.input===`unspecified`&&e.output===`unspecified`)return`no`;return`yes`}function je(e){let t=e.find(e=>/\b(end when|done when|complete when|until complete|then stop)\b/i.test(e));return t?d(t):`unspecified`}function Me(e,t,n,r,i,a,o){let s=[],c=[],l=0,d=i,f=(e,t,n,r)=>{l+=1;let i=u(`R`,l);d=R(d,a,o,[i]),s.push({source_id:e,target_id:t,relation:n,held:r})};for(let t of e){if(t.held)continue;let e=t.term.toLowerCase();if(!(e.length<3))for(let n of r)n.held||`${n.trigger} ${n.steps.map(e=>e.action).join(` `)}`.toLowerCase().includes(e)&&f(t.id,n.id,`part_of`,!1)}for(let e of n){if(e.causal!==`yes`)continue;let n=S(e.claim),r=t.filter(e=>Re(n,S(e.statement))>=3);r.length===1&&f(e.id,r[0].id,`causes`,e.held||r[0].held)}for(let e of t){let n=e.statement;if(!C(n))continue;let r=S(n),i=null;for(let n of t){if(n.id===e.id||n.polarity===e.polarity)continue;let t=Re(r,S(n.statement));t>=2&&(!i||t>i.score)&&(i={id:n.id,score:t})}if(!i){c.push(`No opposing fact for contrast unit on ${e.id}`);continue}let a=t.find(e=>e.id===i?.id);f(e.id,i.id,`contradicts`,e.held||!!a?.held)}return{records:s,state:d,openQuestions:c}}function Ne(e,t,n,r,i,a){let o=[e,...t.flatMap(e=>e.rows.map(e=>e.join(` | `)))].join(`
`),s=[],c=[],l=new Set,u=(e,t,n)=>{l.has(e)&&c.push({unit_id:t,label:e,reason:`duplicate id`}),l.add(e),n&&!o.includes(n)&&(c.push({unit_id:t,label:`evidence_quote`,reason:`quote is not an exact substring`}),s.push(t))};for(let e of n)u(e.id,e.unit_ids[0],e.evidence_quote);for(let e of r)u(e.id,e.unit_ids[0],e.evidence_quote);for(let e of i)e.definition_present===`yes`?u(e.id,e.unit_ids[0],e.definition_quote):u(e.id,e.unit_ids[0],``);for(let e of a)for(let t of e.steps)(!t.order||!t.actor)&&c.push({unit_id:e.id,label:`workflow_step`,reason:`step missing order or actor`}),t.action&&!o.includes(t.action)&&c.push({unit_id:e.id,label:`action`,reason:`step action is not an exact substring`});return{holdUnits:s,open:[],rejected:c}}function Pe(e,t,n,r,i,a,o){let s=new Set(t);for(let e of n)e.held||e.unit_ids.forEach(e=>s.add(e));for(let e of r)e.held||e.unit_ids.forEach(e=>s.add(e));for(let e of i)e.held||e.unit_ids.forEach(e=>s.add(e));for(let e of a)e.held||e.unit_ids.forEach(e=>s.add(e));let c=e.filter(e=>!s.has(e.id)).map(e=>e.text),l=new Set([...n.filter(e=>!e.held).map(e=>e.id),...r.filter(e=>!e.held).map(e=>e.id),...i.filter(e=>!e.held).map(e=>e.id),...a.filter(e=>!e.held).map(e=>e.id)]);return{concepts:n.filter(e=>!e.held).map(({unit_ids:e,held:t,...n})=>n),facts:r.filter(e=>!e.held).map(({unit_ids:e,held:t,...n})=>n),theories:i.filter(e=>!e.held).map(({unit_ids:e,held:t,...n})=>n),workflows:a.filter(e=>!e.held).map(({unit_ids:e,held:t,...n})=>n),relations:o.filter(e=>!e.held&&l.has(e.source_id)&&l.has(e.target_id)).map(({held:e,...t})=>t),coverage:{segments_total:e.length,segments_classified:e.length-c.length,unassigned_quotes:c}}}function R(e,t,n,r){for(let e of r)t.issue(n,e);return y(e,{...e,ids_used:[...e.ids_used,...r]})}function Fe(e){let t=/^(.{2,80}?)\s+(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(e.trim());return t?t[1].replace(/^(a|an|the)\s+/i,``).trim():e.trim().slice(0,80)}function Ie(e){let t=/\b(?:is defined as|are defined as|defined as|refers to|means)\b/i.exec(e);return!t||t.index===void 0?``:d(e.slice(t.index+t[0].length).trim())}function Le(e,t,n){return n===`not_applicable`?/\b(score|rate|ratio|index|threshold|percent|count|sum)\b/i.test(e)?`metric`:/\b(callback|procedure|process|protocol|workflow)\b/i.test(e)?`process`:/\b(score|rate|sum)\b/i.test(t)?`metric`:`other`:n}function Re(e,t){let n=0;for(let r of e)t.has(r)&&(n+=1);return n}function ze(e){let t=new Set,n=[];for(let r of e){let e=r.toLowerCase();t.has(e)||(t.add(e),n.push(r))}return n}function Be(e){return Math.round(e*100)/100}function Ve(e){return e===`hypothesis`||e===`model`||e===`prediction`||e===`interpretation`?e:`interpretation`}var z=`# Ward callback drill

## Definitions

A deterioration callback is defined as a phone call from the ward nurse to the covering physician within 15 minutes of a trigger score.

Trigger score means the sum of three bedside checks: respiration, systolic pressure, and consciousness.

## Standing facts

The ward logged 42 callbacks in March 2026.
The covering physician is on site from 07:00 until 19:00.
The night service does not staff a physician inside the building.
Callbacks are not optional when the trigger score is 5 or higher.

## Interpretation

The night gap may delay antibiotics.
A higher trigger score leads to faster physician arrival, according to the March log.
This reading is an interpretation of the log, not a controlled trial.

## Procedure

When a bedside check reaches a trigger score of 5 or more, the ward nurse starts the callback.

1. The ward nurse records the three checks on the callback card.
2. The ward nurse calls the covering physician and states the trigger score.
3. If the physician does not answer, the ward nurse calls the night supervisor.
4. The physician states a bedside order or states that they are coming in.
5. The ward nurse writes the order time on the callback card.

## Conflict

The night service does not staff a physician inside the building.
However, the March log states that a physician arrived in person for 11 night callbacks.
`,B=t(e(),1),He=new Set(`the.and.for.are.was.were.but.not.you.your.this.that.with.from.have.has.had.what.when.where.which.who.why.how.does.did.can.could.would.should.about.into.than.then.them.they.their.there.been.being.will.just.also.only.over.under.after.before.between.each.other`.split(`.`));function Ue(e){return e.toLowerCase().replace(/[^a-z0-9\s]/g,` `).split(/\s+/).filter(e=>e.length>2&&!He.has(e))}function We(e){let t=new Float32Array(64);for(let n of Ue(e)){let e=Ge(n),r=e%64;t[r]+=e&1?1:-1}let n=0;for(let e of t)n+=e*e;if(n=Math.sqrt(n),n>0)for(let e=0;e<64;e++)t[e]/=n;return t}function Ge(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return t>>>0}var Ke=.34;function qe(e,t,n){let r=e.trim(),i=t.reduce((e,t)=>e+t.review_count,0),a=t.some(e=>e.status!==`complete`)?`held`:`closed`;if(!r)return{stance:`empty`,gate:a,held_records:i,scorer:`words`,text:`Ask a question. The reply can only quote accepted records.`,hits:[],contradictions:[]};if(t.length===0||t.every(e=>e.records.length===0))return{stance:`unspecified`,gate:a,held_records:i,scorer:`words`,text:i?`Nothing accepted matches, and the gate is still held. Those rows are not in force.`:`The ledger has no accepted records for this question.`,hits:[],contradictions:[]};let o=Ue(r),s=[];for(let e of t)for(let t of e.records){let r=Ye(o,`${t.text} ${t.quote} ${t.label}`);if(r<Ke)continue;let i=Je(e.version_id,t.record_id),a=n?.get(i),c=a===void 0?r:r*.55+Math.max(0,a)*.45;s.push({version_id:e.version_id,version_title:e.title,record_id:t.record_id,kind:t.kind,label:t.label,quote:t.quote,score:c})}s.sort((e,t)=>t.score-e.score||e.record_id.localeCompare(t.record_id));let c=s.slice(0,5),l=Xe(t,c);for(let e of l){let n=[e.source_id,e.target_id].filter(t=>!c.some(n=>n.version_id===e.version_id&&n.record_id===t));for(let r of n){let n=t.find(t=>t.version_id===e.version_id),i=n?.records.find(e=>e.record_id===r);n&&i&&c.push({version_id:n.version_id,version_title:n.title,record_id:i.record_id,kind:i.kind,label:i.label,quote:i.quote,score:0})}}let u=n&&n.size>0?`webgpu`:`words`;if(c.length===0)return{stance:`unspecified`,gate:a,held_records:i,scorer:u,text:Ze(a,i),hits:[],contradictions:[]};let d=c.map(e=>`${e.version_title} ${e.record_id} (${e.kind}, ${e.label}): ${e.quote}`),f=l.length>0?`These accepted records disagree. Neither was dropped.`:`Accepted records only.`,p=a===`held`?`Gate held. ${i} row${i===1?``:`s`} excluded from this answer.`:``;return{stance:l.length>0?`conflict`:`grounded`,gate:a,held_records:i,scorer:u,text:[p,f,...d].filter(Boolean).join(`
`),hits:c,contradictions:l}}function Je(e,t){return`${e}:${t}`}function Ye(e,t){if(e.length===0)return 0;let n=new Set(Ue(t)),r=0;for(let t of e)n.has(t)&&(r+=1);return r/e.length}function Xe(e,t){let n=[];for(let r of e){let e=new Set(t.filter(e=>e.version_id===r.version_id).map(e=>e.record_id));for(let t of r.relations)t.relation===`contradicts`&&(e.has(t.source_id)||e.has(t.target_id))&&n.push({version_id:r.version_id,source_id:t.source_id,target_id:t.target_id})}return n}function Ze(e,t){return e===`held`?`The accepted ledger does not say. ${t} held row${t===1?` is`:`s are`} not used to fill the gap.`:`The accepted ledger does not say.`}function Qe(e){let t=e.id,n=[];for(let r of e.output.concepts){let e=r.definition_quote||r.term;n.push({version_id:t,record_id:r.id,kind:`concept`,label:r.type,text:r.term,quote:e})}for(let r of e.output.facts)n.push({version_id:t,record_id:r.id,kind:`fact`,label:`${r.polarity} · ${r.time_scope}`,text:r.statement,quote:r.evidence_quote||r.statement});for(let r of e.output.theories)n.push({version_id:t,record_id:r.id,kind:`theory`,label:r.status,text:r.claim,quote:r.evidence_quote||r.claim});for(let r of e.output.workflows)r.steps.forEach((e,i)=>{n.push({version_id:t,record_id:`${r.id}.${e.order||i+1}`,kind:`workflow_step`,label:e.decision===`yes`?`decision`:`step`,text:`${r.name}. ${e.actor}: ${e.action}`,quote:e.action})});return{version_id:t,title:e.title?.trim()||`Document`,status:e.status,engine:e.engine,created_at:e.created_at??``,review_count:e.review_count,segments_total:e.output.coverage.segments_total,segments_classified:e.output.coverage.segments_classified,unassigned:e.output.coverage.unassigned_quotes.length,records:n,relations:e.output.relations.map(e=>({version_id:t,source_id:e.source_id,target_id:e.target_id,relation:e.relation}))}}var V={views:[]},H=!1;async function $e(){if(H||typeof document>`u`)return H?`webmcp`:`unavailable`;let e=et();if(!e)return`unavailable`;try{return await e.registerTool({name:`quote_ledger`,description:`Answer from the accepted Clef ledger open in this page. Quote hits only. If stance is unspecified, the document does not say. If stance is conflict, report both records. Do not use held rows.`,inputSchema:{type:`object`,properties:{query:{type:`string`,description:`Question about the ingested document`}},required:[`query`]},annotations:{readOnlyHint:!0},execute:async({query:e})=>{let t=e?.trim()??``;return t?qe(t,V.views):{error:`query is required`}}}),H=!0,`webmcp`}catch{return`unavailable`}}function et(){let e=document,t=navigator,n=e.modelContext??t.modelContext;return!n||typeof n.registerTool!=`function`?null:n}var U=4,tt=1,nt=`
@group(0) @binding(0) var<storage, read> docs: array<f32>;
@group(0) @binding(1) var<storage, read> query: array<f32>;
@group(0) @binding(2) var<storage, read_write> scores: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let row = id.x;
  if (row >= arrayLength(&scores)) { return; }
  var sum = 0.0;
  let dim = 64u;
  for (var k = 0u; k < dim; k = k + 1u) {
    sum = sum + docs[row * dim + k] * query[k];
  }
  scores[row] = sum;
}
`;function rt(){return navigator.gpu??null}async function it(){let e=rt();if(!e)return!1;try{return await e.requestAdapter()!==null}catch{return!1}}async function at(e,t,n){let r=rt();if(!r)throw Error(`webgpu_unavailable`);let i=await r.requestAdapter();if(!i)throw Error(`webgpu_unavailable`);let a=await i.requestDevice();try{let r=a.createShaderModule({code:nt}),i=a.createBindGroupLayout({entries:[{binding:0,visibility:U,buffer:{type:`read-only-storage`}},{binding:1,visibility:U,buffer:{type:`read-only-storage`}},{binding:2,visibility:U,buffer:{type:`storage`}}]}),o=a.createComputePipeline({layout:a.createPipelineLayout({bindGroupLayouts:[i]}),compute:{module:r,entryPoint:`main`}}),s=a.createBuffer({size:e.byteLength,usage:136}),c=a.createBuffer({size:Math.max(4,t.byteLength),usage:136}),l=Math.max(4,n*4),u=a.createBuffer({size:l,usage:132}),d=a.createBuffer({size:l,usage:9});a.queue.writeBuffer(s,0,e),a.queue.writeBuffer(c,0,t);let f=a.createBindGroup({layout:i,entries:[{binding:0,resource:{buffer:s}},{binding:1,resource:{buffer:c}},{binding:2,resource:{buffer:u}}]}),p=a.createCommandEncoder(),m=p.beginComputePass();m.setPipeline(o),m.setBindGroup(0,f),m.dispatchWorkgroups(Math.ceil(n/64)),m.end(),p.copyBufferToBuffer(u,0,d,0,l),a.queue.submit([p.finish()]),await d.mapAsync(tt);let h=d.getMappedRange(),g=new Float32Array(h.byteLength/4);return g.set(new Float32Array(h)),d.unmap(),g.slice(0,n)}finally{a.destroy()}}var W=n(),ot=`min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50`,G=`min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp disabled:opacity-50`,st=[`What is a deterioration callback?`,`Is a physician inside the building at night?`,`Which antibiotic should be started for a night delay?`];function ct({job:e,versions:t}){let[n,r]=(0,B.useState)(``),[i,a]=(0,B.useState)(`current`),[o,s]=(0,B.useState)(null),[c,l]=(0,B.useState)(`idle`),[u,d]=(0,B.useState)(``),[f,p]=(0,B.useState)(!1),m=(0,B.useMemo)(()=>ut(e,t,i),[e,t,i]),h=m.map(e=>e.version_id).join(`,`);(0,B.useEffect)(()=>{V.views=m},[m]),(0,B.useEffect)(()=>{l(`idle`),d(``)},[h]);async function g(e=n){let t=e.trim();if(r(e),!t){s(qe(``,m));return}let i=null;c===`ready`&&u===h&&(i=await pt(m,t)),s(qe(t,m,i))}async function _(){if(l(`working`),!await it()){l(`unsupported`);return}try{let e=mt(m);if(e.count===0){l(`failed`);return}await at(e.docs,We(`ledger`),e.count),d(h),l(`ready`)}catch{l(`failed`)}}return(0,W.jsxs)(`div`,{className:`space-y-4`,children:[(0,W.jsxs)(`div`,{className:`border border-line bg-card p-4`,children:[(0,W.jsx)(`h2`,{className:`font-display text-2xl text-ink`,children:`Ask the ledger`}),(0,W.jsx)(`p`,{className:`mt-2 text-sm text-muted`,children:`A reply is accepted quotes, or a refusal. Held rows stay out. Nothing here writes a new clinical fact.`}),(0,W.jsxs)(`form`,{className:`mt-4 space-y-3`,onSubmit:e=>{e.preventDefault(),g()},children:[(0,W.jsxs)(`label`,{className:`block text-sm text-muted`,children:[`Question`,(0,W.jsx)(`textarea`,{value:n,onChange:e=>r(e.target.value),"aria-label":`Question for the ledger`,className:`mt-1 h-24 w-full resize-y border border-line bg-paper p-3 text-sm text-ink`})]}),(0,W.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,W.jsx)(`button`,{type:`submit`,className:ot,children:`Ask the ledger`}),(0,W.jsx)(`button`,{type:`button`,className:G,onClick:()=>void _(),disabled:c===`working`,children:c===`working`?`Indexing`:`Rank on this device`})]})]}),(0,W.jsx)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:st.map(e=>(0,W.jsx)(`button`,{type:`button`,className:`${G} max-w-full text-left`,onClick:()=>void g(e),children:e},e))}),(0,W.jsx)(`p`,{className:`mt-3 text-xs text-muted`,children:ft(c)})]}),(0,W.jsxs)(`fieldset`,{className:`border border-line bg-card p-4`,children:[(0,W.jsx)(`legend`,{className:`px-1 text-sm text-muted`,children:`Versions on this device`}),(0,W.jsxs)(`div`,{className:`mt-2 flex flex-wrap gap-2`,children:[(0,W.jsx)(`button`,{type:`button`,className:i===`current`?ot:G,onClick:()=>a(`current`),children:`This extract`}),(0,W.jsx)(`button`,{type:`button`,className:i===`saved`?ot:G,onClick:()=>a(`saved`),children:`Every saved version`})]}),(0,W.jsx)(`ul`,{className:`mt-3 space-y-2`,children:t.length===0?(0,W.jsx)(`li`,{className:`text-sm text-muted`,children:`This extract is kept in the page. A second paste becomes the next version.`}):t.map((e,t)=>(0,W.jsxs)(`li`,{className:`font-mono text-xs text-ink`,children:[`v`,t+1,` `,e.title,` · `,e.status===`complete`?`gate closed`:`gate held`,` ·`,` `,e.review_count,` held`,e.parent_version_id?` · follows a prior version`:``]},e.version_id))})]}),o?(0,W.jsx)(lt,{answer:o}):null,(0,W.jsxs)(`div`,{className:`border border-line bg-card p-4`,children:[(0,W.jsx)(`h3`,{className:`font-display text-lg text-ink`,children:`Connect a chatbot`}),(0,W.jsxs)(`p`,{className:`mt-2 text-sm text-muted`,children:[`Streamable HTTP MCP at `,(0,W.jsx)(`span`,{className:`font-mono text-ink`,children:`/api/mcp`}),`. Tools are list_versions, job_status, lookup, quote_answer, and ingest_document. quote_answer is the same refusal rules as this panel. Chrome WebMCP, when the browser exposes it, registers quote_ledger on this page. Do not send patient identifiers.`]}),(0,W.jsx)(`button`,{type:`button`,className:`${G} mt-3`,onClick:()=>{let e=JSON.stringify({mcpServers:{"clef-ledger":{url:`${window.location.origin}/api/mcp`}}},null,2);navigator.clipboard?.writeText(e),p(!0)},children:f?`Copied`:`Copy MCP config`})]})]})}function lt({answer:e}){let t=e.stance===`conflict`?`border-l-review`:e.stance===`grounded`?`border-l-stamp`:`border-l-line`;return(0,W.jsxs)(`div`,{className:`border border-line border-l-2 ${t} bg-card p-4`,children:[(0,W.jsxs)(`p`,{className:`font-mono text-xs uppercase text-muted`,children:[e.stance,` · gate `,e.gate,` · `,e.scorer===`webgpu`?`re-ranked on WebGPU`:`matched by words`]}),(0,W.jsx)(`pre`,{className:`mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink`,children:e.text}),e.hits.length>0?(0,W.jsx)(`ul`,{className:`mt-4 space-y-3`,children:e.hits.map(e=>(0,W.jsxs)(`li`,{children:[(0,W.jsxs)(`p`,{className:`font-mono text-xs text-muted`,children:[e.record_id,` · `,e.kind,` · `,e.label]}),(0,W.jsx)(`blockquote`,{className:`mt-1 border-l-2 border-line pl-3 font-mono text-sm text-ink`,children:e.quote})]},`${e.version_id}-${e.record_id}`))}):null]})}function ut(e,t,n){if(n===`current`)return[dt(e)];let r=t.map(e=>dt(e.job));return r.some(t=>t.version_id===e.id)||r.push(dt(e)),r}function dt(e){return Qe({id:e.id,status:e.status,engine:e.engine,title:e.chunks[0]?.heading||`Document`,review_count:e.review.length,output:e.output})}function ft(e){return e===`ready`?`WebGPU index is ready. The next question reranks overlapping quotes on this device. It cannot add a record the words do not already support.`:e===`unsupported`?`WebGPU is not available here. Word match still answers.`:e===`failed`?`The on-device index did not start. Word match still answers.`:e===`working`?`Building the on-device index.`:`Word match is the default. Rank on this device only reorders quotes that already overlap the question.`}async function pt(e,t){let n=mt(e);if(n.count===0)return null;try{let e=await at(n.docs,We(t),n.count),r=new Map;return n.keys.forEach((t,n)=>r.set(t,e[n]??0)),r}catch{return null}}function mt(e){let t=e.flatMap(e=>e.records.map(t=>({key:Je(e.version_id,t.record_id),vector:We(`${t.text} ${t.quote}`)}))),n=new Float32Array(t.length*64);return t.forEach((e,t)=>n.set(e.vector,t*64)),{docs:n,keys:t.map(e=>e.key),count:t.length}}var K=[{path:`cloudflare/wrangler.jsonc`,body:`{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "clef-extract",
  "main": "src/index.ts",
  "compatibility_date": "2026-10-01",
  // AI Gateway and Workers AI bindings are account-level. The gateway id is
  // passed on each AI.run options bag (see src/gateway.ts). Confirm the
  // options shape if Cloudflare changes it after this compatibility date.
  "ai": {
    "binding": "AI"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "clef_extract",
      "database_id": "00000000-0000-0000-0000-000000000000"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "name": "REGISTRY",
        "class_name": "IdRegistry"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["IdRegistry"]
    }
  ]
}
`},{path:`cloudflare/schema.sql`,body:`-- Clef Extract v1. Apply with: wrangler d1 execute clef_extract --file=schema.sql

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  title TEXT,
  source_text TEXT NOT NULL,
  status TEXT NOT NULL,
  engine TEXT NOT NULL,
  result_json TEXT
);

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  heading TEXT,
  word_count INTEGER NOT NULL,
  body TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  section_path TEXT NOT NULL,
  text TEXT NOT NULL,
  boilerplate INTEGER NOT NULL DEFAULT 0,
  linked INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  model TEXT NOT NULL,
  confidence REAL NOT NULL,
  accepted INTEGER NOT NULL DEFAULT 0,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ids (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  kind TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_queue (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks (document_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_units_document ON units (document_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_decisions_document ON decisions (document_id);
CREATE INDEX IF NOT EXISTS idx_review_document ON review_queue (document_id, status);
`},{path:`cloudflare/RUNBOOK.md`,body:'# Clef Extract — local runbook\n\nDeploy from the repository root\'s `cloudflare/` directory. The Worker bundles `src/engine`, which is the same compiler the preview desk runs. Do not copy this folder without `src/engine`.\n\nAssumptions pinned to compatibility date 2026-10-01: Workers AI `AI.run` third-argument `gateway.id`, Durable Object SQLite (`ctx.storage.sql`), and the Clef request (`model`, `state`, `questions` of type noul or choice). Clef has no separate boolean type; yes/no questions are noul. Confirm the segmenter model id `@cf/meta/llama-3.1-8b-instruct` against the current Workers AI catalog.\n\n1. Create resources. `npx wrangler login`, then `npx wrangler d1 create clef_extract`. In the Cloudflare dashboard, create an AI Gateway named `clef-extract`. Workers AI is enabled by the `ai` binding; no separate model install.\n2. Apply the schema. Paste the new database id into `database_id` in `wrangler.jsonc`. From `cloudflare/`: `npx wrangler d1 execute clef_extract --file=schema.sql`.\n3. Deploy. From `cloudflare/`: `npx wrangler deploy`. Note the workers.dev host.\n4. Submit one sample document. `curl -s -X POST https://<host>/extract -H \'content-type: application/json\' --data \'{"text":"<paste the Ward callback drill sample>"}\'`. The response has `id`, `status`, `output`, and `review_queue`.\n5. Inspect coverage. `curl -s https://<host>/jobs/<id>` and read `output.coverage`. `segments_classified + unassigned_quotes.length` equals `segments_total`. Status stays `needs_review` while `unassigned_quotes` or `review_queue` is non-empty.\n6. Review low-confidence rows. Each `review_queue` item is also a D1 row in `review_queue` with status `open`. Accept or reject by posting the same document again with `resolutions`: `{"text":"...","resolutions":[{"unit_id":"U007","action":"accept"}]}`. There is no third route. Unclear, conflicting, and `external_check_required` rows stay out of `output` until a human resolution is sent. `boilerplate` drops the row and counts it as classified.\n7. Export JSON. The `output` object on the GET body is the contract: `concepts`, `facts`, `theories`, `workflows`, `relations`, `coverage`. Save that object. Do not treat it as a system of record until `status` is `complete`.\n8. Chat tools. `POST /mcp` is Model Context Protocol streamable HTTP (`initialize`, `tools/list`, `tools/call`). `GET /mcp` lists the tools. `lookup` and `quote_answer` return accepted records only. Held rows are counted and omitted. `ingest_document` compiles text the same way as `POST /extract`. Do not send source text that contains patient identifiers. The desk preview exposes the same protocol at `/api/mcp`.\n'},{path:`cloudflare/src/index.ts`,body:`import type { Env } from "./env.ts";
import { handleExtract, handleGet, type ExtractBody } from "./ingest.ts";
import { handleMcp } from "./mcp.ts";
import { IdRegistry } from "./registry.ts";

export { IdRegistry };

/**
 * Public surface: POST /extract, GET /jobs/:id, and POST|GET /mcp.
 * /mcp is a tool server. It quotes the accepted ledger. It is not a chat model.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return handleMcp(request, env);
    if (request.method === "POST" && url.pathname === "/extract") {
      let body: ExtractBody;
      try {
        body = (await request.json()) as ExtractBody;
      } catch {
        return Response.json({ error: "bad_json" }, { status: 400 });
      }
      return handleExtract(env, body);
    }
    if (request.method === "GET" && url.pathname.startsWith("/jobs/")) {
      const id = decodeURIComponent(url.pathname.slice("/jobs/".length));
      if (!id) return Response.json({ error: "not_found" }, { status: 404 });
      return handleGet(env, id);
    }
    return Response.json({ error: "not_found" }, { status: 404 });
  },
};`},{path:`cloudflare/src/mcp.ts`,body:`import type { Env } from "./env.ts";
import { loadJob } from "./compiler.ts";
import { handleExtract } from "./ingest.ts";
import { mcpResponse, type Corpus, type VersionSummary } from "./ledger/mcp.ts";
import { projectLedger, type LedgerSource } from "./ledger/project.ts";

interface DocRow {
  id: string;
  title: string | null;
  status: string;
  engine: string;
  created_at: string;
  result_json: string | null;
}

export async function handleMcp(request: Request, env: Env): Promise<Response> {
  return mcpResponse(request, corpus(env));
}

function corpus(env: Env): Corpus {
  return {
    async list() {
      const rows = await rowsOf(env);
      return rows.map(summaryOf).filter((item): item is VersionSummary => item !== null);
    },
    async load(versionId: string) {
      const job = await loadJob(env.DB, versionId);
      if (!job) return null;
      const row = await env.DB
        .prepare(\`SELECT id, title, created_at FROM documents WHERE id = ?\`)
        .bind(versionId)
        .first<{ id: string; title: string | null; created_at: string }>();
      return projectLedger(storedSource(job, row?.title, row?.created_at));
    },
    async loadAll() {
      const views = [];
      for (const row of await rowsOf(env)) {
        const source = sourceFromRow(row);
        if (source) views.push(projectLedger(source));
      }
      return views;
    },
    async ingest(text: string) {
      const response = await handleExtract(env, { text });
      const body = (await response.json()) as { id?: string; status?: string; review_queue?: unknown[]; error?: string };
      if (!response.ok || !body.id) throw new Error(body.error || "ingest_failed");
      const status = body.status === "complete" ? "complete" : "needs_review";
      return {
        version_id: body.id,
        status,
        review_count: Array.isArray(body.review_queue) ? body.review_queue.length : 0,
      };
    },
  };
}

async function rowsOf(env: Env): Promise<DocRow[]> {
  const listed = await env.DB.prepare(
    \`SELECT id, title, status, engine, created_at, result_json
     FROM documents ORDER BY created_at DESC LIMIT 40\`,
  ).all<DocRow>();
  return listed.results ?? [];
}

function summaryOf(row: DocRow): VersionSummary | null {
  const source = sourceFromRow(row);
  if (!source) return null;
  const view = projectLedger(source);
  return {
    version_id: view.version_id,
    title: view.title,
    status: view.status,
    engine: view.engine,
    created_at: view.created_at,
    review_count: view.review_count,
    segments_total: view.segments_total,
    segments_classified: view.segments_classified,
    unassigned: view.unassigned,
  };
}

function sourceFromRow(row: DocRow): LedgerSource | null {
  if (!row.result_json) return null;
  try {
    const parsed = JSON.parse(row.result_json) as { output?: LedgerSource["output"]; review_queue?: unknown[] };
    if (!parsed.output) return null;
    return storedSource(
      {
        id: row.id,
        status: row.status === "complete" ? "complete" : "needs_review",
        engine: row.engine,
        output: parsed.output,
        review_queue: parsed.review_queue ?? [],
      },
      row.title,
      row.created_at,
    );
  } catch {
    return null;
  }
}

function storedSource(
  job: {
    id: string;
    status: "complete" | "needs_review";
    engine: string;
    output: LedgerSource["output"];
    review_queue: unknown[];
  },
  title?: string | null,
  createdAt?: string,
): LedgerSource {
  return {
    id: job.id,
    status: job.status,
    engine: job.engine,
    title: title || undefined,
    created_at: createdAt,
    review_count: job.review_queue.length,
    output: job.output,
  };
}
`},{path:`cloudflare/src/ingest.ts`,body:`import { extractDocument } from "./engine/assemble.ts";
import type { Resolution, TableInput } from "./engine/types.ts";
import { CHAR_LIMIT, type Env } from "./env.ts";
import { loadJob } from "./compiler.ts";
import { decideUnit } from "./decision.ts";
import { reserveIds } from "./registry.ts";
import { enqueueReview } from "./review.ts";
import { segmentWithModel, type SegmentResult } from "./segmenter.ts";

export interface ExtractBody {
  text?: string;
  tables?: TableInput[];
  resolutions?: Resolution[];
}

export async function handleExtract(env: Env, body: ExtractBody): Promise<Response> {
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim() && !(body.tables && body.tables.length > 0)) {
    return json({ error: "empty_document" }, 400);
  }
  if (text.length > CHAR_LIMIT) return json({ error: "document_too_large" }, 413);
  const tables = Array.isArray(body.tables) ? body.tables : [];
  const resolutions = Array.isArray(body.resolutions) ? body.resolutions : [];
  const documentId = crypto.randomUUID();
  const segmented = await segmentWithModel(env, text, tables);
  const decisions = [];
  for (let index = 0; index < segmented.units.length; index++) {
    const unit = segmented.units[index];
    const before = segmented.units[index - 1]?.text;
    const after = segmented.units[index + 1]?.text;
    decisions.push(await decideUnit(env, unit, { before, after }));
  }
  const engine = decisions.some((item) => item.model === "clef") ? "clef" : "clef-flash";
  const job = extractDocument(text, tables, resolutions, {
    units: segmented.units,
    chunks: segmented.chunks,
    decisions,
    engine: \`\${engine}:\${segmented.segmenter}\`,
  });
  try {
    await reserveIds(env, documentId, job.state.ids_used);
  } catch (error) {
    const message = error instanceof Error ? error.message : "id_reuse";
    return json({ error: "id_reuse", detail: message }, 409);
  }
  await store(env, documentId, text, job, segmented);
  return json(envelope(documentId, job), 200);
}

export async function handleGet(env: Env, documentId: string): Promise<Response> {
  const job = await loadJob(env.DB, documentId);
  if (!job) return json({ error: "not_found" }, 404);
  return json(job, 200);
}

async function store(
  env: Env,
  documentId: string,
  text: string,
  job: ReturnType<typeof extractDocument>,
  segmented: SegmentResult,
): Promise<void> {
  const db = env.DB;
  const status = job.status;
  const payload = JSON.stringify({ output: job.output, review_queue: job.review });
  await db
    .prepare(
      \`INSERT INTO documents (id, created_at, title, source_text, status, engine, result_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)\`,
    )
    .bind(
      documentId,
      new Date().toISOString(),
      job.chunks[0]?.heading ?? "Document",
      text,
      status,
      job.engine,
      payload,
    )
    .run();
  for (const [index, chunk] of segmented.chunks.entries()) {
    await db
      .prepare(
        \`INSERT INTO chunks (id, document_id, ordinal, heading, word_count, body) VALUES (?, ?, ?, ?, ?, ?)\`,
      )
      .bind(\`\${documentId}:\${chunk.id}\`, documentId, index + 1, chunk.heading, chunk.word_count, chunk.text)
      .run();
  }
  const linked = new Set<string>();
  for (const quote of job.output.coverage.unassigned_quotes) {
    const unit = job.units.find((item) => item.text === quote);
    if (unit) linked.add(unit.id);
  }
  for (const unit of job.units) {
    const boilerplate = job.decisions.find((item) => item.unit_id === unit.id)?.boilerplate === "yes" ? 1 : 0;
    await db
      .prepare(
        \`INSERT INTO units (id, document_id, chunk_id, ordinal, section_path, text, boilerplate, linked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)\`,
      )
      .bind(
        \`\${documentId}:\${unit.id}\`,
        documentId,
        unit.chunk_id,
        unit.ordinal,
        unit.section_path,
        unit.text,
        boilerplate,
        linked.has(unit.id) ? 0 : 1,
      )
      .run();
  }
  for (const decision of job.decisions) {
    const accepted = job.review.some((item) => item.unit_id === decision.unit_id) ? 0 : 1;
    await db
      .prepare(
        \`INSERT INTO decisions (id, unit_id, document_id, model, confidence, accepted, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)\`,
      )
      .bind(
        \`\${documentId}:\${decision.unit_id}\`,
        decision.unit_id,
        documentId,
        decision.model,
        decision.confidence,
        accepted,
        JSON.stringify(decision),
      )
      .run();
  }
  for (const id of job.state.ids_used) {
    await db
      .prepare(\`INSERT INTO ids (id, document_id, kind) VALUES (?, ?, ?)\`)
      .bind(\`\${documentId}:\${id}\`, documentId, id.replace(/[0-9]/g, "") || "id")
      .run();
  }
  await enqueueReview(db, documentId, job.review);
}

function envelope(documentId: string, job: ReturnType<typeof extractDocument>) {
  return {
    id: documentId,
    status: job.status,
    engine: job.engine,
    output: job.output,
    review_queue: job.review,
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
`},{path:`cloudflare/src/segmenter.ts`,body:`import { segmentDocument } from "./engine/segment.ts";
import { runModel } from "./gateway.ts";
import { SEGMENT_MODEL, type Env } from "./env.ts";
import type { Chunk, TableInput, Unit } from "./engine/types.ts";

export interface SegmentResult {
  chunks: Chunk[];
  units: Unit[];
  segmenter: "workers-ai" | "deterministic-fallback";
}

/**
 * The text model may only propose exact substrings. Anything paraphrased,
 * empty, or the wrong shape is discarded and the deterministic segmenter stands.
 * Assumption: SEGMENT_MODEL is a current Workers AI chat model. Change the id
 * if the catalog has moved on.
 */
export async function segmentWithModel(env: Env, text: string, tables: TableInput[] = []): Promise<SegmentResult> {
  const fallback = segmentDocument(text, tables);
  try {
    const raw = await runModel(env, env.SEGMENT_MODEL || SEGMENT_MODEL, {
      messages: [
        {
          role: "system",
          content:
            "Split the document into atomic sentences, bullets, steps, and definitions. " +
            "Return JSON only: {\\"units\\":[\\"exact substring\\", ...]}. " +
            "Copy text exactly. Do not paraphrase, merge claims, or add steps.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 4096,
    });
    const proposed = readUnits(raw);
    if (!proposed || proposed.length === 0) return { ...fallback, segmenter: "deterministic-fallback" };
    const usable = proposed.every((quote) => quote.length > 0 && text.includes(quote));
    const ratio = proposed.length / Math.max(fallback.units.length, 1);
    if (!usable || ratio < 0.5 || ratio > 1.5) return { ...fallback, segmenter: "deterministic-fallback" };
    const units: Unit[] = proposed.map((quote, index) => ({
      id: \`U\${String(index + 1).padStart(3, "0")}\`,
      chunk_id: fallback.chunks[0]?.id ?? "K001",
      ordinal: index + 1,
      section_path: sectionFor(quote, fallback.units) || "Document",
      text: quote,
      from_table: false,
      list_order: /^\\d+[.)]\\s+/.test(quote) ? Number(/^(\\d+)/.exec(quote)?.[1]) : null,
    }));
    const tableUnits = fallback.units.filter((unit) => unit.from_table).map((unit, index) => ({
      ...unit,
      id: \`U\${String(units.length + index + 1).padStart(3, "0")}\`,
      ordinal: units.length + index + 1,
    }));
    return { chunks: fallback.chunks, units: [...units, ...tableUnits], segmenter: "workers-ai" };
  } catch {
    return { ...fallback, segmenter: "deterministic-fallback" };
  }
}

function sectionFor(quote: string, units: Unit[]): string {
  return units.find((unit) => unit.text === quote)?.section_path ?? "";
}

function readUnits(raw: unknown): string[] | null {
  const text = readText(raw);
  if (!text) return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { units?: unknown };
    if (!Array.isArray(parsed.units)) return null;
    return parsed.units.filter((item): item is string => typeof item === "string").map((item) => item.trim());
  } catch {
    return null;
  }
}

function readText(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";
  const obj = raw as Record<string, unknown>;
  if (typeof obj.response === "string") return obj.response;
  if (typeof obj.result === "string") return obj.result;
  return "";
}
`},{path:`cloudflare/src/decision.ts`,body:`import { buildClefRequest } from "./engine/clef-questions.ts";
import { normalizeAnswers } from "./engine/normalize.ts";
import type { NormalizedDecision, Unit } from "./engine/types.ts";
import { runModel } from "./gateway.ts";
import type { Env } from "./env.ts";

const FLASH = "@cf/cloudflare/clef-flash";
const FULL = "@cf/cloudflare/clef";

/**
 * Clef decides. This function does not write summaries.
 * clef-flash is the default. Full clef runs once when confidence is low,
 * a label is unclear, or the top two choices are within 0.08.
 */
export async function decideUnit(
  env: Env,
  unit: Unit,
  neighbors: { before?: string; after?: string },
): Promise<NormalizedDecision> {
  const flashBody = buildClefRequest(unit, neighbors, "clef-flash");
  const flashRaw = await runModel(env, FLASH, flashBody);
  const flash = normalizeAnswers(asClef(flashRaw, "clef-flash"), unit.id);
  if (!needsFullClef(flash)) return flash;
  const fullBody = buildClefRequest(unit, neighbors, "clef");
  const fullRaw = await runModel(env, FULL, fullBody);
  return normalizeAnswers(asClef(fullRaw, "clef"), unit.id);
}

export function needsFullClef(decision: NormalizedDecision): boolean {
  if (decision.confidence < 0.72 || decision.conflict) return true;
  if (decision.polarity === "unclear") return true;
  if (decision.record_kind === "none" && decision.boilerplate === "no") return true;
  if (decision.record_kind === "theory" && (decision.causal === "unclear" || decision.falsifiable === "unclear")) {
    return true;
  }
  return false;
}

function asClef(raw: unknown, model: string): { model: string; answers: Record<string, unknown> } {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const nested = obj.result && typeof obj.result === "object" ? (obj.result as Record<string, unknown>) : obj;
  const answers = nested.answers && typeof nested.answers === "object" ? (nested.answers as Record<string, unknown>) : {};
  return { model: typeof nested.model === "string" ? nested.model : model, answers };
}
`},{path:`cloudflare/src/registry.ts`,body:`import type { Env } from "./env.ts";

/**
 * Global id registry. Keys are \`\${documentId}:\${localId}\`.
 * Local ids (F001) may repeat across documents. Reuse inside one document is rejected.
 * Assumption: Durable Object SQLite storage (\`ctx.storage.sql\`) matches compatibility_date 2026-10-01.
 */
export class IdRegistry extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(
        \`CREATE TABLE IF NOT EXISTS issued (
          key TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          local_id TEXT NOT NULL
        )\`,
      );
    });
  }

  async fetch(request: Request): Promise<Response> {
    const body = (await request.json()) as { document_id?: string; ids?: string[] };
    const documentId = body.document_id ?? "";
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!documentId || ids.length === 0) {
      return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
    }
    const reused: string[] = [];
    await this.ctx.blockConcurrencyWhile(async () => {
      for (const id of ids) {
        const key = \`\${documentId}:\${id}\`;
        const existing = this.ctx.storage.sql.exec("SELECT key FROM issued WHERE key = ?", key).toArray();
        if (existing.length > 0) reused.push(id);
      }
      if (reused.length > 0) return;
      for (const id of ids) {
        const key = \`\${documentId}:\${id}\`;
        this.ctx.storage.sql.exec(
          "INSERT INTO issued (key, document_id, local_id) VALUES (?, ?, ?)",
          key,
          documentId,
          id,
        );
      }
    });
    if (reused.length > 0) return Response.json({ ok: false, reused }, { status: 409 });
    return Response.json({ ok: true });
  }
}

export async function reserveIds(env: Env, documentId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const stub = env.REGISTRY.get(env.REGISTRY.idFromName("clef-ids"));
  const response = await stub.fetch("https://registry/issue", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId, ids }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(\`id registry rejected the set: \${detail}\`);
  }
}
`},{path:`cloudflare/src/compiler.ts`,body:`import type { D1Database } from "./env.ts";
import type { ExtractionOutput, ReviewItem } from "./engine/types.ts";

export interface StoredJob {
  id: string;
  status: "complete" | "needs_review";
  engine: string;
  output: ExtractionOutput;
  review_queue: ReviewItem[];
}

/** Reads the compiled JSON written by ingest. Does not invent rows. */
export async function loadJob(db: D1Database, documentId: string): Promise<StoredJob | null> {
  const row = await db
    .prepare(\`SELECT id, status, engine, result_json FROM documents WHERE id = ?\`)
    .bind(documentId)
    .first<{ id: string; status: string; engine: string; result_json: string | null }>();
  if (!row || !row.result_json) return null;
  const parsed = JSON.parse(row.result_json) as { output: ExtractionOutput; review_queue: ReviewItem[] };
  const status = row.status === "complete" ? "complete" : "needs_review";
  return { id: row.id, status, engine: row.engine, output: parsed.output, review_queue: parsed.review_queue };
}
`},{path:`cloudflare/src/review.ts`,body:`import type { D1Database } from "./env.ts";
import type { ReviewItem } from "./engine/types.ts";

export async function enqueueReview(db: D1Database, documentId: string, items: ReviewItem[]): Promise<void> {
  for (const item of items) {
    await db
      .prepare(
        \`INSERT INTO review_queue (id, document_id, unit_id, reason, confidence, payload, status)
         VALUES (?, ?, ?, ?, ?, ?, 'open')\`,
      )
      .bind(
        \`\${documentId}:\${item.id}\`,
        documentId,
        item.unit_id,
        item.reasons.join(","),
        item.confidence,
        JSON.stringify(item),
      )
      .run();
  }
}

export async function listReview(db: D1Database, documentId: string): Promise<ReviewItem[]> {
  const rows = await db
    .prepare(
      \`SELECT payload FROM review_queue WHERE document_id = ? AND status = 'open' ORDER BY id\`,
    )
    .bind(documentId)
    .all<{ payload: string }>();
  return rows.results.map((row) => JSON.parse(row.payload) as ReviewItem);
}
`},{path:`cloudflare/src/engine/clef-questions.ts`,body:`import type { Unit } from "./types.ts";

/**
 * Schema authoring note.
 * Written once. Grok is the planner and does not re-classify each sentence.
 * The Decision Worker sends this object to Clef on every unit.
 * Clef has no free-text answers. Evidence quotes come from the segmenter.
 *
 * Assumption (2026-10-02): Clef question types are noul, choice, and score.
 * This schema uses only noul (yes-probability; there is no separate boolean
 * type) and choice. Score is intentionally unused.
 */
export const CLEF_QUESTIONS = {
  boilerplate: {
    type: "noul",
    instructions:
      "Is \`text\` only a heading, running header, page number, or other non-claim that asserts nothing?",
  },
  deterministic: {
    type: "noul",
    instructions:
      "Does \`text\` state the claim as a fact, with no hedge such as may, might, could, likely, or suggests?",
  },
  quantity_present: {
    type: "noul",
    instructions: "Does \`text\` contain a number, count, percent, or clock time?",
  },
  definition_present: {
    type: "noul",
    instructions:
      "Does \`text\` define a term with 'defined as', 'means', or 'refers to'?",
  },
  decision_point: {
    type: "noul",
    instructions:
      "Does \`text\` mark an explicit decision, such as if, whether, otherwise, or decide?",
  },
  fully_specified: {
    type: "noul",
    instructions:
      "Does \`text\` name the actor and either an input or an output of this step? Answer no if either is missing.",
  },
  external_check: {
    type: "noul",
    instructions:
      "Does \`text\` rely on a citation, guideline, or outside source that is not contained in \`text\`?",
  },
  polarity: {
    type: "choice",
    instructions:
      "What polarity does \`text\` assert? If it both negates and states a condition, choose conditional. If you cannot tell, choose unclear.",
    criteria: {
      affirmed: "The sentence asserts the claim.",
      denied: "The sentence asserts that the claim is not the case.",
      conditional: "The claim depends on an explicit if, unless, or when.",
      unclear: "The sentence does not show which of the above applies.",
    },
  },
  record_kind: {
    type: "choice",
    instructions:
      "What kind of record is \`text\`? Choose one. Do not summarize. Judge only \`text\`.",
    criteria: {
      fact: "A checkable claim stated as fact, not a definition, step, or hedged reading.",
      theory: "A hypothesis, model, interpretation, prediction, or hedged causal reading.",
      concept: "A named term being defined.",
      workflow_step: "An ordered action, trigger, or decision in a described procedure.",
      none: "No claim, definition, or step.",
    },
  },
  theory_status: {
    type: "choice",
    instructions:
      "If \`text\` is a theory, which status fits? Otherwise choose not_applicable.",
    criteria: {
      hypothesis: "Hedged with may, might, could, or named as a hypothesis.",
      model: "Named as a model or framework.",
      interpretation: "A reading of evidence, including 'according to' or 'interpretation'.",
      prediction: "A forecast about a future outcome.",
      not_applicable: "Text is not a theory.",
    },
  },
  causal: {
    type: "choice",
    instructions:
      "Does \`text\` state a cause, using because, causes, leads to, results in, or due to? Choose unclear only if the causal direction is stated and cannot be read.",
    criteria: {
      yes: "An explicit causal connective is present.",
      no: "No causal connective is present.",
      unclear: "Causal language is present but the direction cannot be read.",
    },
  },
  falsifiable: {
    type: "choice",
    instructions:
      "If \`text\` is a theory, can it be falsified from what \`text\` itself says? Choose unclear unless the sentence states a measurement or says it cannot be tested. Do not use outside knowledge.",
    criteria: {
      yes: "The sentence states a measurement, threshold, or other explicit test.",
      no: "The sentence says the claim cannot be tested.",
      unclear: "The sentence does not say how the claim would be tested.",
    },
  },
  time_scope: {
    type: "choice",
    instructions:
      "What time does the main claim in \`text\` sit in? Choose unspecified if cues conflict or are absent. 'Shall' as a standing rule is present, not future.",
    criteria: {
      past: "The main verb is past or the sentence reports a completed event.",
      present: "The sentence states a current fact or a standing rule.",
      future: "The sentence uses will or an explicit future forecast.",
      unspecified: "No single time scope is shown.",
    },
  },
  concept_type: {
    type: "choice",
    instructions:
      "If \`text\` defines a term, what type is that term? Otherwise choose not_applicable.",
    criteria: {
      entity: "A named organization, place, person, or product.",
      process: "A procedure, protocol, callback, or pipeline.",
      metric: "A score, rate, count, threshold, or index.",
      role: "A person-role such as nurse, physician, or operator.",
      tool: "A system, database, or software tool.",
      other: "A defined term that is none of the above.",
      not_applicable: "Text does not define a term.",
    },
  },
} as const;

export interface ClefRequest {
  model: "clef" | "clef-flash";
  state: {
    section: string;
    unit_id: string;
    text: string;
    before: string;
    after: string;
  };
  questions: typeof CLEF_QUESTIONS;
}

export function buildClefRequest(
  unit: Unit,
  neighbors: { before?: string; after?: string },
  model: "clef" | "clef-flash" = "clef-flash",
): ClefRequest {
  return {
    model,
    state: {
      section: unit.section_path,
      unit_id: unit.id,
      text: unit.text,
      before: clip(neighbors.before ?? ""),
      after: clip(neighbors.after ?? ""),
    },
    questions: CLEF_QUESTIONS,
  };
}

function clip(text: string): string {
  const clean = text.trim();
  if (clean.length <= 180) return clean;
  const slice = clean.slice(0, 180);
  const sp = slice.lastIndexOf(" ");
  return sp > 80 ? slice.slice(0, sp) : slice;
}
`}],ht=`clef-ledger`,q=`versions`,gt=24;async function _t(e){if(typeof indexedDB>`u`)return null;let t=await yt(),n=await J(t.transaction(q,`readonly`).objectStore(q).get(e.id));if(n)return t.close(),n;let r=await bt(t),i={version_id:e.id,title:e.chunks[0]?.heading||`Document`,created_at:new Date().toISOString(),parent_version_id:r&&r.version_id!==e.id?r.version_id:null,status:e.status,review_count:e.review.length,engine:e.engine,job:e};await J(t.transaction(q,`readwrite`).objectStore(q).put(i));let a=await J(t.transaction(q,`readonly`).objectStore(q).getAll()),o=a.sort((e,t)=>e.created_at.localeCompare(t.created_at)).slice(0,Math.max(0,a.length-gt));if(o.length>0){let e=t.transaction(q,`readwrite`);for(let t of o)e.objectStore(q).delete(t.version_id);await xt(e)}return t.close(),i}async function vt(){if(typeof indexedDB>`u`)return[];let e=await yt(),t=await J(e.transaction(q,`readonly`).objectStore(q).getAll());return e.close(),t.sort((e,t)=>e.created_at.localeCompare(t.created_at))}function yt(){return new Promise((e,t)=>{let n=indexedDB.open(ht,1);n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(q)||e.createObjectStore(q,{keyPath:`version_id`})},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error)})}function bt(e){return J(e.transaction(q,`readonly`).objectStore(q).getAll()).then(e=>e.sort((e,t)=>t.created_at.localeCompare(e.created_at))[0]??null)}function J(e){return new Promise((t,n)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>n(e.error)})}function xt(e){return new Promise((t,n)=>{e.oncomplete=()=>t(),e.onerror=()=>n(e.error),e.onabort=()=>n(e.error)})}var St=[{id:`overview`,label:`Overview`},{id:`ask`,label:`Ask`},{id:`concepts`,label:`Concepts`},{id:`facts`,label:`Facts`},{id:`theories`,label:`Theories`},{id:`workflows`,label:`Workflows`},{id:`relations`,label:`Relations`},{id:`review`,label:`Review`},{id:`json`,label:`JSON`},{id:`contract`,label:`Contract`}];function Ct(){let[e,t]=(0,B.useState)(z),[n,r]=(0,B.useState)(``),[i,a]=(0,B.useState)(!1),[s,c]=(0,B.useState)([]),[l,u]=(0,B.useState)(()=>De(z)),[d,f]=(0,B.useState)(null),[p,m]=(0,B.useState)(`overview`),[h,g]=(0,B.useState)(null),[_,v]=(0,B.useState)(K[0].path),[y,b]=(0,B.useState)(``),[x,S]=(0,B.useState)([]),C=(0,B.useMemo)(()=>Nt(n),[n]);(0,B.useEffect)(()=>{V.views=[Qe({id:l.id,status:l.status,engine:l.engine,title:l.chunks[0]?.heading||`Document`,review_count:l.review.length,output:l.output})],$e(),_t(l).then(()=>vt()).then(S).catch(()=>S([])),(e.trim()||C.length>0)&&fetch(`/api/extract`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({text:e,tables:C,resolutions:s})}).catch(()=>void 0)},[l,s,C,e]);function w(t=e,n=C,r=[]){if(!t.trim()&&n.length===0){f(`Paste a document first.`);return}if(t.length>1e5){f(`This desk reads up to 100,000 characters.`);return}try{let e=De(t,n,r);u(e),c(r),f(null),m(`overview`),fetch(`/api/extract`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify({text:t,tables:n,resolutions:r})})}catch(e){f(e instanceof Error?e.message:`Could not read that document.`)}}function T(t,n,r){let i=[...s.filter(e=>e.unit_id!==t),{unit_id:t,action:n,polarity:r}];try{u(De(e,C,i)),c(i),f(null)}catch(e){f(e instanceof Error?e.message:`Could not apply that review.`)}}let E=JSON.stringify(l.output,null,2),D=K.find(e=>e.path===_)??K[0];return(0,W.jsxs)(`main`,{className:`mx-auto max-w-6xl px-4 py-6 sm:px-6`,children:[(0,W.jsxs)(`header`,{className:`mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between`,children:[(0,W.jsx)(`div`,{children:(0,W.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,W.jsx)(`span`,{className:`grid h-11 w-11 place-items-center bg-stamp font-display text-lg text-paper`,children:`C`}),(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`h1`,{className:`font-display text-3xl leading-none text-ink`,children:`Clef Extract`}),(0,W.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:`Closed labels, exact quotes, a human on anything unclear.`})]})]})}),(0,W.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>Ft(E),children:`Export JSON`}),(0,W.jsx)(`button`,{type:`button`,className:Q,onClick:()=>{navigator.clipboard?.writeText(E),b(`json`)},children:y===`json`?`Copied`:`Copy JSON`})]})]}),(0,W.jsxs)(`div`,{className:`grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]`,children:[(0,W.jsxs)(`section`,{className:`order-2 lg:sticky lg:top-4 lg:order-1 lg:self-start`,children:[(0,W.jsxs)(`div`,{className:`mb-2 flex items-baseline justify-between`,children:[(0,W.jsx)(`h2`,{className:`font-display text-xl text-ink`,children:`Source`}),(0,W.jsxs)(`span`,{className:`font-mono text-xs text-muted`,children:[Pt(e),` words`]})]}),(0,W.jsx)(`textarea`,{value:e,onChange:e=>t(e.target.value),onKeyDown:e=>{(e.metaKey||e.ctrlKey)&&e.key===`Enter`&&w()},spellCheck:!1,"aria-label":`Document text`,className:`h-56 w-full resize-y border border-line bg-card p-3 font-sans text-sm leading-relaxed text-ink lg:h-80`}),(0,W.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[(0,W.jsx)(`button`,{type:`button`,className:Q,onClick:()=>w(),children:`Extract`}),(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>{t(z),r(``),w(z,[],[])},children:`Load sample`}),(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>a(e=>!e),children:i?`Hide table`:`Add table`})]}),i?(0,W.jsxs)(`label`,{className:`mt-3 block text-sm text-muted`,children:[`Table rows, cells separated by |`,(0,W.jsx)(`textarea`,{value:n,onChange:e=>r(e.target.value),"aria-label":`Table rows`,className:`mt-1 h-24 w-full resize-y border border-line bg-card p-3 font-mono text-xs text-ink`})]}):null,d?(0,W.jsx)(`p`,{className:`mt-3 text-sm text-review`,children:d}):null,(0,W.jsxs)(`p`,{className:`mt-4 text-xs leading-relaxed text-muted`,children:[`This desk runs the closed-label stand-in so you can read a document without a Cloudflare account. The Worker sends the same questions to Clef-flash, then full Clef when confidence is under`,` `,o,`.`]})]}),(0,W.jsxs)(`section`,{className:`order-1 min-w-0 lg:order-2`,children:[(0,W.jsx)(`div`,{className:`mb-4 flex gap-1 overflow-x-auto border-b border-line`,role:`tablist`,children:St.map(e=>{let t=p===e.id,n=e.id===`review`&&l.review.length>0?` ${l.review.length}`:``;return(0,W.jsxs)(`button`,{type:`button`,role:`tab`,"aria-selected":t,className:`min-h-11 shrink-0 border-b-2 px-3 text-sm ${t?`border-stamp text-ink`:`border-transparent text-muted`}`,onClick:()=>m(e.id),children:[e.label,n]},e.id)})}),p===`overview`?(0,W.jsx)(wt,{job:l,onReview:()=>m(`review`)}):null,p===`ask`?(0,W.jsx)(ct,{job:l,versions:x}):null,p===`concepts`?(0,W.jsx)(Tt,{job:l,onPick:g,selected:h}):null,p===`facts`?(0,W.jsx)(Et,{job:l,onPick:g,selected:h}):null,p===`theories`?(0,W.jsx)(Dt,{job:l}):null,p===`workflows`?(0,W.jsx)(Ot,{job:l}):null,p===`relations`?(0,W.jsx)(kt,{job:l}):null,p===`review`?(0,W.jsx)(At,{job:l,onResolve:T}):null,p===`json`?(0,W.jsx)(`pre`,{className:`max-h-[36rem] overflow-auto border border-line bg-card p-4 font-mono text-xs leading-relaxed text-ink`,children:E}):null,p===`contract`?(0,W.jsx)(jt,{job:l,selected:h,filePath:D.path,fileBody:D.body,onFile:v,copied:y===D.path,onCopy:()=>{navigator.clipboard?.writeText(D.body),b(D.path)}}):null]})]})]})}function wt({job:e,onReview:t}){let n=e.output.coverage,r=n.segments_total,i=r===0?100:Math.round(n.segments_classified/r*100),a=e.output.relations.find(e=>e.relation===`contradicts`),o=e.output.facts.find(e=>e.id===a?.source_id),s=e.output.facts.find(e=>e.id===a?.target_id);return(0,W.jsxs)(`div`,{className:`space-y-4`,children:[(0,W.jsxs)(`div`,{className:`border border-line bg-card p-4`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap items-baseline justify-between gap-2`,children:[(0,W.jsx)(`p`,{className:`font-display text-2xl text-ink`,children:e.status===`complete`?`Gate closed`:`Gate held`}),(0,W.jsxs)(`p`,{className:`font-mono text-sm text-muted`,children:[n.segments_classified,`/`,r,` classified`]})]}),(0,W.jsx)(`div`,{className:`mt-3 h-2 bg-line`,"aria-hidden":`true`,children:(0,W.jsx)(`div`,{className:`h-2 bg-stamp`,style:{width:`${i}%`}})}),(0,W.jsx)(`p`,{className:`mt-3 text-sm text-muted`,children:e.status===`complete`?`Every sentence is a record or boilerplate. Humans still own any field left unclear.`:`Unclear and low-confidence rows stay out of the export until you accept them.`})]}),(0,W.jsxs)(`div`,{className:`grid grid-cols-2 gap-2 sm:grid-cols-3`,children:[(0,W.jsx)(Y,{label:`Concepts`,value:e.output.concepts.length}),(0,W.jsx)(Y,{label:`Facts`,value:e.output.facts.length}),(0,W.jsx)(Y,{label:`Theories`,value:e.output.theories.length}),(0,W.jsx)(Y,{label:`Workflows`,value:e.output.workflows.length}),(0,W.jsx)(Y,{label:`Relations`,value:e.output.relations.length}),(0,W.jsx)(Y,{label:`Held`,value:e.review.length})]}),o&&s?(0,W.jsxs)(`div`,{className:`border border-line bg-card p-4`,children:[(0,W.jsx)(`h3`,{className:`font-display text-lg text-ink`,children:`Contradiction kept apart`}),(0,W.jsxs)(`p`,{className:`mt-1 text-sm text-muted`,children:[a?.source_id,` contradicts `,a?.target_id,`. They were not merged.`]}),(0,W.jsx)(`blockquote`,{className:`mt-3 border-l-2 border-review pl-3 font-mono text-sm text-ink`,children:o.evidence_quote}),(0,W.jsx)(`blockquote`,{className:`mt-3 border-l-2 border-stamp pl-3 font-mono text-sm text-ink`,children:s.evidence_quote})]}):null,e.review.length>0?(0,W.jsxs)(`button`,{type:`button`,className:$,onClick:t,children:[`Review `,e.review.length,` held `,e.review.length===1?`row`:`rows`]}):null,(0,W.jsxs)(`p`,{className:`font-mono text-xs text-muted`,children:[e.chunks.length,` chunk`,e.chunks.length===1?``:`s`,` · `,e.engine,` · `,e.id]})]})}function Tt({job:e,onPick:t,selected:n}){return e.output.concepts.length===0?(0,W.jsx)(Z,{children:`No accepted concepts.`}):(0,W.jsx)(`ul`,{className:`space-y-3`,children:e.output.concepts.map(e=>(0,W.jsx)(`li`,{children:(0,W.jsxs)(`button`,{type:`button`,onClick:()=>t(e.id),className:`w-full border bg-card p-4 text-left ${n===e.id?`border-stamp`:`border-line`}`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap items-baseline justify-between gap-2`,children:[(0,W.jsx)(`span`,{className:`font-mono text-xs text-muted`,children:e.id}),(0,W.jsx)(`span`,{className:`font-mono text-xs uppercase text-stamp`,children:e.type})]}),(0,W.jsx)(`p`,{className:`mt-1 font-display text-xl text-ink`,children:e.term}),(0,W.jsx)(`p`,{className:`mt-2 font-mono text-sm text-ink`,children:e.definition_present===`yes`?e.definition_quote:`No definition in the sentence.`})]})},e.id))})}function Et({job:e,onPick:t,selected:n}){return e.output.facts.length===0?(0,W.jsx)(Z,{children:`No accepted facts.`}):(0,W.jsx)(`ul`,{className:`space-y-3`,children:e.output.facts.map(e=>(0,W.jsx)(`li`,{children:(0,W.jsxs)(`button`,{type:`button`,onClick:()=>t(e.id),className:`w-full border bg-card p-4 text-left ${n===e.id?`border-stamp`:`border-line`}`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap gap-3 font-mono text-xs uppercase`,children:[(0,W.jsx)(`span`,{className:`text-muted`,children:e.id}),(0,W.jsx)(Mt,{value:e.polarity}),(0,W.jsx)(`span`,{className:`text-muted`,children:e.time_scope}),(0,W.jsx)(`span`,{className:`text-muted`,children:e.deterministic===`yes`?`deterministic`:`not deterministic`}),(0,W.jsx)(`span`,{className:`text-muted`,children:e.quantity_present===`yes`?`quantity`:`no quantity`})]}),(0,W.jsx)(`p`,{className:`mt-2 font-mono text-sm text-ink`,children:e.evidence_quote})]})},e.id))})}function Dt({job:e}){return e.output.theories.length===0?(0,W.jsx)(Z,{children:`No theories in the export. Hedged readings wait in Review until you accept them.`}):(0,W.jsx)(`ul`,{className:`space-y-3`,children:e.output.theories.map(e=>(0,W.jsxs)(`li`,{className:`border border-line bg-card p-4`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap gap-3 font-mono text-xs uppercase`,children:[(0,W.jsx)(`span`,{className:`text-muted`,children:e.id}),(0,W.jsx)(`span`,{className:`text-stamp`,children:e.status}),(0,W.jsxs)(`span`,{className:`text-muted`,children:[`causal `,e.causal]}),(0,W.jsxs)(`span`,{className:`text-muted`,children:[`falsifiable `,e.falsifiable]})]}),(0,W.jsx)(`p`,{className:`mt-2 font-mono text-sm text-ink`,children:e.evidence_quote}),(0,W.jsxs)(`p`,{className:`mt-2 text-xs text-muted`,children:[`Conflicts with `,e.conflicts_with_fact_id]})]},e.id))})}function Ot({job:e}){return e.output.workflows.length===0?(0,W.jsx)(Z,{children:`No workflow in the accepted set.`}):(0,W.jsx)(`div`,{className:`space-y-4`,children:e.output.workflows.map(e=>(0,W.jsxs)(`article`,{className:`border border-line bg-card p-4`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap items-baseline justify-between gap-2`,children:[(0,W.jsx)(`h3`,{className:`font-display text-2xl text-ink`,children:e.name}),(0,W.jsx)(`span`,{className:`font-mono text-xs text-muted`,children:e.id})]}),(0,W.jsxs)(`dl`,{className:`mt-3 space-y-2 text-sm`,children:[(0,W.jsx)(X,{k:`Trigger`,v:e.trigger}),(0,W.jsx)(X,{k:`End`,v:e.end_condition}),(0,W.jsx)(X,{k:`Roles`,v:e.roles.join(`, `)}),(0,W.jsx)(X,{k:`Tools`,v:e.tools_mentioned}),(0,W.jsx)(X,{k:`Fully specified`,v:e.fully_specified})]}),(0,W.jsx)(`ol`,{className:`mt-4 space-y-3`,children:e.steps.map(e=>(0,W.jsxs)(`li`,{className:`grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3`,children:[(0,W.jsx)(`span`,{className:`grid h-10 w-10 place-items-center bg-stamp font-mono text-sm text-paper`,children:e.order}),(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`p`,{className:`font-mono text-sm text-ink`,children:e.action}),(0,W.jsxs)(`p`,{className:`mt-1 text-xs text-muted`,children:[e.actor,` · in `,e.input,` · out `,e.output,` · decision `,e.decision]})]})]},e.order))})]},e.id))})}function kt({job:e}){return e.output.relations.length===0?(0,W.jsx)(Z,{children:`No relations between accepted records.`}):(0,W.jsx)(`ul`,{className:`space-y-2`,children:e.output.relations.map(e=>(0,W.jsxs)(`li`,{className:`border border-line bg-card px-4 py-3 font-mono text-sm text-ink`,children:[e.source_id,` `,(0,W.jsx)(`span`,{className:`text-stamp`,children:e.relation}),` `,e.target_id]},`${e.source_id}-${e.relation}-${e.target_id}`))})}function At({job:e,onResolve:t}){return e.review.length===0?(0,W.jsx)(Z,{children:`Nothing is waiting. The gate is closed for this text.`}):(0,W.jsx)(`ul`,{className:`space-y-3`,children:e.review.map(e=>(0,W.jsxs)(`li`,{className:`border border-line border-l-2 border-l-review bg-card p-4`,children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap gap-2 font-mono text-xs uppercase text-muted`,children:[(0,W.jsx)(`span`,{children:e.id}),(0,W.jsxs)(`span`,{children:[Math.round(e.confidence*100),`%`]}),(0,W.jsx)(`span`,{children:e.reasons.join(` · `)})]}),(0,W.jsx)(`p`,{className:`mt-2 font-mono text-sm text-ink`,children:e.quote}),(0,W.jsxs)(`p`,{className:`mt-2 text-xs text-muted`,children:[`Proposed `,e.proposed_kind,e.proposed_kind===`theory`?` · ${e.proposed_status}`:``,` · `,e.proposed_polarity,e.conflict?` · choice was close`:``]}),(0,W.jsxs)(`div`,{className:`mt-3 flex flex-wrap gap-2`,children:[e.proposed_kind===`fact`&&e.proposed_polarity===`unclear`?(0,W.jsxs)(W.Fragment,{children:[(0,W.jsx)(`button`,{type:`button`,className:Q,onClick:()=>t(e.unit_id,`accept`,`affirmed`),children:`Affirmed`}),(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>t(e.unit_id,`accept`,`denied`),children:`Denied`}),(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>t(e.unit_id,`accept`,`conditional`),children:`Conditional`})]}):(0,W.jsx)(`button`,{type:`button`,className:Q,onClick:()=>t(e.unit_id,`accept`),children:`Accept`}),e.conflict?(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>t(e.unit_id,`file_as_fact`),children:`File as fact`}):null,(0,W.jsx)(`button`,{type:`button`,className:$,onClick:()=>t(e.unit_id,`boilerplate`),children:`Mark boilerplate`})]})]},e.id))})}function jt({job:e,selected:t,filePath:n,fileBody:a,onFile:o,copied:s,onCopy:c}){let l=e.units.find(e=>e.id===t)??e.units.find(t=>t.text===e.output.facts[0]?.statement)??e.units[0],u=l?e.units.findIndex(e=>e.id===l.id):-1,d=l?i(l,{before:e.units[u-1]?.text,after:e.units[u+1]?.text}):{model:`clef-flash`,state:{},questions:r};return(0,W.jsxs)(`div`,{className:`space-y-6`,children:[(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`h3`,{className:`font-display text-2xl text-ink`,children:`Question schema`}),(0,W.jsx)(`p`,{className:`mt-2 text-sm text-muted`,children:`Written once. Grok does not re-label each sentence. Clef returns probabilities over these noul and choice questions. Evidence quotes stay with the segmenter.`}),(0,W.jsx)(`pre`,{className:`mt-3 max-h-80 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink`,children:JSON.stringify(d,null,2)})]}),(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`h3`,{className:`font-display text-2xl text-ink`,children:`Runbook`}),(0,W.jsxs)(`ol`,{className:`mt-3 list-decimal space-y-2 pl-5 text-sm text-ink`,children:[(0,W.jsx)(`li`,{children:"Create the D1 database `clef_extract`, an AI Gateway named `clef-extract`, and log in with Wrangler."}),(0,W.jsx)(`li`,{children:"Put the database id in `cloudflare/wrangler.jsonc`, then apply `schema.sql`."}),(0,W.jsx)(`li`,{children:"From `cloudflare/`, deploy with Wrangler. The bundle includes the shared engine."}),(0,W.jsx)(`li`,{children:"POST one document to `/extract`."}),(0,W.jsx)(`li`,{children:"GET `/jobs/:id` and read `output.coverage`. Classified plus unassigned equals the total."}),(0,W.jsx)(`li`,{children:"Accept or drop held rows by POSTing the same text with `resolutions`. Review is not its own route."}),(0,W.jsx)(`li`,{children:"Export the `output` object only after status is `complete` if you need a system of record."}),(0,W.jsx)(`li`,{children:`A chatbot calls POST /api/mcp (streamable HTTP). lookup and quote_answer omit held rows.`})]})]}),(0,W.jsxs)(`div`,{children:[(0,W.jsx)(`h3`,{className:`font-display text-2xl text-ink`,children:`v1 limits`}),(0,W.jsxs)(`ul`,{className:`mt-3 list-disc space-y-2 pl-5 text-sm text-muted`,children:[(0,W.jsx)(`li`,{children:`Images are out of scope unless already OCR’d. Tables arrive as rows.`}),(0,W.jsx)(`li`,{children:`The desk you are using is the deterministic stand-in, not a Clef call.`}),(0,W.jsx)(`li`,{children:`Clef has noul, choice, and score. This schema uses noul and choice only.`}),(0,W.jsx)(`li`,{children:`IDs are stable for the same text. They are not a global corpus sequence.`}),(0,W.jsx)(`li`,{children:`One synchronous pass, 100,000 characters. Queue fan-out is deferred.`}),(0,W.jsx)(`li`,{children:`Unclear, conflicting, and external-check rows stay in the human queue.`}),(0,W.jsx)(`li`,{children:`Ask and MCP quote accepted records only. WebGPU reranks those quotes. It does not generate new ones.`})]})]}),(0,W.jsxs)(`div`,{children:[(0,W.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-2`,children:[(0,W.jsx)(`h3`,{className:`font-display text-2xl text-ink`,children:`Starter files`}),(0,W.jsx)(`button`,{type:`button`,className:$,onClick:c,children:s?`Copied`:`Copy file`})]}),(0,W.jsxs)(`label`,{className:`mt-3 block text-sm text-muted`,children:[`File`,(0,W.jsx)(`select`,{value:n,onChange:e=>o(e.target.value),className:`mt-1 min-h-11 w-full border border-line bg-card px-3 text-sm text-ink`,children:K.map(e=>(0,W.jsx)(`option`,{value:e.path,children:e.path},e.path))})]}),(0,W.jsx)(`pre`,{className:`mt-3 max-h-96 overflow-auto border border-line bg-card p-4 font-mono text-xs text-ink`,children:a})]})]})}function Y({label:e,value:t}){return(0,W.jsxs)(`div`,{className:`border border-line bg-card px-3 py-3`,children:[(0,W.jsx)(`div`,{className:`font-mono text-2xl text-ink`,children:t}),(0,W.jsx)(`div`,{className:`text-xs uppercase tracking-wide text-muted`,children:e})]})}function X({k:e,v:t}){return(0,W.jsxs)(`div`,{className:`grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)]`,children:[(0,W.jsx)(`dt`,{className:`text-muted`,children:e}),(0,W.jsx)(`dd`,{className:`font-mono text-sm text-ink`,children:t})]})}function Mt({value:e}){return(0,W.jsx)(`span`,{className:e===`denied`?`text-review`:e===`affirmed`?`text-stamp`:`text-ink`,children:e})}function Z({children:e}){return(0,W.jsx)(`p`,{className:`border border-line bg-card p-4 text-sm text-muted`,children:e})}function Nt(e){let t=e.split(`
`).map(e=>e.trim()).filter(Boolean).map(e=>e.split(`|`).map(e=>e.trim()));return t.length===0?[]:[{name:`Pasted`,rows:t}]}function Pt(e){return e.trim().split(/\s+/).filter(Boolean).length}function Ft(e){let t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`clef-extract.json`,r.click(),URL.revokeObjectURL(n)}var Q=`min-h-11 bg-stamp px-4 text-sm font-medium text-paper hover:opacity-90`,$=`min-h-11 border border-line bg-card px-4 text-sm font-medium text-ink hover:border-stamp`;function It(){return(0,W.jsx)(Ct,{})}export{It as component};