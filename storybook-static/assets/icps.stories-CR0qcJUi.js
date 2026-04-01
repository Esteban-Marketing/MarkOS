import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function A({state:z,role:c}){const F=()=>{switch(z){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading ICP data...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No ICPs defined. Create your first ICP profile.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Ideal Customer Profiles"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("p",null,"Active ICPs: 4"),e.createElement("p",null,"Enterprise (Fortune 1000) • Mid-Market (50-1000 employees) • SMB (10-50 employees) • Startup (1-10 employees)"),(c==="owner"||c==="operator"||c==="strategist")&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Add ICP")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load ICPs");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"Access denied to ICP definitions");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},F())}const L={title:"Routes/Ideal Customer Profiles",component:A,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},t={args:{state:"loading"}},a={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},s={args:{state:"error"}},o={args:{state:"unauthorized"}},n={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var d,i,m;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(m=(i=r.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};var l,p,u;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(u=(p=t.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,y,E;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(E=(y=a.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};var f,v,C;s.parameters={...s.parameters,docs:{...(f=s.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(C=(v=s.parameters)==null?void 0:v.docs)==null?void 0:C.source}}};var w,P,I;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(I=(P=o.parameters)==null?void 0:P.docs)==null?void 0:I.source}}};var S,b,h;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(h=(b=n.parameters)==null?void 0:b.docs)==null?void 0:h.source}}};const M=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{a as Empty,s as Error,n as Forbidden,t as Loading,r as Success,o as Unauthorized,M as __namedExportsOrder,L as default};
