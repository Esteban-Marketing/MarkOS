import{j as e}from"./jsx-runtime-D_zvdyIk.js";import{c as W,a as m}from"./policies-IY8FssQC.js";function F({role:d="viewer"}){const M=["owner","operator","strategist","viewer","agent"],c=["dashboard","company","mir","msp","icps","segments","campaigns","settings"],V=r=>({owner:"Owner",operator:"Operator",strategist:"Strategist",viewer:"Viewer",agent:"Agent"})[r];return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Role-Based Access Control Matrix"}),e.jsx("div",{style:{marginTop:"2rem",overflowX:"auto"},children:e.jsxs("table",{style:{borderCollapse:"collapse",width:"100%",fontSize:"0.875rem"},children:[e.jsx("thead",{children:e.jsxs("tr",{style:{backgroundColor:"#f3f4f6",borderBottom:"2px solid #d1d5db"},children:[e.jsx("th",{style:{padding:"0.75rem",textAlign:"left",border:"1px solid #d1d5db",fontWeight:"bold"},children:"Role"}),c.map(r=>e.jsx("th",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",fontWeight:"bold"},children:r},r)),e.jsx("th",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",fontWeight:"bold"},children:"Publish"})]})}),e.jsx("tbody",{children:M.map(r=>e.jsxs("tr",{style:{backgroundColor:r===d?"#eff6ff":"white"},children:[e.jsx("td",{style:{padding:"0.75rem",border:"1px solid #d1d5db",fontWeight:r===d?"bold":"normal"},children:V(r)}),c.map(l=>{const p=W(r,l);return e.jsx("td",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",backgroundColor:p?"#d1fae5":"#fee2e2"},children:p?"✓":"✗"},`${r}-${l}`)}),e.jsx("td",{style:{padding:"0.75rem",textAlign:"center",border:"1px solid #d1d5db",backgroundColor:m(r)?"#d1fae5":"#fee2e2"},children:m(r)?"✓":"✗"})]},r))})]})}),e.jsxs("div",{style:{marginTop:"2rem",fontSize:"0.875rem",color:"#666"},children:[e.jsx("p",{children:e.jsx("strong",{children:"Permission Rules:"})}),e.jsxs("ul",{style:{marginLeft:"1rem"},children:[e.jsx("li",{children:"All roles can access dashboard"}),e.jsx("li",{children:"Settings restricted to owner and operator only"}),e.jsx("li",{children:"Viewers are read-only across all accessible routes"}),e.jsx("li",{children:"Publish permissions limited to owner, operator, and strategist"})]})]})]})}const E={title:"Foundation/RBAC Policies",component:F,parameters:{layout:"fullscreen"},argTypes:{role:{control:"select",options:["owner","operator","strategist","viewer","agent"],description:"Role to highlight access matrix for"}}},s={args:{role:"viewer"}},t={args:{role:"owner"},parameters:{role:"owner"}},o={args:{role:"operator"},parameters:{role:"operator"}},a={args:{role:"strategist"},parameters:{role:"strategist"}},n={args:{role:"viewer"},parameters:{role:"viewer"}},i={args:{role:"agent"}};var g,x,h;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    role: "viewer"
  }
}`,...(h=(x=s.parameters)==null?void 0:x.docs)==null?void 0:h.source}}};var u,b,w;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(w=(b=t.parameters)==null?void 0:b.docs)==null?void 0:w.source}}};var f,j,v;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(v=(j=o.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};var y,P,A;a.parameters={...a.parameters,docs:{...(y=a.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(A=(P=a.parameters)==null?void 0:P.docs)==null?void 0:A.source}}};var S,C,R;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(R=(C=n.parameters)==null?void 0:C.docs)==null?void 0:R.source}}};var O,k,B;i.parameters={...i.parameters,docs:{...(O=i.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    role: "agent"
  }
}`,...(B=(k=i.parameters)==null?void 0:k.docs)==null?void 0:B.source}}};const L=["FullMatrix","OwnerPerspective","OperatorPerspective","StrategistPerspective","ViewerPerspective","AgentPerspective"];export{i as AgentPerspective,s as FullMatrix,o as OperatorPerspective,t as OwnerPerspective,a as StrategistPerspective,n as ViewerPerspective,L as __namedExportsOrder,E as default};
