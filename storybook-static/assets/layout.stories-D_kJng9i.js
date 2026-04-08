import{R as e}from"./index-ZH-6pyQh.js";import"./_commonjsHelpers-CqkleIqs.js";const i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),d=` 	
\r=`.split("");(()=>{const n=new Array(128);for(let t=0;t<n.length;t+=1)n[t]=-1;for(let t=0;t<d.length;t+=1)n[d[t].charCodeAt(0)]=-2;for(let t=0;t<i.length;t+=1)n[i[t].charCodeAt(0)]=t;return n})();var s={};if(typeof process<"u"&&(s!=null&&s.npm_package_name)){const n=s.npm_package_name;["@supabase/auth-helpers-nextjs","@supabase/auth-helpers-react","@supabase/auth-helpers-remix","@supabase/auth-helpers-sveltekit"].includes(n)&&console.warn(`
╔════════════════════════════════════════════════════════════════════════════╗
║ ⚠️  IMPORTANT: Package Consolidation Notice                                ║
║                                                                            ║
║ The ${n.padEnd(35)} package name is deprecated.  ║
║                                                                            ║
║ You are now using @supabase/ssr - a unified solution for all frameworks.  ║
║                                                                            ║
║ The auth-helpers packages have been consolidated into @supabase/ssr       ║
║ to provide better maintenance and consistent APIs across frameworks.      ║
║                                                                            ║
║ Please update your package.json to use @supabase/ssr directly:            ║
║   npm uninstall ${n.padEnd(42)} ║
║   npm install @supabase/ssr                                               ║
║                                                                            ║
║ For more information, visit:                                              ║
║ https://supabase.com/docs/guides/auth/server-side                         ║
╚════════════════════════════════════════════════════════════════════════════╝
    `)}const b="_page_1uf2p_1",g="_shell_1uf2p_19",k="_sidebar_1uf2p_35",v="_brandLockup_1uf2p_51",y="_brandTitle_1uf2p_63",T="_brandText_1uf2p_79",E="_tenantPill_1uf2p_91",N="_tenantLabel_1uf2p_115",L="_nav_1uf2p_123",w="_navList_1uf2p_133",P="_navLink_1uf2p_149",S="_content_1uf2p_185",x="_heroCard_1uf2p_195",C="_eyebrow_1uf2p_211",I="_previewTitle_1uf2p_229",M="_previewText_1uf2p_243",A="_deniedPage_1uf2p_275",O="_deniedCard_1uf2p_297",R="_deniedTitle_1uf2p_315",D="_deniedText_1uf2p_329",a={page:b,shell:g,sidebar:k,brandLockup:v,brandTitle:y,brandText:T,tenantPill:E,tenantLabel:N,nav:L,navList:w,navLink:P,content:S,heroCard:x,eyebrow:C,previewTitle:I,previewText:M,deniedPage:A,deniedCard:O,deniedTitle:R,deniedText:D},U=[{href:"/markos",label:"Dashboard",route:"dashboard"},{href:"/markos/operations",label:"Operations",route:"operations"},{href:"/markos/crm",label:"CRM",route:"crm"},{href:"/markos/company",label:"Company",route:"company"},{href:"/markos/mir",label:"MIR",route:"mir"},{href:"/markos/msp",label:"MSP",route:"msp"},{href:"/markos/icps",label:"ICPs",route:"icps"},{href:"/markos/segments",label:"Segments",route:"segments"},{href:"/markos/campaigns",label:"Campaigns",route:"campaigns"},{href:"/markos/settings/theme",label:"Settings",route:"settings"}];function j(){return e.createElement("main",{className:a.deniedPage},e.createElement("section",{className:a.deniedCard},e.createElement("p",{className:a.eyebrow},"Protected workspace route"),e.createElement("h1",{className:a.deniedTitle},"Access Denied"),e.createElement("p",{className:a.deniedText},"Unable to establish tenant context. Please sign in again.")))}function c({tenantId:n,children:t}){return e.createElement("main",{className:a.page},e.createElement("div",{className:a.shell},e.createElement("aside",{className:a.sidebar},e.createElement("div",{className:a.brandLockup},e.createElement("h1",{className:a.brandTitle},"MarkOS"),e.createElement("p",{className:a.brandText},"UI Control Plane"),e.createElement("div",{className:a.tenantPill},e.createElement("span",{className:a.tenantLabel},"Tenant context"),e.createElement("span",null,n))),e.createElement("nav",{className:a.nav},e.createElement("ul",{className:a.navList},U.map(l=>e.createElement("li",{key:l.href},e.createElement("a",{className:a.navLink,href:l.href},l.label)))))),e.createElement("section",{className:a.content},t)))}try{c.displayName="MarkOSLayoutShell",c.__docgenInfo={description:"",displayName:"MarkOSLayoutShell",props:{tenantId:{defaultValue:null,description:"",name:"tenantId",required:!0,type:{name:"string"}}}}}catch{}try{layout.displayName="layout",layout.__docgenInfo={description:"",displayName:"layout",props:{}}}catch{}function B({tenantId:n,denied:t}){return t?e.createElement(j,null):e.createElement(c,{tenantId:n},e.createElement("section",{className:a.heroCard},e.createElement("p",{className:a.eyebrow},"Milestone workspace shell"),e.createElement("h2",{className:a.previewTitle},"Milestone UI Shell Preview"),e.createElement("p",{className:a.previewText},"Protected MarkOS shell with resolved tenant context and milestone navigation.")))}const F={title:"Routes/MarkOS Layout",component:B,parameters:{layout:"fullscreen"}},r={args:{tenantId:"tenant-alpha-001",denied:!1}},o={args:{tenantId:"tenant-alpha-001",denied:!0}};var p,m,u;r.parameters={...r.parameters,docs:{...(p=r.parameters)==null?void 0:p.docs,source:{originalSource:`{
  args: {
    tenantId: "tenant-alpha-001",
    denied: false
  }
}`,...(u=(m=r.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};var _,h,f;o.parameters={...o.parameters,docs:{...(_=o.parameters)==null?void 0:_.docs,source:{originalSource:`{
  args: {
    tenantId: "tenant-alpha-001",
    denied: true
  }
}`,...(f=(h=o.parameters)==null?void 0:h.docs)==null?void 0:f.source}}};const G=["TenantResolved","AccessDenied"];export{o as AccessDenied,r as TenantResolved,G as __namedExportsOrder,F as default};
