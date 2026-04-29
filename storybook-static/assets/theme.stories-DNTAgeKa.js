import{j as e}from"./jsx-runtime-D_zvdyIk.js";function F({state:R,role:k}){const A=()=>{switch(R){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading theme settings..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No custom theme configured. Using default theme."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Theme Settings"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("h2",{children:"Current Theme"}),e.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem"},children:[e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#0d9488",borderRadius:"4px",border:"2px solid #ccc"}}),e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#06b6d4",borderRadius:"4px",border:"2px solid #ccc"}}),e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#f5f7fa",borderRadius:"4px",border:"2px solid #ccc"}})]}),e.jsx("p",{style:{marginTop:"1rem"},children:"Primary: #0d9488 • Secondary: #06b6d4 • Canvas: #f5f7fa"}),k==="owner"&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Customize Theme"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load theme settings"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Only workspace owners and operators can modify theme settings"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:A()})}const U={title:"Routes/Settings - Theme",component:F,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},s={args:{state:"success",role:"operator"},parameters:{role:"operator"}},o={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},a={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},n={args:{state:"error",role:"owner"},parameters:{role:"owner"}},t={args:{state:"unauthorized"}},d={args:{state:"forbidden"}};var c,i,p;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(p=(i=r.parameters)==null?void 0:i.docs)==null?void 0:p.source}}};var m,l,u;s.parameters={...s.parameters,docs:{...(m=s.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(u=(l=s.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var g,h,x;o.parameters={...o.parameters,docs:{...(g=o.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(x=(h=o.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var w,y,b;a.parameters={...a.parameters,docs:{...(w=a.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(b=(y=a.parameters)==null?void 0:y.docs)==null?void 0:b.source}}};var f,j,v;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(v=(j=n.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};var S,T,C;t.parameters={...t.parameters,docs:{...(S=t.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(C=(T=t.parameters)==null?void 0:T.docs)==null?void 0:C.source}}};var z,E,O;d.parameters={...d.parameters,docs:{...(z=d.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    state: "forbidden"
  }
}`,...(O=(E=d.parameters)==null?void 0:E.docs)==null?void 0:O.source}}};const P=["OwnerAccess","OperatorAccess","Loading","Empty","Error","Unauthorized","ViewerForbidden"];export{a as Empty,n as Error,o as Loading,s as OperatorAccess,r as OwnerAccess,t as Unauthorized,d as ViewerForbidden,P as __namedExportsOrder,U as default};
