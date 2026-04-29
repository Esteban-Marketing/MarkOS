import{j as e}from"./jsx-runtime-EKYJJIwR.js";function T({state:O,role:d}){const U=()=>{switch(O){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading market intelligence data..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No market data available. Start by adding competitive sources."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Market Intelligence & Reporting"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("h2",{children:"Competitive Landscape"}),e.jsx("p",{children:"Market share: 23% ↑"}),(d==="owner"||d==="operator")&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Update Intelligence"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load market data"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"You don't have access to market intelligence"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:U()})}const _={title:"Routes/Market Intelligence & Reporting",component:T,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},s={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},a={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},t={args:{state:"error",role:"operator"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},c={args:{state:"success",role:"owner"},parameters:{role:"owner"}},i={args:{state:"success",role:"viewer"},parameters:{role:"viewer"}};var l,p,m;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(m=(p=r.parameters)==null?void 0:p.docs)==null?void 0:m.source}}};var u,g,w;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(w=(g=s.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var h,v,x;a.parameters={...a.parameters,docs:{...(h=a.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(x=(v=a.parameters)==null?void 0:v.docs)==null?void 0:x.source}}};var y,j,b;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "operator"
  }
}`,...(b=(j=t.parameters)==null?void 0:j.docs)==null?void 0:b.source}}};var S,f,k;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(k=(f=n.parameters)==null?void 0:f.docs)==null?void 0:k.source}}};var E,R,z;o.parameters={...o.parameters,docs:{...(E=o.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(z=(R=o.parameters)==null?void 0:R.docs)==null?void 0:z.source}}};var A,F,I;c.parameters={...c.parameters,docs:{...(A=c.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(I=(F=c.parameters)==null?void 0:F.docs)==null?void 0:I.source}}};var L,M,C;i.parameters={...i.parameters,docs:{...(L=i.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(C=(M=i.parameters)==null?void 0:M.docs)==null?void 0:C.source}}};const q=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OwnerAccess","ViewerAccess"];export{a as Empty,t as Error,o as Forbidden,s as Loading,c as OwnerAccess,r as Success,n as Unauthorized,i as ViewerAccess,q as __namedExportsOrder,_ as default};
