'use client'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Personagem, ShipId } from '@arena/platform'
import { tocar } from '@/lib/sons'
import { useSala } from '@/lib/sala'
import { NoveFatias } from './NoveFatias'
import { BOTOES, CAMPO, MOLDURA, PAINEL_GRANDE, PLACA, type CorBotao } from './fatias'

export type { CorBotao }

export const IMG = '/img'

// ---------------------------------------------------------------- palco

/** Palco fixo de 1920×1080 (as telas foram desenhadas nesse tamanho), escalado para caber na janela. */
export function Palco({ fundo, escurecer = 0.45, children }: { fundo: string; escurecer?: number; children: ReactNode }) {
  const [escala, setEscala] = useState(1)
  // quanto da janela sobra em volta do palco (em px do palco), para o fundo dos modais cobrir tudo
  const [sobra, setSobra] = useState({ x: 0, y: 0 })
  const animacoes = useSala((s) => s.prefs.animacoes)
  useEffect(() => {
    useSala.getState().carregarPrefs()
  }, [])
  useEffect(() => {
    const f = () => {
      const e = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
      setEscala(e)
      setSobra({ x: Math.max(0, (window.innerWidth / e - 1920) / 2) + 4, y: Math.max(0, (window.innerHeight / e - 1080) / 2) + 4 })
    }
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return (
    <div className={`palco-raiz ${animacoes ? "" : "sem-animacoes"}`} style={{ backgroundImage: `url(${IMG}/fundos/${fundo}.webp)` }}>
      <div className="absolute inset-0" style={{ background: `rgba(10,16,24,${escurecer})` }} />
      <div
        className="palco"
        style={{ transform: `translate(-50%, -50%) scale(${escala})`, ['--sobra-x' as string]: `${sobra.x}px`, ['--sobra-y' as string]: `${sobra.y}px` }}
      >
        {children}
      </div>
    </div>
  )
}

type Pos = { x?: number; y?: number; w?: number; h?: number; style?: CSSProperties; className?: string }

function pos({ x, y, w, h, style }: Pos): CSSProperties {
  return { position: 'absolute', left: x, top: y, width: w, height: h, ...style }
}

export function Caixa(props: Pos & { children?: ReactNode; onClick?: () => void; title?: string }) {
  return (
    <div className={props.className} style={pos(props)} onClick={props.onClick} title={props.title}>
      {props.children}
    </div>
  )
}

export function Texto({
  children,
  tam = 18,
  cor,
  titulo,
  contorno,
  centro,
  peso,
  ...p
}: Pos & { children: ReactNode; tam?: number; cor?: string; titulo?: boolean; contorno?: string | boolean; centro?: boolean; peso?: number }) {
  return (
    <div
      className={`${titulo ? 'lilita' : ''} ${contorno ? 'contorno' : ''} ${p.className ?? ''}`}
      style={{
        ...pos(p),
        fontSize: tam,
        color: cor,
        textAlign: centro ? 'center' : undefined,
        fontWeight: peso ?? (titulo ? 400 : 700),
        lineHeight: 1.2,
        ...(typeof contorno === 'string' ? ({ '--c': contorno } as CSSProperties) : {}),
      }}
    >
      {children}
    </div>
  )
}

/**
 * Entrada animada (fade + deslize). O contêiner não tem tamanho, então não bloqueia
 * cliques: os filhos continuam posicionados em relação ao palco.
 */
export function Entrar({ atraso = 0, de = 'baixo', children }: { atraso?: number; de?: 'baixo' | 'direita' | 'esquerda' | 'cima'; children: ReactNode }) {
  const anim = useSala((s) => s.prefs.animacoes)
  const d = { baixo: { y: 30 }, cima: { y: -30 }, direita: { x: 60 }, esquerda: { x: -60 } }[de]
  return (
    <motion.div
      initial={anim ? { opacity: 0, ...d } : false}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay: atraso, ease: 'easeOut' }}
      style={{ position: 'absolute', left: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

// ---------------------------------------------------------------- molduras

export function Moldura({ children, ...p }: Pos & { children?: ReactNode }) {
  return (
    <div className={`moldura ${p.className ?? ''}`} style={pos(p)}>
      <NoveFatias f={MOLDURA} escala={0.25} img={MOLDURA.src} />
      {children}
    </div>
  )
}

export function PainelGrande({ children, ...p }: Pos & { children?: ReactNode }) {
  return (
    <div className={`painel-grande ${p.className ?? ''}`} style={pos(p)}>
      <NoveFatias f={PAINEL_GRANDE} escala={0.25} img={PAINEL_GRANDE.src} />
      {children}
    </div>
  )
}

export function Placa({ texto, tam = 26, ...p }: Pos & { texto: ReactNode; tam?: number }) {
  return (
    <div className="placa contorno" style={{ ...pos({ h: 76, ...p }), fontSize: tam }}>
      <NoveFatias f={PLACA} escala={(p.h ?? 76) / PLACA.h} img={PLACA.src} />
      <span>{texto}</span>
    </div>
  )
}

// ---------------------------------------------------------------- botões

export const COR_DO_NAVIO: Record<ShipId, CorBotao> = {
  rubi: 'vermelho',
  safira: 'azul',
  esmeralda: 'verde',
  ouro: 'amarelo',
}

function estados(base: string): CSSProperties {
  return {
    '--img': `url(${base}.webp)`,
    '--img-h': `url(${base}-hover.webp)`,
    '--img-p': `url(${base}-pressionado.webp)`,
    '--img-d': `url(${base}-desativado.webp)`,
  } as CSSProperties
}

export function Botao({
  cor = 'verde',
  children,
  onClick,
  disabled,
  tam,
  title,
  ...p
}: Pos & { cor?: CorBotao; children: ReactNode; onClick?: () => void; disabled?: boolean; tam?: number; title?: string }) {
  const h = p.h ?? 80
  const b = BOTOES[cor]
  return (
    <button
      type="button"
      className={`botao ${p.className ?? ""}`}
      disabled={disabled}
      title={title}
      onClick={() => {
        tocar('clique')
        onClick?.()
      }}
      style={{
        ...pos({ ...p, h }),
        ['--img-n' as string]: `url(${IMG}/interface/botoes/${cor}.webp)`,
        ['--img-h' as string]: `url(${IMG}/interface/botoes/${cor}-hover.webp)`,
        ['--img-p' as string]: `url(${IMG}/interface/botoes/${cor}-pressionado.webp)`,
        ['--img-d' as string]: `url(${IMG}/interface/botoes/${cor}-desativado.webp)`,
        fontSize: tam ?? Math.round(h * 0.36),
      }}
    >
      <NoveFatias f={b} escala={h / b.h} />
      <span className="contorno" style={{ ['--c' as string]: '#2B1A0F' }}>
        {children}
      </span>
    </button>
  )
}

/** Botões fixos com texto desenhado (Criar Sala, Entrar na Sala, Sair da Sala, Confirmar…). */
export function BotaoImagem({
  nome,
  onClick,
  disabled,
  title,
  ...p
}: Pos & { nome: string; onClick?: () => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      aria-label={title ?? nome}
      title={title}
      className={`img-botao ${p.className ?? ""}`}
      disabled={disabled}
      onClick={() => {
        tocar('clique')
        onClick?.()
      }}
      style={{ ...pos(p), ...estados(`${IMG}/interface/botoes/${nome}`) }}
    />
  )
}

export type NomeIcone = 'som-ligado' | 'som-desligado' | 'ajuda' | 'fechar' | 'coroa' | 'estrela' | 'jogadores' | 'compartilhar' | 'bussola' | 'ancora' | 'bau' | 'caveira'

/** Ícones redondos com estados (interface/icones). */
export function Icone({ nome, onClick, title, disabled, ...p }: Pos & { nome: NomeIcone; onClick?: () => void; title?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={title ?? nome}
      title={title}
      disabled={disabled}
      className="img-botao"
      onClick={() => {
        tocar('clique')
        onClick?.()
      }}
      style={{ ...pos({ w: 64, h: 66, ...p }), ...estados(`${IMG}/interface/icones/${nome}`) }}
    />
  )
}

export type NomeIconeNovo =
  | 'mais' | 'menos' | 'copiar' | 'link' | 'ampulheta' | 'olho' | 'olho-riscado' | 'canhao'
  | 'mapa' | 'cadeado' | 'embaralhar' | 'visto' | 'play' | 'pausa' | 'sair' | 'engrenagem'

/** Ícones da segunda leva (telas/icones), sem estados: o hover é feito por CSS. */
export function IconeNovo({ nome, onClick, title, disabled, ...p }: Pos & { nome: NomeIconeNovo; onClick?: () => void; title?: string; disabled?: boolean }) {
  const style = { ...pos({ w: 64, h: 64, ...p }), backgroundImage: `url(${IMG}/interface/icones/${nome}.webp)` }
  if (!onClick) return <div className="img-botao" style={style} />
  return (
    <button
      type="button"
      aria-label={title ?? nome}
      title={title}
      disabled={disabled}
      className="img-botao transition hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:grayscale"
      onClick={() => {
        tocar('clique')
        onClick()
      }}
      style={style}
    />
  )
}

// ---------------------------------------------------------------- imagens do jogo

export function avatarSrc(avatar: Personagem, ship: ShipId | null | undefined) {
  return `${IMG}/personagens/${avatar}-${ship ?? 'rubi'}.webp`
}

export function Avatar({
  avatar,
  ship,
  tam = 38,
  apagado,
  cinza,
  title,
  ...p
}: Pos & { avatar: Personagem; ship?: ShipId | null; tam?: number; apagado?: boolean; cinza?: boolean; title?: string }) {
  return (
    <img
      src={avatarSrc(avatar, ship)}
      alt={title ?? ''}
      title={title}
      draggable={false}
      style={{
        ...pos({ w: tam, h: tam, ...p }),
        opacity: apagado ? 0.5 : 1,
        filter: cinza ? 'grayscale(1)' : undefined,
        objectFit: 'contain',
        ...(p.x === undefined && p.y === undefined ? { position: 'relative' } : {}),
      }}
    />
  )
}

/** Avatar dentro da escotilha (Avatar/Escotilha): janela redonda com o rosto e o aro por cima. */
export function Escotilha({
  avatar,
  ship,
  tam = 120,
  selecionado,
  cinza,
  ...p
}: Pos & { avatar: Personagem; ship?: ShipId | null; tam?: number; selecionado?: boolean; cinza?: boolean }) {
  const k = tam / 120
  return (
    <div style={{ ...pos({ w: tam, h: tam, ...p }), filter: cinza ? 'grayscale(1)' : undefined }}>
      {selecionado && (
        <div
          className="pulsar"
          style={{ position: 'absolute', inset: -6 * k, borderRadius: '50%', border: `${5 * k}px solid #FFD24A` }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 18 * k,
          top: 18 * k,
          width: 84 * k,
          height: 84 * k,
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#F3DDB0',
        }}
      >
        <img
          src={avatarSrc(avatar, ship)}
          alt=""
          draggable={false}
          style={{ position: 'absolute', left: -7 * k, top: -6 * k, width: 98 * k, height: 98 * k }}
        />
      </div>
      <img
        src={`${IMG}/interface/molduras/escotilha.webp`}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}

export function Bandeira({ ship, ...p }: Pos & { ship: ShipId }) {
  return <img src={`${IMG}/bandeiras/bandeira-${ship}.webp`} alt="" draggable={false} className={p.className} style={{ ...pos({ w: 64, h: 55, ...p }), objectFit: 'contain' }} />
}

export function Bandeirinha({ ship, ...p }: Pos & { ship: ShipId }) {
  return <img src={`${IMG}/bandeiras/bandeirinha-${ship}.webp`} alt="" draggable={false} style={{ ...pos({ w: 24, h: 20, ...p }), objectFit: 'contain' }} />
}

export function Navio({ ship, afundado, ...p }: Pos & { ship: ShipId; afundado?: boolean }) {
  const src = afundado ? `${IMG}/navios/navio-afundado.webp` : `${IMG}/navios/navio-${ship}.webp`
  return <img src={src} alt="" draggable={false} className={p.className} style={{ ...pos({ w: 104, h: 101, ...p }), objectFit: 'contain' }} />
}

export function Imagem({ src, ...p }: Pos & { src: string }) {
  return <img src={src.startsWith('/') ? src : `${IMG}/${src}`} alt="" draggable={false} className={p.className} style={{ ...pos(p), objectFit: 'contain', pointerEvents: 'none' }} />
}

// ---------------------------------------------------------------- controles

export function Campo({
  valor,
  onChange,
  placeholder,
  erro,
  tam = 22,
  maxLength,
  onEnter,
  autoFocus,
  disabled,
  ...p
}: Pos & {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  erro?: boolean
  tam?: number
  maxLength?: number
  onEnter?: () => void
  autoFocus?: boolean
  disabled?: boolean
}) {
  return (
    <div className={`campo ${erro ? 'erro' : ''}`} style={pos({ h: 64, ...p })}>
      <NoveFatias f={CAMPO} escala={(p.h ?? 64) / CAMPO.h} img={CAMPO.src} />
      <input
        value={valor}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        disabled={disabled}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        style={{ fontSize: tam }}
      />
    </div>
  )
}

export function Interruptor({ ligado, onChange, disabled, ...p }: Pos & { ligado: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={disabled || !onChange}
      onClick={() => onChange?.(!ligado)}
      className="img-botao"
      style={{
        ...pos({ w: 70, h: 38, ...p }),
        backgroundImage: `url(${IMG}/interface/controles/interruptor-${ligado ? 'ligado' : 'desligado'}.webp)`,
        opacity: disabled ? 0.6 : 1,
        // as duas posições já carregadas (senão pisca na primeira troca)
        ['--pre-1' as string]: `url(${IMG}/interface/controles/interruptor-ligado.webp)`,
        ['--pre-2' as string]: `url(${IMG}/interface/controles/interruptor-desligado.webp)`,
      }}
    />
  )
}

export function Marcador({ marcado, onChange, disabled, ...p }: Pos & { marcado: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      disabled={disabled || !onChange}
      onClick={() => onChange?.(!marcado)}
      className="img-botao"
      style={{
        ...pos({ w: 34, h: 34, ...p }),
        backgroundImage: `url(${IMG}/interface/controles/caixa${marcado ? '-marcada' : ''}.webp)`,
        ['--pre-1' as string]: `url(${IMG}/interface/controles/caixa.webp)`,
        ['--pre-2' as string]: `url(${IMG}/interface/controles/caixa-marcada.webp)`,
      }}
    />
  )
}

/** Campo/Número: menos, valor e mais. */
export function Seletor({
  valor,
  min,
  max,
  onChange,
  disabled,
  ...p
}: Pos & { valor: number; min: number; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  const h = p.h ?? 52
  return (
    <div style={pos({ w: h * 3.3, h, ...p })}>
      <IconeNovo nome="menos" x={0} y={0} w={h} h={h} disabled={disabled || valor <= min} onClick={() => onChange(valor - 1)} title="Menos" />
      <div
        className="lilita"
        style={{
          position: 'absolute',
          left: h * 1.08,
          top: h * 0.06,
          width: h * 1.14,
          height: h * 0.88,
          background: '#FFF8EC',
          border: '3px solid #6B3A17',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: h * 0.56,
          color: '#3A1D0C',
        }}
      >
        {valor}
      </div>
      <IconeNovo nome="mais" x={h * 2.3} y={0} w={h} h={h} disabled={disabled || valor >= max} onClick={() => onChange(valor + 1)} title="Mais" />
    </div>
  )
}

/** Pílula marrom com valor (configurações no salão). */
export function Pilula({ children, onClick, ativo, ...p }: Pos & { children: ReactNode; onClick?: () => void; ativo?: boolean }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="lilita"
      style={{
        ...pos({ h: 34, ...p }),
        borderRadius: 8,
        border: `2px solid ${ativo ? '#1E5A1E' : '#3A1D0C'}`,
        background: ativo ? 'linear-gradient(#5DBB4A,#2E8A2A)' : 'linear-gradient(#9A5A2A,#6B3A17)',
        color: '#FFF8EC',
        fontSize: 15,
        boxShadow: 'inset 0 2px 0 rgba(255,255,255,.25), 0 2px 0 rgba(0,0,0,.35)',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

/** Grupo de pílulas grudadas: mostra todas as opções e marca a escolhida de verde. */
export function Segmentado<T extends string | number | null>({
  opcoes,
  valor,
  onChange,
  disabled,
  tam = 15,
  ...p
}: Pos & { opcoes: { v: T; rotulo: ReactNode }[]; valor: T; onChange: (v: T) => void; disabled?: boolean; tam?: number }) {
  const h = p.h ?? 36
  return (
    <div role="radiogroup" style={{ ...pos({ h, ...p }), display: 'flex', opacity: disabled ? 0.55 : 1, filter: disabled ? 'saturate(.5)' : undefined }}>
      {opcoes.map((o, i) => {
        const ativo = o.v === valor
        const primeiro = i === 0
        const ultimo = i === opcoes.length - 1
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={disabled}
            onClick={() => {
              if (ativo) return
              tocar('clique')
              onChange(o.v)
            }}
            className="lilita segmento"
            style={{
              flex: 1,
              height: h,
              minWidth: 0,
              padding: '0 6px',
              marginLeft: primeiro ? 0 : -2,
              borderRadius: `${primeiro ? 9 : 0}px ${ultimo ? 9 : 0}px ${ultimo ? 9 : 0}px ${primeiro ? 9 : 0}px`,
              border: `2px solid ${ativo ? '#1E5A1E' : '#3A1D0C'}`,
              background: ativo ? 'linear-gradient(#5DBB4A,#2E8A2A)' : 'linear-gradient(#9A5A2A,#6B3A17)',
              color: ativo ? '#FFFFFF' : '#F3DDB0',
              fontSize: tam,
              boxShadow: ativo ? 'inset 0 2px 0 rgba(255,255,255,.3)' : 'inset 0 2px 0 rgba(255,255,255,.15), 0 2px 0 rgba(0,0,0,.35)',
              cursor: disabled ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: ativo ? 1 : 0,
            }}
          >
            {o.rotulo}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- modais

export type Deco = { src: string; x: number; y: number; w: number; h: number }

export function Modal({
  titulo,
  w = 760,
  h = 440,
  onFechar,
  children,
  decos = [],
  escurecer = 0.55,
  y,
  fecharNoFundo = true,
}: {
  titulo?: string
  w?: number
  h?: number
  onFechar?: () => void
  children: ReactNode
  decos?: Deco[]
  escurecer?: number
  y?: number
  /** false: clicar no fundo não fecha (formulários longos); Esc e o X continuam fechando */
  fecharNoFundo?: boolean
}) {
  const x = (1920 - w) / 2
  const top = y ?? (1080 - h) / 2
  useEffect(() => {
    if (!onFechar) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onFechar])
  const anim = useSala((s) => s.prefs.animacoes)
  const larguraPlaca = titulo ? Math.max(280, titulo.length * 18 + 120) : 0
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <FundoEscuro opacidade={escurecer} onClick={fecharNoFundo ? onFechar : undefined} />
      <motion.div
        initial={anim ? { opacity: 0, scale: 0.92 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        style={{ position: 'absolute', inset: 0, transformOrigin: `${x + w / 2}px ${top + h / 2}px`, pointerEvents: 'none' }}
      >
        <div style={{ pointerEvents: 'auto' }}>
          <Moldura x={x} y={top} w={w} h={h}>
            <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
          </Moldura>
          {decos.map((d, i) => (
            <Imagem key={i} src={d.src} x={x + d.x} y={top + d.y} w={d.w} h={d.h} />
          ))}
          {onFechar && (
            <button
              type="button"
              aria-label="Fechar"
              className="img-botao"
              onClick={onFechar}
              style={{ left: x + w - 50, top: top - 10, width: 48, height: 48, ...estados(`${IMG}/interface/icones/fechar-modal`) }}
            />
          )}
        </div>
      </motion.div>
      {titulo && (
        <motion.div
          initial={anim ? { y: -60, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: anim ? 0.08 : 0 }}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <Placa texto={titulo} x={x + (w - larguraPlaca) / 2} y={top - 30} w={larguraPlaca} />
        </motion.div>
      )}
    </div>
  )
}

/**
 * Fundo escurecido dos modais. Passa das bordas do palco exatamente o que sobra da janela
 * (--sobra-x/--sobra-y, calculados no Palco), cobrindo a tela toda em qualquer proporção.
 */
export function FundoEscuro({ opacidade = 0.55, onClick, z }: { opacidade?: number; onClick?: () => void; z?: number }) {
  const anim = useSala((s) => s.prefs.animacoes)
  return (
    <motion.div
      className="fundo-escuro"
      initial={anim ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{ background: `rgba(10,16,24,${opacidade})`, zIndex: z }}
    />
  )
}

/** Âncora no canto inferior direito, como no Modal/Informações. */
export const DECO_ANCORA = (w: number, h: number): Deco => ({ src: 'interface/decoracoes/deco-ancora.webp', x: w - 150, y: h - 122, w: 167, h: 134 })

export function Aviso({ texto, tipo = 'info', ...p }: Pos & { texto: ReactNode; tipo?: 'info' | 'erro' }) {
  return (
    <div
      style={{
        ...pos(p),
        background: tipo === 'erro' ? '#FBE3DC' : '#FFF6DF',
        border: `2px solid ${tipo === 'erro' ? '#C2362B' : '#C98A3A'}`,
        borderRadius: 10,
        padding: '8px 14px',
        fontSize: 16,
        fontWeight: 700,
        color: tipo === 'erro' ? '#8A1F17' : '#5A3410',
        lineHeight: 1.3,
      }}
    >
      {texto}
    </div>
  )
}

/** Controle deslizante de 0 a 1 (volume), com trilha de madeira e moeda dourada. */
export function Deslizante({
  valor,
  onChange,
  onSoltar,
  rotulo,
  disabled,
  ...p
}: Pos & { valor: number; onChange: (v: number) => void; onSoltar?: () => void; rotulo: string; disabled?: boolean }) {
  return (
    <input
      type="range"
      className="deslizante"
      min={0}
      max={100}
      step={1}
      value={Math.round(valor * 100)}
      aria-label={rotulo}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      onPointerUp={onSoltar}
      onKeyUp={onSoltar}
      style={{ ...pos({ w: 260, h: 34, ...p }), ['--cheio' as string]: `${Math.round(valor * 100)}%` }}
    />
  )
}
