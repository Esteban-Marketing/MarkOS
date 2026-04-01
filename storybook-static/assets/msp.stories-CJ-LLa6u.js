import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function T({state:G,role:d}){const Q=()=>{switch(G){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading strategy data...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No strategy plans found. Create a new strategy to begin.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Marketing Strategy & Planning"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("p",null,"Active Strategy: Q2 2026 Growth Initiative"),e.createElement("p",null,"Goals: 45% MQL increase, 3.2% conversion lift"),(d==="owner"||d==="operator"||d==="strategist")&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Edit Strategy")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load strategy");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"Access denied to strategy planning");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},Q())}const q={title:"Routes/Marketing Strategy & Planning",component:T,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"strategist"},parameters:{role:"strategist"}},t={args:{state:"loading",role:"strategist"}},a={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},s={args:{state:"error"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},c={args:{state:"success",role:"operator"},parameters:{role:"operator"}},i={args:{state:"success",role:"strategist"},parameters:{role:"strategist"}};var m,l,p;r.parameters={...r.parameters,docs:{...(m=r.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(p=(l=r.parameters)==null?void 0:l.docs)==null?void 0:p.source}}};var g,u,y;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "strategist"
  }
}`,...(y=(u=t.parameters)==null?void 0:u.docs)==null?void 0:y.source}}};var E,S,v;a.parameters={...a.parameters,docs:{...(E=a.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(v=(S=a.parameters)==null?void 0:S.docs)==null?void 0:v.source}}};var w,f,b;s.parameters={...s.parameters,docs:{...(w=s.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(b=(f=s.parameters)==null?void 0:f.docs)==null?void 0:b.source}}};var h,A,z;n.parameters={...n.parameters,docs:{...(h=n.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(z=(A=n.parameters)==null?void 0:A.docs)==null?void 0:z.source}}};var F,L,M;o.parameters={...o.parameters,docs:{...(F=o.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(M=(L=o.parameters)==null?void 0:L.docs)==null?void 0:M.source}}};var P,R,k;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(k=(R=c.parameters)==null?void 0:R.docs)==null?void 0:k.source}}};var x,C,O;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(O=(C=i.parameters)==null?void 0:C.docs)==null?void 0:O.source}}};const I=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OperatorAccess","StrategistAccess"];export{a as Empty,s as Error,o as Forbidden,t as Loading,c as OperatorAccess,i as StrategistAccess,r as Success,n as Unauthorized,I as __namedExportsOrder,q as default};
