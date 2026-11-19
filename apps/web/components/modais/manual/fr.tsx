'use client'
import { SHIP_IDS } from '@arena/platform'
import { IMG } from '@/components/ui'
import { B, Linha, Lista, Ordem, P, Quadro, SUAVE, TITULO, type Secao } from './pecas'

/** Manuel en français. */
export const SECOES: Secao[] = [
  {
    nome: 'Le but',
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> est un jeu de mots en équipes. Chaque équipe est l&apos;équipage d&apos;un <B>navire</B> (de 2 à 4) et tout le monde regarde la
          même carte de mots. Derrière eux se cachent les <B>trésors</B> de chaque navire, la <B>Haute Mer</B> et le redoutable <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Capitaine">
              Un par navire. Voit la carte avec les couleurs et donne l&apos;ordre : un mot et un nombre.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Matelots">
              Le reste de l&apos;équipage. Ils ne voient pas les couleurs : ils discutent, choisissent les cartes et confirment ensemble.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Amiral">
              Celui qui a créé la salle. Règle, lance, met en pause et arrête la partie, expulse et peut passer le grade.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            Le premier navire qui trouve tous ses trésors gagne
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>ou le dernier encore à flot après les attaques du Kraken.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'Les cartes',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>Les Matelots ne voient que les mots. Seul le Capitaine sait ce qui se cache derrière chacun. Quand une carte est révélée, elle montre ce qu&apos;elle cachait :</P>
        <Linha img="cartas/rubi.webp" titulo="Trésor de votre navire">
          Gagné ! Il compte pour vous, et le tour continue tant que l&apos;ordre a des essais.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Trésor d'un autre navire">
          Le tour s&apos;arrête et le trésor compte pour ce navire. Si c&apos;était son dernier, <B>il gagne aussitôt</B> !
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Haute Mer">
          Rien ici. Le tour s&apos;arrête.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          Le navire qui l&apos;a révélé <B cor="#5B2A86">coule</B> et quitte la partie. S&apos;il ne reste qu&apos;un navire, il gagne.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Trésor d'un navire coulé">
          Il ne compte pour personne, et le tour s&apos;arrête.
        </Linha>
        <P tam={16}>
          Tous les navires ont le même nombre de trésors. La salle peut donner <B>1 trésor de plus</B> au navire qui commence, pour compenser l&apos;avantage
          de partir en premier.
        </P>
      </>
    ),
  },
  {
    nome: "L'ordre du Capitaine",
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRATE" n={3} />
          <P>
            Au tour du navire, le Capitaine regarde la carte et donne l&apos;<B>ordre</B> : un mot qui relie ses trésors et le nombre de cartes qu&apos;il relie.
            Ex. : PIRATE · 3 pour NAVIRE, PERROQUET et ÎLE.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              L&apos;ordre doit
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Être un seul mot (lettres et trait d’union acceptés).', 'Avoir un nombre de 1 jusqu’aux trésors qui manquent.', 'Être donné uniquement à l’écran : pas de gestes ni d’indices à voix haute !']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              Interdit
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'Un mot qui est sur le plateau.',
                <>Le pluriel ou le singulier de l’un d’eux (<B>TRÉSORS</B> avec TRÉSOR sur la table).</>,
                <>Contenir l’un d’eux ou être dedans (<B>POISSON-CHAT</B> avec CHAT).</>,
                <>Être trop proche de l’un d’eux (<B>MARINIER</B> avec MARINE).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Marques du Capitaine">
          Pendant qu&apos;il réfléchit, le Capitaine peut toucher ses propres trésors pour marquer ceux qu&apos;il veut relier. Seuls les Capitaines voient les marques.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Temps du Capitaine">
          La salle peut fixer un temps de réflexion. S&apos;il s&apos;écoule avant l&apos;ordre, le tour passe au navire suivant.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Le tour des Matelots',
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>Avec l&apos;ordre à l&apos;écran, l&apos;équipage discute et choisit les cartes. Seuls les Matelots du navire en jeu jouent :</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Choisissez les cartes">
          Touchez jusqu&apos;à N mots (N est le nombre de l&apos;ordre). La sélection est commune : chacun voit ce que les autres ont marqué. Quand la limite est 1,
          toucher une autre carte change le choix.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Tout le monde confirme">
          Les cartes ne sont révélées que quand <B>tous les Matelots présents</B> touchent Confirmer. Elles s&apos;ouvrent dans l&apos;ordre où elles ont été choisies.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. Il en manque ?">
          Si vous avez confirmé moins de cartes que le nombre et que c&apos;étaient toutes vos trésors, le tour continue pour choisir les autres.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. S'arrêter avant">
          Pour ne pas prendre de risque, tout le monde touche Finir le tour. Si le temps des Matelots s&apos;écoule, le tour passe tout seul.
        </Linha>
        <P tam={16}>Qui perd la connexion ne compte plus dans le vote, pour que personne n&apos;attende.</P>
      </>
    ),
  },
  {
    nome: 'Canon et victoire',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Coup de canon">
          Toutes les cartes de l&apos;ordre trouvées ? Vous gagnez <B>1 essai libre</B> sur n&apos;importe quelle carte. L&apos;horloge s&apos;arrête 5 secondes pendant
          l&apos;annonce. Après le tir, le tour s&apos;arrête, réussi ou non. (La salle peut désactiver le canon.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Coule le navire qui l&apos;a révélé. Il quitte la partie et le tour passe au navire suivant encore à flot.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="Comment gagner">
          Le premier navire dont tous les trésors sont révélés gagne, même si le dernier a été ouvert par un autre navire. Si tous les autres coulent, le
          navire restant gagne.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Journal, pause et fin">
          Le Journal de bord garde chaque ordre et chaque essai. L&apos;Amiral peut mettre en pause ou arrêter la partie. À la fin, tout le monde voit la carte
          complète et retourne au salon pour la revanche.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Astuces et réglages',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Astuces de pirate
          </div>
          <Lista
            itens={[
              'Commencez par des ordres de 2 ou 3 mots : c’est plus sûr que de tout relier.',
              'Capitaine : avant d’envoyer l’ordre, vérifiez qu’il ne mène pas au Kraken ni à la Haute Mer.',
              'Matelots : dites pourquoi vous choisissez chaque mot. Le plus sûr passe en premier.',
              'Dans le doute, Finir le tour : un trésor assuré vaut mieux qu’un navire coulé.',
              'Surveillez les trésors des autres navires : ouvrir leur dernier leur donne la victoire.',
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Réglages de la salle
          </div>
          <Lista
            itens={[
              <><B>Série :</B> partie simple, au meilleur des 3 ou des 5, avec un score par navire.</>,
              <><B>Plateau :</B> automatique ou de 5×5 à 10×10. Les trésors suivent la taille, mais on peut les ajuster.</>,
              <><B>Le premier navire</B> peut recevoir 1 trésor de plus.</>,
              <><B>Capitaine :</B> tiré au sort ou choisi par le navire, avec rotation à chaque partie.</>,
              <><B>Temps</B> du Capitaine et des Matelots, ou sans horloge.</>,
              <><B>Mots :</B> 17 catégories (Films, Jeux vidéo, Cuisine, Animaux…) mélangées à parts égales, ou votre propre liste, dans l’une des 6 langues.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Seul l’Amiral change les réglages, avec le bouton Modifier dans le salon. Valeurs par défaut remet les réglages de départ.</div>
        </Quadro>
      </div>
    ),
  },
]
