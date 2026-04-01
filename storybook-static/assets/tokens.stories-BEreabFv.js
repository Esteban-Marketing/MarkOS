import{R as e}from"./index-ZH-6pyQh.js";import{b as l}from"./tokens-BLc9fnXK.js";import"./_commonjsHelpers-CqkleIqs.js";function y({name:r,value:a,description:t}){const b=r.startsWith("color")&&a.startsWith("#");return e.createElement("div",{style:{marginBottom:"1rem",padding:"1rem",border:"1px solid #ddd",borderRadius:"4px"}},e.createElement("div",{style:{display:"flex",gap:"1rem",alignItems:"center"}},b&&e.createElement("div",{style:{width:"50px",height:"50px",backgroundColor:a,borderRadius:"4px",border:"2px solid #ccc"}}),e.createElement("div",null,e.createElement("strong",{style:{fontFamily:"monospace"}},r),e.createElement("p",{style:{margin:"0.25rem 0 0",fontSize:"0.875rem",color:"#666"}},t),e.createElement("p",{style:{margin:"0.25rem 0 0",fontSize:"0.75rem",color:"#999",fontFamily:"monospace"}},a))))}function T({theme:r="default"}){const a=r==="white-label"?l.map(t=>({...t,value:`${t.value} (overridden)`})):l;return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",null,"Design Tokens - ",r==="white-label"?"White-Label":"Default"," Theme"),e.createElement("div",{style:{marginTop:"2rem"}},a.map(t=>e.createElement(y,{key:t.name,name:t.name,value:t.value,description:t.description}))))}const k={title:"Foundation/Design Tokens",component:T,parameters:{layout:"fullscreen"},argTypes:{theme:{control:"select",options:["default","white-label"],description:"Theme variant for token visualization"}}},n={args:{theme:"default"},parameters:{theme:"default"}},s={args:{theme:"white-label"},parameters:{theme:"white-label"}},o={args:{theme:"default"}};var m,i,c;n.parameters={...n.parameters,docs:{...(m=n.parameters)==null?void 0:m.docs,source:{originalSource:`{
  args: {
    theme: "default"
  },
  parameters: {
    theme: "default"
  }
}`,...(c=(i=n.parameters)==null?void 0:i.docs)==null?void 0:c.source}}};var d,p,u;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    theme: "white-label"
  },
  parameters: {
    theme: "white-label"
  }
}`,...(u=(p=s.parameters)==null?void 0:p.docs)==null?void 0:u.source}}};var h,f,g;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    theme: "default"
  }
}`,...(g=(f=o.parameters)==null?void 0:f.docs)==null?void 0:g.source}}};const w=["DefaultTheme","WhiteLabelTheme","AllTokens"];export{o as AllTokens,n as DefaultTheme,s as WhiteLabelTheme,w as __namedExportsOrder,k as default};
