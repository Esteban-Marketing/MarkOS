import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r as k}from"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const re="_page_aflkx_9",te="_contentCard_aflkx_31",se="_statusRegion_aflkx_45",ae="_errorMessage_aflkx_53",s={page:re,contentCard:te,statusRegion:se,errorMessage:ae};function oe({params:r}){const[h,g]=k.useState("idle"),[v,w]=k.useState(null);async function X(){g("accepting"),w(null);const f=await fetch("/api/tenant/invites/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:r.token})});if(f.ok){const ee=await f.json();g("success"),setTimeout(()=>{window.location.href=`/tenant/${ee.tenant_id||""}`},800);return}const Z=await f.json().catch(()=>({}));g("error"),w(ne(Z.error||"accept_failed"))}const t=h==="accepting",_=h==="success";let y="Accept invite";return t?y="Accepting…":_&&(y="[ok] Accepted. Redirecting…"),e.jsx("main",{className:s.page,children:e.jsxs("section",{className:`c-card c-card--feature ${s.contentCard}`,"aria-labelledby":"invite-heading",children:[e.jsx("h1",{id:"invite-heading",children:"You're invited to MarkOS"}),e.jsx("p",{className:"t-lead",children:"Accept the invite to join this workspace. Sign in with the email the invite was sent to."}),e.jsx("button",{type:"button",className:`c-button c-button--primary${t?" is-loading":""}`,onClick:X,disabled:t||_,"aria-busy":t?"true":"false",children:y}),e.jsx("div",{role:"status","aria-live":"polite",className:s.statusRegion,children:h==="error"&&v&&e.jsx("p",{className:`c-card ${s.errorMessage}`,children:v})})]})})}function ne(r){switch(r){case"invite_expired":return"[err] Invite expired. Ask the person who invited you to send a fresh one.";case"invite_email_mismatch":return"[err] Email mismatch. Sign in with the address this invite was sent to, then retry.";case"invite_withdrawn":return"[err] Invite withdrawn.";case"invite_already_accepted":return"[err] Invite already accepted.";case"invite_not_found":return"[err] Invite not found.";case"seat_quota_reached":return"[err] Seat limit reached. Ask the workspace owner to free a seat.";default:return"[err] Accept failed. Retry later."}}try{page.displayName="page",page.__docgenInfo={description:"",displayName:"page",props:{params:{defaultValue:null,description:"",name:"params",required:!0,type:{name:"{ token: string; }"}}}}}catch{}const me={title:"Auth/InviteAcceptPage",component:oe,parameters:{layout:"fullscreen"},args:{params:{token:"storybook-fixture-token"}}},a={},o={parameters:{docs:{description:{story:"`.c-button.is-loading` state — primitive provides spinner via `::after`. Component-internal `useState` cannot be forced from args; story documents target visual."}}}},n={parameters:{docs:{description:{story:"`[ok] Accepted. Redirecting…` CTA text after a 200 response. Redirect to `/tenant/{tenant_id}` fires via setTimeout — Storybook environment will not actually redirect, but the visual state is captured."}}}},i={parameters:{docs:{description:{story:'`.errorMessage` notice composes `.c-card` + 4px error-tinted border-inline-start + `rgb(248 81 73 / 0.12)` 12% alpha background. Renders one of the 7 reasonCopy strings (e.g. "[err] Invite expired. Ask the person who invited you to send a fresh one."). Drive via Storybook controls or interaction by simulating a 4xx fetch response.'}}}},c={parameters:{docs:{description:{story:"`[err] Email mismatch. Sign in with the address this invite was sent to, then retry.` — variant of the Error story for the invite_email_mismatch reason code."}}}},d={parameters:{docs:{description:{story:"`[err] Invite withdrawn.` — terse system-state phrasing."}}}},p={parameters:{docs:{description:{story:"`[err] Invite already accepted.`"}}}},m={parameters:{docs:{description:{story:"`[err] Invite not found.`"}}}},l={parameters:{docs:{description:{story:"`[err] Seat limit reached. Ask the workspace owner to free a seat.`"}}}},u={parameters:{docs:{description:{story:"`[err] Accept failed. Retry later.` — default fallback when reason code is unknown."}}}};var b,S,x;a.parameters={...a.parameters,docs:{...(b=a.parameters)==null?void 0:b.docs,source:{originalSource:"{}",...(x=(S=a.parameters)==null?void 0:S.docs)==null?void 0:x.source}}};var A,E,I;o.parameters={...o.parameters,docs:{...(A=o.parameters)==null?void 0:A.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`.c-button.is-loading\` state — primitive provides spinner via \`::after\`. Component-internal \`useState\` cannot be forced from args; story documents target visual.'
      }
    }
  }
}`,...(I=(E=o.parameters)==null?void 0:E.docs)==null?void 0:I.source}}};var R,j,C;n.parameters={...n.parameters,docs:{...(R=n.parameters)==null?void 0:R.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[ok] Accepted. Redirecting…\` CTA text after a 200 response. Redirect to \`/tenant/{tenant_id}\` fires via setTimeout — Storybook environment will not actually redirect, but the visual state is captured.'
      }
    }
  }
}`,...(C=(j=n.parameters)==null?void 0:j.docs)==null?void 0:C.source}}};var M,N,T;i.parameters={...i.parameters,docs:{...(M=i.parameters)==null?void 0:M.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`.errorMessage\` notice composes \`.c-card\` + 4px error-tinted border-inline-start + \`rgb(248 81 73 / 0.12)\` 12% alpha background. Renders one of the 7 reasonCopy strings (e.g. "[err] Invite expired. Ask the person who invited you to send a fresh one."). Drive via Storybook controls or interaction by simulating a 4xx fetch response.'
      }
    }
  }
}`,...(T=(N=i.parameters)==null?void 0:N.docs)==null?void 0:T.source}}};var $,D,F;c.parameters={...c.parameters,docs:{...($=c.parameters)==null?void 0:$.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Email mismatch. Sign in with the address this invite was sent to, then retry.\` — variant of the Error story for the invite_email_mismatch reason code.'
      }
    }
  }
}`,...(F=(D=c.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var O,P,q;d.parameters={...d.parameters,docs:{...(O=d.parameters)==null?void 0:O.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Invite withdrawn.\` — terse system-state phrasing.'
      }
    }
  }
}`,...(q=(P=d.parameters)==null?void 0:P.docs)==null?void 0:q.source}}};var Q,W,J;p.parameters={...p.parameters,docs:{...(Q=p.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Invite already accepted.\`'
      }
    }
  }
}`,...(J=(W=p.parameters)==null?void 0:W.docs)==null?void 0:J.source}}};var L,V,Y;m.parameters={...m.parameters,docs:{...(L=m.parameters)==null?void 0:L.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Invite not found.\`'
      }
    }
  }
}`,...(Y=(V=m.parameters)==null?void 0:V.docs)==null?void 0:Y.source}}};var z,B,G;l.parameters={...l.parameters,docs:{...(z=l.parameters)==null?void 0:z.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Seat limit reached. Ask the workspace owner to free a seat.\`'
      }
    }
  }
}`,...(G=(B=l.parameters)==null?void 0:B.docs)==null?void 0:G.source}}};var H,K,U;u.parameters={...u.parameters,docs:{...(H=u.parameters)==null?void 0:H.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '\`[err] Accept failed. Retry later.\` — default fallback when reason code is unknown.'
      }
    }
  }
}`,...(U=(K=u.parameters)==null?void 0:K.docs)==null?void 0:U.source}}};const le=["Default","Accepting","Success","Error","ErrorEmailMismatch","ErrorWithdrawn","ErrorAlreadyAccepted","ErrorNotFound","ErrorSeatQuota","ErrorAcceptFailed"];export{o as Accepting,a as Default,i as Error,u as ErrorAcceptFailed,p as ErrorAlreadyAccepted,c as ErrorEmailMismatch,m as ErrorNotFound,l as ErrorSeatQuota,d as ErrorWithdrawn,n as Success,le as __namedExportsOrder,me as default};
