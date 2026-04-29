import{j as e}from"./jsx-runtime-EKYJJIwR.js";function Q({state:R,role:d}){const G=()=>{switch(R){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading strategy data..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No strategy plans found. Create a new strategy to begin."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Marketing Strategy & Planning"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("p",{children:"Active Strategy: Q2 2026 Growth Initiative"}),e.jsx("p",{children:"Goals: 45% MQL increase, 3.2% conversion lift"}),(d==="owner"||d==="operator"||d==="strategist")&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Edit Strategy"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load strategy"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Access denied to strategy planning"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:G()})}const U={title:"Routes/Marketing Strategy & Planning",component:Q,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"strategist"},parameters:{role:"strategist"}},s={args:{state:"loading",role:"strategist"}},t={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},a={args:{state:"error"}},o={args:{state:"unauthorized"}},n={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},c={args:{state:"success",role:"operator"},parameters:{role:"operator"}},i={args:{state:"success",role:"strategist"},parameters:{role:"strategist"}};var p,l,g;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(g=(l=r.parameters)==null?void 0:l.docs)==null?void 0:g.source}}};var m,u,y;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "strategist"
  }
}`,...(y=(u=s.parameters)==null?void 0:u.docs)==null?void 0:y.source}}};var h,x,S;t.parameters={...t.parameters,docs:{...(h=t.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(S=(x=t.parameters)==null?void 0:x.docs)==null?void 0:S.source}}};var v,j,w;a.parameters={...a.parameters,docs:{...(v=a.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(w=(j=a.parameters)==null?void 0:j.docs)==null?void 0:w.source}}};var f,b,A;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(A=(b=o.parameters)==null?void 0:b.docs)==null?void 0:A.source}}};var E,z,F;n.parameters={...n.parameters,docs:{...(E=n.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(F=(z=n.parameters)==null?void 0:z.docs)==null?void 0:F.source}}};var L,M,P;c.parameters={...c.parameters,docs:{...(L=c.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(P=(M=c.parameters)==null?void 0:M.docs)==null?void 0:P.source}}};var k,C,O;i.parameters={...i.parameters,docs:{...(k=i.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(O=(C=i.parameters)==null?void 0:C.docs)==null?void 0:O.source}}};const _=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OperatorAccess","StrategistAccess"];export{t as Empty,a as Error,n as Forbidden,s as Loading,c as OperatorAccess,i as StrategistAccess,r as Success,o as Unauthorized,_ as __namedExportsOrder,U as default};
