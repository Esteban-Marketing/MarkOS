import{j as e}from"./jsx-runtime-EKYJJIwR.js";import"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const Q="_page_rwkmm_7",W="_contentCard_rwkmm_15",X="_addForm_rwkmm_19",ee="_toggleRow_rwkmm_25",ne="_statusCell_rwkmm_33",ae="_cnameLabel_rwkmm_39",re="_actionRow_rwkmm_44",te="_emptyState_rwkmm_51",n={page:Q,contentCard:W,addForm:X,toggleRow:ee,statusCell:ne,cnameLabel:ae,actionRow:re,emptyState:te};function h({domains:a,loading:s,addInput:H,toast:y,branding:t,brandBusy:f,dnsState:r,rotationDeadline:v,onAddInputChange:Y,onAddDomain:Z,onRemoveDomain:z,onSaveBranding:J,onBrandingChange:g}){const K=v?`/settings/domain/resolve?deadline=${encodeURIComponent(v)}`:"/settings/domain/resolve";return e.jsxs("main",{className:n.page,children:[e.jsxs("section",{className:`c-card ${n.contentCard}`,"aria-labelledby":"domain-heading",children:[e.jsx("h1",{id:"domain-heading",children:"Custom domain"}),e.jsx("p",{className:"t-lead",children:"Serve your workspace from your own domain. Requires a CNAME record. 1 domain per org."}),s&&e.jsx("p",{className:n.emptyState,children:"Loading…"}),!s&&r==="verified"&&e.jsxs("div",{className:"c-notice c-notice--success",role:"status",children:[e.jsx("strong",{children:"[ok]"})," ","Domain verified. Your custom domain is active."]}),!s&&r==="pending"&&e.jsxs("div",{className:"c-notice c-notice--info",role:"status",children:[e.jsx("strong",{children:"[info]"})," ","DNS verification pending. This may take up to 48 hours."]}),!s&&r==="rotating"&&e.jsxs("div",{className:"c-notice c-notice--warning",role:"status",children:[e.jsx("strong",{children:"[warn]"})," ","Domain rotation in progress. Both the old and new domains are active during the grace period."," ",e.jsx("a",{href:K,className:"c-button c-button--tertiary",children:"Resolve now"})]}),!s&&r==="failed"&&e.jsxs("div",{className:"c-notice c-notice--error",role:"status",children:[e.jsx("strong",{children:"[err]"})," ","Verification failed. Check your DNS records and retry."]}),!s&&a.length===0&&e.jsxs("form",{className:n.addForm,onSubmit:Z,noValidate:!0,children:[e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"domain-input",className:"c-field__label",children:"Subdomain"}),e.jsx("input",{id:"domain-input",name:"subdomain",type:"text",placeholder:"app.yourdomain.com",className:"c-input",value:H,onChange:o=>Y(o.target.value),required:!0}),e.jsx("p",{className:"c-field__help",children:"Enter your custom subdomain (e.g. acme.markos.run)."})]}),e.jsx("button",{type:"submit",className:"c-button c-button--primary",children:"Add domain"})]}),!s&&a.length>0&&e.jsxs("div",{className:`c-card ${n.contentCard}`,children:[e.jsxs("p",{children:[e.jsx("strong",{children:a[0].domain})," — ",e.jsxs("span",{className:n.statusCell,children:[r==="verified"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"c-status-dot c-status-dot--live","aria-hidden":"true"}),e.jsx("span",{children:"[ok] Verified"})]}),r==="pending"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"c-status-dot","aria-hidden":"true"}),e.jsx("span",{children:"[warn] Pending"})]}),r==="failed"&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"c-status-dot c-status-dot--error","aria-hidden":"true"}),e.jsx("span",{children:"[err] Failed"})]}),(r==="rotating"||r==="idle")&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"c-status-dot","aria-hidden":"true"}),e.jsx("span",{children:"[warn] Pending"})]})]})]}),e.jsx("div",{className:n.cnameLabel,children:e.jsx("span",{className:"t-label-caps",children:"CNAME record"})}),e.jsx("div",{className:"c-terminal",children:e.jsx("pre",{className:"c-code-block",children:e.jsx("code",{children:`Type:   CNAME
Host:   ${a[0].domain}
Value:  cname.markos.run`})})}),e.jsx("p",{className:"c-field__help",children:"DNS propagation can take up to 48 hours."}),e.jsx("div",{className:n.actionRow,children:e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>z(a[0].domain),children:"Remove domain"})})]})]}),t&&e.jsxs("section",{className:`c-card ${n.contentCard}`,"aria-labelledby":"brand-heading",children:[e.jsx("h2",{id:"brand-heading",children:"Brand chrome"}),e.jsx("p",{className:"t-lead",children:"Override logo, colour, and display name on your custom domain."}),e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"display-name-input",className:"c-field__label",children:"Display name"}),e.jsx("input",{id:"display-name-input",type:"text",className:"c-input",value:t.display_name||"",onChange:o=>g({...t,display_name:o.target.value})})]}),e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"primary-color-input",className:"c-field__label",children:"Primary color"}),e.jsx("input",{id:"primary-color-input",type:"color",value:t.primary_color,onChange:o=>g({...t,primary_color:o.target.value})})]}),e.jsxs("label",{className:n.toggleRow,children:[e.jsx("input",{type:"checkbox",checked:t.vanity_login_enabled,onChange:o=>g({...t,vanity_login_enabled:o.target.checked})}),e.jsx("span",{children:"Show tenant-branded login on custom domain"})]}),e.jsx("button",{type:"button",className:"c-button c-button--primary",onClick:()=>J(t),disabled:f,children:f?"Saving…":"Save brand settings"})]}),y&&e.jsx("div",{className:"c-toast",role:"status","aria-live":"polite",children:y})]})}try{h.displayName="DomainPageView",h.__docgenInfo={description:"",displayName:"DomainPageView",props:{domains:{defaultValue:null,description:"",name:"domains",required:!0,type:{name:"DomainRow[]"}},loading:{defaultValue:null,description:"",name:"loading",required:!0,type:{name:"boolean"}},addInput:{defaultValue:null,description:"",name:"addInput",required:!0,type:{name:"string"}},toast:{defaultValue:null,description:"",name:"toast",required:!0,type:{name:"string"}},branding:{defaultValue:null,description:"",name:"branding",required:!0,type:{name:"Branding"}},brandBusy:{defaultValue:null,description:"",name:"brandBusy",required:!0,type:{name:"boolean"}},dnsState:{defaultValue:null,description:"",name:"dnsState",required:!0,type:{name:"DnsState"}},rotationDeadline:{defaultValue:null,description:"",name:"rotationDeadline",required:!1,type:{name:"string"}},onAddInputChange:{defaultValue:null,description:"",name:"onAddInputChange",required:!0,type:{name:"(val: string) => void"}},onAddDomain:{defaultValue:null,description:"",name:"onAddDomain",required:!0,type:{name:"(e: FormEvent<Element>) => void"}},onRemoveDomain:{defaultValue:null,description:"",name:"onRemoveDomain",required:!0,type:{name:"(domain: string) => void"}},onSaveBranding:{defaultValue:null,description:"",name:"onSaveBranding",required:!0,type:{name:"(patch: Partial<Branding>) => void"}},onBrandingChange:{defaultValue:null,description:"",name:"onBrandingChange",required:!0,type:{name:"(b: Branding) => void"}}}}}catch{}const le={title:"Settings/Domain",component:h,parameters:{layout:"fullscreen"}},p=[{domain:"acme.markos.run",status:"verified",verified_at:"2026-04-01T00:00:00Z",vanity_login_enabled:!1}],x=()=>{},se=async a=>{},u={domains:[],loading:!1,addInput:"",toast:null,branding:null,brandBusy:!1,rotationDeadline:null,onAddInputChange:a=>{},onAddDomain:se,onRemoveDomain:a=>{},onSaveBranding:x,onBrandingChange:x},i={args:{...u,dnsState:"idle"}},d={args:{...u,domains:p,dnsState:"pending"},parameters:{docs:{description:{story:"Renders `.c-notice c-notice--info` + `.c-status-dot` (default) + `[info] DNS verification pending` per UI-SPEC AC D-3."}}}},c={args:{...u,domains:p,dnsState:"verified"},parameters:{docs:{description:{story:"Renders `.c-notice c-notice--success` + `.c-status-dot--live` + `[ok] Verified` per UI-SPEC AC D-3."}}}},l={args:{...u,domains:p,dnsState:"rotating",rotationDeadline:"2026-05-15"},parameters:{docs:{description:{story:'Renders `.c-notice c-notice--warning` + `.c-button c-button--tertiary` "Resolve now" per UI-SPEC AC D-4.'}}}},m={args:{...u,domains:p,dnsState:"failed"},parameters:{docs:{description:{story:"Renders `.c-notice c-notice--error` + `.c-status-dot--error` + `[err] Failed` per UI-SPEC AC D-3."}}}};var b,j,_,N,C;i.parameters={...i.parameters,docs:{...(b=i.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    dnsState: 'idle'
  }
}`,...(_=(j=i.parameters)==null?void 0:j.docs)==null?void 0:_.source},description:{story:"Default: no domain added yet — shows add-domain form (c-field + c-input + c-button--primary)",...(C=(N=i.parameters)==null?void 0:N.docs)==null?void 0:C.description}}};var D,S,w,R,A;d.parameters={...d.parameters,docs:{...(D=d.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'pending'
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders \`.c-notice c-notice--info\` + \`.c-status-dot\` (default) + \`[info] DNS verification pending\` per UI-SPEC AC D-3.'
      }
    }
  }
}`,...(w=(S=d.parameters)==null?void 0:S.docs)==null?void 0:w.source},description:{story:"Pending: domain added, DNS verification in progress — c-notice c-notice--info + c-status-dot (default) + [info] + [warn] glyphs (AC D-3)",...(A=(R=d.parameters)==null?void 0:R.docs)==null?void 0:A.description}}};var k,V,F,P,E;c.parameters={...c.parameters,docs:{...(k=c.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'verified'
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders \`.c-notice c-notice--success\` + \`.c-status-dot--live\` + \`[ok] Verified\` per UI-SPEC AC D-3.'
      }
    }
  }
}`,...(F=(V=c.parameters)==null?void 0:V.docs)==null?void 0:F.source},description:{story:"Verified: DNS confirmed — c-notice c-notice--success + c-status-dot--live + [ok] glyphs (AC D-3)",...(E=(P=c.parameters)==null?void 0:P.docs)==null?void 0:E.description}}};var I,q,B,U,L;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'rotating',
    rotationDeadline: '2026-05-15'
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders \`.c-notice c-notice--warning\` + \`.c-button c-button--tertiary\` "Resolve now" per UI-SPEC AC D-4.'
      }
    }
  }
}`,...(B=(q=l.parameters)==null?void 0:q.docs)==null?void 0:B.source},description:{story:"RotationGrace: both old and new domains active — c-notice c-notice--warning + c-button--tertiary Resolve now (AC D-4)",...(L=(U=l.parameters)==null?void 0:U.docs)==null?void 0:L.description}}};var $,M,G,T,O;m.parameters={...m.parameters,docs:{...($=m.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    domains: baseDomain,
    dnsState: 'failed'
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders \`.c-notice c-notice--error\` + \`.c-status-dot--error\` + \`[err] Failed\` per UI-SPEC AC D-3.'
      }
    }
  }
}`,...(G=(M=m.parameters)==null?void 0:M.docs)==null?void 0:G.source},description:{story:"Failed: CNAME not found — c-notice c-notice--error + c-status-dot--error + [err] glyphs (AC D-3)",...(O=(T=m.parameters)==null?void 0:T.docs)==null?void 0:O.description}}};const me=["Default","Pending","Verified","RotationGrace","Failed"];export{i as Default,m as Failed,d as Pending,l as RotationGrace,c as Verified,me as __namedExportsOrder,le as default};
