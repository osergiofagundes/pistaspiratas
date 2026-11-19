/** Tela cheia (Android e iPad; o iPhone não deixa) e, junto, a trava na posição deitada. */
export function podeTelaCheia() {
  return typeof document !== 'undefined' && !!document.fullscreenEnabled
}

export function emTelaCheia() {
  return typeof document !== 'undefined' && !!document.fullscreenElement
}

export async function alternarTelaCheia() {
  try {
    if (document.fullscreenElement) return await document.exitFullscreen()
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    try {
      // só funciona em tela cheia, e nem todo navegador tem
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')
    } catch {}
  } catch {}
}
