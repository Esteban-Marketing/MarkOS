import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function x({state:F,role:c}){const L=()=>{switch(F){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading campaign data...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No campaigns created. Start your first campaign.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Campaigns"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("p",null,"Active Campaigns: 3"),e.createElement("p",null,"Q2 Growth Initiative • Spring Email Series • Product Launch 2026"),e.createElement("p",null,"Performance: 2.8% CTR, 18,500 impressions"),(c==="owner"||c==="operator"||c==="strategist")&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Create Campaign")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load campaigns");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"Access denied to campaign management");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},L())}const T={title:"Routes/Campaigns",component:x,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"operator"},parameters:{role:"operator"}},a={args:{state:"loading"}},t={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},s={args:{state:"error"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var i,m,d;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(d=(m=r.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var p,l,u;a.parameters={...a.parameters,docs:{...(p=a.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(u=(l=a.parameters)==null?void 0:l.docs)==null?void 0:u.source}}};var g,E,y;t.parameters={...t.parameters,docs:{...(g=t.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(y=(E=t.parameters)==null?void 0:E.docs)==null?void 0:y.source}}};var v,f,h;s.parameters={...s.parameters,docs:{...(v=s.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(h=(f=s.parameters)==null?void 0:f.docs)==null?void 0:h.source}}};var S,b,C;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(C=(b=n.parameters)==null?void 0:b.docs)==null?void 0:C.source}}};var w,z,R;o.parameters={...o.parameters,docs:{...(w=o.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(R=(z=o.parameters)==null?void 0:z.docs)==null?void 0:R.source}}};const U=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{t as Empty,s as Error,o as Forbidden,a as Loading,r as Success,n as Unauthorized,U as __namedExportsOrder,T as default};
