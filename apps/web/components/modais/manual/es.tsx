'use client'
import { SHIP_IDS } from '@arena/platform'
import { IMG } from '@/components/ui'
import { B, Linha, Lista, Ordem, P, Quadro, SUAVE, TITULO, type Secao } from './pecas'

/** Manual en español. */
export const SECOES: Secao[] = [
  {
    nome: 'El objetivo',
    icone: 'navios/navio-rubi.webp',
    conteudo: () => (
      <>
        <P>
          <B>Pistas Piratas</B> es un juego de palabras por equipos. Cada equipo es la tripulación de un <B>barco</B> (de 2 a 4) y todos miran el mismo mapa
          de palabras. Detrás de ellas se esconden los <B>tesoros</B> de cada barco, el <B>Mar Abierto</B> y el temido <B>Kraken</B>.
        </P>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 34, margin: '4px 0 18px' }}>
          {SHIP_IDS.map((id) => (
            <img key={id} src={`${IMG}/navios/navio-${id}.webp`} alt="" style={{ width: 120, height: 116, objectFit: 'contain' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
          <Quadro>
            <Linha img="itens/coroa.webp" iw={64} ih={56} titulo="Capitán">
              Uno por barco. Ve el mapa con los colores de las cartas y da la orden: una palabra y un número.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="personagens/papagaio-rubi.webp" iw={64} ih={64} titulo="Marineros">
              El resto de la tripulación. No ven los colores: hablan, eligen las cartas y confirman juntos.
            </Linha>
          </Quadro>
          <Quadro>
            <Linha img="itens/brasao-almirante.webp" iw={64} ih={60} titulo="Almirante">
              Quien creó la sala. Configura, inicia, pausa y termina la partida, expulsa y puede pasar el cargo.
            </Linha>
          </Quadro>
        </div>
        <Quadro style={{ textAlign: 'center', background: 'rgba(255,226,140,.45)' }}>
          <span className="lilita" style={{ fontSize: 24, color: TITULO }}>
            Gana el primer barco que encuentre todos sus tesoros
          </span>
          <div style={{ fontSize: 17, fontWeight: 700, color: SUAVE, marginTop: 4 }}>o el último que quede a flote tras los ataques del Kraken.</div>
        </Quadro>
      </>
    ),
  },
  {
    nome: 'Las cartas',
    icone: 'cartas/fechada.webp',
    conteudo: () => (
      <>
        <P>Los Marineros solo ven las palabras. Solo el Capitán sabe qué hay detrás de cada una. Cuando se revela una carta, muestra lo que escondía:</P>
        <Linha img="cartas/rubi.webp" titulo="Tesoro de tu barco">
          ¡Acierto! Cuenta para vosotros, y el turno sigue mientras la orden tenga intentos.
        </Linha>
        <Linha img="cartas/safira.webp" titulo="Tesoro de otro barco">
          El turno termina y el tesoro cuenta para ese barco. Si era el último, <B>¡gana en ese momento!</B>
        </Linha>
        <Linha img="cartas/mar.webp" titulo="Mar Abierto">
          Aquí no hay nada. El turno termina.
        </Linha>
        <Linha img="cartas/kraken.webp" titulo="Kraken" cor="#5B2A86">
          El barco que lo reveló <B cor="#5B2A86">se hunde</B> y sale de la partida. Si solo queda un barco, gana.
        </Linha>
        <Linha img="cartas/esmeralda.webp" cinza titulo="Tesoro de un barco hundido">
          No cuenta para nadie, y el turno termina.
        </Linha>
        <P tam={16}>
          Todos los barcos tienen el mismo número de tesoros. En la sala se puede elegir que el barco que empieza lleve <B>1 tesoro más</B>, para compensar
          la ventaja de salir primero.
        </P>
      </>
    ),
  },
  {
    nome: 'La orden del Capitán',
    icone: 'itens/coroa.webp',
    conteudo: () => (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginBottom: 16 }}>
          <Ordem palavra="PIRATA" n={3} />
          <P>
            En el turno del barco, el Capitán mira el mapa y da la <B>orden</B>: una palabra que una sus tesoros y cuántas cartas une. Ej.: PIRATA · 3 para
            BARCO, LORO e ISLA.
          </P>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: 16, marginBottom: 16 }}>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#2E7A2A', marginBottom: 8 }}>
              La orden debe
            </div>
            <Lista
              marca="✔"
              cor="#2E7A2A"
              itens={['Ser una sola palabra (valen letras y guion).', 'Tener un número de 1 hasta los tesoros que faltan.', 'Darse solo por la pantalla: ¡nada de gestos ni pistas habladas!']}
            />
          </Quadro>
          <Quadro>
            <div className="lilita" style={{ fontSize: 22, color: '#9B2C2C', marginBottom: 8 }}>
              No vale
            </div>
            <Lista
              marca="✕"
              cor="#9B2C2C"
              itens={[
                'Una palabra que está en el tablero.',
                <>El plural o singular de una de ellas (<B>TESOROS</B> con TESORO en la mesa).</>,
                <>Contener una de ellas o estar dentro de ella (<B>PEZ-ESPADA</B> con ESPADA).</>,
                <>Ser muy parecida a una de ellas (<B>CAVERNOSO</B> con CAVERNA).</>,
              ]}
            />
          </Quadro>
        </div>
        <Linha img="interface/icones/mapa.webp" iw={64} ih={64} titulo="Marcas del Capitán">
          Mientras piensa, el Capitán puede tocar sus propios tesoros para marcar los que quiere unir. Solo los Capitanes ven las marcas.
        </Linha>
        <Linha img="interface/icones/ampulheta.webp" iw={64} ih={64} titulo="Tiempo del Capitán">
          La sala puede poner un tiempo para pensar. Si se acaba antes de la orden, el turno pasa al siguiente barco.
        </Linha>
      </>
    ),
  },
  {
    nome: 'El turno de los Marineros',
    icone: 'interface/icones/olho.webp',
    conteudo: () => (
      <>
        <P>Con la orden en pantalla, la tripulación habla y elige las cartas. Solo juegan los Marineros del barco en turno:</P>
        <Linha img="interface/icones/olho.webp" iw={64} ih={64} titulo="1. Seleccionad las cartas">
          Tocad hasta N palabras (N es el número de la orden). La selección es de todos: cada uno ve lo que marcaron los demás. Cuando el límite es 1, tocar
          otra carta cambia la elección.
        </Linha>
        <Linha img="interface/icones/play.webp" iw={64} ih={64} titulo="2. Todos confirman">
          Las cartas solo se revelan cuando <B>todos los Marineros presentes</B> tocan Confirmar. Se abren en el orden en que se eligieron.
        </Linha>
        <Linha img="interface/icones/mais.webp" iw={64} ih={64} titulo="3. ¿Falta alguna?">
          Si confirmasteis menos cartas que el número y todas eran tesoros vuestros, el turno sigue para elegir las demás.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={64} ih={64} titulo="4. Parar antes">
          Para no arriesgar, todos tocan Terminar turno. Si se acaba el tiempo de los Marineros, el turno pasa solo.
        </Linha>
        <P tam={16}>Quien pierde la conexión deja de contar en la votación, para que nadie se quede esperando.</P>
      </>
    ),
  },
  {
    nome: 'Cañón y victoria',
    icone: 'interface/icones/canhao.webp',
    conteudo: () => (
      <>
        <Linha img="interface/icones/canhao.webp" iw={80} ih={80} titulo="Cañonazo">
          ¿Acertasteis todas las cartas de la orden? Ganáis <B>1 intento libre</B> en cualquier carta. El reloj se para 5 segundos mientras aparece el aviso.
          Después del disparo el turno termina, se acierte o no. (La sala puede desactivar el cañón.)
        </Linha>
        <Linha img="cartas/kraken.webp" iw={110} ih={72} titulo="Kraken" cor="#5B2A86">
          Hunde el barco que lo reveló. Sale de la partida y el turno pasa al siguiente barco que sigue navegando.
        </Linha>
        <Linha img="itens/coroa.webp" iw={80} ih={70} titulo="Cómo ganar">
          Gana el primer barco que tenga todos sus tesoros revelados, aunque el último lo haya abierto otro barco. Si todos los demás se hunden, gana el
          barco que queda.
        </Linha>
        <Linha img="interface/icones/pausa.webp" iw={80} ih={80} titulo="Diario, pausa y final">
          El Diario guarda cada orden y cada intento. El Almirante puede pausar o terminar la partida. Al final, todos ven el mapa completo y vuelven al
          salón para la revancha.
        </Linha>
      </>
    ),
  },
  {
    nome: 'Consejos y ajustes',
    icone: 'interface/icones/mapa.webp',
    conteudo: () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Consejos piratas
          </div>
          <Lista
            itens={[
              'Empieza con órdenes de 2 o 3 palabras: son más seguras que intentar unirlo todo.',
              'Capitán: antes de dar la orden, comprueba que no lleve al Kraken ni al Mar Abierto.',
              'Marineros: decid por qué elegís cada palabra. La más segura va primero.',
              'Si dudáis, Terminar turno: un tesoro seguro vale más que hundir el barco.',
              'Vigilad los tesoros de los otros barcos: abrir su último les da la victoria.',
            ]}
          />
        </Quadro>
        <Quadro>
          <div className="lilita" style={{ fontSize: 24, color: TITULO, marginBottom: 10 }}>
            Ajustes de la sala
          </div>
          <Lista
            itens={[
              <><B>Serie:</B> partida suelta, al mejor de 3 o al mejor de 5, con marcador por barco.</>,
              <><B>Tablero:</B> automático o de 5×5 a 10×10. Los tesoros siguen el tamaño, pero se pueden ajustar.</>,
              <><B>Quien empieza</B> puede llevar 1 tesoro más.</>,
              <><B>Capitán:</B> sorteado o elegido por el barco, con rotación en cada partida.</>,
              <><B>Tiempo</B> del Capitán y de los Marineros, o sin reloj.</>,
              <><B>Palabras:</B> 17 categorías (Películas, Videojuegos, Comidas, Animales…) mezcladas en partes iguales, o una lista tuya, en cualquiera de los 6 idiomas.</>,
            ]}
          />
          <div style={{ fontSize: 15, fontWeight: 700, color: SUAVE, marginTop: 6 }}>Solo el Almirante cambia los ajustes, con el botón Editar en el salón. Restablecer vuelve a los valores iniciales.</div>
        </Quadro>
      </div>
    ),
  },
]
