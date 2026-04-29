import{j as e}from"./jsx-runtime-D_zvdyIk.js";const ne="_page_100de_9",ae="_contentCard_100de_18",re="_seatBar_100de_23",ie="_meterTrack_100de_30",se="_meterFill_100de_38",oe="_membersTable_100de_55",le="_avatar_100de_95",de="_inviteForm_100de_109",ce="_actionRow_100de_117",me="_emptyState_100de_126",n={page:ne,contentCard:ae,seatBar:re,meterTrack:ie,meterFill:se,"meterFill--warning":"_meterFill--warning_100de_45","meterFill--error":"_meterFill--error_100de_50",membersTable:oe,avatar:le,inviteForm:de,actionRow:ce,emptyState:me};function h({members:a,pendingInvites:i,seatUsage:r,toast:_,inviteBusy:y,inviteEmail:Q,inviteRole:z,showRemoveConfirm:G,memberToRemove:g,tenantRoleOptions:H,onInviteEmailChange:K,onInviteRoleChange:W,onSendInvite:X,onRequestRemove:Y,onConfirmRemove:ee,onCancelRemove:x}){const p=r.quota>0&&r.used>=r.quota,v=r.quota>0?Math.min(100,Math.round(r.used/r.quota*100)):0,te=v>=90?`${n.meterFill} ${n["meterFill--error"]}`:v>=70?`${n.meterFill} ${n["meterFill--warning"]}`:n.meterFill;return e.jsxs("main",{className:n.page,children:[e.jsxs("section",{className:`c-card ${n.contentCard}`,"aria-labelledby":"members-heading",children:[e.jsx("h1",{id:"members-heading",children:"Members"}),e.jsx("p",{className:"t-lead",children:"Invite teammates, assign roles, and track seat usage."}),e.jsxs("div",{className:n.seatBar,"aria-label":"Seat usage",children:[e.jsxs("span",{className:"t-label-caps",children:[r.used," of ",r.quota," seats used"]}),e.jsx("div",{className:n.meterTrack,children:e.jsx("div",{className:te,style:{width:`${v}%`}})})]}),a===null&&e.jsx("p",{className:n.emptyState,children:"Loading members…"}),a!==null&&a.length===0&&e.jsx("p",{className:n.emptyState,children:"No members yet. Invite your first team member to get started."}),a!==null&&a.length>0&&e.jsxs("table",{className:n.membersTable,children:[e.jsx("caption",{children:"Team members"}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",children:"Member"}),e.jsx("th",{scope:"col",children:"Tenant role"}),e.jsx("th",{scope:"col",children:"Joined"}),e.jsx("th",{scope:"col",children:e.jsx("span",{className:"sr-only",children:"Actions"})})]})}),e.jsx("tbody",{children:a.map(t=>e.jsxs("tr",{children:[e.jsxs("td",{children:[e.jsx("span",{className:n.avatar,"aria-hidden":"true",children:(t.email||t.user_id).slice(0,2).toUpperCase()}),t.email||t.user_id]}),e.jsx("td",{children:e.jsx("span",{className:"c-badge",children:t.iam_role})}),e.jsx("td",{children:new Date(t.created_at).toLocaleDateString()}),e.jsx("td",{children:t.iam_role!=="owner"&&e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>Y(t),children:"Remove"})})]},t.id))})]})]}),e.jsxs("section",{className:`c-card ${n.contentCard}`,"aria-labelledby":"invite-heading",children:[e.jsx("h2",{id:"invite-heading",children:"Invite teammates"}),i.length>0&&e.jsxs("div",{className:"c-notice c-notice--info",role:"status",children:[e.jsx("strong",{children:"[info]"})," ","Invite pending. Resend or revoke if the recipient has not responded."]}),e.jsxs("form",{onSubmit:X,className:n.inviteForm,children:[e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"invite-email",className:"c-field__label",children:"Email"}),e.jsx("input",{id:"invite-email",name:"email",type:"email",required:!0,value:Q,onChange:t=>K(t.target.value),disabled:p,placeholder:"teammate@company.com",className:"c-input"})]}),e.jsxs("div",{className:"c-field",children:[e.jsx("label",{htmlFor:"invite-role",className:"c-field__label",children:"Role"}),e.jsx("select",{id:"invite-role",value:z,onChange:t=>W(t.target.value),disabled:p,className:"c-input",children:H.map(t=>e.jsx("option",{value:t.value,children:t.label},t.value))})]}),e.jsx("button",{type:"submit",className:"c-button c-button--primary",disabled:p||y,children:y?"Sending…":p?`Seat limit reached (${r.quota} seats)`:"Invite member"})]}),i.length>0&&e.jsxs("table",{className:n.membersTable,children:[e.jsx("caption",{children:"Pending invites"}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",children:"Email"}),e.jsx("th",{scope:"col",children:"Role"}),e.jsx("th",{scope:"col",children:e.jsx("span",{className:"sr-only",children:"Actions"})})]})}),e.jsx("tbody",{children:i.map(t=>e.jsxs("tr",{children:[e.jsxs("td",{children:[t.email," ",e.jsx("span",{className:"c-badge c-badge--info",children:"[info] Pending"})]}),e.jsx("td",{children:t.tenant_role}),e.jsxs("td",{children:[e.jsx("button",{type:"button",className:"c-button c-button--tertiary",children:"Resend invite"}),e.jsx("button",{type:"button",className:"c-button c-button--destructive",children:"Revoke invite"})]})]},t.token))})]})]}),G&&g&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"c-backdrop",onClick:x,"aria-hidden":"true"}),e.jsxs("div",{className:"c-modal",role:"dialog","aria-labelledby":"remove-confirm-heading","aria-modal":"true",children:[e.jsxs("h3",{id:"remove-confirm-heading",children:["Remove ",g.email||g.user_id," from this workspace?"]}),e.jsx("p",{children:"They will lose access immediately."}),e.jsxs("div",{className:n.actionRow,children:[e.jsx("button",{type:"button",className:"c-button c-button--secondary",onClick:x,children:"Cancel"}),e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:ee,children:"Remove member"})]})]})]}),_&&e.jsx("div",{className:"c-toast-region",role:"status","aria-live":"polite",children:e.jsx("div",{className:"c-toast",children:_})})]})}try{h.displayName="MembersPageView",h.__docgenInfo={description:"",displayName:"MembersPageView",props:{members:{defaultValue:null,description:"",name:"members",required:!0,type:{name:"MemberViewItem[]"}},pendingInvites:{defaultValue:null,description:"",name:"pendingInvites",required:!0,type:{name:"PendingInviteViewItem[]"}},seatUsage:{defaultValue:null,description:"",name:"seatUsage",required:!0,type:{name:"SeatUsageView"}},toast:{defaultValue:null,description:"",name:"toast",required:!0,type:{name:"string"}},inviteBusy:{defaultValue:null,description:"",name:"inviteBusy",required:!0,type:{name:"boolean"}},inviteEmail:{defaultValue:null,description:"",name:"inviteEmail",required:!0,type:{name:"string"}},inviteRole:{defaultValue:null,description:"",name:"inviteRole",required:!0,type:{name:"string"}},showRemoveConfirm:{defaultValue:null,description:"",name:"showRemoveConfirm",required:!0,type:{name:"boolean"}},memberToRemove:{defaultValue:null,description:"",name:"memberToRemove",required:!0,type:{name:"MemberViewItem"}},tenantRoleOptions:{defaultValue:null,description:"",name:"tenantRoleOptions",required:!0,type:{name:"{ value: string; label: string; }[]"}},onInviteEmailChange:{defaultValue:null,description:"",name:"onInviteEmailChange",required:!0,type:{name:"(val: string) => void"}},onInviteRoleChange:{defaultValue:null,description:"",name:"onInviteRoleChange",required:!0,type:{name:"(val: string) => void"}},onSendInvite:{defaultValue:null,description:"",name:"onSendInvite",required:!0,type:{name:"(e: FormEvent<Element>) => void"}},onRequestRemove:{defaultValue:null,description:"",name:"onRequestRemove",required:!0,type:{name:"(member: MemberViewItem) => void"}},onConfirmRemove:{defaultValue:null,description:"",name:"onConfirmRemove",required:!0,type:{name:"() => void"}},onCancelRemove:{defaultValue:null,description:"",name:"onCancelRemove",required:!0,type:{name:"() => void"}}}}}catch{}const ue=[{value:"tenant-admin",label:"Admin"},{value:"manager",label:"Manager"},{value:"contributor",label:"Contributor"},{value:"reviewer",label:"Reviewer"},{value:"readonly",label:"Read-only"}],s=()=>{},pe=a=>{a.preventDefault()},b=[{id:"1",user_id:"usr_1",email:"ada@example.com",iam_role:"owner",created_at:"2026-01-10T00:00:00Z"},{id:"2",user_id:"usr_2",email:"alan@example.com",iam_role:"tenant-admin",created_at:"2026-02-14T00:00:00Z"},{id:"3",user_id:"usr_3",email:"grace@example.com",iam_role:"contributor",created_at:"2026-03-01T00:00:00Z"}],u={tenantRoleOptions:ue,toast:null,inviteBusy:!1,inviteEmail:"",inviteRole:"contributor",showRemoveConfirm:!1,memberToRemove:null,onInviteEmailChange:s,onInviteRoleChange:s,onSendInvite:pe,onRequestRemove:s,onConfirmRemove:s,onCancelRemove:s},ge={title:"Settings/Members",component:h,parameters:{layout:"fullscreen"}},o={args:{...u,members:b,pendingInvites:[],seatUsage:{used:3,quota:10}}},l={args:{...u,members:[...b,...Array.from({length:5},(a,i)=>({id:`${i+4}`,user_id:`usr_${i+4}`,email:`member${i+4}@example.com`,iam_role:i===0?"tenant-admin":"contributor",created_at:"2026-03-15T00:00:00Z"}))],pendingInvites:[],seatUsage:{used:8,quota:10}},parameters:{docs:{description:{story:"Seat bar at 80% — `.meterFill--warning` state per UI-SPEC AC M-2. Table shows 8 members."}}}},d={args:{...u,members:b,pendingInvites:[{token:"inv_abc123",email:"pending@example.com",tenant_role:"contributor",invited_by:"ada@example.com",created_at:"2026-04-25T00:00:00Z",expires_at:"2026-05-02T00:00:00Z"}],seatUsage:{used:4,quota:10}},parameters:{docs:{description:{story:"Renders `.c-notice c-notice--info` with `[info]` glyph (M-3) and `.c-badge c-badge--info` `[info] Pending` in the pending invite row (M-4)."}}}},c={args:{...u,members:b,pendingInvites:[],seatUsage:{used:9,quota:10},inviteRole:"tenant-admin",inviteEmail:"newmember@example.com"},parameters:{docs:{description:{story:'Invite form pre-filled with role "tenant-admin" selected — `.c-input` (select variant) composition. Seat bar at 90% triggers `.meterFill--error` state.'}}}},m={args:{...u,members:[],pendingInvites:[],seatUsage:{used:0,quota:10}},parameters:{docs:{description:{story:'Empty state: "No members yet. Invite your first team member to get started." — per UI-SPEC Copywriting Contract.'}}}};var f,j,R,N,w;o.parameters={...o.parameters,docs:{...(f=o.parameters)==null?void 0:f.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [],
    seatUsage: {
      used: 3,
      quota: 10
    }
  }
}`,...(R=(j=o.parameters)==null?void 0:j.docs)==null?void 0:R.source},description:{story:"Default: 3 active members, 3 of 10 seats used — `.meterFill` at success (green) state (<70%).",...(w=(N=o.parameters)==null?void 0:N.docs)==null?void 0:w.description}}};var I,C,q,F,S;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    members: [...sampleMembers, ...Array.from({
      length: 5
    }, (_, i) => ({
      id: \`\${i + 4}\`,
      user_id: \`usr_\${i + 4}\`,
      email: \`member\${i + 4}@example.com\`,
      iam_role: i === 0 ? 'tenant-admin' : 'contributor',
      created_at: '2026-03-15T00:00:00Z'
    }))],
    pendingInvites: [],
    seatUsage: {
      used: 8,
      quota: 10
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Seat bar at 80% — \`.meterFill--warning\` state per UI-SPEC AC M-2. Table shows 8 members.'
      }
    }
  }
}`,...(q=(C=l.parameters)==null?void 0:C.docs)==null?void 0:q.source},description:{story:"Filled: 8 of 10 seats used — `.meterFill--warning` state (70–90% per UI-SPEC AC M-2).",...(S=(F=l.parameters)==null?void 0:F.docs)==null?void 0:S.description}}};var E,M,T,V,P;d.parameters={...d.parameters,docs:{...(E=d.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [{
      token: 'inv_abc123',
      email: 'pending@example.com',
      tenant_role: 'contributor',
      invited_by: 'ada@example.com',
      created_at: '2026-04-25T00:00:00Z',
      expires_at: '2026-05-02T00:00:00Z'
    }],
    seatUsage: {
      used: 4,
      quota: 10
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders \`.c-notice c-notice--info\` with \`[info]\` glyph (M-3) and \`.c-badge c-badge--info\` \`[info] Pending\` in the pending invite row (M-4).'
      }
    }
  }
}`,...(T=(M=d.parameters)==null?void 0:M.docs)==null?void 0:T.source},description:{story:"InvitePending: `.c-notice c-notice--info` banner + pending invite table row with `.c-badge--info` glyph (M-3, M-4).",...(P=(V=d.parameters)==null?void 0:V.docs)==null?void 0:P.description}}};var k,A,$,O,U;c.parameters={...c.parameters,docs:{...(k=c.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    members: sampleMembers,
    pendingInvites: [],
    seatUsage: {
      used: 9,
      quota: 10
    },
    inviteRole: 'tenant-admin',
    inviteEmail: 'newmember@example.com'
  },
  parameters: {
    docs: {
      description: {
        story: 'Invite form pre-filled with role "tenant-admin" selected — \`.c-input\` (select variant) composition. Seat bar at 90% triggers \`.meterFill--error\` state.'
      }
    }
  }
}`,...($=(A=c.parameters)==null?void 0:A.docs)==null?void 0:$.source},description:{story:"RoleEdit: shows how the role select `.c-input` renders in the invite form; seat bar at error state (>=90%).",...(U=(O=c.parameters)==null?void 0:O.docs)==null?void 0:U.description}}};var Z,B,D,L,J;m.parameters={...m.parameters,docs:{...(Z=m.parameters)==null?void 0:Z.docs,source:{originalSource:`{
  args: {
    ...baseArgs,
    members: [],
    pendingInvites: [],
    seatUsage: {
      used: 0,
      quota: 10
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state: "No members yet. Invite your first team member to get started." — per UI-SPEC Copywriting Contract.'
      }
    }
  }
}`,...(D=(B=m.parameters)==null?void 0:B.docs)==null?void 0:D.source},description:{story:"Empty: no members loaded yet — empty state copy + loading-free initial render.",...(J=(L=m.parameters)==null?void 0:L.docs)==null?void 0:J.description}}};const ve=["Default","Filled","InvitePending","RoleEdit","Empty"];export{o as Default,m as Empty,l as Filled,d as InvitePending,c as RoleEdit,ve as __namedExportsOrder,ge as default};
