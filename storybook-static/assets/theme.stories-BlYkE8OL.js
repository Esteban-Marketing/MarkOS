import{j as e}from"./jsx-runtime-EKYJJIwR.js";function X({state:r,role:a}){const Q=()=>{switch(r){case"loading":return e.jsx("div",{style:{padding:"2rem"},children:"Loading theme settings..."});case"empty":return e.jsx("div",{style:{padding:"2rem"},children:"No custom theme configured. Using default theme."});case"success":return e.jsxs("div",{style:{padding:"2rem"},children:[e.jsx("h1",{children:"Theme Settings"}),e.jsxs("div",{style:{marginTop:"1rem"},children:[e.jsx("h2",{children:"Current Theme"}),e.jsxs("div",{style:{display:"flex",gap:"1rem",marginTop:"1rem"},children:[e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#0d9488",borderRadius:"4px",border:"2px solid #ccc"}}),e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#06b6d4",borderRadius:"4px",border:"2px solid #ccc"}}),e.jsx("div",{style:{width:"50px",height:"50px",backgroundColor:"#f5f7fa",borderRadius:"4px",border:"2px solid #ccc"}})]}),e.jsx("p",{style:{marginTop:"1rem"},children:"Primary: #0d9488 • Secondary: #06b6d4 • Canvas: #f5f7fa"}),a==="owner"&&e.jsx("button",{style:{marginTop:"1rem",padding:"0.5rem 1rem",backgroundColor:"#0d9488",color:"white",border:"none",borderRadius:"4px",cursor:"pointer"},children:"Customize Theme"})]})]});case"error":return e.jsx("div",{style:{padding:"2rem",color:"red"},children:"Failed to load theme settings"});case"unauthorized":return e.jsx("div",{style:{padding:"2rem"},children:"Authentication required"});case"forbidden":return e.jsx("div",{style:{padding:"2rem"},children:"Only workspace owners and operators can modify theme settings"});default:return null}};return e.jsx("div",{style:{fontFamily:"sans-serif"},children:Q()})}const re={title:"Routes/Settings - Theme",component:X,parameters:{layout:"fullscreen"}},c={args:{state:"success",role:"owner"},parameters:{role:"owner"}},t={args:{state:"success",role:"operator"},parameters:{role:"operator"}},i={args:{state:"loading",role:"owner"},parameters:{role:"owner"}},d={args:{state:"empty",role:"owner"},parameters:{role:"owner"}},l={args:{state:"error",role:"owner"},parameters:{role:"owner"}},p={args:{state:"unauthorized"}},m={args:{state:"forbidden"}},Y=["--color-surface","--color-surface-raised","--color-surface-overlay","--color-on-surface","--color-on-surface-muted","--color-on-surface-subtle","--color-primary","--color-primary-text","--color-primary-subtle","--color-success","--color-warning","--color-error","--color-info","--color-border","--color-border-strong"],Z=["--space-none","--space-xxs","--space-xs","--space-sm","--space-md","--space-lg","--space-xl","--space-xxl"];function u({theme:r}){return e.jsxs("div",{"data-theme":r,style:{padding:"var(--space-md)",background:"var(--color-surface)"},children:[e.jsxs("h3",{style:{color:"var(--color-on-surface)",fontFamily:"var(--font-mono)",margin:"0 0 var(--space-sm) 0"},children:['data-theme="',r,'"']}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"var(--space-xs)"},children:Y.map(a=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--space-xs)",color:"var(--color-on-surface)"},children:[e.jsx("span",{style:{width:24,height:24,flexShrink:0,background:`var(${a})`,border:"1px solid var(--color-border)",borderRadius:"var(--radius-sm)",display:"inline-block"},"aria-hidden":"true"}),e.jsx("code",{style:{fontFamily:"var(--font-mono)",fontSize:"var(--fs-body-sm)"},children:a})]},a))})]})}const s={render:()=>e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--space-md)"},children:[e.jsx(u,{theme:"dark"}),e.jsx(u,{theme:"light"})]}),parameters:{docs:{description:{story:'Color tokens visualized across both [data-theme="dark"] and [data-theme="light"] cascades. Forced-colors mode (Windows High Contrast) renders surface as Canvas, on-surface as CanvasText, primary as LinkText — verified at runtime via @media (forced-colors: active) cascade in app/tokens.css. Per UI-SPEC T-3.'}}}},n={render:()=>e.jsxs("div",{"data-theme":"dark",style:{padding:"var(--space-lg)",background:"var(--color-surface)"},children:[e.jsx("h3",{style:{color:"var(--color-on-surface)",fontFamily:"var(--font-mono)",margin:"0 0 var(--space-sm) 0"},children:"8px grid (--space-* tokens)"}),e.jsx("div",{style:{display:"grid",gap:"var(--space-sm)"},children:Z.map(r=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"var(--space-md)"},children:[e.jsx("code",{style:{width:140,fontFamily:"var(--font-mono)",color:"var(--color-on-surface-muted)",flexShrink:0},children:r}),e.jsx("div",{style:{width:`var(${r})`,height:24,background:"var(--color-primary)",minWidth:1,border:"1px solid var(--color-border)"},"aria-hidden":"true"})]},r))})]}),parameters:{docs:{description:{story:'8px grid visualization. Every value snaps to 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96 px. Off-grid values are bugs (DESIGN.md "Spacing Scale").'}}}},o={render:()=>e.jsxs("div",{"data-theme":"dark",style:{padding:"var(--space-lg)",background:"var(--color-surface)",display:"grid",gap:"var(--space-md)"},children:[e.jsx("h3",{style:{color:"var(--color-on-surface)",fontFamily:"var(--font-mono)",margin:0},children:"Primitive sampler — styles/components.css"}),e.jsxs("div",{className:"c-card",children:[e.jsx("h4",{style:{margin:"0 0 var(--space-xs) 0"},children:".c-card section"}),e.jsx("p",{style:{margin:0},children:"Default surface-raised card with 1px hairline border."})]}),e.jsxs("div",{style:{display:"flex",gap:"var(--space-xs)",flexWrap:"wrap"},children:[e.jsx("button",{type:"button",className:"c-button c-button--primary",children:"Primary"}),e.jsx("button",{type:"button",className:"c-button c-button--secondary",children:"Secondary"}),e.jsx("button",{type:"button",className:"c-button c-button--tertiary",children:"Tertiary"}),e.jsx("button",{type:"button",className:"c-button c-button--destructive",children:"Destructive"}),e.jsx("button",{type:"button",className:"c-button c-button--icon","aria-label":"Icon action",children:"+"})]}),e.jsxs("div",{className:"c-notice c-notice--success",children:[e.jsx("strong",{children:"[ok]"})," ","Success notice — operation completed."]}),e.jsxs("div",{className:"c-notice c-notice--warning",children:[e.jsx("strong",{children:"[warn]"})," ","Warning notice — action may have side-effects."]}),e.jsxs("div",{className:"c-notice c-notice--error",children:[e.jsx("strong",{children:"[err]"})," ","Error notice — operation failed."]}),e.jsxs("div",{className:"c-notice c-notice--info",children:[e.jsx("strong",{children:"[info]"})," ","Info notice — contextual information."]}),e.jsxs("div",{style:{display:"flex",gap:"var(--space-xs)",flexWrap:"wrap"},children:[e.jsx("span",{className:"c-badge c-badge--success",children:"[ok] Success"}),e.jsx("span",{className:"c-badge c-badge--warning",children:"[warn] Warning"}),e.jsx("span",{className:"c-badge c-badge--error",children:"[err] Error"}),e.jsx("span",{className:"c-badge c-badge--info",children:"[info] Info"})]}),e.jsxs("div",{style:{display:"flex",gap:"var(--space-sm)",alignItems:"center"},children:[e.jsxs("span",{children:[e.jsx("span",{className:"c-status-dot c-status-dot--live","aria-hidden":"true"})," ","live"]}),e.jsxs("span",{children:[e.jsx("span",{className:"c-status-dot","aria-hidden":"true"})," ","default"]}),e.jsxs("span",{children:[e.jsx("span",{className:"c-status-dot c-status-dot--error","aria-hidden":"true"})," ","error"]})]}),e.jsxs("div",{style:{display:"flex",gap:"var(--space-xs)",flexWrap:"wrap"},children:[e.jsx("span",{className:"c-chip",children:".c-chip default"}),e.jsx("span",{className:"c-chip c-chip--warning",children:"[warn] chip"}),e.jsx("span",{className:"c-chip c-chip--error",children:"[err] chip"}),e.jsx("span",{className:"c-chip-protocol",children:"[task_xxx]"})]}),e.jsxs("div",{className:"c-field",children:[e.jsx("label",{className:"c-field__label",htmlFor:"sampler-input",children:".c-field label"}),e.jsx("input",{id:"sampler-input",type:"text",className:"c-input",placeholder:"placeholder text"}),e.jsx("span",{className:"c-field__help",children:".c-field__help text"})]}),e.jsx("code",{className:"c-code-inline",children:"c-code-inline"})]}),parameters:{docs:{description:{story:"One of each .c-* primitive on a single canvas. The canonical contributor visual diagnostic for styles/components.css."}}}};var g,h,v;c.parameters={...c.parameters,docs:{...(g=c.parameters)==null?void 0:g.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(v=(h=c.parameters)==null?void 0:h.docs)==null?void 0:v.source}}};var x,f,y;t.parameters={...t.parameters,docs:{...(x=t.parameters)==null?void 0:x.docs,source:{originalSource:`{
  args: {
    state: "success",
    role: "operator"
  },
  parameters: {
    role: "operator"
  }
}`,...(y=(f=t.parameters)==null?void 0:f.docs)==null?void 0:y.source}}};var b,j,N;i.parameters={...i.parameters,docs:{...(b=i.parameters)==null?void 0:b.docs,source:{originalSource:`{
  args: {
    state: "loading",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(N=(j=i.parameters)==null?void 0:j.docs)==null?void 0:N.source}}};var w,k,S;d.parameters={...d.parameters,docs:{...(w=d.parameters)==null?void 0:w.docs,source:{originalSource:`{
  args: {
    state: "empty",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(S=(k=d.parameters)==null?void 0:k.docs)==null?void 0:S.source}}};var C,T,E;l.parameters={...l.parameters,docs:{...(C=l.parameters)==null?void 0:C.docs,source:{originalSource:`{
  args: {
    state: "error",
    role: "owner"
  },
  parameters: {
    role: "owner"
  }
}`,...(E=(T=l.parameters)==null?void 0:T.docs)==null?void 0:E.source}}};var P,_,I;p.parameters={...p.parameters,docs:{...(P=p.parameters)==null?void 0:P.docs,source:{originalSource:`{
  args: {
    state: "unauthorized"
  }
}`,...(I=(_=p.parameters)==null?void 0:_.docs)==null?void 0:I.source}}};var F,O,W;m.parameters={...m.parameters,docs:{...(F=m.parameters)==null?void 0:F.docs,source:{originalSource:`{
  args: {
    state: "forbidden"
  }
}`,...(W=(O=m.parameters)==null?void 0:O.docs)==null?void 0:W.source}}};var z,D,R,A,L;s.parameters={...s.parameters,docs:{...(z=s.parameters)==null?void 0:z.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "var(--space-md)"
  }}>\r
      <ColorPanel theme="dark" />\r
      <ColorPanel theme="light" />\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: 'Color tokens visualized across both [data-theme="dark"] and [data-theme="light"] cascades. Forced-colors mode (Windows High Contrast) renders surface as Canvas, on-surface as CanvasText, primary as LinkText — verified at runtime via @media (forced-colors: active) cascade in app/tokens.css. Per UI-SPEC T-3.'
      }
    }
  }
}`,...(R=(D=s.parameters)==null?void 0:D.docs)==null?void 0:R.source},description:{story:`Color tokens visualized across both [data-theme="dark"] and [data-theme="light"] cascades.\r

Forced-colors mode (Windows High Contrast) renders surface as Canvas, on-surface as CanvasText,\r
primary as LinkText — verified at runtime via @media (forced-colors: active) cascade in\r
app/tokens.css. Per UI-SPEC T-3.`,...(L=(A=s.parameters)==null?void 0:A.docs)==null?void 0:L.description}}};var U,G,H,K,$;n.parameters={...n.parameters,docs:{...(U=n.parameters)==null?void 0:U.docs,source:{originalSource:`{
  render: () => <div data-theme="dark" style={{
    padding: "var(--space-lg)",
    background: "var(--color-surface)"
  }}>\r
      <h3 style={{
      color: "var(--color-on-surface)",
      fontFamily: "var(--font-mono)",
      margin: "0 0 var(--space-sm) 0"
    }}>\r
        8px grid (--space-* tokens)\r
      </h3>\r
      <div style={{
      display: "grid",
      gap: "var(--space-sm)"
    }}>\r
        {SPACE_TOKENS.map(token => <div key={token} style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)"
      }}>\r
            <code style={{
          width: 140,
          fontFamily: "var(--font-mono)",
          color: "var(--color-on-surface-muted)",
          flexShrink: 0
        }}>\r
              {token}\r
            </code>\r
            <div style={{
          width: \`var(\${token})\`,
          height: 24,
          background: "var(--color-primary)",
          minWidth: 1,
          border: "1px solid var(--color-border)"
        }} aria-hidden="true" />\r
          </div>)}\r
      </div>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "8px grid visualization. Every value snaps to 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96 px. Off-grid values are bugs (DESIGN.md \\"Spacing Scale\\")."
      }
    }
  }
}`,...(H=(G=n.parameters)==null?void 0:G.docs)==null?void 0:H.source},description:{story:`8px grid visualization showing all --space-* token steps.\r

Every value snaps to 0 / 2 / 8 / 16 / 24 / 32 / 48 / 96 px.\r
Off-grid values are bugs per DESIGN.md "Spacing Scale".`,...($=(K=n.parameters)==null?void 0:K.docs)==null?void 0:$.description}}};var V,q,B,J,M;o.parameters={...o.parameters,docs:{...(V=o.parameters)==null?void 0:V.docs,source:{originalSource:`{
  render: () => <div data-theme="dark" style={{
    padding: "var(--space-lg)",
    background: "var(--color-surface)",
    display: "grid",
    gap: "var(--space-md)"
  }}>\r
      <h3 style={{
      color: "var(--color-on-surface)",
      fontFamily: "var(--font-mono)",
      margin: 0
    }}>\r
        Primitive sampler — styles/components.css\r
      </h3>\r
\r
      <div className="c-card">\r
        <h4 style={{
        margin: "0 0 var(--space-xs) 0"
      }}>.c-card section</h4>\r
        <p style={{
        margin: 0
      }}>Default surface-raised card with 1px hairline border.</p>\r
      </div>\r
\r
      <div style={{
      display: "flex",
      gap: "var(--space-xs)",
      flexWrap: "wrap"
    }}>\r
        <button type="button" className="c-button c-button--primary">Primary</button>\r
        <button type="button" className="c-button c-button--secondary">Secondary</button>\r
        <button type="button" className="c-button c-button--tertiary">Tertiary</button>\r
        <button type="button" className="c-button c-button--destructive">Destructive</button>\r
        <button type="button" className="c-button c-button--icon" aria-label="Icon action">+</button>\r
      </div>\r
\r
      <div className="c-notice c-notice--success">\r
        <strong>[ok]</strong>{" "}Success notice — operation completed.\r
      </div>\r
      <div className="c-notice c-notice--warning">\r
        <strong>[warn]</strong>{" "}Warning notice — action may have side-effects.\r
      </div>\r
      <div className="c-notice c-notice--error">\r
        <strong>[err]</strong>{" "}Error notice — operation failed.\r
      </div>\r
      <div className="c-notice c-notice--info">\r
        <strong>[info]</strong>{" "}Info notice — contextual information.\r
      </div>\r
\r
      <div style={{
      display: "flex",
      gap: "var(--space-xs)",
      flexWrap: "wrap"
    }}>\r
        <span className="c-badge c-badge--success">[ok] Success</span>\r
        <span className="c-badge c-badge--warning">[warn] Warning</span>\r
        <span className="c-badge c-badge--error">[err] Error</span>\r
        <span className="c-badge c-badge--info">[info] Info</span>\r
      </div>\r
\r
      <div style={{
      display: "flex",
      gap: "var(--space-sm)",
      alignItems: "center"
    }}>\r
        <span>\r
          <span className="c-status-dot c-status-dot--live" aria-hidden="true" />{" "}live\r
        </span>\r
        <span>\r
          <span className="c-status-dot" aria-hidden="true" />{" "}default\r
        </span>\r
        <span>\r
          <span className="c-status-dot c-status-dot--error" aria-hidden="true" />{" "}error\r
        </span>\r
      </div>\r
\r
      <div style={{
      display: "flex",
      gap: "var(--space-xs)",
      flexWrap: "wrap"
    }}>\r
        <span className="c-chip">.c-chip default</span>\r
        <span className="c-chip c-chip--warning">[warn] chip</span>\r
        <span className="c-chip c-chip--error">[err] chip</span>\r
        <span className="c-chip-protocol">[task_xxx]</span>\r
      </div>\r
\r
      <div className="c-field">\r
        <label className="c-field__label" htmlFor="sampler-input">.c-field label</label>\r
        <input id="sampler-input" type="text" className="c-input" placeholder="placeholder text" />\r
        <span className="c-field__help">.c-field__help text</span>\r
      </div>\r
\r
      <code className="c-code-inline">c-code-inline</code>\r
    </div>,
  parameters: {
    docs: {
      description: {
        story: "One of each .c-* primitive on a single canvas. The canonical contributor visual diagnostic for styles/components.css."
      }
    }
  }
}`,...(B=(q=o.parameters)==null?void 0:q.docs)==null?void 0:B.source},description:{story:`One of each .c-* primitive on a single canvas.\r

The canonical contributor visual diagnostic for styles/components.css.\r
Demonstrates token-system contract via DESIGN.md v1.1.0 primitives.`,...(M=(J=o.parameters)==null?void 0:J.docs)==null?void 0:M.description}}};const ae=["OwnerAccess","OperatorAccess","Loading","Empty","Error","Unauthorized","ViewerForbidden","ColorTokens","SpacingTokens","PrimitiveSampler"];export{s as ColorTokens,d as Empty,l as Error,i as Loading,t as OperatorAccess,c as OwnerAccess,o as PrimitiveSampler,n as SpacingTokens,p as Unauthorized,m as ViewerForbidden,ae as __namedExportsOrder,re as default};
