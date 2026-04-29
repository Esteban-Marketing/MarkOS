import{j as e}from"./jsx-runtime-EKYJJIwR.js";import"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const W="_page_1sxjr_10",G="_contentCard_1sxjr_20",Z="_cardHeaderRow_1sxjr_29",O="_statusCell_1sxjr_54",z="_meterGroup_1sxjr_62",J="_meterTrack_1sxjr_69",Q="_meterFill_1sxjr_76",X="_budgetValueRow_1sxjr_93",Y="_resetTimer_1sxjr_102",ee="_topTools_1sxjr_109",se="_topToolsList_1sxjr_115",te="_topToolsItem_1sxjr_124",re="_keyRow_1sxjr_133",oe="_actionRow_1sxjr_142",ne="_emptyState_1sxjr_150",s={page:W,contentCard:G,cardHeaderRow:Z,statusCell:O,meterGroup:z,meterTrack:J,meterFill:Q,"meterFill--warning":"_meterFill--warning_1sxjr_83","meterFill--error":"_meterFill--error_1sxjr_87",budgetValueRow:X,resetTimer:Y,topTools:ee,topToolsList:se,topToolsItem:te,keyRow:re,actionRow:oe,emptyState:ne};function m({servers:d,costBudget:r,keyRotationInProgress:q=!1}){const u=r?Math.min(100,r.used/r.limit*100):0,h=u>=100;function K(t){return t>=90?`${s.meterFill} ${s["meterFill--error"]}`:t>=70?`${s.meterFill} ${s["meterFill--warning"]}`:s.meterFill}return e.jsxs("main",{className:s.page,children:[h&&e.jsxs("div",{className:"c-notice c-notice--error",role:"status",children:[e.jsx("strong",{children:"[err]"})," ","Cost limit reached. MCP tools are paused. Adjust the budget to resume."]}),!h&&u>=70&&e.jsxs("div",{className:"c-notice c-notice--warning",role:"status",children:[e.jsx("strong",{children:"[warn]"})," ","Cost approaching limit. Review tool usage to avoid service interruption."]}),q&&e.jsxs("div",{className:"c-notice c-notice--info",role:"status",children:[e.jsx("strong",{children:"[info]"})," ","Key rotation in progress. The previous key remains valid for 24 hours."]}),d.length===0?e.jsxs("section",{className:`c-card ${s.contentCard}`,children:[e.jsxs("div",{className:s.cardHeaderRow,children:[e.jsx("h1",{children:"MCP servers"}),e.jsx("button",{type:"button",className:"c-button c-button--primary",children:"Add server"})]}),e.jsx("p",{className:s.emptyState,children:"No MCP servers configured. Add a server to connect AI agents to external tools."})]}):d.map(t=>{const B=t.status==="connected"?"c-status-dot c-status-dot--live":t.status==="error"?"c-status-dot c-status-dot--error":"c-status-dot",H=t.status==="connected"?"[ok] Connected":t.status==="error"?"[err] Error":"[warn] Disconnected",x=t.costPct;return e.jsxs("section",{className:`c-card ${s.contentCard}`,children:[e.jsxs("div",{className:s.cardHeaderRow,children:[e.jsxs("div",{children:[e.jsx("h1",{children:e.jsx("span",{className:"c-chip-protocol",children:t.name})}),e.jsxs("div",{className:s.statusCell,children:[e.jsx("span",{className:B,"aria-hidden":"true"}),e.jsx("span",{children:H})]})]}),e.jsxs("div",{className:s.actionRow,children:[e.jsx("button",{type:"button",className:"c-button c-button--primary",children:"Add server"}),e.jsx("button",{type:"button",className:"c-button c-button--secondary",children:"Refresh"})]})]}),r&&e.jsxs("div",{className:s.meterGroup,children:[e.jsx("span",{className:"t-label-caps",children:"Cost budget"}),e.jsx("div",{className:s.meterTrack,children:e.jsx("div",{className:K(x),role:"meter","aria-valuenow":r.used,"aria-valuemin":0,"aria-valuemax":r.limit,"aria-label":"Cost budget",style:{width:`${x}%`}})}),e.jsxs("div",{className:s.budgetValueRow,children:[e.jsxs("span",{children:["$",r.used," of $",r.limit," used"]}),e.jsxs("span",{className:s.resetTimer,children:["Resets in ",r.resetIn]})]})]}),t.tools.length>0&&e.jsxs("div",{className:s.topTools,children:[e.jsx("h2",{children:"Top tools by cost"}),e.jsx("ol",{className:s.topToolsList,children:t.tools.map(p=>e.jsxs("li",{className:s.topToolsItem,children:[e.jsx("span",{className:"c-chip-protocol",children:p.id}),e.jsx("span",{children:p.cost})]},p.id))})]}),e.jsx("h4",{children:"API keys"}),e.jsxs("div",{className:s.keyRow,children:[e.jsx("span",{className:"c-chip-protocol",children:"mk_xxx"}),e.jsx("code",{className:"c-code-inline",children:t.apiKey}),e.jsx("button",{type:"button",className:"c-button c-button--icon","aria-label":"Copy to clipboard",children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 16 16",fill:"none","aria-hidden":"true",focusable:"false",children:[e.jsx("rect",{x:"5",y:"5",width:"9",height:"9",rx:"1",stroke:"currentColor",strokeWidth:"1.5",fill:"none"}),e.jsx("path",{d:"M3 11V3a1 1 0 011-1h8",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round"})]})})]}),e.jsx("div",{className:s.actionRow,children:e.jsx("button",{type:"button",className:"c-button c-button--secondary",children:"Rotate key"})})]},t.id)})]})}try{m.displayName="MCPPageView",m.__docgenInfo={description:"",displayName:"MCPPageView",props:{servers:{defaultValue:null,description:"",name:"servers",required:!0,type:{name:"MCPServer[]"}},costBudget:{defaultValue:null,description:"",name:"costBudget",required:!0,type:{name:"{ used: number; limit: number; resetIn: string; }"}},keyRotationInProgress:{defaultValue:{value:"false"},description:"",name:"keyRotationInProgress",required:!1,type:{name:"boolean"}},rotationDeadline:{defaultValue:null,description:"",name:"rotationDeadline",required:!1,type:{name:"string"}}}}}catch{}const de={title:"Settings/MCP",component:m,parameters:{layout:"fullscreen"}},l={id:"mcp_1",name:"claim-audit",status:"connected",costPct:35,tools:[{id:"read",cost:"$0.02/call"},{id:"write",cost:"$0.05/call"}],apiKey:"mk_xxx_•1234"},o={args:{servers:[l],costBudget:{used:35,limit:100,resetIn:"7 days"}}},n={args:{servers:[{...l}],costBudget:{used:35,limit:100,resetIn:"7 days"},keyRotationInProgress:!0,rotationDeadline:"2026-04-29T10:00:00Z"},parameters:{docs:{description:{story:"`.c-notice c-notice--info` key-rotation banner per UI-SPEC AC MC-3."}}}},a={args:{servers:[{...l,costPct:75}],costBudget:{used:75,limit:100,resetIn:"3 days"}},parameters:{docs:{description:{story:"`.meterFill--warning` state + `.c-notice c-notice--warning` cost-approaching notice per UI-SPEC AC MC-2/MC-3."}}}},c={args:{servers:[{...l,tools:[{id:"claim_audit",cost:"$0.02/call"},{id:"evidence_lookup",cost:"$0.01/call"},{id:"pricing_query",cost:"$0.05/call"},{id:"webhook_replay",cost:"$0.03/call"},{id:"session_revoke",cost:"$0.00/call"}]}],costBudget:{used:35,limit:100,resetIn:"7 days"}},parameters:{docs:{description:{story:"Multi-tool server with `.c-chip-protocol` per tool ID + per-tool cost row."}}}},i={args:{servers:[],costBudget:null},parameters:{docs:{description:{story:'Empty state: "No MCP servers configured. Add a server to connect AI agents to external tools."'}}}};var y,g,_,j,C;o.parameters={...o.parameters,docs:{...(y=o.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    servers: [sampleServer],
    costBudget: {
      used: 35,
      limit: 100,
      resetIn: '7 days'
    }
  }
}`,...(_=(g=o.parameters)==null?void 0:g.docs)==null?void 0:_.source},description:{story:"Default: single connected server, 35% cost meter (.meterFill default success state)",...(C=(j=o.parameters)==null?void 0:j.docs)==null?void 0:C.description}}};var v,w,b,N,f;n.parameters={...n.parameters,docs:{...(v=n.parameters)==null?void 0:v.docs,source:{originalSource:`{
  args: {
    servers: [{
      ...sampleServer
    }],
    costBudget: {
      used: 35,
      limit: 100,
      resetIn: '7 days'
    },
    keyRotationInProgress: true,
    rotationDeadline: '2026-04-29T10:00:00Z'
  },
  parameters: {
    docs: {
      description: {
        story: '\`.c-notice c-notice--info\` key-rotation banner per UI-SPEC AC MC-3.'
      }
    }
  }
}`,...(b=(w=n.parameters)==null?void 0:w.docs)==null?void 0:b.source},description:{story:"KeyRotation: .c-notice c-notice--info key-rotation banner per UI-SPEC AC MC-3",...(f=(N=n.parameters)==null?void 0:N.docs)==null?void 0:f.description}}};var I,k,P,R,T;a.parameters={...a.parameters,docs:{...(I=a.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    servers: [{
      ...sampleServer,
      costPct: 75
    }],
    costBudget: {
      used: 75,
      limit: 100,
      resetIn: '3 days'
    }
  },
  parameters: {
    docs: {
      description: {
        story: '\`.meterFill--warning\` state + \`.c-notice c-notice--warning\` cost-approaching notice per UI-SPEC AC MC-2/MC-3.'
      }
    }
  }
}`,...(P=(k=a.parameters)==null?void 0:k.docs)==null?void 0:P.source},description:{story:"CostMeterWarning: .meterFill--warning (>=70%) + .c-notice c-notice--warning per UI-SPEC AC MC-2/MC-3",...(T=(R=a.parameters)==null?void 0:R.docs)==null?void 0:T.description}}};var M,S,$,A,F;c.parameters={...c.parameters,docs:{...(M=c.parameters)==null?void 0:M.docs,source:{originalSource:`{
  args: {
    servers: [{
      ...sampleServer,
      tools: [{
        id: 'claim_audit',
        cost: '$0.02/call'
      }, {
        id: 'evidence_lookup',
        cost: '$0.01/call'
      }, {
        id: 'pricing_query',
        cost: '$0.05/call'
      }, {
        id: 'webhook_replay',
        cost: '$0.03/call'
      }, {
        id: 'session_revoke',
        cost: '$0.00/call'
      }]
    }],
    costBudget: {
      used: 35,
      limit: 100,
      resetIn: '7 days'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Multi-tool server with \`.c-chip-protocol\` per tool ID + per-tool cost row.'
      }
    }
  }
}`,...($=(S=c.parameters)==null?void 0:S.docs)==null?void 0:$.source},description:{story:"ToolList: multi-tool server — .c-chip-protocol per tool ID + per-tool cost row",...(F=(A=c.parameters)==null?void 0:A.docs)==null?void 0:F.description}}};var E,V,D,L,U;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    servers: [],
    costBudget: null
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state: "No MCP servers configured. Add a server to connect AI agents to external tools."'
      }
    }
  }
}`,...(D=(V=i.parameters)==null?void 0:V.docs)==null?void 0:D.source},description:{story:'Empty: no servers configured — empty state copy per UI-SPEC + .c-button--primary "Add server" CTA',...(U=(L=i.parameters)==null?void 0:L.docs)==null?void 0:U.description}}};const pe=["Default","KeyRotation","CostMeterWarning","ToolList","Empty"];export{a as CostMeterWarning,o as Default,i as Empty,n as KeyRotation,c as ToolList,pe as __namedExportsOrder,de as default};
