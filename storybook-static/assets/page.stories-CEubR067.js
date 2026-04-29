import{j as e}from"./jsx-runtime-D_zvdyIk.js";const I="_page_7nzuo_9",L="_contentCard_7nzuo_18",W="_sessionsTable_7nzuo_22",Y="_statusCell_7nzuo_59",Z="_revokeAllRow_7nzuo_65",B="_actionRow_7nzuo_72",H="_emptyState_7nzuo_79",n={page:I,contentCard:L,sessionsTable:W,statusCell:Y,revokeAllRow:Z,actionRow:B,emptyState:H};function y({sessions:t,busy:d=null,toast:_=null,revokeTarget:M=null,showRevokeAll:O=!1,onRevokeRequest:u,onRevokeTargetClear:o,onRevokeConfirm:p,onRevokeAllRequest:m,onRevokeAllClear:a,onRevokeAllConfirm:h}){const F=(t||[]).some(s=>!s.is_current);return e.jsxs("main",{className:n.page,children:[e.jsxs("section",{className:`c-card ${n.contentCard}`,children:[e.jsx("h2",{children:"Active sessions"}),e.jsx("p",{className:"t-lead",children:"You're signed in on these devices. Revoke any you don't recognise."}),t===null&&e.jsx("p",{className:n.emptyState,children:"Loading sessions…"}),t!==null&&t.length===0&&e.jsx("p",{className:n.emptyState,children:"This is your only active session."}),t!==null&&t.length>0&&e.jsxs(e.Fragment,{children:[e.jsxs("table",{className:n.sessionsTable,children:[e.jsx("caption",{children:"Devices signed in to your account"}),e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{scope:"col",children:"Device"}),e.jsx("th",{scope:"col",children:"Status"}),e.jsx("th",{scope:"col",children:"Last seen"}),e.jsx("th",{scope:"col",children:"Location"}),e.jsx("th",{scope:"col",children:e.jsx("span",{className:"u-visually-hidden",children:"Actions"})})]})}),e.jsx("tbody",{children:t.map(s=>e.jsxs("tr",{children:[e.jsx("td",{children:s.device_label||"Unknown device"}),e.jsx("td",{children:s.is_current?e.jsxs("div",{className:n.statusCell,children:[e.jsx("span",{className:"c-status-dot c-status-dot--live","aria-hidden":"true"}),e.jsx("span",{children:"[ok] Active now"}),e.jsx("span",{className:"c-badge c-badge--success",children:"[ok] Current"})]}):null}),e.jsx("td",{children:new Date(s.last_seen_at).toLocaleString()}),e.jsx("td",{children:s.location||"—"}),e.jsx("td",{children:!s.is_current&&e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>u==null?void 0:u(s.session_id),disabled:d===s.session_id,children:d===s.session_id?"Revoking…":"Revoke"})})]},s.session_id))})]}),F&&e.jsx("div",{className:n.revokeAllRow,children:e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>m==null?void 0:m(),disabled:d==="all",children:d==="all"?"Revoking…":"Revoke all other sessions"})})]})]}),M&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"c-backdrop",onClick:()=>o==null?void 0:o(),"aria-hidden":"true"}),e.jsxs("div",{className:"c-modal",role:"dialog","aria-labelledby":"revoke-confirm-heading","aria-modal":"true",children:[e.jsx("h3",{id:"revoke-confirm-heading",children:"Revoke this session?"}),e.jsx("p",{children:"The device will be signed out immediately."}),e.jsxs("div",{className:n.actionRow,children:[e.jsx("button",{type:"button",className:"c-button c-button--secondary",onClick:()=>o==null?void 0:o(),children:"Cancel"}),e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>p==null?void 0:p(),children:"Revoke session"})]})]})]}),O&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"c-backdrop",onClick:()=>a==null?void 0:a(),"aria-hidden":"true"}),e.jsxs("div",{className:"c-modal",role:"dialog","aria-labelledby":"revoke-all-confirm-heading","aria-modal":"true",children:[e.jsx("h3",{id:"revoke-all-confirm-heading",children:"Revoke all other sessions?"}),e.jsx("p",{children:"You will remain signed in on this device."}),e.jsxs("div",{className:n.actionRow,children:[e.jsx("button",{type:"button",className:"c-button c-button--secondary",onClick:()=>a==null?void 0:a(),children:"Cancel"}),e.jsx("button",{type:"button",className:"c-button c-button--destructive",onClick:()=>h==null?void 0:h(),children:"Revoke all"})]})]})]}),_&&e.jsx("div",{className:"c-toast c-toast--success",role:"status","aria-live":"polite",children:_})]})}try{y.displayName="SessionsPageView",y.__docgenInfo={description:"",displayName:"SessionsPageView",props:{sessions:{defaultValue:null,description:"",name:"sessions",required:!0,type:{name:"Session[]"}},busy:{defaultValue:{value:"null"},description:"",name:"busy",required:!1,type:{name:"string"}},toast:{defaultValue:{value:"null"},description:"",name:"toast",required:!1,type:{name:"string"}},revokeTarget:{defaultValue:{value:"null"},description:"",name:"revokeTarget",required:!1,type:{name:"string"}},showRevokeAll:{defaultValue:{value:"false"},description:"",name:"showRevokeAll",required:!1,type:{name:"boolean"}},onRevokeRequest:{defaultValue:null,description:"",name:"onRevokeRequest",required:!1,type:{name:"(sessionId: string) => void"}},onRevokeTargetClear:{defaultValue:null,description:"",name:"onRevokeTargetClear",required:!1,type:{name:"() => void"}},onRevokeConfirm:{defaultValue:null,description:"",name:"onRevokeConfirm",required:!1,type:{name:"() => void"}},onRevokeAllRequest:{defaultValue:null,description:"",name:"onRevokeAllRequest",required:!1,type:{name:"() => void"}},onRevokeAllClear:{defaultValue:null,description:"",name:"onRevokeAllClear",required:!1,type:{name:"() => void"}},onRevokeAllConfirm:{defaultValue:null,description:"",name:"onRevokeAllConfirm",required:!1,type:{name:"() => void"}}}}}catch{}const X={title:"Settings/Sessions",component:y,parameters:{layout:"fullscreen"}},v=[{session_id:"sess_1",device_label:"MacBook Pro · Chrome 120",user_agent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",ip:"192.0.2.1",last_seen_at:"2026-04-28T10:00:00Z",location:"San Francisco, US",is_current:!0},{session_id:"sess_2",device_label:"iPhone 15 · Safari 17",user_agent:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",ip:"198.51.100.5",last_seen_at:"2026-04-27T18:30:00Z",location:"New York, US",is_current:!1},{session_id:"sess_3",device_label:"Windows · Firefox 122",user_agent:"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",ip:"203.0.113.42",last_seen_at:"2026-04-26T09:15:00Z",location:"London, UK",is_current:!1}],i={args:{sessions:v,busy:null,toast:null,revokeTarget:null,showRevokeAll:!1}},r={args:{sessions:v,busy:null,toast:null,revokeTarget:"sess_2",showRevokeAll:!1},parameters:{docs:{description:{story:"Per-session revoke confirmation modal — `.c-modal` + `.c-backdrop` + `.c-button--destructive` per UI-SPEC AC S-3."}}}},l={args:{sessions:[v[0]],busy:null,toast:null,revokeTarget:null,showRevokeAll:!1},parameters:{docs:{description:{story:"Only the current session — revoke-all row hidden; no other sessions to revoke."}}}},c={args:{sessions:[],busy:null,toast:null,revokeTarget:null,showRevokeAll:!1},parameters:{docs:{description:{story:'Edge case — empty sessions array renders empty-state copy "This is your only active session."'}}}};var g,b,x,f,j;i.parameters={...i.parameters,docs:{...(g=i.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    sessions: sampleSessions,
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false
  }
}`,...(x=(b=i.parameters)==null?void 0:b.docs)==null?void 0:x.source},description:{story:`Default: three sessions, current device marked with .c-status-dot--live +\r
[ok] Active now + .c-badge--success [ok] Current (AC S-2, S-3).`,...(j=(f=i.parameters)==null?void 0:f.docs)==null?void 0:j.description}}};var k,S,w,N,T;r.parameters={...r.parameters,docs:{...(k=r.parameters)==null?void 0:k.docs,source:{originalSource:`{
  args: {
    sessions: sampleSessions,
    busy: null,
    toast: null,
    revokeTarget: 'sess_2',
    showRevokeAll: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Per-session revoke confirmation modal — \`.c-modal\` + \`.c-backdrop\` + \`.c-button--destructive\` per UI-SPEC AC S-3.'
      }
    }
  }
}`,...(w=(S=r.parameters)==null?void 0:S.docs)==null?void 0:w.source},description:{story:`RevokeConfirm: per-session revoke confirmation modal open for sess_2.\r
Shows .c-modal + .c-backdrop + .c-button--destructive "Revoke session" (AC S-3).`,...(T=(N=r.parameters)==null?void 0:N.docs)==null?void 0:T.description}}};var V,C,P,A,z;l.parameters={...l.parameters,docs:{...(V=l.parameters)==null?void 0:V.docs,source:{originalSource:`{
  args: {
    sessions: [sampleSessions[0]],
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Only the current session — revoke-all row hidden; no other sessions to revoke.'
      }
    }
  }
}`,...(P=(C=l.parameters)==null?void 0:C.docs)==null?void 0:P.source},description:{story:`SingleSession: only the current device present.\r
Hides revoke-all row; empty-state copy does not apply (1 session rendered).`,...(z=(A=l.parameters)==null?void 0:A.docs)==null?void 0:z.description}}};var E,q,R,U,D;c.parameters={...c.parameters,docs:{...(E=c.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    sessions: [],
    busy: null,
    toast: null,
    revokeTarget: null,
    showRevokeAll: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case — empty sessions array renders empty-state copy "This is your only active session."'
      }
    }
  }
}`,...(R=(q=c.parameters)==null?void 0:q.docs)==null?void 0:R.source},description:{story:`Empty: sessions array is empty (edge-case defensive handling).\r
Shows "This is your only active session." empty-state copy.`,...(D=(U=c.parameters)==null?void 0:U.docs)==null?void 0:D.description}}};const $=["Default","RevokeConfirm","SingleSession","Empty"];export{i as Default,c as Empty,r as RevokeConfirm,l as SingleSession,$ as __namedExportsOrder,X as default};
