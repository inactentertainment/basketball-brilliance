import{portalArticles as original}from'./portal-articles-data.js?v=52';
import{extraArticles}from'./portal-extra-data.js?v=55';
// Preserve every original article and URL; append focused new teaching guides.
export const portalArticles=Object.fromEntries(['coach','parent'].map(role=>{
 const combined=[...original[role],...extraArticles[role]];
 if(new Set(combined.map(a=>a.slug)).size!==combined.length)throw new Error('Duplicate article slug');
 return[role,combined];
}));
