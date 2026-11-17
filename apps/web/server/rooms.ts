import { MemoryStore, RoomService } from '@arena/platform'
import { codenomes } from '@arena/codenomes'

type Service = RoomService<any, any, any, any, any>

/**
 * Serviço das salas, um por processo. Fica no globalThis para sobreviver ao
 * recarregamento de módulos do `next dev`. Localmente as salas ficam na memória;
 * na Vercel a mesma interface RoomStore é implementada sobre o Redis.
 */
const g = globalThis as unknown as { __arenaRooms?: Service; __arenaTicker?: ReturnType<typeof setInterval> }

export function rooms(): Service {
  if (!g.__arenaRooms) {
    g.__arenaRooms = new RoomService(new MemoryStore(), codenomes)
  }
  if (!g.__arenaTicker) {
    g.__arenaTicker = setInterval(() => {
      g.__arenaRooms?.tick().catch((e) => console.error('[salas] tick', e))
    }, 250)
  }
  return g.__arenaRooms
}
