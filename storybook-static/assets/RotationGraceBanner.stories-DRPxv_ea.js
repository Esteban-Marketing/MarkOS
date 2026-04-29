import{R as S}from"./RotationGraceBanner-Do38RH6x.js";import"./jsx-runtime-EKYJJIwR.js";const f={title:"Components/RotationGraceBanner",component:S,parameters:{layout:"padded"}},r={id:"r1",subscription_id:"sub-001",url:"https://example.com/webhook",grace_ends_at:"2026-04-28T12:00:00Z",stage:"t-7"},a={args:{rotations:[]}},t={args:{rotations:[{...r,stage:"t-7"}]}},s={args:{rotations:[{...r,stage:"t-1"}]}},o={args:{rotations:[{...r,stage:"t-0"}]}},n={args:{rotations:[{...r,id:"r1",stage:"t-7"},{...r,id:"r2",subscription_id:"sub-002",stage:"t-1"}]}};var e,i,c;a.parameters={...a.parameters,docs:{...(e=a.parameters)==null?void 0:e.docs,source:{originalSource:`{
  args: {
    rotations: []
  }
}`,...(c=(i=a.parameters)==null?void 0:i.docs)==null?void 0:c.source}}};var p,g,m;t.parameters={...t.parameters,docs:{...(p=t.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    rotations: [{
      ...baseRotation,
      stage: "t-7"
    }]
  }
}`,...(m=(g=t.parameters)==null?void 0:g.docs)==null?void 0:m.source}}};var d,u,b;s.parameters={...s.parameters,docs:{...(d=s.parameters)==null?void 0:d.docs,source:{originalSource:`{
  args: {
    rotations: [{
      ...baseRotation,
      stage: "t-1"
    }]
  }
}`,...(b=(u=s.parameters)==null?void 0:u.docs)==null?void 0:b.source}}};var l,R,T;o.parameters={...o.parameters,docs:{...(l=o.parameters)==null?void 0:l.docs,source:{originalSource:`{
  args: {
    rotations: [{
      ...baseRotation,
      stage: "t-0"
    }]
  }
}`,...(T=(R=o.parameters)==null?void 0:R.docs)==null?void 0:T.source}}};var _,W,E;n.parameters={...n.parameters,docs:{...(_=n.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    rotations: [{
      ...baseRotation,
      id: "r1",
      stage: "t-7"
    }, {
      ...baseRotation,
      id: "r2",
      subscription_id: "sub-002",
      stage: "t-1"
    }]
  }
}`,...(E=(W=n.parameters)==null?void 0:W.docs)==null?void 0:E.source}}};const h=["Empty","T7Warning","T1Warning","T0Error","MultiWarning"];export{a as Empty,n as MultiWarning,o as T0Error,s as T1Warning,t as T7Warning,h as __namedExportsOrder,f as default};
