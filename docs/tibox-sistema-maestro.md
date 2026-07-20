# Tibox · Sistema de diseño MAESTRO

> **Un sistema, dos temas, theming por sección y palancas de variación.**
> Sirve para landing pages, secciones del sitio Tibox, portal/apps y presentaciones
> en HTML. La idea: con el mismo sistema, **ninguna página queda igual a otra**.
>
> Este documento es la **capa de decisión** (el "porqué" y las reglas).
> La **capa de implementación** vive en `tibox.css` (clases `.tbx-*`).

---

## 0. Cómo funciona el theming (el mecanismo)

Los colores son **custom properties** que cascadean. Cambiar de tema = cambiar el
atributo `data-tbx-theme` en cualquier contenedor; todo lo que esté dentro hereda
esos tokens. Por eso "tema mixto" no es un tercer tema: es **theming por sección**.

```html
<body class="tbx" data-tbx-theme="dark">      <!-- toda la página oscura -->
  <section data-tbx-theme="dark">  ... </section>
  <section data-tbx-theme="light"> ... </section>  <!-- bloque claro intercalado -->
  <section data-tbx-theme="dark">  ... </section>
</body>
```

Contrato de tokens (en `tibox.css`): tanto `:root` como `[data-tbx-theme="dark"]`
definen el set oscuro, y `[data-tbx-theme="light"]` el claro. Así cualquiera de los
dos se puede **anidar y scopear** a un `<section>`, una tarjeta o un slide.

> Las tablas de contraste aplican **al tema de cada sección**: en un bloque claro,
> valen las reglas del modo claro aunque la página sea mayoritariamente oscura.

---

## 1. Color

### 1.1 Roles (iguales en ambos temas)

| Rol | Significado |
|-----|-------------|
| **Canvas / superficie** | Fondo y tarjetas |
| **Acción (CTA)** | Naranjo / degradado — **solo** botones y llamados a la acción |
| **Acento de sección** | Color que lidera eyebrows, highlights y numerales (palanca de variación) |
| **Interacción** | Links y focus (celeste/azul, estable en toda la marca) |
| **Texto** | Títulos / cuerpo / metadatos |

> Regla inquebrantable en cualquier tema: **naranjo = "haz clic"**. Si no es
> accionable, no se pinta de naranjo.

### 1.2 Tokens — Modo oscuro (default)

```css
:root,[data-tbx-theme="dark"]{
  --tbx-bg:#000310;          /* canvas plano */
  --tbx-surface:#0A1130;
  --tbx-surface-2:#121A40;
  --tbx-border:rgba(255,255,255,.08);
  --tbx-border-accent:rgba(0,209,255,.28);
  --tbx-support:#00D1FF;      /* interacción / focus */
  --tbx-accent:#00D1FF;       /* acento de sección (palanca) */
  --tbx-text:#F4F7FF;
  --tbx-text-muted:#9BA6C4;
  --tbx-text-subtle:#5E6A8A;
}
```

### 1.3 Tokens — Modo claro (no es invertir: es re-decidir contraste)

```css
[data-tbx-theme="light"]{
  --tbx-bg:#F7F7F7;           /* gris muy suave, NO blanco puro */
  --tbx-surface:#FFFFFF;
  --tbx-surface-2:#F0F2F7;
  --tbx-border:rgba(0,18,51,.10);
  --tbx-border-accent:rgba(14,156,220,.45);
  --tbx-support:#0E9CDC;      /* celeste oscurecido para contraste */
  --tbx-accent:#0E9CDC;
  --tbx-text:#001233;         /* navy, NO negro puro */
  --tbx-text-muted:#3C4253;
  --tbx-text-subtle:#66686C;
  color: black;
}
```

Acción y marca **no cambian** entre temas:
```css
:root{
  --tbx-cta:#FF4222;
  --tbx-cta-gradient:linear-gradient(0deg,#FF4222 0%,#EA7E18 100%);
  --tbx-text-on-cta:#FFFFFF;
  --amarillo-tibox:#FFB200; --amarillo-light-tibox:#E8DE03;
}
```

### 1.4 Contraste

| Tema | Par | Veredicto |
|------|-----|-----------|
| Oscuro | texto `#F4F7FF` sobre `#000310` | AAA |
| Oscuro | celeste `#00D1FF` sobre `#000310` | AAA |
| Claro | navy `#001233` sobre `#F7F7F7` | AAA |
| Claro | azul `#0E9CDC` sobre `#F7F7F7` | AA |
| Ambos | blanco sobre naranjo | AA solo en label **bold ≥16px** |

> En modo claro, el celeste `#00D1FF` puro **no** cumple contraste como texto:
> por eso `--tbx-support` baja a `#0E9CDC`. En CTA, si el naranjo sobre fondo claro
> te queda justo, usa el degradado sólido con label blanco bold, o texto navy.

---

## 2. Tipografía (compartida)

- Display + cuerpo: **Titillium Web**. Etiquetas técnicas: **IBM Plex Mono**.
- **Peso máximo 700 (Bold).** Nunca `font-weight: 900`.
- Jerarquía por tamaño + espacio, no por color ni pesos extremos.
- Highlight de titular en `--tbx-accent` (no en naranjo).

| Token | Tamaño | Uso |
|-------|--------|-----|
| display-xl | `clamp(2.7rem,6.5vw,4.8rem)` | Hero |
| display-l | `clamp(1.9rem,4vw,3.05rem)` | Títulos de sección |
| eyebrow (mono) | `.72rem` / tracking `.18em` / UPPERCASE | Etiquetas |
| body | `clamp(1rem,1.15vw,1.16rem)` | Cuerpo |
| ghost | `clamp(6.5rem,15vw,14rem)` | Numeral fantasma |

---

## 3. Layout, efectos y componentes (compartidos)

Geometría, espaciado (ritmo 4/8), hairlines, glow opcional y todos los componentes
están implementados en `tibox.css` y funcionan **igual en ambos temas** porque
referencian tokens. Profundidad por luminosidad de superficie, casi sin sombras,
fondo **plano** (sin retícula).

Componentes clave: botones (`--primary` naranjo = acción, `--secondary`, `--ghost`),
cards, paneles Sí/No, deflist, formularios, tablas, topbar/sidebar, eyebrow, chip,
glow, íconos de línea y logos. Ver `tibox.css`.

---

## 4. Palancas de variación  ⭐ (el corazón del sistema maestro)

Para que dos páginas no se parezcan, cada sección se arma combinando **palancas**.
Todas viven dentro del sistema; cambian el "sabor", no la marca.

### 4.1 Tema de sección — `data-tbx-theme`
`dark` · `light`. Mézclalos para dar ritmo (ver §5).

### 4.2 Acento de sección — `data-tbx-accent`
Cambia el color que lidera eyebrows, highlights y numerales. **No toca el CTA.**
```css
[data-tbx-accent="celeste"]{ --tbx-accent:var(--tbx-support); } /* default */
[data-tbx-accent="ambar"]  { --tbx-accent:var(--amarillo-tibox); }
[data-tbx-accent="naranjo"]{ --tbx-accent:var(--naranjo-tibox); } /* usar con cuidado */
```
> El ámbar da variedad sin gritar; el naranjo como acento solo en secciones donde
> no compita con un CTA cercano.

### 4.3 Densidad — `data-tbx-density`
```css
[data-tbx-density="editorial"]{ --tbx-section-pad:clamp(64px,12vw,150px); } /* landing/presentación */
[data-tbx-density="compact"]  { --tbx-section-pad:clamp(40px,7vw,72px);  } /* portal/app, mucha data */
```

### 4.4 Composición (recetas de armado, no tokens)
- **Hero:** `A` split (texto + tarjeta-logo) · `B` centrado · `C` full-bleed con glow.
- **Cuerpo de sección:** grid de cards numeradas · split Sí/No · feature 2-col · deflist · fila de stats · cita grande.
- **Numerales fantasma:** on / off.
- **Glow de marca:** on / off (clase `.tbx-glow`).

### 4.5 Matriz de variación
Eligiendo **uno de cada palanca** salen decenas de combinaciones distintas y
on-brand. Ejemplos:

| Combinación | Resultado |
|-------------|-----------|
| dark · celeste · editorial · hero B · glow on · ghost on | Landing de marca, impactante |
| light · azul · compact · hero A · glow off · ghost off | Sección de portal, sobria y densa |
| dark · ámbar · editorial · feature 2-col · ghost on | Sección destacada dentro de un landing |
| alterna dark/light · celeste · editorial · full-bleed | Presentación con ritmo slide a slide |

---

## 5. Modos de página (recetas por uso)

### 5.1 Landing page
Densidad `editorial`. Hero `B` o `C` con glow. **Alterna** secciones dark/light para
dar ritmo; acento celeste con **una** sección ámbar de quiebre. Numerales fantasma on.
CTA naranjo, uno primario por vista.

### 5.2 Sección del sitio / portal Tibox
Densidad `compact`. Predominio `light` (lectura larga, formularios, tablas, mucha
data). Acento azul. Menos numerales fantasma; más cards, deflist y tablas. Glow off.

### 5.3 Presentación en HTML
Una sección = un slide, full-bleed, tipografía grande. **Alterna dark/light** entre
slides para que no se vean clonados. Numeral fantasma como número de slide. Glow en
los slides de portada/cierre. Un mensaje por slide.

> Patrón de ritmo sugerido (landing/presentación), para que nada se repita:
> `dark → light → dark(ámbar) → light → dark(cierre con glow)`.

---

## 6. Marca / Logos

Logos Tibox y NOC comparten el mark de gradientes y son **dark-ready**: el texto del
wordmark usa `currentColor`.
- Sección oscura: `color:var(--tbx-text)` → letras claras.
- Sección clara: `color:#001441` (navy) → letras oscuras.
- El mark de gradientes **nunca** se recolorea. Respeta el clear space.



```html
<!-- defs: una vez por documento -->
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="tbg1" gradientUnits="userSpaceOnUse" x1="308.96" y1="-47.8278" x2="341.23" y2="-47.8278" gradientTransform="matrix(1 0 0 -1 0 11.2)">
      <stop offset="0" stop-color="#FF4222"/><stop offset="1" stop-color="#EA7F18"/></linearGradient>
    <linearGradient id="tbg2" gradientUnits="userSpaceOnUse" x1="267.35" y1="-47.8436" x2="299.58" y2="-47.8436" gradientTransform="matrix(1 0 0 -1 0 11.2)">
      <stop offset="0" stop-color="#00D1FF"/><stop offset="1" stop-color="#0E9BDB"/></linearGradient>
    <linearGradient id="tbg3" gradientUnits="userSpaceOnUse" x1="276.6961" y1="-13.6412" x2="331.9964" y2="-13.6412" gradientTransform="matrix(1 0 0 -1 0 11.2)">
      <stop offset="0" stop-color="#FFB200"/><stop offset="1" stop-color="#E9DE03"/></linearGradient>
    <symbol id="tibox-logo" viewBox="0 0 460 83.8">
      <path fill="currentColor" d="M105.8,17.2c-0.2-4.2,3.2-7.8,7.4-8c4.2-0.2,7.8,3.2,8,7.4c0,0.2,0,0.4,0,0.6v55.6c-0.2,4.2-3.7,7.6-8,7.4c-4-0.1-7.3-3.4-7.4-7.4V17.2z"/>
      <path fill="currentColor" d="M168.5,17.8c0-4.2,3.4-7.6,7.6-7.7c0,0,0.1,0,0.1,0h24.7c8,0,14.2,2.2,18.2,6.2c3.2,3.1,4.9,7.4,4.8,11.9v0.2c0,7.9-4.2,12.3-9.2,15c8.1,3.1,13.1,7.8,13.1,17.2v0.2c0,12.8-10.4,19.1-26.1,19.1h-25.5c-4.2,0-7.6-3.3-7.7-7.5c0,0,0-0.1,0-0.1V17.8z M197.6,38.3c6.8,0,11.1-2.2,11.1-7.4v-0.2c0-4.6-3.6-7.2-10.1-7.2h-15.2v14.8H197.6z M201.7,66.4c6.8,0,10.9-2.4,10.9-7.6v-0.2c0-4.7-3.5-7.6-11.4-7.6h-17.7v15.4H201.7z"/>
      <path fill="currentColor" d="M452.2,20.8c1.6-4.1-0.4-8.8-4.6-10.4c-3-1.2-6.4-0.4-8.6,1.9l-21.8,21.8l-21.8-21.8c-3.1-3.1-8.2-3.2-11.4,0c-3.1,3.1-3.2,8.2,0,11.4l21.8,21.8L384,67.3c-3.1,3.1-3.1,8.2,0,11.3c3.1,3.1,8.2,3.1,11.4,0l0,0l21.8-21.8L452.2,20.8z"/>
      <path fill="currentColor" d="M424.3,59.9c0.1,1.9,1,3.7,2.5,5c3,3,9.1,8.9,16.1,15.9c4.3,1,8.6-1.6,9.6-5.9c0.7-2.7-0.2-5.6-2.2-7.6l-18.1-17.9l-5.9,5.8C425.2,56.5,424.4,58.1,424.3,59.9z"/>
      <path fill="currentColor" d="M27,24.3H12.3c-3.9,0-7-3.2-7-7s3.2-7,7-7h44.6c3.9,0,7,3.2,7,7s-3.2,7-7,7H42.2v48.3c0,4.2-3.4,7.6-7.6,7.6S27,76.8,27,72.6L27,24.3z"/>
      <path fill="url(#tbg1)" d="M311,48.5l24.5-13.7c1.9-1.1,4.3-0.4,5.3,1.5c0.3,0.6,0.5,1.2,0.5,1.9v27.6c0,1.4-0.8,2.7-2,3.4l-24.4,14.2c-1.9,1.1-4.3,0.4-5.3-1.5c-0.3-0.6-0.5-1.2-0.5-1.9V51.9C309,50.4,309.8,49.1,311,48.5z"/>
      <path fill="url(#tbg2)" d="M293.7,83.3l-24.4-14.1c-1.2-0.7-1.9-2-2-3.4V38.2c0-2.2,1.7-3.9,3.9-3.9c0.7,0,1.3,0.2,1.9,0.5l24.4,13.7c1.2,0.7,2,2,2,3.4v28.1c0,2.2-1.7,3.9-3.9,3.9C295,83.8,294.3,83.7,293.7,83.3z"/>
      <path fill="url(#tbg3)" d="M306.5,7.7l23.5,13.9c1.9,1.1,2.5,3.5,1.4,5.3c-0.3,0.6-0.8,1.1-1.4,1.4L306.4,42c-1.2,0.7-2.7,0.7-3.9,0l-23.9-14c-1.9-1.1-2.5-3.5-1.4-5.4c0.3-0.6,0.8-1.1,1.4-1.4l23.9-13.6C303.8,7,305.3,7,306.5,7.7z"/>
    </symbol>
  </defs>
</svg>

<!-- usar tantas veces como quieras -->
<svg class="logo" viewBox="0 0 460 83.8" role="img" aria-label="Tibox"><use href="#tibox-logo"/></svg>
```

Archivo a color original: `logo-tibox-color.svg`.



---

## 7. Anti-patrones (cualquier tema)

- ❌ Naranjo en algo que no sea accionable.
- ❌ `font-weight: 900` (máximo 700).
- ❌ Modo claro como inversión mecánica del oscuro (texto negro puro, celeste sin oscurecer).
- ❌ Más de un acento compitiendo en una misma sección.
- ❌ Retícula o líneas de fondo (canvas plano).
- ❌ Sombras pesadas (profundidad por superficie).
- ❌ Cambiar de tema a mitad de sección (el theming va por bloque completo).
- ❌ Quitar el focus visible.

---

## 8. Resumen

> **Un sistema, dos temas, theming por sección.** Mismas reglas de marca,
> tipografía (≤700) y componentes; el fondo y el texto cambian por tema, y se pueden
> **mezclar por bloque**. Las palancas —tema, acento, densidad, composición— se
> combinan para que cada landing, sección o presentación tenga su propia cara sin
> dejar de ser Tibox. Naranjo siempre y solo para la acción.
