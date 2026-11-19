'use client'
import { SHIP_IDS } from '@arena/platform'
import { IMG } from '@/components/ui'
import { B, Linha, Lista, Ordem, P, Quadro, SUAVE, TITULO, type Secao } from './pecas'

/** Manuale in italiano. */
export const SECOES: Secao[] = [
  {
    nome: "L'obiettivo",
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> è un gioco di parole a squadre. Ogni squadra è l&apos;equipaggio di una <B>nave</B> (da 2 a 4) e tutti guardano la stessa mappa
          di parole. Dietro di esse si nascondono i <B>tesori</B> di ogni nave, il <B>Mare Aperto</B> e il temibile <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Capitano">
              Uno per nave. Vede la mappa con i colori delle carte e dà l&apos;ordine: una parola e un numero.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Marinai">
              Il resto dell&apos;equipaggio. Non vedono i colori: discutono, scelgono le carte e confermano insieme.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Ammiraglio">
              Chi ha creato la stanza. Imposta, avvia, mette in pausa e chiude la partita, espelle e può passare il grado.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            Vince la prima nave che trova tutti i suoi tesori
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>o l&apos;ultima rimasta a galla dopo gli attacchi del Kraken.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'Le carte',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>I Marinai vedono solo le parole. Solo il Capitano sa cosa c&apos;è dietro ognuna. Quando una carta viene rivelata, mostra cosa nascondeva:</P>
        <Linha img="cartas/rubi.webp" titulo="Tesoro della tua nave">
          Colpito! Conta per voi, e il turno continua finché l&apos;ordine ha tentativi.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Tesoro di un'altra nave">
          Il turno finisce e il tesoro conta per quella nave. Se era il suo ultimo, <B>vince subito</B>!
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Mare Aperto">
          Qui non c&apos;è niente. Il turno finisce.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          La nave che l&apos;ha rivelato <B cor="#5B2A86">affonda</B> ed esce dalla partita. Se resta una sola nave, vince.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Tesoro di una nave affondata">
          Non conta per nessuno, e il turno finisce.
        </Linha>
        <P tam={16}>
          Tutte le navi hanno lo stesso numero di tesori. Nella stanza si può decidere che la nave che inizia abbia <B>1 tesoro in più</B>, per compensare il
          vantaggio di partire per prima.
        </P>
      </>
    ),
  },
  {
    nome: "L'ordine del Capitano",
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRATA" n={3} />
          <P>
            Al turno della nave, il Capitano guarda la mappa e dà l&apos;<B>ordine</B>: una parola che collega i suoi tesori e quante carte collega. Es.:
            PIRATA · 3 per NAVE, PAPPAGALLO e ISOLA.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              L&apos;ordine deve
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Essere una sola parola (lettere e trattino valgono).', 'Avere un numero da 1 fino ai tesori che mancano.', 'Essere dato solo sullo schermo: niente gesti o indizi a voce!']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              Non vale
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'Una parola che è sul tabellone.',
                <>Il plurale o il singolare di una di esse (<B>TESORI</B> con TESORO sul tavolo).</>,
                <>Contenerne una o esserne contenuta (<B>PESCESPADA</B> con SPADA).</>,
                <>Essere troppo simile a una di esse (<B>CAVERNOSO</B> con CAVERNA).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Segni del Capitano">
          Mentre pensa, il Capitano può toccare i propri tesori per segnare quelli che vuole collegare. Solo i Capitani vedono i segni.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Tempo del Capitano">
          La stanza può fissare un tempo per pensare. Se finisce prima dell&apos;ordine, il turno passa alla nave successiva.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Il turno dei Marinai',
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>Con l&apos;ordine sullo schermo, l&apos;equipaggio discute e sceglie le carte. Giocano solo i Marinai della nave di turno:</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Selezionate le carte">
          Toccate fino a N parole (N è il numero dell&apos;ordine). La selezione è di tutti: ognuno vede cosa hanno segnato gli altri. Quando il limite è 1,
          toccare un&apos;altra carta cambia la scelta.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Tutti confermano">
          Le carte si rivelano solo quando <B>tutti i Marinai presenti</B> toccano Conferma. Si aprono nell&apos;ordine in cui sono state scelte.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. Ne manca qualcuna?">
          Se avete confermato meno carte del numero ed erano tutte vostri tesori, il turno continua per scegliere le altre.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. Fermarsi prima">
          Per non rischiare, tutti toccano Chiudi turno. Se il tempo dei Marinai finisce, il turno passa da solo.
        </Linha>
        <P tam={16}>Chi perde la connessione smette di contare nella votazione, così nessuno resta ad aspettare.</P>
      </>
    ),
  },
  {
    nome: 'Cannone e vittoria',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Colpo di cannone">
          Avete indovinato tutte le carte dell&apos;ordine? Guadagnate <B>1 tentativo libero</B> su qualsiasi carta. L&apos;orologio si ferma per 5 secondi mentre
          appare l&apos;avviso. Dopo il colpo il turno finisce, centrato o no. (La stanza può disattivare il cannone.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Affonda la nave che l&apos;ha rivelato. Esce dalla partita e il turno passa alla prossima nave ancora in mare.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="Come vincere">
          Vince la prima nave con tutti i tesori rivelati, anche se l&apos;ultimo è stato aperto da un&apos;altra nave. Se tutte le altre affondano, vince la nave
          rimasta.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Diario, pausa e fine">
          Il Diario di bordo conserva ogni ordine e ogni tentativo. L&apos;Ammiraglio può mettere in pausa o chiudere la partita. Alla fine tutti vedono la mappa
          completa e tornano al salone per la rivincita.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Consigli e opzioni',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Consigli da pirata
          </div>
          <Lista
            itens={[
              'Iniziate con ordini da 2 o 3 parole: sono più sicuri che collegare tutto.',
              'Capitano: prima di dare l’ordine, controlla che non porti al Kraken o al Mare Aperto.',
              'Marinai: dite perché scegliete ogni parola. La più sicura va per prima.',
              'Nel dubbio, Chiudi turno: un tesoro sicuro vale più di una nave affondata.',
              'Tenete d’occhio i tesori delle altre navi: aprire il loro ultimo regala loro la vittoria.',
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Opzioni della stanza
          </div>
          <Lista
            itens={[
              <><B>Serie:</B> partita singola, al meglio di 3 o di 5, con punteggio per nave.</>,
              <><B>Tabellone:</B> automatico o da 5×5 a 10×10. I tesori seguono la dimensione, ma si possono regolare.</>,
              <><B>Chi inizia</B> può avere 1 tesoro in più.</>,
              <><B>Capitano:</B> sorteggiato o scelto dalla nave, a rotazione a ogni partita.</>,
              <><B>Tempo</B> del Capitano e dei Marinai, o senza orologio.</>,
              <><B>Parole:</B> 17 categorie (Film, Videogiochi, Cibo, Animali…) mescolate in parti uguali, o una tua lista, in una delle 6 lingue.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Solo l’Ammiraglio cambia le opzioni, con il pulsante Modifica nel salone. Ripristina predefiniti riporta i valori iniziali.</div>
        </Quadro>
      </div>
    ),
  },
]
