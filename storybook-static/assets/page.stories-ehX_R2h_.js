import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r as c}from"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const G="_signupPage_11fik_13",H="_authCard_11fik_21",Q="_form_11fik_28",X="_successPanel_11fik_35",Z="_signinLink_11fik_46",ee="_fieldWarning_11fik_53",t={signupPage:G,authCard:H,form:Q,successPanel:X,signinLink:Z,fieldWarning:ee},se="Rate-limited. Retry in an hour.",re="Verification failed. Retry or contact support.",te=6e4;function ae(){const[d,q]=c.useState(""),[s,a]=c.useState({status:"idle"}),[n,Y]=c.useState(null),[b,J]=c.useState(()=>Date.now());c.useEffect(()=>{if(n===null)return;const r=setInterval(()=>J(Date.now()),1e3);return()=>clearInterval(r)},[n]);async function K(){var r;try{if(typeof window<"u"&&((r=window.__botId)!=null&&r.getToken)){const i=await window.__botId.getToken();if(typeof i=="string"&&i.length>0)return i}}catch{}return"dev-no-botid"}async function _(r){if(r&&r.preventDefault(),!d)return;a({status:"submitting"});const i=await K(),o=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:d,botIdToken:i})});if(o.status===201){const z=await o.json().catch(()=>({}));a({status:"sent",email:d,buffer_expires_at:z.buffer_expires_at||""}),Y(Date.now()+te);return}if(o.status===403)return a({status:"bot_blocked"});if(o.status===429)return a({status:"rate_limited"});const k=await o.json().catch(()=>({}));a({status:"error",message:k.message||"Signup failed. Retry.",code:k.error})}const l=s.status==="submitting",v=n!==null&&b>=n,U=s.status==="error";return e.jsx("main",{className:t.signupPage,children:e.jsxs("section",{className:`c-card c-card--feature ${t.authCard}`,"aria-labelledby":"signup-heading",children:[e.jsx("p",{className:"t-label-caps",children:"markos.dev"}),e.jsx("h1",{id:"signup-heading",children:"Start your workspace"}),s.status==="sent"?e.jsxs("div",{className:t.successPanel,role:"status","aria-live":"polite",children:[e.jsx("strong",{children:"[ok] Check your inbox."}),e.jsxs("span",{children:["Magic link sent to ",e.jsx("em",{children:s.email}),"."]}),e.jsx("button",{type:"button",className:"c-button c-button--tertiary",onClick:()=>_(),disabled:!v||l,"aria-live":"polite",children:v?"Resend link":`Resend in ${Math.ceil(((n||0)-b)/1e3)}s`})]}):e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"t-lead",children:"One email. No credit card."}),e.jsxs("form",{className:t.form,onSubmit:_,noValidate:!0,children:[e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"signup-email",className:"c-field__label",children:"Work email"}),e.jsx("input",{id:"signup-email",name:"email",type:"email",required:!0,autoComplete:"email",value:d,onChange:r=>q(r.target.value),"aria-describedby":"signup-help","aria-invalid":U,className:"c-input"}),e.jsxs("p",{id:"signup-help",role:"status","aria-live":"polite",className:"c-field__help",children:[s.status==="bot_blocked"&&e.jsxs("span",{className:t.fieldWarning,children:["[warn] ",re]}),s.status==="rate_limited"&&e.jsxs("span",{className:t.fieldWarning,children:["[warn] ",se]}),s.status==="error"&&e.jsx("span",{className:"c-field__error",children:s.message}),s.status==="idle"&&"We send a magic link to verify your email."]})]}),e.jsx("button",{type:"submit",className:`c-button c-button--primary${l?" is-loading":""}`,disabled:l,"aria-busy":l,children:"Create workspace"})]}),e.jsxs("p",{className:"c-field__help",children:["Already have a workspace? ",e.jsx("a",{className:t.signinLink,href:"/login",children:"Sign in instead"}),"."]})]})]})})}const de={title:"Auth/SignupPage",component:ae,parameters:{layout:"fullscreen"}},u={},p={parameters:{docs:{description:{story:"Email field manually typed at story-render time; verifies `.c-input` primitive resting + filled visual states."}}}},m={parameters:{docs:{description:{story:"Primary CTA in `.is-loading` state — visual coverage of `.c-button.is-loading::after` primitive spinner. Drive via clicking submit on a pre-filled email at story-render time."}}}},f={parameters:{docs:{description:{story:"Success state after a 201 response. Renders `[ok] Check your inbox.` with success-tint border-inline-start. Internal state cannot be forced from args; story documents target visual."}}}},g={parameters:{docs:{description:{story:"`[warn] Verification failed. Retry or contact support.` rendered via local `.fieldWarning` class composing token recipe (var(--fs-body-sm), var(--color-warning), var(--font-mono))."}}}},y={parameters:{docs:{description:{story:"`[warn] Rate-limited. Retry in an hour.` rendered via local `.fieldWarning` class."}}}},h={parameters:{docs:{description:{story:'`.c-field__error` primitive auto-prepends `[err] ` via `::before`. Renders the server-supplied `body.message` (e.g., "Signup failed. Retry.").'}}}};var x,w,S;u.parameters={...u.parameters,docs:{...(x=u.parameters)==null?void 0:x.docs,source:{originalSource:"{}",...(S=(w=u.parameters)==null?void 0:w.docs)==null?void 0:S.source}}};var j,R,N;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Email field manually typed at story-render time; verifies \`.c-input\` primitive resting + filled visual states.'
      }
    }
  }
}`,...(N=(R=p.parameters)==null?void 0:R.docs)==null?void 0:N.source}}};var C,P,E;m.parameters={...m.parameters,docs:{...(C=m.parameters)==null?void 0:C.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Primary CTA in \`.is-loading\` state — visual coverage of \`.c-button.is-loading::after\` primitive spinner. Drive via clicking submit on a pre-filled email at story-render time.'
      }
    }
  }
}`,...(E=(P=m.parameters)==null?void 0:P.docs)==null?void 0:E.source}}};var W,D,L;f.parameters={...f.parameters,docs:{...(W=f.parameters)==null?void 0:W.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Success state after a 201 response. Renders \`[ok] Check your inbox.\` with success-tint border-inline-start. Internal state cannot be forced from args; story documents target visual.'
      }
    }
  }
}`,...(L=(D=f.parameters)==null?void 0:D.docs)==null?void 0:L.source}}};var O,T,I;g.parameters={...g.parameters,docs:{...(O=g.parameters)==null?void 0:O.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[warn] Verification failed. Retry or contact support.\` rendered via local \`.fieldWarning\` class composing token recipe (var(--fs-body-sm), var(--color-warning), var(--font-mono)).'
      }
    }
  }
}`,...(I=(T=g.parameters)==null?void 0:T.docs)==null?void 0:I.source}}};var A,B,F;y.parameters={...y.parameters,docs:{...(A=y.parameters)==null?void 0:A.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[warn] Rate-limited. Retry in an hour.\` rendered via local \`.fieldWarning\` class.'
      }
    }
  }
}`,...(F=(B=y.parameters)==null?void 0:B.docs)==null?void 0:F.source}}};var M,V,$;h.parameters={...h.parameters,docs:{...(M=h.parameters)==null?void 0:M.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`.c-field__error\` primitive auto-prepends \`[err] \` via \`::before\`. Renders the server-supplied \`body.message\` (e.g., "Signup failed. Retry.").'
      }
    }
  }
}`,...($=(V=h.parameters)==null?void 0:V.docs)==null?void 0:$.source}}};const le=["Default","Filled","Loading","Sent","BotBlocked","RateLimited","Error"];export{g as BotBlocked,u as Default,h as Error,p as Filled,m as Loading,y as RateLimited,f as Sent,le as __namedExportsOrder,de as default};
