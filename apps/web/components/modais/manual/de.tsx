'use client'
import { SHIP_IDS } from '@arena/platform'
import { IMG } from '@/components/ui'
import { B, Linha, Lista, Ordem, P, Quadro, SUAVE, TITULO, type Secao } from './pecas'

/** Anleitung auf Deutsch. */
export const SECOES: Secao[] = [
  {
    nome: 'Das Ziel',
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> ist ein Wortspiel in Teams. Jedes Team ist die Crew eines <B>Schiffs</B> (2 bis 4) und alle sehen dieselbe Karte voller
          Wörter. Dahinter verstecken sich die <B>Schätze</B> jedes Schiffs, die <B>offene See</B> und der gefürchtete <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Kapitän">
              Einer pro Schiff. Sieht die Karte mit den Farben und gibt den Befehl: ein Wort und eine Zahl.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Matrosen">
              Der Rest der Crew. Sie sehen keine Farben: Sie beraten, wählen die Karten und bestätigen gemeinsam.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Admiral">
              Wer den Raum erstellt hat. Stellt ein, startet, pausiert und beendet das Spiel, wirft raus und kann den Rang abgeben.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            Es gewinnt das erste Schiff, das alle seine Schätze findet
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>oder das letzte, das nach den Angriffen des Kraken noch schwimmt.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'Die Karten',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>Die Matrosen sehen nur die Wörter. Nur der Kapitän weiß, was hinter jedem steckt. Wird eine Karte aufgedeckt, zeigt sie, was sie verbarg:</P>
        <Linha img="cartas/rubi.webp" titulo="Schatz deines Schiffs">
          Treffer! Er zählt für euch, und der Zug geht weiter, solange der Befehl noch Tipps hat.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Schatz eines anderen Schiffs">
          Der Zug endet und der Schatz zählt für dieses Schiff. War es sein letzter, <B>gewinnt es sofort</B>!
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Offene See">
          Hier ist nichts. Der Zug endet.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          Das Schiff, das ihn aufgedeckt hat, <B cor="#5B2A86">sinkt</B> und scheidet aus. Bleibt nur ein Schiff übrig, gewinnt es.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Schatz eines gesunkenen Schiffs">
          Er zählt für niemanden, und der Zug endet.
        </Linha>
        <P tam={16}>
          Alle Schiffe haben gleich viele Schätze. Im Raum kann man einstellen, dass das Startschiff <B>1 Schatz mehr</B> bekommt, um den Vorteil des ersten
          Zugs auszugleichen.
        </P>
      </>
    ),
  },
  {
    nome: 'Der Befehl',
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRAT" n={3} />
          <P>
            Ist das Schiff am Zug, schaut der Kapitän auf die Karte und gibt den <B>Befehl</B>: ein Wort, das seine Schätze verbindet, und wie viele Karten es
            verbindet. Z. B.: PIRAT · 3 für SCHIFF, PAPAGEI und INSEL.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              Der Befehl muss
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Ein einziges Wort sein (Buchstaben und Bindestrich erlaubt).', 'Eine Zahl von 1 bis zu den fehlenden Schätzen haben.', 'Nur über den Bildschirm kommen: keine Gesten oder gesprochenen Tipps!']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              Nicht erlaubt
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'Ein Wort, das auf dem Spielfeld liegt.',
                <>Plural oder Singular eines davon (<B>SCHÄTZE</B> mit SCHATZ auf dem Tisch).</>,
                <>Eines davon enthalten oder darin stecken (<B>SEEPFERD</B> mit PFERD).</>,
                <>Einem davon zu ähnlich sein (<B>MATROSIN</B> mit MATROSE).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Markierungen">
          Beim Nachdenken kann der Kapitän seine eigenen Schätze antippen, um die zu markieren, die er verbinden will. Nur Kapitäne sehen die Markierungen.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Zeit des Kapitäns">
          Der Raum kann eine Bedenkzeit festlegen. Läuft sie vor dem Befehl ab, geht der Zug an das nächste Schiff.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Zug der Matrosen',
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>Mit dem Befehl auf dem Bildschirm berät die Crew und wählt die Karten. Nur die Matrosen des Schiffs am Zug spielen:</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Karten auswählen">
          Tippt bis zu N Wörter an (N ist die Zahl des Befehls). Die Auswahl ist gemeinsam: Jeder sieht, was die anderen markiert haben. Ist das Limit 1,
          wechselt das Antippen einer anderen Karte die Wahl.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Alle bestätigen">
          Die Karten werden erst aufgedeckt, wenn <B>alle anwesenden Matrosen</B> auf Bestätigen tippen. Sie öffnen sich in der gewählten Reihenfolge.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. Fehlt noch etwas?">
          Habt ihr weniger Karten als die Zahl bestätigt und waren alle eure Schätze, geht der Zug weiter, um die übrigen zu wählen.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. Früher aufhören">
          Um nichts zu riskieren, tippen alle auf Zug beenden. Läuft die Zeit der Matrosen ab, geht der Zug von selbst weiter.
        </Linha>
        <P tam={16}>Wer die Verbindung verliert, zählt bei der Abstimmung nicht mehr mit, damit niemand warten muss.</P>
      </>
    ),
  },
  {
    nome: 'Kanone und Sieg',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Kanonenschuss">
          Alle Karten des Befehls getroffen? Ihr bekommt <B>1 freien Tipp</B> auf eine beliebige Karte. Die Uhr steht 5 Sekunden still, während der Hinweis
          erscheint. Nach dem Schuss endet der Zug, Treffer oder nicht. (Der Raum kann die Kanone abschalten.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Versenkt das Schiff, das ihn aufgedeckt hat. Es scheidet aus und der Zug geht an das nächste Schiff, das noch segelt.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="So gewinnt man">
          Es gewinnt das erste Schiff, dessen Schätze alle aufgedeckt sind, auch wenn der letzte von einem anderen Schiff geöffnet wurde. Sinken alle
          anderen, gewinnt das verbliebene Schiff.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Logbuch, Pause und Ende">
          Das Logbuch speichert jeden Befehl und jeden Tipp. Der Admiral kann das Spiel pausieren oder beenden. Am Ende sehen alle die ganze Karte und kehren
          zur Revanche in die Lobby zurück.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Tipps und Optionen',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Piratentipps
          </div>
          <Lista
            itens={[
              'Beginnt mit Befehlen für 2 oder 3 Wörter: sicherer, als alles verbinden zu wollen.',
              'Kapitän: Prüfe vor dem Befehl, dass er nicht zum Kraken oder zur offenen See führt.',
              'Matrosen: Sagt, warum ihr jedes Wort wählt. Das sicherste kommt zuerst.',
              'Im Zweifel Zug beenden: Ein sicherer Schatz ist mehr wert als ein versenktes Schiff.',
              'Achtet auf die Schätze der anderen Schiffe: Ihren letzten zu öffnen schenkt ihnen den Sieg.',
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Raumoptionen
          </div>
          <Lista
            itens={[
              <><B>Vorlagen:</B> Klassisch, Schnell, Chaotisch, Entspannt oder Eigene.</>,
              <><B>Spielfeld:</B> automatisch oder von 5×5 bis 10×10. Die Schätze passen sich an, lassen sich aber einstellen.</>,
              <><B>Das Startschiff</B> kann 1 Schatz mehr bekommen.</>,
              <><B>Kapitän:</B> ausgelost oder vom Schiff gewählt, mit Wechsel in jedem Spiel.</>,
              <><B>Zeit</B> für Kapitän und Matrosen, oder ohne Uhr.</>,
              <><B>Wörter:</B> Allgemein, Meer und Piraterie oder eine eigene Liste, in einer der 6 Sprachen.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Nur der Admiral ändert die Optionen, mit dem Bearbeiten-Knopf in der Lobby.</div>
        </Quadro>
      </div>
    ),
  },
]
