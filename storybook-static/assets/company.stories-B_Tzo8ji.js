import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";function ge({state:pe,role:a,data:r,error:le}){const ue=()=>{var y,f;switch(pe){case"loading":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("div",{style:{animation:"pulse 2s infinite",background:"#ddd",height:"2rem",borderRadius:"4px",marginBottom:"1rem"}}),e.createElement("div",{style:{animation:"pulse 2s infinite",background:"#ddd",height:"1rem",borderRadius:"4px",width:"80%"}}));case"empty":return e.createElement("div",{style:{padding:"2rem",textAlign:"center",color:"#666"}},e.createElement("p",null,"No company profile found. Create one to get started."),e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Create Company Profile"));case"success":return e.createElement("div",{style:{padding:"2rem"}},e.createElement("h1",{style:{marginBottom:"1rem"}},r==null?void 0:r.name),e.createElement("div",{style:{marginBottom:"1rem"}},e.createElement("p",null,e.createElement("strong",null,"Domain:")," ",r==null?void 0:r.domain),e.createElement("p",null,e.createElement("strong",null,"Status:")," ",r==null?void 0:r.status),e.createElement("p",null,e.createElement("strong",null,"Last Updated:")," ",(y=r==null?void 0:r.updatedBy)==null?void 0:y.name," (",(f=r==null?void 0:r.updatedBy)==null?void 0:f.email,")")),e.createElement("div",{style:{marginTop:"1rem"}},(a==="owner"||a==="operator"||a==="strategist")&&e.createElement(e.Fragment,null,e.createElement("button",{style:{marginRight:"0.5rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Edit"),a==="owner"&&e.createElement("button",{style:{padding:"0.5rem 1rem",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Delete"))));case"error":return e.createElement("div",{style:{padding:"2rem",backgroundColor:"#fee2e2",borderRadius:"4px",color:"#991b1b"}},e.createElement("p",null,e.createElement("strong",null,"Error:")," ",le||"Failed to load company profile"),e.createElement("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#dc2626",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"}},"Retry"));case"unauthorized":return e.createElement("div",{style:{padding:"2rem",backgroundColor:"#fef3c7",borderRadius:"4px",color:"#92400e"}},e.createElement("p",null,e.createElement("strong",null,"Authentication Required")),e.createElement("p",null,"You must log in to view this page."));case"forbidden":return e.createElement("div",{style:{padding:"2rem",backgroundColor:"#f3e8ff",borderRadius:"4px",color:"#6b21a8"}},e.createElement("p",null,e.createElement("strong",null,"Access Denied")),e.createElement("p",null,"You don't have permission to view this page."));default:return null}};return e.createElement("div",{style:{fontFamily:"sans-serif"}},e.createElement("h2",null,"Company Profile"),ue())}const we={title:"Routes/Company Profile",component:ge,parameters:{layout:"fullscreen",viewport:{defaultViewport:"desktop"}},argTypes:{state:{control:"select",options:["loading","empty","success","error","unauthorized","forbidden"],description:"Page state indicating data loading or error conditions"},role:{control:"select",options:["owner","operator","strategist","viewer"],description:"User role determines feature access and button visibility"},theme:{control:"select",options:["default","white-label"],description:"Theme variant for visual consistency validation"}}},n={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"default"}},o={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},t={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},s={args:{state:"error",role:"owner",error:"Failed to load company profile. Please try again later."},parameters:{role:"owner"}},i={args:{state:"unauthorized"}},c={args:{state:"forbidden",role:"viewer"},parameters:{role:"viewer"}},m={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner"}},d={args:{state:"success",role:"operator",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"operator"}},p={args:{state:"success",role:"strategist",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"strategist"}},l={args:{state:"success",role:"viewer",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"viewer"}},u={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"default"}},g={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",theme:"white-label"}},v={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"mobile"}},h={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"tablet"}},w={args:{state:"success",role:"owner",data:{id:"company-001",name:"Acme Corporation",domain:"acme.com",description:"Leading provider of innovative solutions",status:"active",createdAt:"2026-01-15",updatedBy:{name:"Sarah Chen",email:"sarah@acme.com"}}},parameters:{role:"owner",viewport:"desktop"}};var C,A,b;n.parameters={...n.parameters,docs:{...(C=n.parameters)==null?void 0:C.docs,source:{originalSource:`{
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
}`,...(b=(A=n.parameters)==null?void 0:A.docs)==null?void 0:b.source}}};var E,S,B;o.parameters={...o.parameters,docs:{...(E=o.parameters)==null?void 0:E.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(B=(S=o.parameters)==null?void 0:S.docs)==null?void 0:B.source}}};var L,R,k;t.parameters={...t.parameters,docs:{...(L=t.parameters)==null?void 0:L.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(k=(R=t.parameters)==null?void 0:R.docs)==null?void 0:k.source}}};var x,T,V;s.parameters={...s.parameters,docs:{...(x=s.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "owner",
    error: "Failed to load company profile. Please try again later."
  },
  parameters: {
    role: "owner"
  }
}`,...(V=(T=s.parameters)==null?void 0:T.docs)==null?void 0:V.source}}};var D,F,P;i.parameters={...i.parameters,docs:{...(D=i.parameters)==null?void 0:D.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(P=(F=i.parameters)==null?void 0:F.docs)==null?void 0:P.source}}};var z,O,U;c.parameters={...c.parameters,docs:{...(z=c.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    state: "forbidden",
    role: "viewer"
  },
  parameters: {
    role: "viewer"
  }
}`,...(U=(O=c.parameters)==null?void 0:O.docs)==null?void 0:U.source}}};var M,W,Y;m.parameters={...m.parameters,docs:{...(M=m.parameters)==null?void 0:M.docs,source:{originalSource:`{
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
}`,...(Y=(W=m.parameters)==null?void 0:W.docs)==null?void 0:Y.source}}};var _,q,N;d.parameters={...d.parameters,docs:{...(_=d.parameters)==null?void 0:_.docs,source:{originalSource:`{
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
}`,...(N=(q=d.parameters)==null?void 0:q.docs)==null?void 0:N.source}}};var j,G,H;p.parameters={...p.parameters,docs:{...(j=p.parameters)==null?void 0:j.docs,source:{originalSource:`{
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
}`,...(Z=(X=u.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var $,ee,re;g.parameters={...g.parameters,docs:{...($=g.parameters)==null?void 0:$.docs,source:{originalSource:`{
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
}`,...(re=(ee=g.parameters)==null?void 0:ee.docs)==null?void 0:re.source}}};var ae,ne,oe;v.parameters={...v.parameters,docs:{...(ae=v.parameters)==null?void 0:ae.docs,source:{originalSource:`{
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
}`,...(oe=(ne=v.parameters)==null?void 0:ne.docs)==null?void 0:oe.source}}};var te,se,ie;h.parameters={...h.parameters,docs:{...(te=h.parameters)==null?void 0:te.docs,source:{originalSource:`{
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
}`,...(ie=(se=h.parameters)==null?void 0:se.docs)==null?void 0:ie.source}}};var ce,me,de;w.parameters={...w.parameters,docs:{...(ce=w.parameters)==null?void 0:ce.docs,source:{originalSource:`{
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
}`,...(de=(me=w.parameters)==null?void 0:me.docs)==null?void 0:de.source}}};const ye=["Success","Loading","Empty","Error","Unauthorized","Forbidden","OwnerAccess","OperatorAccess","StrategistAccess","ViewerAccess","DefaultTheme","WhiteLabelTheme","MobileViewport","TabletViewport","DesktopViewport"];export{u as DefaultTheme,w as DesktopViewport,t as Empty,s as Error,c as Forbidden,o as Loading,v as MobileViewport,d as OperatorAccess,m as OwnerAccess,p as StrategistAccess,n as Success,h as TabletViewport,i as Unauthorized,l as ViewerAccess,g as WhiteLabelTheme,ye as __namedExportsOrder,we as default};
