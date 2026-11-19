'use client'
import { SHIP_IDS } from '@arena/platform'
import { IMG } from '@/components/ui'
import { B, Linha, Lista, Ordem, P, Quadro, SUAVE, TITULO, type Secao } from './pecas'

/** Manual in English. */
export const SECOES: Secao[] = [
  {
    nome: 'The goal',
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> is a team word game. Each team is the crew of a <B>ship</B> (2 to 4 ships) and everyone looks at the same map of words.
          Hidden behind them are each ship&apos;s <B>treasures</B>, the <B>Open Sea</B> and the dreaded <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Captain">
              One per ship. Sees the map with the card colors and gives the order: one word and a number.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Sailors">
              The rest of the crew. They can&apos;t see the colors: they talk, pick the cards and confirm together.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Admiral">
              Whoever created the room. Sets up, starts, pauses and ends the game, kicks players and can hand over the role.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            The first ship to find all of its treasures wins
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>or the last one left afloat after the Kraken strikes.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'The cards',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>The Sailors only see the words. Only the Captain knows what lies behind each one. When a card is revealed, it shows what it was hiding:</P>
        <Linha img="cartas/rubi.webp" titulo="Your ship's treasure">
          A hit! It counts for you, and the turn goes on while the order still has guesses.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Another ship's treasure">
          The turn ends and the treasure counts for that ship. If it was their last one, <B>they win on the spot</B>!
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Open Sea">
          Nothing here. The turn ends.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          The ship that revealed it <B cor="#5B2A86">sinks</B> and leaves the game. If only one ship is left, it wins.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Treasure of a sunken ship">
          It counts for nobody, and the turn ends.
        </Linha>
        <P tam={16}>
          Every ship has the same number of treasures. The room can give the ship that starts <B>1 extra treasure</B>, to make up for the advantage of
          going first.
        </P>
      </>
    ),
  },
  {
    nome: "The Captain's order",
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRATE" n={3} />
          <P>
            On the ship&apos;s turn, the Captain looks at the map and gives the <B>order</B>: one word that links their treasures and how many cards it links.
            E.g.: PIRATE · 3 for SHIP, PARROT and ISLAND.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              The order must
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Be a single word (letters and hyphens are fine).', 'Have a number from 1 up to the treasures still missing.', 'Be given only on screen: no gestures or spoken hints!']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              Not allowed
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'A word that is on the board.',
                <>The plural or singular of one of them (<B>SHIPS</B> with SHIP on the table).</>,
                <>Containing one of them or being inside one (<B>SEAHORSE</B> with HORSE).</>,
                <>Being too similar to one of them (<B>TREASURY</B> with TREASURE).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Captain's marks">
          While thinking, the Captain can tap their own treasures to mark the ones they want to link. Only Captains see the marks.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Captain's time">
          The room can set a time limit to think. If it runs out before the order, the turn passes to the next ship.
        </Linha>
      </>
    ),
  },
  {
    nome: "The Sailors' turn",
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>With the order on screen, the crew talks it over and picks cards. Only the Sailors of the ship whose turn it is play:</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Select the cards">
          Tap up to N words (N is the order&apos;s number). The selection is shared: everyone sees what the others marked. When the limit is 1, tapping
          another card swaps the choice.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Everyone confirms">
          Cards are only revealed when <B>all Sailors present</B> tap Confirm. They open in the order they were chosen.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. Missing some?">
          If you confirmed fewer cards than the number and they were all your treasures, the turn goes on so you can pick the others.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. Stop early">
          To play it safe, everyone taps End turn. If the Sailors&apos; time runs out, the turn passes on its own.
        </Linha>
        <P tam={16}>Anyone who loses connection stops counting in the vote, so nobody is left waiting.</P>
      </>
    ),
  },
  {
    nome: 'Cannon and victory',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Cannon Shot">
          Got every card of the order right? You earn <B>1 free guess</B> on any card. The clock stops for 5 seconds while the notice is shown. After
          the shot the turn ends, hit or miss. (The room can turn the cannon off.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Sinks the ship that revealed it. It leaves the game and the turn passes to the next ship still sailing.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="How to win">
          The first ship to have all its treasures revealed wins, even if the last one was opened by another ship. If all the others sink, the ship that
          is left wins.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Log, pause and end">
          The Ship&apos;s Log keeps every order and every guess. The Admiral can pause or end the game. At the end, everyone sees the full map and goes back
          to the lobby for a rematch.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Tips and settings',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Pirate tips
          </div>
          <Lista
            itens={[
              'Start with orders of 2 or 3 words: they are safer than trying to link everything.',
              "Captain: before sending the order, check it doesn't lead to the Kraken or the Open Sea.",
              'Sailors: say why you picked each word. The surest one goes first.',
              'When in doubt, End turn: a sure treasure is worth more than sinking the ship.',
              "Keep an eye on the other ships' treasures: opening their last one gives them the win.",
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Room settings
          </div>
          <Lista
            itens={[
              <><B>Presets:</B> Classic, Quick, Chaotic, Relaxed or Custom.</>,
              <><B>Board:</B> automatic or from 5×5 to 10×10. Treasures follow the size, but you can adjust them.</>,
              <><B>Whoever starts</B> can get 1 extra treasure.</>,
              <><B>Captain:</B> drawn at random or chosen by the ship, rotating each game.</>,
              <><B>Time</B> for the Captain and the Sailors, or no clock.</>,
              <><B>Words:</B> General, Sea and Piracy or your own list, in any of the 6 languages.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Only the Admiral changes the settings, with the Edit button in the lobby.</div>
        </Quadro>
      </div>
    ),
  },
]
