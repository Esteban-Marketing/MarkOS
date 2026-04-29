import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{b as l}from"./tokens-BLc9fnXK.js";function b({name:a,value:s,description:r}){const x=a.startsWith("color")&&s.startsWith("#");return e.jsx("div",{style:{marginBottom:"1rem",padding:"1rem",border:"1px solid #ddd",borderRadius:"4px"},children:e.jsxs("div",{style:{display:"flex",gap:"1rem",alignItems:"center"},children:[x&&e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:s,borderRadius:"4px",border:"2px solid #ccc"}}),e.jsxs("div",{children:[e.jsx("strong",{style:{fontFamily:"monospace"},children:a}),e.jsx("p",{style:{margin:"0.25rem 0 0",fontSize:"0.875rem",color:"#666"},children:r}),e.jsx("p",{style:{margin:"0.25rem 0 0",fontSize:"0.75rem",color:"#999",fontFamily:"monospace"},children:s})]})]})})}function T({theme:a="default"}){const s=a==="white-label"?l.map(r=>({...r,value:`${r.value} (overridden)`})):l;return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsxs("h1",{children:["Design Tokens - ",a==="white-label"?"White-Label":"Default"," Theme"]}),e.jsx("div",{style:{marginTop:"2rem"},children:s.map(r=>e.jsx(b,{name:r.name,value:r.value,description:r.description},r.name))})]})}const v={title:"Foundation/Design Tokens",component:T,parameters:{layout:"fullscreen"},argTypes:{theme:{control:"select",options:["default","white-label"],description:"Theme variant for token visualization"}}},t={args:{theme:"default"},parameters:{theme:"default"}},o={args:{theme:"white-label"},parameters:{theme:"white-label"}},n={args:{theme:"default"}};var i,m,d;t.parameters={...t.parameters,docs:{...(i=t.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    theme: "default"
  },
  parameters: {
    theme: "default"
  }
}`,...(d=(m=t.parameters)==null?void 0:m.docs)==null?void 0:d.source}}};var c,p,h;o.parameters={...o.parameters,docs:{...(c=o.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    theme: "white-label"
  },
  parameters: {
    theme: "white-label"
  }
}`,...(h=(p=o.parameters)==null?void 0:p.docs)==null?void 0:h.source}}};var u,f,g;n.parameters={...n.parameters,docs:{...(u=n.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    theme: "default"
  }
}`,...(g=(f=n.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};const w=["DefaultTheme","WhiteLabelTheme","AllTokens"];export{n as AllTokens,t as DefaultTheme,o as WhiteLabelTheme,w as __namedExportsOrder,v as default};
