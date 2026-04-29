import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{g as J,d as K}from"./brand-pack-CF6hJYZx.js";import"./tokens-BLc9fnXK.js";const Q="_page_102ax_8",X="_shell_102ax_17",Y="_summaryHeader_102ax_25",Z="_brandCard_102ax_34",ee="_cardHeader_102ax_45",ae="_logo_102ax_52",ne="_logoFallback_102ax_60",ie="_contentGrid_102ax_75",se="_mainColumn_102ax_82",le="_sideColumn_102ax_88",te="_formStack_102ax_94",re="_sectionHeader_102ax_100",ce="_toggleCard_102ax_109",oe="_toggleControl_102ax_122",de="_fieldset_102ax_128",pe="_capabilityGrid_102ax_136",ge="_capabilityColumn_102ax_144",ue="_capabilityCard_102ax_150",me="_actionRow_102ax_161",be="_detailList_102ax_168",he="_detailItem_102ax_177",fe="_srOnly_102ax_187",a={page:Q,shell:X,summaryHeader:Y,brandCard:Z,cardHeader:ee,logo:ae,logoFallback:ne,contentGrid:ie,mainColumn:se,sideColumn:le,formStack:te,sectionHeader:re,toggleCard:ce,toggleControl:oe,fieldset:de,capabilityGrid:pe,capabilityColumn:ge,capabilityCard:ue,actionRow:me,detailList:be,detailItem:he,srOnly:fe},h="digital-agency-v1",f=[{id:"read_campaigns",label:"View Campaigns"},{id:"write_campaigns",label:"Create & Edit Campaigns"},{id:"publish_campaigns",label:"Publish Campaigns"},{id:"read_drafts",label:"View Drafts"}];function g({savePluginSettingsAction:o,disablePluginAction:F,pluginSlug:T="digital-agency-v1",disabled:d=!1,updateAvailable:u=!1,compatible:B=!0,minVersion:$="1.0.0",installed:m=!0}){const p=J("current-tenant",K),z=[f.slice(0,2),f.slice(2)];return e.jsx("div",{className:a.page,children:e.jsxs("div",{className:a.shell,children:[e.jsx("section",{className:"c-card",children:e.jsxs("div",{className:a.summaryHeader,children:[e.jsxs("div",{children:[e.jsx("p",{className:"t-label-caps",children:"Workspace plugin control"}),e.jsx("h1",{children:"Plugins"}),e.jsx("p",{children:"Enable the tenant-branded campaign workspace, assign capability grants, and keep disable controls explicit when access must fail closed."})]}),e.jsx("div",{className:a.brandCard,children:e.jsxs("div",{className:a.cardHeader,children:[p.logoUrl?e.jsx("img",{src:p.logoUrl,alt:"Plugin logo",className:a.logo}):e.jsx("div",{className:a.logoFallback,children:"DA"}),e.jsxs("div",{children:[e.jsx("p",{children:p.label}),e.jsx("p",{children:"Tenant-branded workflow surface"}),e.jsxs("span",{className:"c-chip-protocol",children:["plugin:",T]})]})]})})]})}),e.jsxs("section",{className:a.contentGrid,children:[e.jsxs("div",{className:a.mainColumn,children:[!B&&e.jsxs("div",{className:"c-notice c-notice--warning",role:"status",children:[e.jsx("strong",{children:"[warn]"})," ","This plugin requires MarkOS v",$," or later."]}),e.jsxs("article",{className:"c-card",children:[e.jsxs("div",{className:a.sectionHeader,children:[e.jsxs("div",{children:[e.jsx("h2",{children:"Enablement and capability grants"}),e.jsx("p",{children:"Workspace owners can toggle access and adjust role-safe permissions for campaign drafting, review, and publishing."})]}),m&&!d&&!u&&e.jsx("span",{className:"c-chip c-chip--mint",children:"[ok] Installed"}),d&&e.jsx("span",{className:"c-badge c-badge--warning",children:"[warn] Disabled"}),u&&e.jsx("span",{className:"c-badge c-badge--info",children:"[info] Update available"}),!m&&!d&&e.jsx("span",{className:"c-badge c-badge--info",children:"Not installed"})]}),e.jsxs("form",{action:o,className:a.formStack,children:[e.jsx("input",{type:"hidden",name:"plugin_id",value:h}),e.jsxs("div",{className:a.toggleCard,children:[e.jsxs("div",{children:[e.jsx("p",{children:"Enable Digital Agency Plugin"}),e.jsx("p",{children:"Restores the dashboard, campaign workflow routes, and approval surfaces for this workspace."})]}),e.jsxs("label",{htmlFor:"plugin-enabled",className:a.toggleControl,children:[e.jsx("span",{className:a.srOnly,children:"Enable Digital Agency Plugin"}),e.jsx("input",{id:"plugin-enabled",type:"checkbox",name:"enabled"})]})]}),e.jsxs("fieldset",{className:a.fieldset,children:[e.jsx("legend",{children:"Capability grants"}),e.jsx("div",{className:a.capabilityGrid,children:z.map(b=>e.jsx("div",{className:a.capabilityColumn,children:b.map(i=>e.jsxs("label",{className:`c-card c-card--interactive ${a.capabilityCard}`,children:[e.jsx("input",{type:"checkbox",name:"capabilities",value:i.id}),e.jsx("span",{children:i.label})]},i.id))},b.map(i=>i.id).join("-")))})]}),e.jsxs("div",{className:a.actionRow,children:[e.jsx("button",{type:"submit",className:"c-button c-button--primary",children:"Save Plugin Settings"}),e.jsx("button",{type:"button",className:"c-button c-button--secondary",children:"Review Route Gate Impact"})]})]})]})]}),e.jsxs("aside",{className:a.sideColumn,children:[e.jsxs("section",{className:"c-card",children:[e.jsx("h2",{children:"What changes when enabled"}),e.jsx("p",{children:"The plugin exposes the branded dashboard, campaign assembly flow, draft review, and gated publishing permissions for approved users."}),e.jsxs("ul",{className:a.detailList,children:[e.jsx("li",{className:a.detailItem,children:"Tenant-branded dashboard and route shell"}),e.jsx("li",{className:a.detailItem,children:"Approval-safe draft workflow access"}),e.jsx("li",{className:a.detailItem,children:"Capability-based publishing controls"})]})]}),e.jsxs("section",{className:"c-card",children:[e.jsx("h2",{children:"Disable access"}),e.jsx("p",{children:"Disabling the plugin removes workspace access immediately and forces protected routes to fail closed until re-enabled."}),e.jsxs("form",{action:F,className:a.actionRow,children:[e.jsx("input",{type:"hidden",name:"plugin_id",value:h}),e.jsx("button",{type:"submit",className:"c-button c-button--destructive",children:"Disable Digital Agency Plugin"})]})]})]})]})]})})}try{g.displayName="PluginSettingsPageShell",g.__docgenInfo={description:"",displayName:"PluginSettingsPageShell",props:{savePluginSettingsAction:{defaultValue:null,description:"",name:"savePluginSettingsAction",required:!1,type:{name:"PluginSettingsAction"}},disablePluginAction:{defaultValue:null,description:"",name:"disablePluginAction",required:!1,type:{name:"PluginSettingsAction"}},pluginSlug:{defaultValue:{value:"digital-agency-v1"},description:'Plugin slug for the protocol chip — defaults to "digital-agency-v1"',name:"pluginSlug",required:!1,type:{name:"string"}},disabled:{defaultValue:{value:"false"},description:"Whether the plugin is currently disabled",name:"disabled",required:!1,type:{name:"boolean"}},updateAvailable:{defaultValue:{value:"false"},description:"Whether an update is available",name:"updateAvailable",required:!1,type:{name:"boolean"}},compatible:{defaultValue:{value:"true"},description:"Whether the plugin is compatible with the running MarkOS version",name:"compatible",required:!1,type:{name:"boolean"}},minVersion:{defaultValue:{value:"1.0.0"},description:"Minimum required MarkOS version (used in compatibility warning)",name:"minVersion",required:!1,type:{name:"string"}},installed:{defaultValue:{value:"true"},description:"Whether the plugin is currently installed/enabled",name:"installed",required:!1,type:{name:"boolean"}}}}}catch{}async function n(o){}const ve={title:"Routes/Settings - Plugins",component:g,parameters:{layout:"fullscreen"}},s={args:{savePluginSettingsAction:n,disablePluginAction:n,pluginSlug:"digital-agency-v1",installed:!0,disabled:!1,updateAvailable:!1,compatible:!0,minVersion:"1.0.0"}},l={args:{savePluginSettingsAction:n,disablePluginAction:n,pluginSlug:"digital-agency-v1",installed:!0,disabled:!1,updateAvailable:!1,compatible:!0,minVersion:"1.0.0"},parameters:{docs:{description:{story:"`.c-chip c-chip--mint` `[ok] Installed` badge per UI-SPEC AC P-2."}}}},t={args:{savePluginSettingsAction:n,disablePluginAction:n,pluginSlug:"digital-agency-v1",installed:!0,disabled:!0,updateAvailable:!1,compatible:!0,minVersion:"1.0.0"},parameters:{docs:{description:{story:"`.c-badge c-badge--warning` `[warn] Disabled` badge per UI-SPEC AC P-2."}}}},r={args:{savePluginSettingsAction:n,disablePluginAction:n,pluginSlug:"digital-agency-v1",installed:!0,disabled:!1,updateAvailable:!0,compatible:!0,minVersion:"1.0.0"},parameters:{docs:{description:{story:"`.c-badge c-badge--info` `[info] Update available` badge per UI-SPEC AC P-2."}}}},c={args:{savePluginSettingsAction:n,disablePluginAction:n,pluginSlug:"digital-agency-v2",installed:!1,disabled:!1,updateAvailable:!1,compatible:!1,minVersion:"2.0.0"},parameters:{docs:{description:{story:"`.c-notice c-notice--warning` compatibility notice for plugins requiring a newer MarkOS version per UI-SPEC AC P-4."}}}};var x,y,_,v,P;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0"
  }
}`,...(_=(y=s.parameters)==null?void 0:y.docs)==null?void 0:_.source},description:{story:"Default — plugin installed and active (no badges, no warnings).",...(P=(v=s.parameters)==null?void 0:v.docs)==null?void 0:P.description}}};var A,j,S,C,w;l.parameters={...l.parameters,docs:{...(A=l.parameters)==null?void 0:A.docs,source:{originalSource:`{
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0"
  },
  parameters: {
    docs: {
      description: {
        story: "\`.c-chip c-chip--mint\` \`[ok] Installed\` badge per UI-SPEC AC P-2."
      }
    }
  }
}`,...(S=(j=l.parameters)==null?void 0:j.docs)==null?void 0:S.source},description:{story:"Installed — shows `.c-chip c-chip--mint` `[ok] Installed` badge per UI-SPEC AC P-2.",...(w=(C=l.parameters)==null?void 0:C.docs)==null?void 0:w.description}}};var N,k,I,U,V;t.parameters={...t.parameters,docs:{...(N=t.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: true,
    updateAvailable: false,
    compatible: true,
    minVersion: "1.0.0"
  },
  parameters: {
    docs: {
      description: {
        story: "\`.c-badge c-badge--warning\` \`[warn] Disabled\` badge per UI-SPEC AC P-2."
      }
    }
  }
}`,...(I=(k=t.parameters)==null?void 0:k.docs)==null?void 0:I.source},description:{story:"Disabled — shows `.c-badge c-badge--warning` `[warn] Disabled` badge per UI-SPEC AC P-2.",...(V=(U=t.parameters)==null?void 0:U.docs)==null?void 0:V.description}}};var D,E,q,H,G;r.parameters={...r.parameters,docs:{...(D=r.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v1",
    installed: true,
    disabled: false,
    updateAvailable: true,
    compatible: true,
    minVersion: "1.0.0"
  },
  parameters: {
    docs: {
      description: {
        story: "\`.c-badge c-badge--info\` \`[info] Update available\` badge per UI-SPEC AC P-2."
      }
    }
  }
}`,...(q=(E=r.parameters)==null?void 0:E.docs)==null?void 0:q.source},description:{story:"Updated — shows `.c-badge c-badge--info` `[info] Update available` badge per UI-SPEC AC P-2.",...(G=(H=r.parameters)==null?void 0:H.docs)==null?void 0:G.description}}};var O,R,M,L,W;c.parameters={...c.parameters,docs:{...(O=c.parameters)==null?void 0:O.docs,source:{originalSource:`{
  args: {
    savePluginSettingsAction: noopAction,
    disablePluginAction: noopAction,
    pluginSlug: "digital-agency-v2",
    installed: false,
    disabled: false,
    updateAvailable: false,
    compatible: false,
    minVersion: "2.0.0"
  },
  parameters: {
    docs: {
      description: {
        story: "\`.c-notice c-notice--warning\` compatibility notice for plugins requiring a newer MarkOS version per UI-SPEC AC P-4."
      }
    }
  }
}`,...(M=(R=c.parameters)==null?void 0:R.docs)==null?void 0:M.source},description:{story:"Marketplace — incompatible plugin surfaces `.c-notice c-notice--warning` compatibility warning per UI-SPEC AC P-4.",...(W=(L=c.parameters)==null?void 0:L.docs)==null?void 0:W.description}}};const Pe=["Default","Installed","Disabled","Updated","Marketplace"];export{s as Default,t as Disabled,l as Installed,c as Marketplace,r as Updated,Pe as __namedExportsOrder,ve as default};
