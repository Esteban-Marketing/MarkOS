import{j as e}from"./jsx-runtime-D_zvdyIk.js";function he({state:pe,role:a,data:r,error:le}){const ue=()=>{var y,f;switch(pe){case"loading":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("div",{style:{animation:"pulse 2s infinite",background:"#ddd",height:"2rem",borderRadius:"4px",marginBottom:"1rem"}}),e.jsx("div",{style:{animation:"pulse 2s infinite",background:"#ddd",height:"1rem",borderRadius:"4px",width:"80%"}})]});case"empty":return e.jsxs("div",{style:{padding:"2rem",textAlign:"center",color:"#666"},children:[e.jsx("p",{children:"No company profile found. Create one to get started."}),e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Create Company Profile"})]});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{style:{marginBottom:"1rem"},children:r==null?void 0:r.name}),e.jsxs("div",{style:{marginBottom:"1rem"},children:[e.jsxs("p",{children:[e.jsx("strong",{children:"Domain:"})," ",r==null?void 0:r.domain]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Status:"})," ",r==null?void 0:r.status]}),e.jsxs("p",{children:[e.jsx("strong",{children:"Last Updated:"})," ",(y=r==null?void 0:r.updatedBy)==null?void 0:y.name," (",(f=r==null?void 0:r.updatedBy)==null?void 0:f.email,")"]})]}),e.jsx("div",{style:{marginTop:"1rem"},children:(a==="owner"||a==="operator"||a==="strategist")&&e.jsxs(e.Fragment,{children:[e.jsx("button",{style:{marginRight:"0.5rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Edit"}),a==="owner"&&e.jsx("button",{style:{padding:"0.5rem 1rem",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Delete"})]})})]});case"error":return e.jsxs("div",{style:{padding:"2rem",backgroundColor:"#fee2e2",borderRadius:"4px",color:"#991b1b"},children:[e.jsxs("p",{children:[e.jsx("strong",{children:"Error:"})," ",le||"Failed to load company profile"]}),e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Retry"})]});case"unauthorized":return e.jsxs("div",{style:{padding:"2rem",backgroundColor:"#fef3c7",borderRadius:"4px",color:"#92400e"},children:[e.jsx("p",{children:e.jsx("strong",{children:"Authentication Required"})}),e.jsx("p",{children:"You must log in to view this page."})]});case"forbidden":return e.jsxs("div",{style:{padding:"2rem",backgroundColor:"#f3e8ff",borderRadius:"4px",color:"#6b21a8"},children:[e.jsx("p",{children:e.jsx("strong",{children:"Access Denied"})}),e.jsx("p",{children:"You don't have permission to view this page."})]});default:return null}};return e.jsxs("div",{style:{fontFamily:"sans-serif"},children:[e.jsx("h2",{children:"Company Profile"}),ue()]})}const ve={title:"Routes/Company Profile",component:he,parameters:{layout:"fullscreen",viewport:{defaultViewport:"desktop"}},argTypes:{state:{control:"select",options:["loading","empty","success","error","unauthorized","forbidden"],description:"Page state indicating data loading or error conditions"},role:{control:"select",options:["owner","operator","strategist","viewer"],description:"User role determines feature access and button visibility"},theme:{control:"select",options:["default","white-label"],description:"Theme variant for visual consistency validation"}}},n={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"default"}},o={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},s={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},t={args:{state:"error",role:"owner",error:"Failed to load company profile. Please try again later."},parameters:{role:"owner"}},i={args:{state:"unauthorized"}},c={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},d={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner"}},m={args:{state:"success",role:"operator",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"operator"}},p={args:{state:"success",role:"strategist",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"strategist"}},l={args:{state:"success",role:"viewer",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"viewer"}},u={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"default"}},h={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"white-label"}},g={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"mobile"}},v={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"tablet"}},w={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"desktop"}};var C,A,b;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    theme: "default"
  }
}`,...(b=(A=n.parameters)==null?void 0:A.docs)==null?void 0:b.source}}};var x,S,j;o.parameters={...o.parameters,docs:{...(x=o.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(j=(S=o.parameters)==null?void 0:S.docs)==null?void 0:j.source}}};var B,L,k;s.parameters={...s.parameters,docs:{...(B=s.parameters)==null?void 0:B.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(k=(L=s.parameters)==null?void 0:L.docs)==null?void 0:k.source}}};var R,T,V;t.parameters={...t.parameters,docs:{...(R=t.parameters)==null?void 0:R.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "owner",
    error: "Failed to load company profile. Please try again later."
  },
  parameters: {
    role: "owner"
  }
}`,...(V=(T=t.parameters)==null?void 0:T.docs)==null?void 0:V.source}}};var E,D,F;i.parameters={...i.parameters,docs:{...(E=i.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(F=(D=i.parameters)==null?void 0:D.docs)==null?void 0:F.source}}};var P,z,O;c.parameters={...c.parameters,docs:{...(P=c.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(O=(z=c.parameters)==null?void 0:z.docs)==null?void 0:O.source}}};var U,M,W;d.parameters={...d.parameters,docs:{...(U=d.parameters)==null?void 0:U.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner"
  }
}`,...(W=(M=d.parameters)==null?void 0:M.docs)==null?void 0:W.source}}};var Y,_,q;m.parameters={...m.parameters,docs:{...(Y=m.parameters)==null?void 0:Y.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "operator"
  }
}`,...(q=(_=m.parameters)==null?void 0:_.docs)==null?void 0:q.source}}};var N,G,H;p.parameters={...p.parameters,docs:{...(N=p.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "strategist",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "strategist"
  }
}`,...(H=(G=p.parameters)==null?void 0:G.docs)==null?void 0:H.source}}};var I,J,K;l.parameters={...l.parameters,docs:{...(I=l.parameters)==null?void 0:I.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "viewer",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "viewer"
  }
}`,...(K=(J=l.parameters)==null?void 0:J.docs)==null?void 0:K.source}}};var Q,X,Z;u.parameters={...u.parameters,docs:{...(Q=u.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    theme: "default"
  }
}`,...(Z=(X=u.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var $,ee,re;h.parameters={...h.parameters,docs:{...($=h.parameters)==null?void 0:$.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    theme: "white-label"
  }
}`,...(re=(ee=h.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var ae,ne,oe;g.parameters={...g.parameters,docs:{...(ae=g.parameters)==null?void 0:ae.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    viewport: "mobile"
  }
}`,...(oe=(ne=g.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var se,te,ie;v.parameters={...v.parameters,docs:{...(se=v.parameters)==null?void 0:se.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    viewport: "tablet"
  }
}`,...(ie=(te=v.parameters)==null?void 0:te.docs)==null?void 0:ie.source}}};var ce,de,me;w.parameters={...w.parameters,docs:{...(ce=w.parameters)==null?void 0:ce.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner",
    data: {
      id: "company-001",
      name: "Acme Corporation",
      domain: "acme.com",
      description: "Leading provider of innovative solutions",
      status: "active",
      createdAt: "2026-01-15",
      updatedBy: {
        name: "Sarah Chen",
        email: "sarah@acme.com"
      }
    }
  },
  parameters: {
    role: "owner",
    viewport: "desktop"
  }
}`,...(me=(de=w.parameters)==null?void 0:de.docs)==null?void 0:me.source}}};const we=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OwnerAccess","OperatorAccess","StrategistAccess","ViewerAccess","DefaultTheme","WhiteLabelTheme","MobileViewport","TabletViewport","DesktopViewport"];export{u as DefaultTheme,w as DesktopViewport,s as Empty,t as Error,c as Forbidden,o as Loading,g as MobileViewport,m as OperatorAccess,d as OwnerAccess,p as StrategistAccess,n as Success,v as TabletViewport,i as Unauthorized,l as ViewerAccess,h as WhiteLabelTheme,we as __namedExportsOrder,ve as default};
