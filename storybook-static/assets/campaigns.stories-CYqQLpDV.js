import{j as e}from"./jsx-runtime-D_zvdyIk.js";function L({state:z,role:i}){const F=()=>{switch(z){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading campaign data..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No campaigns created. Start your first campaign."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Campaigns"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("p",{children:"Active Campaigns: 3"}),e.jsx("p",{children:"Q2 Growth Initiative • Spring Email Series • Product Launch 2026"}),e.jsx("p",{children:"Performance: 2.8% CTR, 18,500 impressions"}),(i==="owner"||i==="operator"||i==="strategist")&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Create Campaign"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load campaigns"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Access denied to campaign management"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:F()})}const A={title:"Routes/Campaigns",component:L,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"operator"},parameters:{role:"operator"}},a={args:{state:"loading"}},s={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},t={args:{state:"error"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var c,d,p;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(p=(d=r.parameters)==null?void 0:d.docs)==null?void 0:p.source}}};var m,l,u;a.parameters={...a.parameters,docs:{...(m=a.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(u=(l=a.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var g,h,x;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(x=(h=s.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var y,j,v;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(v=(j=t.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};var f,S,b;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(b=(S=n.parameters)==null?void 0:S.docs)==null?void 0:b.source}}};var C,w,E;o.parameters={...o.parameters,docs:{...(C=o.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(E=(w=o.parameters)==null?void 0:w.docs)==null?void 0:E.source}}};const P=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{s as Empty,t as Error,o as Forbidden,a as Loading,r as Success,n as Unauthorized,P as __namedExportsOrder,A as default};
