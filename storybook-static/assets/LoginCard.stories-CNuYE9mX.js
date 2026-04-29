import{j as e}from"./jsx-runtime-EKYJJIwR.js";const N="_authCard_ggzpi_15",x="_logo_ggzpi_22",k="_form_ggzpi_28",b="_poweredBy_ggzpi_34",a={authCard:N,logo:x,form:k,poweredBy:b};function i({useTenantChrome:r,displayName:l,logo:d}){return e.jsxs("section",{className:`c-card c-card--feature ${a.authCard}`,"aria-labelledby":"login-heading",children:[r&&d&&e.jsx("img",{src:d,alt:`${l} logo`,className:a.logo}),e.jsx("h1",{id:"login-heading",children:r?`Sign in to ${l}`:"Sign in"}),e.jsxs("form",{className:a.form,method:"POST",action:"/api/auth/signup",children:[e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"email",className:"c-field__label",children:"Email"}),e.jsx("input",{id:"email",name:"email",type:"email",required:!0,className:"c-input"}),e.jsx("p",{className:"c-field__help",children:"We send a magic link instead of asking for a password."})]}),e.jsx("button",{type:"submit",className:"c-button c-button--primary",children:"Send magic link"})]}),r&&e.jsx("a",{href:"https://markos.dev",className:a.poweredBy,"aria-label":"Powered by MarkOS — open markos.dev",children:"Powered by MarkOS"})]})}try{i.displayName="LoginCard",i.__docgenInfo={description:"",displayName:"LoginCard",props:{useTenantChrome:{defaultValue:null,description:"",name:"useTenantChrome",required:!0,type:{name:"boolean"}},displayName:{defaultValue:null,description:"",name:"displayName",required:!0,type:{name:"string"}},logo:{defaultValue:null,description:"",name:"logo",required:!0,type:{name:"string"}}}}}catch{}const j={title:"Auth/LoginCard",component:i,parameters:{layout:"padded"}},o={args:{useTenantChrome:!1,displayName:"MarkOS",logo:null}},s={args:{useTenantChrome:!1,displayName:"MarkOS",logo:null},parameters:{docs:{description:{story:"Email field pre-filled state via Storybook controls."}}}},n={args:{useTenantChrome:!0,displayName:"Acme Corp",logo:"https://placehold.co/240x64/0A0E14/00D9A3?text=ACME"}},t={args:{useTenantChrome:!1,displayName:"MarkOS",logo:null},parameters:{docs:{description:{story:'Form with `aria-invalid="true"` on the email input — drives `.c-input` primitive error styling. Toggle aria-invalid via DevTools or use Storybook controls to verify the [err] glyph rendering on the c-field__error primitive.'}}}};var c,m,p;o.parameters={...o.parameters,docs:{...(c=o.parameters)==null?void 0:c.docs,source:{originalSource:`{
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null
  }
}`,...(p=(m=o.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var u,g,h;s.parameters={...s.parameters,docs:{...(u=s.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null
  },
  parameters: {
    docs: {
      description: {
        story: 'Email field pre-filled state via Storybook controls.'
      }
    }
  }
}`,...(h=(g=s.parameters)==null?void 0:g.docs)==null?void 0:h.source}}};var y,f,_;n.parameters={...n.parameters,docs:{...(y=n.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    useTenantChrome: true,
    displayName: 'Acme Corp',
    logo: 'https://placehold.co/240x64/0A0E14/00D9A3?text=ACME'
  }
}`,...(_=(f=n.parameters)==null?void 0:f.docs)==null?void 0:_.source}}};var S,v,C;t.parameters={...t.parameters,docs:{...(S=t.parameters)==null?void 0:S.docs,source:{originalSource:`{
  args: {
    useTenantChrome: false,
    displayName: 'MarkOS',
    logo: null
  },
  parameters: {
    docs: {
      description: {
        story: 'Form with \`aria-invalid="true"\` on the email input — drives \`.c-input\` primitive error styling. Toggle aria-invalid via DevTools or use Storybook controls to verify the [err] glyph rendering on the c-field__error primitive.'
      }
    }
  }
}`,...(C=(v=t.parameters)==null?void 0:v.docs)==null?void 0:C.source}}};const E=["Default","Filled","Branded","ErrorState"];export{n as Branded,o as Default,t as ErrorState,s as Filled,E as __namedExportsOrder,j as default};
