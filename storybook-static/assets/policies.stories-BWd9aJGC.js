import{R as e}from"./index-ZH-6pyQh.js";import{c as W,a as p}from"./policies-BTgkHR3H.js";import"./_commonjsHelpers-CqkleIqs.js";function F({role:i="viewer"}){const M=["owner","operator","strategist","viewer","agent"],d=["dashboard","company","mir","msp","icps","segments","campaigns","settings"],V=r=>({owner:"Owner",operator:"Operator",strategist:"Strategist",viewer:"Viewer",agent:"Agent"})[r];return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Role-Based Access Control Matrix"),e.createElement("div",{style:{marginTop:"2rem",overflowX:"auto"}},e.createElement("table",{style:{borderCollapse:"collapse",width:"100%",fontSize:"0.875rem"}},e.createElement("thead",null,e.createElement("tr",{style:{backgroundColor:"#f3f4f6",borderBottom:"2px solid #d1d5db"}},e.createElement("th",{style:{padding:"0.75rem",textAlign:"left",border:"1px solid #d1d5db",fontWeight:"bold"}},"Role"),d.map(r=>e.createElement("th",{key:r,style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",fontWeight:"bold"}},r)),e.createElement("th",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",fontWeight:"bold"}},"Publish"))),e.createElement("tbody",null,M.map(r=>e.createElement("tr",{key:r,style:{backgroundColor:r===i?"#eff6ff":"white"}},e.createElement("td",{style:{padding:"0.75rem",border:"1px solid #d1d5db",fontWeight:r===i?"bold":"normal"}},V(r)),d.map(c=>{const m=W(r,c);return e.createElement("td",{key:`${r}-${c}`,style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",backgroundColor:m?"#d1fae5":"#fee2e2"}},m?"✓":"✗")}),e.createElement("td",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",backgroundColor:p(r)?"#d1fae5":"#fee2e2"}},p(r)?"✓":"✗")))))),e.createElement("div",{style:{marginTop:"2rem",fontSize:"0.875rem",color:"#666"}},e.createElement("p",null,e.createElement("strong",null,"Permission Rules:")),e.createElement("ul",{style:{marginLeft:"1rem"}},e.createElement("li",null,"All roles can access dashboard"),e.createElement("li",null,"Settings restricted to owner and operator only"),e.createElement("li",null,"Viewers are read-only across all accessible routes"),e.createElement("li",null,"Publish permissions limited to owner, operator, and strategist"))))}const _={title:"Foundation/RBAC Policies",component:F,parameters:{layout:"fullscreen"},argTypes:{role:{control:"select",options:["owner","operator","strategist","viewer","agent"],description:"Role to highlight access matrix for"}}},t={args:{role:"viewer"}},a={args:{role:"owner"},parameters:{role:"owner"}},o={args:{role:"operator"},parameters:{role:"operator"}},s={args:{role:"strategist"},parameters:{role:"strategist"}},n={args:{role:"viewer"},parameters:{role:"viewer"}},l={args:{role:"agent"}};var g,u,b;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    role: "viewer"
  }
}`,...(b=(u=t.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};var w,f,v;a.parameters={...a.parameters,docs:{...(w=a.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(v=(f=a.parameters)==null?void 0:f.docs)==null?void 0:v.source}}};var E,y,h;o.parameters={...o.parameters,docs:{...(E=o.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(h=(y=o.parameters)==null?void 0:y.docs)==null?void 0:h.source}}};var x,P,A;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(A=(P=s.parameters)==null?void 0:P.docs)==null?void 0:A.source}}};var S,R,C;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(C=(R=n.parameters)==null?void 0:R.docs)==null?void 0:C.source}}};var k,O,B;l.parameters={...l.parameters,docs:{...(k=l.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    role: "agent"
  }
}`,...(B=(O=l.parameters)==null?void 0:O.docs)==null?void 0:B.source}}};const $=["FullMatrix","OwnerPerspective","OperatorPerspective","StrategistPerspective","ViewerPerspective","AgentPerspective"];export{l as AgentPerspective,t as FullMatrix,o as OperatorPerspective,a as OwnerPerspective,s as StrategistPerspective,n as ViewerPerspective,$ as __namedExportsOrder,_ as default};
