import{j as e}from"./jsx-runtime-D_zvdyIk.js";function F({state:C,role:d}){const A=()=>{switch(C){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading segment data..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No segments created. Create a new segment to organize your audience."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Audience Segments"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("p",{children:"Total Segments: 8"}),e.jsx("p",{children:"Active Contacts: 12,450"}),(d==="owner"||d==="operator"||d==="strategist")&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Create Segment"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load segments"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Access denied to segment management"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:A()})}const R={title:"Routes/Segments",component:F,parameters:{layout:"fullscreen"}},r={args:{state:"success",role:"operator"},parameters:{role:"operator"}},s={args:{state:"loading"}},a={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},t={args:{state:"error"}},n={args:{state:"unauthorized"}},o={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}};var c,i,m;r.parameters={...r.parameters,docs:{...(c=r.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(m=(i=r.parameters)==null?void 0:i.docs)==null?void 0:m.source}}};var p,u,l;s.parameters={...s.parameters,docs:{...(p=s.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    state: "loading"
  }
}`,...(l=(u=s.parameters)==null?void 0:u.docs)==null?void 0:l.source}}};var g,h,x;a.parameters={...a.parameters,docs:{...(g=a.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(x=(h=a.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var y,j,v;t.parameters={...t.parameters,docs:{...(y=t.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    state: "error"
  }
}`,...(v=(j=t.parameters)==null?void 0:j.docs)==null?void 0:v.source}}};var S,w,f;n.parameters={...n.parameters,docs:{...(S=n.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(f=(w=n.parameters)==null?void 0:w.docs)==null?void 0:f.source}}};var b,z,E;o.parameters={...o.parameters,docs:{...(b=o.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(E=(z=o.parameters)==null?void 0:z.docs)==null?void 0:E.source}}};const T=["Success","Loading","Empty","Error","Unauthorized","Forbidden"];export{a as Empty,t as Error,o as Forbidden,s as Loading,r as Success,n as Unauthorized,T as __namedExportsOrder,R as default};
