import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r as y}from"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const b="_page_ahs1n_8",w="_shell_ahs1n_14",R="_headerRow_ahs1n_21",z="_contentGrid_ahs1n_29",C="_mainColumn_ahs1n_41",k="_sideColumn_ahs1n_42",I="_featureList_ahs1n_47",v="_metaList_ahs1n_48",S="_featureItem_ahs1n_56",L="_metaItem_ahs1n_57",s={page:b,shell:w,headerRow:R,contentGrid:z,mainColumn:C,sideColumn:k,featureList:I,metaList:v,featureItem:S,metaItem:L};function D({authOverride:a}){const i=y.useMemo(()=>({iamRole:(a==null?void 0:a.iamRole)??"readonly",isAuthorized:(a==null?void 0:a.isAuthorized)??!1,canAccess:a==null?void 0:a.canAccess}),[a==null?void 0:a.iamRole,a==null?void 0:a.isAuthorized,a==null?void 0:a.canAccess]),r=i.iamRole,l=i.isAuthorized;return i.canAccess??(l&&r&&["owner","tenant-admin","manager"].includes(r))?e.jsx("div",{className:s.page,children:e.jsxs("div",{className:s.shell,children:[e.jsxs("section",{className:"c-card",children:[e.jsx("span",{className:"t-label-caps",children:"Operator execution surface"}),e.jsxs("div",{className:s.headerRow,children:[e.jsx("h2",{children:"Operations"}),l?e.jsxs("span",{className:"c-badge c-badge--success",children:[e.jsx("span",{className:"c-status-dot c-status-dot--live","aria-hidden":"true"}),"[ok] Authorized"]}):e.jsxs("span",{className:"c-badge c-badge--error",children:[e.jsx("span",{className:"c-status-dot c-status-dot--error","aria-hidden":"true"}),"[err] Blocked"]})]}),e.jsx("p",{className:"t-lead",children:"Run operator tasks step-by-step with explicit approvals, retries, and evidence capture. This route is the entrypoint for the Phase 46 execution surface."})]}),e.jsxs("section",{className:s.contentGrid,children:[e.jsxs("div",{className:s.mainColumn,children:[e.jsxs("article",{className:"c-card",children:[e.jsx("h3",{children:"Execution workflow"}),e.jsx("p",{className:"t-lead",children:"Operators move tasks through approval-safe transitions, preserve audit evidence for every step, and only advance to later steps once the current step is resolved."}),e.jsxs("ul",{className:s.featureList,children:[e.jsx("li",{className:s.featureItem,children:"Sequential step execution with explicit state transitions"}),e.jsx("li",{className:s.featureItem,children:"Approval gates for higher-risk actions before execution"}),e.jsx("li",{className:s.featureItem,children:"Read-only evidence capture for logs, timestamps, inputs, and outputs"})]})]}),e.jsxs("article",{className:"c-card",children:[e.jsx("h3",{children:"Next action"}),e.jsx("p",{className:"t-lead",children:"Open the task execution surface to review queued work, inspect evidence, and move the current step forward without leaving the operator context."}),e.jsx("a",{className:"c-button c-button--primary",href:"/operations/tasks",children:"Go to task execution"})]})]}),e.jsx("aside",{className:s.sideColumn,children:e.jsxs("section",{className:"c-card",children:[e.jsx("h3",{children:"Access context"}),e.jsxs("ul",{className:s.metaList,children:[e.jsxs("li",{className:s.metaItem,children:[e.jsx("span",{className:"t-label-caps",children:"IAM role"})," ",e.jsx("span",{children:r})]}),e.jsxs("li",{className:s.metaItem,children:[e.jsx("span",{className:"t-label-caps",children:"Authorization"})," ",e.jsx("span",{children:"execute_task boundary satisfied"})]}),e.jsxs("li",{className:s.metaItem,children:[e.jsx("span",{className:"t-label-caps",children:"Scope"})," ",e.jsx("span",{children:"operator task execution, retry handling, and evidence review"})]})]})]})})]})]})}):e.jsx("div",{className:s.page,children:e.jsx("div",{className:s.shell,children:e.jsxs("section",{className:"c-card",children:[e.jsx("span",{className:"t-label-caps",children:"Operator execution surface"}),e.jsxs("div",{className:s.headerRow,children:[e.jsx("h2",{children:"Access Denied"}),e.jsxs("span",{className:"c-badge c-badge--error",children:[e.jsx("span",{className:"c-status-dot c-status-dot--error","aria-hidden":"true"}),"[err] Blocked"]})]}),e.jsxs("output",{className:"c-notice c-notice--error",children:[e.jsx("strong",{children:"[err]"})," ","Role ","`",r||"unknown","`"," lacks execute_task permission. Contact an owner or admin to request access."]}),e.jsxs("ul",{className:s.metaList,children:[e.jsxs("li",{className:s.metaItem,children:[e.jsx("span",{className:"t-label-caps",children:"Required role"})," ",e.jsx("span",{children:"owner, tenant-admin, or manager"})]}),e.jsxs("li",{className:s.metaItem,children:[e.jsx("span",{className:"t-label-caps",children:"Boundary"})," ",e.jsx("span",{children:"Phase 51-03 fail-closed authorization gate for execute_task access."})]})]})]})})})}try{page.displayName="page",page.__docgenInfo={description:"",displayName:"page",props:{authOverride:{defaultValue:null,description:"",name:"authOverride",required:!1,type:{name:"AuthContext"}}}}}catch{}const U={title:"Operations/Dashboard",component:D,parameters:{layout:"fullscreen"}},c={args:{authOverride:{iamRole:"readonly",isAuthorized:!1}}},t={args:{authOverride:{iamRole:"manager",isAuthorized:!0}}},n={args:{authOverride:{iamRole:"owner",isAuthorized:!0,canAccess:!0}},parameters:{docs:{description:{story:"Authorized operator view per UI-SPEC AC O-4. .c-card hero + .c-badge--success + .c-status-dot--live + [ok] Authorized + .c-button--primary CTA."}}}},o={args:{authOverride:{iamRole:"readonly",isAuthorized:!1,canAccess:!1}},parameters:{docs:{description:{story:"Denied operator view per UI-SPEC AC O-5. .c-notice c-notice--error + [err] glyph + remediation copy. .c-badge--error + .c-status-dot--error."}}}};var d,m,p;c.parameters={...c.parameters,docs:{...(d=c.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    authOverride: {
      iamRole: "readonly",
      isAuthorized: false
    }
  }
}`,...(p=(m=c.parameters)==null?void 0:m.docs)==null?void 0:p.source}}};var u,h,x;t.parameters={...t.parameters,docs:{...(u=t.parameters)==null?void 0:u.docs,source:{originalSource:`{
  args: {
    authOverride: {
      iamRole: "manager",
      isAuthorized: true
    }
  }
}`,...(x=(h=t.parameters)==null?void 0:h.docs)==null?void 0:x.source}}};var j,g,A;n.parameters={...n.parameters,docs:{...(j=n.parameters)==null?void 0:j.docs,source:{originalSource:`{
  args: {
    authOverride: {
      iamRole: "owner",
      isAuthorized: true,
      canAccess: true
    }
  },
  parameters: {
    docs: {
      description: {
        story: "Authorized operator view per UI-SPEC AC O-4. .c-card hero + .c-badge--success + .c-status-dot--live + [ok] Authorized + .c-button--primary CTA."
      }
    }
  }
}`,...(A=(g=n.parameters)==null?void 0:g.docs)==null?void 0:A.source}}};var N,_,f;o.parameters={...o.parameters,docs:{...(N=o.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    authOverride: {
      iamRole: "readonly",
      isAuthorized: false,
      canAccess: false
    }
  },
  parameters: {
    docs: {
      description: {
        story: "Denied operator view per UI-SPEC AC O-5. .c-notice c-notice--error + [err] glyph + remediation copy. .c-badge--error + .c-status-dot--error."
      }
    }
  }
}`,...(f=(_=o.parameters)==null?void 0:_.docs)==null?void 0:f.source}}};const B=["AccessDenied","ManagerAccess","Authorized","Denied"];export{c as AccessDenied,n as Authorized,o as Denied,t as ManagerAccess,B as __namedExportsOrder,U as default};
