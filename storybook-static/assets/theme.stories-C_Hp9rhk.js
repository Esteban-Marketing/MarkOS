import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function L({state:k,role:A}){const F=()=>{switch(k){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading theme settings...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No custom theme configured. Using default theme.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Theme Settings"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("h2",null,"Current Theme"),e.createElement("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem"}},e.createElement("div",{style:{width:"50px",height:"50px",backgroundColor:"#0d9488",borderRadius:"4px",border:"2px solid #ccc"}}),e.createElement("div",{style:{width:"50px",height:"50px",backgroundColor:"#06b6d4",borderRadius:"4px",border:"2px solid #ccc"}}),e.createElement("div",{style:{width:"50px",height:"50px",backgroundColor:"#f5f7fa",borderRadius:"4px",border:"2px solid #ccc"}})),e.createElement("p",{style:{marginTop:"1rem"}},"Primary: #0d9488 • Secondary: #06b6d4 • Canvas: #f5f7fa"),A==="owner"&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Customize Theme")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load theme settings");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"Only workspace owners and operators can modify theme settings");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},F())}const V={title:"Routes/Settings - Theme",component:L,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},t={args:{state:"success",role:"operator"},parameters:{role:"operator"}},a={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},s={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},o={args:{state:"error",role:"owner"},parameters:{role:"owner"}},n={args:{state:"unauthorized"}},c={args:{state:"forbidden"}};var d,m,i;r.parameters={...r.parameters,docs:{...(d=r.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(i=(m=r.parameters)==null?void 0:m.docs)==null?void 0:i.source}}};var l,p,u;t.parameters={...t.parameters,docs:{...(l=t.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(u=(p=t.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var g,h,w;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(w=(h=a.parameters)==null?void 0:h.docs)==null?void 0:w.source}}};var y,E,b;s.parameters={...s.parameters,docs:{...(y=s.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(b=(E=s.parameters)==null?void 0:E.docs)==null?void 0:b.source}}};var f,x,v;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(v=(x=o.parameters)==null?void 0:x.docs)==null?void 0:v.source}}};var S,T,C;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(C=(T=n.parameters)==null?void 0:T.docs)==null?void 0:C.source}}};var R,z,O;c.parameters={...c.parameters,docs:{...(R=c.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    state: "forbidden"
  }
}`,...(O=(z=c.parameters)==null?void 0:z.docs)==null?void 0:O.source}}};const _=["OwnerAccess","OperatorAccess","Loading","Empty","Error","Unauthorized","ViewerForbidden"];export{s as Empty,o as Error,a as Loading,t as OperatorAccess,r as OwnerAccess,n as Unauthorized,c as ViewerForbidden,_ as __namedExportsOrder,V as default};
