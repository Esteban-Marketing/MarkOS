import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function x({state:F,role:c}){const R=()=>{switch(F){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading segment data...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No segments created. Create a new segment to organize your audience.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Audience Segments"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("p",null,"Total Segments: 8"),e.createElement("p",null,"Active Contacts: 12,450"),(c==="owner"||c==="operator"||c==="strategist")&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Create Segment")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load segments");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"Access denied to segment management");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},R())}const U={title:"Routes/Segments",component:x,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"operator"},parameters:{role:"operator"}},t={args:{state:"loading"}},a={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},s={args:{state:"error"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var d,m,i;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(i=(m=r.parameters)==null?void 0:m.docs)==null?void 0:i.source}}};var l,p,u;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(u=(p=t.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,y,E;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(E=(y=a.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};var v,S,w;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(w=(S=s.parameters)==null?void 0:S.docs)==null?void 0:w.source}}};var f,b,h;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(h=(b=n.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};var z,C,A;o.parameters={...o.parameters,docs:{...(z=o.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(A=(C=o.parameters)==null?void 0:C.docs)==null?void 0:A.source}}};const _=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{a as Empty,s as Error,o as Forbidden,t as Loading,r as Success,n as Unauthorized,_ as __namedExportsOrder,U as default};
