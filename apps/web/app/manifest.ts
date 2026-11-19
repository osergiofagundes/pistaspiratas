import type { MetadataRoute } from 'next'

/** "Adicionar à tela inicial": abre deitado, em tela cheia, sem a barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pistas Piratas',
    short_name: 'Pistas Piratas',
    description: 'Dê dicas, ache os tesouros e fuja do Kraken! Jogo de palavras em equipes, por link, sem conta.',
    start_url: '/',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#0F151D',
    theme_color: '#2B1A0F',
    icons: [
      { src: '/img/app/icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/app/icone-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/img/app/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
