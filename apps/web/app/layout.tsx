import type { Metadata, Viewport } from 'next'
import { Lilita_One, Nunito } from 'next/font/google'
import './globals.css'

const lilita = Lilita_One({ weight: '400', subsets: ['latin'], variable: '--font-lilita', display: 'swap' })
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito', display: 'swap' })

export const metadata: Metadata = {
  title: 'Pistas Piratas · Arena de Jogos',
  description: 'Dê dicas, ache os tesouros e fuja do Kraken! Jogo de palavras em equipes, por link, sem conta.',
  icons: { icon: '/img/bandeiras/bandeira-rubi.webp', apple: '/img/app/icone-180.png' },
  // adicionado à tela inicial do iPhone/iPad: abre sem a barra do navegador
  appleWebApp: { capable: true, title: 'Pistas Piratas', statusBarStyle: 'black-translucent' },
}

// celular e tablet: sem zoom (o palco já escala sozinho; o zoom ao focar um campo bagunçava a tela),
// ocupando a tela toda (viewportFit) e com o teclado por cima do jogo, sem redimensionar a página
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-visual',
  themeColor: '#2B1A0F',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lilita.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  )
}
