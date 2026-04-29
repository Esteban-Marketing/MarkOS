import{j as e}from"./jsx-runtime-D_zvdyIk.js";function z({state:b,role:d}){const E=()=>{switch(b){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading ICP data..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No ICPs defined. Create your first ICP profile."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Ideal Customer Profiles"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("p",{children:"Active ICPs: 4"}),e.jsx("p",{children:"Enterprise (Fortune 1000) • Mid-Market (50-1000 employees) • SMB (10-50 employees) • Startup (1-10 employees)"}),(d==="owner"||d==="operator"||d==="strategist")&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Add ICP"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load ICPs"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Access denied to ICP definitions"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:E()})}const A={title:"Routes/Ideal Customer Profiles",component:z,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"owner"},parameters:{role:"owner"}},s={args:{state:"loading"}},a={args:{state:"empty",role:"strategist"},parameters:{role:"strategist"}},t={args:{state:"error"}},o={args:{state:"unauthorized"}},n={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var i,c,l;r.parameters={...r.parameters,docs:{...(i=r.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(l=(c=r.parameters)==null?void 0:c.docs)==null?void 0:l.source}}};var p,m,u;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(u=(m=s.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var g,h,y;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "strategist"
  },
  parameters: {
    role: "strategist"
  }
}`,...(y=(h=a.parameters)==null?void 0:h.docs)==null?void 0:y.source}}};var x,f,j;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(j=(f=t.parameters)==null?void 0:f.docs)==null?void 0:j.source}}};var v,C,w;o.parameters={...o.parameters,docs:{...(v=o.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(w=(C=o.parameters)==null?void 0:C.docs)==null?void 0:w.source}}};var P,I,S;n.parameters={...n.parameters,docs:{...(P=n.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(S=(I=n.parameters)==null?void 0:I.docs)==null?void 0:S.source}}};const L=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{a as Empty,t as Error,n as Forbidden,s as Loading,r as Success,o as Unauthorized,L as __namedExportsOrder,A as default};
