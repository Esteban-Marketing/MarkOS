import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function V({state:U,role:d}){const T=()=>{switch(U){case"loading":return e.createElement("div",{style:{padding:"2rem"}},"Loading market intelligence data...");case"empty":return e.createElement("div",{style:{padding:"2rem"}},"No market data available. Start by adding competitive sources.");case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Market Intelligence & Reporting"),e.createElement("div",{style:{marginTop:"1rem"}},e.createElement("h2",null,"Competitive Landscape"),e.createElement("p",null,"Market share: 23% ↑"),(d==="owner"||d==="operator")&&e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Update Intelligence")));case"error":return e.createElement("div",{style:{padding:"2rem",color:"red"}},"Failed to load market data");case"unauthorized":return e.createElement("div",{style:{padding:"2rem"}},"Authentication required");case"forbidden":return e.createElement("div",{style:{padding:"2rem"}},"You don't have access to market intelligence");default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},T())}const N={title:"Routes/Market Intelligence & Reporting",component:V,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},a={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},t={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},s={args:{state:"error",role:"operator"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},c={args:{state:"success",role:"owner"},parameters:{role:"owner"}},i={args:{state:"success",role:"viewer"},parameters:{role:"viewer"}};var l,m,p;r.parameters={...r.parameters,docs:{...(l=r.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(p=(m=r.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var u,g,w;a.parameters={...a.parameters,docs:{...(u=a.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(w=(g=a.parameters)==null?void 0:g.docs)==null?void 0:w.source}}};var v,y,E;t.parameters={...t.parameters,docs:{...(v=t.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(E=(y=t.parameters)==null?void 0:y.docs)==null?void 0:E.source}}};var h,b,S;s.parameters={...s.parameters,docs:{...(h=s.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "operator"
  }
}`,...(S=(b=s.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};var f,k,R;n.parameters={...n.parameters,docs:{...(f=n.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(R=(k=n.parameters)==null?void 0:k.docs)==null?void 0:R.source}}};var z,A,F;o.parameters={...o.parameters,docs:{...(z=o.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(F=(A=o.parameters)==null?void 0:A.docs)==null?void 0:F.source}}};var I,L,M;c.parameters={...c.parameters,docs:{...(I=c.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(M=(L=c.parameters)==null?void 0:L.docs)==null?void 0:M.source}}};var x,C,O;i.parameters={...i.parameters,docs:{...(x=i.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(O=(C=i.parameters)==null?void 0:C.docs)==null?void 0:O.source}}};const P=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OwnerAccess","ViewerAccess"];export{t as Empty,s as Error,o as Forbidden,a as Loading,c as OwnerAccess,r as Success,n as Unauthorized,i as ViewerAccess,P as __namedExportsOrder,N as default};
