import{j as e}from"./jsx-runtime-EKYJJIwR.js";import{r as d}from"./index-CECmVixe.js";import"./_commonjsHelpers-CqkleIqs.js";import"./index-DMNe2g_Q.js";const D="_page_1nr0k_9",T="_contentWrap_1nr0k_2",A="_heroGrid_1nr0k_25",C="_heroCard_1nr0k_38",E="_heroNumber_1nr0k_52",U="_lastUpdated_1nr0k_63",W="_footer_1nr0k_68",Z="_footerLink_1nr0k_73",a={page:D,contentWrap:T,heroGrid:A,heroCard:C,heroNumber:E,lastUpdated:U,footer:W,footerLink:Z};function I(s){if(!s)return"elevated";const t=s.success_rate>1?s.success_rate/100:s.success_rate;return t>=.999&&s.dlq_count===0?"operational":t>=.95?"retrying":"elevated"}function M(s){switch(s){case"operational":return"All systems operational.";case"retrying":return"Some deliveries are being retried.";default:return"Elevated failure rate."}}function O(s){return`${((s>1?s/100:s)*100).toFixed(1)}%`}function $(s){const t=new Date(s);if(Number.isNaN(t.getTime()))return"just now";const r=Math.max(0,Math.round((Date.now()-t.getTime())/1e3));return r<60?`${r}s ago`:`${Math.floor(r/60)}m ago`}const G={operational:{cls:"c-notice c-notice--success",dot:"c-status-dot c-status-dot--live",glyph:"[ok]"},retrying:{cls:"c-notice c-notice--warning",dot:"c-status-dot",glyph:"[warn]"},elevated:{cls:"c-notice c-notice--error",dot:"c-status-dot c-status-dot--error",glyph:"[err]"}};function Q({snapshot:s}={}){const[t,r]=d.useState(s??null),[x,i]=d.useState(s==null?"loading":"ready");async function u(){try{const n=await fetch("/api/public/webhooks/status",{cache:"no-store"});if(!n.ok){i("error");return}const L=await n.json();r(L),i("ready")}catch{i("error")}}d.useEffect(()=>{if(s==null){u();const n=setInterval(u,6e4);return()=>clearInterval(n)}},[s]);const p=I(t),{cls:j,dot:k,glyph:w}=G[p],q=x==="error"?"Elevated failure rate.":M(p),_=(t==null?void 0:t.last_updated)||new Date().toISOString();return e.jsx("main",{className:a.page,children:e.jsx("div",{className:a.contentWrap,children:e.jsxs("div",{className:"c-card","aria-labelledby":"status-heading",children:[e.jsx("h1",{id:"status-heading",children:"Webhook delivery status"}),e.jsx("p",{className:"t-lead",children:"Live metrics for the MarkOS webhook platform. Updated every 60 seconds."}),e.jsxs("div",{className:a.heroGrid,children:[e.jsxs("div",{className:a.heroCard,"aria-label":"Deliveries in the last 24 hours (total_24h)",children:[e.jsx("span",{className:"t-label-caps",children:"Deliveries 24h"}),e.jsx("span",{className:a.heroNumber,children:t?t.total_24h.toLocaleString():"—"})]}),e.jsxs("div",{className:a.heroCard,"aria-label":"Success rate percentage",children:[e.jsx("span",{className:"t-label-caps",children:"Success rate"}),e.jsx("span",{className:a.heroNumber,children:t?O(t.success_rate):"—"})]}),e.jsxs("div",{className:a.heroCard,"aria-label":"Average latency in milliseconds (avg_latency_ms)",children:[e.jsx("span",{className:"t-label-caps",children:"Avg latency"}),e.jsx("span",{className:a.heroNumber,children:t?`${t.avg_latency_ms}ms`:"—"})]}),e.jsxs("div",{className:a.heroCard,"data-dlq":t&&t.dlq_count>0?"alert":void 0,"aria-label":"Dead letter queue count (dlq_count)",children:[e.jsx("span",{className:"t-label-caps",children:"DLQ count"}),e.jsx("span",{className:a.heroNumber,children:t?t.dlq_count.toLocaleString():"—"})]})]}),e.jsxs("div",{className:j,role:"status","aria-live":"polite",children:[e.jsx("span",{className:k,"aria-hidden":"true"}),e.jsx("strong",{children:w})," ",q]}),e.jsx("p",{className:a.lastUpdated,children:e.jsxs("time",{dateTime:_,children:["Last updated ",$(_)]})}),e.jsx("p",{className:a.footer,children:e.jsx("a",{href:"/docs/webhooks",className:a.footerLink,children:"Subscriber? Learn how to configure webhooks."})})]})})})}try{page.displayName="page",page.__docgenInfo={description:"",displayName:"page",props:{snapshot:{defaultValue:null,description:"",name:"snapshot",required:!1,type:{name:"StatusSnapshot"}}}}}catch{}const z={title:"Status/Webhooks",component:Q,parameters:{layout:"fullscreen"}},o={args:{snapshot:{total_24h:12834,success_rate:.999,avg_latency_ms:122,dlq_count:0,last_updated:"2026-04-29T12:00:00Z"}},parameters:{docs:{description:{story:"success_rate >= 0.999 AND dlq_count === 0 → classifyStatus = operational. .c-notice c-notice--success + .c-status-dot--live + [ok] All systems operational."}}}},c={args:{snapshot:{total_24h:8421,success_rate:.97,avg_latency_ms:450,dlq_count:2,last_updated:"2026-04-29T12:00:00Z"}},parameters:{docs:{description:{story:"success_rate >= 0.95 → classifyStatus = retrying. .c-notice c-notice--warning + .c-status-dot (default) + [warn] Some deliveries are being retried."}}}},l={args:{snapshot:{total_24h:4203,success_rate:.88,avg_latency_ms:980,dlq_count:12,last_updated:"2026-04-29T12:00:00Z"}},parameters:{docs:{description:{story:"success_rate < 0.95 → classifyStatus = elevated. .c-notice c-notice--error + .c-status-dot--error + [err] Elevated failure rate. heroCard[data-dlq=alert] DLQ tile shows --color-error border."}}}};var h,m,g;o.parameters={...o.parameters,docs:{...(h=o.parameters)==null?void 0:h.docs,source:{originalSource:`{
  args: {
    snapshot: {
      total_24h: 12834,
      success_rate: 0.999,
      avg_latency_ms: 122,
      dlq_count: 0,
      last_updated: '2026-04-29T12:00:00Z'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'success_rate >= 0.999 AND dlq_count === 0 → classifyStatus = operational. ' + '.c-notice c-notice--success + .c-status-dot--live + [ok] All systems operational.'
      }
    }
  }
}`,...(g=(m=o.parameters)==null?void 0:m.docs)==null?void 0:g.source}}};var y,f,v;c.parameters={...c.parameters,docs:{...(y=c.parameters)==null?void 0:y.docs,source:{originalSource:`{
  args: {
    snapshot: {
      total_24h: 8421,
      success_rate: 0.97,
      avg_latency_ms: 450,
      dlq_count: 2,
      last_updated: '2026-04-29T12:00:00Z'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'success_rate >= 0.95 → classifyStatus = retrying. ' + '.c-notice c-notice--warning + .c-status-dot (default) + [warn] Some deliveries are being retried.'
      }
    }
  }
}`,...(v=(f=c.parameters)==null?void 0:f.docs)==null?void 0:v.source}}};var N,b,S;l.parameters={...l.parameters,docs:{...(N=l.parameters)==null?void 0:N.docs,source:{originalSource:`{
  args: {
    snapshot: {
      total_24h: 4203,
      success_rate: 0.88,
      avg_latency_ms: 980,
      dlq_count: 12,
      last_updated: '2026-04-29T12:00:00Z'
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'success_rate < 0.95 → classifyStatus = elevated. ' + '.c-notice c-notice--error + .c-status-dot--error + [err] Elevated failure rate. ' + 'heroCard[data-dlq=alert] DLQ tile shows --color-error border.'
      }
    }
  }
}`,...(S=(b=l.parameters)==null?void 0:b.docs)==null?void 0:S.source}}};const B=["Operational","Retrying","Elevated"];export{l as Elevated,o as Operational,c as Retrying,B as __namedExportsOrder,z as default};
