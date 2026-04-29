import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{L as o}from"./link-BcQdlx6X.js";import"./_commonjsHelpers-CqkleIqs.js";import"./_interop_require_default-BsMjM0Dc.js";import"./index-DMNe2g_Q.js";const g="_page_1h7i1_9",b="_cardWrap_1h7i1_17",y="_ctaRow_1h7i1_25",x="_link_1h7i1_32",a={page:g,cardWrap:b,ctaRow:y,link:x};function v({slug:u,reserved:h}){const r="markos.dev",s=(u||"").toLowerCase();return h==="1"?e.jsx("main",{className:a.page,children:e.jsxs("section",{className:`c-card c-card--feature ${a.cardWrap}`,"aria-labelledby":"heading",children:[e.jsx("span",{className:"t-label-caps",children:r}),e.jsx("h1",{id:"heading",children:"This address is reserved."}),e.jsxs("p",{children:["This subdomain is reserved for platform use. Available workspaces start at"," ",e.jsxs("a",{className:a.link,href:`https://${r}/signup`,children:[r,"/signup"]}),"."]}),e.jsx(o,{className:"c-button c-button--primary",href:"/signup",children:"Create a workspace"})]})}):e.jsx("main",{className:a.page,children:e.jsxs("section",{className:`c-card c-card--feature ${a.cardWrap}`,"aria-labelledby":"heading",children:[e.jsx("span",{className:"t-label-caps",children:r}),e.jsxs("h1",{id:"heading",children:[s?`${s}.${r}`:r," is available."]}),e.jsx("p",{children:"This workspace has not been claimed. Start yours."}),e.jsxs("div",{className:a.ctaRow,children:[e.jsx(o,{className:"c-button c-button--primary",href:s?`/signup?slug=${encodeURIComponent(s)}`:"/signup",children:"Claim this workspace"}),e.jsx(o,{className:"c-button c-button--tertiary",href:"/",children:"Back to dashboard"})]})]})})}const _={title:"404Workspace",component:v,parameters:{layout:"fullscreen"}},t={args:{slug:"acme",reserved:void 0},parameters:{docs:{description:{story:'Workspace `acme.{apex}` not yet claimed. .c-card--feature hero (32px radius per D-13). .c-button--primary "Claim this workspace" + .c-button--tertiary "Back to dashboard". NO [err] glyph on heading; NO red splash (D-13 + DESIGN.md "Don\'t shout").'}}}},c={args:{slug:"",reserved:"1"},parameters:{docs:{description:{story:'Reserved subdomain — platform use only. .c-card--feature hero. .c-button--primary "Create a workspace". No secondary CTA on reserved variant per UI-SPEC F Copywriting.'}}}};var i,n,d;t.parameters={...t.parameters,docs:{...(i=t.parameters)==null?void 0:i.docs,source:{originalSource:`{
  args: {
    slug: 'acme',
    reserved: undefined
  },
  parameters: {
    docs: {
      description: {
        story: 'Workspace \`acme.{apex}\` not yet claimed. ' + '.c-card--feature hero (32px radius per D-13). ' + '.c-button--primary "Claim this workspace" + .c-button--tertiary "Back to dashboard". ' + 'NO [err] glyph on heading; NO red splash (D-13 + DESIGN.md "Don\\'t shout").'
      }
    }
  }
}`,...(d=(n=t.parameters)==null?void 0:n.docs)==null?void 0:d.source}}};var p,l,m;c.parameters={...c.parameters,docs:{...(p=c.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    slug: '',
    reserved: '1'
  },
  parameters: {
    docs: {
      description: {
        story: 'Reserved subdomain — platform use only. ' + '.c-card--feature hero. .c-button--primary "Create a workspace". ' + 'No secondary CTA on reserved variant per UI-SPEC F Copywriting.'
      }
    }
  }
}`,...(m=(l=c.parameters)==null?void 0:l.docs)==null?void 0:m.source}}};const R=["Available","Reserved"];export{t as Available,c as Reserved,R as __namedExportsOrder,_ as default};
